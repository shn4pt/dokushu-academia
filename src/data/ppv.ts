// Ioannidis (2005) "Why Most Published Research Findings Are False", PLoS Med 2(8): e124 の、偏り(バイアス)のない場合の式。
//   PPV = (1 - β) R / (R - βR + α)
//   R: 検証した関係のうち、「本当の関係」と「関係なし」の比(本当 : なし = R : 1)、α: 有意水準、1 - β: 検出力(本当の関係を、有意と検出する確率)
// 論文の本文のうち、要約・式・6 つの系を読んだ(偏りを入れた式は使っていない)。
export function ppv(R: number, power: number, alpha: number) {
  const beta = 1 - power
  return (power * R) / (R - beta * R + alpha)
}

/** 検証した仮説が n 個あるとき、期待される内訳(自然な頻度での説明用)。PPV と同じ値になる。 */
export function expectedCounts(n: number, R: number, power: number, alpha: number) {
  const trueN = (n * R) / (1 + R)
  const falseN = n / (1 + R)
  const truePositive = trueN * power
  const falsePositive = falseN * alpha
  return { trueN, falseN, truePositive, falsePositive, significant: truePositive + falsePositive }
}
