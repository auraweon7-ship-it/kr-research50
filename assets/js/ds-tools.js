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

/* ---------- 6. 공저 네트워크 (검색 결과) ---------- */
const coauthorNet = res => {
  const freq = new Map(); for (const r of res) for (const a of r.authors) freq.set(a, (freq.get(a) || 0) + 1);
  const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 30).map(x => x[0]), idx = new Map(top.map((a, i) => [a, i])), E = new Map();
  for (const r of res) { const as = r.authors.filter(a => idx.has(a)); for (let i = 0; i < as.length; i++) for (let j = i + 1; j < as.length; j++) { const k = [idx.get(as[i]), idx.get(as[j])].sort((x, y) => x - y).join('-'); E.set(k, (E.get(k) || 0) + 1); } }
  if (top.length < 3 || !E.size) return '<p class="mute sm mt">공저 관계를 그릴 만큼 저자 정보가 겹치지 않습니다.</p>';
  // 간단한 힘 배치: 고정 횟수만 돌려 정지 그림으로 만든다
  const W = 760, H = 420, P = top.map((a, i) => ({ x: W / 2 + Math.cos(i * 2.4) * 160, y: H / 2 + Math.sin(i * 2.4) * 140, vx: 0, vy: 0 })), edges = [...E].map(([k, w]) => { const [a, b] = k.split('-').map(Number); return { a, b, w }; });
  for (let it = 0; it < 260; it++) {
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy + .1, f = 1400 / d2; P[i].vx += dx * f; P[i].vy += dy * f; P[j].vx -= dx * f; P[j].vy -= dy * f; }
    for (const e of edges) { const p = P[e.a], q = P[e.b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, f = (d - 70) / d * .04; p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f; }
    for (const p of P) { p.vx += (W / 2 - p.x) * .006; p.vy += (H / 2 - p.y) * .006; p.vx *= .8; p.vy *= .8; p.x = Math.max(40, Math.min(W - 40, p.x + p.vx)); p.y = Math.max(24, Math.min(H - 24, p.y + p.vy)); }
  }
  const mx = Math.max(...top.map(a => freq.get(a))), wm = Math.max(...edges.map(e => e.w));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="상위 저자 ${top.length}명의 공저 관계" style="background:#1B2238;border-radius:18px">
    ${edges.map(e => `<line x1="${P[e.a].x.toFixed(1)}" y1="${P[e.a].y.toFixed(1)}" x2="${P[e.b].x.toFixed(1)}" y2="${P[e.b].y.toFixed(1)}" stroke="#3D9FE6" stroke-opacity="${(.25 + e.w / wm * .6).toFixed(2)}" stroke-width="${(1 + e.w / wm * 3).toFixed(1)}"><title>${esc(top[e.a])} – ${esc(top[e.b])} · 공저 ${e.w}편</title></line>`).join('')}
    ${top.map((a, i) => { const r = 5 + freq.get(a) / mx * 9; return `<circle cx="${P[i].x.toFixed(1)}" cy="${P[i].y.toFixed(1)}" r="${r.toFixed(1)}" fill="${GC[i % 4]}" stroke="#fff" stroke-width="1.5"><title>${esc(a)} · ${freq.get(a)}편</title></circle><text x="${P[i].x.toFixed(1)}" y="${(P[i].y + r + 11).toFixed(1)}" text-anchor="middle" style="fill:#E6EBF5;font-size:10px">${esc(a.length > 16 ? a.slice(0, 15) + '…' : a)}</text>`; }).join('')}</svg>
    <p class="mute sm mt">검색 결과에 많이 나온 저자 ${top.length}명입니다. 원 크기는 논문 수, 선 굵기는 함께 쓴 논문 수입니다.</p>`;
};

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
    const L = dsSaved(); L.push({ id: `s${Date.now().toString(36)}`, name, q: ds.q, from: ds.from, to: ds.to, n: ds.n, nrf: ds.nrf, on: { ...ds.on }, seen: ds.res.map(dsNorm).slice(0, 2000), at: new Date().toLocaleDateString('ko-KR') });
    LS.set('nrf50.dssaved', L); render(); toast('검색 조건을 저장했습니다. 다시 실행하면 새로 나온 결과를 표시합니다.');
  },
  dsunsave: v => { LS.set('nrf50.dssaved', dsSaved().filter(x => x.id !== v)); render(); },
  dsrerun: async v => {
    const L = dsSaved(), x = L.find(y => y.id === v); if (!x) return;
    Object.assign(state.ds, { q: x.q, from: x.from, to: x.to, n: x.n, nrf: x.nrf, on: { ...x.on } }); state.dsub = 'search'; syncHash(false);
    await dsSearch(); const seen = new Set(x.seen || []); state.ds.fresh = new Set(state.ds.res.map(dsNorm).filter(k => !seen.has(k)));
    x.seen = [...new Set([...(x.seen || []), ...state.ds.res.map(dsNorm)])].slice(-3000); x.at = new Date().toLocaleDateString('ko-KR'); LS.set('nrf50.dssaved', L);
    render(); toast(`새 결과 ${state.ds.fresh.size}건`);
  },
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const go = { trq: 'trgo', peq: 'pego', efq: 'efgo' }[e.target.id]; if (go) { e.preventDefault(); ACT[go](); }
});
