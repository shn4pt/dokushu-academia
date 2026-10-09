export type CvpInput = { price: number; vc: number; fc: number; units: number }

/** 費用・数量・利益(CVP)の基本の式。管理会計の教科書(OpenStax)の定義に沿う。税は考えない。 */
export function cvp({ price, vc, fc, units }: CvpInput) {
  const cmUnit = price - vc // 単位あたりの貢献利益
  const cmRatio = price > 0 ? cmUnit / price : 0 // 貢献利益率
  const viable = cmUnit > 0
  const breakEvenUnits = viable ? fc / cmUnit : null
  const breakEvenRevenue = viable ? fc / cmRatio : null
  const totalCm = cmUnit * units
  const income = totalCm - fc // 営業利益
  const marginOfSafety = viable ? units * price - (breakEvenRevenue as number) : null // 売上高の余裕
  const marginOfSafetyPct = marginOfSafety !== null && units > 0 ? marginOfSafety / (units * price) : null
  const dol = income > 0 ? totalCm / income : null // 営業レバレッジ度
  const targetUnits = (profit: number) => (viable ? (fc + profit) / cmUnit : null)
  return { cmUnit, cmRatio, breakEvenUnits, breakEvenRevenue, totalCm, income, marginOfSafety, marginOfSafetyPct, dol, targetUnits }
}
