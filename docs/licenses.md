# 資料のライセンスと、このサイトの扱い

作成: 2026-10-12。このサイトの講座は、Creative Commons などの条件がついた資料を、日本語に訳し、要約し、再構成した部分を含みます。この文書は、その条件の扱いの方針と、現時点の一覧です。法律の助言ではありません。

## 方針

1. **原文の長い引用や、全訳はしない。** 短い引用は、出典を示す。独自の整理は、「このサービスの整理」と明記する。
2. **表示(CC BY など):** 出典の名前、ライセンス、変更したこと(日本語に訳し、要約・再構成した)を、各レッスンの末尾に表示する。表示は、出典の記録(`src/data/lesson-sources.json`)の題名から、自動で作る(`src/sources.ts` の `licenseNotes`、`src/ui/SourceNote.tsx`)。
3. **継承(CC BY-SA、CC BY-NC-SA):** その資料を訳し、要約・再構成した部分を含むレッスンは、**資料と同じ条件で提供する**。レッスンの末尾に、その旨を表示する。
   - CC BY-SA 4.0 の資料を含むレッスンは、その部分を **CC BY-SA 4.0** で提供する(OWASP の Cheat Sheet Series、The Scrum Guide)。
   - CC BY-NC-SA の資料を含むレッスンは、その部分を **同じ CC BY-NC-SA の版** で提供する。**非営利の目的に限る**。このサイトは、広告も課金もない(2026-10-12 時点)。広告や課金を始めるときは、これらのレッスンを、先に見直す。
   - 1 つのレッスンの中で、継承の資料の条件が、互いに両立しないときは、そのレッスンの書き方を見直す(資料の使い方を減らす、など)。
4. **改変禁止(CC BY-NC-ND):** 内容の要約と、短い引用にとどめ、原文を改変した版を配るものにしない。レッスンの末尾に、その旨を表示する。
5. **著作権のない部分(事実、考え方)と、法令の条文:** 事実や考え方は、自分の言葉で書く。法令の条文は、e-Gov 法令検索の本文を読んで要約する。
6. **このサイトの独自の文章(2026-10-12 に決定):** **CC BY-SA 4.0**(`LICENSE-CONTENT.md`)。表示は「独習アカデミア」と、ライセンスへのリンク。上の継承の条件がかかるレッスンは、資料から訳した部分に限り、資料の条件が優先する(`NC` を含む資料の部分は、非営利に限る)。
7. **コード(2026-10-12 に決定):** **MIT**(`LICENSE`)。

## 現時点の一覧(出典の記録から作成)

| 資料 | ライセンス | 使っているレッスン |
|---|---|---|
| Authorization Cheat Sheet | CC BY-SA 4.0 | se-2 |
| Secrets Management Cheat Sheet | CC BY-SA 4.0 | se-4 |
| The Scrum Guide 2020 | CC BY-SA 4.0 | pm-1 |
| Threat Modeling Cheat Sheet | CC BY-SA 4.0 | se-5 |
| Pro Git 1.1 About Version Control | CC BY-NC-SA 3.0 | sw-2 |
| Entrepreneurship | CC BY-NC-SA 4.0 | sg-6 |
| Introduction to Business, 2e, 第 1 章 The Nature of Business | CC BY-NC-SA 4.0 | sg-1 |
| Organizational Behavior | CC BY-NC-SA 4.0 | mg-3 |
| Principles of Accounting, Volume 1: Financial Accounting | CC BY-NC-SA 4.0 | ac-1, ac-2, ac-3 |
| Principles of Accounting, Volume 2: Managerial Accounting | CC BY-NC-SA 4.0 | ac-4, ac-5, ac-6, pl-3 |
| Principles of Finance 2e | CC BY-NC-SA 4.0 | pl-6 |
| Principles of Managerial Accounting | CC BY-NC-SA 4.0 | sg-2, sg-5 |
| Principles of Marketing | CC BY-NC-SA 4.0 | ma-1, ma-2, ma-3, ma-4, ma-5, ma-6, pl-4 |
| Software Engineering at Google | CC BY-NC-ND 4.0 | sw-1, sw-2, sw-3, sw-4, sw-6 |
| Small CLs | CC BY 3.0 | sw-2 |
| The Standard of Code Review | CC BY 3.0 | sw-2 |
| Principles of Management | CC BY 4.0 | mg-1, mg-2, mg-3, mg-4, mg-5, mg-6, pl-1, pl-2, pl-3, pl-4, pl-5, sg-3, sg-4 |
| Psychology 2e | CC BY 4.0 | ps-1, ps-2, ps-3, ps-4, ps-5, ps-6 |
| The Double Diamond | CC BY 4.0 | pm-2 |
| Threat Modeling Manifesto | CC BY 4.0 | se-5 |

## 残っている確認(作者の判断が要る点)

- **改変禁止の資料(Software Engineering at Google)**は、SWE の 5 レッスンが使う。「」で囲んだ長めの引用は、短い警句や 1 文にとどまることを、2026-10-12 に確かめた(sw-1 に 9 か所、sw-2 に 1 か所、sw-4 に 2 か所、sw-6 に 1 か所。いずれも 1 文)。ただし、翻訳に近い部分がないかは、レッスンごとに、改めて確かめる必要がある。
- **SWE-2** は、改変禁止の資料と、継承・非営利の資料(Pro Git, CC BY-NC-SA 3.0)を、両方使っている。継承の部分と、改変禁止の資料の使い方が、両立しているかを、確かめる必要がある。
- **BY-NC-SA の資料を訳したレッスンの、独自の文章:** 独自の文章は CC BY-SA 4.0 だが、そのレッスンを、そのまま、またはまとめて使うときは、資料の非営利・継承の条件にも従う必要がある、と `LICENSE-CONTENT.md` に書いた。
- **継承の資料と、他の条件の資料を、1 つのレッスンで混ぜている場合**(例:継承の部分は、資料と同じ条件、ほかの部分は、別の条件)の、境界の書き方は、各レッスンの末尾の表示に頼っている。
- 他の資料(法令、論文、公式文書など)の利用条件は、この一覧に入れていない(Creative Commons の表記が、出典の題名にあるものだけを、一覧にしている)。
