/* 실데이터 분석: 연결 자료로 세부기준 점수 제안, OpenAlex 인용 사슬로 영향경로 복원, 지원·비지원 짝지은 비교,
   AI 원고 초안·보도자료와 근거 점검. 모두 관리자(관리자·연구진) 화면에서만 보인다. */

/* ---------- 점수 덮어쓰기: 연구진이 확정한 제안 점수를 원래 예시 점수 대신 쓴다 ---------- */
const applyScoreOv = () => { for (const it of [...OUTCOMES, ...PEOPLE]) { it.scores0 ||= it.scores.slice(); const ov = db.data.scoreOv[it.id]; it.scores = Array.isArray(ov) && ov.length === 4 ? ov.map(Number) : it.scores0.slice(); } };
// 연결 자료에서 네 기준 점수를 계산한다. 근거가 되는 값과 식을 함께 돌려준다
const suggestScores = it => {
  const L = db.data.linked[it.id] || []; if (!L.length) return null;
  const cites = L.reduce((a, x) => a + (+x.cites || 0), 0), ys = L.map(x => x.year).filter(Boolean), y0 = it.kind === 'o' ? it.path[0].year : it.y0;
  const span = ys.length ? Math.max(...ys) - Math.min(...ys) + 1 : 0, recent = ys.filter(y => y >= 2022).length, roles = new Set(L.map(x => x.role)).size, srcs = new Set(L.flatMap(x => x.srcs || [])).size;
  const nrf = L.filter(x => x.nrf).length, after = ys.filter(y => y >= y0).length, use = L.filter(x => /파급|활용|후속|지원 과제|후속세대/.test(x.role)).length;
  const cap = v => Math.round(Math.max(40, Math.min(100, v)));
  const s = [
    cap(50 + 12.5 * Math.log10(1 + cites) + 2 * Math.min(10, L.length)),
    cap(45 + 1.5 * Math.min(25, span) + 4 * roles + 2 * srcs + 10 * (recent > 0)),
    cap(50 + 6 * Math.min(5, nrf) + 20 * (after / Math.max(1, ys.length))),
    cap(50 + 6 * Math.min(6, use) + 5 * Math.min(4, (db.data.evidence[it.id] || []).length)),
  ];
  return { s, basis: [`피인용 합계 ${cites.toLocaleString()} · 자료 ${L.length}건`, `기간 ${span}년 · 구분 ${roles}종 · 출처 ${srcs}곳 · 최근 5년 ${recent}건`, `재단 지원 표시 ${nrf}건 · 첫 지원 이후 자료 ${after}/${ys.length}건`, `활용·후속 구분 ${use}건 · 근거 ${(db.data.evidence[it.id] || []).length}건`] };
};

/* ---------- 영향경로 복원: 연결 논문을 인용한 논문·기관을 OpenAlex에서 모은다 ---------- */
state.ana = { chain: {}, match: null };
const oaGet = async u => { const k = dsCfg().keys.openalex, m = dsCfg().mailto, r = await fetch(`${u}${k ? `&api_key=${enc(k)}` : ''}${m ? `&mailto=${enc(m)}` : ''}`); if (!r.ok) throw new Error(`OpenAlex ${r.status}`); return r.json(); };
const chainRun = async it => {
  const L = (db.data.linked[it.id] || []).filter(x => x.doi).slice(0, 12), C = state.ana.chain[it.id] = { run: true };
  if (!L.length) { C.run = false; C.err = 'DOI가 있는 연결 자료가 없습니다.'; return render(); }
  reopen(it.id);
  try {
    const ids = [];
    for (const x of L) { try { const w = await oaGet(`https://api.openalex.org/works/doi:${encodeURIComponent(x.doi.replace(/^https?:\/\/doi\.org\//, ''))}?select=id,cited_by_count`); ids.push({ id: w.id.split('/').pop(), c: w.cited_by_count, t: x.title }); } catch (e) { /* 못 찾은 DOI는 건너뜀 */ } }
    if (!ids.length) throw new Error('OpenAlex에서 연결 논문을 찾지 못했습니다.');
    const f = `cites:${ids.map(x => x.id).join('|')}`;
    const [years, types, comp, gov, top] = await Promise.all([
      oaGet(`https://api.openalex.org/works?filter=${f}&group_by=publication_year`), oaGet(`https://api.openalex.org/works?filter=${f}&group_by=authorships.institutions.type`),
      oaGet(`https://api.openalex.org/works?filter=${f},authorships.institutions.type:company&group_by=authorships.institutions.id`), oaGet(`https://api.openalex.org/works?filter=${f},authorships.institutions.type:government&group_by=authorships.institutions.id`),
      oaGet(`https://api.openalex.org/works?filter=${f}&sort=cited_by_count:desc&per-page=5&select=title,publication_year,cited_by_count,doi`),
    ]);
    // 기업·정부가 쓴 논문에 함께 이름을 올린 다른 기관도 묶이므로, 기관 유형을 다시 확인해 걸러 낸다
    const keep = async (g, type) => { const top = (g.group_by || []).slice(0, 40); if (!top.length) return []; const ids2 = top.map(x => x.key.split('/').pop());
      const t = await oaGet(`https://api.openalex.org/institutions?filter=openalex:${ids2.join('|')}&select=id,type&per-page=50`), ok = new Set((t.results || []).filter(x => x.type === type).map(x => x.id.split('/').pop()));
      return top.filter(x => ok.has(x.key.split('/').pop())).slice(0, 8).map(x => [x.key_display_name, x.count]); };
    const [compL, govL] = await Promise.all([keep(comp, 'company'), keep(gov, 'government')]);
    Object.assign(C, { run: false, err: '', at: new Date().toISOString(), papers: ids, total: years.meta?.count || 0,
      years: (years.group_by || []).map(g => [+g.key, g.count]).filter(x => x[0] >= 1970 && x[0] <= 2026).sort((a, b) => a[0] - b[0]),
      types: (types.group_by || []).map(g => [g.key_display_name || g.key, g.count]).slice(0, 8),
      comp: compL, gov: govL.slice(0, 6),
      top: (top.results || []).map(w => ({ title: w.title, year: w.publication_year, cites: w.cited_by_count, doi: w.doi })) });
  } catch (e) { C.run = false; C.err = e.message; }
  if (state.open === it.id) reopen(it.id);
};
const TYPE_KO2 = { education: '대학·교육', company: '기업', government: '정부·공공', healthcare: '의료', facility: '연구시설', nonprofit: '비영리', archive: '기록·도서관', funder: '연구지원기관', other: '기타' };
const chainSvg = (it, C) => {
  const W = 760, col = dom(it.domain).color, cols = [['지원 과제', [`${it.kind === 'o' ? it.path[0].program : it.life[0].program}`, `${it.kind === 'o' ? it.path[0].year : it.y0}년 첫 지원`]], ['연결 논문', [`${C.papers.length}편`, `피인용 ${C.papers.reduce((a, x) => a + (x.c || 0), 0).toLocaleString()}`]], ['인용 논문', [`${C.total.toLocaleString()}편`, C.years.length ? `${C.years[0][0]}~${C.years.at(-1)[0]}` : '']], ['인용 기관', C.types.slice(0, 3).map(([k, n]) => `${TYPE_KO2[k] || k} ${n.toLocaleString()}`)], ['기업·정부', [`기업 ${C.comp.length}곳 이상`, `정부·공공 ${C.gov.length}곳 이상`]]];
  return `<svg viewBox="0 0 ${W} 120" class="chainsvg" role="img" aria-label="인용 사슬">${cols.map(([h, lines], i) => { const x = 10 + i * 152; return `${i ? `<path d="M${x - 16},60 L${x - 4},60" stroke="${col}" stroke-width="3" marker-end="url(#ca)"/>` : ''}<rect x="${x}" y="18" width="134" height="84" rx="16" fill="${i ? '#fff' : col}" stroke="${col}" stroke-width="2"/><text x="${x + 67}" y="42" text-anchor="middle" style="font-size:12px;font-weight:700;fill:${i ? '#27365A' : '#fff'}">${h}</text>${lines.slice(0, 3).map((l, k) => `<text x="${x + 67}" y="${62 + k * 16}" text-anchor="middle" style="font-size:11px;fill:${i ? '#5D6980' : '#fff'}">${esc(String(l).slice(0, 18))}</text>`).join('')}`; }).join('')}<defs><marker id="ca" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${col}"/></marker></defs></svg>`;
};

/* ---------- 상세 화면 분석 묶음 ---------- */
const anaSec = it => {
  if (!isAdmin()) return '';
  const sg = suggestScores(it), ov = db.data.scoreOv[it.id], C = state.ana.chain[it.id], d = db.data.drafts[it.id] || {};
  const mx = C?.years?.length ? Math.max(...C.years.map(x => x[1])) : 1;
  return `<div class="sec"><h3>실데이터 점수 제안 ${ov ? '<span class="tag ok">제안 점수 적용 중</span>' : ''}</h3>
    ${sg ? `${tbl(['기준', '지금', '제안', '근거 값'], CRIT.map((c, i) => [c.replace(/ \(.*/, ''), (it.scores0 || it.scores)[i] + (ov ? ` → ${ov[i]}` : ''), `<b>${sg.s[i]}</b>`, `<span class="sm">${esc(sg.basis[i])}</span>`]))}
      <div class="chips mt"><button class="btn pri" data-act="scoreapply" data-v="${it.id}">제안 점수 적용</button>${ov ? `<button class="btn" data-act="scorereset" data-v="${it.id}">예시 점수로 되돌리기</button>` : ''}</div>
      <p class="mute sm mt">식(안): 성과 수준 = 50 + 12.5·log10(1+피인용) + 2·자료 수 · 파급 범위 = 45 + 1.5·기간 + 4·구분 수 + 2·출처 수 (+10 최근 5년) · 지원 연계 = 50 + 6·재단 지원 자료 + 20·첫 지원 후 비율 · 국민 체감 = 50 + 6·활용·후속 자료 + 5·근거 수 (각 40~100). 선정위 확정 전 참고값입니다.</p>`
      : '<p class="mute sm mt">연결 자료가 없어 제안할 수 없습니다. 데이터 검색에서 자료를 연결하세요.</p>'}</div>
  <div class="sec"><h3>영향경로 복원 · 인용 사슬</h3>
    ${C?.run ? '<p class="sm mt">OpenAlex에서 인용 사슬을 모으는 중…</p>' : C?.err ? `<p class="warn sm mt">${esc(C.err)}</p>` : ''}
    ${C?.papers ? `${chainSvg(it, C)}
      <div class="row c2" style="margin-top:8px"><div><h4 class="h4">연도별 인용 논문</h4><div class="minibars">${C.years.map(([y, n]) => `<i style="height:${Math.max(3, n / mx * 100)}%" title="${y}년 ${n}편"></i>`).join('')}</div><p class="mute sm">${C.years[0]?.[0] || ''} → ${C.years.at(-1)?.[0] || ''}</p>
        <h4 class="h4 mt">인용 기관 유형</h4>${C.types.map(([k, n], i) => bar(TYPE_KO2[k] || k, n / Math.max(1, C.types[0][1]) * 100, n.toLocaleString(), GC[i % 4], '90px 1fr 60px')).join('')}</div>
        <div><h4 class="h4">인용한 기업</h4>${C.comp.length ? ul(C.comp.map(([n, c]) => `${esc(n)} <span class="mute">${c}편</span>`)) : '<p class="mute sm">없음</p>'}<h4 class="h4 mt">인용한 정부·공공기관</h4>${C.gov.length ? ul(C.gov.map(([n, c]) => `${esc(n)} <span class="mute">${c}편</span>`)) : '<p class="mute sm">없음</p>'}
        <h4 class="h4 mt">많이 인용된 후속 논문</h4>${ul(C.top.map(w => `${w.doi ? `<a href="${esc(w.doi)}" target="_blank" rel="noopener noreferrer">${esc(w.title)}</a>` : esc(w.title)} <span class="mute">${w.year} · ${w.cites}</span>`))}</div></div>
      <div class="chips mt"><button class="btn" data-act="chainev" data-v="${it.id}">요약을 근거로 등록</button><span class="mute sm" style="align-self:center">${esc((C.at || '').slice(0, 10))} 기준 · OpenAlex</span></div>` : ''}
    <div class="chips mt"><button class="btn ${C?.papers ? '' : 'pri'}" data-act="chainrun" data-v="${it.id}" ${C?.run ? 'disabled' : ''}>${C?.papers ? '다시 복원' : '인용 사슬 복원'}</button><span class="mute sm" style="align-self:center">DOI가 있는 연결 자료(최대 12편)를 인용한 논문과 기관을 모아 과제 → 논문 → 인용 → 기업·정부로 잇습니다.</span></div></div>
  <div class="sec"><h3>원고 초안 · 보도자료 ${d.draft ? `<span class="tag">${esc(d.status || '초안')}</span>` : ''}</h3>
    <div class="chips mt"><button class="btn pri" data-act="aiwrite" data-v="${it.id}" data-m="draft">사례 원고 초안 만들기</button><button class="btn" data-act="aiwrite" data-v="${it.id}" data-m="press">보도자료·영문 요약 만들기</button>${d.draft || d.press ? `<button class="btn" data-act="draftcopy" data-v="${it.id}">글로 복사</button>` : ''}</div>
    <p class="mute sm mt">근거 패키지·연결 자료·인터뷰 메모와 항목의 사실만을 근거로 씁니다. 문단마다 근거 번호가 붙고, 아래 "근거 점검"이 근거 없는 문단과 근거에 없는 수치를 표시합니다. 서버에 ANTHROPIC_API_KEY가 필요합니다.</p>
    ${d.draft ? draftView(it, d) : ''}${d.press ? pressView(d.press) : ''}</div>`;
};

/* ---------- AI 원고: 근거 목록 만들기, 보여 주기, 점검 ---------- */
const factsOf = it => it.kind === 'o'
  ? [`성과명: ${it.title}`, `지원 영역: ${dom(it.domain).label}`, ...it.path.map((p, i) => `${p.year}년 ${PATH_STAGES[i]} · ${p.program} · ${p.desc}`), `기여 유형: ${it.ctype} (${STORY[it.ctype].def})`, `국민 체감: ${FEEL[it.guide]}`, `확산 권역: ${it.region}`]
  : [`연구자: ${it.title} (${it.field}, 익명)`, `지원 영역: ${dom(it.domain).label}`, ...it.life.map((p, i) => `${p.year}년 ${p.stage} · ${p.program} · ${ROLES[i]} · ${p.out}`), `누적 지원 ${it.years}년 · 재단 지원 과제 ${it.grants}건 · 배출 인력 ${it.alumni}명`, `국민 체감: ${FEEL[it.guide]}`];
const sourcesOf = it => [
  ...(db.data.evidence[it.id] || []).map(e => `${e.type} · ${e.title}${e.note ? ` · ${e.note}` : ''}${e.url ? ` · ${e.url}` : ''}`),
  ...(db.data.linked[it.id] || []).map(x => `${x.role} · ${x.title} · ${x.year || ''} · ${x.venue || ''} · 피인용 ${x.cites ?? '—'}${x.nrf ? ' · 재단 지원' : ''}${x.note ? ` · ${x.note}` : ''}`),
  ...db.data.interviews.filter(x => x.id === it.id && x.memo).map(x => `인터뷰 메모 · ${x.memo}`),
];
const draftCheck = (it, dr) => {
  const src = [...factsOf(it), ...sourcesOf(it)].join(' '), paras = dr.sections.flatMap(s => s.paras);
  const nums = [...new Set(paras.flatMap(p => (p.text.match(/\d[\d,.]*\s*(?:년|억|건|명|편|%|배|곳|개)?/g) || []).map(x => x.trim())))].filter(n => !src.includes(n.replace(/[^\d.]/g, '').replace(/\.$/, '')));
  return { uncited: paras.filter(p => !p.cites?.length).length, nums: nums.slice(0, 20), total: paras.length };
};
const draftView = (it, d) => {
  const c = draftCheck(it, d.draft), S = sourcesOf(it);
  return `<article class="draft"><h4>${esc(d.draft.title)}</h4><p class="lead">${esc(d.draft.lead)}</p>
    ${d.draft.sections.map(s => `<h5>${esc(s.heading)}</h5>${s.paras.map(p => `<p class="${p.cites?.length ? '' : 'nocite'}">${esc(p.text)}${(p.cites || []).map(n => `<sup title="${esc(S[n - 1] || '근거 범위 밖')}">[${n}]</sup>`).join('')}</p>`).join('')}`).join('')}
    <div class="story sm mt"><b>근거 점검</b> · 문단 ${c.total}개 중 근거 없는 문단 <b class="${c.uncited ? 'warn' : ''}">${c.uncited}</b>개 · 근거·사실 목록에 없는 수치 <b class="${c.nums.length ? 'warn' : ''}">${c.nums.length}</b>개${c.nums.length ? ` (${c.nums.map(esc).join(', ')})` : ''}</div>
    <div class="toolbar mt"><span class="sm">상태</span>${['초안', '검토 중', '확정'].map(s => `<button class="btn ${d.status === s ? 'on' : ''}" data-act="draftstat" data-v="${it.id}" data-s="${s}">${s}</button>`).join('')}<span class="mute sm">${esc(d.model || '')} · ${esc((d.at || '').slice(0, 10))}</span></div>
    <details class="alt"><summary>근거 목록 ${S.length}개</summary><ol class="sm">${S.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details></article>`;
};
const pressView = p => `<article class="draft"><h4>${esc(p.headline)}</h4><p class="lead">${esc(p.subhead)}</p>${p.paras.map(x => `<p>${esc(x)}</p>`).join('')}${p.quote ? `<blockquote>${esc(p.quote)}</blockquote>` : ''}<h5>English</h5><p><b>${esc(p.en_title)}</b></p><p>${esc(p.en_summary)}</p></article>`;
const draftText = d => [d.draft && [d.draft.title, d.draft.lead, ...d.draft.sections.flatMap(s => [`\n■ ${s.heading}`, ...s.paras.map(p => `${p.text}${(p.cites || []).map(n => `[${n}]`).join('')}`)])].join('\n'), d.press && ['\n\n[보도자료]', d.press.headline, d.press.subhead, ...d.press.paras, d.press.quote && `“${d.press.quote}”`, '\n[English]', d.press.en_title, d.press.en_summary].filter(Boolean).join('\n')].filter(Boolean).join('\n');

Object.assign(ACT, {
  scoreapply: v => { const s = suggestScores(byId(v)); if (!s) return; db.data.scoreOv[v] = s.s; db.save('scoreOv'); applyScoreOv(); reopen(v); toast('제안 점수를 적용했습니다. 순위·지수에 바로 반영됩니다.'); },
  scorereset: v => { delete db.data.scoreOv[v]; db.save('scoreOv'); applyScoreOv(); reopen(v); },
  chainrun: v => chainRun(byId(v)),
  chainev: v => {
    const C = state.ana.chain[v], E = (db.data.evidence[v] ||= []);
    E.push({ type: '논문·저서', title: `인용 사슬 요약: 연결 논문 ${C.papers.length}편 → 인용 논문 ${C.total}편`, url: '', note: impClean(`기관 유형 ${C.types.map(([k, n]) => `${TYPE_KO2[k] || k} ${n}`).join(', ')} · 기업 ${C.comp.slice(0, 3).map(x => x[0]).join(', ')} · ${C.at.slice(0, 10)} OpenAlex`).slice(0, 300) });
    db.save('evidence'); reopen(v); toast('근거 패키지에 등록했습니다.');
  },
  aiwrite: async (v, t) => {
    const it = byId(v), mode = t.dataset.m, label = t.textContent; if (t.dataset.busy) return; t.dataset.busy = '1'; t.textContent = '쓰는 중…';
    try {
      const j = await apiJ('/api/ai/write', { method: 'POST', body: { mode, title: it.kind === 'o' ? it.title : `${it.field} 연구자`, facts: factsOf(it), sources: sourcesOf(it) } });
      const d = (db.data.drafts[v] ||= {}); if (mode === 'draft') { d.draft = j.data; d.status = '초안'; } else d.press = j.data; d.model = j.model; d.at = new Date().toISOString();
      db.save('drafts'); reopen(v); toast(mode === 'draft' ? '원고 초안을 만들었습니다. 근거 점검을 확인하세요.' : '보도자료 초안을 만들었습니다.');
    } catch (e) { toast(e.message.includes('서버 오류 404') ? '서버에 연결하지 못했습니다 (npm start 주소에서만 됩니다).' : e.message); }
    delete t.dataset.busy; if (t.isConnected) t.textContent = label;
  },
  draftstat: (v, t) => { db.data.drafts[v].status = t.dataset.s; db.save('drafts'); reopen(v); },
  draftcopy: async v => { try { await navigator.clipboard.writeText(draftText(db.data.drafts[v])); toast('원고를 복사했습니다.'); } catch (e) { toast('복사하지 못했습니다.'); } },
});

/* ---------- 데이터 검색 → 지원 효과 짝지은 비교 (연도 × 세부분야 층화) ---------- */
DS_SUBS.push(['match', '짝지은 비교', '지원·비지원 층화 매칭']);
DSV.match = () => {
  const M = state.ana.match || (state.ana.match = { q: '', from: 2012, to: 2018, n: 100, run: false, res: null });
  const r = M.res;
  return `
  ${slide('지원·비지원 <b>짝지은 비교</b>', `<div class="toolbar mt"><input class="field" value="${esc(M.q)}" placeholder="주제어 (예: perovskite solar cell)" data-chg="mtq" style="flex:1 1 240px">
      <input class="field" type="number" value="${M.from}" data-chg="mtfrom" style="flex:0 1 90px" aria-label="시작 연도"><input class="field" type="number" value="${M.to}" data-chg="mtto" style="flex:0 1 90px" aria-label="끝 연도">
      <select class="field" data-chg="mtn" style="flex:0 1 130px">${[50, 100, 200].map(n => `<option value="${n}" ${M.n === n ? 'selected' : ''}>연도별 ${n}편씩</option>`).join('')}</select><button class="btn pri" data-act="mtrun" ${M.run ? 'disabled' : ''}>${M.run ? '비교 중…' : '비교'}</button></div>
    <p class="mute sm mt">한국 기관 논문 중 한국연구재단 지원 논문과 지원 표시가 없는 논문을 연도마다 무작위로 뽑아(OpenAlex sample, seed 고정), 같은 연도·같은 세부분야끼리 짝지어 피인용과 분야 보정 피인용 지수(FWCI)를 비교합니다. 층별 차이를 지원 논문 수로 가중 평균하고 부트스트랩 95% 구간을 냅니다.</p>`,
    '분야·시기가 비슷한 논문끼리 비교해 "지원이 만든 차이"의 근거를 만듭니다. 관찰자료 비교이므로 인과로 단정하지 않고 참고 근거로 씁니다.')}
  ${r ? `
  ${kpi4([[r.diff >= 0 ? `+${r.diff.toFixed(1)}` : r.diff.toFixed(1), '회', `피인용 차이 (95% ${r.lo.toFixed(1)} ~ ${r.hi.toFixed(1)})`], [r.fdiff == null ? '—' : (r.fdiff >= 0 ? '+' : '') + r.fdiff.toFixed(2), '', 'FWCI 차이'], [r.nT, '편', `짝지은 지원 논문 (층 ${r.strata}개)`], [r.nC, '편', '짝지은 비지원 논문']])}
  ${slide('연도별 <b>비교</b>', tbl(['연도', '지원 논문', '비지원 논문', '층', '지원 평균 피인용', '비지원 평균', '차이'], r.byYear.map(y => [y.y, y.nT, y.nC, y.k, y.mT.toFixed(1), y.mC.toFixed(1), `<b>${(y.mT - y.mC >= 0 ? '+' : '') + (y.mT - y.mC).toFixed(1)}</b>`])) + `<p class="mute sm mt">짝을 찾지 못한(같은 세부분야의 비교 논문이 없는) 지원 논문은 제외했습니다. 주제어: ${esc(r.q)}</p>`)}` : ''}`;
};
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const mtRun = async () => {
  const M = state.ana.match; if (!M.q.trim()) return toast('주제어를 입력하세요.');
  M.run = true; render();
  try {
    const sel = 'id,publication_year,cited_by_count,fwci,primary_topic', base = `https://api.openalex.org/works?search=${enc(M.q)}&sample=${M.n}&seed=42&per-page=${M.n}&select=${sel}&filter=institutions.country_code:kr`;
    const strata = [], byYear = [];
    for (let y = Math.max(1990, M.from); y <= Math.min(2024, M.to); y++) {
      const [T, Cn] = await Promise.all([oaGet(`${base},publication_year:${y},funders.id:F4320322120`), oaGet(`${base},publication_year:${y},funders.id:!F4320322120`)]);
      const g = L => { const m = new Map(); for (const w of L.results || []) { const k = w.primary_topic?.subfield?.id; if (k) (m.get(k) || m.set(k, []).get(k)).push(w); } return m; };
      const gt = g(T), gc = g(Cn); let nT = 0, nC = 0, k = 0, sT = [], sC = [];
      for (const [key, tw] of gt) { const cw = gc.get(key); if (!cw) continue; strata.push({ t: tw, c: cw }); nT += tw.length; nC += cw.length; k++; sT.push(...tw.map(w => w.cited_by_count)); sC.push(...cw.map(w => w.cited_by_count)); }
      byYear.push({ y, nT, nC, k, mT: mean(sT), mC: mean(sC) });
      M.prog = y; render();
    }
    const est = S => { let w = 0, d = 0, fw = 0, fd = 0; for (const s of S) { const n = s.t.length; w += n; d += n * (mean(s.t.map(x => x.cited_by_count)) - mean(s.c.map(x => x.cited_by_count))); const ft = s.t.map(x => x.fwci).filter(v => v != null), fc = s.c.map(x => x.fwci).filter(v => v != null); if (ft.length && fc.length) { fw += n; fd += n * (mean(ft) - mean(fc)); } } return { d: w ? d / w : 0, f: fw ? fd / fw : null }; };
    const e = est(strata), boots = [];
    for (let b = 0; b < 300; b++) boots.push(est(strata.map(s => ({ t: s.t.map(() => s.t[Math.floor(Math.random() * s.t.length)]), c: s.c.map(() => s.c[Math.floor(Math.random() * s.c.length)]) }))).d);
    boots.sort((a, b) => a - b);
    M.res = { q: M.q, diff: e.d, fdiff: e.f, lo: boots[7] ?? e.d, hi: boots[292] ?? e.d, nT: strata.reduce((a, s) => a + s.t.length, 0), nC: strata.reduce((a, s) => a + s.c.length, 0), strata: strata.length, byYear };
  } catch (e) { toast(`비교하지 못했습니다: ${e.message}`); }
  M.run = false; render();
};
Object.assign(ACT, {
  mtq: v => { state.ana.match.q = String(v).slice(0, 200); },
  mtfrom: v => { state.ana.match.from = Math.max(1990, Math.min(2024, +v || 2012)); },
  mtto: v => { state.ana.match.to = Math.max(1990, Math.min(2024, +v || 2018)); },
  mtn: v => { state.ana.match.n = +v; },
  mtrun: () => mtRun(),
});
