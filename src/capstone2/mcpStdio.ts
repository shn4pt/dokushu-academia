// MCP サーバーを、標準入出力(stdio)で動かす入口。Claude Code などの MCP クライアントが、子プロセスとして起動する。
// このファイルは学習用の掲載コードで、ビルド時に型チェックされる(アプリには組み込まれない)。
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createSupportMcpServer } from "./mcpServer";

// 注意: stdio のサーバーでは、標準出力(console.log)に何も書かない。
// JSON-RPC のメッセージが壊れる。ログは、標準エラー(console.error)に出す。
const server = createSupportMcpServer({
  userId: process.env.SUPPORT_USER_ID ?? "demo-user", // 実際のアプリでは、ログイン情報から決める
  db: { findOrder: async () => null }, // 実際のデータベースに置き換える
  faq: { search: async () => [] }, // 実際の検索に置き換える
});

await server.connect(new StdioServerTransport());
console.error("support MCP server running on stdio");
