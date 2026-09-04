#!/usr/bin/env node
/**
 * ピッチの辞書 — 静的ページ生成スクリプト（SEO用）
 *
 * index.html（SPA）に埋め込まれた用語データ(TERMS)と戦術ボード(VIZ)を読み取り、
 *   - terms/<id>/index.html … 用語ごとの静的ページ（検索エンジンにインデックスさせる）
 *   - terms/index.html      … 全用語一覧
 *   - terms.css             … 上記ページ用CSS（戦術ボードのアニメCSSは index.html から抽出）
 *   - sitemap.xml           … 全URL
 * を生成する。
 *
 * 使い方:  node scripts/build-pages.js
 *   index.html の用語データや戦術ボードを更新したら、必ずこれを実行してからコミットする。
 *   （GitHub Pages はコミット済みファイルをそのまま配信するため、生成物もコミットする）
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SITE = "https://pitch.kokokikaku.com";
// index.html は CRLF。抽出・照合はすべて LF に正規化した上で行う
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace(/\r\n/g, "\n");

/* ---------- 1) index.html のメインスクリプトを Node 上で評価してデータを取り出す ---------- */
const scriptStart = src.indexOf("<script>\n/* ================= SVG 戦術ボード部品");
if (scriptStart < 0) throw new Error("メインスクリプトの開始位置が見つかりません");
const scriptEnd = src.indexOf("</script>", scriptStart);
const mainJs = src.slice(scriptStart + "<script>".length, scriptEnd);

// DOM / ブラウザAPIをすべて「何をしても壊れないダミー」に置き換える
function makeStub() {
  const fn = function () { return stub; };
  const stub = new Proxy(fn, {
    get(_, k) {
      // Symbol系（Symbol.match 等）を返すと正規表現扱いされて String.includes が落ちるので undefined に
      if (typeof k === "symbol") return k === Symbol.toPrimitive ? () => "" : undefined;
      if (k === "toString" || k === "valueOf") return () => "";
      if (k === "then") return undefined;
      if (k === "length") return 0;
      if (k === "matches") return false;
      return stub;
    },
    set() { return true; },
    apply() { return stub; },
    construct() { return stub; },
    has() { return true; },
  });
  return stub;
}
const stub = makeStub();
const ctx = vm.createContext({
  window: stub, document: stub, navigator: stub, localStorage: stub, history: stub,
  location: { hash: "", pathname: "/", search: "" }, matchMedia: () => ({ matches: false }),
  setTimeout: () => 0, clearTimeout: () => 0, requestAnimationFrame: () => 0,
  prompt: () => "", alert: () => {}, console, gtag: () => {}, dataLayer: [],
  encodeURIComponent, decodeURIComponent, URLSearchParams,
});
vm.runInContext(mainJs, ctx, { filename: "index.html(main)" });
const D = vm.runInContext("({TERMS,CAT,EMOJI,TR_EN,I18N,TREND,VIZ})", ctx);
const { TERMS, CAT, EMOJI, TR_EN, I18N, TREND, VIZ } = D;
const L = I18N.ja;
if (!TERMS || !TERMS.length) throw new Error("TERMS が空です");

/* ---------- 2) index.html から戦術ボード用CSSと共有<defs>を抽出 ---------- */
function between(s, a, b, inclusive = true) {
  const i = s.indexOf(a); if (i < 0) throw new Error("not found: " + a);
  const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error("not found: " + b);
  return inclusive ? s.slice(i, j + b.length) : s.slice(i + a.length, j);
}
const vizCss = between(src, ".viz{", ".viz svg{width:100%;height:auto;display:block}");
const animCss = between(src, "/* ---------- SVG anim ---------- */", "@media (prefers-reduced-motion: reduce){", false)
  + "@media (prefers-reduced-motion: reduce){.mv,.mv2,.pulse,.dash,.fadein,.blinkel{animation:none}}\n@keyframes blink{50%{opacity:.25}}\n";
const sharedDefs = between(src, "<!-- 共有グラデーション＆フィルター定義 -->", "</defs></svg>");
const cspMeta = (src.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/) || [""])[0];
const gaId = (src.match(/gtag\/js\?id=([A-Z0-9-]+)/) || [])[1] || "";
const adsClient = (src.match(/adsbygoogle\.js\?client=([a-z0-9-]+)/) || [])[1] || "";

/* ---------- 3) ユーティリティ ---------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = (s) => String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const shortName = (t) => t.name.split("（")[0].split("／")[0];
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const catName = (cat) => strip(CAT[cat].label).replace(/^\S+\s/, "");
const termPath = (id) => `/terms/${id}/`;
const termUrl = (id) => SITE + termPath(id);
const CATS = ["live", "column", "data", "rule"];
const byCat = Object.fromEntries(CATS.map((c) => [c, TERMS.filter((t) => t.cat === c)]));

const today = new Date().toISOString().slice(0, 10);
let lastmod = today;
try { lastmod = execSync("git log -1 --format=%cs -- index.html", { cwd: ROOT }).toString().trim() || today; } catch (_) {}

/* ---------- 4) 共通ヘッダ / フッタ ---------- */
function head({ title, desc, url, jsonld, ogType = "article" }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#1536C4">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="ピッチの辞書">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-v2.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og-v2.png">
<meta name="referrer" content="strict-origin-when-cross-origin">
${cspMeta}
${jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
${gaId ? `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>` : ""}
${adsClient ? `<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}" crossorigin="anonymous"></script>` : ""}
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/icon-512.png">
<link rel="manifest" href="/manifest.json">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900&family=Oswald:wght@600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/terms.css?v=${lastmod.replace(/-/g, "")}">
</head>
<body>
${sharedDefs}
<header class="th">
  <div class="wrap thbar">
    <a class="tlogo" href="/"><img src="/mascotc.webp" alt="" width="40" height="40"><span><b>ピッチの辞書</b><small>PITCH DICTIONARY</small></span></a>
    <form class="tsearch" action="/" method="get" role="search">
      <input type="search" name="q" placeholder="用語を検索（例：ハーフスペース、xG）" aria-label="用語を検索">
      <button type="submit" aria-label="検索">🔍</button>
    </form>
  </div>
</header>
`;
}
function foot() {
  return `
<footer class="tf">
  <div class="wrap">
    <nav class="tfnav" aria-label="サイト内リンク">
      <a href="/">🏠 ホーム（動く戦術ボード）</a>
      <a href="/terms/">📚 全用語一覧</a>
      <a href="/privacy.html">プライバシーポリシー</a>
      <a href="https://kokokikaku.com/" target="_blank" rel="noopener">ここ企画</a>
    </nav>
    <p class="tfnote">図解はすべてオリジナルの戦術ボードで表現しています（実際の試合映像・写真は使用していません）。<br>本サイトにはアフィリエイト広告（PR）を含む場合があります。</p>
    <p class="tfcopy">© 2026 ここ企画 / ピッチの辞書</p>
  </div>
</footer>
<script src="/affiliates.js" defer></script>
</body>
</html>
`;
}
function catBadge(cat) {
  const c = CAT[cat];
  return `<a class="tcat" href="/terms/#cat-${cat}" style="--cc:${c.col};--ccd:${c.d}">${esc(c.label)}</a>`;
}
function chip(t) {
  return `<a class="tchip" href="${termPath(t.id)}" style="--cc:${CAT[t.cat].col};--ccd:${CAT[t.cat].d}"><span>${EMOJI[t.id] || "⚽"}</span>${esc(shortName(t))}</a>`;
}

/* ---------- 5) 用語ページ ---------- */
function termPage(t) {
  const c = CAT[t.cat];
  const name = t.name, sn = shortName(t);
  const one = strip(t.one);
  const title = `${sn}とは？意味をサッカー戦術ボードで3秒図解｜ピッチの辞書`;
  const desc = clip(`${name}（${t.en}）とは：${one} 実況・コラム・データで使われるサッカー用語「${sn}」の意味を、初心者向けに動く戦術ボードで図解。${strip(t.use.text)}`, 150);
  const url = termUrl(t.id);
  const en = TR_EN[t.id];
  const rel = (t.rel || []).map((r) => TERMS.find((x) => x.id === r)).filter(Boolean);
  const sib = byCat[t.cat];
  const i = sib.findIndex((x) => x.id === t.id);
  const prev = sib[(i - 1 + sib.length) % sib.length], next = sib[(i + 1) % sib.length];
  const svg = VIZ[t.viz] ? VIZ[t.viz]() : "";
  const shareText = `「${sn}」ってこういう意味⚽ サッカー用語を3秒で図解『ピッチの辞書』`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " #サッカー用語")}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;

  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "DefinedTerm",
      name, alternateName: t.en, description: one, url,
      inDefinedTermSet: { "@type": "DefinedTermSet", name: "ピッチの辞書 サッカー用語集", url: SITE + "/terms/" },
      termCode: t.id, inLanguage: "ja",
    },
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: `${sn}とは？意味を戦術ボードで図解`, description: desc, url, inLanguage: "ja",
      mainEntityOfPage: url, dateModified: lastmod, image: SITE + "/og-v2.png",
      author: { "@type": "Organization", name: "ここ企画", url: "https://kokokikaku.com/" },
      publisher: { "@type": "Organization", name: "ここ企画", url: "https://kokokikaku.com/", logo: { "@type": "ImageObject", url: SITE + "/icon-512.png" } },
      about: { "@type": "Thing", name: "サッカー用語" }, keywords: [sn, t.en, "サッカー用語", catName(t.cat)].join(","),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ピッチの辞書", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "サッカー用語一覧", item: SITE + "/terms/" },
        { "@type": "ListItem", position: 3, name: sn, item: url },
      ],
    },
  ];

  return head({ title, desc, url, jsonld }) + `
<main class="wrap tmain">
  <nav class="crumb" aria-label="パンくず"><a href="/">ピッチの辞書</a> › <a href="/terms/">用語一覧</a> › <a href="/terms/#cat-${t.cat}">${esc(catName(t.cat))}</a> › <span>${esc(sn)}</span></nav>

  <article class="tarticle" style="--cc:${c.col};--ccd:${c.d}">
    <div class="tmeta">${catBadge(t.cat)}<span class="tlvl">${esc(L.lvl[t.lvl])}</span></div>
    <h1><span class="temoji" aria-hidden="true">${EMOJI[t.id] || "⚽"}</span>${esc(name)}</h1>
    <p class="ten"><span lang="en">${esc(t.en)}</span>${t.kana ? `<span class="tkana">読み：${esc(t.kana)}</span>` : ""}</p>
    <p class="tlead"><strong>${esc(sn)}とは</strong>、${esc(one)}</p>

    <section class="tstep">
      <h2><span class="snum">1</span>${esc(L.m1)}</h2>
      <p class="tcatch">${t.catch}</p>
    </section>

    <section class="tstep">
      <h2><span class="snum">2</span>${esc(L.m2)}</h2>
      <div class="viz">${svg}</div>
      <p class="vizcap">オリジナルの戦術ボードで図解（青＝注目チーム／赤＝相手、攻撃方向は左→右）。ボードは自動で動きます。</p>
      <p class="tapp"><a class="tbtn" href="/#${t.id}">⚽ アプリ版で拡大して見る（他の${TERMS.length - 1}語もタップで図解）</a></p>
    </section>

    <section class="tstep">
      <h2><span class="snum">3</span>${esc(L.m3)}</h2>
      <p class="why">${t.why}</p>
      <div class="usage"><span class="who">${esc(t.use.who)}</span>${t.use.text}</div>
    </section>

    <div class="affslot" data-aff="term" data-term="${t.id}" data-cat="${t.cat}"></div>

    ${rel.length ? `<section class="tstep">
      <h2>${esc(L.mRel)}</h2>
      <div class="tchips">${rel.map(chip).join("")}</div>
    </section>` : ""}

    ${en ? `<section class="tstep ten-sec" lang="en">
      <h2>🇬🇧 In English — ${esc(t.en)}</h2>
      <p class="tlead">${esc(strip(en.one || ""))}</p>
      ${en.catch ? `<p class="tcatch">${en.catch}</p>` : ""}
      ${en.why ? `<p class="why">${en.why}</p>` : ""}
      ${en.text ? `<div class="usage"><span class="who">${esc(en.who || "In commentary")}</span>${en.text}</div>` : ""}
    </section>` : ""}

    <div class="tshare">
      <span>この用語をシェア：</span>
      <a class="sbtn x" href="${xUrl}" target="_blank" rel="noopener noreferrer">𝕏 ポスト</a>
      <a class="sbtn line" href="${lineUrl}" target="_blank" rel="noopener noreferrer">💬 LINE</a>
    </div>

    <nav class="tpn" aria-label="前後の用語">
      <a href="${termPath(prev.id)}" rel="prev">← ${esc(shortName(prev))}</a>
      <a href="${termPath(next.id)}" rel="next">${esc(shortName(next))} →</a>
    </nav>
  </article>

  <aside class="taside">
    <h2 style="--cc:${c.col};--ccd:${c.d}">${esc(c.label)} の用語（${sib.length}語）</h2>
    <div class="tchips">${sib.map(chip).join("")}</div>
    <p class="tmore"><a href="/terms/">📚 全${TERMS.length}語の一覧を見る →</a></p>
  </aside>
</main>
` + foot();
}

/* ---------- 6) 用語一覧ページ ---------- */
function indexPage() {
  const title = `サッカー用語一覧（全${TERMS.length}語）｜意味を戦術ボードで図解 - ピッチの辞書`;
  const desc = `実況・コラム・データ・ルールで使われるサッカー用語${TERMS.length}語を、初心者向けに一言解説＋動く戦術ボードで図解。ハーフスペース、ネガトラ、xG、ゲーゲンプレス、DOGSOなど。`;
  const url = SITE + "/terms/";
  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "DefinedTermSet", name: "ピッチの辞書 サッカー用語集", url, inLanguage: "ja",
      hasDefinedTerm: TERMS.map((t) => ({ "@type": "DefinedTerm", name: t.name, alternateName: t.en, url: termUrl(t.id) })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ピッチの辞書", item: SITE + "/" },
        { "@type": "ListItem", position: 2, name: "サッカー用語一覧", item: url },
      ],
    },
  ];
  const trend = TREND.map((id) => TERMS.find((t) => t.id === id)).filter(Boolean);
  return head({ title, desc, url, jsonld, ogType: "website" }) + `
<main class="wrap tmain tindex">
  <nav class="crumb" aria-label="パンくず"><a href="/">ピッチの辞書</a> › <span>用語一覧</span></nav>
  <article class="tarticle">
    <h1>サッカー用語一覧 <small>全${TERMS.length}語</small></h1>
    <p class="tlead">実況・コラム・データ・ルールの4カテゴリ。用語名をタップすると、意味の一言解説と<strong>動く戦術ボード</strong>による図解ページが開きます。</p>
    <nav class="tjump" aria-label="カテゴリ">${CATS.map((c) => `<a href="#cat-${c}" style="--cc:${CAT[c].col};--ccd:${CAT[c].d}">${esc(CAT[c].label)}（${byCat[c].length}）</a>`).join("")}</nav>

    <section class="tstep">
      <h2>🔥 いま実況・SNSでよく飛び交うワード</h2>
      <div class="tchips">${trend.map(chip).join("")}</div>
    </section>

    ${CATS.map((c) => `<section class="tstep tcatsec" id="cat-${c}" style="--cc:${CAT[c].col};--ccd:${CAT[c].d}">
      <h2>${esc(CAT[c].label)} <small>${byCat[c].length}語</small></h2>
      <ul class="tlist">
        ${byCat[c].map((t) => `<li><a href="${termPath(t.id)}"><span class="temoji" aria-hidden="true">${EMOJI[t.id] || "⚽"}</span><b>${esc(t.name)}</b><i lang="en">${esc(t.en)}</i><span class="tone">${esc(strip(t.one))}</span></a></li>`).join("\n        ")}
      </ul>
    </section>`).join("\n")}

    <div class="affslot" data-aff="home"></div>
  </article>
</main>
` + foot();
}

/* ---------- 7) CSS ---------- */
const css = `/* 生成物: scripts/build-pages.js が作成。直接編集しない */
:root{--bg:#EAF2FF;--panel:#fff;--ink:#111C36;--muted:#46577A;--accent:#FFC01E;--accentD:#E07C00;--cyan:#1E96E0;--r:18px;
  --round:"Zen Maru Gothic","Zen Kaku Gothic New","Hiragino Maru Gothic ProN",sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:#1536C4;color:var(--ink);font-family:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;font-size:16px;line-height:1.75;min-height:100vh;-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px}
a{color:#0E6EAF}
/* header */
.th{position:sticky;top:0;z-index:50;background:linear-gradient(180deg,#FFC93A,var(--accent) 55%,var(--accentD) 165%);box-shadow:0 3px 16px rgba(10,20,50,.2)}
.th::after{content:"";display:block;height:5px;background:linear-gradient(90deg,#12203C,#12203C 14%,#FFC01E 24%,#FFD84D 50%,#FFC01E 76%,#12203C 86%,#12203C)}
.thbar{display:flex;align-items:center;gap:14px;padding:10px 18px;flex-wrap:wrap}
.tlogo{display:flex;align-items:center;gap:10px;text-decoration:none;white-space:nowrap}
.tlogo img{width:40px;height:40px;border-radius:12px;background:#1536C4;border:2px solid rgba(255,255,255,.85);object-fit:contain;padding:1px}
.tlogo b{display:block;font-family:"Dela Gothic One",var(--round);font-size:19px;color:#fff;line-height:1.1;text-shadow:-2px -2px 0 #12203C,2px -2px 0 #12203C,-2px 2px 0 #12203C,2px 2px 0 #12203C,0 -2px 0 #12203C,0 2px 0 #12203C,-2px 0 0 #12203C,2px 0 0 #12203C}
.tlogo small{display:block;color:#1B2A4A;font-size:10.5px;font-weight:700;letter-spacing:.24em;font-family:Oswald,sans-serif;margin-top:2px}
.tsearch{flex:1;min-width:200px;max-width:460px;display:flex;position:relative}
.tsearch input{width:100%;padding:10px 46px 10px 18px;border-radius:999px;background:#fff;border:2px solid rgba(20,45,95,.18);font:inherit;font-size:15px;outline:none}
.tsearch input:focus{border-color:#12203C}
.tsearch button{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:none;border-radius:50%;background:#12203C;color:#fff;cursor:pointer;font-size:14px}
/* main */
.tmain{padding:22px 18px 40px;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:start}
@media (max-width:900px){.tmain{grid-template-columns:1fr}}
.crumb{grid-column:1/-1;font-size:13px;color:rgba(255,255,255,.85);margin-bottom:-6px;overflow-wrap:anywhere}
.crumb a{color:#fff;font-weight:700}
.tarticle{background:var(--panel);border:2.5px solid rgba(20,40,90,.14);border-radius:22px;padding:24px 24px 26px;box-shadow:0 8px 0 rgba(20,40,90,.12),0 20px 40px rgba(0,0,0,.25);position:relative;overflow:hidden;min-width:0}
.tarticle::before{content:"";position:absolute;left:0;right:0;top:0;height:8px;background:linear-gradient(90deg,var(--cc,#FFC01E),color-mix(in srgb,var(--cc,#FFC01E) 60%,#fff))}
.tmeta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.tcat{font-size:12.5px;font-weight:800;color:var(--ccd,#B26A00);text-decoration:none;background:color-mix(in srgb,var(--cc,#FFC01E) 14%,#fff);border:1.5px solid color-mix(in srgb,var(--cc,#FFC01E) 45%,#fff);padding:4px 12px;border-radius:999px}
.tlvl{font-size:12.5px;font-weight:800;color:var(--accentD);background:#FFF4D6;border:1.5px solid #FFD98A;padding:4px 12px;border-radius:999px}
h1{font-family:var(--round);font-weight:900;font-size:clamp(24px,5.2vw,34px);line-height:1.3;letter-spacing:.01em;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
h1 small{font-size:.5em;color:var(--muted);font-weight:700}
.temoji{display:inline-grid;place-items:center;width:1.5em;height:1.5em;border-radius:.45em;background:#fff;border:2.5px solid var(--cc,#FFC01E);box-shadow:0 3px 0 var(--cc,#FFC01E);font-size:.85em;flex:none}
.ten{font-family:Oswald,sans-serif;font-size:14px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin:6px 0 12px;display:flex;gap:14px;flex-wrap:wrap}
.tkana{font-family:inherit;text-transform:none;letter-spacing:0;font-size:13px}
.tlead{font-size:17px;line-height:1.85;margin-bottom:8px}
.tstep{margin-top:26px}
.tstep h2{font-family:var(--round);font-size:16px;font-weight:900;color:#12203C;display:flex;align-items:center;gap:9px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px dashed rgba(20,40,90,.14)}
.tstep h2 small{font-size:12.5px;color:var(--muted);font-weight:700}
.snum{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#12203C;color:var(--accent);font-family:Oswald,sans-serif;font-size:13px;flex:none}
.tcatch{font-family:var(--round);font-size:20px;font-weight:900;line-height:1.55;color:#12203C;background:linear-gradient(180deg,#FFF8E1,#FFF1C2);border-left:6px solid var(--accent);border-radius:0 14px 14px 0;padding:14px 18px}
${vizCss}
.viz{margin-top:4px}
.vizcap{font-size:13px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.65}
.tapp{text-align:center;margin-top:12px}
.tbtn{display:inline-block;font-weight:900;color:#12203C;text-decoration:none;font-size:14.5px;background:linear-gradient(92deg,#FFDA6A,#FFC01E);border:2px solid #12203C;padding:10px 20px;border-radius:999px;box-shadow:0 4px 0 #12203C;transition:transform .12s}
.tbtn:hover{transform:translateY(-2px)}
.why{font-size:15.5px;line-height:1.95}
.why b{color:var(--accentD)}
.usage{font-size:14.5px;color:var(--ink);background:#EAF4FF;border-left:4px solid var(--cyan);border-radius:0 10px 10px 0;padding:13px 17px;line-height:1.8;margin-top:12px}
.usage .who{font-size:12px;color:#0E6EAF;font-weight:800;letter-spacing:.06em;display:block;margin-bottom:3px}
.tchips{display:flex;flex-wrap:wrap;gap:8px}
.tchip{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:800;padding:7px 14px 7px 9px;border-radius:999px;text-decoration:none;background:#fff;color:var(--ccd,#0E6EAF);border:2px solid color-mix(in srgb,var(--cc,#1E96E0) 45%,#fff);transition:background .15s,transform .12s}
.tchip:hover{background:color-mix(in srgb,var(--cc,#1E96E0) 12%,#fff);transform:translateY(-1px)}
.tchip span{font-size:15px}
.ten-sec{background:#F6F8FC;border-radius:14px;padding:16px 18px 18px;border:1px solid rgba(20,40,90,.1)}
.ten-sec h2{border-bottom-color:rgba(20,40,90,.18)}
.ten-sec .tlead{font-size:15.5px}.ten-sec .tcatch{font-size:17px}
.tshare{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:26px;font-size:13.5px;font-weight:700;color:var(--muted)}
.sbtn{display:inline-block;text-decoration:none;font-weight:800;font-size:13.5px;padding:8px 16px;border-radius:999px;color:#fff;border:2px solid #12203C;box-shadow:0 3px 0 #12203C}
.sbtn.x{background:#111}.sbtn.line{background:#06C755}
.tpn{display:flex;justify-content:space-between;gap:12px;margin-top:22px;padding-top:16px;border-top:2px dashed rgba(20,40,90,.14);font-weight:800;font-size:14px}
.tpn a{text-decoration:none;color:#0E6EAF}
.taside{background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.28);border-radius:20px;padding:18px 16px;color:#fff;position:sticky;top:96px}
.taside h2{font-family:var(--round);font-size:15px;font-weight:900;margin-bottom:12px;color:#fff}
.taside .tchip{font-size:13px;padding:6px 12px 6px 8px}
.tmore{margin-top:14px;font-size:14px;font-weight:800}.tmore a{color:#FFD84D}
/* index */
.tindex{grid-template-columns:1fr}
.tjump{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px}
.tjump a{text-decoration:none;font-weight:800;font-size:13.5px;color:var(--ccd);background:color-mix(in srgb,var(--cc) 14%,#fff);border:2px solid color-mix(in srgb,var(--cc) 45%,#fff);padding:7px 14px;border-radius:999px}
.tcatsec{scroll-margin-top:90px}
.tcatsec h2{color:var(--ccd);border-bottom-color:color-mix(in srgb,var(--cc) 50%,#fff)}
.tlist{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.tlist a{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;text-decoration:none;color:var(--ink);background:#fff;border:2px solid rgba(20,40,90,.12);border-radius:14px;padding:11px 13px;height:100%;transition:transform .12s,border-color .12s}
.tlist a:hover{transform:translateY(-2px);border-color:var(--cc)}
.tlist .temoji{grid-row:1/3;font-size:20px}
.tlist b{font-family:var(--round);font-size:15.5px;font-weight:900;line-height:1.3}
.tlist i{font-style:normal;font-family:Oswald,sans-serif;font-size:11px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-left:8px}
.tlist .tone{grid-column:2;font-size:12.5px;color:#33456A;line-height:1.5}
/* affiliate slot（affiliates.js が描画） */
.affslot{margin-top:26px}
.affbox{border:2px dashed rgba(20,40,90,.18);border-radius:16px;padding:14px 16px 16px;background:#FBFCFF}
.affbox .afft{display:flex;align-items:center;gap:8px;font-family:var(--round);font-weight:900;font-size:15px;color:#12203C;margin-bottom:10px}
.affpr{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:#fff;background:#6B7A99;border-radius:4px;padding:2px 6px}
.affgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.affcard{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:var(--ink);background:#fff;border:2px solid rgba(20,40,90,.12);border-radius:14px;padding:12px 14px;transition:transform .12s,border-color .12s}
.affcard:hover{transform:translateY(-2px);border-color:var(--accent)}
.affcard .affbadge{font-size:11px;font-weight:800;color:var(--accentD)}
.affcard b{font-family:var(--round);font-size:15px;font-weight:900;line-height:1.35}
.affcard p{font-size:12.5px;color:#33456A;line-height:1.55}
.affcard .affbtn{margin-top:6px;align-self:flex-start;font-size:12.5px;font-weight:900;color:#12203C;background:var(--accent);border:2px solid #12203C;border-radius:999px;padding:5px 12px;box-shadow:0 2px 0 #12203C}
.affraw{display:grid;gap:10px}
.affraw>div{overflow-x:auto}
.affraw img{max-width:100%;height:auto}
.affnote{font-size:11.5px;color:var(--muted);margin-top:8px}
/* footer */
.tf{border-top:1px solid rgba(255,255,255,.2);padding:26px 0 44px;color:rgba(255,255,255,.88);font-size:13.5px;text-align:center;line-height:2}
.tfnav{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;font-weight:800}
.tfnav a{color:#fff;text-decoration:none}
.tfnav a:hover{color:#FFD84D}
.tfnote{margin-top:12px;font-size:12.5px;color:rgba(255,255,255,.75)}
.tfcopy{margin-top:10px;font-size:12.5px;color:#A9BEDF}
@media (max-width:640px){
  .tarticle{padding:18px 15px 20px;border-radius:18px}
  .tmain{padding:16px 12px 30px;gap:16px}
  .tcatch{font-size:17.5px;padding:12px 14px}
  .tlist{grid-template-columns:1fr}
  .taside{position:static}
}
/* ---------- 戦術ボードのアニメーション（index.html から抽出） ---------- */
${animCss}`;

/* ---------- 8) 書き出し ---------- */
const outTerms = path.join(ROOT, "terms");
fs.rmSync(outTerms, { recursive: true, force: true });
fs.mkdirSync(outTerms, { recursive: true });
for (const t of TERMS) {
  const dir = path.join(outTerms, t.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), termPage(t));
}
fs.writeFileSync(path.join(outTerms, "index.html"), indexPage());
fs.writeFileSync(path.join(ROOT, "terms.css"), css);

/* index.html の内部リンク一覧を静的に埋め込む（JSを実行しないクローラー対策） */
{
  const file = path.join(ROOT, "index.html");
  const raw = fs.readFileSync(file, "utf8");
  const open = '<div id="seolinklist">';
  const i = raw.indexOf(open);
  if (i < 0) {
    console.warn("⚠ index.html に #seolinklist が見つからないため、内部リンクの埋め込みをスキップしました");
  } else {
    const j = raw.indexOf("</div>", i);
    const links = TERMS.map((t) => `<a href="${termPath(t.id)}">${esc(shortName(t))}</a>`).join("");
    const next = raw.slice(0, i + open.length) + links + raw.slice(j);
    if (next !== raw) fs.writeFileSync(file, next);
  }
}

const urls = [
  { loc: SITE + "/", lastmod, changefreq: "weekly", priority: "1.0" },
  { loc: SITE + "/terms/", lastmod, changefreq: "weekly", priority: "0.9" },
  ...TERMS.map((t) => ({ loc: termUrl(t.id), lastmod, changefreq: "monthly", priority: TREND.includes(t.id) ? "0.8" : "0.7" })),
  { loc: SITE + "/privacy.html", lastmod: today, changefreq: "yearly", priority: "0.2" },
];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n") +
  `\n</urlset>\n`);

console.log(`✅ terms/<id>/index.html × ${TERMS.length}、terms/index.html、terms.css、sitemap.xml（${urls.length} URL）を生成しました。lastmod=${lastmod}`);
