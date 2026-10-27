// 정적 파일 서버 + 학술 API 중계(프록시).
// 국내 API(NTIS·KCI·RISS·공공데이터포털)는 브라우저 직접 호출(CORS)을 막으므로 이 서버가 대신 요청한다.
// 아무 주소나 중계하지 않도록 허용한 호스트만 통과시킨다. 의존성 없이 Node 18+ 에서 동작한다.
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5178;
const HOSTS = new Set([
  'api.openalex.org', 'api.semanticscholar.org', 'api.crossref.org', 'eutils.ncbi.nlm.nih.gov', 'api.elsevier.com',
  'www.ntis.go.kr', 'open.kci.go.kr', 'www.riss.kr', 'apis.data.go.kr', 'plus.kipris.or.kr', 'pub.orcid.org',
  ...(process.env.PROXY_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean),
]);
const FORWARD = ['accept', 'x-api-key', 'x-els-apikey'];
const MAX_BYTES = 8 * 1024 * 1024;

// 서버 공용 API 키: 환경변수 KEY_<출처>(예: KEY_NTIS, KEY_KCI, KEY_RISS, KEY_KRM, KEY_SCOPUS, KEY_S2, KEY_OPENALEX, KEY_NCBI).
// 브라우저에는 값이 아니라 '어느 출처에 키가 있는지'만 알려 주고, 관리자 로그인 세션이 있는 요청에만 끼워 넣는다.
const SRVKEY = '__SERVER_KEY__';
const KEYS = Object.fromEntries(['ntis', 'kci', 'riss', 'krm', 'kipris', 'scopus', 's2', 'openalex', 'ncbi'].map(id => [id, process.env[`KEY_${id.toUpperCase()}`] || '']).filter(([, v]) => v));
// 관리자 암호 해시: 환경변수 ADMIN_HASH, 없으면 화면과 같은 assets/config.js 값
const ADMIN_HASH = process.env.ADMIN_HASH || ((fs.readFileSync(path.join(ROOT, 'assets/config.js'), 'utf8').match(/ADMIN_HASH:\s*'([0-9a-f]{64})'/) || [])[1] || '');
// 세션 서명 키: 환경변수 AUTH_SECRET, 없으면 실행할 때마다 새로 만든다(다시 시작하면 다시 로그인)
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_SEC = 12 * 3600;
const sign = v => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
const makeToken = () => { const exp = String(Math.floor(Date.now() / 1000) + SESSION_SEC); return `${exp}.${sign(exp)}`; };
const validToken = t => { const [exp, sig] = String(t || '').split('.'); if (!exp || !sig) return false; const want = sign(exp); return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)) && +exp > Date.now() / 1000; };
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(x => x[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const authed = req => validToken(cookies(req).nrf50_s);
const secure = req => (req.headers['x-forwarded-proto'] || '').includes('https');
// 응답에 되돌아온 키는 바이트 단위로 가린다(EUC-KR 응답도 키 자체는 ASCII)
const scrub = (buf, key) => { if (!key) return buf; const k = Buffer.from(key), mask = Buffer.from('***'), out = []; let i = 0, j; while ((j = buf.indexOf(k, i)) >= 0) { out.push(buf.subarray(i, j), mask); i = j + k.length; } out.push(buf.subarray(i)); return Buffer.concat(out); };
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8', '.sql': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

// 접속 주소별 분당 요청 수 제한
const hits = new Map();
const limited = (ip, max = 120, bucket = '') => {
  const k = bucket + ip, now = Date.now(), h = hits.get(k) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++; hits.set(k, h);
  return h.n > max;
};
const ipOf = req => req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.t > 120000) hits.delete(k); }, 60000).unref();

const send = (res, status, body, type = 'text/plain; charset=utf-8', extra = {}) => {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra });
  res.end(body);
};

async function proxy(req, res, url) {
  if (limited(ipOf(req))) return send(res, 429, '요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
  let raw = url.searchParams.get('url') || '', key = '';
  const headers0 = {}; for (const h of FORWARD) if (req.headers[h]) headers0[h] = req.headers[h];
  // 서버 공용 키 자리표시가 있으면 관리자 세션과 출처를 확인하고 실제 키로 바꾼다
  if (raw.includes(SRVKEY) || Object.values(headers0).includes(SRVKEY)) {
    if (!authed(req)) return send(res, 403, '서버 공용 키는 관리자 로그인 후에만 쓸 수 있습니다.');
    key = KEYS[url.searchParams.get('src')] || '';
    if (!key) return send(res, 403, '이 출처에는 서버 공용 키가 없습니다.');
    raw = raw.split(SRVKEY).join(encodeURIComponent(key));
    for (const h in headers0) if (headers0[h] === SRVKEY) headers0[h] = key;
  }
  let target;
  try { target = new URL(raw); } catch (e) { return send(res, 400, '중계할 주소가 올바르지 않습니다.'); }
  if (!/^https?:$/.test(target.protocol) || !HOSTS.has(target.hostname)) return send(res, 403, `허용하지 않은 주소입니다: ${target.hostname}`);
  const headers = { 'User-Agent': 'nrf50-platform/1.0 (research data search)', ...headers0 };
  try {
    const r = await fetch(target, { headers, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return send(res, 502, '응답이 너무 큽니다.');
    send(res, r.status, scrub(buf, key), r.headers.get('content-type') || 'application/octet-stream', { 'Cache-Control': 'no-store' });
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
  if (!file.startsWith(ROOT + path.sep) || rel.split('/').some(s => s.startsWith('.') || s === 'node_modules') || /^\/(server\.js|package(-lock)?\.json)$/.test(rel)) return send(res, 404, 'Not found');
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

// 결과보고서 AI 구조화: 관리자 세션이 있고 ANTHROPIC_API_KEY가 설정된 경우에만 동작한다.
// 모델이 뽑은 내용은 화면에서 연구진이 확인해야 확정된다(AI 단독 판정 금지).
const AI_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['topic', 'methods', 'outcomes', 'followups', 'keywords'],
  properties: { topic: { type: 'string' }, methods: { type: 'array', items: { type: 'string' } }, outcomes: { type: 'array', items: { type: 'string' } }, followups: { type: 'array', items: { type: 'string' } }, keywords: { type: 'array', items: { type: 'string' } } },
};
const AI_SYSTEM = '너는 한국연구재단 지원 과제의 결과보고서를 정리하는 연구 보조원이다. 주어진 본문에 실제로 적힌 내용만 근거로 연구 주제(topic, 한두 문장), 연구 방법(methods), 주요 성과(outcomes), 후속 성과·후속 연구(followups), 핵심어(keywords)를 한국어로 간결하게 뽑는다. 본문에 없는 내용은 추측하지 말고 해당 배열을 비워 둔다.';
const AI_MAX_CHARS = 150000;
function aiExtract(req, res) {
  if (!authed(req)) return send(res, 403, 'AI 구조화는 관리자 로그인 후에만 쓸 수 있습니다.');
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, '서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  if (limited(ipOf(req), 20, 'ai:')) return send(res, 429, 'AI 요청이 너무 많습니다. 1분 뒤 다시 하세요.');
  let body = '';
  req.on('data', c => { body += c; if (body.length > 1024 * 1024) req.destroy(); });
  req.on('end', async () => {
    let text = '', title = '';
    try { const j = JSON.parse(body); text = String(j.text || '').trim(); title = String(j.title || '').slice(0, 300); } catch (e) { return send(res, 400, 'Bad request'); }
    if (!text) return send(res, 400, '본문이 비어 있습니다.');
    // 잘라서 보내지 않는다. 너무 길면 나눠서 넣도록 알려 준다
    if (text.length > AI_MAX_CHARS) return send(res, 413, `본문이 너무 깁니다(${text.length.toLocaleString()}자). ${AI_MAX_CHARS.toLocaleString()}자 이하로 나눠 넣어 주세요.`);
    let Anthropic;
    try { const m = require('@anthropic-ai/sdk'); Anthropic = m.default || m; } catch (e) { return send(res, 503, '서버에 @anthropic-ai/sdk가 설치되지 않았습니다 (npm install).'); }
    const client = new Anthropic();
    try {
      const r = await client.beta.messages.create({
        model: process.env.AI_MODEL || 'claude-opus-5-5',
        max_tokens: 8000,
        // 안전 분류기가 거절하면 서버 쪽 대체 모델로 다시 시도한다
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: AI_SCHEMA } },
        system: AI_SYSTEM,
        messages: [{ role: 'user', content: `과제명: ${title || '(미상)'}\n\n결과보고서 본문:\n${text}` }],
      });
      if (r.stop_reason === 'refusal') return send(res, 422, JSON.stringify({ ok: false, error: '모델이 이 본문의 처리를 거절했습니다.' }), 'application/json');
      if (r.stop_reason === 'max_tokens') return send(res, 422, JSON.stringify({ ok: false, error: '응답이 길어 잘렸습니다. 본문을 나눠 넣어 주세요.' }), 'application/json');
      const out = r.content.find(b => b.type === 'text');
      send(res, 200, JSON.stringify({ ok: true, data: JSON.parse(out ? out.text : '{}'), model: r.model }), 'application/json', { 'Cache-Control': 'no-store' });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return send(res, 502, 'AI 키 인증에 실패했습니다.');
      if (e instanceof Anthropic.RateLimitError) return send(res, 429, 'AI 요청 한도를 넘었습니다. 잠시 후 다시 하세요.');
      if (e instanceof Anthropic.APIError) return send(res, 502, `AI 요청 오류 (${e.status ?? '연결'})`);
      if (e instanceof SyntaxError) return send(res, 502, 'AI 응답을 해석하지 못했습니다.');
      send(res, 500, 'AI 처리 중 오류가 났습니다.');
    }
  });
}

// 관리자 로그인: 화면과 같은 암호를 서버에서도 확인하고 HttpOnly 쿠키로 세션을 준다
function login(req, res) {
  if (limited(ipOf(req), 10, 'login:')) return send(res, 429, '시도가 너무 많습니다. 1분 뒤 다시 하세요.');
  let body = '';
  req.on('data', c => { body += c; if (body.length > 2048) req.destroy(); });
  req.on('end', () => {
    let pw = ''; try { pw = String(JSON.parse(body).password || ''); } catch (e) { return send(res, 400, 'Bad request'); }
    const h = crypto.createHash('sha256').update('nrf50:' + pw).digest('hex');
    if (!ADMIN_HASH || h.length !== ADMIN_HASH.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(ADMIN_HASH))) return send(res, 401, JSON.stringify({ ok: false }), 'application/json');
    send(res, 200, JSON.stringify({ ok: true }), 'application/json', { 'Cache-Control': 'no-store', 'Set-Cookie': `nrf50_s=${makeToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SEC}${secure(req) ? '; Secure' : ''}` });
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/auth/login') return login(req, res);
  if (req.method === 'POST' && url.pathname === '/ai/extract') return aiExtract(req, res);
  if (req.method === 'POST' && url.pathname === '/auth/logout') return send(res, 200, '{"ok":true}', 'application/json', { 'Set-Cookie': `nrf50_s=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure(req) ? '; Secure' : ''}` });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  if (url.pathname === '/proxy/health') return send(res, 200, JSON.stringify({ ok: true, hosts: [...HOSTS], keys: Object.keys(KEYS), auth: authed(req), ai: !!process.env.ANTHROPIC_API_KEY }), 'application/json', { 'Cache-Control': 'no-store' });
  if (url.pathname === '/proxy') return void proxy(req, res, url);
  serveFile(req, res, url);
}).listen(PORT, () => console.log(`nrf50-platform: http://localhost:${PORT}`));
