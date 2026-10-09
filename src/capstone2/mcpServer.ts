// サポート用の MCP サーバー(読み取り専用の2つのツール)。20-1 で作る。
// このファイルは学習用の掲載コードで、ビルド時に型チェックされる(アプリには組み込まれない)。
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

// ---- アプリ側が用意するデータの入り口(実装はアプリごとに異なる) ----
export type Order = { orderId: string; status: string; item: string; eta?: string };
export interface Db {
  /** ログイン中の利用者の注文だけを探す */
  findOrder(userId: string, orderId: string): Promise<Order | null>;
}
export interface FaqIndex {
  search(query: string, topK: number): Promise<{ title: string; body: string }[]>;
}

const MAX_RESULT_CHARS = 2000;
const OrderId = z.string().regex(/^A-\d{4}$/, "注文番号は A-1234 の形式で指定してください");

/**
 * 1人の利用者のためのサーバーを作る。
 * userId は、接続の認証(ログイン情報)から決める。ツールの引数には含めない(モデルに決めさせない)。
 */
export function createSupportMcpServer(deps: { userId: string; db: Db; faq: FaqIndex }) {
  const server = new McpServer({ name: "support", version: "1.0.0" });

  server.registerTool(
    "search_faq",
    {
      title: "FAQ を検索する",
      description:
        "よくある質問(返品、配送日数、支払い、領収書など)を検索する。" +
        "店舗の方針や手続きについて答える前に使い、検索結果に書かれていることだけを答える。" +
        "注文の状況を調べるときは、このツールではなく get_order_status を使う。",
      inputSchema: z.object({ query: z.string().min(1).describe("調べたい内容を短く(例: 返品の条件)") }),
      annotations: { readOnlyHint: true }, // 読み取りだけで、何も変更しない
    },
    async ({ query }) => {
      const hits = await deps.faq.search(query, 3);
      if (hits.length === 0) {
        // 失敗ではなく「見つからなかった」。次にどうするかを、結果の中で伝える
        return { content: [{ type: "text", text: "該当する FAQ はありませんでした。推測で答えず、分からないと伝えてください。" }] };
      }
      return { content: [{ type: "text", text: hits.map((h) => `【${h.title}】${h.body}`).join("\n").slice(0, MAX_RESULT_CHARS) }] };
    },
  );

  server.registerTool(
    "get_order_status",
    {
      title: "注文の状況を調べる",
      description:
        "注文番号から、ログイン中の利用者の注文の状況(発送状況、お届け予定日)を調べる。" +
        "利用者が注文の状況や届く日を尋ねたときに使う。他の人の注文は調べられない。",
      inputSchema: z.object({ order_id: OrderId.describe("注文番号。A-1234 の形式") }),
      annotations: { readOnlyHint: true },
    },
    async ({ order_id }) => {
      const order = await deps.db.findOrder(deps.userId, order_id); // 利用者 ID は、接続から決めたものだけを使う
      if (!order) {
        // ツールの失敗は、例外ではなく isError の結果として返す。直し方を含める
        return {
          isError: true,
          content: [{ type: "text", text: `注文 ${order_id} は見つかりませんでした。番号を利用者に確認してください。` }],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(order) }] };
    },
  );

  return server;
}
