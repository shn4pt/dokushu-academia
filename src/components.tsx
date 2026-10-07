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
