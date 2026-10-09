// 外部リンクの確認(freshness.mjs と review-pack.mjs が使う)。ネットワークが要る。
// 切れている(404・410・ドメインが見つからない)ものだけを「切れ」とし、ボットを拒む可能性のある応答(403・405・429・5xx・時間切れ)は「確認できない」として、手元で確かめる扱いにする。

export async function checkUrl(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; dokushu-academia-linkcheck)' } })
      if (res.status < 400) return { kind: 'ok' }
      if (res.status === 404 || res.status === 410) return { kind: 'broken', note: String(res.status) }
      if (method === 'GET') return { kind: 'unverifiable', note: String(res.status) }
    } catch (e) {
      const code = e?.cause?.code ?? e?.name
      if (method === 'GET') return code === 'ENOTFOUND' ? { kind: 'broken', note: 'ドメインが見つからない' } : { kind: 'unverifiable', note: String(code) }
    }
  }
  return { kind: 'unverifiable' }
}

/** urls: Iterable<string>。結果: [{ url, kind, note? }] */
export async function checkLinks(urls, concurrency = 6) {
  const queue = [...urls]
  const results = []
  await Promise.all(Array.from({ length: concurrency }, async () => { for (let u; (u = queue.shift()); ) results.push({ url: u, ...(await checkUrl(u)) }) }))
  return results
}
