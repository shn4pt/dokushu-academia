// サポートエージェント本体(サーバー側で動かす)。
// このファイルは学習用の掲載コードで、ビルド時に型チェックされる(アプリには組み込まれない)。
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./agentPrompt";
import { executeTool, needsApproval, toolDefinitions, type Session } from "./tools";

const client = new Anthropic(); // APIキーはサーバーの環境変数 ANTHROPIC_API_KEY から読む

const MODEL = "claude-opus-5-5";
const MAX_STEPS = 8; // 1回の依頼で API を呼ぶ回数の上限
const TOKEN_BUDGET = 200_000; // 1回の依頼で使う入力+出力トークンの上限(アプリ側の安全装置)


export type AgentState = {
  messages: Anthropic.Beta.BetaMessageParam[];
  steps: number;
  usage: { input: number; output: number; cacheRead: number };
  /** 承認待ちのツール呼び出し(このターンのすべての tool_use) */
  pending?: Anthropic.Beta.BetaToolUseBlock[];
};

export type AgentResult =
  | { status: "done"; text: string; state: AgentState }
  | { status: "needs_approval"; toolUse: Anthropic.Beta.BetaToolUseBlock; state: AgentState }
  | { status: "stopped"; reason: string; state: AgentState };

export const newState = (): AgentState => ({ messages: [], steps: 0, usage: { input: 0, output: 0, cacheRead: 0 } });

/** 利用者の発言を受け取り、エージェントを進める */
export async function runAgentTurn(session: Session, state: AgentState, userText: string): Promise<AgentResult> {
  state.messages.push({ role: "user", content: userText });
  return loop(session, state);
}

/** 承認待ちの操作に対する、利用者の判断を受け取って再開する */
export async function resumeAfterApproval(session: Session, state: AgentState, approved: boolean): Promise<AgentResult> {
  const toolUses = state.pending ?? [];
  state.pending = undefined;
  state.messages.push({ role: "user", content: await runTools(session, toolUses, approved) });
  return loop(session, state);
}

async function loop(session: Session, state: AgentState): Promise<AgentResult> {
  while (true) {
    if (state.steps >= MAX_STEPS) return { status: "stopped", reason: "max_steps", state };
    if (state.usage.input + state.usage.output >= TOKEN_BUDGET) return { status: "stopped", reason: "budget", state };
    state.steps++;

    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // 変わらない system とツール定義をキャッシュし、毎回の入力の料金と待ち時間を減らす
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: toolDefinitions,
      messages: state.messages,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 安全上の拒否が起きたら、推奨モデルで続行する
    });
    state.usage.input += response.usage.input_tokens;
    state.usage.output += response.usage.output_tokens;
    state.usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    console.log(JSON.stringify({ step: state.steps, model: response.model, stop_reason: response.stop_reason, usage: response.usage }));

    if (response.stop_reason === "refusal") return { status: "stopped", reason: "refusal", state };
    if (response.stop_reason === "max_tokens") return { status: "stopped", reason: "max_tokens", state };

    // 応答は丸ごと履歴に加える(思考やツール呼び出しのブロックも次の呼び出しで必要)
    state.messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return { status: "done", text, state };
    }

    // 承認が必要な操作があれば、ここで止めて利用者に確認する(実行はまだしない)
    const gated = toolUses.find((t) => needsApproval(t.name));
    if (gated) {
      state.pending = toolUses;
      return { status: "needs_approval", toolUse: gated, state };
    }
    state.messages.push({ role: "user", content: await runTools(session, toolUses, false) });
  }
}

/** 1回の応答に含まれるすべての tool_use を実行し、結果を1つのメッセージ分にまとめる */
async function runTools(
  session: Session,
  toolUses: Anthropic.Beta.BetaToolUseBlock[],
  approved: boolean,
): Promise<Anthropic.Beta.BetaToolResultBlockParam[]> {
  return Promise.all(
    toolUses.map(async (toolUse): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
      const outcome =
        needsApproval(toolUse.name) && !approved
          ? { content: "利用者がこの操作を許可しませんでした。別の方法を提案してください。", isError: true }
          : await executeTool(session, toolUse);
      return { type: "tool_result", tool_use_id: toolUse.id, content: outcome.content, ...(outcome.isError ? { is_error: true } : {}) };
    }),
  );
}
