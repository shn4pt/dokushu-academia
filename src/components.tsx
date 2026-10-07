import type { StageStatus } from './data/stats'

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}

const statusLabel: Record<StageStatus, string> = {
  todo: '未着手',
  doing: '学習中',
  done: '完了',
  empty: '準備中',
}

export const StatusBadge = ({ status }: { status: StageStatus }) => (
  <span className={`badge badge-${status}`}>{statusLabel[status]}</span>
)

export function NumInput({
  value,
  onChange,
  label,
  step = 0.5,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  step?: number
}) {
  return (
    <input
      type="number"
      className="num-input"
      aria-label={label}
      value={value}
      step={step}
      onChange={(e) => {
        const v = e.target.valueAsNumber
        if (!Number.isNaN(v)) onChange(v)
      }}
    />
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <label className="row slider-row">
      <span className="slider-label">{label} = {format(value)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
