// 정적 파일 서버 + 학술 API 중계(프록시).
// 국내 API(NTIS·KCI·RISS·공공데이터포털)는 브라우저 직접 호출(CORS)을 막으므로 이 서버가 대신 요청한다.
// 아무 주소나 중계하지 않도록 허용한 호스트만 통과시킨다. 의존성 없이 Node 18+ 에서 동작한다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5178;
const HOSTS = new Set([
  'api.openalex.org', 'api.semanticscholar.org', 'api.crossref.org', 'eutils.ncbi.nlm.nih.gov', 'api.elsevier.com',
  'www.ntis.go.kr', 'open.kci.go.kr', 'www.riss.kr', 'apis.data.go.kr',
  ...(process.env.PROXY_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean),
]);
const FORWARD = ['accept', 'x-api-key', 'x-els-apikey'];
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.sql': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

// 접속 주소별 분당 요청 수 제한
const hits = new Map();
const limited = ip => {
  const now = Date.now(), h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(ip, h);
  return h.n > 120;
};
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.t > 120000) hits.delete(k); }, 60000).unref();

const send = (res, status, body, type = 'text/plain; charset=utf-8', extra = {}) => {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(body);
};

async function proxy(req, res, url) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (limited(ip)) return send(res, 429, '요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
  let target;
  try { target = new URL(url.searchParams.get('url') || ''); } catch (e) { return send(res, 400, '중계할 주소가 올바르지 않습니다.'); }
  if (!/^https?:$/.test(target.protocol) || !HOSTS.has(target.hostname)) return send(res, 403, `허용하지 않은 주소입니다: ${target.hostname}`);
  const headers = { 'User-Agent': 'nrf50-platform/1.0 (research data search)' };
  for (const h of FORWARD) if (req.headers[h]) headers[h] = req.headers[h];
  try {
    const r = await fetch(target, { headers, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return send(res, 502, '응답이 너무 큽니다.');
    send(res, r.status, buf, r.headers.get('content-type') || 'application/octet-stream', { 'Cache-Control': 'no-store' });
  } catch (e) {
    send(res, 502, `원본 서버에 연결하지 못했습니다: ${e.name === 'TimeoutError' ? '시간 초과' : e.message}`);
  }
}

function serveFile(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  // 루트 밖이나 숨김 파일(.git 등), 서버 설정 파일은 내주지 않는다
  if (!file.startsWith(ROOT + path.sep) || rel.split('/').some(s => s.startsWith('.')) || /^\/(server\.js|package(-lock)?\.json)$/.test(rel)) return send(res, 404, 'Not found');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(file).toLowerCase();
    // index.html은 매번 새로 확인하게 해서 배포 직후 옛 화면이 남지 않게 한다. 나머지는 ?v= 꼬리표로 바꾼다
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/proxy/health') return send(res, 200, JSON.stringify({ ok: true, hosts: [...HOSTS] }), 'application/json', { 'Cache-Control': 'no-store' });
  if (url.pathname === '/proxy') return void proxy(req, res, url);
  serveFile(req, res, url);
}).listen(PORT, () => console.log(`nrf50-platform: http://localhost:${PORT}`));
