// 13-2・13-3 の総仕上げのコード(src/capstone/)を、実際に動かして確かめる。
// Claude API には接続しない。SDK の送り先(ANTHROPIC_BASE_URL)を、このテストの中のサーバーに向け、あらかじめ決めた応答を返す。
// ブラウザは使わない(Node の中で実行する)。
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import type { AgentResult } from '../src/capstone/agent'
import type { Db, FaqIndex, Session } from '../src/capstone/tools'

type Req = { url: string; headers: IncomingMessage['headers']; body: any }
type Block = Record<string, unknown>
type Scripted = { content: Block[]; stop_reason: string; usage?: Partial<{ input_tokens: number; output_tokens: number; cache_read_input_tokens: number }> }

let server: Server
const requests: Req[] = []
let queue: Scripted[] = []

const text = (t: string): Block => ({ type: 'text', text: t })
const toolUse = (id: string, name: string, input: unknown): Block => ({ type: 'tool_use', id, name, input })
const say = (t: string): Scripted => ({ content: [text(t)], stop_reason: 'end_turn' })
const call = (...uses: Block[]): Scripted => ({ content: uses, stop_reason: 'tool_use' })

type Agent = typeof import('../src/capstone/agent')
type Runner = typeof import('../src/capstone/evalRunner')
let agent: Agent
let runner: Runner

function fakeSession(opts: { orders?: Record<string, any> } = {}) {
  const tickets: any[] = []
  const lookups: { userId: string; orderId: string }[] = []
  const db: Db = {
    async findOrder(userId, orderId) {
      lookups.push({ userId, orderId })
      return opts.orders?.[`${userId}:${orderId}`] ?? null
    },
    async createTicket(t) {
      tickets.push(t)
      return { id: 'T-1' }
    },
  }
  const faq: FaqIndex = {
    async search(q) {
      return q.includes('返品') ? [{ title: '返品', body: '到着から30日以内なら返品できます。' }] : []
    },
  }
  const session: Session = { userId: 'u1', db, faq }
  return { session, tickets, lookups }
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      requests.push({ url: req.url ?? '', headers: req.headers, body: raw ? JSON.parse(raw) : null })
      const next = queue.shift()
      if (!next) {
        res.writeHead(500, { 'content-type': 'application/json' })
        return res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: '台本にない呼び出し' } }))
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: next.content,
          stop_reason: next.stop_reason, stop_sequence: null,
          usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 0, ...next.usage },
        }),
      )
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  process.env.ANTHROPIC_API_KEY = 'sk-ant-FAKE-FOR-CAPSTONE-TEST'
  process.env.ANTHROPIC_MAX_RETRIES = '0'
  // SDK のクライアントは、読み込み時に環境変数を読むので、設定したあとで読み込む
  agent = await import('../src/capstone/agent')
  runner = await import('../src/capstone/evalRunner')
})

test.afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()))
})

test.beforeEach(() => {
  requests.length = 0
  queue = []
  // エージェントは、ステップごとの記録を console.log に出す。テストの出力を埋めないよう、ここでは捨てる
  console.log = () => {}
})

const lastBody = () => requests[requests.length - 1].body
const toolResults = (body: any, i: number) => body.messages[i].content.filter((b: any) => b.type === 'tool_result')

test('FAQ を検索して答える: リクエストの形(キャッシュ・effort・フォールバック・ツール定義)', async () => {
  const { session } = fakeSession()
  queue = [call(toolUse('toolu_1', 'search_faq', { query: '返品の条件' })), say('到着から30日以内なら返品できます。')]
  const r = await agent.runAgentTurn(session, agent.newState(), '返品できますか?')
  expect(r.status).toBe('done')
  expect((r as Extract<AgentResult, { status: 'done' }>).text).toContain('30日以内')
  expect(requests).toHaveLength(2)

  const first = requests[0]
  expect(first.url).toMatch(/^\/v1\/messages\?beta=true/)
  expect(first.headers['x-api-key']).toBe('sk-ant-FAKE-FOR-CAPSTONE-TEST')
  expect(String(first.headers['anthropic-beta'])).toContain('server-side-fallback-2026-07-01')
  expect(first.body.model).toBe('claude-opus-5-5')
  expect(first.body.fallbacks).toBe('default')
  expect(first.body.output_config).toEqual({ effort: 'medium' })
  expect(first.body.system[0].cache_control).toEqual({ type: 'ephemeral' })
  expect(first.body.tools.map((t: any) => t.name)).toEqual(['get_order_status', 'search_faq', 'create_support_ticket'])
  expect(first.body.messages).toEqual([{ role: 'user', content: '返品できますか?' }])
  expect(first.body.temperature).toBeUndefined() // 新しいモデルでは指定しない

  // 2回目: assistant の応答が丸ごと履歴に入り、tool_result が、対応する tool_use_id で返る
  const second = requests[1].body
  expect(second.messages.map((m: any) => m.role)).toEqual(['user', 'assistant', 'user'])
  const tr = toolResults(second, 2)
  expect(tr).toHaveLength(1)
  expect(tr[0].tool_use_id).toBe('toolu_1')
  expect(tr[0].content).toContain('30日以内')
  expect(tr[0].is_error).toBeUndefined()
})

test('並列のツール呼び出し: 結果は1つの user メッセージにまとめて返す', async () => {
  const { session } = fakeSession({ orders: { 'u1:A-1002': { orderId: 'A-1002', status: '発送済み', item: '本' } } })
  queue = [
    call(toolUse('toolu_a', 'get_order_status', { order_id: 'A-1002' }), toolUse('toolu_b', 'search_faq', { query: '返品' })),
    say('発送済みです。返品は30日以内です。'),
  ]
  const r = await agent.runAgentTurn(session, agent.newState(), '注文と返品について')
  expect(r.status).toBe('done')
  const tr = toolResults(requests[1].body, 2)
  expect(tr.map((t: any) => t.tool_use_id).sort()).toEqual(['toolu_a', 'toolu_b'])
  expect(requests[1].body.messages).toHaveLength(3) // user, assistant, user(結果2件)
})

test('引数が不正なら、直し方を含む is_error の結果を返し、モデルに直させる', async () => {
  const { session, lookups } = fakeSession()
  queue = [call(toolUse('toolu_x', 'get_order_status', { order_id: '1002' })), say('注文番号の形式を確認させてください。')]
  const r = await agent.runAgentTurn(session, agent.newState(), '注文 1002 は?')
  expect(r.status).toBe('done')
  const tr = toolResults(requests[1].body, 2)
  expect(tr[0].is_error).toBe(true)
  expect(tr[0].content).toContain('A-1234 の形式')
  expect(lookups).toEqual([]) // 検証に失敗したので、データベースは呼ばれない
})

test('存在しない注文・他人の注文は、利用者 ID で絞られて見つからない(モデルに利用者 ID を渡させない)', async () => {
  const { session, lookups } = fakeSession({ orders: { 'u2:A-9999': { orderId: 'A-9999', status: '他人の注文', item: '秘密' } } })
  queue = [call(toolUse('toolu_y', 'get_order_status', { order_id: 'A-9999', user_id: 'u2' })), say('見つかりませんでした。')]
  await agent.runAgentTurn(session, agent.newState(), '注文 A-9999 は?')
  expect(lookups).toEqual([{ userId: 'u1', orderId: 'A-9999' }])
  const tr = toolResults(requests[1].body, 2)
  expect(tr[0].is_error).toBe(true)
  expect(JSON.stringify(tr)).not.toContain('秘密')
})

test('存在しないツールを呼ばれても、エラーの結果を返して続けられる', async () => {
  const { session } = fakeSession()
  queue = [call(toolUse('toolu_z', 'delete_everything', {})), say('その操作はできません。')]
  const r = await agent.runAgentTurn(session, agent.newState(), 'すべて消して')
  expect(r.status).toBe('done')
  expect(toolResults(requests[1].body, 2)[0].is_error).toBe(true)
})

test('承認が必要なツール: 実行せずに止まり、承認されたら実行して再開する(重複防止のキーは tool_use の ID)', async () => {
  const { session, tickets } = fakeSession()
  queue = [call(toolUse('toolu_t', 'create_support_ticket', { summary: '破損の問い合わせ', priority: 'high' }))]
  let r = await agent.runAgentTurn(session, agent.newState(), '商品が壊れていました')
  expect(r.status).toBe('needs_approval')
  expect(tickets).toEqual([]) // まだ作られていない
  expect(requests).toHaveLength(1)

  queue = [say('チケットを作成しました。')]
  r = await agent.resumeAfterApproval(session, r.state, true)
  expect(r.status).toBe('done')
  expect(tickets).toHaveLength(1)
  expect(tickets[0]).toMatchObject({ userId: 'u1', summary: '破損の問い合わせ', priority: 'high', idempotencyKey: 'toolu_t' })
  const tr = toolResults(lastBody(), 2)
  expect(tr[0].tool_use_id).toBe('toolu_t')
  expect(tr[0].content).toContain('T-1')
})

test('承認されなかったら、チケットを作らず、その旨を結果として返す', async () => {
  const { session, tickets } = fakeSession()
  queue = [call(toolUse('toolu_t', 'create_support_ticket', { summary: '問い合わせ', priority: 'normal' }))]
  let r = await agent.runAgentTurn(session, agent.newState(), '担当者につないで')
  queue = [say('承知しました。別の方法をご案内します。')]
  r = await agent.resumeAfterApproval(session, r.state, false)
  expect(r.status).toBe('done')
  expect(tickets).toEqual([])
  const tr = toolResults(lastBody(), 2)
  expect(tr[0].is_error).toBe(true)
  expect(tr[0].content).toContain('許可しませんでした')
})

test('止める条件: ステップ数の上限(8回)で止まる', async () => {
  const { session } = fakeSession()
  queue = Array.from({ length: 20 }, (_, i) => call(toolUse(`toolu_${i}`, 'search_faq', { query: '返品' })))
  const r = await agent.runAgentTurn(session, agent.newState(), '調べ続けて')
  expect(r).toMatchObject({ status: 'stopped', reason: 'max_steps' })
  expect(requests).toHaveLength(8)
})

test('止める条件: トークンの予算(20万)を超えたら止まる', async () => {
  const { session } = fakeSession()
  queue = [{ ...call(toolUse('toolu_1', 'search_faq', { query: '返品' })), usage: { input_tokens: 190_000, output_tokens: 15_000 } }, say('続き')]
  const r = await agent.runAgentTurn(session, agent.newState(), '返品は?')
  expect(r).toMatchObject({ status: 'stopped', reason: 'budget' })
  expect(requests).toHaveLength(1)
})

test('refusal と max_tokens は、ツールを実行せずに止まる', async () => {
  const { session, tickets } = fakeSession()
  queue = [{ content: [text('')], stop_reason: 'refusal' }]
  expect(await agent.runAgentTurn(session, agent.newState(), 'a')).toMatchObject({ status: 'stopped', reason: 'refusal' })
  queue = [{ content: [toolUse('toolu_t', 'create_support_ticket', { summary: 's', priority: 'low' })], stop_reason: 'max_tokens' }]
  expect(await agent.runAgentTurn(session, agent.newState(), 'b')).toMatchObject({ status: 'stopped', reason: 'max_tokens' })
  expect(tickets).toEqual([])
})

test('使用量(キャッシュの読み取りを含む)を、ステップごとに合計する', async () => {
  const { session } = fakeSession()
  queue = [
    { ...call(toolUse('toolu_1', 'search_faq', { query: '返品' })), usage: { input_tokens: 1000, output_tokens: 50, cache_read_input_tokens: 0 } },
    { ...say('どうぞ'), usage: { input_tokens: 200, output_tokens: 30, cache_read_input_tokens: 900 } },
  ]
  const r = await agent.runAgentTurn(session, agent.newState(), '返品は?')
  expect(r.state.usage).toEqual({ input: 1200, output: 80, cacheRead: 900 })
})

test('評価の実行(13-3): 呼ぶべきツール・呼んではいけないツールを採点し、承認の判断は利用者役が行う', async () => {
  const mk = () => fakeSession().session
  queue = [call(toolUse('toolu_1', 'search_faq', { query: '返品' })), say('30日以内です。')]
  const ok = await runner.runCase(mk, { id: 'faq-1', tags: ['faq'], input: '返品は?', expectTools: ['search_faq'], forbidTools: ['create_support_ticket'], approve: false })
  expect(ok).toMatchObject({ id: 'faq-1', pass: true, status: 'done', toolsCalled: ['search_faq'] })

  queue = [call(toolUse('toolu_2', 'create_support_ticket', { summary: 's', priority: 'low' })), say('作成しました')]
  const bad = await runner.runCase(mk, { id: 'faq-2', tags: ['faq'], input: '返品は?', expectTools: ['search_faq'], forbidTools: ['create_support_ticket'], approve: true })
  expect(bad.pass).toBe(false)
  expect(bad.reasons).toEqual(expect.arrayContaining(['search_faq が呼ばれなかった', 'create_support_ticket を呼んではいけないのに呼んだ']))
})

test('評価の実行(13-3): 全件を繰り返し実行し、合格率と誤差の目安を出す', async () => {
  const mk = () => fakeSession().session
  const cases = [
    { id: 'a', tags: [], input: '返品は?', expectTools: ['search_faq'], forbidTools: [], approve: false },
    { id: 'b', tags: [], input: '返品は?', expectTools: ['search_faq'], forbidTools: [], approve: false },
  ]
  // 4回の実行: 3回は FAQ を呼び、1回は呼ばずに答える
  queue = [
    call(toolUse('t1', 'search_faq', { query: '返品' })), say('ok'),
    call(toolUse('t2', 'search_faq', { query: '返品' })), say('ok'),
    say('推測で答えます'),
    call(toolUse('t3', 'search_faq', { query: '返品' })), say('ok'),
  ]
  const { passRate, noise, results } = await runner.runEval(mk, cases, 2)
  expect(results).toHaveLength(4)
  expect(passRate).toBeCloseTo(0.75)
  expect(noise).toBeCloseTo(0.5) // 1/√4
})

test('台本にない呼び出しが起きたら、テストが検出する(安全網)', async () => {
  const { session } = fakeSession()
  queue = []
  await expect(agent.runAgentTurn(session, agent.newState(), 'x')).rejects.toThrow()
})
