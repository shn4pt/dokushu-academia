export type LessonMeta = { id: string; title: string; summary: string }
export type Stage = {
  id: string
  title: string
  goal: string
  lessons: LessonMeta[]
}

export const stages: Stage[] = [
  {
    id: 's0',
    title: '前提知識',
    goal: '以降の説明に必要な数学の最低限を、コードと結びつけて押さえる。',
    lessons: [
      { id: '0-1', title: 'ベクトルと行列積', summary: '配列として見たベクトル・行列と、内積・行列積の意味。' },
      { id: '0-2', title: '確率と確率分布', summary: '条件付き確率、確率分布、期待値。' },
      { id: '0-3', title: '微分と勾配', summary: '偏微分と勾配が「どちらに動かすと値が減るか」を示すこと。' },
    ],
  },
  {
    id: 's1',
    title: '機械学習の基本',
    goal: '「データからパラメータを調整する」という学習の枠組みを理解する。',
    lessons: [
      { id: '1-1', title: '損失関数', summary: '予測のズレを1つの数値で表す。' },
      { id: '1-2', title: '勾配降下法', summary: '損失を減らす方向へパラメータを少しずつ動かす。' },
      { id: '1-3', title: '汎化と過学習', summary: '訓練データに合わせすぎるとなぜ困るのか。' },
    ],
  },
  {
    id: 's2',
    title: 'ニューラルネットワーク',
    goal: '層を重ねたモデルがどう計算され、どう学習されるかを理解する。',
    lessons: [
      { id: '2-1', title: 'ニューロンと層', summary: '重み付き和と活性化関数の積み重ね。' },
      { id: '2-2', title: '活性化関数', summary: '非線形性がなぜ必要か。ReLU、GELU、softmax。' },
      { id: '2-3', title: '誤差逆伝播', summary: '連鎖律で全パラメータの勾配を効率よく求める。' },
    ],
  },
  {
    id: 's3',
    title: '言語のデジタル化',
    goal: '文字列がどのように数値のベクトルへ変換されてモデルに入るかを理解する。',
    lessons: [
      { id: '3-1', title: 'トークン化とBPE', summary: 'テキストをサブワード単位の整数ID列に変換する。' },
      { id: '3-2', title: '埋め込み', summary: 'トークンIDを意味を持つベクトルへ写す。' },
      { id: '3-3', title: '言語モデルとは', summary: '次のトークンの確率分布を予測するモデル。' },
    ],
  },
  {
    id: 's4',
    title: 'Transformer',
    goal: 'LLMの中核であるTransformerの構造と、attentionの計算を理解する。',
    lessons: [
      { id: '4-1', title: 'なぜattentionか', summary: 'RNNの限界と、文脈の任意の位置を参照する発想。' },
      { id: '4-2', title: 'Self-Attention', summary: 'Query・Key・Valueによる重み付き和の計算。' },
      { id: '4-3', title: '位置エンコーディング', summary: '語順の情報をどう与えるか。' },
      { id: '4-4', title: 'Transformerブロック', summary: 'Multi-Head、残差接続、正規化、FFNの組み合わせ。' },
    ],
  },
  {
    id: 's5',
    title: '事前学習',
    goal: '大量のテキストから言語モデルを作る学習の流れを理解する。',
    lessons: [
      { id: '5-1', title: '次トークン予測と交差エントロピー', summary: '事前学習の目的関数。' },
      { id: '5-2', title: '学習データと前処理', summary: '収集、重複除去、品質フィルタリング。' },
      { id: '5-3', title: 'スケーリング則', summary: 'モデルサイズ・データ量・計算量と性能の関係。' },
    ],
  },
  {
    id: 's6',
    title: '推論と生成',
    goal: '学習済みモデルが文章を生成する仕組みと、その高速化を理解する。',
    lessons: [
      { id: '6-1', title: 'サンプリング', summary: 'greedy、temperature、top-k、top-p。' },
      { id: '6-2', title: 'KVキャッシュ', summary: '過去の計算結果を再利用して生成を速くする。' },
      { id: '6-3', title: 'コンテキストウィンドウ', summary: '入力長の制約とそのコスト。' },
    ],
  },
  {
    id: 's7',
    title: '事後学習',
    goal: '素の言語モデルを、指示に従うアシスタントへ調整する方法を理解する。',
    lessons: [
      { id: '7-1', title: '教師ありファインチューニング', summary: '指示と望ましい応答のペアで学習する。' },
      { id: '7-2', title: '人間のフィードバックによる強化学習', summary: '報酬モデルとRLHF、DPOの考え方。' },
      { id: '7-3', title: 'アライメントと安全性', summary: '有用性・無害性をどう両立するか。' },
    ],
  },
  {
    id: 's8',
    title: '応用と限界',
    goal: 'LLMを使うシステムの設計と、モデルの限界を理解する。',
    lessons: [
      { id: '8-1', title: 'RAG', summary: '外部知識を検索してプロンプトに差し込む。' },
      { id: '8-2', title: 'ツール利用とエージェント', summary: '関数呼び出しと、ループで動くエージェント。' },
      { id: '8-3', title: '幻覚と評価', summary: 'もっともらしい誤りが起きる理由と、性能の測り方。' },
    ],
  },
  {
    id: 's9',
    title: 'LLM API を使う',
    goal: 'Claude API を自分のプログラムから呼び出し、応答を安全に扱えるようになる。',
    lessons: [
      { id: '9-1', title: 'メッセージ API の基本', summary: 'リクエストと応答の構造、会話の履歴、トークンと料金、APIキーの扱い。' },
      { id: '9-2', title: '応答の扱い', summary: 'stop_reason、ストリーミング、エラーと再試行、断られたときの備え。' },
      { id: '9-3', title: 'プロンプト設計', summary: '目的・入力・出力の形を明確にした指示と、例示の使い方。' },
      { id: '9-4', title: '構造化出力', summary: 'JSON Schema で応答の形式を制約し、プログラムで安全に扱う。' },
    ],
  },
]

export const allLessons = stages.flatMap((s) =>
  s.lessons.map((l) => ({ ...l, stageId: s.id })),
)

export const findLesson = (id: string) => allLessons.find((l) => l.id === id)
export const findStage = (id: string) => stages.find((s) => s.id === id)
