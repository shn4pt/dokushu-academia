---
name: project-writing-progress
description: 講座の執筆の進み具合(2026-10-10 時点)と次の一手、作業の進め方の約束
metadata:
  node_type: memory
  type: project
  originSessionId: f70226f4-c1ed-49d9-9e63-8a0f0c4788d6
  modified: 2026-10-09T20:09:43.590Z
---

2026-10-10 時点: 根拠の読み方(完結)、データ分析・統計(6 本、完結)、経営・戦略(経営-1〜6、完結)、心理学(心理学-1〜6、ID は ps-1〜ps-6、完結)、UX・ユーザーリサーチ(UX-1〜6、完結)、プロダクトマネジメント(PM-1〜7、ID は pm-1〜pm-7、基礎・実践・応用)が公開済みで完結。最優先グループは完了し、catalog の writingPlan から最優先を外した。優先度「次」の学び方(learning、ID は ln-1〜、ステージ ln0/ln1/ln2)に着手: 学び方(ln-1〜ln-6、基礎・実践・応用)が公開済みで完結。writingPlan から learning を外した。マーケティング(ID は ma-1〜、ステージ mk0/mk1/mk2、num は K0〜)に着手: マーケティング(ma-1〜ma-6)が公開済みで完結。writingPlan から marketing を外した。マネジメント(management、ID は mg-1〜、ステージ mg0/mg1/mg2、num は G0〜)に着手: 基礎(mg-1 管理職は何をしているのか、mg-2 目標は計画の出発点)と実践(mg-3 業績の評価とフィードバック、mg-4 意思決定と集団で決めること。ステージ mg1)が公開済み。mg-3 は Organizational Behavior(CC BY-NC-SA)の m73795/m73797 も使った(要約・翻訳と明記。サイトの運営形態とライセンス継承はユーザーに確認が必要)。出典は OpenStax Principles of Management(GitHub osbooks-principles-of-management-bundle、モジュール m70xxx。教科書が研究を文中にインラインで引く形)。次の計画: mg-3 フィードバックと評価(m70664 performance management、m70665、m70702 など。catalog の planned『1on1 とフィードバック』は教科書に 1on1 がないので『フィードバックと評価』に変える想定)、mg-4 会議と意思決定(m70732・m70723・m70614・m70616)、mg-5 組織構造(m70624・m70658)、mg-6 変革の進め方(m70659・m70660)。行動心理学・行動経済学(behavior、ID は bh-1〜bh-6、ステージ bh0/bh1/bh2、num は H0〜)が公開済みで完結。writingPlan から behavior を外した。経緯: 基礎(bh-1 プロスペクト理論 1979、bh-2 Many Labs 2)と実践(bh-3 選択の設計=デフォルト・選択過多、bh-4 ナッジの効果=Mertens 2022 と訂正・Maier・Szaszi・返答・DellaVigna と Linos)が公開済み。catalog の planned『習慣をつくる』は『ナッジの効果』に差し替え済み(習慣は ps-5・ln-4 で扱い済み)。出典は OpenStax Principles of Marketing(GitHub の CNXML、モジュール番号は m000xx)で、教科書が根拠を示さない数字(80:20、ブログ引用)は『言えないこと』に入れる方針。PM の出典は、教科書がなく、Atlassian・SVPG(Cagan)・Product Talk・Scrum Guide・GOV.UK・NN/g などの実務家の資料。UX の出典は、NN/g の記事、GOV.UK サービスマニュアル(OGL)、Digital.gov で、本文のウェブページを curl で取得して読める。出典は OpenStax Psychology 2e、Ryan と Deci 2000(全文)、論文の要旨(Europe PMC)。最新コミット: 経営企画-5・6(2026-10-10、経営企画完結)。会計・マネジメントは完結。マネジメントは完結。

**SWE(2026-10-12):** ユーザーが次の講座にソフトウェアエンジニアリング(swe、ID は sw-1〜、ステージ sw0/sw1/sw2、num は W0〜、根拠は practice)を選んだ。基礎(sw-1 序論、sw-2 バージョン管理とレビュー)を書き、検査を通してコミット済み。出典は Software Engineering at Google(abseil.io で HTML 公開、CC BY-NC-ND。第 1・9・16 章を読んだ)、Pro Git、Google eng-practices(CC BY 3.0)、Sadowski ほか 2018(sback.it の著者版 PDF)、NATO 1968 報告書(編者のページは http のみ。ビルドは https を要求するので、本文が同一の scrummanager.com の写しを記録)。実践(sw-3 テストの種類と使い分け=SWE 本第 11 章・Fowler Test Pyramid、sw-4 技術的負債=Cunningham 1992・Fowler 2 本・Sculley 2015)も公開済み(2026-10-12)。応用(sw-5 システムの分割と境界=Parnas 1972・Conway 1968・Fowler の Conway's Law/Microservice Premium/Monolith First、sw-6 開発の指標と改善=Fowler 2003・SWE 本第 7 章 GSM/QUANTS・DORA ガイド)も公開し、SWE は完結(2026-10-12)。writingPlan から swe を外した。残りは security(swe が前提、tech)、legal・labor・audit(高リスク、書く前に本人に確認)。SPACE(ACM Queue)は 403 で取れなかった。
**セキュリティ(2026-10-12):** 着手。ID は se-1〜、ステージ se0/se1/se2、num は C0〜、根拠は tech(鮮度 180 日)。基礎(se-1 何を誰から守るか=FIPS 199・BSRS 第 2 章・Saltzer & Schroeder 1975、se-2 認証と認可=NIST SP 800-63B-4・OWASP Authorization Cheat Sheet)を公開。実践(se-3 代表的な脆弱性=OWASP Top 10:2025 の序論・A02・A03・A05、se-4 秘密情報=Meli ほか NDSS 2019・OWASP Secrets Management・12factor Config)も公開(2026-10-12)。次は応用(planned『脅威モデリング』『インシデント対応』。OWASP Threat Modeling、Shostack の4つの問い、NIST SP 800-61r3、BSRS の該当章など)。OWASP Top 10 は top10.owasp.org にリダイレクトし、文書内で数字が食い違う箇所がある(本文に明記した)。BSRS(google.github.io/building-secure-and-reliable-systems/raw/chNN.html)はライセンス表示がないので引用せず要約。教訓: 事実確認で『読んだ範囲の外が根拠』と指摘されたら、その節を自分で読んで出典の範囲に加える(推測で弱めるより正確)。指針の序論は参考の節(informative)なので、要件は本文の SHALL の節を引く。教訓: 記事の図(画像)の文言は読めていないので、図の言い回しとして訳さない。原典に書かれていない『意図』を、たとえの起源に読み込まない(Cunningham は意図したかを書いていない)。DORA の報告書・Accelerate は未読。
**Mac の環境(2026-10-12):** 既定の Node は v16 で、ビルドできない。`source ~/.nvm/nvm.sh && nvm use 22` してから npm を使う(nvm で v22 を入れた。既定は変えていない)。Playwright の Chromium は `npx playwright install chromium` で入れた。PDF は scratchpad に Swift の PDFKit で作った pdftext で読める(swiftc でコンパイル)。この端末では、自動モードの判定で `git push` が拒否されたため、本人の依頼で `.claude/settings.local.json`(git の対象外)に `Bash(git push)` と `Bash(git push origin main)` の許可を足した(2026-10-12)。強制 push は許可していない。

**次の一手:** 優先度 2 の講座(マネジメント、会計、経営企画)は完結(2026-10-10)。writingPlan に残るのは優先度 3『あとで』(swe、security、legal、labor、audit)だけ。swe は完結した(2026-10-12)。次に書く講座は、ユーザーと相談して決める(講座の構成と優先度は本人が決める方針)。法務・労務・監査は高リスク(書く前に一度確認)。audit は前提の accounting が揃った。会計・M&A・資本政策など、会社法を引いたレッスンの確認日(2026-10-10)は、90 日後(2027-01-08 ごろ)に再確認する(法令・基準のゲートは会計 ac-1〜6 のみ。pl-5・pl-6 は practice なのでゲート対象外だが、会社法の条文を引いている)。

**進め方:** 出典を生で読み、別のエージェントに事実確認させ、指摘は自分でも原文で再確認して直し、`docs/verify/` に記録。
**push の約束(2026-10-10 に変更):** 以前は毎回「push しますか」と聞いて承認を得ていたが、ユーザーが対話中の push の自動化を許可した。講座を書いて、事実確認・記録まで終えたら、承認を待たずに commit → `npm run history` → push → デプロイ確認まで進めてよい。終わったあとに結果と確認の材料を報告する。
**範囲:** クラウドの定期エージェントや無人の定期実行は作らない(検討したが、本人が見送った)。実行はユーザーの指示で始め、ユーザーの PC が起動している間の対話で行う。高リスク分野(法令・会計)の講座は、以前の約束どおり本人の確認が要るかどうかを、書く前に一度確認する。
**Why:** 指示の回数を減らしたい。誤りの公開リスクは、説明したうえで本人が引き受けた。
**How to apply:** 対話中に講座を書いたら、push まで続けて、事後に報告する。経営・戦略は OpenStax(GitHub の CNXML 原稿)が本文まで読める出典。Playwright の実行には共有ライブラリが要る(旧 libroot は消えていた)。`apt-get download libnspr4 libnss3 libasound2t64` を `dpkg -x` でスクラッチパッドに展開し、`LD_LIBRARY_PATH` に指す方法で動いた(2026-10-10)。PDF の論文は、apt-get download poppler-utils libpoppler134 libopenjp2-7 を dpkg -x して pdftotext で読めた(2026-10-10)。経営・戦略の出典は、OpenStax の Managerial Accounting(accounting-bundle)と Entrepreneurship(osbooks-entrepreneurship)も本文まで読める。

**教訓(2026-10-10):** 教科書の『出典がない』と書く前に、CNXML の cite/脚注の位置を確認する(txt 末尾の脚注一覧は一部しか出ないことがある)。ma-3 で Avis の脚注 63、ma-6 で採用者の脚注 45・46 を見落とした(二度目は、依頼で確認を求めていたのに、書いた後に確認していた。書く前に確認する)。教科書の計算例は検算する(ma-4 で 2 か所の誤りを発見)。

**教訓(bh-3、2026-10-10):** 図のラベルから国名を列挙するときは、本文の記述(opt-in 4 か国・opt-out 6 か国)と数が合うか確認する(図は 11 か国分のラベルが出る)。DOI は推測で書かず、Crossref や Europe PMC で確認する(NBER 番号も推測で取り違えた)。

**bh-5・6 の教訓:** 論文の対策や手順は、「再割り当ての前に」のように順序を足さない。原文の用語(A/A は検出、局所的な再無作為化が対策)を確認する。arXiv の PDF は取得しやすい。FTC の報告書は取得できなかった(ftc.gov の URL は 404)。

**教訓(mg、2026-10-10):** 教科書が複数の研究を並べているとき、教科書自身が『食い違い』と述べていないものを、こちらで『食い違っている』『割れている』と見出しにしない(教科書は『おおむね肯定的。それでも失敗や条件もある』と書いていた)。『評価の言葉に出典がない』と『主張に出典がない』を分ける。

**教訓(mg-3/4):** 公開前に書いた要約の言葉(『食い違い』)が、本文を直したあと目次の要約・出典の記録・テストに残った。本文を弱めたら、同じ語を grep して全箇所を直す。また、この環境で Playwright が libnspr4 で落ちたら、scratchpad の libroot を LD_LIBRARY_PATH に足す。
**教訓(CI):** ローカルは `--project=desktop` だけでなく、公開前に `--project=mobile` も流す(本文に長い URL を生で書くとスマホで横スクロールして CI が落ちる。リンク表記にする)。
**教訓(mg-5/6):** 教科書が同じ節で自己矛盾している(非公式の組織は『たいてい大きく違う』と『たいてい近い』)ことがある。片側だけ採らず、両方あると書く。『実務家向けのブログに頼る』のような出典の性格づけは、脚注を節ごとに数えてから書く。

**会計(法令・基準の講座)の進め方(2026-10-10 に確立):** 条文は e-Gov 法令検索 API v2(`https://laws.e-gov.go.jp/api/2/law_data/<法令ID>?response_format=json`、版の一覧は `/law_revisions/<法令ID>`)で本文まで読める。会社法 417AC0000000086、会社計算規則 418M60000010013。版ごとの本文を取得して、引く条文が将来の改正で変わらないかを比較した。ゲートは status verified、how read + url、確認日 90 日以内、本文に『全体像と考え方』『専門家』『確認した日』。90 日後(2027-01-08 ごろ)に再確認が要る(`recheck-sources`)。企業会計審議会・企業会計基準委員会のサイトは接続できず、日本語 PDF は pdftotext で文字が取れない(poppler-data なし)。会計の教科書は OpenStax Principles of Accounting(accounting-bundle、CC BY-NC-SA、米国 GAAP 前提。コミット 2165bf6)。次の段階で ASBJ/FSA の原文が要るなら、別の経路を探す(WebSearch の許可ドメイン検索で URL を探せる)。
**会計-3/4 の追加メモ:** キャッシュ・フロー計算書の日本の根拠は財務諸表等規則(338M50000040059、金商法の財務諸表)の第110〜119条で、e-Gov から読める(会社法の計算書類には CF は含まれない)。管理会計(ac-4)は法令が形を定めないので、教科書(OpenStax Managerial Accounting)中心で、会社計算規則第88条は対比に使った。教科書の Amazon などの数字は怪しいので使わない。事実確認で『読んでいない』と書いた範囲と、実際に読んだ条文(第111条など)が食い違わないか、必ず突き合わせる。
**教訓(ac-5/6):** 『改正予定は見当たらなかった』のような確認の主張は、法令ごとに範囲が違う(会社法には将来施行の改正が5つある)。まとめて書くと事実に反するので、法令ごとに書く。『法令が形を決めていない』は、読んだ法令に限って書く。
**教訓(pl):** 新しい講座を書く前に、既存のレッスンの内容(特に同じ出典の章)を grep で確認する。会計-4(損益分岐)は経営-2、会計-6(投資の評価)は経営-5 と、同じ教科書の同じ章で重なっていた(重なりのお知らせを本文に書いて対処。整理はユーザーの判断)。
**決定(2026-10-10):** 会計-4・6 と経営-2・5 の重なりは、ユーザーが『このまま残す(a)』を選んだ。重なりのお知らせを本文に入れてある。再整理は不要。
