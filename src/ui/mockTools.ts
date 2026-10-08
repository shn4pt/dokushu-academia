import type Anthropic from '@anthropic-ai/sdk'

// ツール呼び出しループの演習で使う、ブラウザ内で動く模擬のツール。
// データは架空のもので、外部とは通信しない。

export type ToolOutcome = { content: string; isError?: boolean }

export type ToolSpec = {
  def: Anthropic.Beta.BetaTool
  run: (input: Record<string, unknown>) => ToolOutcome
  /** 副作用があり、実行前に利用者の承認が必要か */
  needsApproval?: boolean
}

const orders: Record<string, { status: string; item: string; eta?: string; carrier?: string }> = {
  'A-1001': { status: '発送済み', item: 'ワイヤレスイヤホン', carrier: 'ヤマト運輸', eta: '10月10日' },
  'A-1002': { status: '倉庫で準備中', item: 'USB-C 充電器', eta: '10月14日(予定)' },
  'A-1003': { status: 'キャンセル済み', item: 'モバイルバッテリー' },
}

const faqs = [
  { q: '返品・交換の条件', a: '商品到着後14日以内で、未使用・付属品がそろっている場合に返品できます。初期不良は送料当社負担で交換します。' },
  { q: '配送にかかる日数', a: '在庫がある商品は、ご注文から2〜4日でお届けします。離島は追加で2〜3日かかります。' },
  { q: '支払い方法', a: 'クレジットカード、コンビニ払い、銀行振込に対応しています。' },
  { q: '領収書の発行', a: '注文履歴の画面から、領収書を PDF でダウンロードできます。宛名は変更できます。' },
]

const bigrams = (s: string) => {
  const t = s.replace(/[\s、。?!?!]/g, '')
  const out = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2))
  return out
}

let ticketSeq = 1000

export const supportTools: ToolSpec[] = [
  {
    def: {
      name: 'get_order_status',
      description:
        '注文番号から、注文の状況(発送状況、配送業者、お届け予定日)を調べる。利用者が注文の状況や届く日を尋ねたときに使う。',
      input_schema: {
        type: 'object',
        properties: { order_id: { type: 'string', description: '注文番号。A-1234 の形式' } },
        required: ['order_id'],
      },
    },
    run: (input) => {
      const id = typeof input.order_id === 'string' ? input.order_id.trim().toUpperCase() : ''
      if (!/^A-\d{4}$/.test(id)) return { content: `注文番号の形式が正しくありません(受け取った値: ${JSON.stringify(input.order_id)})。A-1234 の形式で指定してください。`, isError: true }
      const o = orders[id]
      if (!o) return { content: `注文 ${id} は見つかりませんでした。番号を利用者に確認してください。`, isError: true }
      return { content: JSON.stringify({ order_id: id, ...o }) }
    },
  },
  {
    def: {
      name: 'search_faq',
      description: 'よくある質問(返品、配送日数、支払い、領収書など)を検索する。店舗の方針や手続きについて答える前に使う。',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: '調べたい内容を短く(例: 返品の条件)' } },
        required: ['query'],
      },
    },
    run: (input) => {
      const q = typeof input.query === 'string' ? input.query : ''
      if (!q.trim()) return { content: 'query が空です。調べたい内容を指定してください。', isError: true }
      const qb = bigrams(q)
      const hits = faqs
        .map((f) => {
          const fb = bigrams(f.q + f.a)
          let n = 0
          qb.forEach((g) => fb.has(g) && n++)
          return { f, n }
        })
        .filter((h) => h.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 2)
      if (hits.length === 0) return { content: '該当する FAQ はありませんでした。' }
      return { content: hits.map((h) => `【${h.f.q}】${h.f.a}`).join('\n') }
    },
  },
  {
    needsApproval: true,
    def: {
      name: 'create_support_ticket',
      description:
        'サポート担当者への問い合わせチケットを作成する。FAQ や注文情報で解決できず、人の対応が必要なときだけ使う。作成すると担当者に通知される。',
      input_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: '担当者向けの要約(1〜2文)' },
          priority: { type: 'string', enum: ['high', 'normal', 'low'], description: '緊急度' },
          order_id: { type: 'string', description: '関連する注文番号(あれば)' },
        },
        required: ['summary', 'priority'],
      },
    },
    run: (input) => {
      if (typeof input.summary !== 'string' || !input.summary.trim()) return { content: 'summary が空です。', isError: true }
      if (!['high', 'normal', 'low'].includes(String(input.priority))) return { content: 'priority は high / normal / low のいずれかです。', isError: true }
      ticketSeq++
      return { content: JSON.stringify({ ticket_id: `T-${ticketSeq}`, status: 'created' }) }
    },
  },
]
