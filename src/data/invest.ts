/** 投資の判断(経営-5)の基本の式。管理会計の教科書(OpenStax)の定義に沿う。キャッシュフローは期末に生じるとし、税は考えない。 */

/** 回収期間(年)。毎年のキャッシュフローの累計が初期投資に届く時点。年の途中は、その年の中で一様に入るとして按分する。届かなければ null。 */
export function payback(investment: number, flows: number[]): number | null {
  let rest = investment
  for (let i = 0; i < flows.length; i++) {
    if (flows[i] >= rest) return i + rest / flows[i]
    rest -= flows[i]
  }
  return null
}

/** 会計上の収益率(ARR)。(増分の収益 − 増分の費用(減価償却を含む)) ÷ (初期投資 − 残存価額)。 */
export function arr(incrementalRevenue: number, incrementalExpense: number, investment: number, salvage = 0): number {
  return (incrementalRevenue - incrementalExpense) / (investment - salvage)
}

/** 将来価値: 元本を、年率 rate で n 年、複利で運用したときの価値。 */
export function futureValue(principal: number, rate: number, years: number): number {
  return principal * (1 + rate) ** years
}

/** 現在価値(割引): n 年後の金額を、年率 rate で割り引いた、今の価値。 */
export function presentValue(amount: number, rate: number, years: number): number {
  return amount / (1 + rate) ** years
}

/** 正味現在価値(NPV)。各年のキャッシュフローを割り引いて足し、初期投資を引く。 */
export function npv(rate: number, investment: number, flows: number[]): number {
  return flows.reduce((sum, c, i) => sum + presentValue(c, rate, i + 1), 0) - investment
}

/** 収益性指数。キャッシュフローの現在価値 ÷ 初期投資。 */
export function profitabilityIndex(rate: number, investment: number, flows: number[]): number {
  return (npv(rate, investment, flows) + investment) / investment
}

/** 内部収益率(IRR)。NPV が 0 になる割引率(二分法)。符号が変わる範囲に解がなければ null。 */
export function irr(investment: number, flows: number[]): number | null {
  let lo = 0
  let hi = 1
  if (npv(lo, investment, flows) < 0 || npv(hi, investment, flows) > 0) return null
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (npv(mid, investment, flows) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
