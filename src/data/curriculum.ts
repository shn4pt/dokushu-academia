export type LessonMeta = {
  id: string
  title: string
  summary: string
  /** 表示用の番号(既定は id)。序論は id を変えずに「序-1」と表示する */
  label?: string
}
export type Stage = {
  id: string
  /** 表示用の番号(「序」または「0」〜) */
  num: string
  title: string
  goal: string
  /** なぜこのステージを学ぶのか(1〜2文) */
  why?: string
  /** このステージの知識が、先のどのレッスンで使われるか */
  uses?: { concept: string; lessonIds: string[] }[]
  lessons: LessonMeta[]
}

export const stages: Stage[] = [
  {
    id: 'intro',
    num: '序',
    title: '全体像と歴史',
    goal: 'これから学ぶ内容がどうつながるかと、LLM が生まれるまでの流れをつかむ。',
    why: '各ステージで学ぶことが、LLM のどこに関わるのかを先に見ておくと、途中で「なぜこれを学ぶのか」を見失わずに進めます。',
    lessons: [
      { id: 'i-1', label: '序-1', title: 'LLM の全体像と、このコースの地図', summary: 'LLM が1つの応答を作るまでの流れと、各ステージのつながり、目的に応じた進み方。' },
      { id: 'i-2', label: '序-2', title: 'LLM までの歴史', summary: 'パーセプトロンから Transformer、ChatGPT、エージェントまで。何が壁で、何がそれを破ったか。' },
    ],
  },
  {
    id: 's0',
    num: '0',
    why: 'LLM の中身は、ベクトルと行列の計算、確率、勾配による学習でできています。以降の説明を、数式でつまずかずに読むための土台です。',
    uses: [
      { concept: 'ベクトルと内積', lessonIds: ['3-2', '4-2'] },
      { concept: '行列積', lessonIds: ['2-1', '4-4'] },
      { concept: '確率分布', lessonIds: ['3-3', '6-1'] },
      { concept: '微分と勾配', lessonIds: ['1-2', '2-3'] },
    ],
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
    num: '1',
    why: 'LLM も「損失を下げるようにパラメータを調整する」機械学習の一種です。その基本の枠組みを押さえます。',
    uses: [
      { concept: '損失関数', lessonIds: ['5-1'] },
      { concept: '勾配降下法', lessonIds: ['5-1', '7-1'] },
      { concept: '汎化と過学習', lessonIds: ['5-2', '8-3'] },
    ],
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
    num: '2',
    why: 'Transformer もニューラルネットワークです。層、活性化関数、逆伝播は、LLM の部品と学習の仕組みそのものです。',
    uses: [
      { concept: '層と行列', lessonIds: ['4-4'] },
      { concept: 'softmax', lessonIds: ['4-2', '6-1'] },
      { concept: '誤差逆伝播', lessonIds: ['5-1'] },
    ],
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
    num: '3',
    why: '文字列がどう数値になり、モデルが何を予測しているのか。LLM の入口と出口です。',
    uses: [
      { concept: 'トークン', lessonIds: ['6-3', '9-1'] },
      { concept: '埋め込み', lessonIds: ['4-2', '11-4'] },
      { concept: '言語モデル', lessonIds: ['5-1', '6-1'] },
    ],
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
    num: '4',
    why: 'LLM の中核の構造です。長い文脈を扱える理由と、その計算コストの源がここにあります。',
    uses: [
      { concept: 'Self-Attention', lessonIds: ['6-2', '6-3'] },
      { concept: '位置エンコーディング', lessonIds: ['6-3'] },
      { concept: 'Transformer ブロック', lessonIds: ['5-3'] },
    ],
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
    num: '5',
    why: '大量のテキストから知識と言語の能力を得る過程です。モデルの得意・不得意と、規模の効果の理由が分かります。',
    uses: [
      { concept: '次トークン予測', lessonIds: ['8-3'] },
      { concept: '学習データ', lessonIds: ['7-1'] },
      { concept: 'スケーリング則', lessonIds: ['12-3'] },
    ],
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
    num: '6',
    why: 'API で使うときに直接触れる、生成の設定と、速さ・費用・文脈の長さの制約です。',
    uses: [
      { concept: 'サンプリング', lessonIds: ['9-1'] },
      { concept: 'KV キャッシュ', lessonIds: ['11-3'] },
      { concept: 'コンテキストウィンドウ', lessonIds: ['11-3'] },
    ],
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
    num: '7',
    why: '素のモデルを、指示に従うアシスタントにする方法です。プロンプトの効き方や、断る振る舞いの背景が分かります。',
    uses: [
      { concept: '教師ありファインチューニング', lessonIds: ['9-3'] },
      { concept: 'RLHF', lessonIds: ['9-2'] },
      { concept: 'アライメント', lessonIds: ['12-2'] },
    ],
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
    num: '8',
    why: 'LLM を使ったシステムの全体像と限界です。第2部の入口になります。',
    uses: [
      { concept: 'RAG', lessonIds: ['11-4'] },
      { concept: 'エージェント', lessonIds: ['10-1', '11-2'] },
      { concept: '幻覚と評価', lessonIds: ['12-1'] },
    ],
    title: '応用と限界',
    goal: 'LLMを使うシステムの全体像と、モデルの限界を理解する。第2部への橋渡し。',
    lessons: [
      { id: '8-1', title: 'RAG', summary: '外部知識を検索してプロンプトに差し込む。' },
      { id: '8-2', title: 'ツール利用とエージェント', summary: '関数呼び出しと、ループで動くエージェント。' },
      { id: '8-3', title: '幻覚と評価', summary: 'もっともらしい誤りが起きる理由と、性能の測り方。' },
    ],
  },
  {
    id: 's9',
    num: '9',
    why: '自分のプログラムから LLM を使う基本です。第2部のすべての土台になります。',
    uses: [
      { concept: 'メッセージ API', lessonIds: ['10-2'] },
      { concept: '構造化出力', lessonIds: ['10-1', '12-1'] },
    ],
    title: 'LLM API を使う',
    goal: 'Claude API を自分のプログラムから呼び出し、応答を安全に扱えるようになる。',
    lessons: [
      { id: '9-1', title: 'メッセージ API の基本', summary: 'リクエストと応答の構造、会話の履歴、トークンと料金、APIキーの扱い。' },
      { id: '9-2', title: '応答の扱い', summary: 'stop_reason、ストリーミング、エラーと再試行、断られたときの備え。' },
      { id: '9-3', title: 'プロンプト設計', summary: '目的・入力・出力の形を明確にした指示と、例示の使い方。' },
      { id: '9-4', title: '構造化出力', summary: 'JSON Schema で応答の形式を制約し、プログラムで安全に扱う。' },
    ],
  },
  {
    id: 's10',
    num: '10',
    why: 'LLM に外部の操作をさせる仕組みです。エージェントの部品になります。',
    uses: [
      { concept: 'ツール呼び出しループ', lessonIds: ['11-2', '13-2'] },
      { concept: 'ツール設計', lessonIds: ['12-2'] },
    ],
    title: 'ツール利用の実装',
    goal: 'ツールを定義し、ツール呼び出しのループを自分で実装・設計できるようになる。',
    lessons: [
      { id: '10-1', title: 'ツールの定義', summary: '名前・説明・JSON Schema で操作を定義し、モデルに使わせる。' },
      { id: '10-2', title: '呼び出しループの実装', summary: 'tool_use と tool_result の受け渡し、並列呼び出し、エラーの返し方。' },
      { id: '10-3', title: 'ツール設計の原則', summary: '少数で明確なツール、返す情報の量、役に立つエラー、副作用と権限。' },
      { id: '10-4', title: 'MCP で外部のツールにつなぐ', summary: 'Model Context Protocol のしくみと、Claude API からの使い方。' },
    ],
  },
  {
    id: 's11',
    num: '11',
    why: '長く、複雑に動くエージェントを、無駄なく安全に組み立てる設計です。',
    uses: [
      { concept: '設計パターン', lessonIds: ['13-1'] },
      { concept: 'コンテキストの管理', lessonIds: ['12-3'] },
    ],
    title: 'エージェントの設計',
    goal: 'ワークフローとエージェントを使い分け、長く動くエージェントを安全に設計できるようになる。',
    lessons: [
      { id: '11-1', title: 'ワークフローかエージェントか', summary: '代表的な5つのパターンと、エージェントを選ぶ条件。' },
      { id: '11-2', title: 'エージェントループ', summary: '止める条件、人による承認、途中経過の見せ方、作り方の選択肢。' },
      { id: '11-3', title: 'コンテキストと記憶の管理', summary: '結果の積み上がり、コンテキスト編集、コンパクション、メモリ、キャッシュ。' },
      { id: '11-4', title: 'RAG の実装', summary: 'チャンク分割、埋め込み、ハイブリッド検索、再ランキング、検索のツール化。' },
      { id: '11-5', title: 'マルチエージェント', summary: 'オーケストレーターとワーカー、向く場面・向かない場面、任せ方と評価。' },
    ],
  },
  {
    id: 's12',
    num: '12',
    why: '作ったものが本当に良いか、安全かを確かめ、運用し続ける方法です。',
    uses: [
      { concept: '評価', lessonIds: ['13-3'] },
      { concept: 'セキュリティ', lessonIds: ['13-1'] },
    ],
    title: '品質と安全',
    goal: 'エージェントの品質を測り、攻撃や事故に備え、本番で運用できるようになる。',
    lessons: [
      { id: '12-1', title: 'エージェントの評価', summary: '評価セットの作り方、採点の方法、LLM による採点、誤差の目安。' },
      { id: '12-2', title: 'セキュリティ', summary: 'プロンプトインジェクション、危険な組み合わせ、最小権限と承認。' },
      { id: '12-3', title: '本番運用', summary: '構成、信頼性、費用、速さ、記録と監視、モデルの更新。' },
    ],
  },
  {
    id: 's13',
    num: '13',
    why: 'ここまでの内容を、1つの機能として完成させます。',
    title: '総仕上げ',
    goal: '1つのエージェント機能を、要件から設計・実装・評価まで通して作る。',
    lessons: [
      { id: '13-1', title: '要件から設計へ', summary: 'サポートエージェントの要件、方式、ツールと権限、安全性、評価の計画。' },
      { id: '13-2', title: '実装の全体', summary: 'ツール、ループ、承認待ちと再開、止める条件を備えたコード。' },
      { id: '13-3', title: '評価して改善するサイクル', summary: '評価セットで測り、原因を直し、確認用のケースで確かめる。' },
    ],
  },
  {
    id: 's14',
    num: '14',
    why: 'AI を使った開発には段階があり、段階ごとに人の役割と、必要な検証の仕組みが変わります。どこまで任せるかを判断するための地図です。',
    uses: [
      { concept: '5つの水準', lessonIds: ['16-1', '17-1'] },
      { concept: '任せる水準の選び方', lessonIds: ['17-1', '17-3'] },
    ],
    title: 'AI 開発の地図',
    goal: 'AI を使った開発の5つの水準と、作業ごとに任せる水準を選ぶ考え方を身につける。',
    lessons: [
      { id: '14-1', title: 'AI 開発の5つの水準', summary: '補完から AI ネイティブまで。水準ごとの人の役割と、検証の仕組みの重要性。' },
      { id: '14-2', title: '道具の変遷と、研究が示すこと', summary: 'ツールの変遷と、生産性の研究の結果。実感と計測のずれ。' },
      { id: '14-3', title: '任せる水準を選ぶ', summary: 'リスクと検証のしやすさの2つの軸と、任せる範囲を広げる戦略。' },
    ],
  },
  {
    id: 's15',
    num: '15',
    why: '補完と対話支援は、AI を使った開発の基本の道具です。生成されたコードを正しく読み、確かめる力は、すべての水準の土台になります。',
    uses: [
      { concept: '文脈の渡し方', lessonIds: ['16-2'] },
      { concept: '生成されたコードのレビュー', lessonIds: ['16-1', '17-2'] },
    ],
    title: 'アシストを使いこなす',
    goal: '補完と対話支援で、文脈を渡して頼み、生成されたコードを読んで確かめられるようになる。',
    lessons: [
      { id: '15-1', title: '補完と対話支援のコツ', summary: 'AI が見ている手がかりと、チャットで渡すべき文脈。' },
      { id: '15-2', title: '生成されたコードを読む・確かめる', summary: 'よくある問題の種類と、レビューと確認の手順。' },
      { id: '15-3', title: 'AI と学び、理解を保つ', summary: '説明できるまでマージしない。AI を学ぶ道具にする。渡してよい情報。' },
    ],
  },
  {
    id: 's16',
    num: '16',
    why: 'コーディングエージェントに、調べて、計画して、実装して、確かめるまでを任せる段階です。任せる範囲が広がるほど、文脈の渡し方と、権限と検証の仕組みが成果を左右します。',
    uses: [
      { concept: 'CLAUDE.md と仕様', lessonIds: ['17-1'] },
      { concept: '権限とフック', lessonIds: ['17-2'] },
    ],
    title: 'エージェント型開発',
    goal: 'コーディングエージェントに、計画と検証を組み込んだ流れで作業を任せ、文脈と権限を設計できるようになる。',
    lessons: [
      { id: '16-1', title: '調べて、計画して、確かめる', summary: '4つの段階と plan モード、確かめる手段の渡し方、軌道修正と文脈の管理。' },
      { id: '16-2', title: 'CLAUDE.md と仕様で文脈を渡す', summary: 'CLAUDE.md の置き場所と書く内容、スキルとサブエージェント、仕様駆動の開発。' },
      { id: '16-3', title: '権限とサンドボックス', summary: '権限モード、許可・確認・拒否のルール、フック、サンドボックス、守りの層。' },
    ],
  },
  {
    id: 's17',
    num: '17',
    why: '個人の道具から、チームの開発の流れの一部にする段階です。課題を渡して PR を受け取る形では、レビューと検証の仕組み、そして計測が、任せられる量を決めます。',
    title: 'チームとプロセスに組み込む',
    goal: '課題から PR までを AI に任せ、CI・レビュー・ガードレールで品質を守り、効果と費用を測れるようになる。',
    lessons: [
      { id: '17-1', title: '課題を渡して、PR を受け取る', summary: '任せられる課題の書き方、GitHub Actions での委任、並行して任せるときの注意。' },
      { id: '17-2', title: 'CI と自動レビュー、ガードレール', summary: '機械・AI・人の3段階のレビュー、レビューのワークフロー、守らせる場所の選び方。' },
      { id: '17-3', title: '効果と費用を測る', summary: 'DORA の指標、目標にしてはいけない値、費用の目安と抑え方、導入の進め方。' },
    ],
  },
]

export const allLessons = stages.flatMap((s) =>
  s.lessons.map((l) => ({ ...l, stageId: s.id })),
)

export const findLesson = (id: string) => allLessons.find((l) => l.id === id)
export const findStage = (id: string) => stages.find((s) => s.id === id)

/** 「Stage 0」「序論」のような、ステージの表示名 */
export const stageLabel = (s: Stage) => (s.num === '序' ? '序論' : `Stage ${s.num}`)
/** レッスンの表示用の番号(「0-1」「序-1」など) */
export const lessonNo = (l: { id: string; label?: string }) => l.label ?? l.id

