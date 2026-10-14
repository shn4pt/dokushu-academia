import { audience } from '../data/course-entry'

/** 想定する読者と、持ち帰れる価値。講座一覧と地図に出す。読者設定は作者の方針で、検証済みではないことも示す。 */
export default function AudienceNote() {
  return (
    <section className="card audience-note" aria-label="想定する読者と約束">
      <strong>{audience.promise}</strong>
      <p>{audience.short}</p>
      <details>
        <summary>対象の読者と、約束しないこと</summary>
        <p>{audience.reader}</p>
        <p>{audience.background}</p>
        <p>{audience.notPromised}</p>
      </details>
    </section>
  )
}
