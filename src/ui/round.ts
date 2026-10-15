/**
 * 描画する数値(座標・不透明度)の丸め。小数の末尾の桁は、実行環境(Node とブラウザ)の数学関数の実装で変わりうる。
 * パスの URL 版の引き継ぎ(hydrate)で、サーバーとブラウザの属性値が一致するよう、画面に影響しない桁で丸める(Issue #19)。
 * 座標は 0.01 ピクセル、不透明度は 0.0001 の単位。学習上の意味(図の形・濃淡)は変わらない。計算そのものや、表示する数値の文字列には使わない。
 */
export const roundTo = (v: number, digits: number) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}
export const px = (v: number) => roundTo(v, 2)
export const alpha = (v: number) => roundTo(v, 4)
