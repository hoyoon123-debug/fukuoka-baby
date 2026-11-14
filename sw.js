/* 후쿠오카 아기랑 - 오프라인 캐시: 한 번 본 화면·사진은 데이터 없이도 열려요 */
const C = "fk-v28";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.webmanifest"]))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const mine = u.origin === location.origin || u.hostname === "cdnjs.cloudflare.com" || u.hostname === "fonts.gstatic.com" || u.hostname === "fonts.googleapis.com";
  if (!mine) return;                       // 구글 지도는 캐시하지 않음 (약관)
  const page = e.request.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith("index.html") || u.pathname.endsWith(".js");
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: u.pathname.endsWith("/") || u.pathname.endsWith("index.html")});
    const net = fetch(e.request, page ? {cache: "no-cache"} : undefined).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (page) {                              // 화면·코드: 인터넷이 되면 항상 최신, 안 되면(3초) 저장본
      if (!hit) return net;
      return Promise.race([net, new Promise(res => setTimeout(() => res(hit), 3000))]).catch(() => hit);
    }
    return hit || net.catch(() => hit);
  }));
});
