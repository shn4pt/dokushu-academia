import { useState } from 'react'
import { Plot, curvePath } from '../Plot'
import { Slider } from '../components'
import { Tex } from '../Tex'
import type { LessonContent } from './types'

// Hoffmann et al. (2022, "Chinchilla") が当てはめた損失の近似式の係数。
// 特定のデータ・設定での値であり、一般的な法則の定数ではない。
const E = 1.69, A = 406.4, B = 410.7, ALPHA = 0.34, BETA = 0.28
const loss = (n: number, d: number) => E + A / n ** ALPHA + B / d ** BETA

const sci = (v: number) => {
  const e = Math.floor(Math.log10(v))
  return `${(v / 10 ** e).toFixed(1)}×10^${e}`
}
const X: [number, number] = [7, 12]
const Y: [number, number] = [1.5, 4]

function ScalingDemo() {
  const [logN, setLogN] = useState(9)
  const [logD, setLogD] = useState(11)
  const n = 10 ** logN
  const d = 10 ** logD
  const flops = 6 * n * d

  return (
    <div className="demo">
      <h4>デモ:パラメータ数とデータ量で損失はどう変わるか</h4>
      <p className="muted">
        Chinchilla論文の近似式による<strong>目安</strong>です(実際の値は設定により変わります)。横軸はパラメータ数(対数)で、
        曲線はデータ量を固定した場合の予測損失です。
      </p>
      <Plot xDomain={X} yDomain={Y} label="パラメータ数と予測損失の関係">
        {(sx, sy) => (
          <>
            <path className="curve" d={curvePath((x) => loss(10 ** x, d), X, Y, sx, sy)} />
            <line className="resid" x1={sx(X[0])} x2={sx(X[1])} y1={sy(E)} y2={sy(E)} />
            <circle className="mark" cx={sx(logN)} cy={sy(loss(n, d))} r={5} />
          </>
        )}
      </Plot>
      <p className="muted">点線はこの式での下限(これ以上は下がらない項 E = {E})。横軸は 10^x 個のパラメータ。</p>
      <Slider label="パラメータ数 N" value={logN} min={7} max={12} step={0.25} onChange={setLogN} format={(v) => `10^${v}`} />
      <Slider label="学習トークン数 D" value={logD} min={8} max={14} step={0.25} onChange={setLogD} format={(v) => `10^${v}`} />
      <table className="calc">
        <tbody>
          <tr><td>予測損失</td><td><strong>{loss(n, d).toFixed(3)}</strong></td></tr>
          <tr><td>学習の計算量 ≈ 6ND</td><td><strong>{sci(flops)} FLOPs</strong></td></tr>
          <tr><td>トークン数 / パラメータ数</td><td><strong>{(d / n).toFixed(1)}</strong>(Chinchilla最適の目安は約20)</td></tr>
        </tbody>
      </table>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>大きくすると良くなる、が規則的</h3>
      <p>
        言語モデルの損失は、<strong>パラメータ数 N</strong>、<strong>学習データ量 D(トークン数)</strong>、
        <strong>計算量 C</strong> を増やすと、おおむね<strong>べき乗則</strong>に従って滑らかに下がります(Kaplan et al., 2020)。
        グラフを両対数にとると、ほぼ直線になります。
      </p>
      <Tex block tex={String.raw`L(N,D)\approx E+\frac{A}{N^{\alpha}}+\frac{B}{D^{\beta}}`} />
      <ul>
        <li><Tex tex="E" />:どれだけ大きくしても残る損失(テキストそのものの不確実さ)。</li>
        <li>第2項:モデルが小さいことによる損失。第3項:データが少ないことによる損失。</li>
      </ul>

      <h3>計算量の見積もり</h3>
      <p>
        Transformerの学習に必要な計算量は、おおむね <Tex tex={String.raw`C\approx 6ND`} /> FLOPs と見積もれます
        (1トークンあたり、順伝播で約 2N、逆伝播で約 4N)。予算(計算量)が決まると、N と D の配分の問題になります。
      </p>

      <ScalingDemo />

      <h3>計算最適(Chinchilla)</h3>
      <p>
        同じ計算量なら、モデルを大きくしすぎてデータが足りないより、<strong>モデルとデータを同じ割合で増やす</strong>ほうが
        損失が低くなる、という結果が Hoffmann et al. (2022) で示されました。目安は<strong>パラメータ1個あたり約20トークン</strong>です。
        このため、以前の大型モデルは「データ不足で学習不足」だったと見直されました。
      </p>
      <h3>実運用では「最適」より小さく長く</h3>
      <p>
        学習後の<strong>推論コスト</strong>はモデルが大きいほど増えます。多くの利用者に長く使われるモデルでは、
        最適より小さなモデルを、より多くのトークンで学習する選択が増えています(目安の20を大きく超える例も多い)。
      </p>
      <h3>注意</h3>
      <ul>
        <li>損失が下がることと、個別のタスクで使えるようになることは同じではない。能力が急に現れるように見える現象も議論されている。</li>
        <li>式の係数は、特定の実験設定のもの。新しいアーキテクチャやデータでは変わりうる。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'スケーリング則が示す関係として適切なものはどれですか?',
      choices: [
        'N・D・計算量を増やすと、損失がべき乗則に従って滑らかに下がる',
        'パラメータ数を増やすと損失は必ず増える',
        '損失はモデルサイズと無関係',
      ],
      answer: 0,
      explanation: '両対数グラフでほぼ直線になる規則的な関係が報告されています。',
    },
    {
      question: '計算量の見積もり C ≈ 6ND で、N と D は何ですか?',
      choices: [
        'N: パラメータ数、D: 学習トークン数',
        'N: 層数、D: 次元数',
        'N: バッチサイズ、D: データセット数',
      ],
      answer: 0,
      explanation: '1トークンあたり約6N FLOPs(順伝播2N+逆伝播4N)なので、全体で6NDになります。',
    },
    {
      question: 'Chinchilla の計算最適では、パラメータ1個あたりおよそ何トークンで学習するのが目安ですか?',
      choices: ['約1', '約20', '約1000'],
      answer: 1,
      explanation: '計算量が同じなら、モデルとデータを同じ割合で増やすのが良く、比率は約20トークン/パラメータです。',
    },
  ],
}

export default content
