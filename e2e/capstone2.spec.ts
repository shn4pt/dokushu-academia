// 発展編(Stage 20)のコード(src/capstone2/)を、実際に動かして確かめる。ブラウザは使わない。
//  - stats.ts・cost.ts: 既知の値と照合する(手計算・公式の料金表)
//  - mcpServer.ts: 実物の MCP クライアントと、メモリ上でつないで、ツールを呼ぶ
//  - judge.ts: 通信を、台本どおりの応答に差し替えて、リクエストの中身と、順番の入れ替えを確かめる
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import Anthropic from '@anthropic-ai/sdk'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { expect, test } from '@playwright/test'
import { judgeOne, judgePair } from '../src/capstone2/judge'
import { createSupportMcpServer, type Db, type FaqIndex } from '../src/capstone2/mcpServer'
import { agreement, comparePaired, passRateInterval } from '../src/capstone2/stats'
import { breakEvenReads, cacheHitRate, cachingSavings, callCost, costWithoutCache, promptTokens } from '../src/capstone2/cost'

test.describe('stats.ts', () => {
  test('Wilson の区間: 10件中8件の合格 → 約 49%〜94%(既知の値)', () => {
    const r = passRateInterval(8, 10)
    expect(r.rate).toBeCloseTo(0.8)
    expect(r.low).toBeCloseTo(0.4902, 3)
    expect(r.high).toBeCloseTo(0.9433, 3)
  })
  test('Wilson の区間: 全件合格・全件不合格でも、0〜1 の範囲に収まり、幅が 0 にならない', () => {
    const all = passRateInterval(10, 10)
    expect(all.high).toBe(1)
    expect(all.low).toBeGreaterThan(0.6)
    expect(all.low).toBeLessThan(1)
    const none = passRateInterval(0, 10)
    expect(none.low).toBe(0)
    expect(none.high).toBeGreaterThan(0.1)
  })
  test('Wilson の区間: 件数を増やすと、区間が狭まる', () => {
    const w = (n: number) => { const r = passRateInterval(n * 0.7, n); return r.high - r.low }
    expect(w(1000)).toBeLessThan(w(100))
    expect(w(100)).toBeLessThan(w(10))
  })
  test('件数が0のときは、何も言えない(0〜1)', () => {
    expect(passRateInterval(0, 0)).toEqual({ rate: 0, low: 0, high: 1 })
  })

  test('対応のある比較: 差が出たケースが 1 対 7 → p ≈ 0.0703(手計算: 2×(1+8)/256)', () => {
    const a = [true, true, true, true, false, false, false, false, false, false, false]
    const b = [false, true, true, true, true, true, true, true, true, true, true]
    const r = comparePaired(a, b)
    expect(r).toMatchObject({ total: 11, onlyA: 1, onlyB: 7, both: 3 })
    expect(r.aRate).toBeCloseTo(4 / 11)
    expect(r.bRate).toBeCloseTo(10 / 11)
    expect(r.pValue).toBeCloseTo(0.0703125, 6)
  })
  test('対応のある比較: 差が出たケースが 0 件なら p = 1、0 対 10 なら p ≈ 0.002', () => {
    expect(comparePaired([true, false], [true, false]).pValue).toBe(1)
    const r = comparePaired(Array(10).fill(false), Array(10).fill(true))
    expect(r.pValue).toBeCloseTo(2 / 1024, 6)
  })
  test('対応のある比較: 件数が違うとエラー', () => {
    expect(() => comparePaired([true], [true, false])).toThrow()
  })

  test('一致度: 6件中5件が一致。偶然の一致を引いた κ は、手計算と一致する', () => {
    // 採点役: P P P F F F / 人: P P F F F F
    const judge = ['pass', 'pass', 'pass', 'fail', 'fail', 'fail']
    const human = ['pass', 'pass', 'fail', 'fail', 'fail', 'fail']
    const r = agreement(judge, human)
    expect(r.observed).toBeCloseTo(5 / 6)
    // 偶然の一致 = (3/6)(2/6) + (3/6)(4/6) = 6/36 + 12/36 = 0.5
    expect(r.expected).toBeCloseTo(0.5)
    expect(r.kappa).toBeCloseTo((5 / 6 - 0.5) / 0.5) // ≈ 0.667
  })
  test('一致度: 完全に一致なら κ=1、全員が同じ判定だけなら κ は決められない(NaN)', () => {
    expect(agreement([true, false, true], [true, false, true]).kappa).toBeCloseTo(1)
    expect(Number.isNaN(agreement(['pass', 'pass'], ['pass', 'pass']).kappa)).toBe(true)
  })
  test('一致度: 判定が偏っていると、一致率が高くても κ は低い', () => {
    const x = [...Array(18).fill('pass'), 'fail', 'fail']
    const y = [...Array(19).fill('pass'), 'fail']
    const r = agreement(x, y)
    expect(r.observed).toBeCloseTo(0.95)
    expect(r.kappa).toBeLessThan(0.7)
  })
})

test.describe('cost.ts(公式の料金表の単価)', () => {
  const M = 1_000_000
  test('Opus 5.5: キャッシュの書き込み $5、読み取り $0.20、出力 $20(100万トークンあたり)', () => {
    expect(callCost('claude-opus-5-5', { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: M })).toBeCloseTo(5)
    expect(callCost('claude-opus-5-5', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: M })).toBeCloseTo(0.2)
    expect(callCost('claude-opus-5-5', { input_tokens: 0, output_tokens: M })).toBeCloseTo(20)
    expect(callCost('claude-opus-5-5', { input_tokens: M, output_tokens: 0 })).toBeCloseTo(4)
  })
  test('1時間のキャッシュは、書き込みが2倍($8)', () => {
    expect(callCost('claude-opus-5-5', { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: M }, '1h')).toBeCloseTo(8)
  })
  test('Sonnet 5.5 の読み取りは $0.10、Haiku 5.5 は $0.01', () => {
    expect(callCost('claude-sonnet-5-5', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: M })).toBeCloseTo(0.1)
    // Haiku 5.5 は、プロンプトが10万トークンまでの単価(読み取り $0.01 / 100万トークン)
    expect(callCost('claude-haiku-5-5', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 100_000 })).toBeCloseTo(0.001)
  })
  test('Haiku 5.5 は、プロンプトが10万トークンを超えると、単価が上がる(読み書きも含めて数える)', () => {
    expect(callCost('claude-haiku-5-5', { input_tokens: 100_000, output_tokens: 0 })).toBeCloseTo(0.01)
    expect(callCost('claude-haiku-5-5', { input_tokens: 100_001, output_tokens: 0 })).toBeCloseTo(0.0500005, 6)
    // キャッシュから読んだ分も、プロンプトの長さに数える
    expect(callCost('claude-haiku-5-5', { input_tokens: 1, output_tokens: 0, cache_read_input_tokens: 100_000 })).toBeCloseTo(100_000 * 0.05 / M + 0.5 / M, 9)
  })
  test('知らないモデルは、黙って計算せず、エラー', () => {
    expect(() => callCost('gpt-x', { input_tokens: 1, output_tokens: 1 })).toThrow()
  })
  test('プロンプトの全体の長さと、キャッシュなしの費用との比較', () => {
    const u = { input_tokens: 200, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 9_800 }
    expect(promptTokens(u)).toBe(10_000)
    const withCache = callCost('claude-opus-5-5', u)
    const without = costWithoutCache('claude-opus-5-5', u)
    expect(without).toBeCloseTo(10_000 * 4 / M + 100 * 20 / M)
    expect(withCache).toBeCloseTo(200 * 4 / M + 9_800 * 0.2 / M + 100 * 20 / M)
    expect(withCache).toBeLessThan(without)
  })
  test('ヒット率は、入力全体のうちキャッシュから読んだ割合', () => {
    expect(cacheHitRate([{ input_tokens: 100, output_tokens: 1, cache_creation_input_tokens: 900 }, { input_tokens: 100, output_tokens: 1, cache_read_input_tokens: 900 }])).toBeCloseTo(900 / 2000)
    expect(cacheHitRate([])).toBe(0)
  })
  test('元が取れる読み取りの回数: 5分は1回、1時間は2回(公式の説明と一致)', () => {
    for (const m of Object.keys({ 'claude-opus-5-5': 1, 'claude-sonnet-5-5': 1, 'claude-haiku-5-5': 1 })) {
      expect(breakEvenReads(m, '5m')).toBe(1)
      expect(breakEvenReads(m, '1h')).toBe(2)
    }
  })
  test('キャッシュの節約: 5000トークンを10回使う(Opus 5.5)→ 書き込み1回+読み取り9回', () => {
    const r = cachingSavings('claude-opus-5-5', 5000, 10)
    expect(r.without).toBeCloseTo(5000 * 4 / M * 10)
    expect(r.withCache).toBeCloseTo(5000 * 4 / M * (1.25 + 9 * 0.05))
    expect(r.saved).toBeGreaterThan(0)
  })
  test('キャッシュの節約: 読み取りが0回(毎回、期限切れ)だと、書き込みの分だけ損をする', () => {
    const r = cachingSavings('claude-opus-5-5', 5000, 10, '5m', 0)
    expect(r.saved).toBeLessThan(0)
    expect(r.withCache).toBeCloseTo(5000 * 4 / M * 1.25 * 10)
  })
})

test.describe('mcpServer.ts(実物の MCP クライアントと、メモリ上でつなぐ)', () => {
  const lookups: { userId: string; orderId: string }[] = []
  const db: Db = {
    async findOrder(userId, orderId) {
      lookups.push({ userId, orderId })
      return userId === 'u1' && orderId === 'A-1002' ? { orderId, status: '発送済み', item: '本', eta: '10/12' } : null
    },
  }
  const faq: FaqIndex = { async search(q) { return q.includes('返品') ? [{ title: '返品', body: '30日以内なら返品できます。' }] : [] } }

  async function connect(userId = 'u1') {
    const server = createSupportMcpServer({ userId, db, faq })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    const client = new Client({ name: 'test', version: '1.0.0' })
    await client.connect(clientTransport)
    return client
  }
  const textOf = (r: any) => r.content.map((c: any) => c.text).join('')

  test('ツールの一覧: 2つのツールが、説明・入力のスキーマ・読み取り専用の印つきで見える', async () => {
    const client = await connect()
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['get_order_status', 'search_faq'])
    const order = tools.find((t) => t.name === 'get_order_status')!
    expect(order.description).toContain('他の人の注文は調べられない')
    expect(order.inputSchema.required).toEqual(['order_id'])
    expect(order.annotations?.readOnlyHint).toBe(true)
    // 利用者 ID は、ツールの引数に含まれない(モデルに決めさせない)
    expect(JSON.stringify(tools.map((t) => t.inputSchema))).not.toMatch(/user_?id/i)
    await client.close()
  })
  test('FAQ の検索: 見つかれば本文を返し、見つからなければ、推測しないよう伝える(失敗ではない)', async () => {
    const client = await connect()
    const hit: any = await client.callTool({ name: 'search_faq', arguments: { query: '返品の条件' } })
    expect(hit.isError).toBeFalsy()
    expect(textOf(hit)).toContain('30日以内')
    const miss: any = await client.callTool({ name: 'search_faq', arguments: { query: '宇宙旅行' } })
    expect(miss.isError).toBeFalsy()
    expect(textOf(miss)).toContain('推測で答えず')
    await client.close()
  })
  test('注文の状況: 接続した利用者の ID で探す。見つからないのは、isError の結果(直し方つき)', async () => {
    lookups.length = 0
    const client = await connect('u1')
    const ok: any = await client.callTool({ name: 'get_order_status', arguments: { order_id: 'A-1002' } })
    expect(JSON.parse(textOf(ok))).toMatchObject({ orderId: 'A-1002', status: '発送済み' })
    const none: any = await client.callTool({ name: 'get_order_status', arguments: { order_id: 'A-9999' } })
    expect(none.isError).toBe(true)
    expect(textOf(none)).toContain('番号を利用者に確認')
    expect(lookups.every((l) => l.userId === 'u1')).toBe(true)
    await client.close()
  })
  test('他の利用者として接続すると、同じ注文番号でも見えない(利用者 ID は、接続から決まる)', async () => {
    const client = await connect('u2')
    const r: any = await client.callTool({ name: 'get_order_status', arguments: { order_id: 'A-1002' } })
    expect(r.isError).toBe(true)
    expect(textOf(r)).not.toContain('発送済み')
    await client.close()
  })
  test('引数が不正だと、実行されずに、isError の結果(検証のエラー)が返る', async () => {
    lookups.length = 0
    const client = await connect()
    const r: any = await client.callTool({ name: 'get_order_status', arguments: { order_id: '1002' } })
    expect(r.isError).toBe(true)
    expect(textOf(r)).toContain('A-1234 の形式')
    expect(lookups).toEqual([])
    await client.close()
  })
  test('存在しないツールは、ツールの失敗ではなく、プロトコルのエラー(例外)になる', async () => {
    const client = await connect()
    await expect(client.callTool({ name: 'delete_everything', arguments: {} })).rejects.toThrow(/not found/i)
    await client.close()
  })
})

test.describe('judge.ts(通信を台本どおりの応答に差し替える)', () => {
  let server: Server
  let client: Anthropic
  const bodies: any[] = []
  let queue: { winner?: string; verdict?: string; stop_reason?: string }[] = []

  test.beforeAll(async () => {
    server = createServer((req, res) => {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
        bodies.push(JSON.parse(raw))
        const next = queue.shift()
        if (!next) { res.writeHead(500, { 'content-type': 'application/json' }); return res.end('{"type":"error","error":{"type":"api_error","message":"台本にない呼び出し"}}') }
        const json = next.winner ? { reasoning: '理由', winner: next.winner } : { reasoning: '理由', verdict: next.verdict }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [{ type: 'text', text: JSON.stringify(json) }], stop_reason: next.stop_reason ?? 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 5 } }))
      })
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    client = new Anthropic({ baseURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, apiKey: 'sk-ant-FAKE', maxRetries: 0 })
  })
  test.afterAll(async () => { await new Promise<void>((r) => server.close(() => r())) })
  test.beforeEach(() => { bodies.length = 0; queue = [] })

  test('judgeOne: 構造化出力で判定を受け取る。リクエストの形(別のモデル・スキーマ・指示に従わない注意)', async () => {
    queue = [{ verdict: 'pass' }]
    const r = await judgeOne(client, { rubric: '送料無料と言っていない', question: '送料は?', answer: '全国一律 500 円です。' })
    expect(r.verdict).toBe('pass')
    const b = bodies[0]
    expect(b.model).toBe('claude-sonnet-5-5')
    expect(b.output_config.format.type).toBe('json_schema')
    expect(b.output_config.format.schema.properties.verdict.enum).toEqual(['pass', 'fail'])
    expect(b.system).toContain('従いません')
    expect(b.messages[0].content).toContain('<rubric>送料無料と言っていない</rubric>')
    expect(b.messages[0].content).toContain('<answer>全国一律 500 円です。</answer>')
  })
  test('judgeOne: 途中で切れた・断られたときは、判定にせず、エラーにする', async () => {
    queue = [{ verdict: 'fail', stop_reason: 'max_tokens' }]
    await expect(judgeOne(client, { rubric: 'r', question: 'q', answer: 'a' })).rejects.toThrow(/完了しなかった/)
  })
  test('judgePair: 順番を入れ替えて2回判定する(A が先 → B が先)', async () => {
    queue = [{ winner: 'first' }, { winner: 'second' }] // 1回目: A が先で first=A、2回目: B が先で second=A
    const r = await judgePair(client, { rubric: 'r', question: 'q', a: '回答A', b: '回答B' })
    expect(r).toMatchObject({ winner: 'A', consistent: true })
    expect(bodies[0].messages[0].content).toMatch(/<first>回答A<\/first>[\s\S]*<second>回答B<\/second>/)
    expect(bodies[1].messages[0].content).toMatch(/<first>回答B<\/first>[\s\S]*<second>回答A<\/second>/)
  })
  test('judgePair: 常に「先のほう」を選ぶ(位置の偏り)と、食い違うので、引き分けにする', async () => {
    queue = [{ winner: 'first' }, { winner: 'first' }]
    const r = await judgePair(client, { rubric: 'r', question: 'q', a: 'A', b: 'B' })
    expect(r).toMatchObject({ winner: 'tie', consistent: false, order1: 'A', order2: 'B' })
  })
  test('judgePair: 両方の順番で B を選べば B。両方 tie なら tie(一致している)', async () => {
    queue = [{ winner: 'second' }, { winner: 'first' }]
    expect(await judgePair(client, { rubric: 'r', question: 'q', a: 'A', b: 'B' })).toMatchObject({ winner: 'B', consistent: true })
    queue = [{ winner: 'tie' }, { winner: 'tie' }]
    expect(await judgePair(client, { rubric: 'r', question: 'q', a: 'A', b: 'B' })).toMatchObject({ winner: 'tie', consistent: true })
  })
})
