# ピッチの辞書（Web版）

サッカー用語118語を「動く戦術ボード」で3秒図解する用語図鑑。
公開URL: https://pitch.kokokikaku.com/ ／ 配信: GitHub Pages（`master` ブランチのファイルをそのまま配信）

## ファイル構成

| ファイル | 役割 | 編集 |
|---|---|---|
| `index.html` | 本体。用語データ(`TERMS`)・戦術ボード(`VIZ`)・UIがすべて入った1ファイル | **手で編集する** |
| `affiliates.js` | A8.net / もしもアフィリエイトの掲載設定 | **手で編集する** |
| `privacy.html` | プライバシーポリシー（広告・アフィリエイトの開示を含む） | **手で編集する** |
| `404.html` | 404ページ | 手で編集する |
| `terms/<id>/index.html` | 用語ごとの静的ページ（SEO用・118枚） | **生成物。直接編集しない** |
| `terms/index.html` | 全用語一覧ページ | **生成物。直接編集しない** |
| `terms.css` | 上記ページのCSS | **生成物。直接編集しない** |
| `sitemap.xml` | サイトマップ（121URL） | **生成物。直接編集しない** |
| `sw.js` | Service Worker（PWA・オフライン） | 手で編集する |

## ★ index.html を編集したら必ず実行する

用語の追加・修正、戦術ボードの変更、CSPの変更など **`index.html` に手を入れたら必ず** これを実行してからコミットする。
静的ページ・CSS・サイトマップ・トップページ内の内部リンク一覧がまとめて作り直される。

```
node scripts/build-pages.js
```

やっていること:

1. `index.html` のメインスクリプトを Node の `vm` 上で実行し、`TERMS` / `CAT` / `VIZ` などを取り出す
2. 用語ごとに `terms/<id>/index.html` を書き出す（戦術ボードのSVGはビルド時に文字列として展開＝JS不要で表示される）
3. 戦術ボードのCSS・アニメーションを `index.html` から抜き出して `terms.css` に入れる
4. `sitemap.xml` を作り直す
5. `index.html` 内の `<div id="seolinklist">` に全用語ページへのリンクを埋め込む

> ⚠️ 生成物もコミットする。GitHub Pages はビルドを行わず、リポジトリのファイルをそのまま配信するため。

## アフィリエイト広告の設定

`affiliates.js` の `items` を編集するだけで、トップ・用語モーダル・用語ページ・一覧ページの広告枠が切り替わる。
HTMLの再生成は不要。`enabled:false` の項目や未入力の項目は自動で非表示になり、枠ごと消える。
書き方・注意点はファイル冒頭のコメントに書いてある。

- 広告リンクには自動で `rel="nofollow sponsored noopener"` と「PR」表記が付く（景品表示法のステマ規制対応）
- 外部ドメインの画像を使う広告は、`index.html` の CSP（`img-src`）にドメインの追加が必要な場合がある
- `<script>` を含む広告素材（A8のウィジェット等）はCSPで動かない。script不要の素材を選ぶこと

### 提携状況（2026-09-04 時点）

| ASP | 状態 |
|---|---|
| もしもアフィリエイト | メディア「ピッチの辞書」(ID 687480) 登録済み。**WOWOW / スカパー！ / 楽天市場** の3件が提携中で、実リンクを掲載済み |
| A8.net | **pitch.kokokikaku.com が未登録。** A8のリンクを貼る前に「サイト情報の登録・修正」でこのサイトを登録すること（管理画面の再認証が必要） |

DAZN・U-NEXT・ABEMA はもしもの掲載一覧に無かった。A8でサイト登録のうえ提携申請するのが早い。
承認されたら `affiliates.js` の該当項目を `enabled: true` にして `url` / `imp` を貼るだけでよい。

> ⚠️ **他サイト用に発行したアフィリエイトリンクをこのサイトに貼らないこと。** ASPの規約違反になり、成果も計測されない。

## ★ Service Worker のキャッシュ戦略（触るときの注意）

`sw.js` は用途ごとに戦略を変えている。

| 種類 | 戦略 | 理由 |
|---|---|---|
| HTML | network-first | 更新を確実に届ける |
| JS / CSS / JSON / XML | stale-while-revalidate | 表示は即座、裏で取り直して次回に反映 |
| 画像・フォント | cache-first | めったに変わらない |

**JS・CSSを cache-first に戻してはいけない。** 2026-09-04 に実際に事故が起きた。
`affiliates.js` を cache-first でキャッシュしていたため、広告リンクを差し替えても
一度でもサイトを訪れた人には永久に古いファイルが配信され続けた
（`fetch(url, {cache:'no-store'})` すらService Workerに横取りされて効かない）。

`ASSETS` に載せるファイルを増減したときは `CACHE` のバージョン文字列を上げること。

## 検証

```
node scripts/build-pages.js
node -e "require('http');" && npx --yes serve . -p 8899
```

確認する点: トップの表示 / 用語モーダル / `/terms/` 一覧 / 用語ページの戦術ボードが動くか / スマホ幅で横スクロールが出ないか。

## iOSアプリ版との関係

iOSアプリ（別リポジトリ `pitch-app`）は `scripts/build-data.js` でこの `index.html` から
用語データと戦術ボードHTMLを抽出している。`TERMS` / `VIZ` / `CAT` / `EMOJI` / `TR_EN` / `I18N` / `TREND` の
**変数名と構造を変えるとアプリ側のビルドが壊れる**ので注意する。
