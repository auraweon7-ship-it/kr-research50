/* 인포그래픽 데이터: 대표성과·대표 연구자 인포그래픽에 들어갈 값을 실데이터에서 모아 검토하고 반영한다.
   출처: 데이터 검색으로 연결한 자료, 모집단 구축에서 항목에 연결한 과제·성과(NTIS·KRM·파일), OpenAlex 저자 정보.
   반영한 값은 db.data.infoData(공개 화면에도 반영되는 숫자·연도), 성과 목록은 db.data.infoOut(관리 화면 전용)에 둔다.
   항목의 원래 예시 값은 _orig로 보관해, 반영을 지우면 되돌아간다. */
const INFO_FIELDS = {
  o: [['y0', '첫 지원 연도', '년'], ['y1', '후속 연구 연도', '년'], ['y2', '기술·지식 축적 연도', '년'], ['y3', '산업·사회 활용 연도', '년'], ['p0', '첫 지원 사업', ''], ['invest', '실질 투입', '억'],
    ['projects', '지원 과제', '건'], ['budget', '연구비 합계', '억'], ['papers', '관련 논문', '편'], ['cites', '피인용 합계', '회'], ['patents', '특허', '건'], ['tech', '기술이전·사업화', '건']],
  p: [['y0', '첫 지원 연도', '년'], ['grants', '재단 지원 과제', '건'], ['years', '누적 지원 기간', '년'], ['papers', '대표 논문·저서', '편'], ['cites', '피인용 합계', '회'], ['hindex', 'h-지수', ''], ['patents', '특허·기술이전', '건'],
    ['coauthors', '공동연구자', '명'], ['awards', '수상', '회'], ['alumni', '배출 인력', '명'], ['policy', '정책·자문', '건']],
};
const OTYPE_KO = { paper: '논문', patent: '특허', royalty: '기술료', commercial: '사업화', report: '보고서', book: '저역서', etc: '기타', project: '과제' };
state.idata = { kind: 'o', id: '', prop: null, pick: {}, author: '', run: false };

/* ---------- 반영: 원래 값 보관 → 반영 값 덮어쓰기 ---------- */
const infoFieldsOf = id => db.data.infoData?.[id]?.fields || {};
const applyInfoData = () => {
  for (const it of [...OUTCOMES, ...PEOPLE]) {
    if (it._orig) { Object.assign(it, JSON.parse(JSON.stringify(it._orig))); }
    const F = infoFieldsOf(it.id); if (!Object.keys(F).length) { delete it.real; continue; }
    it._orig ||= JSON.parse(JSON.stringify({ path: it.path, invest: it.invest, y0: it.y0, era: it.era, grants: it.grants, years: it.years, papers: it.papers, patents: it.patents, coauthors: it.coauthors, awards: it.awards, alumni: it.alumni, policy: it.policy, life: it.life }));
    const v = k => F[k]?.v;
    if (it.kind === 'o') {
      ['y0', 'y1', 'y2', 'y3'].forEach((k, i) => { if (v(k)) it.path[i].year = +v(k); });
      if (v('p0')) it.path[0].program = String(v('p0'));
      if (v('invest')) it.invest = Math.max(1, +v('invest'));
      it.y0 = it.path[0].year; it.era = eraOf(it.y0).id;
      it.real = Object.fromEntries(['projects', 'budget', 'papers', 'cites', 'patents', 'tech'].filter(k => v(k) != null).map(k => [k, +v(k)]));
    } else {
      if (v('y0')) { const d = +v('y0') - it.y0; it.y0 = +v('y0'); it.life = it.life.map(p => ({ ...p, year: p.year + d })).filter(p => p.year <= 2026); it.era = eraOf(it.y0).id; }
      for (const k of ['grants', 'years', 'papers', 'patents', 'coauthors', 'awards', 'alumni', 'policy']) if (v(k) != null) it[k] = +v(k);
      it.real = Object.fromEntries(['cites', 'hindex'].filter(k => v(k) != null).map(k => [k, +v(k)]));
    }
  }
};
// 인포그래픽 위 안내 줄: 반영 상태와 출처
const infoStatus = it => { const M = infoMeta(it.id), F = infoFieldsOf(it.id), srcs = [...new Set(Object.values(F).map(f => f.src.replace(/ \(.*\)$/, '')))]; return `<p class="infostat ${M ? 'on' : ''}">${M ? `<b>실데이터 ${M.n}개 값 반영</b> · ${esc(M.at.slice(0, 10))} · 출처: ${esc(srcs.join(', '))}` : '<b>예시 데이터</b> · "데이터 갱신"을 누르면 데이터 검색·모집단 구축에서 모은 값이 반영됩니다.'}</p>`; };
const infoMeta = id => { const D = db.data.infoData?.[id]; return D ? { n: Object.keys(D.fields || {}).length, at: D.at } : null; };

/* ---------- 수집: 연결 자료·모집단·OpenAlex에서 제안 값 만들기 ---------- */
const poolOf = id => typeof PL === 'object' ? [...PL.rec.values()].filter(r => r.item === id && r.status === 'active') : [];
const computeInfo = async (it, authorId) => {
  const P = {}, outs = [], put = (k, v, src) => { if (v == null || v === '' || Number.isNaN(v)) return; P[k] = { v, src }; };
  // 1) 모집단에서 이 항목에 연결한 과제와, 과제고유번호로 이어진 성과
  if (typeof PL === 'object' && !PL.loaded) await poolLoad();
  const R = poolOf(it.id), projs = R.filter(r => r.kind === 'project').sort((a, b) => (a.start || 9999) - (b.start || 9999));
  const pids = new Set(projs.map(r => r.pid).filter(Boolean)), routs = [...R.filter(r => r.kind === 'output'), ...(typeof PL === 'object' ? [...PL.rec.values()].filter(r => r.kind === 'output' && r.status === 'active' && r.pid && pids.has(r.pid) && r.item !== it.id) : [])];
  if (projs.length) {
    const src = `모집단 과제 ${projs.length}건`, ys = projs.map(r => r.start).filter(Boolean), ends = projs.map(r => r.end || r.start).filter(Boolean), bud = projs.reduce((a, r) => a + (+r.budget || 0), 0);
    put('y0', ys.length ? Math.min(...ys) : null, src); if (projs[0].programStd || projs[0].program) put('p0', projs[0].programStd || projs[0].program, src);
    if (it.kind === 'o') { put('projects', projs.length, src); if (bud) { put('budget', Math.round(bud / 1e8), src); put('invest', Math.max(1, Math.round(bud / 1e8)), `${src} 연구비`); } if (projs[1]?.start) put('y1', projs[1].start, `${src} (두 번째 과제)`); }
    else { put('grants', projs.length, src); if (ys.length) put('years', Math.max(...ends) - Math.min(...ys) + 1, src); }
    outs.push(...projs.map(r => ({ type: '과제', title: r.title, year: r.start, val: [r.programStd || r.program, r.budget ? `${(r.budget / 1e8).toFixed(1)}억` : ''].filter(Boolean).join(' · '), src: r.src })));
  }
  if (routs.length) {
    const c = t => routs.filter(r => r.otype === t), src = `모집단 성과 ${routs.length}건`;
    if (c('paper').length) put('papers', c('paper').length, src); if (c('patent').length) put('patents', c('patent').length, src);
    const tech = [...c('royalty'), ...c('commercial')]; if (it.kind === 'o' && tech.length) { put('tech', tech.length, src); put('y3', Math.min(...tech.map(r => r.year || 9999)), `${src} (첫 기술료·사업화)`); }
    const pat = c('patent').map(r => r.year).filter(Boolean); if (it.kind === 'o' && pat.length) put('y2', Math.min(...pat), `${src} (첫 특허)`);
    outs.push(...routs.map(r => ({ type: OTYPE_KO[r.otype] || '성과', title: r.title, year: r.year || r.start, val: '', src: r.src })));
  }
  // 2) 데이터 검색으로 연결한 자료
  const L = db.data.linked[it.id] || [];
  if (L.length) {
    const src = `연결 자료 ${L.length}건`, pap = L.filter(x => !/patent|특허/i.test(x.type || '')), cites = L.reduce((a, x) => a + (+x.cites || 0), 0);
    if (!P.papers || pap.length > P.papers.v) put('papers', pap.length, src); put('cites', cites, src);
    outs.push(...L.map(x => ({ type: /patent|특허/i.test(x.type || '') ? '특허' : '논문', title: x.title, year: x.year, val: x.cites != null ? `피인용 ${x.cites}` : '', src: (x.srcs || []).join('·'), role: x.role })));
  }
  // 3) OpenAlex 저자(연구자): 논문 수·피인용·h-지수·첫 논문 해, 많이 인용된 논문
  if (it.kind === 'p' && authorId) {
    const a = await oaGet(`https://api.openalex.org/authors/${encodeURIComponent(authorId)}?select=id,display_name,works_count,cited_by_count,summary_stats,counts_by_year`);
    const src = `OpenAlex 저자 ${a.id.split('/').pop()}`;
    put('papers', a.works_count, src); put('cites', a.cited_by_count, src); put('hindex', a.summary_stats?.h_index, src);
    const w = await oaGet(`https://api.openalex.org/works?filter=author.id:${a.id.split('/').pop()}&sort=cited_by_count:desc&per-page=8&select=title,publication_year,cited_by_count,doi,authorships`);
    const co = new Set(); (w.results || []).forEach(x => (x.authorships || []).forEach(s => s.author?.id && s.author.id !== a.id && co.add(s.author.id)));
    if (co.size) put('coauthors', co.size, `${src} (상위 논문 공저자)`);
    outs.push(...(w.results || []).map(x => ({ type: '논문', title: x.title, year: x.publication_year, val: `피인용 ${x.cited_by_count}`, src: 'OpenAlex' })));
  }
  const seen = new Set(); return { P, outs: outs.filter(o => { const k = String(o.title || '').toLowerCase().replace(/\s+/g, ''); if (!k || seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 200) };
};
const curVal = (it, k) => { const O = it._orig || it; if (it.kind === 'o') { const i = ['y0', 'y1', 'y2', 'y3'].indexOf(k); if (i >= 0) return O.path[i].year; if (k === 'p0') return O.path[0].program; if (k === 'invest') return O.invest; return null; } return k === 'y0' ? O.y0 : O[k] ?? null; };
// 반영: 고른 값만 저장하고 항목에 적용한다
const saveInfo = (it, P, outs, keys) => {
  const D = (db.data.infoData ||= {})[it.id] ||= { fields: {} }, at = new Date().toISOString();
  for (const k of keys) if (P[k]) D.fields[k] = { v: typeof P[k].v === 'number' ? P[k].v : impClean(P[k].v).slice(0, 120), src: impClean(P[k].src).slice(0, 120), at };
  D.at = at; db.save('infoData');
  if (outs) { (db.data.infoOut ||= {})[it.id] = outs.map(o => ({ type: o.type, title: impClean(o.title).slice(0, 300), year: o.year || null, val: impClean(o.val || '').slice(0, 80), src: impClean(o.src || '').slice(0, 60), role: o.role || '' })); db.save('infoOut'); }
  applyInfoData(); if (typeof applyScoreOv === 'function') applyScoreOv();
};

/* ---------- 관련 성과 목록(카드 하단 표·인포그래픽) ---------- */
const relatedOutputs = it => {
  const L = (db.data.infoOut?.[it.id] || []).concat((db.data.linked[it.id] || []).map(x => ({ type: /patent|특허/i.test(x.type || '') ? '특허' : '논문', title: x.title, year: x.year, val: x.cites != null ? `피인용 ${x.cites}` : '' })));
  const seen = new Set(); return L.filter(o => { const k = String(o.title || '').toLowerCase().replace(/\s+/g, ''); if (!k || seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => (b.year || 0) - (a.year || 0));
};
// 카드 하단 표: 수집한 성과가 있으면 그것을, 없으면 영향경로(성과)·연계 대표성과(연구자)를 보여 준다
const cardTable = it => {
  const R = relatedOutputs(it), anon = it.kind === 'p' && !staff();
  let rows, more = 0, head = ['연도', '구분', it.kind === 'o' ? '관련 성과' : '관련 성과'];
  if (R.length && !anon) { rows = R.slice(0, 3).map(o => [o.year || '—', o.type, o.title]); more = R.length - 3; }
  else if (it.kind === 'o') rows = it.path.map((p, i) => [p.year, PATH_STAGES[i].replace('·', ''), PATH_OUT[i]]).slice(0, 4);
  else { const os = it.outcomes.map(byId).filter(Boolean); rows = [...os.map(o => [o.path[0].year, '대표성과', o.title]), ['누적', '논문·저서', `${it.papers}편`], ['누적', '특허·기술이전', `${it.patents}건`]].slice(0, 4); }
  return `<span class="ctbl" role="table" aria-label="관련 성과"><span class="ctr ch" role="row">${head.map(h => `<span role="columnheader">${h}</span>`).join('')}</span>${rows.map(r => `<span class="ctr" role="row">${r.map(c => `<span role="cell">${esc(String(c))}</span>`).join('')}</span>`).join('')}${more > 0 ? `<span class="ctr cm"><span></span><span></span><span>외 ${more}건 · 수집 자료</span></span>` : R.length && !anon ? '<span class="ctr cm"><span></span><span></span><span>수집 자료</span></span>' : ''}</span>`;
};
// 인포그래픽에 붙는 "수집 데이터로 본 성과" 줄
const realRow = it => {
  const M = infoMeta(it.id), R = relatedOutputs(it), anon = it.kind === 'p' && !staff();
  if (!M && !R.length) return '';
  const r = it.real || {}, nums = it.kind === 'o'
    ? [[r.projects, '건', '지원 과제'], [r.budget, '억', '연구비'], [r.papers, '편', '관련 논문'], [r.cites, '회', '피인용'], [r.patents, '건', '특허'], [r.tech, '건', '기술이전·사업화']]
    : [[it.papers, '편', '논문'], [r.cites, '회', '피인용'], [r.hindex, '', 'h-지수'], [it.patents, '건', '특허·기술이전'], [it.coauthors, '명', '공동연구자'], [it.grants, '건', '재단 지원 과제']];
  const shown = nums.filter(([v]) => v != null && !Number.isNaN(v));
  return `<h4>수집 데이터로 본 성과 <span style="letter-spacing:0;font-weight:500">${M ? `· ${M.n}개 값 반영 · ${M.at.slice(0, 10)}` : '· 연결 자료'}</span></h4>
    ${shown.length ? `<div class="p-gaps six">${shown.map(([v, u, l], i) => `<div ${mo(i, .08)}><b>${cnt(v)}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>` : ''}
    ${R.length && !anon ? `<div class="p-otbl"><table><thead><tr><th>연도</th><th>구분</th><th>성과</th><th>비고</th></tr></thead><tbody>${R.slice(0, 8).map(o => `<tr><td>${o.year || '—'}</td><td>${esc(o.type)}</td><td>${esc(o.title)}</td><td>${esc(o.val || '')}</td></tr>`).join('')}</tbody></table>${R.length > 8 ? `<p class="p-note">외 ${R.length - 8}건</p>` : ''}</div>` : ''}`;
};

/* ---------- 데이터 갱신(인포그래픽): 수집 → 바뀐 값 모두 반영 ---------- */
const infoRefresh = async (id, btn) => {
  const it = byId(id), l = btn?.textContent; if (btn) btn.textContent = '갱신 중…';
  try {
    const author = db.data.infoData?.[id]?.author || '';
    const { P, outs } = await computeInfo(it, author);
    const keys = Object.keys(P).filter(k => String(P[k].v) !== String(curVal(it, k)) || !infoFieldsOf(id)[k]);
    if (!keys.length && !outs.length) { toast('반영할 수집 데이터가 없습니다. 데이터 검색에서 자료를 연결하거나 모집단 구축에서 과제를 이 항목에 연결하세요.'); }
    else { saveInfo(it, P, outs, keys); render(); toast(`${keys.length}개 값과 관련 성과 ${outs.length}건을 반영했습니다.`); }
  } catch (e) { toast(`갱신하지 못했습니다: ${e.message}`); }
  if (btn?.isConnected) btn.textContent = l;
};

/* ---------- 데이터 검색 → 인포그래픽 데이터 ---------- */
DS_SUBS.push(['infodata', '인포그래픽 데이터', '수집·검토·반영']);
DSV.infodata = () => {
  const S = state.idata, list = [...LIST[S.kind]].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)), it = byId(S.id) || list[0]; S.id = it.id;
  const F = infoFieldsOf(it.id), defs = INFO_FIELDS[it.kind], pr = S.prop?.id === it.id ? S.prop : null, L = (db.data.linked[it.id] || []).length, PR = poolOf(it.id);
  return `
  ${slide('인포그래픽 <b>데이터 수집</b>', `<div class="toolbar mt"><div class="chips">${[['o', '대표성과'], ['p', '대표 연구자']].map(([v, l]) => `<button class="chip ${S.kind === v ? 'on' : ''}" data-act="idkind" data-v="${v}">${l}</button>`).join('')}</div>
      <select class="field" data-chg="idpick" style="flex:1 1 280px">${list.map(x => `<option value="${x.id}" ${x.id === it.id ? 'selected' : ''}>${x.id} · ${esc(x.kind === 'o' ? x.title : `${x.field} 연구자`)}${infoMeta(x.id) ? ' · 반영됨' : ''}</option>`).join('')}</select></div>
    <div class="row c3 mt">${[[`연결 자료 ${L}건`, '데이터 검색 결과를 이 항목에 연결한 자료 (논문 수·피인용)', `<button class="btn" data-act="lkfind" data-v="${it.id}">자료 찾아 연결</button>`],
      [`모집단 연결 ${PR.length}건`, '모집단 구축에서 이 항목에 연결한 과제·성과 (첫 지원·사업·과제 수·연구비·특허·기술료)', `<button class="btn" data-act="nav" data-v="pool:info">모집단에서 연결</button>`],
      [it.kind === 'p' ? 'OpenAlex 저자' : 'OpenAlex', it.kind === 'p' ? '저자 ID(A로 시작) 또는 orcid:0000-…' : '연결 자료의 DOI로 인용 사슬은 성과 상세에서', it.kind === 'p' ? `<input class="field" value="${esc(S.author || db.data.infoData?.[it.id]?.author || '')}" placeholder="A5023888391 또는 orcid:…" data-chg="idauthor">` : '']].map(([h, p, b]) => `<div class="story sm"><b>${h}</b><br><span class="mute">${p}</span><div class="chips mt">${b}</div></div>`).join('')}</div>
    <div class="chips mt"><button class="btn pri" data-act="idrun" ${S.run ? 'disabled' : ''}>${S.run ? '수집 중…' : '수집'}</button><button class="btn" data-act="idview" data-v="${it.id}">인포그래픽에서 보기</button>${Object.keys(F).length ? `<button class="btn" data-act="idclear" data-v="${it.id}">반영 지우기</button>` : ''}</div>`,
    '인포그래픽의 숫자·연도를 실데이터로 채웁니다. 수집한 값은 지금 값과 나란히 보고 골라서 반영하며, 반영하면 인포그래픽·카드·상세·타임라인에 함께 적용됩니다.')}
  ${slide('수집 값 <b>검토·반영</b>', `<div class="tw"><table><thead><tr><th scope="col"><span class="sr">반영</span></th><th scope="col">항목</th><th scope="col">지금(예시)</th><th scope="col">수집 값</th><th scope="col">출처</th><th scope="col">반영된 값</th></tr></thead><tbody>
      ${defs.map(([k, l, u]) => { const p = pr?.P[k], f = F[k]; return `<tr><td>${p ? `<input type="checkbox" data-chg="idsel" data-v="${k}" ${S.pick[k] ? 'checked' : ''}>` : ''}</td><td><b>${l}</b></td><td>${esc(String(curVal(it, k) ?? '—'))}${curVal(it, k) != null && u ? u : ''}</td>
        <td>${p ? `<b>${esc(String(p.v))}</b>${u}` : '<span class="mute">—</span>'}</td><td class="sm">${p ? esc(p.src) : ''}</td><td class="sm">${f ? `${esc(String(f.v))}${u} <span class="mute">· ${esc(f.src)}</span>` : '<span class="mute">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>
    ${pr ? `<div class="chips mt"><button class="btn pri" data-act="idsave" ${Object.values(S.pick).some(Boolean) ? '' : 'disabled'}>고른 값 반영 (${Object.values(S.pick).filter(Boolean).length}개)</button><span class="mute sm" style="align-self:center">관련 성과 ${pr.outs.length}건도 함께 저장합니다.</span></div>
      ${pr.outs.length ? `<h3 class="mt" style="font-size:13px">수집한 관련 성과</h3>${tbl(['연도', '구분', '성과', '비고', '출처'], pr.outs.slice(0, 30).map(o => [o.year || '—', esc(o.type), esc(o.title), esc(o.val || ''), esc(o.src || '')]))}` : ''}` : '<p class="mute sm mt">"수집"을 누르면 세 출처에서 값을 모아 이 표에 채웁니다.</p>'}`)}`;
};
Object.assign(ACT, {
  idkind: v => { state.idata.kind = v; state.idata.id = ''; state.idata.prop = null; render(); },
  idpick: v => { state.idata.id = v; state.idata.prop = null; state.idata.pick = {}; state.idata.author = ''; render(); },
  idauthor: v => { state.idata.author = String(v).trim().replace(/^https?:\/\/openalex\.org\//, '').slice(0, 60); },
  idsel: (v, t) => { state.idata.pick[v] = t.checked; render(); },
  idrun: async () => {
    const S = state.idata, it = byId(S.id); S.run = true; render();
    try { const r = await computeInfo(it, S.author || db.data.infoData?.[it.id]?.author); S.prop = { id: it.id, ...r }; S.pick = Object.fromEntries(Object.keys(r.P).map(k => [k, String(r.P[k].v) !== String(curVal(it, k))])); if (!Object.keys(r.P).length) toast('모은 값이 없습니다. 자료를 연결하거나 저자 ID를 넣어 주세요.'); }
    catch (e) { toast(`수집하지 못했습니다: ${e.message}`); }
    S.run = false; render();
  },
  idsave: () => {
    const S = state.idata, it = byId(S.id), keys = Object.keys(S.pick).filter(k => S.pick[k]);
    if (S.author && it.kind === 'p') { (db.data.infoData ||= {})[it.id] ||= { fields: {} }; db.data.infoData[it.id].author = S.author; }
    saveInfo(it, S.prop.P, S.prop.outs, keys); S.prop = null; S.pick = {}; render(); toast(`${keys.length}개 값을 반영했습니다. 인포그래픽·카드·상세에 적용됩니다.`);
  },
  idclear: v => { if (!confirm('이 항목에 반영한 수집 값을 지우고 예시 값으로 되돌릴까요?')) return; delete db.data.infoData[v]; delete db.data.infoOut?.[v]; db.save('infoData'); db.save('infoOut'); applyInfoData(); render(); },
  idview: v => { const it = byId(v); state.pick[it.kind === 'o' ? 'info' : 'pinfo'] = v; ACT.nav(`outreach:${it.kind === 'o' ? 'info' : 'pinfo'}`); },
  inforefresh: (v, t) => infoRefresh(v, t),
  idview2: v => ACT.pidgo(v),
});

/* ---------- 모집단 구축 → ⑦ 인포그래픽 연결 ---------- */
POOL_SUBS.push(['info', '⑦ 인포그래픽 연결', '대표 항목별 자료']);
const poolItemSel = r => `<span class="toolbar" style="margin:0;gap:6px"><select class="field" data-chg="pitem" data-v="${esc(r.key)}" style="flex:0 1 260px;padding:6px 10px" aria-label="대표 항목에 연결"><option value="">대표 항목에 연결 안 함</option>${[...OUTCOMES, ...PEOPLE].map(x => `<option value="${x.id}" ${r.item === x.id ? 'selected' : ''}>${x.id} · ${esc(x.kind === 'o' ? x.title : `${x.field} 연구자`)}</option>`).join('')}</select></span>`;
PV.info = () => {
  const recs = [...PL.rec.values()].filter(r => r.status === 'active'), by = new Map(); for (const r of recs) if (r.item) (by.get(r.item) || by.set(r.item, []).get(r.item)).push(r);
  const q = (state.pool.iq || '').trim().toLowerCase(), cand = q ? recs.filter(r => !r.item && `${r.title} ${r.pi} ${r.pid} ${r.agency}`.toLowerCase().includes(q)).slice(0, 40) : [];
  const tgt = state.pool.itgt || OUTCOMES[0].id;
  return `
  ${slide('대표 항목별 <b>수집 자료</b>', by.size ? tbl(['대표 항목', '과제', '성과', '기간', '반영', ''], [...by.entries()].map(([id, L]) => { const it = byId(id); if (!it) return null; const ys = L.map(r => r.start || r.year).filter(Boolean);
      return [`${id} ${esc(it.kind === 'o' ? it.title : `${it.field} 연구자`)}`, L.filter(r => r.kind === 'project').length, L.filter(r => r.kind === 'output').length, ys.length ? `${Math.min(...ys)}~${Math.max(...ys)}` : '—', infoMeta(id) ? `<span class="tag ok">${infoMeta(id).n}개</span>` : '<span class="mute">—</span>',
        `<div class="chips" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-act="pinforun" data-v="${id}">인포그래픽 갱신</button><button class="btn" data-act="pidgo" data-v="${id}">검토</button></div>`]; }).filter(Boolean))
    : '<p class="mute sm mt">아직 대표 항목에 연결한 과제·성과가 없습니다. 아래에서 찾아 연결하거나, 수집 자료 상세 화면의 "대표 항목에 연결"을 쓰세요.</p>',
    '모집단의 과제·성과를 대표성과·대표 연구자에 연결하면 첫 지원 연도·사업·과제 수·연구비·논문·특허·기술료가 인포그래픽 데이터로 모입니다.')}
  ${slide('찾아서 <b>연결</b>', `<div class="toolbar mt"><input class="field" value="${esc(state.pool.iq || '')}" placeholder="과제명·책임자·과제번호·기관" data-chg="piq" style="flex:1 1 240px">
      <select class="field" data-chg="pitgt" style="flex:1 1 260px">${[...OUTCOMES, ...PEOPLE].map(x => `<option value="${x.id}" ${tgt === x.id ? 'selected' : ''}>${x.id} · ${esc(x.kind === 'o' ? x.title : `${x.field} 연구자`)}</option>`).join('')}</select>
      <button class="btn pri" data-act="pibulk" ${cand.length ? '' : 'disabled'}>찾은 ${cand.length}건 모두 연결</button></div>
    ${cand.length ? tbl(['자료원', '과제번호', '과제·성과', '책임자·기관', '기간', ''], cand.map(r => [esc(r.src), esc(r.pid || '—'), esc(r.title), esc([r.pi, r.agency].filter(Boolean).join(' · ') || '—'), `${r.start || r.year || '—'}`, `<button class="btn" data-act="pione" data-v="${esc(r.key)}">연결</button>`])) : `<p class="mute sm mt">${q ? '연결하지 않은 자료 중 찾은 것이 없습니다.' : '검색어를 넣으면 아직 연결하지 않은 과제·성과를 찾습니다.'}</p>`}
    <p class="mute sm mt">과제를 연결하면 같은 과제고유번호의 성과(논문·특허·기술료·사업화)도 함께 집계됩니다.</p>`)}`;
};
const pitemSet = async (keys, id) => { const out = []; for (const k of keys) { const r = PL.rec.get(k); if (!r) continue; r.item = id || null; r.updated = new Date().toISOString(); out.push(r); } await idb.put('rec', out); };
Object.assign(ACT, {
  pitem: async (v, t) => { await pitemSet([t.dataset.v], v); toast(v ? `${v}에 연결했습니다.` : '연결을 풀었습니다.'); },
  piq: v => { state.pool.iq = String(v).slice(0, 80); render(); },
  pitgt: v => { state.pool.itgt = v; },
  pione: async v => { await pitemSet([v], state.pool.itgt || OUTCOMES[0].id); render(); },
  pibulk: async () => { const q = (state.pool.iq || '').trim().toLowerCase(), keys = [...PL.rec.values()].filter(r => r.status === 'active' && !r.item && `${r.title} ${r.pi} ${r.pid} ${r.agency}`.toLowerCase().includes(q)).slice(0, 40).map(r => r.key); await pitemSet(keys, state.pool.itgt || OUTCOMES[0].id); render(); toast(`${keys.length}건을 연결했습니다.`); },
  pinforun: (v, t) => infoRefresh(v, t),
  pidgo: v => { const it = byId(v); Object.assign(state.idata, { kind: it.kind, id: v, prop: null, pick: {} }); ACT.nav('dsearch:infodata'); },
});
