export type Term = { term: string; reading?: string; description: string; lessonId?: string }

export const glossary: Term[] = [
  { term: 'トークン', description: 'モデルが扱うテキストの最小単位。単語の一部であることが多い。', lessonId: '3-1' },
  { term: 'トークナイザ', description: 'テキストをトークンのID列へ相互変換する部品。', lessonId: '3-1' },
  { term: 'BPE', reading: 'Byte Pair Encoding', description: '頻出する隣接ペアを繰り返し結合してサブワード語彙を作る手法。', lessonId: '3-1' },
  { term: '埋め込み', reading: 'embedding', description: 'トークンIDを意味を持つ実数ベクトルへ写す表。', lessonId: '3-2' },
  { term: 'Self-Attention', description: '系列内の各トークンが他のトークンを重み付きで参照する計算。', lessonId: '4-2' },
  { term: 'Query / Key / Value', description: 'attentionで用いる3種類のベクトル。探す内容・見出し・中身に相当する。', lessonId: '4-2' },
  { term: 'softmax', description: '任意の実数列を合計1の確率分布に変換する関数。', lessonId: '4-2' },
  { term: '因果マスク', reading: 'causal mask', description: '未来のトークンを参照できないようにするマスク。', lessonId: '4-2' },
  { term: 'コサイン類似度', description: '2つのベクトルの向きの近さを -1〜1 で表す尺度。', lessonId: '3-2' },
  { term: '言語モデル', description: '文脈を受け取り、次のトークンの確率分布を返すモデル。', lessonId: '3-3' },
  { term: 'RNN', reading: 'Recurrent Neural Network', description: 'トークンを1つずつ順に処理し、隠れ状態で過去を引き継ぐモデル。', lessonId: '4-1' },
  { term: '位置エンコーディング', description: '語順の情報をベクトルとして入力に加える仕組み。', lessonId: '4-3' },
  { term: 'Multi-Head Attention', description: 'attentionを複数のヘッドで並列に行い、結果を連結する構造。', lessonId: '4-4' },
  { term: 'FFN', reading: 'Feed-Forward Network', description: 'トークンごとに独立して適用される2層のMLP。', lessonId: '4-4' },
  { term: '残差接続', reading: 'residual connection', description: '層の出力に入力を足し、深い層でも学習を安定させる接続。', lessonId: '4-4' },
  { term: 'LayerNorm', description: 'ベクトルの平均と分散を揃えて値のスケールを安定させる正規化。', lessonId: '4-4' },
]
