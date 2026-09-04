/* =====================================================================
 * ピッチの辞書 — アフィリエイト広告 設定ファイル
 * =====================================================================
 * このファイルだけ編集すれば、トップ(index.html)・用語モーダル・全用語ページ(terms/)の
 * 広告枠がまとめて切り替わります。HTMLの再生成（build-pages.js）は不要です。
 *
 * ▼ 現在の提携状況（2026-09-04 時点）
 *   もしもアフィリエイト … メディア「ピッチの辞書」(ID 687480) 登録済み
 *     ・WOWOW                提携中（成果 1,269円 / 有料申込完了）
 *     ・スカパー！            提携中（成果 3,909円 / 本登録）
 *     ・楽天市場の商品購入     提携中（成果 2% / どこでもリンクで任意ページへ）
 *   A8.net … pitch.kokokikaku.com は【未登録】。
 *     A8のリンクを貼る前に、必ず「サイト情報の登録・修正」でこのサイトを登録すること。
 *     登録には管理画面の再認証（ログインID＋パスワード）が必要。
 *     ※ 他サイト用に発行したリンクをこのサイトに貼るのは規約違反になるので絶対にしない。
 *
 * ▼ item の書き方（2種類）
 *   A) kind:"card"  … サイトのデザインに合わせたカード型
 *        url … アフィリエイトのクリック計測リンク
 *        imp … インプレッション計測用の1x1画像のsrc（任意。無ければ省略可）
 *   B) kind:"html"  … もしも「かんたんリンク」やA8のバナーなど、発行されたHTMLをそのまま貼る
 *        html の値はバッククォート `…` で囲むと、内部の " や ' をエスケープせずに済みます。
 *        ※ <script> を含む広告素材は index.html の CSP（script-src）に載っていないと動きません。
 *           script不要の素材を選んでください。画像ドメインは img-src への追加が必要です。
 *
 * ▼ 表示先の絞り込み（任意）
 *   cats:["live","column"]  … 用語カテゴリ（live/column/data/rule）が一致するページ・モーダルのみ
 *   terms:["derby","xg"]    … 特定の用語のみ
 *   slots:["home","term"]   … home=トップ＆一覧, term=用語ページ, modal=用語モーダル（省略時は全枠）
 *
 * ▼ 法令対応（2023年10月〜 景品表示法ステマ規制）
 *   広告枠には自動で「PR」表記と disclosure の文言が付きます。消さないでください。
 *   リンクには自動で rel="nofollow sponsored noopener" が付きます。
 * ===================================================================== */

/* もしも「どこでもリンク」（楽天市場・提携中）で任意の楽天ページへ飛ばすためのヘルパー。
   楽天の検索結果ページに飛ばすので、個別商品と違って品切れで無効にならない。 */
var PD_RAKUTEN_CLICK = "https://af.moshimo.com/af/c/click?a_id=5791139&p_id=54&pc_id=54&pl_id=616&url=";
var PD_RAKUTEN_IMP = "https://i.moshimo.com/af/i/impression?a_id=5791139&p_id=54&pc_id=54&pl_id=616";
function pdRakutenSearch(words) {
  return PD_RAKUTEN_CLICK + encodeURIComponent("https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(words) + "/");
}

window.PD_AFF = {
  /* 枠の見出し（slot ごと） */
  titles: {
    home: "⚽ サッカー観戦をもっと楽しむ",
    term: "⚽ この用語を「実際の試合」で確かめる",
    modal: "⚽ 観戦をもっと楽しむ",
  },
  /* 枠の下に出る注記（ステマ規制対応。文言の変更は可、削除は不可） */
  disclosure: "※ アフィリエイト広告（PR）を含みます。リンク先での申込・購入により当サイトに報酬が支払われることがあります。",
  /* 1枠に出す最大件数 */
  max: { home: 4, term: 3, modal: 2 },

  items: [
    /* ---------- もしもアフィリエイト（提携済み） ---------- */
    {
      enabled: true, kind: "card",
      badge: "UEFAチャンピオンズリーグ",
      title: "WOWOW（ワウワウ）",
      desc: "チャンピオンズリーグやヨーロッパリーグを配信。実況で飛び交う戦術用語を、その場の映像で確かめられる。",
      btn: "WOWOWを見る",
      url: "https://af.moshimo.com/af/c/click?a_id=5791141&p_id=5300&pc_id=14446&pl_id=69351",
      imp: "https://i.moshimo.com/af/i/impression?a_id=5791141&p_id=5300&pc_id=14446&pl_id=69351",
      cats: ["live", "column", "data"],
    },
    {
      enabled: true, kind: "card",
      badge: "海外サッカー・代表戦",
      title: "スカパー！",
      desc: "海外サッカーや日本代表戦を放送。試合を観ながら用語の意味を確かめたい人へ。",
      btn: "スカパー！を見る",
      url: "https://af.moshimo.com/af/c/click?a_id=5791142&p_id=1080&pc_id=1564&pl_id=16147",
      imp: "https://i.moshimo.com/af/i/impression?a_id=5791142&p_id=1080&pc_id=1564&pl_id=16147",
      cats: ["live", "column", "rule"],
    },
    {
      enabled: true, kind: "card",
      badge: "楽天市場",
      title: "サッカー戦術の本",
      desc: "ハーフスペースやポジショナルプレーをもっと深く。戦術・分析の書籍を楽天で探せます。",
      btn: "戦術本を探す",
      url: pdRakutenSearch("サッカー 戦術 本"),
      imp: PD_RAKUTEN_IMP,
      cats: ["column"],
    },
    {
      enabled: true, kind: "card",
      badge: "楽天市場",
      title: "サッカーのデータ分析本",
      desc: "xG・PPDAなどのスタッツをもっと知りたい人へ。データ分析の書籍を楽天で探せます。",
      btn: "データ分析本を探す",
      url: pdRakutenSearch("サッカー データ 分析 本"),
      imp: PD_RAKUTEN_IMP,
      cats: ["data"],
    },
    {
      enabled: true, kind: "card",
      badge: "楽天市場",
      title: "サッカー競技規則の本",
      desc: "オフサイド・DOGSO・VARの判定基準を原典で。競技規則やレフェリングの本を楽天で探せます。",
      btn: "ルールの本を探す",
      url: pdRakutenSearch("サッカー 競技規則"),
      imp: PD_RAKUTEN_IMP,
      cats: ["rule"],
    },
    {
      enabled: true, kind: "card",
      badge: "楽天市場",
      title: "観戦グッズ・サッカーボール",
      desc: "スタジアム観戦のおともに。マフラータオル、ユニフォーム、ボールなど。",
      btn: "観戦グッズを見る",
      url: pdRakutenSearch("サッカー 観戦 グッズ"),
      imp: PD_RAKUTEN_IMP,
      slots: ["home"],
    },

    /* ---------- これから増やす枠 ----------
       提携が承認されたら enabled を true にして url / imp を貼る。
       DAZN・U-NEXT・ABEMA はもしもの現在の掲載一覧には無かったので、
       A8.net でサイト登録のうえ提携申請するのが早い。 */
    {
      enabled: false, kind: "card",
      badge: "Jリーグ・海外サッカー",
      title: "DAZN（ダゾーン）",
      desc: "Jリーグ全試合＋海外サッカーをライブ配信。実況の「今の言葉」をその場で確認できる。",
      btn: "DAZNを見る",
      url: "", imp: "",
      cats: ["live", "column", "data"],
    },
    {
      enabled: false, kind: "card",
      badge: "プレミア・ラ・リーガ",
      title: "U-NEXT サッカーパック",
      desc: "プレミアリーグ／ラ・リーガ／セリエAを配信。",
      btn: "U-NEXTを見る",
      url: "", imp: "",
      cats: ["live", "column", "data"],
    },
    {
      /* もしも「かんたんリンク」で作った商品カードのHTMLを html に貼る（バッククォートの中） */
      enabled: false, kind: "html", slots: ["home", "term"],
      html: ``,
    },
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
    return '<a class="affcard" href="' + esc(it.url) + '" target="_blank" rel="nofollow sponsored noopener" referrerpolicy="no-referrer-when-downgrade">'
      + (it.badge ? '<span class="affbadge">' + esc(it.badge) + "</span>" : "")
      + "<b>" + esc(it.title) + "</b>"
      + (it.desc ? "<p>" + esc(it.desc) + "</p>" : "")
      + '<span class="affbtn">' + esc(it.btn || "詳しく見る") + " →</span></a>";
  }
  function impHTML(it) {
    return it.imp ? '<img src="' + esc(it.imp) + '" width="1" height="1" alt="" style="border:none" loading="lazy">' : "";
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
      /* インプレッション計測用の1x1画像は枠の外（見えない位置）にまとめる */
      h += '<div style="position:absolute;width:0;height:0;overflow:hidden">' + cards.map(impHTML).join("") + "</div>";
      h += "</div>";
      el.innerHTML = h;
      el.hidden = false;
      el.setAttribute("data-aff-done", "1");
    });
  }
  window.PD_AFF_render = render;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { render(); });
  else render();
})();
