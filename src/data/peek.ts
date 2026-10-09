// 「結果を見ながら、有意になったら止める」ことの影響の、シミュレーション。
// A/A テスト(2 つの群は同じ処理で、帰無仮説が正しい)に、母集団の標準偏差が既知の z 検定を使い、
// データが増えるたびに(等間隔の looks 回)結果を見て、1 回でも |Z| > 1.96(両側 5%)になったら、「有意」として止める。
// 各区間の増分を N(0, 1) として、累積和 S_j から Z_j = S_j / √j を作る(標本が等間隔で増えるときの、標準化した統計量と、同じ分布)。
import { normal, rng } from './ci'

export function peekFalsePositiveRate(seed: number, looks: number, trials: number, z = 1.96) {
  const rand = rng(seed)
  let hits = 0
  for (let t = 0; t < trials; t++) {
    let s = 0
    for (let j = 1; j <= looks; j++) {
      s += normal(rand)
      if (Math.abs(s / Math.sqrt(j)) > z) {
        hits++
        break
      }
    }
  }
  return hits / trials
}
