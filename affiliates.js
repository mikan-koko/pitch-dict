/* =====================================================================
 * ピッチの辞書 — アフィリエイト広告 設定ファイル（A8.net / もしもアフィリエイト）
 * =====================================================================
 * このファイルだけ編集すれば、トップ(index.html)・用語モーダル・全用語ページ(terms/)の
 * 広告枠がまとめて切り替わります。HTMLの再生成は不要です。
 *
 * ▼ 使い方
 *   1. A8.net / もしもアフィリエイトで提携承認されたら、広告リンクを取得する
 *   2. 下の items の該当項目で  enabled:true  にし、url（または html）を貼り付ける
 *   3. コミット＆push（GitHub Pages に反映）
 *
 * ▼ item の書き方（2種類）
 *   A) kind:"card"  … サイトのデザインに合わせたカード型。url にアフィリエイトリンクを貼る
 *        { enabled:true, kind:"card", badge:"見る", title:"DAZN", desc:"…", btn:"無料で見る", url:"https://px.a8.net/svt/ejp?a8mat=XXXX", imp:"https://www19.a8.net/0.gif?a8mat=XXXX" }
 *        ・url  … A8「素材リンク」のテキストリンク／もしも「テキストリンク」の href
 *        ・imp  … A8 のインプレッション計測用 <img src="…0.gif…"> の src（任意。成果計測に影響なし。無ければ省略）
 *   B) kind:"html"  … A8のバナー／もしも「かんたんリンク」など、発行されたHTMLをそのまま貼る
 *        { enabled:true, kind:"html", html:'<a href="https://af.moshimo.com/af/c/click?…">…</a><img src="https://i.moshimo.com/af/i/impression?…" …>' }
 *        ※ 貼るときは html の値をバッククォート `…` で囲むと、内部の " や ' をエスケープせずに済みます。
 *        ※ <script> を含む広告（A8ウィジェット等）は、index.html の CSP（Content-Security-Policy）の
 *           script-src にそのドメインを追加しないと動きません。基本は script 不要の素材を選んでください。
 *
 * ▼ 表示先の絞り込み（任意）
 *   cats:["live","column"]  … 用語カテゴリ（live/column/data/rule）が一致する用語ページ・モーダルのみ表示
 *   terms:["derby","xg"]    … 特定の用語ページ・モーダルのみ表示
 *   slots:["home","term"]   … 表示する枠を限定（省略時は全枠）。home=トップ＆一覧ページ、term=用語ページ、modal=用語モーダル
 *
 * ▼ 法令対応（2023年10月〜 景品表示法ステマ規制）
 *   広告枠には自動で「PR」表記と disclosure の文言が付きます。消さないでください。
 *   Amazon商品リンクを使う場合は privacy.html のアフィリエイト項にある Amazonアソシエイト声明も必要です（記載済み）。
 * ===================================================================== */
window.PD_AFF = {
  /* 枠の見出し（slot ごと） */
  titles: {
    home:  "⚽ サッカー観戦をもっと楽しむ",
    term:  "⚽ この用語を「実際の試合」で確かめる",
    modal: "⚽ 観戦をもっと楽しむ",
  },
  /* 枠の下に出る注記（ステマ規制対応。変更可・削除不可） */
  disclosure: "※ アフィリエイト広告（PR）を含みます。リンク先での申込・購入により当サイトに報酬が支払われることがあります。",
  /* 1枠に出す最大件数 */
  max: { home: 4, term: 3, modal: 2 },

  items: [
    /* ---------- 動画配信（実況・ライブ／コラム系の用語と相性◎） ---------- */
    { enabled: false, kind: "card", badge: "Jリーグ・海外サッカー", title: "DAZN（ダゾーン）",
      desc: "Jリーグ全試合＋海外サッカーをライブ配信。実況・解説の「今の言葉」をその場で確認できる。",
      btn: "DAZNを見る", url: "", imp: "", cats: ["live", "column", "data"] },
    { enabled: false, kind: "card", badge: "プレミア・ラ・リーガ", title: "U-NEXT サッカーパック",
      desc: "プレミアリーグ／ラ・リーガ／セリエAを配信。初回は無料トライアルあり。",
      btn: "無料トライアルを見る", url: "", imp: "", cats: ["live", "column", "data"] },
    { enabled: false, kind: "card", badge: "代表戦・W杯予選", title: "ABEMAプレミアム",
      desc: "日本代表戦や海外サッカーの無料／プレミアム配信。見逃し視聴にも。",
      btn: "ABEMAを見る", url: "", imp: "", cats: ["live", "column", "rule"] },
    { enabled: false, kind: "card", badge: "チャンピオンズリーグ", title: "WOWOW",
      desc: "UEFAチャンピオンズリーグ／ヨーロッパリーグを配信。",
      btn: "WOWOWを見る", url: "", imp: "" },

    /* ---------- 本・グッズ（もしも「かんたんリンク」推奨：Amazon/楽天/Yahoo を1枠で） ---------- */
    { enabled: false, kind: "html", slots: ["home", "term"], cats: ["column", "data"],
      /* 例: もしもアフィリエイト「かんたんリンク」で「サッカー 戦術 本」を検索して作成したHTMLをここへ */
      html: `` },
    { enabled: false, kind: "html", slots: ["home", "term"], cats: ["rule"],
      /* 例: 「サッカー 競技規則」「審判」関連の本のかんたんリンク */
      html: `` },
    { enabled: false, kind: "html", slots: ["home"],
      /* 例: レプリカユニフォーム／サッカーボール／観戦グッズ のかんたんリンク */
      html: `` },
  ],
};

/* ---------------- 描画（ここから下は編集不要） ---------------- */
(function () {
  "use strict";
  var A = window.PD_AFF;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pick(slot, ctx) {
    return A.items.filter(function (it) {
      if (!it.enabled) return false;
      if (it.kind === "card" && !it.url) return false;
      if (it.kind === "html" && !(it.html && it.html.trim())) return false;
      if (it.slots && it.slots.indexOf(slot) < 0) return false;
      if (slot !== "home" && it.cats && ctx.cat && it.cats.indexOf(ctx.cat) < 0) return false;
      if (slot !== "home" && it.terms && ctx.term && it.terms.indexOf(ctx.term) < 0) return false;
      return true;
    }).slice(0, (A.max && A.max[slot]) || 3);
  }
  function cardHTML(it) {
    return '<a class="affcard" href="' + esc(it.url) + '" target="_blank" rel="nofollow sponsored noopener">'
      + (it.badge ? '<span class="affbadge">' + esc(it.badge) + "</span>" : "")
      + "<b>" + esc(it.title) + "</b>"
      + (it.desc ? "<p>" + esc(it.desc) + "</p>" : "")
      + '<span class="affbtn">' + esc(it.btn || "詳しく見る") + " →</span></a>"
      + (it.imp ? '<img src="' + esc(it.imp) + '" width="1" height="1" alt="" style="border:0;position:absolute" loading="lazy">' : "");
  }
  function render(root) {
    var nodes = (root || document).querySelectorAll("[data-aff]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.getAttribute("data-aff-done")) return;
      var slot = el.getAttribute("data-aff");
      var ctx = { term: el.getAttribute("data-term") || "", cat: el.getAttribute("data-cat") || "" };
      var items = pick(slot, ctx);
      if (!items.length) { el.hidden = true; return; }
      var cards = items.filter(function (i) { return i.kind !== "html"; });
      var raws = items.filter(function (i) { return i.kind === "html"; });
      var h = '<div class="affbox"><div class="afft"><span class="affpr">PR</span>' + esc((A.titles && A.titles[slot]) || "おすすめ") + "</div>";
      if (cards.length) h += '<div class="affgrid">' + cards.map(cardHTML).join("") + "</div>";
      if (raws.length) h += '<div class="affraw"' + (cards.length ? ' style="margin-top:10px"' : "") + ">" + raws.map(function (i) { return "<div>" + i.html + "</div>"; }).join("") + "</div>";
      if (A.disclosure) h += '<p class="affnote">' + esc(A.disclosure) + "</p>";
      el.innerHTML = h;
      el.hidden = false;
      el.setAttribute("data-aff-done", "1");
    });
  }
  window.PD_AFF_render = render;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { render(); });
  else render();
})();
