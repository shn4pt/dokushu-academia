// プロンプトキャッシュを含む、1回の呼び出しの費用を計算する。20-3 で使う。
// 単価は、公式の料金表(2026-10-09 に確認)。最新の単価は、公式の料金表で確かめること。

/** 100万トークンあたりの単価(ドル) */
export type Price = { input: number; output: number; cacheReadMultiplier: number };

export const PRICES: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheReadMultiplier: 0.05 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheReadMultiplier: 0.05 },
  // Haiku 5.5 は、プロンプトが10万トークンを超えると高くなる(下の priceFor を参照)
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheReadMultiplier: 0.1 },
};
const HAIKU_LONG: Price = { input: 0.5, output: 2.5, cacheReadMultiplier: 0.1 };

/** キャッシュへの書き込みは、通常の入力の何倍か(5分: 1.25倍、1時間: 2倍) */
export const WRITE_MULTIPLIER = { "5m": 1.25, "1h": 2 } as const;

/** API の応答の usage のうち、費用の計算に使う項目 */
export type Usage = {
  input_tokens: number; // キャッシュを使わなかった入力(最後のキャッシュの区切りより後ろ)
  output_tokens: number;
  cache_creation_input_tokens?: number | null; // キャッシュに書き込んだトークン
  cache_read_input_tokens?: number | null; // キャッシュから読んだトークン
};

/** プロンプトの全体の長さ(キャッシュの読み書きも含む入力の合計) */
export const promptTokens = (u: Usage) => u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);

function priceFor(model: string, u: Usage): Price {
  const p = PRICES[model];
  if (!p) throw new Error(`単価を知らないモデルです: ${model}`);
  if (model === "claude-haiku-5-5" && promptTokens(u) > 100_000) return HAIKU_LONG;
  return p;
}

/** 1回の呼び出しの費用(ドル) */
export function callCost(model: string, u: Usage, ttl: "5m" | "1h" = "5m"): number {
  const p = priceFor(model, u);
  const perToken = (price: number) => price / 1_000_000;
  return (
    u.input_tokens * perToken(p.input) +
    (u.cache_creation_input_tokens ?? 0) * perToken(p.input * WRITE_MULTIPLIER[ttl]) +
    (u.cache_read_input_tokens ?? 0) * perToken(p.input * p.cacheReadMultiplier) +
    u.output_tokens * perToken(p.output)
  );
}

/** 同じ呼び出しを、キャッシュなしで行ったときの費用(比較用) */
export function costWithoutCache(model: string, u: Usage): number {
  return callCost(model, { input_tokens: promptTokens(u), output_tokens: u.output_tokens });
}

/** 入力のうち、キャッシュから読めた割合(0〜1) */
export function cacheHitRate(usages: Usage[]): number {
  const read = usages.reduce((s, u) => s + (u.cache_read_input_tokens ?? 0), 0);
  const total = usages.reduce((s, u) => s + promptTokens(u), 0);
  return total === 0 ? 0 : read / total;
}

/**
 * 同じ先頭部分(prefixTokens)を、n 回の呼び出しで使うとき、キャッシュで得になるかを調べる。
 * 最初の1回は書き込み、あとの n-1 回は、キャッシュ内に残っていれば、読み取り(hits 回までが、読み取り)。
 */
export function cachingSavings(model: string, prefixTokens: number, n: number, ttl: "5m" | "1h" = "5m", hits = n - 1) {
  const p = PRICES[model];
  if (!p) throw new Error(`単価を知らないモデルです: ${model}`);
  const unit = p.input / 1_000_000;
  const without = prefixTokens * unit * n;
  const reads = Math.max(0, Math.min(hits, n - 1));
  const misses = n - 1 - reads; // 期限切れなどで、読めずに、書き込みをやり直す回数
  const withCache = prefixTokens * unit * (WRITE_MULTIPLIER[ttl] * (1 + misses) + p.cacheReadMultiplier * reads);
  return { without, withCache, saved: without - withCache };
}

/** 書き込みの上乗せ分を、読み取りでの節約が上回るのに、必要な読み取りの回数(最小の整数) */
export function breakEvenReads(model: string, ttl: "5m" | "1h" = "5m"): number {
  const p = PRICES[model];
  if (!p) throw new Error(`単価を知らないモデルです: ${model}`);
  const extraWrite = WRITE_MULTIPLIER[ttl] - 1; // 書き込みの上乗せ(通常の入力に対する倍率)
  const savedPerRead = 1 - p.cacheReadMultiplier; // 読み取り1回で節約できる割合
  return Math.ceil(extraWrite / savedPerRead);
}
