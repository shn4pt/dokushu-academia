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
  title: string
  group: string
  evidence: EvidenceKind
  summary: string
  tiers: Tier[]
}

export const groups = [
  { id: 'ai', title: 'AI・技術', note: 'LLM の中身から、AI を使ったものづくりまで' },
  { id: 'product', title: 'プロダクト・事業', note: '何を作るか、どう事業にするか' },
  { id: 'people', title: '人と組織', note: '人の行動と、チームの動かし方' },
  { id: 'office', title: 'バックオフィス・法令', note: '事業を支える、お金・法律・内部の統制' },
] as const

export const courses: Course[] = [
  // ── AI・技術(公開中) ──
  {
    id: 'llm', title: 'LLM のしくみ', group: 'ai', evidence: 'tech',
    summary: '数学の土台から Transformer、学習、推論、調整まで。LLM の内部を理解する。',
    tiers: [
      { level: 'basic', scope: '全体像、数学の土台、言語の表現、Transformer', stageIds: ['intro', 's0', 's1', 's2', 's3', 's4'] },
      { level: 'practice', scope: 'モデルの学習と、推論のしくみ', stageIds: ['s5', 's6'] },
      { level: 'advanced', scope: '使えるモデルにする調整と、応用', stageIds: ['s7', 's8'] },
    ],
  },
  {
    id: 'agents', title: 'AI エージェント開発', group: 'ai', evidence: 'tech',
    summary: 'Claude API で、ツールを使うエージェントを設計・実装・評価する。',
    tiers: [
      { level: 'basic', scope: 'API の基本と、ツール、エージェントの考え方', stageIds: ['s9', 's10'] },
      { level: 'practice', scope: 'コンテキストと本番の運用、品質と安全', stageIds: ['s11', 's12'] },
      { level: 'advanced', scope: '総仕上げと、MCP・評価の自動化・キャッシュ費用', stageIds: ['s13', 's20'] },
    ],
  },
  {
    id: 'aidev', title: 'AI を使った開発', group: 'ai', evidence: 'tech',
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
    summary: '設計、テスト、保守、チーム開発の基礎。PM が開発の会話に加われる土台。',
    tiers: [
      { level: 'basic', scope: '開発の流れと、設計・テストの考え方', planned: ['序論:ソフトウェアはどう作られるか', 'バージョン管理とレビュー'] },
      { level: 'practice', scope: '品質と、変更を安全に進める仕組み', planned: ['テストの種類と使い分け', '技術的負債の考え方'] },
      { level: 'advanced', scope: '大きなシステムと、チームの開発プロセス', planned: ['システムの分割と境界', '開発の指標と改善'] },
    ],
  },
  {
    id: 'security', title: 'セキュリティ', group: 'ai', evidence: 'tech',
    summary: '脅威の考え方と、設計・運用で守る基礎。',
    tiers: [
      { level: 'basic', scope: 'セキュリティの基本概念', planned: ['序論:何を、誰から守るか', '認証と認可'] },
      { level: 'practice', scope: 'よくある脆弱性と対策', planned: ['Web アプリの代表的な脆弱性', '秘密情報の扱い'] },
      { level: 'advanced', scope: '組織としての取り組み', planned: ['脅威モデリング', 'インシデント対応'] },
    ],
  },
  // ── プロダクト・事業 ──
  {
    id: 'pm', title: 'プロダクトマネジメント', group: 'product', evidence: 'practice',
    summary: '顧客の課題の発見から、優先順位、計測、ロードマップまで。',
    tiers: [
      { level: 'basic', scope: 'プロダクトマネジメントとは何か', planned: ['序論:PM の仕事の全体像', '課題と解決策を分ける'] },
      { level: 'practice', scope: '発見・優先順位・計測', planned: ['顧客の理解と調査', '優先順位のつけ方', '指標の設計'] },
      { level: 'advanced', scope: '戦略とロードマップ、組織への展開', planned: ['プロダクト戦略', 'ステークホルダーとの合意'] },
    ],
  },
  {
    id: 'strategy', title: '経営・戦略', group: 'product', evidence: 'practice',
    summary: '事業の経済性と、競争の中での位置取りの基礎。',
    tiers: [
      { level: 'basic', scope: '事業と市場の基礎', planned: ['序論:事業とは何か', '費用・収益・利益の構造'] },
      { level: 'practice', scope: '競争と戦略の枠組み', planned: ['競争環境の分析', '差別化とコスト'] },
      { level: 'advanced', scope: '意思決定と成長', planned: ['投資の判断', '新規事業の進め方'] },
    ],
  },
  {
    id: 'marketing', title: 'マーケティング', group: 'product', evidence: 'practice',
    summary: '顧客の理解、価値の伝え方、施策の効果の見方。',
    tiers: [
      { level: 'basic', scope: 'マーケティングの基本概念', planned: ['序論:価値を届けるとは', '市場とセグメント'] },
      { level: 'practice', scope: '施策の設計と効果測定', planned: ['ポジショニング', '効果測定の考え方'] },
      { level: 'advanced', scope: 'ブランドと長期の成長', planned: ['ブランドの考え方', '成長の指標'] },
    ],
  },
  // ── 人と組織 ──
  {
    id: 'psychology', title: '心理学', group: 'people', evidence: 'academic',
    summary: '人の認知、感情、学習の基礎。研究の見方も合わせて学ぶ。',
    tiers: [
      { level: 'basic', scope: '心理学の基本と、研究の見方', planned: ['序論:心理学は何を明らかにしてきたか', '実験と相関、再現性'] },
      { level: 'practice', scope: '認知・感情・動機づけ', planned: ['注意と記憶', '動機づけの理論'] },
      { level: 'advanced', scope: '仕事と社会への応用', planned: ['学習と習慣', '集団と意思決定'] },
    ],
  },
  {
    id: 'behavior', title: '行動心理学・行動経済学', group: 'people', evidence: 'academic',
    summary: '人の選択の偏りと、行動の変え方。結果が割れている研究も扱う。',
    tiers: [
      { level: 'basic', scope: '意思決定のくせ', planned: ['序論:人は合理的か', '認知バイアスと、その限界'] },
      { level: 'practice', scope: '行動の設計', planned: ['選択の設計', '習慣をつくる'] },
      { level: 'advanced', scope: 'プロダクトと組織への応用', planned: ['プロダクトの行動設計と倫理', '実験による検証'] },
    ],
  },
  {
    id: 'management', title: 'マネジメント', group: 'people', evidence: 'practice',
    summary: 'チームと組織を動かす基礎。目標、フィードバック、育成。',
    tiers: [
      { level: 'basic', scope: 'マネジメントの基本', planned: ['序論:マネジメントとは', '目標の立て方'] },
      { level: 'practice', scope: 'チームの運営', planned: ['1on1 とフィードバック', '会議と意思決定'] },
      { level: 'advanced', scope: '組織の設計と変革', planned: ['組織構造', '変革の進め方'] },
    ],
  },
  // ── バックオフィス・法令(全体像と考え方に限る) ──
  {
    id: 'legal', title: '法務', group: 'office', evidence: 'law',
    summary: '契約、知的財産、個人情報など、事業に関わる法の全体像と考え方。',
    tiers: [
      { level: 'basic', scope: '法の全体像', planned: ['序論:事業と法の関わり', '契約の基本'] },
      { level: 'practice', scope: '事業で出会う論点', planned: ['知的財産の基本', '個人情報の取り扱いの全体像'] },
      { level: 'advanced', scope: '組織としての法務', planned: ['コンプライアンスの考え方', '専門家に相談すべき場面'] },
    ],
  },
  {
    id: 'labor', title: '労務', group: 'office', evidence: 'law',
    summary: '雇用と働き方に関わる制度の全体像と考え方。',
    tiers: [
      { level: 'basic', scope: '雇用の全体像', planned: ['序論:雇用の基本的な仕組み', '労働時間の考え方'] },
      { level: 'practice', scope: '日々の運用', planned: ['採用から退職までの流れ', '就業規則の役割'] },
      { level: 'advanced', scope: '組織の課題', planned: ['ハラスメント防止の考え方', '専門家に相談すべき場面'] },
    ],
  },
  {
    id: 'accounting', title: '会計・経理', group: 'office', evidence: 'law',
    summary: '財務諸表の読み方と、お金の流れの基礎。',
    tiers: [
      { level: 'basic', scope: '会計の基礎', planned: ['序論:会計は何を伝えるか', '貸借対照表と損益計算書'] },
      { level: 'practice', scope: '財務諸表の読み方', planned: ['キャッシュフローの見方', '原価と損益分岐'] },
      { level: 'advanced', scope: '経営への活用', planned: ['予算と実績の管理', '投資の評価'] },
    ],
  },
  {
    id: 'audit', title: '監査・内部統制', group: 'office', evidence: 'law',
    summary: '会計監査と内部統制の考え方。',
    tiers: [
      { level: 'basic', scope: '監査と統制の基本', planned: ['序論:なぜ監査が必要か', '内部統制の考え方'] },
      { level: 'practice', scope: '統制の設計と運用', planned: ['リスクと統制', '証跡の残し方'] },
      { level: 'advanced', scope: '組織への展開', planned: ['IT と統制', '不正の防止の考え方'] },
    ],
  },
  {
    id: 'planning', title: '経営企画', group: 'office', evidence: 'practice',
    summary: '計画、予算、経営指標と、事業の意思決定の支え方。',
    tiers: [
      { level: 'basic', scope: '経営企画の役割', planned: ['序論:経営企画の仕事', '中期計画と予算'] },
      { level: 'practice', scope: '指標と分析', planned: ['経営指標の設計', '事業ポートフォリオ'] },
      { level: 'advanced', scope: '全社の意思決定', planned: ['M&A と提携の考え方', '資本政策の基礎'] },
    ],
  },
]

export const findCourse = (id: string) => courses.find((c) => c.id === id)
/** 公開中(既存のステージに対応する)講座か */
export const isAvailable = (c: Course) => c.tiers.some((t) => t.stageIds)
export const courseStageIds = (c: Course) => c.tiers.flatMap((t) => t.stageIds ?? [])
export const plannedCount = (c: Course) => c.tiers.reduce((n, t) => n + (t.planned?.length ?? 0), 0)
