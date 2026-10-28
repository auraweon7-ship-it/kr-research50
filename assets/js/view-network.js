/* 05 연구 네트워크 */
/* ========== 05 연구 네트워크 (옵시디언 그래프 스타일) ========== */
const LINKT = { tie: ['성과–연구자 연계', '#C9D2E3', '대표 성과와 그 성과를 만든 연구자'], co: ['공동연구', '#3D9FE6', '공저·공동과제로 이어진 연구자'], gen: ['인용·후속과제 계보', '#F6A53A', '앞선 성과가 뒤 성과의 토대가 된 관계'], ment: ['사제 관계', '#EC5C8D', '지도교수와 배출 인력'] };
const ERA_C = ['#EC5C8D', '#F6A53A', '#27B894', '#3D9FE6', '#9B8CFF'], STAGE_C = ['#7E8AA6', '#3D9FE6', '#F6A53A', '#27B894'];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gx = { pos: {}, tf: { x: 0, y: 0, k: 1 }, cam: null, auto: true, show: { o: true, p: true }, types: { tie: true, co: true, gen: true, ment: true }, domain: '', scope: 'all',
  sel: null, hover: null, q: '', alpha: 0, year: 2026, playing: false, color: 'domain', size: 'deg', depth: 1, pathMode: false, path: null, force: { rep: 520, dist: 62, grav: 5 }, N: [], L: [], V: [], VL: [], vadj: {},
  // 보기 설정: 배치(힘·원형·시간축·영역 군집), 곡선 연결, 영역 구름, 라벨, 테마, 이웃만 보기, 크기(높이·노드·글자)
  layout: 'force', curve: true, clouds: true, labels: 'auto', theme: 'dark', ego: false, wave: null, tour: null,
  h: Math.max(360, Math.min(1100, +LS.get('nrf50.gh', 640) || 640)), nscale: +LS.get('nrf50.gns', 1) || 1, lsize: +LS.get('nrf50.gls', 11) || 11 };
const GTHEME = { dark: { bg: '#1B2238', glow: 'rgba(61,159,230,.13)', label: '#E6EBF5', hole: '#1B2238', axis: 'rgba(230,235,245,.14)', axisT: 'rgba(230,235,245,.5)', water: '#fff' }, light: { bg: '#F4F6FA', glow: 'rgba(61,159,230,.10)', label: '#27365A', hole: '#F4F6FA', axis: 'rgba(39,54,90,.10)', axisT: 'rgba(39,54,90,.55)', water: '#27365A' } };
// 배치 목표 좌표: 힘 배치가 아니면 노드가 목표 자리로 미끄러져 간다(전환 자체가 모션)
const gTarget = n => {
  const it = n.it, di = DOMAINS.findIndex(d => d.id === it.domain), o = it.kind === 'o';
  if (gx.layout === 'time') return [(it.y0 - 2001.5) * 15, (di - 1.5) * 120 + (o ? -26 : 26) + ((n.ph * 7) % 1 - .5) * 34];
  if (gx.layout === 'ring') { const same = gx.V.filter(m => m.it.domain === it.domain && m.it.kind === it.kind), k = same.indexOf(n), a0 = di / 4 * Math.PI * 2 - Math.PI / 2, span = Math.PI * 2 / 4 * .82, a = a0 + (same.length > 1 ? k / (same.length - 1) : .5) * span; const r = o ? 170 : 290; return [Math.cos(a) * r, Math.sin(a) * r]; }
  if (gx.layout === 'domain') { const C = [[-210, -150], [210, -150], [-210, 150], [210, 150]][di], same = gx.V.filter(m => m.it.domain === it.domain), k = same.indexOf(n), a = k * 2.4, r = 12 * Math.sqrt(k + 1); return [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r]; }
  return null;
};
// 이웃만 보기: 선택 노드에서 depth 단계 안의 노드만 남긴다
const gEgo = () => { if (!gx.ego || !gx.sel) return null; const s = new Set([gx.sel]); let fr = [gx.sel]; for (let d = 0; d < Math.max(1, gx.depth); d++) { const nx = []; for (const a of fr) for (const b of gx.vadj[a] || []) if (!s.has(b)) { s.add(b); nx.push(b); } fr = nx; } return s; };
// 선택 파동: 선택한 노드에서 이웃으로 단계별로 번져 나간다
const gWave = id => { if (!id || REDUCE) { gx.wave = null; return; } const d = new Map([[id, 0]]); let fr = [id]; for (let k = 1; k <= 3; k++) { const nx = []; for (const a of fr) for (const b of gx.vadj[a] || []) if (!d.has(b)) { d.set(b, k); nx.push(b); } fr = nx; } gx.wave = { t0: performance.now(), d }; };
// 연계(tie)는 후보 데이터의 실제 연결, 나머지 세 종류는 구조 시연용으로 생성한 예시 관계다
const graphLinks = () => gx.all ||= (() => {
  const L = [];
  OUTCOMES.forEach(o => o.people.forEach(p => L.push({ s: o.id, t: p, type: 'tie' })));
  PEOPLE.forEach((p, i) => {
    const r = rng(i * 17 + 5), same = PEOPLE.filter(q => q.domain === p.domain && q.id !== p.id);
    for (let j = 0, k = 1 + Math.floor(r() * 2); j < k; j++) { const pool = r() < .75 ? same : PEOPLE, q = pool[Math.floor(r() * pool.length)]; if (q.id !== p.id) L.push({ s: p.id, t: q.id, type: 'co' }); }
    const seniors = same.filter(q => q.y0 <= p.y0 - 12);
    if (seniors.length && r() < .6) L.push({ s: seniors[Math.floor(r() * seniors.length)].id, t: p.id, type: 'ment' });
  });
  OUTCOMES.forEach((o, i) => {
    const r = rng(i * 23 + 9), earlier = OUTCOMES.filter(q => q.domain === o.domain && q.y0 < o.y0);
    if (earlier.length && r() < .7) L.push({ s: earlier[Math.floor(r() * earlier.length)].id, t: o.id, type: 'gen' });
    if (r() < .2) { const q = OUTCOMES[Math.floor(r() * OUTCOMES.length)]; if (q.id !== o.id) L.push({ s: q.id, t: o.id, type: 'gen' }); }
  });
  const seen = new Set();
  return L.filter(l => { const k = [l.s, l.t].sort().join('|') + l.type; return seen.has(k) ? false : seen.add(k); });
})();
const graphData = () => {
  const ok = it => gx.show[it.kind] && (!gx.domain || it.domain === gx.domain) && (gx.scope === 'all' || stageOf(it) === 3);
  const nodes = [...OUTCOMES, ...PEOPLE].filter(ok), ids = new Set(nodes.map(n => n.id));
  const links = graphLinks().filter(l => gx.types[l.type] && ids.has(l.s) && ids.has(l.t)), deg = {}, adj = {};
  links.forEach(l => { for (const [a, b] of [[l.s, l.t], [l.t, l.s]]) { deg[a] = (deg[a] || 0) + 1; (adj[a] ||= new Set()).add(b); } });
  return { nodes, links, deg, adj };
};
const gLabel = it => it.kind === 'o' ? it.title : `${it.id} ${it.field}`;
const gColor = it => gx.color === 'era' ? ERA_C[ERAS.findIndex(e => e.id === it.era)] : gx.color === 'stage' ? STAGE_C[stageOf(it)] : gx.color === 'kind' ? (it.kind === 'o' ? '#F6A53A' : '#3D9FE6') : dom(it.domain).color;
const gSize = (it, deg) => gx.size === 'score' ? 4 + (score(it) - 55) / 45 * 10 : gx.size === 'roi' ? 4 + Math.min(roi(it), 40) / 40 * 11 : 4 + Math.sqrt(deg) * 2.3;

// 강조 집합: 경로가 있으면 경로, 없으면 선택·호버 노드에서 depth 단계까지의 이웃
const gHl = () => {
  const id = gx.hover || gx.sel; gx.hl = null; gx.hlId = id;
  if (gx.path) { gx.hl = gx.path.nodes; return; }
  if (!id) return;
  const s = new Set([id]); let fr = [id];
  for (let d = 0; d < gx.depth; d++) { const nx = []; for (const a of fr) for (const b of gx.vadj[a] || []) if (!s.has(b)) { s.add(b); nx.push(b); } fr = nx; }
  gx.hl = s;
};
// 연도 기준으로 보이는 노드·연결을 다시 계산한다. 새로 나타난 노드는 이웃 곁에서 튀어나오게 한다
const gSetYear = (yr, animate) => {
  gx.year = yr; const y = Math.floor(yr); if (y === gx.vy) return;
  const was = new Set(gx.V.map(n => n.id)); gx.vy = y;
  gx.V = gx.N.filter(n => n.year <= y); const ids = new Set(gx.V.map(n => n.id));
  gx.VL = gx.L.filter(l => ids.has(l.a.id) && ids.has(l.b.id)); gx.vadj = {};
  gx.VL.forEach(l => { (gx.vadj[l.a.id] ||= new Set()).add(l.b.id); (gx.vadj[l.b.id] ||= new Set()).add(l.a.id); });
  if (animate) for (const n of gx.V) if (!was.has(n.id)) {
    n.born = performance.now();
    const l = gx.VL.find(e => (e.a === n && was.has(e.b.id)) || (e.b === n && was.has(e.a.id))), o = l ? (l.a === n ? l.b : l.a) : null;
    if (o) { n.x = o.x + (Math.random() - .5) * 34; n.y = o.y + (Math.random() - .5) * 34; }
    n.vx = n.vy = 0; gx.alpha = Math.max(gx.alpha, .32);
  }
  if (gx.sel && !ids.has(gx.sel)) { gx.sel = null; gx.path = null; }
  gHl();
  const set = (q, v) => { const el = $(q); if (el) el.textContent = v; };
  set('#gyear', y); set('#gcount', `노드 ${gx.V.length} · 연결 ${gx.VL.length}`);
  const sl = $('[data-gyear]'); if (sl && +sl.value !== y) sl.value = y;
};
const gTick = () => {
  const N = gx.V, a = gx.alpha, F = gx.force;
  for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
    const p = N[i], q = N[j]; let dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
    if (d2 < 1) { dx = (i % 3) - 1 || .5; dy = (j % 3) - 1 || .5; d2 = 1; }
    if (d2 > 90000) continue;
    const f = Math.min(5, F.rep * (gx.layout === 'force' ? a : .012) / d2); p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
  }
  for (const l of gx.VL) { const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, f = (d - F.dist) / d * .06 * a; l.a.vx += dx * f; l.a.vy += dy * f; l.b.vx -= dx * f; l.b.vy -= dy * f; }
  const lay = gx.layout !== 'force';
  for (const n of N) { if (lay) { const T = gTarget(n); if (T) { n.vx += (T[0] - n.x) * .08; n.vy += (T[1] - n.y) * .08; } } else { n.vx -= n.x * F.grav / 100 * a; n.vy -= n.y * F.grav / 77 * a; } n.vx *= .82; n.vy *= .82; if (!n.fixed) { n.x += n.vx; n.y += n.vy; } gx.pos[n.id] = [n.x, n.y]; }
  gx.alpha *= .988;
};
const gFitTarget = () => {
  const eg = gEgo(), VV = eg ? gx.V.filter(n => eg.has(n.id)) : gx.V;
  if (!VV.length) return { x: 0, y: 0, k: 1 };
  const xs = VV.map(n => n.x), ys = VV.map(n => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.max(.35, Math.min(1.7, (gx.cv.clientWidth - 90) / (x1 - x0 || 1), (gx.cv.clientHeight - 150) / (y1 - y0 || 1)));
  return { k, x: -(x0 + x1) / 2 * k, y: -(y0 + y1) / 2 * k - 14 };
};
const gPath = (a, b) => {
  const prev = { [a]: null }, q = [a];
  while (q.length) { const x = q.shift(); if (x === b) break; for (const y of gx.vadj[x] || []) if (!(y in prev)) { prev[y] = x; q.push(y); } }
  if (!(b in prev)) return null;
  const list = []; for (let x = b; x; x = prev[x]) list.unshift(x);
  return { list, nodes: new Set(list), edges: new Set(list.slice(1).map((x, i) => [list[i], x].sort().join('|'))) };
};

const gDraw = now => {
  const cv = gx.cv, c = gx.ctx, w = cv.clientWidth, h = cv.clientHeight, { x: tx, y: ty, k } = gx.tf, ox = w / 2 + tx, oy = h / 2 + ty, t = now / 1000;
  const TH = GTHEME[gx.theme], eg = gEgo(), wv = gx.wave, wt = wv ? (now - wv.t0) / 1000 : 0;
  c.setTransform(gx.dpr, 0, 0, gx.dpr, 0, 0); c.globalAlpha = 1; c.fillStyle = TH.bg; c.fillRect(0, 0, w, h);
  const bg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .62); bg.addColorStop(0, TH.glow); bg.addColorStop(1, 'rgba(61,159,230,0)'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  if (wv && wt > 3.2) gx.wave = null;
  const hl = gx.hl, id = gx.hlId, path = gx.path, q = gx.q.trim().toLowerCase(), rs = Math.max(.7, Math.min(1.7, k)), drift = REDUCE ? 0 : 1.6;
  for (const n of gx.V) { n.sx = (n.x + Math.sin(t * .7 + n.ph) * drift) * k + ox; n.sy = (n.y + Math.cos(t * .6 + n.ph * 1.7) * drift) * k + oy; n.hs = (n.hs || 1) + (((n.id === gx.hover || n.id === gx.sel) ? 1.35 : 1) - (n.hs || 1)) * .2; }
  const vis = n => !eg || eg.has(n.id);
  // 시간축 배치: 연도 눈금과 영역 줄
  if (gx.layout === 'time') { c.font = '11px Pretendard, sans-serif'; c.textAlign = 'center'; for (let y = 1980; y <= 2025; y += 5) { const X = (y - 2001.5) * 15 * k + ox; c.globalAlpha = 1; c.strokeStyle = TH.axis; c.lineWidth = 1; c.beginPath(); c.moveTo(X, 0); c.lineTo(X, h); c.stroke(); c.fillStyle = TH.axisT; c.fillText(y, X, 18); } c.textAlign = 'left'; DOMAINS.forEach((d, i) => { const Y = (i - 1.5) * 120 * k + oy; c.fillStyle = d.color; c.globalAlpha = .9; c.fillText(d.short, 12, Y + 4); }); }
  if (gx.layout === 'ring' || gx.layout === 'domain') { c.font = '700 12px Pretendard, sans-serif'; c.textAlign = 'center'; DOMAINS.forEach((d, i) => { const P = gx.layout === 'ring' ? (() => { const a = i / 4 * Math.PI * 2 - Math.PI / 2 + Math.PI / 4 * .82; return [Math.cos(a) * 360, Math.sin(a) * 360]; })() : [[-210, -150], [210, -150], [-210, 150], [210, 150]][i].map((v, j) => v + (j ? -95 : 0)); c.globalAlpha = .85; c.fillStyle = d.color; c.fillText(d.label, P[0] * k + ox, P[1] * k + oy); }); }
  // 영역 구름: 같은 영역 노드 무리를 숨 쉬는 빛으로 감싼다
  if (gx.clouds) for (const d of DOMAINS) { const M = gx.V.filter(n => n.it.domain === d.id && vis(n)); if (M.length < 2) continue; const cx = M.reduce((a, n) => a + n.sx, 0) / M.length, cy = M.reduce((a, n) => a + n.sy, 0) / M.length, rr = Math.sqrt(M.reduce((a, n) => a + (n.sx - cx) ** 2 + (n.sy - cy) ** 2, 0) / M.length) * 1.45 + 30 * k, br = REDUCE ? 1 : 1 + .04 * Math.sin(t * 1.2 + d.id.length); const gr = c.createRadialGradient(cx, cy, 0, cx, cy, rr * br); gr.addColorStop(0, d.color + '33'); gr.addColorStop(.7, d.color + '14'); gr.addColorStop(1, d.color + '00'); c.globalAlpha = 1; c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, rr * br, 0, 7); c.fill(); }
  // 곡선 연결: 두 점 사이를 살짝 휘게 한다. 입자도 같은 곡선을 따른다
  const ctl = l => { const mx = (l.a.sx + l.b.sx) / 2, my = (l.a.sy + l.b.sy) / 2; if (!gx.curve) return [mx, my]; const dx = l.b.sx - l.a.sx, dy = l.b.sy - l.a.sy, s = (l.ph > .5 ? 1 : -1) * .16; return [mx - dy * s, my + dx * s]; };
  const qp = (l, u, C) => [(1 - u) * (1 - u) * l.a.sx + 2 * (1 - u) * u * C[0] + u * u * l.b.sx, (1 - u) * (1 - u) * l.a.sy + 2 * (1 - u) * u * C[1] + u * u * l.b.sy];
  const linkOn = l => path ? path.edges.has(l.key) : !hl || (hl.has(l.a.id) && hl.has(l.b.id) && (gx.depth > 1 || l.a.id === id || l.b.id === id));

  for (const l of gx.VL) {
    if (!vis(l.a) || !vis(l.b)) continue;
    const on = linkOn(l), C = ctl(l); l.C = C;
    // 파동이 지나가는 연결은 잠깐 밝아진다
    const wa = wv && wv.d.has(l.a.id) && wv.d.has(l.b.id) ? Math.max(0, 1 - Math.abs(wt - Math.max(wv.d.get(l.a.id), wv.d.get(l.b.id)) * .28 - .1) * 2.4) : 0;
    c.globalAlpha = Math.min(1, (on ? (hl ? .95 : .26) : .035) + wa * .8); c.strokeStyle = wa > .3 ? '#fff' : LINKT[l.type][1]; c.lineWidth = (on && hl ? (path ? 2.6 : 1.8) : 1) + wa * 2;
    if (l.type === 'gen' && !REDUCE && on) { c.setLineDash([5, 5]); c.lineDashOffset = -t * 18; }
    c.beginPath(); c.moveTo(l.a.sx, l.a.sy); c.quadraticCurveTo(C[0], C[1], l.b.sx, l.b.sy); c.stroke(); c.setLineDash([]);
  }
  // 연결을 따라 흐르는 입자: 지식이 이동하는 방향감을 준다
  if (!REDUCE) for (const l of gx.VL) {
    if (!vis(l.a) || !vis(l.b)) continue; const on = linkOn(l); if (hl && !on) continue;
    const hot = hl && on, n = hot ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const u = (t * (hot ? (path ? .7 : .42) : .11) + l.ph + i / n) % 1;
      c.globalAlpha = (hot ? 1 : .55) * Math.sin(u * Math.PI); c.fillStyle = hot ? '#fff' : LINKT[l.type][1];
      const P = qp(l, u, l.C || ctl(l)); c.beginPath(); c.arc(P[0], P[1], hot ? 2.6 : 1.5, 0, 7); c.fill();
    }
  }
  c.textAlign = 'center'; c.font = `${gx.lsize}px Pretendard, "Malgun Gothic", sans-serif`;
  for (const n of gx.V) {
    if (!vis(n)) continue;
    const on = !hl || hl.has(n.id), age = n.born ? (now - n.born) / 650 : 1, grow = age >= 1 ? 1 : 1 + 2.7 * Math.pow(age - 1, 3) + 1.7 * Math.pow(age - 1, 2);
    const r = n.r * rs * gx.nscale * (n.hs || 1) * Math.max(.05, grow), col = n.col, hit = q && gLabel(n.it).toLowerCase().includes(q), a0 = on ? 1 : .1;
    if (n.born && now - n.born < 1100) { const u = (now - n.born) / 1100; c.globalAlpha = (1 - u) * .7 * a0; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(n.sx, n.sy, r + u * 34, 0, 7); c.stroke(); }
    if ((n.deg >= 7 || hit) && on) { c.globalAlpha = (hit ? .3 : .13) + .06 * Math.sin(t * 2 + n.ph); c.fillStyle = hit ? '#FFE082' : col; c.beginPath(); c.arc(n.sx, n.sy, r * 2.3 + 3, 0, 7); c.fill(); }
    c.globalAlpha = a0; c.beginPath(); c.arc(n.sx, n.sy, r, 0, 7);
    if (n.it.kind === 'o') { c.fillStyle = col; c.fill(); } else { c.fillStyle = TH.hole; c.fill(); c.lineWidth = 2.6; c.strokeStyle = col; c.stroke(); }
    if (wv && wv.d.has(n.id)) { const u = (wt - wv.d.get(n.id) * .28) / .9; if (u > 0 && u < 1) { c.globalAlpha = (1 - u) * .9; c.strokeStyle = wv.d.get(n.id) ? col : '#fff'; c.lineWidth = 2.4; c.beginPath(); c.arc(n.sx, n.sy, r + 3 + u * 26, 0, 7); c.stroke(); } }
    if (n.id === gx.sel || n.id === gx.hover) {
      c.globalAlpha = a0; c.beginPath(); c.arc(n.sx, n.sy, r + 4, 0, 7); c.lineWidth = 2; c.strokeStyle = TH.water; c.stroke();
      if (n.id === gx.sel && !REDUCE) { const u = (t * .8) % 1; c.globalAlpha = (1 - u) * .8; c.beginPath(); c.arc(n.sx, n.sy, r + 4 + u * 22, 0, 7); c.stroke(); }
    }
    const la = gx.labels === 'off' ? (n.id === gx.hover || n.id === gx.sel ? 1 : 0) : gx.labels === 'all' ? (on ? 1 : .15) : hl ? (on ? 1 : 0) : hit ? 1 : Math.max(n.deg >= 7 ? .8 : 0, Math.min(1, (k - 1.05) / .5));
    if (la > .02 && grow > .6) { const s = gLabel(n.it); c.globalAlpha = la; c.fillStyle = TH.label; c.fillText(s.length > 16 ? s.slice(0, 15) + '…' : s, n.sx, n.sy + r + gx.lsize + 2); }
  }
  if (gx.playing || gx.vy < 2026) { c.globalAlpha = .2; c.fillStyle = TH.water; c.textAlign = 'left'; c.font = '700 54px Pretendard, sans-serif'; c.fillText(gx.vy, 22, 64); }
  c.globalAlpha = 1;
};
const gBtn = () => { const b = $('#gplay'); if (b) b.textContent = gx.playing ? '❚❚ 일시정지' : gx.vy >= 2026 ? '▶ 50년 성장 재생' : '▶ 이어서 재생'; };
const gLoop = now => {
  if (!gx.cv?.isConnected) { gx.run = false; return; }
  const dt = Math.min(.05, (now - (gx.last || now)) / 1000); gx.last = now;
  if (gx.playing) { const y = gx.year + dt * 3.4; if (y >= 2026) { gSetYear(2026, true); gx.playing = false; gBtn(); } else gSetYear(y, true); }
  if (gx.alpha > .004) gTick();
  if (gx.auto) gx.cam = gFitTarget();
  if (gx.cam) { const c = gx.cam, e = REDUCE ? 1 : .12; gx.tf.x += (c.x - gx.tf.x) * e; gx.tf.y += (c.y - gx.tf.y) * e; gx.tf.k += (c.k - gx.tf.k) * e; if (!gx.auto && Math.abs(c.x - gx.tf.x) + Math.abs(c.y - gx.tf.y) < .6 && Math.abs(c.k - gx.tf.k) < .004) gx.cam = null; }
  gDraw(now); requestAnimationFrame(gLoop);
};
const gAt = e => {
  const b = gx.cv.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top; let best = null, bd = 1e9;
  const eg = gEgo(); for (const n of gx.V) { if (eg && !eg.has(n.id)) continue; const d = Math.hypot(n.sx - mx, n.sy - my); if (d < n.r * gx.nscale * 1.7 + 6 && d < bd) { best = n; bd = d; } }
  return best;
};
const gPanel = () => {
  const el = $('#gpanel'); if (!el) return;
  const by = Object.fromEntries(gx.N.map(n => [n.id, n])), n = by[gx.sel];
  if (gx.path) {
    const P = gx.path.list.map(i => by[i]);
    el.innerHTML = `<h2>최단 <b>연결 경로</b></h2>${dots}<p class="lead">${P.length - 1}단계 만에 이어집니다.</p><ol class="rank">${P.map((x, i) => { const l = i ? gx.VL.find(e => e.key === [P[i - 1].id, x.id].sort().join('|')) : null; return `${l ? `<li class="via"><b></b><span><i class="dot" style="background:${LINKT[l.type][1]}"></i>${LINKT[l.type][0]}</span><b></b></li>` : ''}<li data-act="gsel" data-v="${x.id}"><b>${i + 1}</b><span>${gLabel(x.it)}</span><b></b></li>`; }).join('')}</ol><div class="chips mt"><button class="btn" data-act="gclear">경로 지우기</button></div>`;
    return;
  }
  if (!n) {
    el.innerHTML = `<h2>연결 <b>허브</b></h2>${dots}<p class="lead">연결이 많은 노드입니다. 누르면 그래프에서 강조되고 화면이 따라갑니다.</p><ol class="rank">${[...gx.V].sort((a, b) => (gx.vadj[b.id]?.size || 0) - (gx.vadj[a.id]?.size || 0)).slice(0, 9).map((x, i) => `<li data-act="gsel" data-v="${x.id}"><b>${i + 1}</b><span>${gLabel(x.it)}</span><b>${gx.vadj[x.id]?.size || 0}</b></li>`).join('')}</ol>`;
    return;
  }
  const it = n.it, d = dom(it.domain), nbs = gx.VL.filter(l => l.a.id === it.id || l.b.id === it.id).map(l => ({ o: l.a.id === it.id ? l.b.it : l.a.it, type: l.type }));
  el.innerHTML = `<div class="mute sm">${it.id} · ${it.kind === 'o' ? '대표 성과' : '대표 연구자'} · ${it.y0}년 출발</div><h2 style="margin-top:4px"><b>${it.kind === 'o' ? it.title : `${it.title} · ${it.field}`}</b></h2>
    <div class="chips" style="gap:6px;margin-top:10px">${pill(it)}<span class="tag">${d.label}</span><span class="tag">연결 ${nbs.length}</span></div>
    <p class="mute sm mt">${FEEL[it.guide]}</p>
    <div class="chips mt" style="gap:6px">${[1, 2].map(v => `<button class="chip ${gx.depth === v ? 'on' : ''}" data-act="gdepth" data-v="${v}" style="font-size:11.5px;padding:5px 10px">${v}단계 이웃</button>`).join('')}<button class="chip ${gx.pathMode ? 'on' : ''}" data-act="gpathmode" style="font-size:11.5px;padding:5px 10px">경로 찾기</button></div>
    ${gx.pathMode ? '<p class="sm mt" style="color:var(--pink);font-weight:700">그래프에서 도착 노드를 누르세요.</p>' : ''}
    ${Object.entries(LINKT).map(([t, [label, col]]) => { const g = nbs.filter(x => x.type === t); return g.length ? `<h3 class="mt" style="font-size:12.5px"><i class="dot" style="background:${col}"></i>${label} ${g.length}</h3><div class="chips" style="gap:6px;margin-top:8px">${g.map(x => `<button class="chip" data-act="gsel" data-v="${x.o.id}" style="font-size:11.5px;padding:5px 10px">${gLabel(x.o)}</button>`).join('')}</div>` : ''; }).join('') || '<p class="mute sm mt">현재 조건에서 연결된 노드가 없습니다.</p>'}
    <div class="chips mt2"><button class="btn pri" data-act="open" data-v="${it.id}">상세 열기</button><button class="btn" data-act="gsel" data-v="">선택 해제</button></div>`;
};
const mountGraph = () => {
  const cv = $('#graph'); if (!cv) return;
  const { nodes, links, deg } = graphData(); let fresh = 0;
  gx.N = nodes.map((it, i) => {
    let p = gx.pos[it.id];
    // 처음 그릴 때는 중심 부근에서 출발해 바깥으로 퍼지는 장면을 보여준다
    if (!p) { fresh++; const a = i * 2.4, r = REDUCE ? 120 + (i * 37) % 160 : 6 + (i % 9) * 3; p = [Math.cos(a) * r, Math.sin(a) * r]; }
    return { id: it.id, it, x: p[0], y: p[1], vx: 0, vy: 0, deg: deg[it.id] || 0, r: gSize(it, deg[it.id] || 0), col: gColor(it), year: it.y0, ph: (i * 1.93) % 6.28, sx: 0, sy: 0 };
  });
  const by = Object.fromEntries(gx.N.map(n => [n.id, n]));
  gx.L = links.map((l, i) => ({ a: by[l.s], b: by[l.t], type: l.type, key: [l.s, l.t].sort().join('|'), ph: (i * .618) % 1 }));
  if (!by[gx.sel]) { gx.sel = null; gx.path = null; } gx.hover = null; gx.V = []; gx.vy = null;
  gx.cv = cv; gx.ctx = cv.getContext('2d');
  const size = () => { gx.dpr = window.devicePixelRatio || 1; cv.width = cv.clientWidth * gx.dpr; cv.height = cv.clientHeight * gx.dpr; };
  size(); new ResizeObserver(size).observe(cv);
  gSetYear(gx.year, false);
  if (fresh) { gx.alpha = 1; gx.auto = true; if (REDUCE) { for (let i = 0; i < 300; i++) gTick(); gx.tf = gFitTarget(); } } else gx.alpha = Math.max(gx.alpha, .2);

  let drag = null; const hands = () => { gx.auto = false; gx.cam = null; };
  cv.onpointerdown = e => { gTourStop(); const n = gAt(e); drag = { n, x: e.clientX, y: e.clientY, moved: 0 }; if (n) n.fixed = true; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved > 4) hands();
      if (drag.n) { drag.n.x += dx / gx.tf.k; drag.n.y += dy / gx.tf.k; gx.alpha = Math.max(gx.alpha, .3); } else { gx.tf.x += dx; gx.tf.y += dy; }
      return;
    }
    const n = gAt(e), id = n ? n.id : null;
    if (id !== gx.hover) { gx.hover = id; cv.style.cursor = id ? 'pointer' : 'grab'; gHl(); }
  };
  cv.onpointerup = () => {
    if (!drag) return; if (drag.n) drag.n.fixed = false;
    if (drag.moved < 5) {
      if (gx.pathMode && drag.n && gx.sel && drag.n.id !== gx.sel) { gx.path = gPath(gx.sel, drag.n.id); gx.pathMode = false; if (!gx.path) gx.sel = drag.n.id; }
      else { gx.sel = drag.n ? drag.n.id : null; gx.path = null; gx.pathMode = false; gWave(gx.sel); if (gx.ego) { gx.auto = false; gx.cam = gFitTarget(); } }
      gHl(); gPanel();
    }
    drag = null;
  };
  cv.onpointerleave = () => { if (!drag && gx.hover) { gx.hover = null; gHl(); } };
  cv.ondblclick = e => { const n = gAt(e); if (n) openModal(n.id); };
  cv.onwheel = e => {
    e.preventDefault(); hands(); gTourStop();
    const b = cv.getBoundingClientRect(), mx = e.clientX - b.left - b.width / 2, my = e.clientY - b.top - b.height / 2, k0 = gx.tf.k, k = Math.max(.35, Math.min(4, k0 * (e.deltaY < 0 ? 1.12 : .89)));
    gx.tf.x = mx - (mx - gx.tf.x) * k / k0; gx.tf.y = my - (my - gx.tf.y) * k / k0; gx.tf.k = k;
  };
  gPanel(); gBtn(); gDraw(performance.now());
  if (!gx.run) { gx.run = true; gx.last = 0; requestAnimationFrame(gLoop); }
};

R.network = () => {
  const { nodes, links, deg, adj } = graphData(), no = nodes.filter(n => n.kind === 'o').length, np = nodes.length - no, by = Object.fromEntries(nodes.map(n => [n.id, n]));
  const iso = nodes.filter(n => !deg[n.id]).length, avg = nodes.length ? (links.length * 2 / nodes.length).toFixed(1) : '0';
  const tg = (on, act, v, label, col) => `<button class="chip ${on ? 'on' : ''}" data-act="${act}" data-v="${v}">${col ? `<i style="background:${col}"></i>` : ''}${label}</button>`;
  const leg = gx.color === 'era' ? ERAS.map((e, i) => ({ label: `${e.no} ${e.label}`, color: ERA_C[i] })) : gx.color === 'stage' ? STAGES.map((s, i) => ({ label: s, color: STAGE_C[i] })) : gx.color === 'kind' ? [{ label: '대표 성과', color: '#F6A53A' }, { label: '대표 연구자', color: '#3D9FE6' }] : DOMAINS;
  // 영역 간 연결 행렬과 여러 영역을 잇는 매개 노드
  const mat = DOMAINS.map(a => DOMAINS.map(b => links.filter(l => { const x = by[l.s].domain, y = by[l.t].domain; return (x === a.id && y === b.id) || (x === b.id && y === a.id); }).length)), mmx = Math.max(1, ...mat.flat());
  const bridges = nodes.map(n => ({ n, ds: new Set([...(adj[n.id] || [])].map(i => by[i].domain).filter(x => x !== n.domain)) })).filter(x => x.ds.size).sort((a, b) => b.ds.size - a.ds.size || (deg[b.n.id] || 0) - (deg[a.n.id] || 0)).slice(0, 7);
  const cross = links.filter(l => by[l.s].domain !== by[l.t].domain).length;
  return `
  <div class="row c4">${[[nodes.length, '개', `노드 · 성과 ${no} + 연구자 ${np}`], [links.length, '개', `연결 · 영역 간 ${cross}개`], [avg, '', '노드당 평균 연결'], [iso, '개', '연결 없는 노드']].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['노드', '연결', '평균', '고립'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  <div class="toolbar" style="margin-bottom:12px">
    <input class="field" type="search" placeholder="성과명·분야 검색 (그래프에서 강조)" value="${esc(gx.q)}" data-gq aria-label="그래프 검색" style="flex:1 1 220px">
    <button class="btn" data-act="gfit">화면 맞춤</button><button class="btn" data-act="grelayout">다시 배치</button><button class="btn ${gx.tour ? 'pri' : ''}" data-act="gtour">${gx.tour ? '❚❚ 투어 멈춤' : '▶ 허브 투어'}</button><button class="btn" data-act="gfull">전체 화면</button><button class="btn" data-act="gpng">PNG 저장</button>
  </div>
  <div class="gviewbar">
    <div><span>배치</span><div class="chips">${[['force', '힘 배치'], ['ring', '원형(영역별)'], ['time', '시간축'], ['domain', '영역 군집']].map(([v, l]) => tg(gx.layout === v, 'glayout', v, l)).join('')}</div></div>
    <div><span>표현</span><div class="chips">${tg(gx.curve, 'gopt', 'curve', '곡선 연결')}${tg(gx.clouds, 'gopt', 'clouds', '영역 구름')}${tg(gx.ego, 'gopt', 'ego', '선택 이웃만')}${tg(gx.theme === 'light', 'gopt', 'theme', '밝은 배경')}<span class="mute sm" style="align-self:center;margin-left:6px">라벨</span>${[['auto', '자동'], ['all', '모두'], ['off', '끄기']].map(([v, l]) => tg(gx.labels === v, 'glabels', v, l)).join('')}</div></div>
    <div><span>크기</span><div class="gsizes">
      <label>그래프 높이<input type="range" min="360" max="1100" step="20" value="${gx.h}" data-gsz="h" aria-label="그래프 높이"><b id="gsz-h">${gx.h}px</b></label>
      <label>노드 크기<input type="range" min="0.5" max="2.2" step="0.1" value="${gx.nscale}" data-gsz="nscale" aria-label="노드 크기"><b id="gsz-nscale">${Math.round(gx.nscale * 100)}%</b></label>
      <label>글자 크기<input type="range" min="9" max="18" step="1" value="${gx.lsize}" data-gsz="lsize" aria-label="글자 크기"><b id="gsz-lsize">${gx.lsize}px</b></label>
      <div class="chips">${[['S', 440], ['M', 640], ['L', 820], ['XL', 1000]].map(([l, v]) => `<button class="chip ${gx.h === v ? 'on' : ''}" data-act="gheight" data-v="${v}">${l}</button>`).join('')}<button class="chip" data-act="gszreset">기본값</button></div></div></div>
  </div>
  <div class="chips" style="margin-bottom:10px">
    ${tg(gx.show.o, 'gshow', 'o', '대표 성과 ●')}${tg(gx.show.p, 'gshow', 'p', '대표 연구자 ○')}
    <span style="width:10px"></span>${tg(gx.scope === 'all', 'gscope', 'all', '전체 후보')}${tg(gx.scope === 'sel', 'gscope', 'sel', '최종선정만')}
    <span style="width:10px"></span>${tg(!gx.domain, 'gdom', '', '전체 영역')}${DOMAINS.map(d => tg(gx.domain === d.id, 'gdom', d.id, d.short, d.color)).join('')}
  </div>
  <div class="chips" style="margin-bottom:10px">${Object.entries(LINKT).map(([t, [l, c]]) => tg(gx.types[t], 'gtype', t, l, c)).join('')}</div>
  <div class="chips" style="margin-bottom:22px"><span class="mute sm" style="align-self:center">색</span>${[['domain', '지원 영역'], ['era', '시대 구간'], ['stage', '검증 단계'], ['kind', '성과·연구자']].map(([v, l]) => tg(gx.color === v, 'gcolor', v, l)).join('')}
    <span style="width:10px"></span><span class="mute sm" style="align-self:center">크기</span>${[['deg', '연결 수'], ['score', '성과 점수'], ['roi', '투자 대비 성과 지수']].map(([v, l]) => tg(gx.size === v, 'gsizem', v, l)).join('')}</div>
  <div class="row gcols">
    <section class="slide" style="padding:14px">
      <div class="graph-wrap ${gx.theme}" style="--gh:${gx.h}px"><canvas id="graph" aria-label="대표 성과와 대표 연구자의 연구 네트워크 그래프"></canvas>
        <div class="gzoom"><button data-act="gzoom" data-v="1.25" aria-label="확대">＋</button><button data-act="gzoom" data-v="0.8" aria-label="축소">－</button><button data-act="gfit" aria-label="화면 맞춤">⤢</button></div>
        <div class="graph-hint">끌기: 이동 · 휠: 확대 · 노드 끌기: 재배치 · 클릭: 선택 · 더블클릭: 상세</div>
        <div class="graph-time"><button class="btn" id="gplay" data-act="gplay">▶ 50년 성장 재생</button><input type="range" min="1977" max="2026" value="${Math.floor(gx.year)}" data-gyear aria-label="연도"><b id="gyear">${Math.floor(gx.year)}</b><span id="gcount"></span></div></div>
      <div style="padding:4px 10px 6px">${legend(leg)}</div>
    </section>
    <div class="gside">
      <section class="slide" id="gpanel"></section>
      <section class="slide"><h2>그래프 <b>힘 조절</b></h2>${dots}
        ${[['rep', '반발력', 120, 1400, 20], ['dist', '연결 거리', 25, 160, 1], ['grav', '중심 인력', 1, 14, 1]].map(([key, l, mn, mx, st]) => `<label class="slider" style="grid-template-columns:70px 1fr 40px"><span>${l}</span><input type="range" min="${mn}" max="${mx}" step="${st}" value="${gx.force[key]}" data-gf="${key}" aria-label="${l}"><b id="gf-${key}">${gx.force[key]}</b></label>`).join('')}
        <p class="mute sm mt">움직이면 그래프가 바로 다시 펼쳐집니다.</p></section>
    </div>
  </div>
  <div class="row c2">
    ${slide('영역 간 <b>연결 행렬</b>', `<div class="tw"><table class="heat"><thead><tr><th></th>${DOMAINS.map(d => `<th>${d.short}</th>`).join('')}</tr></thead><tbody>${DOMAINS.map((a, i) => `<tr><td><b>${a.short}</b></td>${DOMAINS.map((b, j) => `<td style="background:rgba(61,159,230,${(mat[i][j] / mmx * .55).toFixed(2)})">${mat[i][j] || '<span class="mute">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="mute sm mt">대각선은 영역 안, 나머지는 영역을 넘는 연결입니다. 전체 ${links.length}개 중 ${cross}개(${links.length ? Math.round(cross / links.length * 100) : 0}%)가 영역 간 연결입니다.</p>`, '어느 영역끼리 많이 이어져 있는가')}
    ${slide('영역을 잇는 <b>매개 노드</b>', `<ol class="rank">${bridges.map((x, i) => `<li data-act="gsel" data-v="${x.n.id}"><b>${i + 1}</b><span>${gLabel(x.n)} <span class="mute">· ${[...x.ds].map(q => dom(q).short).join('·')}</span></span><b>${x.ds.size}</b></li>`).join('') || '<li style="cursor:default"><b></b><span class="mute">영역 간 연결 없음</span><b></b></li>'}</ol><p class="mute sm mt">자기 영역 밖 몇 개 영역과 이어져 있는지 순서입니다. 융합 연구와 지식 이전의 통로를 찾는 데 씁니다.</p>`, '다른 영역과 연결된 성과·연구자')}
  </div>
  ${slide('그래프를 <b>표로 보기</b>', `<details class="alt"><summary>노드와 연결 목록 펼치기 (${nodes.length}개)</summary>${tbl(['노드', '종류', '지원 영역', '연결 수', '이어진 노드'], [...nodes].sort((a, b) => (deg[b.id] || 0) - (deg[a.id] || 0)).map(n => [`<button class="chip" data-act="open" data-v="${n.id}" style="font-size:11.5px;padding:4px 10px">${gLabel(n)}</button>`, n.kind === 'o' ? '성과' : '연구자', dom(n.domain).short, deg[n.id] || 0, [...(adj[n.id] || [])].slice(0, 6).map(i => gLabel(by[i])).join(', ') + ((adj[n.id]?.size || 0) > 6 ? ' 외' : '')]))}</details>`, '그래프를 보기 어려울 때 같은 내용을 표로 확인합니다. 그래프에 초점을 두고 좌우 화살표로 노드를 옮기고 Enter로 상세를 열 수도 있습니다.')}
  ${slide('연결의 <b>종류</b>', tbl(['연결', '의미', '분석 근거', '수'], Object.entries(LINKT).map(([t, [l, c, d]]) => [`<i class="dot" style="background:${c}"></i>${l}`, d, { tie: '투입-성과 연계 DB (과제 ID·연구자 ID)', co: '공저 네트워크, 공동 과제', gen: '인용 네트워크, 과제-후속과제 연결망', ment: '프로필 DB의 배출 인력' }[t], links.filter(x => x.type === t).length])) +
    '<p class="mute sm mt">성과–연구자 연계는 후보 데이터의 연결이고, 공동연구·계보·사제 관계는 구조를 보여주기 위해 생성한 예시입니다. 실제 분석에서는 인용·공저 네트워크와 과제-후속과제 연결망으로 지식 확산 경로를, 사제·공동연구 네트워크로 연구 생태계의 범위와 다음 세대로의 확산을 측정합니다.</p>' + foot('연구 네트워크'))}`;
};

/* ---------- 허브 투어·보기 설정·크기 조절 ---------- */
const gTourStop = () => { if (!gx.tour) return; clearInterval(gx.tour); gx.tour = null; const b = $('[data-act="gtour"]'); if (b) { b.textContent = '▶ 허브 투어'; b.classList.remove('pri'); } };
const gTourStep = () => {
  const hubs = [...gx.V].sort((a, b) => (gx.vadj[b.id]?.size || 0) - (gx.vadj[a.id]?.size || 0)).slice(0, 10); if (!hubs.length) return gTourStop();
  gx.ti = ((gx.ti ?? -1) + 1) % hubs.length; const n = hubs[gx.ti], k = Math.max(1.35, gx.tf.k);
  gx.sel = n.id; gx.path = null; gx.auto = false; gx.cam = { k, x: -n.x * k, y: -n.y * k }; gWave(n.id); gHl(); gPanel(); applyLang($('#gpanel'));
};
const gApplySize = () => { const w = $('.graph-wrap'); if (w) w.style.setProperty('--gh', `${gx.h}px`); LS.set('nrf50.gh', gx.h); LS.set('nrf50.gns', gx.nscale); LS.set('nrf50.gls', gx.lsize); };
document.addEventListener('input', e => {
  const k = e.target.dataset?.gsz; if (!k) return;
  gx[k] = +e.target.value; const lb = $(`#gsz-${k}`); if (lb) lb.textContent = k === 'h' ? `${gx.h}px` : k === 'nscale' ? `${Math.round(gx.nscale * 100)}%` : `${gx.lsize}px`;
  gApplySize(); if (k === 'h' && gx.auto !== false) gx.auto = true;
});
Object.assign(ACT, {
  glayout: v => { gx.layout = v; gx.alpha = 1; gx.auto = true; gTourStop(); const b = document.querySelectorAll('[data-act="glayout"]'); b.forEach(x => x.classList.toggle('on', x.dataset.v === v)); },
  gopt: (v, t) => { if (v === 'theme') gx.theme = gx.theme === 'dark' ? 'light' : 'dark'; else gx[v] = !gx[v]; t.classList.toggle('on', v === 'theme' ? gx.theme === 'light' : gx[v]); $('.graph-wrap')?.classList.toggle('light', gx.theme === 'light'); $('.graph-wrap')?.classList.toggle('dark', gx.theme === 'dark'); if (v === 'ego') { gx.auto = false; gx.cam = gFitTarget(); } },
  glabels: v => { gx.labels = v; document.querySelectorAll('[data-act="glabels"]').forEach(x => x.classList.toggle('on', x.dataset.v === v)); },
  gheight: v => { gx.h = +v; gApplySize(); render(); },
  gszreset: () => { gx.h = 640; gx.nscale = 1; gx.lsize = 11; gApplySize(); render(); },
  gzoom: v => { gTourStop(); gx.auto = false; const k0 = gx.tf.k, k = Math.max(.35, Math.min(4, k0 * +v)); gx.cam = { k, x: gx.tf.x * k / k0, y: gx.tf.y * k / k0 }; },
  gtour: () => { if (gx.tour) return gTourStop(); gTourStep(); gx.tour = setInterval(() => { if (!gx.cv?.isConnected) return gTourStop(); gTourStep(); }, 4200); const b = $('[data-act="gtour"]'); if (b) { b.textContent = '❚❚ 투어 멈춤'; b.classList.add('pri'); } },
});
