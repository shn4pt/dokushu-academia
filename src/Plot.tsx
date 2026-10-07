import type { ReactNode } from 'react'

export type Scale = (v: number) => number

type Props = {
  xDomain: [number, number]
  yDomain: [number, number]
  label: string
  width?: number
  height?: number
  children: (sx: Scale, sy: Scale) => ReactNode
}

const PAD = 28

export function Plot({ xDomain, yDomain, label, width = 480, height = 260, children }: Props) {
  const [x0, x1] = xDomain
  const [y0, y1] = yDomain
  const sx: Scale = (v) => PAD + ((v - x0) / (x1 - x0)) * (width - 2 * PAD)
  const sy: Scale = (v) => height - PAD - ((v - y0) / (y1 - y0)) * (height - 2 * PAD)
  return (
    <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {x0 <= 0 && x1 >= 0 && <line className="axis" x1={sx(0)} x2={sx(0)} y1={PAD / 2} y2={height - PAD / 2} />}
      {y0 <= 0 && y1 >= 0 && <line className="axis" x1={PAD / 2} x2={width - PAD / 2} y1={sy(0)} y2={sy(0)} />}
      {children(sx, sy)}
    </svg>
  )
}

/** 関数 f を区間で標本化して SVG の path 文字列にする。範囲外は描画範囲に丸める。 */
export function curvePath(
  f: (x: number) => number,
  xDomain: [number, number],
  yDomain: [number, number],
  sx: Scale,
  sy: Scale,
  n = 120,
) {
  const [x0, x1] = xDomain
  const clamp = (y: number) => Math.min(Math.max(y, yDomain[0] - 1), yDomain[1] + 1)
  let d = ''
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    d += `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(clamp(f(x))).toFixed(1)} `
  }
  return d
}
