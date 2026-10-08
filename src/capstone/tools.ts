// サポートエージェントのツール(サーバー側で動かす)。
// このファイルは学習用の掲載コードで、ビルド時に型チェックされる(アプリには組み込まれない)。
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// ---- アプリ側が用意するデータの入り口(実装はアプリごとに異なる) ----
export type Order = { orderId: string; status: string; item: string; eta?: string };
export interface Db {
  /** ログイン中の利用者の注文だけを探す */
  findOrder(userId: string, orderId: string): Promise<Order | null>;
  /** 同じ idempotencyKey で二重に作られないようにする */
  createTicket(t: { userId: string; summary: string; priority: string; orderId?: string; idempotencyKey: string }): Promise<{ id: string }>;
}
export interface FaqIndex {
  search(query: string, topK: number): Promise<{ title: string; body: string }[]>;
}
/** 1人の利用者の1つの会話に対応する情報。利用者 ID はログイン情報から取り、モデルには決めさせない */
export type Session = { userId: string; db: Db; faq: FaqIndex };

// ---- 引数の検証(モデルの出力は信用しない入力として扱う) ----
const OrderId = z.string().regex(/^A-\d{4}$/, "注文番号は A-1234 の形式で指定してください");
const schemas = {
  get_order_status: z.object({ order_id: OrderId }),
  search_faq: z.object({ query: z.string().min(1, "query が空です") }),
  create_support_ticket: z.object({
    summary: z.string().min(1, "summary が空です"),
    priority: z.enum(["high", "normal", "low"]),
    order_id: OrderId.optional(),
  }),
};
export type ToolName = keyof typeof schemas;

// ---- モデルに渡すツール定義 ----
export const toolDefinitions: Anthropic.Beta.BetaTool[] = [
  {
    name: "get_order_status",
    description:
      "注文番号から、ログイン中の利用者の注文の状況(発送状況、お届け予定日)を調べる。" +
      "利用者が注文の状況や届く日を尋ねたときに使う。",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string", description: "注文番号。A-1234 の形式" } },
      required: ["order_id"],
    },
  },
  {
    name: "search_faq",
    description:
      "よくある質問(返品、配送日数、支払い、領収書など)を検索する。" +
      "店舗の方針や手続きについて答える前に必ず使い、検索結果に書かれていることだけを答える。",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "調べたい内容を短く(例: 返品の条件)" } },
      required: ["query"],
    },
  },
  {
    name: "create_support_ticket",
    description:
      "サポート担当者への問い合わせチケットを作成する。FAQ や注文情報で解決できず、" +
      "人の対応が必要なときだけ使う。実行前に利用者の承認が必要。",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "担当者向けの要約(1〜2文)" },
        priority: { type: "string", enum: ["high", "normal", "low"], description: "緊急度" },
        order_id: { type: "string", description: "関連する注文番号(あれば)" },
      },
      required: ["summary", "priority"],
    },
  },
];

/** 実行前に利用者の承認が必要なツール(外部に影響し、取り消しにくい操作) */
export const needsApproval = (name: string) => name === "create_support_ticket";

export type ToolOutcome = { content: string; isError?: boolean };
const MAX_RESULT_CHARS = 2000;

/** ツールを実行する。失敗は例外ではなく、直し方を含むエラーの結果として返す */
export async function executeTool(session: Session, toolUse: Anthropic.Beta.BetaToolUseBlock): Promise<ToolOutcome> {
  if (!(toolUse.name in schemas)) return { content: `ツール ${toolUse.name} はありません。`, isError: true };
  const name = toolUse.name as ToolName;
  const parsed = schemas[name].safeParse(toolUse.input);
  if (!parsed.success) {
    return { content: `引数が正しくありません: ${parsed.error.issues.map((i) => i.message).join(" / ")}`, isError: true };
  }

  switch (name) {
    case "get_order_status": {
      const { order_id } = schemas.get_order_status.parse(parsed.data);
      const order = await session.db.findOrder(session.userId, order_id);
      if (!order) return { content: `注文 ${order_id} は見つかりませんでした。番号を利用者に確認してください。`, isError: true };
      return { content: JSON.stringify(order) };
    }
    case "search_faq": {
      const { query } = schemas.search_faq.parse(parsed.data);
      const hits = await session.faq.search(query, 3);
      if (hits.length === 0) return { content: "該当する FAQ はありませんでした。推測で答えず、分からないと伝えてください。" };
      return { content: hits.map((h) => `【${h.title}】${h.body}`).join("\n").slice(0, MAX_RESULT_CHARS) };
    }
    case "create_support_ticket": {
      const t = schemas.create_support_ticket.parse(parsed.data);
      const ticket = await session.db.createTicket({
        userId: session.userId,
        summary: t.summary,
        priority: t.priority,
        orderId: t.order_id,
        idempotencyKey: toolUse.id, // 再試行で同じ呼び出しが二度届いても、チケットは1つ
      });
      return { content: JSON.stringify({ ticket_id: ticket.id, status: "created" }) };
    }
  }
}
