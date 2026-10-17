// 配信の可否の判定(Issue #32、docs/seo/ci-plan.md §5)。**ローカルの設計・検証用。workflow には、つないでいない**(草案 deploy.yml の deploy ジョブが、呼ぶ)。
//   node scripts/ci-publish-gate.mjs <この実行の SHA> <main の先頭の SHA(取得できなければ空)>
// 配信のジョブは、`concurrency: pages`(排他・取り消さない)の**中**で、この判定を最初のステップとして行う。判定から実配信までが、同じ排他区間になり、
// 「判定の後に、より新しい版が配信された」ことは起きない(新しい版の配信は、この区間が終わるまで、待つ)。
// 配信してよいのは、**この実行の SHA が、main の先頭のとき**だけ。先頭が取得できない場合も、**配信しない**(旧版を公開しうる側へ進めない)。
import { pathToFileURL } from 'node:url'

/** @returns {{ publish: boolean, reason: string }} */
export function gate(sha, head) {
  if (!sha) return { publish: false, reason: 'この実行の SHA が不明のため、配信しない' }
  if (!head) return { publish: false, reason: 'main の先頭を取得できないため、配信しない(旧版を公開しうる側へ進めない)' }
  if (head === sha) return { publish: true, reason: 'この実行が main の先頭のため、配信する' }
  return { publish: false, reason: `より新しい main(${head})があるため、配信しない(新しい実行が、基準=最後の配信なので、差を含めて配信する)` }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const r = gate(process.argv[2], process.argv[3])
  console.log(r.reason)
  process.exit(r.publish ? 0 : 1) // 配信しない場合は、ジョブを失敗にする(成功として『配信済み』と記録されない。失敗は、基準の読み取りの『成功』に数えない)
}
