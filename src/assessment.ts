/**
 * 19-1 の成熟度の自己診断と、19-2 の移行計画で共有するデータ。
 * 回答は進捗とは別のキーで localStorage に置く(進捗率やエクスポートには含めない)。
 */

export type Dimension = {
  id: string
  name: string
  /** 0〜3 の段階ごとの状態の説明 */
  levels: [string, string, string, string]
  /** 現在の段階(0〜2)から、次の段階へ上がるための最初の一歩 */
  next: [string, string, string]
}

export const dimensions: Dimension[] = [
  {
    id: 'verify',
    name: '検証',
    levels: [
      'テストはほとんどなく、動作は手で確かめている',
      '主要な部分にテストがあり、手元で実行している',
      '型・lint・テストが CI で自動実行され、マージの条件になっている',
      '受け入れの基準まで自動で判定でき、本番の監視と自動の切り戻しもある',
    ],
    next: [
      '変更が多い部分から、振る舞いを守るテストを書く(AI に手伝わせてよい)',
      'CI でテストと型チェックを自動実行し、ブランチの保護で必須のチェックにする',
      '受け入れの基準をテストや評価セットとして書き、本番の監視と切り戻しの手順を整える',
    ],
  },
  {
    id: 'context',
    name: '文脈と仕様',
    levels: [
      'やりたいことは、その場で口頭やチャットで伝えている',
      'CLAUDE.md などに、コマンドと決まりを書いている',
      '大きな作業は、やること・やらないこと・完了の条件を書いてから任せている',
      '仕様と検証の基準が、リポジトリの中で保守され、AI も人もそれを正としている',
    ],
    next: [
      '/init で CLAUDE.md を作り、コードから分からない決まりとコマンドだけを残す',
      'issue と仕様のテンプレートに「やらないこと」と「完了の条件」の欄を作る',
      '仕様と受け入れの基準をリポジトリで管理し、変更のたびに更新する決まりにする',
    ],
  },
  {
    id: 'guard',
    name: '権限と安全',
    levels: [
      '権限の設定はしておらず、確認を求められたら毎回許可している',
      '安全な操作を許可し、危ない操作を拒否するルールを設定している',
      'フックやサンドボックスで、守るべきことを仕組みで強制している',
      '自動の実行は隔離した環境で、最小権限と予算の上限、止める手段を備えて動いている',
    ],
    next: [
      'テストやビルドなど安全な操作を許可し、push や秘密情報の読み取りを拒否するルールを書く',
      '整形や禁止の操作をフックにし、サンドボックスでファイルとネットワークの範囲を絞る',
      '自動の実行に、最小権限、ターン数と費用の上限、すぐ止める手段を用意する',
    ],
  },
  {
    id: 'process',
    name: 'レビューとプロセス',
    levels: [
      'AI の出力を、そのまま使うことがある',
      '人が差分を読んでからマージしている',
      '機械のチェック・AI のレビュー・人のレビューの段階が決まっている',
      'リスクに応じて、自動でマージしてよい変更と、人が判断する変更が決まっている',
    ],
    next: [
      '説明できない差分はマージしない、を決まりにする',
      'CI のチェックと AI のレビューを、人のレビューの前に置く',
      '変更の種類ごとのリスクを決め、低リスクの変更だけを自動化の対象にする',
    ],
  },
  {
    id: 'measure',
    name: '計測',
    levels: [
      '効果は、実感で判断している',
      '費用や利用状況を把握している',
      '導入の前後で、速さと安定性の指標を比べている',
      '指標と費用を継続的に見て、任せる範囲を見直している',
    ],
    next: [
      '/usage や管理画面で、費用と利用状況を把握する',
      '導入前の基準値を測り、DORA の指標とレビューの時間を比べる',
      '指標を定期的に見直す場を作り、任せる範囲の拡大・縮小を決める',
    ],
  },
  {
    id: 'people',
    name: '人の理解',
    levels: [
      'AI が書いたコードを、説明できないことがある',
      'マージする変更は、説明できるようにしている',
      '設計の判断と理由を文書に残し、チームで共有している',
      'AI が多くを書いても、システムの構造と判断の理由を、チームが説明できる',
    ],
    next: [
      '説明できるまでマージしない。分からない部分は AI に説明させ、公式の資料で裏を取る',
      '設計の判断と理由を、短い文書(ADR など)に残す',
      'コードを読み、構造を説明し合う時間を定期的に作る',
    ],
  },
]

export type Answers = Record<string, number>

const KEY = 'llm-learning:assessment'

export function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const out: Answers = {}
    for (const d of dimensions) {
      const v = data?.[d.id]
      if (Number.isInteger(v) && v >= 0 && v <= 3) out[d.id] = v
    }
    return out
  } catch {
    return {}
  }
}

export function saveAnswers(a: Answers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    // 保存できない環境では、画面の上だけで使う
  }
}

export function clearAnswers() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 何もしない
  }
}

/** 最も弱い軸の段階から、安全に任せられる水準の目安を返す */
export const levelFor = (min: number) => ['L1〜L2', 'L3', 'L4', 'L5'][min]

export function summarize(a: Answers) {
  const complete = dimensions.every((d) => a[d.id] !== undefined)
  if (!complete) return null
  const min = Math.min(...dimensions.map((d) => a[d.id]))
  const weakest = dimensions.filter((d) => a[d.id] === min)
  return { min, level: levelFor(min), weakest }
}
