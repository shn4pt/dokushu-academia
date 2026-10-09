// 評価の結果を、統計として正しく扱う小さな関数。20-2 で使う。
// 外部のライブラリに頼らない、純粋な関数で、ブラウザでも Node でも動く(テストで、既知の値と照合している)。

/** 合格率と、その95%信頼区間(Wilson の区間)。件数が少なくても、0〜1 の範囲に収まる。 */
export function passRateInterval(passed: number, total: number, z = 1.96) {
  if (total <= 0) return { rate: 0, low: 0, high: 1 };
  const p = passed / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denom;
  return { rate: p, low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

/** 二項分布 Bin(n, 0.5) で、k 以下になる確率 */
function binomialCdfHalf(k: number, n: number): number {
  // 対数で計算して、n が大きくても、あふれないようにする
  let logC = 0; // log C(n, 0)
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    if (i > 0) logC += Math.log(n - i + 1) - Math.log(i);
    sum += Math.exp(logC - n * Math.LN2);
  }
  return Math.min(1, sum);
}

/**
 * 同じケースで、2つの版(A と B)を比べる(対応のある比較)。
 * 片方だけが合格したケースの数で、差が偶然とは言いにくいかを、正確な符号検定(McNemar の正確検定)で調べる。
 */
export function comparePaired(a: boolean[], b: boolean[]) {
  if (a.length !== b.length) throw new Error("同じケースで比べるので、件数は同じにしてください");
  let onlyA = 0; // A だけ合格
  let onlyB = 0; // B だけ合格
  let both = 0;
  a.forEach((x, i) => {
    if (x && b[i]) both++;
    else if (x) onlyA++;
    else if (b[i]) onlyB++;
  });
  const n = onlyA + onlyB; // 結果が分かれたケースの数
  const pValue = n === 0 ? 1 : Math.min(1, 2 * binomialCdfHalf(Math.min(onlyA, onlyB), n));
  const total = a.length;
  return { total, aRate: (both + onlyA) / total, bRate: (both + onlyB) / total, onlyA, onlyB, both, pValue };
}

/** 2人(または、採点役と人)の判定が、どれだけ一致するか。偶然の一致を引いた Cohen の κ も出す。 */
export function agreement<T extends string | number | boolean>(x: T[], y: T[]) {
  if (x.length !== y.length || x.length === 0) throw new Error("同じ件数の、1件以上の判定が要ります");
  const n = x.length;
  const observed = x.filter((v, i) => v === y[i]).length / n;
  const labels = [...new Set([...x, ...y])];
  const expected = labels.reduce((s, l) => s + (x.filter((v) => v === l).length / n) * (y.filter((v) => v === l).length / n), 0);
  // 偶然の一致が 100% のときは、κ を決められない(全員が同じ判定をしている)
  const kappa = expected === 1 ? NaN : (observed - expected) / (1 - expected);
  return { n, observed, expected, kappa };
}
