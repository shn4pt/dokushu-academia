// 講座一覧(全体デザインの確認用の構成案)。
// 公開中の講座は、既存のステージに対応する。「目次のみ」の講座は、構成の案で、本文はまだない。
// 目次のみの講座の題名は、扱う話題の案であり、内容の主張ではない(本文を書くときに、出典を確認して決め直す)。

export type EvidenceKind = 'tech' | 'academic' | 'practice' | 'law'
export type Level = 'basic' | 'practice' | 'advanced'

export const levelLabel: Record<Level, string> = { basic: '基礎', practice: '実践', advanced: '応用' }

export const evidenceInfo: Record<EvidenceKind, { label: string; basis: string; note: string }> = {
  tech: {
    label: '技術・実証',
    basis: '論文、公式ドキュメント、標準',
    note: '動きや数値は、公式の資料や原文で確認し、確認の程度をレッスンごとに公開します。',
  },
  academic: {
    label: '学術',
    basis: '査読された論文、研究のレビュー',
    note: '追試で再現できなかった研究や、結果が割れている研究は、そう明記します。',
  },
  practice: {
    label: '実務・事例',
    basis: '教科書、原著、一流の実践者の著作、事例',
    note: '論文のような実験の根拠が少ない分野です。根拠の種類(教科書・原著・事例・意見)を、記述ごとに見える形にします。',
  },
  law: {
    label: '法令・基準',
    basis: '条文・基準そのもの、所管機関の公式資料',
    note: '「全体像と考え方」に限り、個別の事案は扱いません。確認した日と改正の有無を必ず示し、判断は専門家に確認する線引きを明記します。',
  },
}

export type Tier = {
  level: Level
  /** この段階で扱う範囲 */
  scope: string
  /** 公開中の講座: 対応するステージ */
  stageIds?: string[]
  /** 目次のみの講座: レッスンの題名の案 */
  planned?: string[]
}

export type Course = {
  id: string
  /** 先に学ぶとよい講座(このサービスの設計上の提案。必須ではない) */
  requires?: string[]
  /** 先に学ぶとよい講座ごとに、なぜ先がよいのか(requires の全件に書く) */
  needs?: Record<string, string>
  /** なぜ、この講座を学ぶのか: 分からないと何に困り、何ができるようになるか */
  why: string
  title: string
  group: string
  evidence: EvidenceKind
  summary: string
  tiers: Tier[]
}

// 領域は、大学の学部の区分を参考にした学問のまとまり。プロダクト(実践)は、ほかの領域で学んだことを統合する実務の領域。
// 経済学・社会学・人文(歴史・哲学・倫理)は、あとから足す予定(いまは法務・労務だけを「経済・社会・法」に置いている)。
export const groups = [
  { id: 'learning', title: '学び方', note: '学ぶこと自体と、根拠の読み方(学習科学・研究方法論)' },
  { id: 'data', title: '数理・データ', note: '統計とデータサイエンス。意思決定に使うデータの見方' },
  { id: 'ai', title: '情報・AI', note: 'LLM の中身から、AI を使ったものづくり、ソフトウェアとセキュリティまで' },
  { id: 'business', title: '経営・商学', note: '事業の戦略、顧客、組織、お金の流れ' },
  { id: 'psychology', title: '心理・行動', note: '人の認知と行動、意思決定のくせ' },
  { id: 'society', title: '経済・社会・法', note: '事業を取り巻く法と制度(経済学・社会学などは、あとから追加予定)' },
  { id: 'product', title: 'プロダクト(実践)', note: '他の領域で学んだことを統合して、プロダクトをつくる' },
] as const

export const courses: Course[] = [
  // ── 学びの土台 ──
  {
    id: 'learning', title: '学び方・動機づけ', group: 'learning', evidence: 'academic',
    why: "限られた隙間時間を、何に、どう使うかを選べるようになるためです。忘れ方と続け方のしくみを知ると、学び方を自分で組み立て直せます。",
    summary: '大人の学び方、記憶と習慣、続けるための工夫。学習科学の知見にもとづく。',
    tiers: [
      { level: 'basic', scope: '学ぶとはどういうことか', stageIds: ['ln0'] },
      { level: 'practice', scope: '効果的な学び方', stageIds: ['ln1'] },
      { level: 'advanced', scope: '仕事の中での学び', stageIds: ['ln2'] },
    ],
  },
  {
    id: 'evidence', title: '根拠の読み方', group: 'learning', evidence: 'academic',
    why: "「〜という研究がある」と言われたときに、どこまで信じてよいかを、自分で判断できるようになるためです。このサービスの根拠の表示の意味も、ここで分かります。",
    summary: '論文や資料の読み方、エビデンスの強さ、実験と相関の違い。このサービスの根拠の表示の意味も、ここで学ぶ。',
    tiers: [
      { level: 'basic', scope: '根拠とは何か、情報の種類', stageIds: ['e0'] },
      { level: 'practice', scope: '研究の読み方', stageIds: ['e1'] },
      { level: 'advanced', scope: '実務での使い方', stageIds: ['e2'] },
    ],
  },
  {
    id: 'statistics', requires: ['evidence'], title: 'データ分析・統計', group: 'data', evidence: 'academic',
    why: "数字を見て判断する場面で、偶然のぶれと本当の差を分けて考えられるようになるためです。指標の増減や実験の結果を、そのまま信じずに読めるようになります。",
    needs: {
      evidence: "実験と相関、因果の違いを知っていると、統計の結果をどこまで言えるかの線引きがしやすくなります。",
    },
    summary: '指標の見方、ばらつきと誤差、A/B テストなど、意思決定に使うデータの基礎。',
    tiers: [
      { level: 'basic', scope: 'データと確率の基礎', stageIds: ['st0'] },
      { level: 'practice', scope: '推定と検定', stageIds: ['st1'] },
      { level: 'advanced', scope: '実験と因果', stageIds: ['st2'] },
    ],
  },
  // ── AI・技術(公開中) ──
  {
    id: 'llm', title: 'LLM のしくみ', group: 'ai', evidence: 'tech',
    why: "AI を使う人にも、作る人にも、LLM が何を得意とし、なぜ間違えるのかを知っていることが、判断の土台になります。中身を知ると、できることと限界を、見通せるようになります。",
    summary: '数学の土台から Transformer、学習、推論、調整まで。LLM の内部を理解する。',
    tiers: [
      { level: 'basic', scope: '全体像、数学の土台、言語の表現、Transformer', stageIds: ['intro', 's0', 's1', 's2', 's3', 's4'] },
      { level: 'practice', scope: 'モデルの学習と、推論のしくみ', stageIds: ['s5', 's6'] },
      { level: 'advanced', scope: '使えるモデルにする調整と、応用', stageIds: ['s7', 's8'] },
    ],
  },
  {
    id: 'agents', requires: ['llm'], title: 'AI エージェント開発', group: 'ai', evidence: 'tech',
    why: "AI を組み込んだ機能を、設計し、実装し、評価できるようになるためです。仕様や限界について、開発者と具体的に話せるようにもなります。",
    needs: {
      llm: "モデルが何を得意とし、どこで間違えるかが、エージェントの設計判断の前提になります。",
    },
    summary: 'Claude API で、ツールを使うエージェントを設計・実装・評価する。',
    tiers: [
      { level: 'basic', scope: 'API の基本と、ツール、エージェントの考え方', stageIds: ['s9', 's10'] },
      { level: 'practice', scope: 'コンテキストと本番の運用、品質と安全', stageIds: ['s11', 's12'] },
      { level: 'advanced', scope: '総仕上げと、MCP・評価の自動化・キャッシュ費用', stageIds: ['s13', 's20'] },
    ],
  },
  {
    id: 'aidev', requires: ['agents'], title: 'AI を使った開発', group: 'ai', evidence: 'tech',
    why: "AI を使った開発では、どこまで任せ、どこを人が確かめるかの判断が、成果を分けます。自分とチームの現在地から、次の一歩を決められるようになります。",
    needs: {
      agents: "任せる範囲の判断には、エージェントの動きと、失敗のしかたの理解が要ります。",
    },
    summary: '補完から AI ネイティブまで、開発のやり方を段階的に進化させる。',
    tiers: [
      { level: 'basic', scope: '水準の考え方と、補完・対話の使い方', stageIds: ['s14', 's15'] },
      { level: 'practice', scope: 'エージェントの運用と、課題を任せる開発', stageIds: ['s16', 's17'] },
      { level: 'advanced', scope: '意図と検証の設計、自分の開発の進化', stageIds: ['s18', 's19'] },
    ],
  },
  // ── AI・技術(目次のみ) ──
  {
    id: 'swe', title: 'ソフトウェアエンジニアリング', group: 'ai', evidence: 'practice',
    why: "開発者との会話に加わり、見積もりや技術的な制約を、自分で受け止められるようになるためです。",
    summary: '設計、テスト、保守、チーム開発の基礎。PM が開発の会話に加われる土台。',
    tiers: [
      { level: 'basic', scope: '開発の流れと、設計・テストの考え方', planned: ['序論:ソフトウェアはどう作られるか', 'バージョン管理とレビュー'] },
      { level: 'practice', scope: '品質と、変更を安全に進める仕組み', planned: ['テストの種類と使い分け', '技術的負債の考え方'] },
      { level: 'advanced', scope: '大きなシステムと、チームの開発プロセス', planned: ['システムの分割と境界', '開発の指標と改善'] },
    ],
  },
  {
    id: 'security', requires: ['swe'], title: 'セキュリティ', group: 'ai', evidence: 'tech',
    why: "セキュリティは、事業のリスクでもあります。何を、誰から守るかの考え方を知ると、設計や優先順位の議論に加われます。",
    needs: {
      swe: "脆弱性は、ソフトウェアの作られ方の上で起きるので、開発の基礎が前提になります。",
    },
    summary: '脅威の考え方と、設計・運用で守る基礎。',
    tiers: [
      { level: 'basic', scope: 'セキュリティの基本概念', planned: ['序論:何を、誰から守るか', '認証と認可'] },
      { level: 'practice', scope: 'よくある脆弱性と対策', planned: ['Web アプリの代表的な脆弱性', '秘密情報の扱い'] },
      { level: 'advanced', scope: '組織としての取り組み', planned: ['脅威モデリング', 'インシデント対応'] },
    ],
  },
  // ── プロダクト・事業 ──
  {
    id: 'pm', requires: ['evidence', 'statistics', 'strategy', 'ux'], title: 'プロダクトマネジメント', group: 'product', evidence: 'practice',
    why: "何を作るかを決める仕事では、顧客の課題、データ、事業の戦略をつなげて判断する必要があります。基礎から応用まで、判断の根拠を自分で組み立てられるようになるためです。",
    needs: {
      evidence: "顧客の声や調査の結果を、どこまで信じて決めてよいかを判断するためです。",
      statistics: "指標の設計と、実験(A/B テスト)の結果の読み方のためです。",
      strategy: "個々のプロダクトの判断を、事業の戦略に結びつけるためです。",
      ux: "顧客の課題の発見と検証の方法のためです。",
    },
    summary: '顧客の課題の発見から、優先順位、計測、ロードマップまで。',
    tiers: [
      { level: 'basic', scope: 'プロダクトマネジメントとは何か', stageIds: ['pm0'] },
      { level: 'practice', scope: '発見・優先順位・計測', stageIds: ['pm1'] },
      { level: 'advanced', scope: '戦略とロードマップ、組織への展開', stageIds: ['pm2'] },
    ],
  },
  {
    id: 'strategy', title: '経営・戦略', group: 'business', evidence: 'practice',
    why: "個別の判断を、事業の経済性と、競争の中での位置取りにつなげて考えられるようになるためです。",
    summary: '事業の経済性と、競争の中での位置取りの基礎。',
    tiers: [
      { level: 'basic', scope: '事業と市場の基礎', stageIds: ['sg0'] },
      { level: 'practice', scope: '競争と戦略の枠組み', stageIds: ['sg1'] },
      { level: 'advanced', scope: '意思決定と成長', stageIds: ['sg2'] },
    ],
  },
  {
    id: 'marketing', requires: ['strategy'], title: 'マーケティング', group: 'business', evidence: 'practice',
    why: "価値を、誰に、どう届けるかを考える力は、プロダクトの成否に直結します。施策の効果を、冷静に見られるようにもなります。",
    needs: {
      strategy: "誰に何をどう届けるかは、事業の位置取りの上で決まります。",
    },
    summary: '顧客の理解、価値の伝え方、施策の効果の見方。',
    tiers: [
      { level: 'basic', scope: 'マーケティングの基本概念', stageIds: ['mk0'] },
      { level: 'practice', scope: '施策の設計と効果測定', stageIds: ['mk1'] },
      { level: 'advanced', scope: 'ブランドと長期の成長', stageIds: ['mk2'] },
    ],
  },
  {
    id: 'ux', requires: ['psychology'], title: 'UX・ユーザーリサーチ', group: 'product', evidence: 'practice',
    why: "作ったものが使われるかは、利用者の見方で決まります。利用者を調べ、検証する方法を知ると、思い込みで決める場面を減らせます。",
    needs: {
      psychology: "利用者の注意、記憶、認知のしくみが、使いやすさの土台になります。",
    },
    summary: '利用者の理解、調査の方法、使いやすさの検証。',
    tiers: [
      { level: 'basic', scope: 'UX と利用者理解の基本', stageIds: ['ux0'] },
      { level: 'practice', scope: '調査と検証', stageIds: ['ux1'] },
      { level: 'advanced', scope: 'プロダクトへの反映', stageIds: ['ux2'] },
    ],
  },
  {
    id: 'planning', requires: ['strategy', 'accounting'], title: '経営企画', group: 'business', evidence: 'practice',
    why: "計画、予算、経営指標が、事業の意思決定をどう支えているかを知ると、経営の議論に加われます。",
    needs: {
      strategy: "計画と予算は、戦略を数字に落としたものです。",
      accounting: "計画の数字を読み書きするには、財務諸表の読み方が前提になります。",
    },
    summary: '計画、予算、経営指標と、事業の意思決定の支え方。',
    tiers: [
      { level: 'basic', scope: '経営企画の役割', planned: ['序論:経営企画の仕事', '中期計画と予算'] },
      { level: 'practice', scope: '指標と分析', planned: ['経営指標の設計', '事業ポートフォリオ'] },
      { level: 'advanced', scope: '全社の意思決定', planned: ['M&A と提携の考え方', '資本政策の基礎'] },
    ],
  },
  // ── 人と組織 ──
  {
    id: 'psychology', requires: ['evidence'], title: '心理学', group: 'psychology', evidence: 'academic',
    why: "利用者も、同僚も、自分自身も人です。認知や動機づけの基礎を知ると、行動の背景を、思い込みでなく根拠から考えられるようになります。",
    needs: {
      evidence: "心理学では、再現性や結果の割れ方が論点になりやすく、研究の読み方が前提になります。",
    },
    summary: '人の認知、感情、学習の基礎。研究の見方も合わせて学ぶ。',
    tiers: [
      { level: 'basic', scope: '心理学の基本と、研究の見方', stageIds: ['ps0'] },
      { level: 'practice', scope: '認知・感情・動機づけ', stageIds: ['ps1'] },
      { level: 'advanced', scope: '仕事と社会への応用', stageIds: ['ps2'] },
    ],
  },
  {
    id: 'behavior', requires: ['psychology', 'statistics'], title: '行動心理学・行動経済学', group: 'psychology', evidence: 'academic',
    why: "人の選択には、くせがあります。意思決定の偏りと、行動の変え方を知ると、プロダクトや組織の設計を、より現実に近い人間像から考えられます。",
    needs: {
      psychology: "意思決定のくせは、認知や動機づけの基礎の上に成り立ちます。",
      statistics: "効果の大きさや誤差を、数字で読む必要があるためです。",
    },
    summary: '人の選択の偏りと、行動の変え方。結果が割れている研究も扱う。',
    tiers: [
      { level: 'basic', scope: '意思決定のくせ', stageIds: ['bh0'] },
      { level: 'practice', scope: '行動の設計', stageIds: ['bh1'] },
      { level: 'advanced', scope: 'プロダクトと組織への応用', stageIds: ['bh2'] },
    ],
  },
  {
    id: 'management', title: 'マネジメント', group: 'business', evidence: 'practice',
    why: "チームの成果は、目標の立て方、フィードバック、育成で変わります。人と組織を動かす基礎を知るためです。",
    summary: 'チームと組織を動かす基礎。目標、フィードバック、育成。',
    tiers: [
      { level: 'basic', scope: 'マネジメントの基本', stageIds: ['mg0'] },
      { level: 'practice', scope: 'チームの運営', stageIds: ['mg1'] },
      { level: 'advanced', scope: '組織の設計と変革', planned: ['組織構造', '変革の進め方'] },
    ],
  },
  // ── バックオフィス・法令(全体像と考え方に限る) ──
  {
    id: 'legal', title: '法務', group: 'society', evidence: 'law',
    why: "事業は、契約や個人情報、知的財産など、法の中で動きます。専門家に相談すべき場面を見分けられるように、全体像と考え方を知るためです。",
    summary: '契約、知的財産、個人情報など、事業に関わる法の全体像と考え方。',
    tiers: [
      { level: 'basic', scope: '法の全体像', planned: ['序論:事業と法の関わり', '契約の基本'] },
      { level: 'practice', scope: '事業で出会う論点', planned: ['知的財産の基本', '個人情報の取り扱いの全体像'] },
      { level: 'advanced', scope: '組織としての法務', planned: ['コンプライアンスの考え方', '専門家に相談すべき場面'] },
    ],
  },
  {
    id: 'labor', title: '労務', group: 'society', evidence: 'law',
    why: "雇用や働き方の制度は、チームづくりと日々の運営に関わります。全体像を知って、専門家に確認すべき点を見分けられるようになるためです。",
    summary: '雇用と働き方に関わる制度の全体像と考え方。',
    tiers: [
      { level: 'basic', scope: '雇用の全体像', planned: ['序論:雇用の基本的な仕組み', '労働時間の考え方'] },
      { level: 'practice', scope: '日々の運用', planned: ['採用から退職までの流れ', '就業規則の役割'] },
      { level: 'advanced', scope: '組織の課題', planned: ['ハラスメント防止の考え方', '専門家に相談すべき場面'] },
    ],
  },
  {
    id: 'accounting', title: '会計・経理', group: 'business', evidence: 'law',
    why: "お金の流れを読めると、事業の健康状態と、計画の現実味を、自分で判断できます。",
    summary: '財務諸表の読み方と、お金の流れの基礎。',
    tiers: [
      { level: 'basic', scope: '会計の基礎', planned: ['序論:会計は何を伝えるか', '貸借対照表と損益計算書'] },
      { level: 'practice', scope: '財務諸表の読み方', planned: ['キャッシュフローの見方', '原価と損益分岐'] },
      { level: 'advanced', scope: '経営への活用', planned: ['予算と実績の管理', '投資の評価'] },
    ],
  },
  {
    id: 'audit', requires: ['accounting'], title: '監査・内部統制', group: 'business', evidence: 'law',
    why: "監査と内部統制の考え方を知ると、不正や誤りを防ぐ仕組みが、事業のどこに必要かを見通せます。",
    needs: {
      accounting: "監査の対象である会計の基礎が前提になります。",
    },
    summary: '会計監査と内部統制の考え方。',
    tiers: [
      { level: 'basic', scope: '監査と統制の基本', planned: ['序論:なぜ監査が必要か', '内部統制の考え方'] },
      { level: 'practice', scope: '統制の設計と運用', planned: ['リスクと統制', '証跡の残し方'] },
      { level: 'advanced', scope: '組織への展開', planned: ['IT と統制', '不正の防止の考え方'] },
    ],
  },
]

export const findCourse = (id: string) => courses.find((c) => c.id === id)
/** 講座の状態: すべての段階に本文がある(open)、一部だけある(partial)、目次の案だけ(outline) */
export type CourseStatus = 'open' | 'partial' | 'outline'
export const courseStatus = (c: Course): CourseStatus => {
  const n = c.tiers.filter((t) => t.stageIds?.length).length
  return n === 0 ? 'outline' : n === c.tiers.length ? 'open' : 'partial'
}
export const statusLabel: Record<CourseStatus, string> = { open: '公開中', partial: '一部公開', outline: '目次のみ' }
/** 本文が(一部でも)ある講座か */
export const isAvailable = (c: Course) => courseStatus(c) !== 'outline'
export const courseStageIds = (c: Course) => c.tiers.flatMap((t) => t.stageIds ?? [])
export const plannedCount = (c: Course) => c.tiers.reduce((n, t) => n + (t.planned?.length ?? 0), 0)

/** 領域の重なり(下から上へ): 土台 → 学問の領域 → 実践 */
export const layers = [
  { id: 'foundation', title: '土台', note: '学ぶことと、根拠の読み方', groupIds: ['learning'] },
  { id: 'fields', title: '学問の領域', note: '基礎論から応用へ、領域ごとに学ぶ', groupIds: ['data', 'ai', 'business', 'psychology', 'society'] },
  { id: 'practice', title: '実践', note: '学んだことを統合して、プロダクトをつくる', groupIds: ['product'] },
] as const

export const prerequisites = (c: Course) => (c.requires ?? []).map(findCourse).filter((x): x is Course => !!x)
export const followers = (c: Course) => courses.filter((x) => x.requires?.includes(c.id))

/** 先に学ぶとよい理由(その講座が、先の講座を必要とする理由)。先の講座の側から、使われる先として引く。 */
export const usedBy = (c: Course) => courses.filter((x) => x.requires?.includes(c.id)).map((x) => ({ course: x, note: x.needs?.[c.id] ?? '' }))

/**
 * 執筆の優先度(作者の計画。期日の約束ではない)。
 * 原則: 目的(プロダクトマネージャーとして学び直す)から逆算し、プロダクトマネジメントを前提から通して学べる状態にする講座を先に書く。
 * 各グループの中は、書く順番(前提になる講座が先)。公開済みの講座(LLM・AI エージェント開発・AI を使った開発)は、計画の対象外。
 */
export type Priority = 1 | 2 | 3
export const writingPlan: { priority: Priority; title: string; reason: string; ids: string[] }[] = [
  {
    priority: 2,
    title: '次',
    reason: 'プロダクトマネジメントの周辺と、学び方です。最優先の講座(プロダクトマネジメントとその前提)が揃ったので、顧客・人・お金の理解を広げます。',
    ids: ['management', 'accounting', 'planning'],
  },
  {
    priority: 3,
    title: 'あとで',
    reason: '専門性が高く、全体像と考え方に限るべき分野や、プロダクトマネジメントの直接の前提でない分野です。需要を見て、順序を見直します。',
    ids: ['swe', 'security', 'legal', 'labor', 'audit'],
  },
]
export const priorityOf = (c: Course) => writingPlan.find((p) => p.ids.includes(c.id))
