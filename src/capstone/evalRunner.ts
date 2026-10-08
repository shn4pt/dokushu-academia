// サポートエージェントの評価を実行する(テスト用のデータで動かす)。
// このファイルは学習用の掲載コードで、ビルド時に型チェックされる(アプリには組み込まれない)。
import { newState, resumeAfterApproval, runAgentTurn, type AgentState } from "./agent";
import type { Session } from "./tools";

export type EvalCase = {
  id: string;
  tags: string[];
  input: string;
  /** 呼ばれるべきツール */
  expectTools: string[];
  /** 呼ばれてはいけないツール */
  forbidTools: string[];
  /** 承認を求められたときの、利用者役の判断 */
  approve: boolean;
};

export type CaseResult = {
  id: string;
  pass: boolean;
  reasons: string[];
  toolsCalled: string[];
  status: string;
  usage: AgentState["usage"];
};

const calledTools = (state: AgentState) =>
  state.messages.flatMap((m) =>
    m.role === "assistant" && Array.isArray(m.content)
      ? m.content.flatMap((b) => (b.type === "tool_use" ? [b.name] : []))
      : [],
  );

/** 1件を実行し、プログラムで判定できる項目を採点する(回答の中身の採点は、別に LLM や人が行う) */
export async function runCase(makeSession: () => Session, c: EvalCase): Promise<CaseResult> {
  const session = makeSession(); // ケースごとに新しいテスト用データで始める(前のケースの影響を受けない)
  let result = await runAgentTurn(session, newState(), c.input);
  while (result.status === "needs_approval") {
    result = await resumeAfterApproval(session, result.state, c.approve);
  }
  const tools = calledTools(result.state);
  const reasons: string[] = [];
  if (result.status !== "done") reasons.push(`完了しなかった: ${result.reason}`);
  for (const t of c.expectTools) if (!tools.includes(t)) reasons.push(`${t} が呼ばれなかった`);
  for (const t of c.forbidTools) if (tools.includes(t)) reasons.push(`${t} を呼んではいけないのに呼んだ`);
  return { id: c.id, pass: reasons.length === 0, reasons, toolsCalled: tools, status: result.status, usage: result.state.usage };
}

/** 全件を reps 回ずつ実行し、合格率と、ばらつきの目安を出す */
export async function runEval(makeSession: () => Session, cases: EvalCase[], reps = 2) {
  const results: CaseResult[] = [];
  for (let r = 0; r < reps; r++) {
    for (const c of cases) results.push(await runCase(makeSession, c));
  }
  const passRate = results.filter((r) => r.pass).length / results.length;
  const noise = 1 / Math.sqrt(results.length); // 合格率の誤差のおおまかな目安(25件×2回で約±14ポイント)
  return { passRate, noise, results };
}
