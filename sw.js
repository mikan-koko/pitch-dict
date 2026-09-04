/* ピッチの辞書 Service Worker
 *
 * キャッシュ戦略（3種類）
 *   HTML            … network-first          更新を確実に取得。オフライン時のみキャッシュ
 *   JS / CSS / JSON … stale-while-revalidate 表示は即座、裏で更新して次回に反映
 *   画像・その他     … cache-first            めったに変わらないので速度優先
 *
 * ⚠️ JS・CSSを cache-first にしてはいけない。
 *    affiliates.js（広告設定）や terms.css を直しても、再訪問者に永久に届かなくなる。
 *    2026-09-04 に実際にこれが起き、広告の設定変更が反映されなかった。
 *
 * ⚠️ ASSETS に載せたファイルを増減したら CACHE のバージョンを上げること。
 */
const CACHE = "pitch-v3";
const ASSETS = [
  "/", "/index.html", "/mascotc.webp", "/icon.svg",
  "/icon-512.png", "/manifest.json", "/og-v2.png",
  "/terms.css", "/affiliates.js", "/terms/", "/404.html"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      // 1ファイルでも失敗するとインストール全体が落ちるので個別に入れる
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 広告・計測など外部は素通し

  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match("/index.html")))
    );
    return;
  }

  const isCode = /\.(js|css|json|xml)$/i.test(url.pathname);
  if (isCode) {
    // stale-while-revalidate：キャッシュを即返しつつ、裏で必ず取り直す
    e.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req).then(r => {
          if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
          return r;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // 画像・フォントなど：cache-first
  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => m))
  );
});
