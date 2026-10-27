// 서버 저장소와 업무 API. server.js가 불러 쓴다.
// 저장은 DATA_DIR(기본 ./data)의 JSON 파일이다. Railway에서는 볼륨을 DATA_DIR에 붙여야 다시 배포해도 남는다.
// 쓰기는 모두 감사 로그(audit)에 남긴다. 공개(로그인 없는) 쓰기는 투표·응원·연구자 입력 폼뿐이고 크기와 횟수를 제한한다.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = ctx => {
  const { ROOT, send, limited, ipOf, session, SECRET } = ctx;
  const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* 읽기 전용이면 메모리에만 둔다 */ }

  /* ---------- 파일 저장소 ---------- */
  const NS = /^[a-z][a-z0-9_]{0,30}$/, cache = new Map(), timers = new Map();
  const load = ns => {
    if (!cache.has(ns)) { let v = {}; try { v = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${ns}.json`), 'utf8')); } catch (e) { /* 처음 */ } cache.set(ns, v); }
    return cache.get(ns);
  };
  const save = ns => {
    clearTimeout(timers.get(ns));
    timers.set(ns, setTimeout(() => { const f = path.join(DATA_DIR, `${ns}.json`); try { fs.writeFileSync(f + '.tmp', JSON.stringify(cache.get(ns))); fs.renameSync(f + '.tmp', f); } catch (e) { console.error('store', ns, e.message); } }, 300));
  };
  const writable = (() => { try { const f = path.join(DATA_DIR, '.w'); fs.writeFileSync(f, '1'); fs.unlinkSync(f); return true; } catch (e) { return false; } })();

  const audit = (req, action, detail = {}) => {
    const A = load('audit'), s = session(req) || {}, id = `${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
    A[id] = { at: new Date().toISOString(), user: s.u || '(공개)', role: s.r || '', action, ...detail };
    const keys = Object.keys(A); if (keys.length > 5000) for (const k of keys.slice(0, keys.length - 5000)) delete A[k];
    save('audit');
  };

  const body = (req, max = 2 * 1024 * 1024) => new Promise((res, rej) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > max) { rej(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { rej(e); } });
  });
  const json = (res, status, v) => send(res, status, JSON.stringify(v), 'application/json', { 'Cache-Control': 'no-store' });
  const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const ROLES = ['admin', 'researcher', 'reviewer', 'foundation'];
  const can = (req, ...roles) => { const s = session(req); return s && roles.includes(s.r); };
  const EDIT = ['admin', 'researcher'];

  /* ---------- 계정: 관리자는 ADMIN_HASH, 그 밖은 users.json(scrypt) ---------- */
  const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
  const checkUser = (u, pw) => {
    const U = load('users')[u]; if (!U) return null;
    const h = hashPw(pw, U.salt); return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(U.hash)) ? U.role : null;
  };

  /* ---------- 공유 상태(db.data 대체): 공개 화면에 필요한 키만 로그인 없이 읽는다 ---------- */
  const STATE_KEYS = ['status', 'evidence', 'review', 'interviews', 'imported', 'linked', 'scoreOv', 'drafts', 'workflow'];
  const PUBLIC_KEYS = ['status', 'imported', 'scoreOv'];
  const WRITE_BY = { review: ['admin', 'researcher', 'reviewer'], workflow: ['admin', 'researcher', 'reviewer'] };

  /* ---------- 시연 데이터: 공개 API·공유 미리보기용으로 data.js를 격리 실행해 읽는다 ---------- */
  let DATA = null;
  const data = () => {
    if (DATA) return DATA;
    const c = { console }; vm.createContext(c);
    vm.runInContext(`${fs.readFileSync(path.join(ROOT, 'assets/config.js'), 'utf8')}\n${fs.readFileSync(path.join(ROOT, 'assets/data.js'), 'utf8')}\n;this.__d = { O: OUTCOMES, P: PEOPLE, D: DOMAINS, E: ERAS, FEEL, STAGES, O_GUIDE, P_GUIDE, PATH_STAGES };`, c, { timeout: 2000 });
    return (DATA = c.__d);
  };
  const stageOf = it => { const st = load('state').status?.v || {}; return st[it.id] ?? it.stage0; };

  /* ---------- 연구자 입력 폼 링크: 항목 id와 만료를 서명한 토큰 ---------- */
  const b64 = s => Buffer.from(s).toString('base64url');
  const formToken = (id, days = 30) => { const p = b64(JSON.stringify({ i: id, e: Math.floor(Date.now() / 1000) + days * 86400 })); return `${p}.${crypto.createHmac('sha256', SECRET).update('form:' + p).digest('base64url')}`; };
  const formCheck = t => {
    const [p, sig] = String(t || '').split('.'); if (!p || !sig) return null;
    const want = crypto.createHmac('sha256', SECRET).update('form:' + p).digest('base64url');
    if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
    try { const v = JSON.parse(Buffer.from(p, 'base64url').toString()); return v.e > Date.now() / 1000 ? v : null; } catch (e) { return null; }
  };

  /* ---------- 자동 추적: 30일마다 OpenAlex에서 새 논문을 찾아 '새 자료'로 쌓는다 ---------- */
  const WATCH_DAYS = Number(process.env.WATCH_DAYS) || 30;
  const normKey = r => (r.doi || '').toLowerCase().replace(/^https?:\/\/doi\.org\//, '') || clip(r.title, 200).toLowerCase().replace(/\s+/g, ' ');
  const runWatch = async (w, force) => {
    if (!force && w.last && Date.now() - new Date(w.last) < WATCH_DAYS * 864e5) return 0;
    const since = (w.last || `${w.from || 2000}-01-01`).slice(0, 10);
    const key = process.env.KEY_OPENALEX ? `&api_key=${encodeURIComponent(process.env.KEY_OPENALEX)}` : '';
    const u = `https://api.openalex.org/works?search=${encodeURIComponent(w.query)}&filter=from_publication_date:${since}${w.nrf ? ',funders.id:F4320322120' : ''}&sort=publication_date:desc&per-page=50&select=id,title,publication_year,cited_by_count,doi,authorships,primary_location,funders${key}`;
    let n = 0;
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'nrf50-platform' } }); if (!r.ok) throw new Error(`OpenAlex ${r.status}`);
      const d = await r.json(), A = load('alerts'), have = new Set(Object.values(A).filter(a => a.itemId === w.itemId).map(a => a.k));
      for (const x of d.results || []) {
        const rec = { title: clip(x.title, 300), year: x.publication_year, cites: x.cited_by_count, doi: clip(x.doi, 200), url: clip(x.doi || x.id, 300), venue: clip(x.primary_location?.source?.display_name, 200),
          authors: (x.authorships || []).slice(0, 5).map(a => clip(a.author?.display_name, 80)), nrf: (x.funders || []).some(f => /F4320322120/.test(f.id || '')), srcs: ['OpenAlex'] };
        const k = normKey(rec); if (!rec.title || have.has(k) || rec.year > new Date().getFullYear() + 1) continue; have.add(k);
        A[`${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`] = { itemId: w.itemId, k, rec, at: new Date().toISOString(), status: 'new', watch: w.id }; n++;
      }
      save('alerts'); w.err = '';
    } catch (e) { w.err = e.message; }
    w.last = new Date().toISOString(); w.lastN = n; save('watch'); return n;
  };
  const runAll = async force => { let n = 0; for (const w of Object.values(load('watch'))) n += await runWatch(w, force); return n; };
  setInterval(() => runAll(false).catch(() => {}), 6 * 3600e3).unref();
  setTimeout(() => runAll(false).catch(() => {}), 60e3).unref();

  /* ---------- 라우터 ---------- */
  const router = async (req, res, url) => {
    const p = url.pathname, M = req.method;
    if (!p.startsWith('/api/') && !p.startsWith('/s/')) return false;
    try {
      // 공유 미리보기: SNS가 읽는 제목·설명을 담고 사람은 이야기 페이지로 보낸다
      if (p.startsWith('/s/')) {
        const id = p.slice(3), D = data(), it = [...D.O, ...D.P].find(x => x.id === id);
        if (!it) return send(res, 404, 'Not found'), true;
        const title = it.kind === 'o' ? it.title : `${it.field} 연구자`, desc = D.FEEL[it.guide] || '대한민국 연구 50년 대표 사례', esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const to = `/#/svc/story/${id}`;
        send(res, 200, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)} · 대한민국 연구 50년</title><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)} · 대한민국 연구 50년"><meta property="og:description" content="${esc(desc)}"><meta property="og:site_name" content="대한민국 연구 50년"><meta name="twitter:card" content="summary"><meta http-equiv="refresh" content="0;url=${to}"></head><body><a href="${to}">${esc(title)}</a></body></html>`, 'text/html; charset=utf-8');
        return true;
      }
      if (p === '/api/health') return json(res, 200, { ok: true, store: writable, session: session(req), ai: !!process.env.ANTHROPIC_API_KEY, watchDays: WATCH_DAYS }), true;

      /* 공유 상태 */
      if (p === '/api/state' && M === 'GET') {
        const S = load('state'), s = session(req), keys = s ? STATE_KEYS : PUBLIC_KEYS;
        return json(res, 200, Object.fromEntries(keys.filter(k => S[k]).map(k => [k, S[k]]))), true;
      }
      const ms = p.match(/^\/api\/state\/([a-zA-Z]+)$/);
      if (ms && M === 'PUT') {
        const k = ms[1]; if (!STATE_KEYS.includes(k)) return json(res, 400, { ok: false }), true;
        if (!can(req, ...(WRITE_BY[k] || EDIT))) return json(res, 403, { ok: false, error: '권한이 없습니다.' }), true;
        const b = await body(req, 8 * 1024 * 1024), S = load('state'), s = session(req);
        S[k] = { v: b.v, at: new Date().toISOString(), by: s.u }; save('state'); audit(req, 'state', { key: k });
        return json(res, 200, { ok: true, at: S[k].at }), true;
      }

      /* 모집단 레코드(키-값 묶음) */
      const mk = p.match(/^\/api\/kv\/(pool|poolmeta|poollog)$/);
      if (mk) {
        const ns = mk[1];
        if (!can(req, ...EDIT, 'foundation')) return json(res, 403, { ok: false }), true;
        if (M === 'GET') return json(res, 200, load(ns)), true;
        if (!can(req, ...EDIT)) return json(res, 403, { ok: false }), true;
        const b = await body(req, 20 * 1024 * 1024), S = load(ns); let n = 0;
        if (M === 'POST') for (const [k, v] of Object.entries(b.items || {})) { if (typeof k === 'string' && k.length < 300) { S[k] = v; n++; } }
        else if (M === 'DELETE') for (const k of b.keys || []) { delete S[k]; n++; }
        save(ns); audit(req, `${ns}:${M}`, { n }); return json(res, 200, { ok: true, n }), true;
      }

      /* 계정 */
      if (p === '/api/users') {
        if (!can(req, 'admin')) return json(res, 403, { ok: false }), true;
        const U = load('users');
        if (M === 'GET') return json(res, 200, Object.entries(U).map(([id, u]) => ({ id, role: u.role, name: u.name, at: u.at }))), true;
        const b = await body(req, 4096), id = clip(b.id, 40).toLowerCase();
        if (M === 'DELETE') { delete U[id]; save('users'); audit(req, 'user:delete', { target: id }); return json(res, 200, { ok: true }), true; }
        if (!/^[a-z0-9._-]{3,40}$/.test(id) || !ROLES.includes(b.role) || String(b.password || '').length < 8) return json(res, 400, { ok: false, error: '아이디(영문·숫자 3자 이상), 역할, 8자 이상 암호가 필요합니다.' }), true;
        const salt = crypto.randomBytes(16).toString('hex');
        U[id] = { role: b.role, name: clip(b.name, 40), salt, hash: hashPw(b.password, salt), at: new Date().toISOString() }; save('users'); audit(req, 'user:set', { target: id, to: b.role });
        return json(res, 200, { ok: true }), true;
      }
      if (p === '/api/audit' && M === 'GET') {
        if (!can(req, 'admin', 'foundation')) return json(res, 403, { ok: false }), true;
        return json(res, 200, Object.entries(load('audit')).slice(-500).reverse().map(([id, a]) => ({ id, ...a }))), true;
      }
      if (p === '/api/backup' && M === 'GET') {
        if (!can(req, 'admin')) return json(res, 403, { ok: false }), true;
        const out = {}; for (const ns of ['state', 'pool', 'poolmeta', 'poollog', 'watch', 'alerts', 'forms', 'votes', 'cheers', 'audit']) out[ns] = load(ns);
        audit(req, 'backup'); return send(res, 200, JSON.stringify({ kind: 'nrf50-backup', at: new Date().toISOString(), data: out }), 'application/json', { 'Content-Disposition': 'attachment; filename="nrf50-server-backup.json"', 'Cache-Control': 'no-store' }), true;
      }

      /* 연구자 입력 폼 */
      if (p === '/api/forms/token' && M === 'POST') {
        if (!can(req, ...EDIT)) return json(res, 403, { ok: false }), true;
        const b = await body(req, 2048), D = data(); if (!D.P.some(x => x.id === b.id)) return json(res, 400, { ok: false }), true;
        const days = Math.min(90, Math.max(1, +b.days || 30)); audit(req, 'form:token', { target: b.id, days });
        return json(res, 200, { ok: true, token: formToken(b.id, days), days }), true;
      }
      if (p === '/api/forms' && M === 'GET') {
        if (!can(req, ...EDIT, 'foundation')) return json(res, 403, { ok: false }), true;
        return json(res, 200, load('forms')), true;
      }
      const mf = p.match(/^\/api\/forms\/([A-Za-z0-9_.-]+)$/);
      if (mf) {
        const t = formCheck(mf[1]); if (!t) return json(res, 410, { ok: false, error: '링크가 만료되었거나 올바르지 않습니다.' }), true;
        const D = data(), it = D.P.find(x => x.id === t.i);
        if (M === 'GET') { const prev = load('forms')[t.i]; return json(res, 200, { ok: true, id: t.i, field: it?.field, until: new Date(t.e * 1000).toISOString().slice(0, 10), sent: !!prev }), true; }
        if (M === 'POST') {
          if (limited(ipOf(req), 6, 'form:')) return json(res, 429, { ok: false, error: '잠시 후 다시 보내 주세요.' }), true;
          const b = await body(req, 32 * 1024), F = load('forms'), f = {};
          for (const [k, n] of [['name', 40], ['org', 120], ['email', 120], ['career', 3000], ['works', 3000], ['story', 3000], ['schedule', 300], ['note', 1000]]) f[k] = clip(b[k], n);
          for (const k of ['agreeInterview', 'agreeName', 'agreePhoto', 'agreeData']) f[k] = !!b[k];
          if (!f.agreeData) return json(res, 400, { ok: false, error: '개인정보 수집·이용 동의가 필요합니다.' }), true;
          F[t.i] = { ...f, at: new Date().toISOString(), history: [...(F[t.i]?.history || []), F[t.i] ? { at: F[t.i].at } : null].filter(Boolean).slice(-10) };
          save('forms'); audit(req, 'form:submit', { target: t.i }); return json(res, 200, { ok: true }), true;
        }
      }

      /* 국민 참여: 투표·응원 */
      if (p === '/api/votes' && M === 'GET') { const V = load('votes'), c = {}; for (const v of Object.values(V)) for (const id of v.ids || []) c[id] = (c[id] || 0) + 1; return json(res, 200, c), true; }
      if (p === '/api/vote' && M === 'POST') {
        if (limited(ipOf(req), 10, 'vote:')) return json(res, 429, { ok: false }), true;
        const b = await body(req, 1024), D = data(), ids = [...new Set([].concat(b.ids || []))].filter(id => D.O.some(x => x.id === id)).slice(0, 3);
        if (!ids.length) return json(res, 400, { ok: false }), true;
        // 같은 접속 주소는 하루에 한 번(마지막 선택으로 덮어쓴다). 주소는 해시로만 남긴다
        const V = load('votes'), k = crypto.createHash('sha256').update(`${SECRET}:${ipOf(req)}:${new Date().toISOString().slice(0, 10)}`).digest('hex').slice(0, 24);
        V[k] = { ids, at: new Date().toISOString() }; save('votes'); return json(res, 200, { ok: true }), true;
      }
      if (p === '/api/cheers' && M === 'GET') {
        const C = load('cheers'), all = url.searchParams.get('all') === '1' && can(req, ...EDIT);
        return json(res, 200, Object.entries(C).filter(([, c]) => all || c.ok).map(([id, c]) => ({ id, ...c })).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 500)), true;
      }
      if (p === '/api/cheer' && M === 'POST') {
        if (limited(ipOf(req), 5, 'cheer:')) return json(res, 429, { ok: false, error: '잠시 후 다시 남겨 주세요.' }), true;
        const b = await body(req, 2048), D = data(), id = [...D.O, ...D.P].some(x => x.id === b.id) ? b.id : null, text = clip(b.text, 200);
        if (!id || text.length < 2) return json(res, 400, { ok: false }), true;
        load('cheers')[`${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`] = { item: id, text, nick: clip(b.nick, 20) || '익명', at: new Date().toISOString(), ok: false };
        save('cheers'); return json(res, 200, { ok: true, pending: true }), true;
      }
      const mc = p.match(/^\/api\/cheers\/([a-z0-9]+)$/);
      if (mc && M === 'POST') {
        if (!can(req, ...EDIT)) return json(res, 403, { ok: false }), true;
        const b = await body(req, 256), C = load('cheers'); if (!C[mc[1]]) return json(res, 404, { ok: false }), true;
        if (b.op === 'delete') delete C[mc[1]]; else C[mc[1]].ok = true;
        save('cheers'); audit(req, `cheer:${b.op === 'delete' ? 'delete' : 'approve'}`, { target: mc[1] }); return json(res, 200, { ok: true }), true;
      }

      /* 자동 추적 */
      if (p === '/api/watch') {
        if (!can(req, ...EDIT, 'foundation')) return json(res, 403, { ok: false }), true;
        const W = load('watch');
        if (M === 'GET') return json(res, 200, Object.values(W)), true;
        if (!can(req, ...EDIT)) return json(res, 403, { ok: false }), true;
        const b = await body(req, 2048);
        if (M === 'DELETE') { delete W[b.id]; save('watch'); audit(req, 'watch:delete', { target: b.id }); return json(res, 200, { ok: true }), true; }
        const q = clip(b.query, 200); if (!q || !b.itemId) return json(res, 400, { ok: false }), true;
        const id = clip(b.itemId, 20); W[id] = { id, itemId: id, query: q, nrf: !!b.nrf, from: +b.from || 2000, last: W[id]?.last || null, at: new Date().toISOString() };
        save('watch'); audit(req, 'watch:set', { target: id }); return json(res, 200, { ok: true }), true;
      }
      if (p === '/api/watch/run' && M === 'POST') {
        if (!can(req, ...EDIT)) return json(res, 403, { ok: false }), true;
        if (limited(ipOf(req), 3, 'watchrun:')) return json(res, 429, { ok: false }), true;
        const b = await body(req, 256), W = load('watch'), n = b.id && W[b.id] ? await runWatch(W[b.id], true) : await runAll(true);
        audit(req, 'watch:run', { n }); return json(res, 200, { ok: true, n }), true;
      }
      if (p === '/api/alerts') {
        if (!can(req, ...EDIT, 'foundation')) return json(res, 403, { ok: false }), true;
        const A = load('alerts');
        if (M === 'GET') return json(res, 200, Object.entries(A).filter(([, a]) => a.status === 'new').map(([id, a]) => ({ id, ...a }))), true;
        if (M === 'POST' && can(req, ...EDIT)) { const b = await body(req, 64 * 1024); for (const id of b.ids || []) if (A[id]) A[id].status = b.status === 'linked' ? 'linked' : 'dismissed'; save('alerts'); return json(res, 200, { ok: true }), true; }
      }

      /* 오픈 데이터 (CC BY 4.0) */
      const mo = p.match(/^\/api\/open\/(outcomes|people)\.(json|csv)$/);
      if (mo && M === 'GET') {
        if (limited(ipOf(req), 60, 'open:')) return send(res, 429, 'Too many requests'), true;
        const D = data(), dom = id => D.D.find(d => d.id === id)?.label || id;
        const rows = mo[1] === 'outcomes'
          ? D.O.map(o => ({ id: o.id, title: o.title, domain: dom(o.domain), type: D.O_GUIDE[o.guide], first_support: o.path[0].year, spread_years: o.path[3].year - o.path[0].year, region: o.region, stages: o.path.map((x, i) => `${x.year} ${D.PATH_STAGES[i]}`).join(' > '), status: D.STAGES[stageOf(o)], message: D.FEEL[o.guide] }))
          : D.P.map(r => ({ id: r.id, field: r.field, domain: dom(r.domain), type: D.P_GUIDE[r.guide], first_support: r.y0, support_years: r.years, grants: r.grants, alumni: r.alumni, stages: r.life.map(x => `${x.year} ${x.stage}`).join(' > '), status: D.STAGES[stageOf(r)] }));
        const meta = { license: 'CC BY 4.0', attribution: '대한민국 연구 50년(한국연구재단·한국외국어대학교)', note: '시연용 예시 데이터이며 실제 선정 결과가 아닙니다. 연구자는 익명 처리했습니다.', updated: new Date().toISOString().slice(0, 10) };
        const head = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=600' };
        if (mo[2] === 'json') return send(res, 200, JSON.stringify({ ...meta, count: rows.length, items: rows }), 'application/json; charset=utf-8', head), true;
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, cols = Object.keys(rows[0]);
        return send(res, 200, '﻿' + [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\r\n'), 'text/csv; charset=utf-8', { ...head, 'Content-Disposition': `attachment; filename="nrf50-${mo[1]}.csv"` }), true;
      }

      /* AI 원고 초안·보도자료 */
      if (p === '/api/ai/write' && M === 'POST') return void ctx.aiWrite(req, res, body, audit), true;

      return json(res, 404, { ok: false }), true;
    } catch (e) {
      json(res, e.message === 'too large' ? 413 : 400, { ok: false, error: e.message === 'too large' ? '보낸 내용이 너무 큽니다.' : '요청을 처리하지 못했습니다.' });
      return true;
    }
  };
  router.checkUser = checkUser; router.audit = audit;
  return router;
};
