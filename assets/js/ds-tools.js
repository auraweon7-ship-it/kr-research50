/* 09 데이터 검색의 분석 도구: 과제 역추적 · 연구자 이력 · 재단 지원 효과와 추이 · 공저 네트워크 · 저장한 검색 · 후보 검증.
   모두 OpenAlex(키 선택)를 기본으로 쓰고, NTIS 키가 있으면 과제 정보를 함께 찾는다. 받아온 글자는 esc()로 거른다. */
const DS_SUBS = [['search', '통합 검색', '여러 출처 검색·분석'], ['trace', '과제 역추적', '과제번호 → 논문·NTIS'], ['person', '연구자 이력', '저자 → 첫 지원·전환점'], ['effect', '지원 효과·추이', '재단 지원 비교·연도 추이']];
const OA = 'https://api.openalex.org', OA_SRC = () => DS_SRC[0];
const oaKey = () => { const k = dsKey(OA_SRC()); return k ? `&api_key=${enc(k)}` : ''; };
const oaMail = () => dsCfg().mailto ? `&mailto=${enc(dsCfg().mailto)}` : '';
const oaJson = async path => (await dsGet(OA_SRC(), `${OA}${path}${oaKey()}${oaMail()}`)).json();
const oaWork = w => rec('OpenAlex', { title: w.title, year: w.publication_year, authors: (w.authorships || []).map(a => a.author?.display_name), venue: w.primary_location?.source?.display_name, cites: w.cited_by_count, doi: w.doi, url: w.doi || w.id,
  nrf: (w.funders || []).some(f => f.id?.endsWith(NRF_OA)), award: (w.awards || []).filter(a => a.funder_id?.endsWith(NRF_OA) && a.funder_award_id).map(a => a.funder_award_id).join(', '), topics: [w.primary_topic?.field?.display_name, w.primary_topic?.display_name] });
const OA_SEL = 'id,title,publication_year,cited_by_count,doi,authorships,primary_location,primary_topic,funders,awards';
const awardCore = a => (String(a).match(/\d{4}[A-Z]\d[A-Z0-9]{6,}/i) || [String(a).trim()])[0];
state.dsx = { trace: { award: '', run: false }, person: { q: '', run: false }, effect: { run: false }, look: {} };

/* ---------- 작은 그래프 조각 ---------- */
// 연도별 막대(두 값 겹침)와 선택적 꺾은선
const barsChart = (years, a, b, line, labels) => {
  if (!years.length) return '<p class="mute sm mt">표시할 연도 자료가 없습니다.</p>';
  const W = 760, H = 230, L = 34, R0 = line ? 40 : 10, B = 24, n = years.length, bw = (W - L - R0) / n, mx = Math.max(1, ...a), lmx = line ? Math.max(1, ...line) : 1;
  const y = v => H - B - v / mx * (H - B - 14), ly = v => H - B - v / lmx * (H - B - 14);
  const step = Math.max(1, Math.ceil(n / 10));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labels.join(', '))} 연도별 그래프">
    <line x1="${L}" x2="${W - R0}" y1="${H - B}" y2="${H - B}" stroke="#DCE1EA"/><text x="${L - 4}" y="16" text-anchor="end">${mx.toLocaleString()}</text>${line ? `<text x="${W - R0 + 4}" y="16">${lmx.toLocaleString()}</text>` : ''}
    ${years.map((yr, i) => `<rect x="${(L + i * bw + 1).toFixed(1)}" y="${y(a[i]).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${(H - B - y(a[i])).toFixed(1)}" rx="2" fill="#C9D6EA"><title>${yr} · ${labels[0]} ${a[i]}</title></rect>${b && b[i] ? `<rect x="${(L + i * bw + 1).toFixed(1)}" y="${y(b[i]).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${(H - B - y(b[i])).toFixed(1)}" rx="2" fill="#3D9FE6"><title>${yr} · ${labels[1]} ${b[i]}</title></rect>` : ''}`).join('')}
    ${line ? `<polyline points="${years.map((yr, i) => `${(L + (i + .5) * bw).toFixed(1)},${ly(line[i]).toFixed(1)}`).join(' ')}" fill="none" stroke="#EC5C8D" stroke-width="2.5"/>` : ''}
    ${years.map((yr, i) => i % step ? '' : `<text x="${(L + (i + .5) * bw).toFixed(1)}" y="${H - 6}" text-anchor="middle">${yr}</text>`).join('')}</svg>
    ${legend([{ label: labels[0], color: '#C9D6EA' }, ...(b ? [{ label: labels[1], color: '#3D9FE6' }] : []), ...(line ? [{ label: labels[2], color: '#EC5C8D' }] : [])])}`;
};
const span = (lo, hi) => { const a = []; for (let y = lo; y <= hi; y++) a.push(y); return a; };
const cagr = (a, b, n) => a > 0 && b > 0 && n > 0 ? `${((Math.pow(b / a, 1 / n) - 1) * 100).toFixed(1)}%` : '—';

/* ---------- 6. 공저 네트워크 (검색 결과) · 옵시디언 그래프 스타일 ----------
   힘 기반 배치를 계속 돌리고, 마우스를 올리면 이웃만 밝히고 연결을 따라 입자가 흐른다. 끌기·확대·노드 끌기·클릭 선택을 지원한다 */
const CO_PAL = ['#7C8CF8', '#EC5C8D', '#F6A53A', '#27B894', '#3D9FE6', '#B07CF0', '#E8C547', '#5ED6B8'];
const co = { data: null, pos: {}, gen: 0 };
const coBuild = res => {
  const freq = new Map(), papers = new Map();
  for (const r of res) for (const a of r.authors) { freq.set(a, (freq.get(a) || 0) + 1); (papers.get(a) || papers.set(a, []).get(a)).push(r); }
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 70).map(x => x[0]), idx = new Map(top.map((a, i) => [a, i])), E = new Map();
  for (const r of res) { const as = [...new Set(r.authors.filter(a => idx.has(a)))]; for (let i = 0; i < as.length; i++) for (let j = i + 1; j < as.length; j++) { const k = [idx.get(as[i]), idx.get(as[j])].sort((x, y) => x - y).join('-'); E.set(k, (E.get(k) || 0) + 1); } }
  const edges = [...E].map(([k, w]) => { const [a, b] = k.split('-').map(Number); return { a, b, w, ph: Math.random() }; });
  const nb = top.map(() => new Set()); edges.forEach(e => { nb[e.a].add(e.b); nb[e.b].add(e.a); });
  // 연구 집단 색: 이웃이 가장 많이 가진 집단 번호를 따라가는 단순한 전파로 묶는다
  let lab = top.map((_, i) => i);
  for (let it = 0; it < 12; it++) lab = lab.map((l, i) => { if (!nb[i].size) return l; const c = new Map(); nb[i].forEach(j => c.set(lab[j], (c.get(lab[j]) || 0) + 1)); return [...c].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]; });
  const groups = [...new Set(lab)].map(g => [g, lab.filter(x => x === g).length]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const mx = Math.max(1, ...top.map(a => freq.get(a)));
  const nodes = top.map((a, i) => { const p = co.pos[a]; return { name: a, n: freq.get(a), deg: nb[i].size, nb: nb[i], papers: papers.get(a), x: p ? p[0] : Math.cos(i * 2.4) * (8 + i * 2), y: p ? p[1] : Math.sin(i * 2.4) * (8 + i * 2), fresh: !p, vx: 0, vy: 0, r: 4 + Math.sqrt(freq.get(a) / mx) * 10, col: CO_PAL[groups.indexOf(lab[i]) % CO_PAL.length], ph: i * 1.7 }; });
  return { nodes, edges, groups: groups.length };
};
const coauthorNet = res => {
  co.data = coBuild(res);
  const { nodes, edges } = co.data;
  if (nodes.length < 3 || !edges.length) { co.data = null; return '<p class="mute sm mt">공저 관계를 그릴 만큼 저자 정보가 겹치지 않습니다.</p>'; }
  return `<div class="graph-wrap"><canvas id="cograph" style="height:520px" tabindex="0" aria-label="검색 결과 상위 저자 ${nodes.length}명의 공저 관계 그래프"></canvas>
      <div class="graph-hint" style="bottom:10px">끌기: 이동 · 휠: 확대 · 노드 끌기: 재배치 · 클릭: 선택 · 더블클릭: 이 저자로 결과 거르기</div></div>
    <div id="copanel" class="mt"></div>
    <p class="mute sm mt">검색 결과에 많이 나온 저자 ${nodes.length}명과 공저 ${edges.length}쌍입니다. 원 크기는 논문 수, 선 굵기는 함께 쓴 논문 수, 색은 함께 자주 쓰는 연구 집단(${co.data.groups}개)입니다.</p>`;
};
const coPanel = () => {
  const el = $('#copanel'); if (!el || !co.data) return;
  const n = co.data.nodes[co.sel];
  el.innerHTML = n ? `<div class="story"><b>${esc(n.name)}</b> <span class="mute">· 논문 ${n.n}편 · 공저자 ${n.deg}명</span>
      <div class="chips mt" style="gap:6px">${[...n.nb].sort((a, b) => co.data.nodes[b].n - co.data.nodes[a].n).slice(0, 12).map(j => `<button class="chip" data-act="cosel" data-v="${j}" style="font-size:11.5px;padding:4px 10px">${esc(co.data.nodes[j].name)}</button>`).join('')}</div>
      <ol class="rank" style="margin-top:10px">${n.papers.slice(0, 4).map((p, i) => `<li style="cursor:default"><b>${i + 1}</b><span>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title)} <span class="mute">· ${p.year || '—'} · 피인용 ${p.cites ?? '—'}</span></span><b></b></li>`).join('')}</ol>
      <div class="chips mt"><button class="btn" data-act="coauthor" data-v="${co.sel}">이 저자로 결과 거르기</button><button class="btn" data-act="cosel" data-v="">선택 해제</button></div></div>` : '<p class="mute sm">노드를 누르면 공저자와 논문이 보입니다.</p>';
};
const coMount = () => {
  const cv = $('#cograph'); if (!cv || !co.data) return;
  const D = co.data, N = D.nodes, E = D.edges, ctx = cv.getContext('2d'), RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gen = co.gen = (co.gen || 0) + 1;
  co.cv = cv; co.tf = co.tf || { x: 0, y: 0, k: 1 }; co.alpha = 1; co.hover = null; co.auto = true; if (co.sel >= N.length) co.sel = null;
  const size = () => { const d = window.devicePixelRatio || 1; cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; co.dpr = d; };
  size(); new ResizeObserver(size).observe(cv);
  const tick = () => {
    const a = co.alpha;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { const p = N[i], q = N[j]; let dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy + .5; if (d2 > 80000) continue; const f = Math.min(4, 420 * a / d2); p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f; }
    for (const e of E) { const p = N[e.a], q = N[e.b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, f = (d - 56) / d * .05 * a; p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f; }
    for (const n of N) { n.vx -= n.x * .03 * a; n.vy -= n.y * .04 * a; n.vx *= .82; n.vy *= .82; if (!n.fixed) { n.x += n.vx; n.y += n.vy; } co.pos[n.name] = [n.x, n.y]; }
    co.alpha *= .99;
  };
  const fit = () => { const xs = N.map(n => n.x), ys = N.map(n => n.y), w = cv.clientWidth, h = cv.clientHeight, k = Math.max(.4, Math.min(2, (w - 80) / (Math.max(...xs) - Math.min(...xs) || 1), (h - 80) / (Math.max(...ys) - Math.min(...ys) || 1))); return { k, x: -(Math.max(...xs) + Math.min(...xs)) / 2 * k, y: -(Math.max(...ys) + Math.min(...ys)) / 2 * k }; };
  const hlSet = () => { const id = co.hover ?? co.sel; if (id === null || id === undefined) return null; const s = new Set([id]); N[id].nb.forEach(j => s.add(j)); return { id, s }; };
  const draw = now => {
    const w = cv.clientWidth, h = cv.clientHeight, { x: tx, y: ty, k } = co.tf, ox = w / 2 + tx, oy = h / 2 + ty, t = now / 1000, hl = hlSet(), rs = Math.max(.7, Math.min(1.6, k));
    ctx.setTransform(co.dpr, 0, 0, co.dpr, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#1B2238'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .6); g.addColorStop(0, 'rgba(124,140,248,.12)'); g.addColorStop(1, 'rgba(124,140,248,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (const n of N) { n.sx = (n.x + (RM ? 0 : Math.sin(t * .7 + n.ph) * 1.3)) * k + ox; n.sy = (n.y + (RM ? 0 : Math.cos(t * .6 + n.ph) * 1.3)) * k + oy; }
    const wm = Math.max(...E.map(e => e.w));
    for (const e of E) { const on = !hl || e.a === hl.id || e.b === hl.id, p = N[e.a], q = N[e.b];
      ctx.globalAlpha = on ? (hl ? .9 : .22 + e.w / wm * .3) : .04; ctx.strokeStyle = hl && on ? p.col : '#9AA6C7'; ctx.lineWidth = (hl && on ? 1.6 : 1) * (1 + e.w / wm * 1.5);
      ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke();
      if (!RM && (!hl || on)) { const u = (t * (hl ? .45 : .12) + e.ph) % 1; ctx.globalAlpha = (hl ? 1 : .5) * Math.sin(u * Math.PI); ctx.fillStyle = hl ? '#fff' : '#C9D2E3'; ctx.beginPath(); ctx.arc(p.sx + (q.sx - p.sx) * u, p.sy + (q.sy - p.sy) * u, hl ? 2.3 : 1.4, 0, 7); ctx.fill(); } }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = '11px Pretendard, "Malgun Gothic", sans-serif';
    for (let i = 0; i < N.length; i++) { const n = N[i], on = !hl || hl.s.has(i), r = n.r * rs;
      if (on && (n.deg >= 6 || i === co.sel)) { ctx.globalAlpha = .14 + .06 * Math.sin(t * 2 + n.ph); ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(n.sx, n.sy, r * 2.2 + 3, 0, 7); ctx.fill(); }
      ctx.globalAlpha = on ? 1 : .12; ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, 7); ctx.fill();
      if (i === co.sel || i === co.hover) { ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 3.5, 0, 7); ctx.stroke(); if (i === co.sel && !RM) { const u = (t * .8) % 1; ctx.globalAlpha = (1 - u) * .8; ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 4 + u * 20, 0, 7); ctx.stroke(); } }
      const la = hl ? (on ? 1 : 0) : Math.max(n.deg >= 5 || n.n >= 3 ? .85 : 0, Math.min(1, (k - 1.05) / .5));
      if (la > .02) { ctx.globalAlpha = la; ctx.fillStyle = '#E6EBF5'; const s = n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name; ctx.fillText(s, n.sx, n.sy + r + 13); } }
    ctx.globalAlpha = 1;
  };
  const loop = now => { if (gen !== co.gen || !cv.isConnected) return; if (co.alpha > .003) tick(); if (co.auto) { const f = fit(); co.tf.x += (f.x - co.tf.x) * .1; co.tf.y += (f.y - co.tf.y) * .1; co.tf.k += (f.k - co.tf.k) * .1; } draw(now); requestAnimationFrame(loop); };
  const at = e => { const b = cv.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top; let best = null, bd = 1e9; N.forEach((n, i) => { const d = Math.hypot(n.sx - mx, n.sy - my); if (d < n.r * 1.6 + 6 && d < bd) { best = i; bd = d; } }); return best; };
  let drag = null;
  cv.onpointerdown = e => { const i = at(e); drag = { i, x: e.clientX, y: e.clientY, m: 0 }; if (i !== null) N[i].fixed = true; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => {
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.m += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; if (drag.m > 4) co.auto = false;
      if (drag.i !== null) { N[drag.i].x += dx / co.tf.k; N[drag.i].y += dy / co.tf.k; co.alpha = Math.max(co.alpha, .3); } else { co.tf.x += dx; co.tf.y += dy; } return; }
    const i = at(e); if (i !== co.hover) { co.hover = i; cv.style.cursor = i !== null ? 'pointer' : 'grab'; }
  };
  cv.onpointerup = () => { if (!drag) return; if (drag.i !== null) N[drag.i].fixed = false; if (drag.m < 5) { co.sel = drag.i; coPanel(); } drag = null; };
  cv.onpointerleave = () => { if (!drag) co.hover = null; };
  cv.ondblclick = e => { const i = at(e); if (i !== null) ACT.coauthor(String(i)); };
  cv.onwheel = e => { e.preventDefault(); co.auto = false; const b = cv.getBoundingClientRect(), mx = e.clientX - b.left - b.width / 2, my = e.clientY - b.top - b.height / 2, k0 = co.tf.k, k = Math.max(.3, Math.min(4, k0 * (e.deltaY < 0 ? 1.12 : .89))); co.tf.x = mx - (mx - co.tf.x) * k / k0; co.tf.y = my - (my - co.tf.y) * k / k0; co.tf.k = k; };
  cv.onkeydown = e => { const order = N.map((n, i) => i).sort((a, b) => N[b].deg - N[a].deg), p = order.indexOf(co.sel ?? -1);
    if (/Arrow(Right|Down)/.test(e.key)) { e.preventDefault(); co.sel = order[(p + 1) % order.length]; coPanel(); } else if (/Arrow(Left|Up)/.test(e.key)) { e.preventDefault(); co.sel = order[(p - 1 + order.length) % order.length]; coPanel(); } else if (e.key === 'Enter' && co.sel !== null) ACT.coauthor(String(co.sel)); };
  if (RM || N.some(n => n.fresh)) { for (let i = 0; i < 320; i++) tick(); co.alpha = RM ? 0 : .12; co.tf = fit(); }
  coPanel(); draw(performance.now());
  requestAnimationFrame(loop);
};
Object.assign(ACT, {
  cosel: v => { co.sel = v === '' ? null : +v; coPanel(); },
  coauthor: v => { const n = co.data?.nodes[+v]; if (!n) return; state.ds.rf.author = n.name; state.ds.sel = new Set(); render(); toast(`${n.name} 저자의 결과만 보여줍니다. 결과 필터에서 풀 수 있습니다.`); },
});

/* ---------- 7. 저장한 검색 ---------- */
const dsSaved = () => LS.get('nrf50.dssaved', []);
const savedStrip = () => {
  const L = dsSaved();
  return `<div class="chips mt" style="gap:8px"><span class="mute sm" style="align-self:center">저장한 검색</span>${L.map(x => `<span class="chip savedchip"><button data-act="dsrerun" data-v="${esc(x.id)}" title="${esc(x.q)} · ${x.from}~${x.to} · 마지막 실행 ${esc(x.at || '')}">${esc(x.name)}</button><button data-act="dsunsave" data-v="${esc(x.id)}" aria-label="${esc(x.name)} 삭제">✕</button></span>`).join('') || '<span class="mute sm" style="align-self:center">없음</span>'}
    <button class="btn" data-act="dssave">현재 조건 저장</button></div>`;
};

/* ---------- 1. 과제 역추적 ---------- */
DSV.trace = () => {
  const t = state.dsx.trace, awards = [...new Set(state.ds.res.flatMap(r => r.award ? r.award.split(', ') : []))].slice(0, 20), r = t.result;
  return `
  ${slide('과제번호로 <b>역추적</b>', `<div class="toolbar mt"><input class="field" id="trq" value="${esc(t.award)}" placeholder="재단 과제번호 (예: NRF-2019R1A2C1007670)" aria-label="과제번호" style="flex:2 1 280px"><button class="btn pri" data-act="trgo" ${t.run ? 'disabled' : ''}>${t.run ? '찾는 중…' : '역추적'}</button></div>
    ${awards.length ? `<div class="chips mt" style="gap:6px"><span class="mute sm" style="align-self:center">통합 검색에서 나온 과제번호</span>${awards.map(a => `<button class="chip" data-act="trpick" data-v="${esc(a)}" style="font-size:11.5px;padding:5px 10px">${esc(a)}</button>`).join('')}</div>` : ''}`,
    '논문의 연구비 정보(OpenAlex)에서 같은 과제번호를 단 논문을 모두 찾고, NTIS 키가 있으면 과제 정보도 함께 찾습니다. 현재 성과에서 초기 지원 과제로 거슬러 올라가는 역방향 트랙의 출발점입니다.')}
  ${r ? `
  <div class="row c4">${[[r.papers.length, '편', '이 과제를 단 논문'], [r.years, '', '논문 출판 기간'], [r.cites.toLocaleString(), '회', '피인용 합계'], [r.pi ? esc(r.pi) : '—', '', '가장 많이 나온 저자 (책임자 추정)']].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['논문', '기간', '인용', '저자'][i]}</div><div class="n" style="${i === 3 ? 'font-size:18px' : ''}">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide(`NTIS <b>과제 정보</b>`, r.ntis.err ? `<p class="sm mt"><span class="tag no">${esc(r.ntis.err)}</span></p><p class="mute sm mt">NTIS 키를 API 설정에 넣거나 서버 공용 키를 쓰면 과제명·연구책임자·기간·연구비를 함께 찾습니다.</p>`
      : r.ntis.rows.length ? tbl(['과제', '연도', '책임자·기관'], r.ntis.rows.slice(0, 8).map(x => [esc(x.title), x.year || '—', esc([x.authors.join(', '), x.venue].filter(Boolean).join(' · ') || '—')])) : '<p class="mute sm mt">NTIS에서 이 번호로 찾은 과제가 없습니다. NTIS 과제고유번호와 재단 과제번호가 다를 수 있습니다.</p>')}
  ${slide('과제 <b>산출 논문</b>', r.papers.length ? tbl(['논문', '연도', '학술지', '피인용'], r.papers.map(p => [p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title), p.year || '—', esc(p.venue || '—'), p.cites ?? '—'])) +
    `<div class="toolbar mt"><select class="field" id="trcand" aria-label="근거를 붙일 후보" style="flex:1 1 260px"><option value="">근거로 붙일 후보 선택…</option>${[...OUTCOMES, ...PEOPLE].sort((a, b) => stageOf(b) - stageOf(a)).map(it => `<option value="${it.id}">${it.id} · ${esc(nameOf(it))}</option>`).join('')}</select><button class="btn" data-act="trevid">피인용 상위 3편을 근거로 추가</button><button class="btn pri" data-act="trimport">이 과제를 성과 후보로 추가</button></div>`
    : '<p class="mute sm mt">이 과제번호를 단 논문을 찾지 못했습니다. 번호 표기(하이픈, NRF- 접두어)를 바꿔 보세요.</p>', `${esc(r.award)} · 검색한 표기: ${r.variants.map(esc).join(', ')}`)}` : ''}`;
};
const traceRun = async award => {
  const t = state.dsx.trace; t.award = award.trim(); if (!t.award) return toast('과제번호를 입력하세요.');
  t.run = true; t.result = null; render();
  const core = awardCore(t.award), variants = [...new Set([t.award, core, `NRF-${core}`])];
  const res = { award: t.award, variants, papers: [], ntis: { rows: [] } };
  try {
    const d = await oaJson(`/works?filter=awards.funder_award_id:${variants.map(enc).join('|')}&per-page=100&sort=cited_by_count:desc&select=${OA_SEL}`);
    res.papers = (d.results || []).map(oaWork);
  } catch (e) { toast(`OpenAlex: ${e.message}`); }
  const ntis = DS_SRC.find(s => s.id === 'ntis');
  try { res.ntis.rows = (await runTemplate(ntis, { q: core, from: 1977, to: 2026, n: 10, page: 1 }, dsKey(ntis))).rows; } catch (e) { res.ntis.err = e.message; }
  const ys = res.papers.map(p => p.year).filter(Boolean);
  res.years = ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : '—'; res.cites = res.papers.reduce((a, p) => a + (p.cites || 0), 0); res.pi = topN(res.papers.flatMap(p => p.authors), 1)[0]?.[0];
  t.result = res; t.run = false; render();
};

/* ---------- 2. 연구자 이력 ---------- */
DSV.person = () => {
  const p = state.dsx.person, a = p.author, h = p.hist;
  return `
  ${slide('연구자 <b>찾기</b>', `<div class="toolbar mt"><input class="field" id="peq" value="${esc(p.q)}" placeholder="저자 이름(영문) 또는 ORCID (예: 0000-0002-1825-0097)" aria-label="저자 이름 또는 ORCID" style="flex:2 1 300px"><button class="btn pri" data-act="pego" ${p.run ? 'disabled' : ''}>${p.run ? '찾는 중…' : '찾기'}</button></div>
    ${p.list ? (p.list.length ? `<ol class="rank">${p.list.map((x, i) => `<li data-act="pepick" data-v="${i}"><b>${i + 1}</b><span><b>${esc(x.display_name)}</b> <span class="mute">· ${esc(x.last_known_institutions?.[0]?.display_name || '소속 미상')} · 논문 ${x.works_count.toLocaleString()} · 피인용 ${x.cited_by_count.toLocaleString()}${x.orcid ? ' · ORCID' : ''}</span></span><b>선택</b></li>`).join('')}</ol>` : '<p class="mute sm mt">찾은 저자가 없습니다.</p>') : ''}`,
    'OpenAlex 저자 정보로 논문 이력을 모아, 재단 지원 논문이 처음 나온 해(첫 지원 추정)와 연구 생산성이 크게 오른 해(전환점 추정)를 표시합니다. 동명이인이 많으므로 소속과 ORCID로 확인하세요.')}
  ${a && h ? `
  <div class="row c4">${[[a.works_count.toLocaleString(), '편', '전체 논문'], [a.cited_by_count.toLocaleString(), '회', '전체 피인용'], [h.firstNrf || '—', '', '첫 재단 지원 논문 (첫 지원 추정)'], [h.turn || '—', '', '생산성 전환점 추정']].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['논문', '인용', '첫지원', '전환'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide(`${esc(a.display_name)} · <b>연도별 이력</b>`, barsChart(h.years, h.pubs, h.nrf, h.cites, ['논문 수', '재단 지원 논문', '연도별 피인용']) +
    `<p class="mute sm mt">${esc(a.last_known_institutions?.[0]?.display_name || '')}${a.orcid ? ` · <a href="${esc(httpUrl(a.orcid))}" target="_blank" rel="noopener noreferrer">ORCID</a>` : ''} · 첫 논문 ${h.first || '—'}년 · 공저자 ${h.coauthors}명(최근 논문 기준) · 연도별 피인용은 OpenAlex가 주는 최근 연도만 있습니다.</p>`)}
  <div class="row c2">
    ${slide('피인용 <b>상위 논문</b>', h.top.length ? tbl(['논문', '연도', '피인용'], h.top.map(w => [w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">${esc(w.title)}</a>` : esc(w.title), w.year || '—', w.cites ?? '—'])) : '<p class="mute sm mt">없음</p>')}
    ${slide('재단 <b>과제번호</b>', h.awards.length ? `<ol class="rank">${h.awards.map(([k, v], i) => `<li data-act="trpick" data-v="${esc(k)}"><b>${i + 1}</b><span>${esc(k)}</span><b>${v}편</b></li>`).join('')}</ol><p class="mute sm mt">누르면 과제 역추적으로 넘어갑니다. 최근 논문 100편 기준입니다.</p>` : '<p class="mute sm mt">논문에 적힌 재단 과제번호가 없습니다.</p>')}
  </div>
  ${slide('인물 <b>후보로 보내기</b>', `<div class="toolbar mt"><select class="field" id="pedom" aria-label="지원 영역" style="flex:0 1 180px">${DOMAINS.map(d => `<option value="${d.id}">${d.short}</option>`).join('')}</select><button class="btn pri" data-act="peimport">이 연구자를 인물 후보로 추가</button></div>
    <p class="mute sm mt">첫 논문 연도를 대학원·박사후 단계, 첫 재단 지원 연도를 신진 단계로 넣고 나머지는 비워 둡니다. 공개 동의는 '미동의'로 들어가 공개용 화면에는 익명으로 보입니다.</p>`)}` : ''}`;
};
const personFind = async q => {
  const p = state.dsx.person; p.q = q.trim(); if (!p.q) return toast('이름이나 ORCID를 입력하세요.');
  p.run = true; p.list = null; p.author = null; p.hist = null; render();
  const sel = 'id,display_name,works_count,cited_by_count,last_known_institutions,orcid,counts_by_year,topics';
  try {
    const orcid = p.q.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
    p.list = orcid ? [await oaJson(`/authors/orcid:${orcid[0]}?select=${sel}`)] : (await oaJson(`/authors?search=${enc(p.q)}&per-page=8&select=${sel}`)).results || [];
    if (p.list.length === 1) await personLoad(0);
  } catch (e) { toast(`OpenAlex: ${e.message}`); p.list = []; }
  p.run = false; render();
};
const personLoad = async i => {
  const p = state.dsx.person, a = p.list[i], id = a.id.split('/').pop(); p.author = a; p.run = true; render();
  try {
    const [all, nrf, top, recent] = await Promise.all([
      oaJson(`/works?filter=author.id:${id}&group_by=publication_year`), oaJson(`/works?filter=author.id:${id},funders.id:${NRF_OA}&group_by=publication_year`),
      oaJson(`/works?filter=author.id:${id}&sort=cited_by_count:desc&per-page=5&select=${OA_SEL}`), oaJson(`/works?filter=author.id:${id}&sort=publication_year:desc&per-page=100&select=authorships,awards`)]);
    const g = d => Object.fromEntries((d.group_by || []).map(x => [+x.key, x.count])), A = g(all), N = g(nrf), cy = Object.fromEntries((a.counts_by_year || []).map(x => [x.year, x.cited_by_count]));
    const ys = Object.keys(A).map(Number).filter(y => y >= 1960 && y <= 2026), lo = Math.min(...ys), hi = Math.max(...ys), years = ys.length ? span(lo, hi) : [];
    const pubs = years.map(y => A[y] || 0);
    // 전환점 추정: 앞뒤 5년 평균 논문 수의 비가 가장 크게 뛴 해 (앞 구간에 최소 1편)
    let turn = null, best = 1.6;
    years.forEach((y, k) => { if (k < 3 || k > years.length - 3) return; const before = pubs.slice(Math.max(0, k - 5), k), after = pubs.slice(k, k + 5), b = before.reduce((s, v) => s + v, 0) / before.length, f = after.reduce((s, v) => s + v, 0) / after.length; if (b > 0 && f / b > best) { best = f / b; turn = y; } });
    const nrfYears = Object.keys(N).map(Number).filter(y => N[y] > 0);
    p.hist = { years, pubs, nrf: years.map(y => N[y] || 0), cites: years.map(y => cy[y] || 0), first: ys.length ? lo : null, firstNrf: nrfYears.length ? Math.min(...nrfYears) : null, turn,
      top: (top.results || []).map(oaWork), coauthors: new Set((recent.results || []).flatMap(w => (w.authorships || []).map(x => x.author?.id)).filter(x => x && !x.endsWith(id))).size,
      awards: topN((recent.results || []).flatMap(w => (w.awards || []).filter(x => x.funder_id?.endsWith(NRF_OA) && x.funder_award_id).map(x => x.funder_award_id)), 8) };
  } catch (e) { toast(`OpenAlex: ${e.message}`); }
  p.run = false; render();
};

/* ---------- 4·5. 재단 지원 효과와 연도 추이 ---------- */
DSV.effect = () => {
  const ds = state.ds, e = state.dsx.effect, r = e.result;
  return `
  ${slide('비교 <b>조건</b>', `<div class="toolbar mt"><input class="field" id="efq" value="${esc(ds.q)}" placeholder="주제 검색어 (예: perovskite solar cell)" aria-label="주제 검색어" style="flex:2 1 260px">
      <label class="sm">연도 <input class="field" type="number" value="${ds.from}" data-chg="dsfrom" aria-label="시작 연도" style="width:90px"> ~ <input class="field" type="number" value="${ds.to}" data-chg="dsto" aria-label="끝 연도" style="width:90px"></label>
      <button class="btn pri" data-act="efgo" ${e.run ? 'disabled' : ''}>${e.run ? '분석 중…' : '분석'}</button></div>`,
    '같은 주제에서 한국연구재단 지원 논문과 그 밖의 논문을 비교합니다. 연도 추이는 OpenAlex 전체 집계(표본이 아님)이고, 영향력 비교는 양쪽에서 각 200편을 무작위로 뽑은 표본입니다.')}
  ${r ? `
  <div class="row c4">${[[r.total.toLocaleString(), '편', '전체 논문 (주제·기간)'], [r.nrfTotal.toLocaleString(), '편', '재단 지원 논문'], [`${(r.nrfTotal / Math.max(1, r.total) * 100).toFixed(1)}`, '%', '재단 지원 비중'], [r.cagr.nrf, '', `재단 지원 연평균 증가율 (전체 ${r.cagr.all})`]].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['전체', '재단', '비중', '증가'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('연도별 <b>추이</b>', barsChart(r.years, r.all, r.nrf, r.share, ['전체 논문', '재단 지원 논문', '재단 지원 비중(%)']))}
  <div class="row c2">
    ${slide('시대 구간별 <b>재단 지원 비중</b>', tbl(['시대 구간', '전체', '재단 지원', '비중'], ERAS.map(er => { const ix = r.years.map((y, i) => y >= er.from && y <= er.to ? i : -1).filter(i => i >= 0), a = ix.reduce((s, i) => s + r.all[i], 0), n = ix.reduce((s, i) => s + r.nrf[i], 0); return [`${er.no} ${er.label}`, a.toLocaleString(), n.toLocaleString(), a ? `${(n / a * 100).toFixed(1)}%` : '—']; })))}
    ${slide('영향력 <b>비교</b> (표본)', tbl(['지표', '재단 지원', '그 밖', '차이'], r.cmp.map(([l, a, b, f]) => [l, f(a), f(b), Number.isFinite(a) && Number.isFinite(b) && b ? `<b>${a >= b ? '+' : ''}${((a / b - 1) * 100).toFixed(0)}%</b>` : '—'])) +
      `<p class="mute sm mt">FWCI는 분야·연도·문헌 유형을 맞춰 정규화한 피인용 지표(1.0 = 세계 평균)입니다. 무작위 표본 ${r.n[0]}편 대 ${r.n[1]}편(같은 표본을 다시 뽑도록 고정). 상관 관계이며 재단 지원의 인과 효과를 뜻하지 않습니다.</p>`)}
  </div>` : ''}`;
};
const effectRun = async q => {
  const ds = state.ds, e = state.dsx.effect; ds.q = q.trim() || ds.q; if (!ds.q) return toast('주제 검색어를 입력하세요.');
  e.run = true; e.result = null; render();
  try {
    const base = `search=${enc(ds.q)}&filter=publication_year:${ds.from}-${ds.to}`, sel = 'cited_by_count,fwci,citation_normalized_percentile,publication_year';
    const [ga, gn, sa, sb] = await Promise.all([oaJson(`/works?${base}&group_by=publication_year`), oaJson(`/works?${base},funders.id:${NRF_OA}&group_by=publication_year`),
      oaJson(`/works?${base},funders.id:${NRF_OA}&sample=200&seed=42&per-page=200&select=${sel}`), oaJson(`/works?${base},funders.id:!${NRF_OA}&sample=200&seed=42&per-page=200&select=${sel}`)]);
    const g = d => Object.fromEntries((d.group_by || []).map(x => [+x.key, x.count])), A = g(ga), N = g(gn), years = span(ds.from, Math.min(ds.to, 2026));
    const all = years.map(y => A[y] || 0), nrf = years.map(y => N[y] || 0), nz = years.map((y, i) => i).filter(i => all[i] > 0), f0 = nz[0], f1 = nz[nz.length - 1];
    const stat = list => { const c = list.map(w => w.cited_by_count || 0).sort((a, b) => a - b), fw = list.map(w => w.fwci).filter(v => Number.isFinite(v)), t10 = list.filter(w => w.citation_normalized_percentile?.is_in_top_10_percent).length;
      return { n: list.length, mean: c.reduce((s, v) => s + v, 0) / (c.length || 1), med: c.length ? c[Math.floor(c.length / 2)] : NaN, fwci: fw.length ? fw.reduce((s, v) => s + v, 0) / fw.length : NaN, top: list.length ? t10 / list.length * 100 : NaN, perYear: list.reduce((s, w) => s + (w.cited_by_count || 0) / Math.max(1, 2026 - (w.publication_year || 2025)), 0) / (list.length || 1) }; };
    const a = stat(sa.results || []), b = stat(sb.results || []), f1d = v => Number.isFinite(v) ? v.toFixed(1) : '—', f2d = v => Number.isFinite(v) ? v.toFixed(2) : '—';
    e.result = { years, all, nrf, share: years.map((y, i) => all[i] ? +(nrf[i] / all[i] * 100).toFixed(1) : 0), total: ga.meta?.count || all.reduce((s, v) => s + v, 0), nrfTotal: gn.meta?.count || nrf.reduce((s, v) => s + v, 0),
      cagr: { all: f0 === undefined ? '—' : cagr(all[f0], all[f1], f1 - f0), nrf: (() => { const k = years.map((y, i) => i).filter(i => nrf[i] > 0); return k.length > 1 ? cagr(nrf[k[0]], nrf[k[k.length - 1]], k[k.length - 1] - k[0]) : '—'; })() },
      n: [a.n, b.n], cmp: [['평균 피인용', a.mean, b.mean, f1d], ['피인용 중앙값', a.med, b.med, f1d], ['연간 피인용 (출판 후 연수로 나눔)', a.perYear, b.perYear, f1d], ['평균 FWCI', a.fwci, b.fwci, f2d], ['상위 10% 논문 비율(%)', a.top, b.top, f1d]] };
  } catch (err) { toast(`OpenAlex: ${err.message}`); }
  e.run = false; render();
};

/* ---------- 3. 후보 검증: 상세 화면의 근거 패키지에서 외부 논문 찾기 ---------- */
const lookupSec = it => {
  const L = state.dsx.look[it.id];
  return `<div class="evlook"><button class="btn" data-act="evlook" data-id="${it.id}" ${L?.run ? 'disabled' : ''}>${L?.run ? '찾는 중…' : '외부 데이터로 확인 (OpenAlex)'}</button>
    ${L && !L.run ? (L.err ? `<span class="tag no">${esc(L.err)}</span>` : `<span class="mute sm">"${esc(L.q)}"${L.nrf ? ' · 재단 지원 논문' : ' · 재단 지원 논문이 없어 전체'}에서 ${L.rows.length}건</span>
      <ol class="rank">${L.rows.map((r, i) => `<li style="cursor:default"><b>${i + 1}</b><span>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)} <span class="mute">· ${r.year || '—'} · 피인용 ${r.cites ?? '—'}${r.award ? ` · 과제 ${esc(r.award)}` : ''}</span></span><button class="btn" data-act="evpick" data-v="${i}" data-id="${it.id}">근거로 추가</button></li>`).join('')}</ol>`) : ''}</div>`;
};
const lookupRun = async id => {
  const it = byId(id), L = state.dsx.look[id] = { run: true }; reopen(id);
  const q = it.kind === 'o' ? (EN[it.title] || it.title) : (it.name || EN[it.field] || it.field);
  try {
    let d = await oaJson(`/works?search=${enc(q)}&filter=funders.id:${NRF_OA}&per-page=5&sort=relevance_score:desc&select=${OA_SEL}`), nrf = true;
    if (!d.results?.length) { d = await oaJson(`/works?search=${enc(q)}&per-page=5&select=${OA_SEL}`); nrf = false; }
    Object.assign(L, { run: false, q, nrf, rows: (d.results || []).map(oaWork) });
  } catch (e) { Object.assign(L, { run: false, err: e.message }); }
  reopen(id);
};

Object.assign(ACT, {
  trgo: () => traceRun($('#trq')?.value || ''),
  trpick: v => { ACT.nav(`dsearch:trace`); traceRun(v); },
  trevid: () => {
    const id = $('#trcand')?.value, r = state.dsx.trace.result; if (!id) return toast('근거를 붙일 후보를 고르세요.');
    const top = [...r.papers].sort((a, b) => (b.cites || 0) - (a.cites || 0)).slice(0, 3);
    (db.data.evidence[id] ||= []).push(...top.map(p => ({ type: '논문·저서', title: impClean(p.title), url: p.url, note: impClean(`재단 과제 ${r.award} · ${p.year || ''} · 피인용 ${p.cites ?? '—'}`) }))); db.save('evidence'); toast(`${id}에 근거 ${top.length}건을 추가했습니다.`);
  },
  trimport: () => {
    const r = state.dsx.trace.result, top = [...r.papers].sort((a, b) => (b.cites || 0) - (a.cites || 0))[0], ys = r.papers.map(p => p.year).filter(Boolean);
    if (!top || !ys.length) return toast('산출 논문이 없어 후보로 만들 수 없습니다.');
    db.data.imported.o.push({ title: impClean(top.title), domain: 'rd', guide: 'G1', ctype: CTYPES[0], grade: 1, y0: Math.max(1977, Math.min(...ys)), y1: null, y2: null, y3: null, y4: null, s0: null, s1: null, s2: null, s3: null, invest: null, links: [], region: '수도권', p0: impClean(`재단 과제 ${r.award}`), p1: '', track: 'reverse' });
    db.save('imported'); applyImported(); render(); toast('성과 후보로 추가했습니다. 연구 관리 → 데이터 관리에서 확인하세요.');
  },
  pego: () => personFind($('#peq')?.value || ''),
  pepick: v => personLoad(+v),
  peimport: () => {
    const p = state.dsx.person, a = p.author, h = p.hist; if (!a || !h) return;
    const field = a.topics?.[0]?.field?.display_name || a.topics?.[0]?.display_name || '미분류';
    db.data.imported.p.push({ name: impClean(a.display_name), field: impClean(field), domain: $('#pedom').value, guide: 'P1', grade: 1, y0: Math.max(1977, Math.min(2026, h.first || 1977)), y1: h.firstNrf && h.firstNrf > (h.first || 0) ? h.firstNrf : null, y2: null, y3: null, y4: null,
      grants: 0, years: 0, alumni: 0, papers: a.works_count, patents: 0, awards: 0, coauthors: h.coauthors, invest: null, s0: null, s1: null, s2: null, s3: null, track: 'reverse', consent: false, links: [] });
    db.save('imported'); applyImported(); render(); toast('인물 후보로 추가했습니다. 연구 관리 → 데이터 관리에서 확인하세요.');
  },
  efgo: () => effectRun($('#efq')?.value || ''),
  evlook: (_, t) => lookupRun(t.dataset.id),
  evpick: (v, t) => {
    const id = t.dataset.id, r = state.dsx.look[id]?.rows?.[+v]; if (!r) return;
    (db.data.evidence[id] ||= []).push({ type: '논문·저서', title: impClean(r.title), url: r.url, note: impClean(`OpenAlex · ${r.year || ''} · 피인용 ${r.cites ?? '—'}${r.nrf ? ` · 재단 지원${r.award ? ` ${r.award}` : ''}` : ''}`) }); db.save('evidence'); reopen(id);
  },
  dssave: () => {
    const ds = state.ds; if (!ds.q.trim()) return toast('검색어를 먼저 입력하세요.');
    const name = (prompt('저장할 이름', ds.q) || '').trim().slice(0, 30); if (!name) return;
    const L = dsSaved(); L.push({ id: `s${Date.now().toString(36)}`, name, qf: { ...ds.qf }, q: ds.q, from: ds.from, to: ds.to, n: ds.n, nrf: ds.nrf, on: { ...ds.on }, seen: ds.res.map(dsNorm).slice(0, 2000), at: new Date().toLocaleDateString('ko-KR') });
    LS.set('nrf50.dssaved', L); render(); toast('검색 조건을 저장했습니다. 다시 실행하면 새로 나온 결과를 표시합니다.');
  },
  dsunsave: v => { LS.set('nrf50.dssaved', dsSaved().filter(x => x.id !== v)); render(); },
  dsrerun: async v => {
    const L = dsSaved(), x = L.find(y => y.id === v); if (!x) return;
    Object.assign(state.ds, { q: x.q, from: x.from, to: x.to, n: x.n, nrf: x.nrf, on: { ...x.on }, qf: { ...QF0(), ...(x.qf || {}) } }); state.dsub = 'search'; syncHash(false);
    await dsSearch(); const seen = new Set(x.seen || []); state.ds.fresh = new Set(state.ds.res.map(dsNorm).filter(k => !seen.has(k)));
    x.seen = [...new Set([...(x.seen || []), ...state.ds.res.map(dsNorm)])].slice(-3000); x.at = new Date().toLocaleDateString('ko-KR'); LS.set('nrf50.dssaved', L);
    render(); toast(`새 결과 ${state.ds.fresh.size}건`);
  },
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const go = { trq: 'trgo', peq: 'pego', efq: 'efgo' }[e.target.id]; if (go) { e.preventDefault(); ACT[go](); }
});
