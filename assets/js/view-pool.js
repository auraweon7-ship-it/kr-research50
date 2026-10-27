/* 10 모집단 구축: 범위 설정 → NTIS·KRM 수집 → 식별·정제 → 재단 DB 대조 → 후보군 풀 확정 (관리자 모드).
   수집 자료는 수천 건이 될 수 있어 localStorage가 아니라 이 브라우저의 IndexedDB에 둔다.
   연구진끼리는 '모집단 내보내기·불러오기' 꾸러미로 주고받는다. 받아온 글자는 모두 esc()로 거른다. */
const POOL_SUBS = [['plan', '① 범위 설정', '수집 계획'], ['collect', '②③ 수집', 'NTIS·KRM·KIPRIS·파일'], ['refine', '④ 식별·정제', '연구자·중복·코드'], ['match', '⑤ 재단 DB 대조', '누락·불일치'], ['pool', '⑥ 후보군 풀', '300건 목표·확정'], ['log', '수집 로그·출처', '재현성·이용조건']];
const POOL_TARGET = 300;
const OTYPES = { paper: '논문', patent: '특허', royalty: '기술료', commercial: '사업화', report: '보고서', book: '저역서', etc: '기타' };
// 기록에 담는 항목: 과제(project)와 성과(output)
const PFIELDS = { pid: '과제고유번호', title: '과제명·성과명', program: '사업명', agency: '수행기관', pi: '연구책임자', piId: '연구자번호', start: '시작연도', end: '종료연도', year: '연도', budget: '연구비(원)', field: '연구분야', otype: '성과 유형' };
// 응답·파일에서 항목을 자동으로 짐작하는 규칙 (태그 경로·열 이름)
const PGUESS = {
  pid: /projectnumber|projectno|pjtno|과제고유번호|과제번호|projectid|^pid$|rndprojectnumber/i, title: /projecttitle.*korean|projecttitle|^title$|title.*korean|과제명|성과명|논문명|제목|articletitle/i,
  program: /budgetproject|businessname|programname|사업명|세부사업/i, agency: /researchagency|leadagency|수행기관|주관기관|기관명|institution/i,
  pi: /manager.*name|researchername|연구책임자|책임자|^pi$|authorname/i, piId: /researcherno|연구자번호|국가연구자번호|managerid/i,
  start: /period.*start|startdate|시작|start/i, end: /period.*end|enddate|종료|end/i, year: /projectyear|^year$|연도|pubyear|발행연도|기준연도/i,
  budget: /totalfunds|governmentfunds|funds?$|연구비|정부출연금|budgetamount|^budget$/i, field: /sciencefield|researchfield|연구분야|학문분야|field/i,
};
const LIC0 = {
  ntis: { name: '국가과학기술지식정보서비스(NTIS)', terms: '출처 표시. 대량·비공개 항목은 재단·KISTI 협조로 제공받은 범위 안에서만 활용' },
  krm: { name: '기초학문자료센터(KRM)', terms: '출처 표시 · 상업적 이용 금지 · 변경 금지 (자료별 이용조건 확인)' },
  kipris: { name: '특허정보넷 KIPRIS', terms: '출처 표시' },
  fdb: { name: '한국연구재단 내부 과제·성과 DB', terms: '내부 분석용. 외부 공개 시 재단 승인 필요' },
  file: { name: '내려받기 파일', terms: '원 자료원의 이용조건을 따름' },
  openalex: { name: 'OpenAlex', terms: 'CC0 (출처 표시 권장)' },
};

/* ---------- 저장: IndexedDB ---------- */
const idb = {
  p: null,
  open() { return this.p ||= new Promise((res, rej) => { const r = indexedDB.open('nrf50-pool', 1); r.onupgradeneeded = () => { const d = r.result; for (const [n, k] of [['rec', 'key'], ['log', 'id'], ['meta', 'k']]) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: k }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async all(s) { const d = await this.open(); return new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async put(s, items) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(s, 'readwrite'), st = t.objectStore(s); for (const x of [].concat(items)) st.put(x); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); },
  async del(s, keys) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(s, 'readwrite'), st = t.objectStore(s); for (const k of [].concat(keys)) st.delete(k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); },
  async clear(s) { const d = await this.open(); return new Promise((res, rej) => { const t = d.transaction(s, 'readwrite'); t.objectStore(s).clear(); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); },
};
const PL = { loaded: false, rec: new Map(), log: [], meta: { plans: [], codemap: [], lic: {}, maps: {}, persons: {}, notdup: [], fdb: null } };
state.psub = 'plan';
state.pool = { job: null, q: '', src: '', kind: 'project', dom: '', pg: 0, open: null, imp: null, edit: null };
const poolLoad = async () => {
  if (PL.loaded) return;
  try {
    const [rec, log, meta] = await Promise.all([idb.all('rec'), idb.all('log'), idb.all('meta')]);
    PL.rec = new Map(rec.map(r => [r.key, r])); PL.log = log.sort((a, b) => b.at.localeCompare(a.at));
    for (const m of meta) PL.meta[m.k] = m.v;
  } catch (e) { toast('브라우저 저장소(IndexedDB)를 열지 못했습니다. 사생활 보호 모드에서는 쓸 수 없습니다.'); }
  PL.loaded = true; if (state.view === 'pool') render();
};
const metaSave = k => idb.put('meta', { k, v: PL.meta[k] }).catch(() => toast('저장하지 못했습니다.'));
const lic = src => ({ ...(LIC0[src.split(':')[0]] || LIC0.file), ...(PL.meta.lic[src.split(':')[0]] || {}) });

/* ---------- 정규화 ---------- */
const nm = s => String(s || '').toLowerCase().replace(/[\s·.,()\-_'"]/g, '');
const yr = v => { const m = String(v || '').match(/(19[5-9]\d|20[0-4]\d)/); return m ? +m[1] : null; };
const guessDomain = r => { const p = `${r.program || ''} ${r.field || ''}`; return r.src === 'krm' || /인문|사회|HK|SSK|토대|명저|학술/.test(p) ? 'hs' : /BK|인재|학문후속|박사후|대학중점|신진연구자정착/.test(p) ? 'hr' : /국제|글로벌|해외|GRL|ODA/.test(p) ? 'ic' : 'rd'; };
const progStd = p => { const m = PL.meta.codemap.find(c => c.from && nm(p).includes(nm(c.from))); return m ? m.to : p; };
// 응답 레코드(태그 경로·값 목록)를 표준 항목으로 옮긴다. 사용자가 고른 대응(mapping)이 있으면 그것을, 없으면 짐작을 쓴다
const NUMF = new Set(['budget', 'start', 'end', 'year']);
const mapRow = (pairs, map) => {
  const out = {};
  for (const f of Object.keys(PGUESS)) {
    const path = map?.[f];
    const ok = ([p, v]) => (PGUESS[f].test(p.split('>').slice(-2).join('')) || PGUESS[f].test(p)) && (!NUMF.has(f) || /\d/.test(v));
    const hit = path ? pairs.find(([p]) => p === path) : pairs.find(ok);
    if (hit) out[f] = String(hit[1]).trim().slice(0, 300);
  }
  return out;
};
const flatXml = el => { const out = []; const walk = (e, path) => { for (const c of e.children) { const p = path ? `${path}>${c.tagName}` : c.tagName; if (c.children.length) walk(c, p); else if (c.textContent.trim()) out.push([p, c.textContent.trim()]); } }; walk(el, ''); return out; };
const xmlRows = text => {
  const doc = new DOMParser().parseFromString(text, 'text/xml'); if (doc.getElementsByTagName('parsererror').length) throw new Error('응답이 XML이 아닙니다');
  const cnt = {}; for (const el of doc.getElementsByTagName('*')) if (el.children.length) cnt[el.tagName] = (cnt[el.tagName] || 0) + 1;
  const best = Object.entries(cnt).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])[0];
  const rows = best ? [...doc.getElementsByTagName(best[0])].map(flatXml) : [];
  if (!rows.length) { const el = doc.querySelector('resultMsg, returnAuthMsg, errMsg, error, message'), msg = ((el || doc.documentElement).textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100); if (/error|err|인증|키|key|invalid|실패|없/i.test(msg)) throw new Error(`API 응답: ${msg}`); }
  return rows;
};
const makeRec = (src, kind, f, pairs, extra = {}) => {
  const start = yr(f.start) || yr(f.year), end = yr(f.end) || start, r = { src, kind, pid: (f.pid || '').replace(/\s/g, ''), title: f.title || '(제목 없음)', program: f.program || '', agency: f.agency || '', pi: f.pi || '', piId: f.piId || '',
    start, end, year: yr(f.year) || start, budget: +String(f.budget || '').replace(/[^\d.]/g, '') || null, field: f.field || '', otype: extra.otype || (kind === 'output' ? (Object.keys(OTYPES).find(k => OTYPES[k] === f.otype) || 'etc') : ''), raw: pairs.slice(0, 40), at: new Date().toISOString(), status: 'active', ...extra };
  r.programStd = progStd(r.program); r.domain = guessDomain(r);
  r.key = `${src.split(':')[0]}:${kind}:${r.pid || nm(r.title).slice(0, 60)}:${kind === 'output' ? nm(r.title).slice(0, 40) : (r.start || '')}`;
  return r;
};
// 같은 키가 이미 있으면 연구진이 손댄 표시(후보·제외·AI·메모)는 지키고 수집 값만 갱신한다
const upsert = async list => {
  let added = 0; const out = [];
  for (const r of list) { const p = PL.rec.get(r.key); if (!p) added++; const v = p ? { ...r, status: p.status, mergedInto: p.mergedInto, pool: p.pool, ai: p.ai, note: p.note, sent: p.sent, at: p.at, updated: r.at } : r; PL.rec.set(v.key, v); out.push(v); }
  await idb.put('rec', out); return added;
};
const addLog = async e => { const x = { id: `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at: new Date().toISOString(), ...e }; PL.log.unshift(x); await idb.put('log', x); };

/* ---------- 수집기 (NTIS·KRM·KIPRIS) ---------- */
const COLLECTORS = { ntis: { name: 'NTIS', kind: 'project' }, krm: { name: 'KRM', kind: 'project' }, kipris: { name: 'KIPRIS', kind: 'output', otype: 'patent' } };
const tplFor = id => dsCfg().tpl[id] || DS_SRC.find(s => s.id === id)?.tpl || '';
const collect = async (planId, srcId) => {
  const plan = PL.meta.plans.find(p => p.id === planId), C = COLLECTORS[srcId], src = DS_SRC.find(s => s.id === srcId);
  if (!plan || !src) return; if (state.pool.job) return toast('이미 수집 중입니다.');
  const terms = srcId === 'kipris' ? plan.keywords : [...plan.programs, ...plan.keywords]; if (!terms.length) return toast('계획에 사업명이나 검색어가 없습니다.');
  const key = dsKey(src), t = tplFor(srcId);
  if (/\(.*확인.*\)/.test(t)) return toast(`${C.name} 요청 주소를 데이터 검색 → API 설정에서 넣어 주세요.`);
  if (t.includes('{key}') && !key) return toast(`${C.name} API 키가 필요합니다 (데이터 검색 → API 설정, 또는 서버 공용 키).`);
  const job = state.pool.job = { src: srcId, plan: plan.name, i: 0, n: terms.length, got: 0, added: 0, err: '', sample: null }; render();
  const n = 100, maxPages = Math.max(1, +plan.maxPages || 3), map = PL.meta.maps[srcId];
  for (const term of terms) {
    for (let page = 1; page <= maxPages; page++) {
      const url = t.replace(/\{q\}/g, enc(term)).replace(/\{key\}/g, enc(key)).replace(/\{n\}/g, n).replace(/\{from\}/g, plan.from).replace(/\{to\}/g, plan.to).replace(/\{page\}/g, page).replace(/\{start\}/g, (page - 1) * n + 1);
      let rows;
      try { rows = xmlRows(await (await dsGet(src, url)).text()); } catch (e) { job.err = e.message; break; }
      if (!job.sample && rows[0]) job.sample = rows[0];
      const recs = rows.map(p => makeRec(srcId, C.kind, mapRow(p, map), p, { plan: plan.id, ...(C.otype ? { otype: C.otype } : {}) })).filter(r => !r.start || (r.start >= plan.from && r.start <= plan.to));
      job.got += rows.length; job.added += await upsert(recs);
      if (state.view === 'pool') render();
      if (rows.length < n) break;
    }
    if (job.err) break;
    job.i++;
  }
  await addLog({ plan: plan.id, planName: plan.name, src: srcId, query: `${terms.length}개 검색어 × 최대 ${maxPages}쪽 · ${plan.from}~${plan.to}`, count: job.got, added: job.added, err: job.err });
  if (job.sample && !PL.meta.maps[srcId]) state.pool.mapSrc = srcId;
  state.pool.job = null; render(); toast(job.err ? `${C.name} 수집 중단: ${job.err}` : `${C.name} ${job.got}건 받음 · 새로 ${job.added}건`);
};

/* ---------- 화면 조각 ---------- */
const pRecs = () => [...PL.rec.values()];
const active = () => pRecs().filter(r => r.status === 'active');
const projs = () => active().filter(r => r.kind === 'project');
const outputsOf = pid => pid ? active().filter(r => r.kind === 'output' && r.pid === pid) : [];
const kpis = items => `<div class="row c4">${items.map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : ''}">${['①', '②', '③', '④'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>`;
const srcLabel = s => esc(lic(s).name);
const cite = srcs => [...new Set(srcs)].map(s => { const L = PL.log.filter(l => l.src === s.split(':')[0]); return `${lic(s).name}${L.length ? ` (${L[L.length - 1].at.slice(0, 10)}~${L[0].at.slice(0, 10)} 수집)` : ''}`; }).join('; ');

const PV = {};
PV.plan = () => {
  const e = state.pool.edit, P = PL.meta.plans;
  const form = p => `<div class="qfgrid planform">
      <label>계획 이름<input class="field" data-pf="name" value="${esc(p.name)}"></label>
      <label>수집 기간<span class="yr2"><input class="field" type="number" data-pf="from" value="${p.from}"> ~ <input class="field" type="number" data-pf="to" value="${p.to}"></span></label>
      <label>검색어당 최대 쪽수 (쪽당 100건)<input class="field" type="number" min="1" max="50" data-pf="maxPages" value="${p.maxPages}"></label>
      <label>분야 (메모)<input class="field" data-pf="fields" value="${esc(p.fields)}" placeholder="예: 이공, 인문사회"></label>
      <label style="grid-column:1/-1">재단 사업명 (한 줄에 하나 · 통합 전 기관 사업명 포함)<textarea class="field" rows="6" data-pf="programs" placeholder="예)&#10;중견연구&#10;리더연구&#10;선도연구센터&#10;인문한국(HK)">${esc(p.programs.join('\n'))}</textarea></label>
      <label style="grid-column:1/-1">추가 검색어 (한 줄에 하나 · KIPRIS 특허 검색에도 씀)<textarea class="field" rows="3" data-pf="keywords">${esc(p.keywords.join('\n'))}</textarea></label>
      <label style="grid-column:1/-1">메모<input class="field" data-pf="note" value="${esc(p.note)}"></label></div>
    <div class="chips"><button class="btn pri" data-act="plsave">계획 저장</button><button class="btn" data-act="pledit" data-v="">취소</button></div>`;
  return `
  ${slide('수집 <b>계획</b>', `${P.length ? tbl(['계획', '기간', '사업명', '검색어', '최근 수집', ''], P.map(p => { const L = PL.log.find(l => l.plan === p.id); return [esc(p.name), `${p.from}~${p.to}`, `${p.programs.length}개<br><span class="mute sm">${esc(p.programs.slice(0, 3).join(', '))}${p.programs.length > 3 ? ' 외' : ''}</span>`, p.keywords.length, L ? `${L.at.slice(0, 10)}<br><span class="mute sm">${esc(L.src)} ${L.count}건</span>` : '<span class="mute">—</span>',
      `<div class="chips" style="gap:6px">${Object.keys(COLLECTORS).map(s => `<button class="btn" data-act="plrun" data-v="${p.id}" data-src="${s}" ${state.pool.job ? 'disabled' : ''}>${COLLECTORS[s].name} 수집</button>`).join('')}<button class="btn" data-act="pledit" data-v="${p.id}">수정</button><button class="btn" data-act="pldel" data-v="${p.id}">삭제</button></div>`]; })) : '<p class="mute sm mt">아직 계획이 없습니다.</p>'}
    <div class="chips mt"><button class="btn pri" data-act="pledit" data-v="new">새 계획</button></div>
    ${e ? `<h3 class="mt2" style="font-size:13.5px">${e === 'new' ? '새 계획' : '계획 수정'}</h3>${form(e === 'new' ? { name: '', from: 1977, to: 2026, maxPages: 3, fields: '', programs: [], keywords: [], note: '' } : P.find(p => p.id === e))}` : ''}`,
    '재단 사업명·기간·분야를 정해 두면 NTIS·KRM·KIPRIS 수집에 같은 조건이 그대로 쓰입니다. 통합 전 기관(한국과학재단·한국학술진흥재단·국제과학기술협력재단)의 사업명도 함께 넣어 두세요.')}
  ${state.pool.job ? jobBox() : ''}`;
};
const jobBox = () => { const j = state.pool.job; return slide(`${COLLECTORS[j.src].name} <b>수집 중</b>`, `<div class="bar mt" style="height:14px"><span class="g-teal" style="width:${Math.round(j.i / j.n * 100)}%"></span></div><p class="sm mt">${esc(j.plan)} · 검색어 ${j.i}/${j.n} · 받은 ${j.got}건 · 새로 ${j.added}건${j.err ? ` · <span class="warn">${esc(j.err)}</span>` : ''}</p>`); };

PV.collect = () => {
  const ms = state.pool.mapSrc, all = active(), S = state.pool, list = recList(), pg = S.pg, PG = 100;
  const sample = ms ? (pRecs().find(r => r.src === ms && r.raw?.length)?.raw || []) : [];
  return `
  ${kpis([[projs().length.toLocaleString(), '건', '수집 과제'], [all.filter(r => r.kind === 'output').length.toLocaleString(), '건', '수집 성과(논문·특허 등)'], [projs().filter(r => outputsOf(r.pid).length).length.toLocaleString(), '건', '성과가 연결된 과제 (과제고유번호)'], [new Set(all.map(r => r.src)).size, '곳', '자료원']])}
  ${state.pool.job ? jobBox() : ''}
  ${slide('일괄 <b>수집</b>', `<p class="sm mt">수집은 <b>① 범위 설정</b>의 계획마다 출처별 버튼으로 시작합니다. NTIS·KRM·KIPRIS는 키가 필요하고 중계 서버를 거칩니다(데이터 검색 → API 설정, 또는 서버 공용 키).</p>
    <div class="chips mt">${PL.meta.plans.map(p => Object.keys(COLLECTORS).map(s => `<button class="btn" data-act="plrun" data-v="${p.id}" data-src="${s}" ${state.pool.job ? 'disabled' : ''}>${esc(p.name)} · ${COLLECTORS[s].name}</button>`).join('')).join('') || '<button class="btn" data-act="nav" data-v="pool:plan">먼저 수집 계획 만들기</button>'}</div>
    <p class="mute sm mt">국내 API는 응답 구조를 미리 알 수 없어 항목을 자동으로 짐작합니다. 처음 수집한 뒤 아래 '항목 대응 확인'에서 맞는지 보고 고쳐 주세요. 같은 과제를 다시 받으면 새로 추가하지 않고 갱신합니다.</p>
    <div class="chips mt">${Object.keys(COLLECTORS).map(s => `<button class="btn" data-act="pmap" data-v="${s}">${COLLECTORS[s].name} 항목 대응 확인</button>`).join('')}</div>`)}
  ${ms ? mapBox(ms, sample) : ''}
  ${slide('내려받기 <b>파일 가져오기</b>', `<div class="qfgrid mt"><label>자료 종류<select class="field" id="pfkind"><option value="project">과제</option><option value="output">성과</option></select></label>
      <label>성과 유형 (성과일 때)<select class="field" id="pfotype">${Object.entries(OTYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>자료원 이름<input class="field" id="pfname" placeholder="예: NTIS 상세검색, KISTI 제공분"></label>
      <label>파일 (CSV·엑셀)<input class="field" type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" data-chg="pfile"></label></div>
    ${S.imp ? fileMapBox() : ''}
    <p class="mute sm">NTIS 상세검색 결과 내려받기, KISTI·재단이 제공한 대량 파일을 그대로 올립니다. 성과 파일에 과제고유번호 열이 있으면 과제와 자동으로 이어집니다.</p>`)}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:6px"><h2 style="flex:1 1 200px">수집 <b>자료</b> <span class="mute sm">${list.length.toLocaleString()}건</span></h2>
      <input class="field" value="${esc(S.q)}" placeholder="과제명·책임자·과제번호" data-chg="pq" style="flex:1 1 200px"><select class="field" data-chg="psrc" style="flex:0 1 150px"><option value="">전체 자료원</option>${[...new Set(pRecs().map(r => r.src))].map(s => `<option value="${esc(s)}" ${S.src === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <select class="field" data-chg="pkind" style="flex:0 1 110px">${[['project', '과제'], ['output', '성과'], ['', '전체']].map(([v, l]) => `<option value="${v}" ${S.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn" data-act="pcsv">CSV</button><button class="btn" data-act="pexport">모집단 꾸러미 내보내기</button><label class="btn" style="cursor:pointer">꾸러미 불러오기<input type="file" accept=".json" data-chg="pimport" hidden></label></div>
    ${list.length ? `<div class="tw"><table class="dsres"><thead><tr><th scope="col">자료원</th><th scope="col">과제번호</th><th scope="col">과제·성과</th><th scope="col">사업</th><th scope="col">책임자·기관</th><th scope="col">기간</th><th scope="col">연결 성과</th><th scope="col">후보</th></tr></thead><tbody>
      ${list.slice(pg * PG, pg * PG + PG).map(r => `<tr data-act="popen" data-v="${esc(r.key)}"><td class="sm">${esc(r.src)}${r.kind === 'output' ? `<br><span class="tag">${OTYPES[r.otype] || '성과'}</span>` : ''}</td><td class="sm">${esc(r.pid || '—')}</td><td><b>${esc(r.title)}</b>${r.ai ? ` <span class="tag ${r.ai.verified ? 'ok' : ''}">AI${r.ai.verified ? ' 확인' : ''}</span>` : ''}</td><td class="sm">${esc(r.programStd || r.program || '—')}</td><td class="sm">${esc([r.pi, r.agency].filter(Boolean).join(' · ') || '—')}</td><td class="sm">${r.start || '—'}${r.end && r.end !== r.start ? `~${r.end}` : ''}</td><td>${r.kind === 'project' ? outputsOf(r.pid).length || '—' : '—'}</td><td>${r.pool === 'o' ? '<span class="tag ok">성과</span>' : ''}${PL.meta.persons[nm(r.pi)]?.cand ? '<span class="tag ok">인물</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="chips mt">${pg > 0 ? `<button class="btn" data-act="ppg" data-v="${pg - 1}">← 이전 100건</button>` : ''}${(pg + 1) * PG < list.length ? `<button class="btn" data-act="ppg" data-v="${pg + 1}">다음 100건 →</button>` : ''}<span class="mute sm" style="align-self:center">${pg * PG + 1}–${Math.min(list.length, pg * PG + PG)}</span></div>` : '<p class="mute sm mt">수집한 자료가 없습니다.</p>'}
  </section>
  ${S.open ? recDetail(PL.rec.get(S.open)) : ''}`;
};
const recList = () => { const S = state.pool, q = nm(S.q); return active().filter(r => (!S.kind || r.kind === S.kind) && (!S.src || r.src === S.src) && (!q || nm(`${r.title}${r.pi}${r.pid}${r.agency}`).includes(q))).sort((a, b) => (b.start || 0) - (a.start || 0)); };
const mapBox = (src, sample) => {
  const map = PL.meta.maps[src] || {}, auto = mapRow(sample, null), paths = sample.map(x => x[0]);
  return slide(`${COLLECTORS[src].name} <b>항목 대응 확인</b>`, sample.length ? `<div class="tw"><table><thead><tr><th scope="col">표준 항목</th><th scope="col">응답의 태그 경로</th><th scope="col">첫 레코드 값</th></tr></thead><tbody>
    ${Object.keys(PGUESS).map(f => { const cur = map[f] || paths.find(p => sample.find(x => x[0] === p)[1] === auto[f]) || ''; return `<tr><td><b>${PFIELDS[f]}</b></td><td><select class="field" data-chg="pmapset" data-src="${src}" data-f="${f}" style="min-width:240px"><option value="">(없음)</option>${paths.map(p => `<option ${cur === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></td><td class="sm">${esc(sample.find(x => x[0] === cur)?.[1] || '—')}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="chips mt"><button class="btn pri" data-act="pmapsave" data-v="${src}">이 대응으로 저장하고 다시 계산</button><button class="btn" data-act="pmap" data-v="">닫기</button></div>`
    : '<p class="mute sm mt">아직 이 출처에서 받은 레코드가 없습니다. 한 번 수집한 뒤 확인하세요.</p>', '수집한 첫 레코드의 태그를 보고 어느 항목이 과제번호·과제명·책임자인지 고릅니다. 저장하면 이미 받은 자료도 다시 계산합니다.');
};
const fileMapBox = () => {
  const p = state.pool.imp, head = p.table[0] || [];
  return `<h3 class="mt" style="font-size:13px">열 대응 · ${esc(p.name)} (${p.table.length - 1}행)</h3><div class="tw"><table><thead><tr><th scope="col">표준 항목</th><th scope="col">파일의 열</th><th scope="col">첫 행 값</th></tr></thead><tbody>
    ${Object.keys(PFIELDS).filter(f => p.kind === 'output' || f !== 'otype').map(f => `<tr><td><b>${PFIELDS[f]}</b></td><td><select class="field" data-chg="pfmap" data-f="${f}"><option value="">(없음)</option>${head.map((h, i) => `<option value="${i}" ${p.map[f] === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></td><td class="sm">${esc(p.map[f] !== undefined ? p.table[1]?.[p.map[f]] ?? '' : '—')}</td></tr>`).join('')}</tbody></table></div>
    <div class="chips mt"><button class="btn pri" data-act="pfgo">${p.table.length - 1}행 가져오기</button><button class="btn" data-act="pfcancel">취소</button></div>`;
};
// 과제 상세: 성과 사슬 · AI 구조화 · 원자료 · 출처 문구
const recDetail = r => {
  if (!r) return '';
  const outs = outputsOf(r.pid), byT = Object.keys(OTYPES).map(t => [t, outs.filter(o => o.otype === t)]).filter(x => x[1].length), ai = r.ai, proj = r.kind === 'output' ? active().find(x => x.kind === 'project' && x.pid === r.pid) : null;
  return `<section class="slide" id="precdetail"><div class="toolbar" style="margin-bottom:4px"><h2 style="flex:1 1 200px">${esc(r.title)}</h2><button class="btn" data-act="popen" data-v="">닫기</button></div>
    ${info([['자료원', `${srcLabel(r.src)} <span class="mute sm">(${esc(r.src)})</span>`], ['과제고유번호', esc(r.pid || '—')], ['사업', `${esc(r.program || '—')}${r.programStd && r.programStd !== r.program ? ` → <b>${esc(r.programStd)}</b>` : ''}`], ['책임자·기관', esc([r.pi, r.piId && `(${r.piId})`, r.agency].filter(Boolean).join(' ') || '—')], ['기간·연구비', `${r.start || '—'}${r.end && r.end !== r.start ? `~${r.end}` : ''}${r.budget ? ` · ${(r.budget / 1e8).toFixed(1)}억 원` : ''}`], ['지원 영역(추정)', dom(r.domain).label]])}
    ${r.kind === 'project' ? `<h3 class="mt2" style="font-size:13.5px">성과 사슬 · 과제 → 성과 → 활용</h3>
      ${outs.length ? `<div class="chain"><div class="cnode g-blue">과제<br><b>${esc(r.pid)}</b></div>${byT.map(([t, L]) => `<div class="carrow">→</div><div class="cnode ${t === 'royalty' || t === 'commercial' ? 'g-teal' : 'g-orange'}">${OTYPES[t]}<br><b>${L.length}건</b></div>`).join('')}</div>
        ${tbl(['유형', '성과', '연도'], outs.slice(0, 30).map(o => [OTYPES[o.otype] || '기타', esc(o.title), o.year || '—']))}` : '<p class="mute sm mt">과제고유번호로 이어진 성과가 없습니다. NTIS 성과 파일(과제고유번호 열 포함)을 가져오면 자동으로 이어집니다.</p>'}` : proj ? `<p class="sm mt">이 성과의 과제: <button class="linkbtn" data-act="popen" data-v="${esc(proj.key)}">${esc(proj.title)}</button></p>` : ''}
    <h3 class="mt2" style="font-size:13.5px">결과보고서 AI 구조화</h3>
    ${ai ? `<div class="story">${info([['연구 주제', esc(ai.topic || '—')], ['연구 방법', esc((ai.methods || []).join(' · ') || '—')], ['주요 성과', esc((ai.outcomes || []).join(' · ') || '—')], ['후속 성과', esc((ai.followups || []).join(' · ') || '—')], ['핵심어', esc((ai.keywords || []).join(', ') || '—')]])}
      <p class="sm mt"><label><input type="checkbox" data-chg="paiok" data-v="${esc(r.key)}" ${ai.verified ? 'checked' : ''}> 연구진이 원문과 대조해 확인함</label> <span class="mute">· ${esc(ai.model || '')} · ${esc((ai.at || '').slice(0, 10))}</span></p></div>` : ''}
    <textarea class="field mt" id="paitext" rows="5" placeholder="결과보고서 초록이나 본문을 붙여넣으세요 (15만 자 이하)" style="width:100%;resize:vertical"></textarea>
    <div class="chips mt"><button class="btn pri" data-act="pai" data-v="${esc(r.key)}">AI로 구조화</button><span class="mute sm" style="align-self:center">서버에 ANTHROPIC_API_KEY가 있고 관리자 로그인 상태일 때 동작합니다. 결과는 연구진 확인 전까지 '미확인'입니다.</span></div>
    <h3 class="mt2" style="font-size:13.5px">출처 문구</h3><div class="story sm">${esc(cite([r.src]))} · 이용조건: ${esc(lic(r.src).terms)}</div>
    <div class="chips mt">${r.kind === 'project' ? `<button class="btn ${r.pool === 'o' ? 'on' : ''}" data-act="pmark" data-v="${esc(r.key)}">${r.pool === 'o' ? '성과 후보 해제' : '성과 후보로 표시'}</button>` : ''}<button class="btn" data-act="pexclude" data-v="${esc(r.key)}">제외</button></div>
    <details class="alt"><summary>원자료 항목 ${r.raw?.length || 0}개</summary>${tbl(['태그·열', '값'], (r.raw || []).map(([k, v]) => [esc(k), esc(String(v).slice(0, 200))]))}</details></section>`;
};

/* ---------- ④ 식별·정제 ---------- */
const personGroups = () => {
  const g = new Map();
  for (const r of projs()) if (r.pi) { const k = nm(r.pi); (g.get(k) || g.set(k, { key: k, name: r.pi, recs: [] }).get(k)).recs.push(r); }
  return [...g.values()].map(x => { const ids = [...new Set(x.recs.map(r => r.piId).filter(Boolean))], orgs = [...new Set(x.recs.map(r => r.agency).filter(Boolean))], d = PL.meta.persons[x.key] || {};
    return { ...x, ids, orgs, d, suspect: !d.mode && (ids.length > 1 || (!ids.length && orgs.length > 1)), years: x.recs.map(r => r.start).filter(Boolean) }; }).sort((a, b) => b.recs.length - a.recs.length);
};
const dupPairs = () => {
  const P = projs(), byPid = new Map(), pairs = [], seen = new Set(PL.meta.notdup);
  for (const r of P) if (r.pid) (byPid.get(r.pid) || byPid.set(r.pid, []).get(r.pid)).push(r);
  const exact = [...byPid.values()].filter(v => v.length > 1);
  const byT = new Map(); for (const r of P) { const k = nm(r.title).slice(0, 40); if (k.length > 6) (byT.get(k) || byT.set(k, []).get(k)).push(r); }
  for (const v of byT.values()) for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { const a = v[i], b = v[j]; if (a.pid && a.pid === b.pid) continue; if (Math.abs((a.start || 0) - (b.start || 0)) <= 1 && !seen.has([a.key, b.key].sort().join('|'))) pairs.push([a, b]); }
  return { exact, pairs: pairs.slice(0, 50) };
};
PV.refine = () => {
  const G0 = personGroups(), sus = G0.filter(x => x.suspect), D = dupPairs(), cm = PL.meta.codemap;
  return `
  ${kpis([[G0.length.toLocaleString(), '명', '연구책임자 (이름 기준)'], [sus.length, '명', '동명이인 의심'], [D.exact.length, '묶음', '과제번호가 같은 중복'], [D.pairs.length, '쌍', '제목·연도가 비슷한 중복 의심']])}
  ${slide('연구자 <b>식별</b>', G0.length ? `<div class="tw"><table><thead><tr><th scope="col">연구자</th><th scope="col">과제</th><th scope="col">연구자번호 · 기관</th><th scope="col">기간</th><th scope="col">판정</th><th scope="col">ORCID</th></tr></thead><tbody>
      ${[...sus, ...G0.filter(x => !x.suspect)].slice(0, 60).map(x => `<tr><td><b>${esc(x.name)}</b>${x.suspect ? ' <span class="tag no">동명이인 의심</span>' : ''}</td><td>${x.recs.length}</td><td class="sm">${esc([...x.ids, ...x.orgs].slice(0, 4).join(' · ') || '—')}${x.ids.length + x.orgs.length > 4 ? ' 외' : ''}</td><td class="sm">${x.years.length ? `${Math.min(...x.years)}~${Math.max(...x.years)}` : '—'}</td>
        <td><div class="chips" style="gap:4px">${[['same', '같은 사람'], ['split', '기관별로 분리']].map(([m, l]) => `<button class="btn ${x.d.mode === m ? 'on' : ''}" data-act="pperson" data-v="${esc(x.key)}" data-m="${m}" style="padding:5px 10px;font-size:11.5px">${l}</button>`).join('')}</div></td>
        <td class="sm">${x.d.orcid ? `<a href="https://orcid.org/${esc(x.d.orcid)}" target="_blank" rel="noopener noreferrer">${esc(x.d.orcid)}</a>` : `<button class="btn" data-act="porcid" data-v="${esc(x.key)}" style="padding:5px 10px;font-size:11.5px">ORCID 찾기</button>`}${state.pool.orcid?.key === x.key ? orcidList(x.key) : ''}</td></tr>`).join('')}</tbody></table></div>
    <p class="mute sm mt">같은 이름인데 연구자번호가 여럿이거나, 번호 없이 기관이 여럿이면 동명이인 의심으로 표시합니다. 판정은 후보군 풀의 인물 집계에 쓰입니다. ORCID는 영문 이름으로 찾습니다(ORCID 공개 API).</p>` : '<p class="mute sm mt">수집한 과제가 없습니다.</p>', '국가연구자번호·ORCID·이름+소속으로 같은 사람을 묶고 동명이인을 가립니다.')}
  ${slide('과제 <b>중복 제거</b>', `<p class="sm mt">과제번호가 같은 ${D.exact.length}묶음 ${D.exact.length ? '<button class="btn" data-act="pdedupe">모두 하나로 합치기</button>' : ''}</p>
    ${D.pairs.length ? tbl(['과제 A', '과제 B', ''], D.pairs.map(([a, b]) => [`${esc(a.title)}<br><span class="mute sm">${esc(a.src)} · ${a.start || '—'} · ${esc(a.pid || '번호 없음')}</span>`, `${esc(b.title)}<br><span class="mute sm">${esc(b.src)} · ${b.start || '—'} · ${esc(b.pid || '번호 없음')}</span>`,
      `<div class="chips" style="gap:4px"><button class="btn" data-act="pmerge" data-v="${esc(a.key)}" data-b="${esc(b.key)}">같은 과제</button><button class="btn" data-act="pnotdup" data-v="${esc(a.key)}" data-b="${esc(b.key)}">다른 과제</button></div>`])) : '<p class="mute sm">제목·연도가 비슷한 중복 의심이 없습니다.</p>'}`,
    'NTIS·KRM·파일에 겹쳐 들어온 과제를 합칩니다. 합친 쪽은 지우지 않고 "합침" 상태로 남깁니다.')}
  ${slide('사업코드 <b>매핑표</b>', `${tbl(['통합 전·옛 사업명(포함 문자열)', '표준 사업명', '기관·시기', ''], cm.map((c, i) => [`<input class="field" value="${esc(c.from)}" data-chg="pcm" data-i="${i}" data-k="from">`, `<input class="field" value="${esc(c.to)}" data-chg="pcm" data-i="${i}" data-k="to">`, `<input class="field" value="${esc(c.org || '')}" data-chg="pcm" data-i="${i}" data-k="org" placeholder="예: 한국과학재단">`, `<button class="btn" data-act="pcmdel" data-v="${i}">삭제</button>`]))}
    <div class="chips mt"><button class="btn" data-act="pcmadd">행 추가</button><button class="btn pri" data-act="pcmapply">매핑 적용</button></div>`,
    '통합 전·후 사업명을 하나의 표준 사업명으로 맞춥니다. 사업명에 왼쪽 문자열이 들어 있으면 오른쪽 이름으로 집계합니다. 공식 대응표는 재단 연차보고서·사업 공고로 확인해 채워 주세요.')}`;
};
const orcidList = key => { const L = state.pool.orcid.list; return L ? `<ol class="rank" style="margin-top:6px">${L.map(o => `<li data-act="porcidset" data-v="${esc(key)}" data-o="${esc(o.id)}"><b></b><span>${esc(o.name)} <span class="mute">· ${esc(o.inst || '소속 미상')}</span></span><b>선택</b></li>`).join('') || '<li style="cursor:default"><b></b><span class="mute">찾은 결과 없음</span><b></b></li>'}</ol>` : '<span class="mute sm">찾는 중…</span>'; };

/* ---------- ⑤ 재단 DB 대조 ---------- */
PV.match = () => {
  const F = PL.meta.fdb, p = state.pool.fimp;
  let R = null;
  if (F) {
    const C = new Map(projs().filter(r => r.pid).map(r => [r.pid, r])), fp = new Set(F.rows.map(x => x.pid));
    const matched = F.rows.filter(x => C.has(x.pid)), missing = F.rows.filter(x => !C.has(x.pid)), extra = [...C.values()].filter(r => !fp.has(r.pid) && r.src !== 'fdb');
    const conflicts = matched.map(x => ({ x, r: C.get(x.pid) })).filter(({ x, r }) => (x.title && nm(x.title).slice(0, 20) !== nm(r.title).slice(0, 20)) || (x.pi && r.pi && nm(x.pi) !== nm(r.pi)) || (x.start && r.start && x.start !== r.start));
    R = { matched, missing, extra, conflicts };
  }
  return `
  ${slide('재단 <b>추출본 올리기</b>', `<div class="qfgrid mt"><label>재단 과제 DB 추출본 (CSV·엑셀)<input class="field" type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" data-chg="fdbfile"></label></div>
    ${p ? `<div class="tw"><table><thead><tr><th scope="col">항목</th><th scope="col">열</th></tr></thead><tbody>${['pid', 'title', 'pi', 'program', 'start', 'end'].map(f => `<tr><td><b>${PFIELDS[f]}</b>${f === 'pid' ? ' (필수)' : ''}</td><td><select class="field" data-chg="fdbmap" data-f="${f}"><option value="">(없음)</option>${p.table[0].map((h, i) => `<option value="${i}" ${p.map[f] === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
      <div class="chips mt"><button class="btn pri" data-act="fdbgo">${p.table.length - 1}행으로 대조</button><button class="btn" data-act="fdbcancel">취소</button></div>` : ''}
    ${F ? `<p class="sm mt">현재 추출본: ${esc(F.name)} · ${F.rows.length.toLocaleString()}행 · ${esc(F.at.slice(0, 10))} <button class="btn" data-act="fdbclear">지우기</button></p>` : ''}`,
    '재단 내부 과제 DB에서 뽑은 과제 목록을 올리면 과제고유번호로 수집 자료와 맞춰 봅니다. 추출본은 이 브라우저에만 저장됩니다.')}
  ${R ? `
  ${kpis([[`${Math.round(R.matched.length / Math.max(1, F.rows.length) * 100)}`, '%', `일치 (${R.matched.length.toLocaleString()} / ${F.rows.length.toLocaleString()})`], [R.missing.length.toLocaleString(), '건', '재단에만 있음 (NTIS·KRM 미수록)'], [R.extra.length.toLocaleString(), '건', '수집에만 있음'], [R.conflicts.length.toLocaleString(), '건', '항목 불일치']])}
  ${slide('미수록 <b>이력 보완</b>', R.missing.length ? `${tbl(['과제번호', '과제명', '책임자', '시작'], R.missing.slice(0, 20).map(x => [esc(x.pid), esc(x.title || '—'), esc(x.pi || '—'), x.start || '—']))}${R.missing.length > 20 ? `<p class="mute sm mt">앞 20건만 표시 · 전체 ${R.missing.length}건</p>` : ''}
      <div class="chips mt"><button class="btn pri" data-act="fdbfill">재단 자료로 ${R.missing.length}건 보완 추가</button></div>` : '<p class="mute sm mt">재단 추출본의 과제가 모두 수집돼 있습니다.</p>', '초기 연도·통합 전 기관처럼 NTIS·KRM에 없는 과제를 재단 자료로 채웁니다.')}
  ${slide('항목 <b>불일치</b>', R.conflicts.length ? tbl(['과제번호', '재단 DB', '수집 자료'], R.conflicts.slice(0, 30).map(({ x, r }) => [esc(x.pid), `${esc(x.title || '')}<br><span class="mute sm">${esc(x.pi || '')} · ${x.start || ''}</span>`, `${esc(r.title)}<br><span class="mute sm">${esc(r.pi)} · ${r.start || ''} · ${esc(r.src)}</span>`])) : '<p class="mute sm mt">불일치가 없습니다.</p>')}` : ''}`;
};

/* ---------- ⑥ 후보군 풀 ---------- */
PV.pool = () => {
  const O = projs().filter(r => r.pool === 'o'), Pp = personGroups().filter(x => x.d.cand), revO = db.data.imported.o.filter(x => x.track === 'reverse').length, revP = db.data.imported.p.filter(x => x.track === 'reverse').length;
  const by = (list, f) => DOMAINS.map(d => [d.short, list.filter(x => f(x) === d.id).length, d.color]);
  const era = (list, f) => ERAS.map((e, i) => [`${e.no} ${e.label}`, list.filter(x => { const y = f(x); return y >= e.from && y <= e.to; }).length, GC[i % 4]]);
  const bars = rows => { const mx = Math.max(1, ...rows.map(r => r[1])); return rows.map(([l, n, c]) => bar(l, n / mx * 100, n, c, '96px 1fr 40px')).join(''); };
  const cand = projs().filter(r => r.pool !== 'o' && !r.sent).sort((a, b) => outputsOf(b.pid).length - outputsOf(a.pid).length).slice(0, 15);
  return `
  ${kpis([[`${O.length + revO}`, `/ ${POOL_TARGET}`, `성과 후보군 (정방향 ${O.length} · 역방향 ${revO})`], [`${Pp.length + revP}`, `/ ${POOL_TARGET}`, `인물 후보군 (정방향 ${Pp.length} · 역방향 ${revP})`], [O.filter(r => r.sent).length + Pp.filter(x => x.d.sent).length, '건', '데이터 관리로 보낸 후보'], [projs().length.toLocaleString(), '건', '모집단 (수집 과제)']])}
  <div class="row c2">
    ${slide('성과 후보 · <b>영역·시대</b>', `${bars(by(O, r => r.domain))}<h3 class="mt" style="font-size:12.5px">시대 구간</h3>${bars(era(O, r => r.start))}`)}
    ${slide('인물 후보 · <b>영역·시대</b>', `${bars(by(Pp, x => guessDomain(x.recs[0])))}<h3 class="mt" style="font-size:12.5px">첫 과제 시기</h3>${bars(era(Pp, x => Math.min(...x.years.length ? x.years : [0])))}`)}
  </div>
  ${slide('후보로 <b>올릴 과제</b> (연결 성과 많은 순)', cand.length ? tbl(['과제', '책임자', '시작', '연결 성과', ''], cand.map(r => [esc(r.title), esc(r.pi || '—'), r.start || '—', outputsOf(r.pid).length, `<div class="chips" style="gap:4px"><button class="btn" data-act="pmark" data-v="${esc(r.key)}">성과 후보</button>${r.pi ? `<button class="btn" data-act="ppcand" data-v="${esc(nm(r.pi))}">인물 후보</button>` : ''}</div>`])) : '<p class="mute sm mt">올릴 과제가 없습니다. ②③ 수집에서 과제를 모으세요.</p>', '정방향 스크리닝 모집단에서 후보를 고릅니다. 수집 자료 목록에서 과제를 열어 표시할 수도 있습니다.')}
  ${slide('후보군 <b>확정</b>', `<p class="sm mt">표시한 성과 후보 ${O.filter(r => !r.sent).length}건, 인물 후보 ${Pp.filter(x => !x.d.sent).length}명을 연구 관리 → 데이터 관리로 보냅니다. 보낸 뒤에는 성과관·인물관·분석 화면에 바로 나타납니다.</p>
    <div class="chips mt"><select class="field" id="pooldom" style="flex:0 1 200px"><option value="">지원 영역: 자동 추정</option>${DOMAINS.map(d => `<option value="${d.id}">${d.label}</option>`).join('')}</select><button class="btn pri" data-act="poolsend">후보군 확정 · 보내기</button></div>
    <h3 class="mt2" style="font-size:13px">사례집·웹플랫폼용 출처 문구</h3><div class="story sm" id="poolcite">${esc(cite([...O, ...Pp.flatMap(x => x.recs)].map(r => r.src)) || '아직 후보가 없습니다.')}</div><div class="chips mt"><button class="btn" data-act="pcitecopy">출처 문구 복사</button></div>`)}`;
};

/* ---------- 수집 로그·출처 ---------- */
PV.log = () => {
  const due = PL.meta.plans.filter(p => { const L = PL.log.find(l => l.plan === p.id); return !L || Date.now() - new Date(L.at) > 30 * 864e5; });
  return `
  ${due.length ? slide('월간 <b>갱신 필요</b>', `<p class="sm mt">${due.map(p => esc(p.name)).join(', ')} 계획을 30일 넘게 다시 수집하지 않았습니다.</p><div class="chips mt">${due.map(p => Object.keys(COLLECTORS).slice(0, 2).map(s => `<button class="btn" data-act="plrun" data-v="${p.id}" data-src="${s}" ${state.pool.job ? 'disabled' : ''}>${esc(p.name)} · ${COLLECTORS[s].name} 다시 수집</button>`).join('')).join('')}</div><p class="mute sm mt">다시 수집하면 새로 등록된 과제만 "새로 n건"으로 기록됩니다.</p>`) : ''}
  ${slide('수집 <b>로그</b>', PL.log.length ? tbl(['일시', '계획', '자료원', '검색식', '받은 건수', '새로', '비고'], PL.log.slice(0, 100).map(l => [esc(l.at.replace('T', ' ').slice(0, 16)), esc(l.planName || '—'), esc(l.src), `<span class="sm">${esc(l.query || '')}</span>`, l.count ?? '—', l.added ?? '—', l.err ? `<span class="warn sm">${esc(l.err)}</span>` : ''])) + '<div class="chips mt"><button class="btn" data-act="plogcsv">로그 CSV</button></div>' : '<p class="mute sm mt">아직 수집 기록이 없습니다.</p>', '수집 일자·검색식·건수를 남겨 같은 조건으로 다시 수집할 수 있게 합니다.')}
  ${slide('자료원 <b>이용조건</b>', tbl(['자료원', '표기 이름', '이용조건'], Object.keys(LIC0).map(k => [esc(k), `<input class="field" value="${esc(lic(k).name)}" data-chg="plic" data-k="${k}" data-f="name">`, `<input class="field" value="${esc(lic(k).terms)}" data-chg="plic" data-k="${k}" data-f="terms" style="min-width:320px">`])),
    '자료원별 이용조건을 레코드에 붙여, 상세 화면과 후보군 확정 때 출처 문구를 자동으로 만듭니다. 기본값은 일반적인 예시이므로 각 기관의 실제 이용약관을 확인해 고쳐 주세요.')}
  ${slide('저장 <b>상태</b>', `<p class="sm mt">이 브라우저(IndexedDB)에 레코드 ${PL.rec.size.toLocaleString()}건, 로그 ${PL.log.length}건이 있습니다. 다른 연구진과는 수집 자료 화면의 "모집단 꾸러미 내보내기·불러오기"로 주고받습니다.</p><div class="chips mt"><button class="btn" data-act="pwipe">모집단 자료 모두 지우기</button></div>`)}`;
};

R.pool = () => {
  if (!PL.loaded) { poolLoad(); return '<p class="mute">모집단 자료를 불러오는 중…</p>'; }
  return `<div class="chips subtabs">${POOL_SUBS.map(([v, l]) => `<button class="chip ${state.psub === v ? 'on' : ''}" data-act="nav" data-v="pool:${v}">${l}</button>`).join('')}</div>${PV[state.psub]()}`;
};

/* ---------- 동작 ---------- */
const readTable = async f => /\.xlsx?$/i.test(f.name) ? (X => { /* 엑셀 */ return X; })(await (async () => { const X = await loadXLSX(), wb = X.read(await f.arrayBuffer()); return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }).filter(r => r.some(c => String(c).trim())); })()) : parseCSV(decodeText(await f.arrayBuffer()));
const guessCols = (head, fields) => { const m = {}; for (const f of fields) { const i = head.findIndex(h => PGUESS[f]?.test(String(h).replace(/\s/g, ''))); if (i >= 0) m[f] = i; } return m; };
Object.assign(ACT, {
  pledit: v => { state.pool.edit = v || null; render(); },
  plsave: () => {
    const g = k => $(`[data-pf="${k}"]`)?.value ?? '', lines = s => s.split('\n').map(x => impClean(x)).filter(Boolean), id = state.pool.edit === 'new' ? `P${Date.now().toString(36)}` : state.pool.edit;
    const p = { id, name: impClean(g('name')) || '이름 없는 계획', from: Math.max(1960, +g('from') || 1977), to: Math.min(2030, +g('to') || 2026), maxPages: Math.max(1, Math.min(50, +g('maxPages') || 3)), fields: impClean(g('fields')), programs: lines(g('programs')).slice(0, 300), keywords: lines(g('keywords')).slice(0, 100), note: impClean(g('note')) };
    PL.meta.plans = [...PL.meta.plans.filter(x => x.id !== id), p]; metaSave('plans'); state.pool.edit = null; render(); toast('계획을 저장했습니다.');
  },
  pldel: v => { if (!confirm('이 계획을 지울까요? 수집한 자료는 남습니다.')) return; PL.meta.plans = PL.meta.plans.filter(x => x.id !== v); metaSave('plans'); render(); },
  plrun: (v, t) => collect(v, t.dataset.src),
  pmap: v => { state.pool.mapSrc = v || null; render(); },
  pmapset: (v, t) => { const m = (PL.meta.maps[t.dataset.src] ||= {}); if (v) m[t.dataset.f] = v; else delete m[t.dataset.f]; },
  pmapsave: async v => {
    metaSave('maps'); const map = PL.meta.maps[v], re = pRecs().filter(r => r.src === v && r.raw?.length);
    const out = re.map(r => { const n = makeRec(v, r.kind, mapRow(r.raw, map), r.raw, { plan: r.plan, otype: r.otype }); return { ...n, key: r.key, status: r.status, pool: r.pool, ai: r.ai, note: r.note, sent: r.sent, at: r.at }; });
    out.forEach(r => PL.rec.set(r.key, r)); await idb.put('rec', out); state.pool.mapSrc = null; render(); toast(`${out.length}건을 다시 계산했습니다.`);
  },
  pfile: async (_, el) => { const f = el.files[0]; if (!f) return; try { const table = await readTable(f), kind = $('#pfkind').value; state.pool.imp = { name: impClean($('#pfname').value) || f.name, kind, otype: $('#pfotype').value, table, map: guessCols(table[0] || [], Object.keys(PFIELDS)) }; render(); } catch (e) { toast('파일을 읽지 못했습니다. CSV로 저장해 다시 올려 주세요.'); } },
  pfmap: (v, t) => { const m = state.pool.imp.map; if (v === '') delete m[t.dataset.f]; else m[t.dataset.f] = +v; render(); },
  pfcancel: () => { state.pool.imp = null; render(); },
  pfgo: async () => {
    const p = state.pool.imp, src = `file:${p.name}`.slice(0, 60), head = p.table[0];
    const recs = p.table.slice(1).map(row => { const f = {}; for (const [k, i] of Object.entries(p.map)) f[k] = row[i]; const pairs = head.map((h, i) => [String(h), row[i]]).filter(x => String(x[1] ?? '').trim()); return makeRec(src, p.kind, f, pairs, p.kind === 'output' ? { otype: p.otype } : {}); }).filter(r => r.title !== '(제목 없음)' || r.pid);
    const added = await upsert(recs); await addLog({ src: src, query: `파일 ${p.name} (${p.kind === 'output' ? OTYPES[p.otype] : '과제'})`, count: recs.length, added });
    state.pool.imp = null; render(); toast(`${recs.length}행 중 새로 ${added}건을 넣었습니다.`);
  },
  pq: v => { state.pool.q = v; state.pool.pg = 0; render(); },
  psrc: v => { state.pool.src = v; state.pool.pg = 0; render(); },
  pkind: v => { state.pool.kind = v; state.pool.pg = 0; render(); },
  ppg: v => { state.pool.pg = +v; render(); },
  popen: v => { state.pool.open = v || null; render(); if (v) setTimeout(() => $('#precdetail')?.scrollIntoView({ block: 'start' }), 30); },
  pmark: async v => { const r = PL.rec.get(v); r.pool = r.pool === 'o' ? null : 'o'; await idb.put('rec', r); render(); },
  pexclude: async v => { const r = PL.rec.get(v); r.status = 'excluded'; await idb.put('rec', r); state.pool.open = null; render(); toast('제외했습니다. 자료는 남아 있습니다.'); },
  pai: async v => {
    const r = PL.rec.get(v), text = $('#paitext').value.trim(); if (!text) return toast('결과보고서 본문을 붙여넣으세요.');
    toast('AI로 구조화하는 중…');
    try {
      const res = await fetch('/ai/extract', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, title: r.title }) });
      const body = await res.text(); let j = null; try { j = JSON.parse(body); } catch (e) { /* 글 응답 */ }
      if (!res.ok || !j?.ok) return toast(j?.error || body.slice(0, 120) || `오류 ${res.status}`);
      const clean = a => [].concat(a || []).map(x => impClean(x)).filter(Boolean).slice(0, 20);
      r.ai = { topic: impClean(j.data.topic), methods: clean(j.data.methods), outcomes: clean(j.data.outcomes), followups: clean(j.data.followups), keywords: clean(j.data.keywords), verified: false, model: j.model, at: new Date().toISOString() };
      await idb.put('rec', r); render(); toast('구조화했습니다. 원문과 대조해 확인해 주세요.');
    } catch (e) { toast('서버에 연결하지 못했습니다 (npm start로 실행한 주소에서만 됩니다).'); }
  },
  paiok: async (v, t) => { const r = PL.rec.get(t.dataset.v); r.ai.verified = t.checked; await idb.put('rec', r); },
  pperson: (v, t) => { const d = (PL.meta.persons[v] ||= {}); d.mode = d.mode === t.dataset.m ? null : t.dataset.m; metaSave('persons'); render(); },
  ppcand: v => { const d = (PL.meta.persons[v] ||= {}); d.cand = !d.cand; metaSave('persons'); render(); toast(d.cand ? '인물 후보로 표시했습니다.' : '인물 후보에서 뺐습니다.'); },
  porcid: async v => {
    const g = personGroups().find(x => x.key === v); state.pool.orcid = { key: v, list: null }; render();
    const parts = g.name.trim().split(/\s+/), q = parts.length > 1 ? `family-name:${parts[parts.length - 1]} AND given-names:${parts.slice(0, -1).join(' ')}` : g.name;
    try { const d = await (await fetch(`https://pub.orcid.org/v3.0/expanded-search/?q=${enc(q)}&rows=8`, { headers: { Accept: 'application/json' } })).json(); state.pool.orcid.list = (d['expanded-result'] || []).map(o => ({ id: o['orcid-id'], name: o['credit-name'] || `${o['given-names'] || ''} ${o['family-names'] || ''}`.trim(), inst: (o['institution-name'] || []).slice(0, 2).join(', ') })); }
    catch (e) { state.pool.orcid.list = []; toast('ORCID에 연결하지 못했습니다.'); }
    render();
  },
  porcidset: (v, t) => { const d = (PL.meta.persons[v] ||= {}); d.orcid = t.dataset.o; metaSave('persons'); state.pool.orcid = null; render(); },
  pdedupe: async () => {
    const out = [];
    for (const v of dupPairs().exact) { const [keep, ...rest] = v.sort((a, b) => (a.src === 'ntis' ? -1 : 0) - (b.src === 'ntis' ? -1 : 0)); for (const r of rest) { r.status = 'merged'; r.mergedInto = keep.key; if (r.pool === 'o') keep.pool = 'o'; out.push(r); } out.push(keep); }
    await idb.put('rec', out); render(); toast('과제번호가 같은 과제를 합쳤습니다.');
  },
  pmerge: async (v, t) => { const a = PL.rec.get(v), b = PL.rec.get(t.dataset.b); b.status = 'merged'; b.mergedInto = a.key; if (!a.pid && b.pid) a.pid = b.pid; if (b.pool === 'o') a.pool = 'o'; await idb.put('rec', [a, b]); render(); },
  pnotdup: (v, t) => { PL.meta.notdup.push([v, t.dataset.b].sort().join('|')); metaSave('notdup'); render(); },
  pcm: (v, t) => { PL.meta.codemap[+t.dataset.i][t.dataset.k] = impClean(v); metaSave('codemap'); },
  pcmadd: () => { PL.meta.codemap.push({ from: '', to: '', org: '' }); metaSave('codemap'); render(); },
  pcmdel: v => { PL.meta.codemap.splice(+v, 1); metaSave('codemap'); render(); },
  pcmapply: async () => { const out = pRecs().map(r => ({ ...r, programStd: progStd(r.program) })); out.forEach(r => PL.rec.set(r.key, r)); await idb.put('rec', out); render(); toast('매핑을 적용했습니다.'); },
  fdbfile: async (_, el) => { const f = el.files[0]; if (!f) return; try { const table = await readTable(f); state.pool.fimp = { name: f.name, table, map: guessCols(table[0] || [], ['pid', 'title', 'pi', 'program', 'start', 'end']) }; render(); } catch (e) { toast('파일을 읽지 못했습니다.'); } },
  fdbmap: (v, t) => { const m = state.pool.fimp.map; if (v === '') delete m[t.dataset.f]; else m[t.dataset.f] = +v; render(); },
  fdbcancel: () => { state.pool.fimp = null; render(); },
  fdbgo: () => {
    const p = state.pool.fimp; if (p.map.pid === undefined) return toast('과제고유번호 열을 골라 주세요.');
    const g = (row, f) => p.map[f] === undefined ? '' : impClean(row[p.map[f]]);
    PL.meta.fdb = { name: p.name, at: new Date().toISOString(), rows: p.table.slice(1).map(row => ({ pid: g(row, 'pid').replace(/\s/g, ''), title: g(row, 'title'), pi: g(row, 'pi'), program: g(row, 'program'), start: yr(g(row, 'start')), end: yr(g(row, 'end')) })).filter(x => x.pid) };
    metaSave('fdb'); state.pool.fimp = null; render();
  },
  fdbclear: () => { PL.meta.fdb = null; metaSave('fdb'); render(); },
  fdbfill: async () => {
    const C = new Set(projs().map(r => r.pid)), miss = PL.meta.fdb.rows.filter(x => !C.has(x.pid));
    const recs = miss.map(x => makeRec('fdb', 'project', { ...x, start: String(x.start || ''), end: String(x.end || '') }, Object.entries(x).map(([k, v]) => [k, String(v ?? '')])));
    const added = await upsert(recs); await addLog({ src: 'fdb', query: `재단 추출본 ${PL.meta.fdb.name} 미수록 보완`, count: recs.length, added }); render(); toast(`재단 자료로 ${added}건을 보완했습니다.`);
  },
  poolsend: async () => {
    const dsel = $('#pooldom')?.value || '', O = projs().filter(r => r.pool === 'o' && !r.sent), P = personGroups().filter(x => x.d.cand && !x.d.sent);
    if (!O.length && !P.length) return toast('보낼 후보가 없습니다.');
    db.data.imported.o.push(...O.map(r => ({ title: impClean(r.title), domain: dsel || r.domain, guide: 'G1', ctype: CTYPES[1], grade: 1, y0: Math.max(1977, Math.min(2026, r.start || r.year || 1977)), y1: r.end && r.end > (r.start || 0) ? Math.min(2026, r.end) : null, y2: null, y3: null, y4: null,
      s0: null, s1: null, s2: null, s3: null, invest: r.budget ? Math.max(1, Math.round(r.budget / 1e8)) : null, links: [], region: '수도권', p0: impClean(r.programStd || r.program || ''), p1: '', track: 'forward' })));
    db.data.imported.p.push(...P.map(x => { const ys = x.years.length ? x.years : [1977]; return { name: impClean(x.name), field: impClean(x.recs.find(r => r.field)?.field || '미분류'), domain: dsel || guessDomain(x.recs[0]), guide: 'P1', grade: 1, y0: Math.max(1977, Math.min(...ys)), y1: null, y2: null, y3: null, y4: null,
      grants: x.recs.length, years: Math.max(...ys) - Math.min(...ys) + 1, alumni: 0, papers: x.recs.reduce((a, r) => a + outputsOf(r.pid).filter(o => o.otype === 'paper').length, 0), patents: x.recs.reduce((a, r) => a + outputsOf(r.pid).filter(o => o.otype === 'patent').length, 0), awards: 0, coauthors: 0, invest: null, s0: null, s1: null, s2: null, s3: null, track: 'forward', consent: false, links: [] }; }));
    db.save('imported'); applyImported();
    for (const r of O) r.sent = true; await idb.put('rec', O); for (const x of P) x.d.sent = true; metaSave('persons');
    render(); toast(`성과 후보 ${O.length}건, 인물 후보 ${P.length}명을 데이터 관리로 보냈습니다.`);
  },
  pcitecopy: async () => { try { await navigator.clipboard.writeText($('#poolcite').textContent); toast('출처 문구를 복사했습니다.'); } catch (e) { toast('복사하지 못했습니다.'); } },
  plic: (v, t) => { (PL.meta.lic[t.dataset.k] ||= {})[t.dataset.f] = impClean(v); metaSave('lic'); },
  plogcsv: () => { const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`; download('수집로그.csv', new Blob(['﻿' + [['일시', '계획', '자료원', '검색식', '받은 건수', '새로', '오류'], ...PL.log.map(l => [l.at, l.planName, l.src, l.query, l.count, l.added, l.err])].map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' })); },
  pcsv: () => { const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`; download('모집단_수집자료.csv', new Blob(['﻿' + [['자료원', '종류', '과제고유번호', '과제·성과명', '사업명', '표준 사업명', '연구책임자', '연구자번호', '수행기관', '시작', '종료', '연구비', '성과 유형', '상태', '후보', '출처', '이용조건'], ...recList().map(r => [r.src, r.kind, r.pid, r.title, r.program, r.programStd, r.pi, r.piId, r.agency, r.start, r.end, r.budget, OTYPES[r.otype] || '', r.status, r.pool || '', lic(r.src).name, lic(r.src).terms])].map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' })); },
  pexport: () => download(`모집단_꾸러미_${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify({ kind: 'nrf50-pool', v: 1, rec: pRecs(), log: PL.log, meta: PL.meta })], { type: 'application/json' })),
  pimport: async (_, el) => {
    try {
      const d = JSON.parse(await el.files[0].text()); if (d.kind !== 'nrf50-pool') throw new Error();
      if (!confirm(`레코드 ${d.rec.length}건을 합칠까요? 같은 키는 꾸러미 쪽으로 바뀝니다.`)) return;
      for (const r of d.rec) PL.rec.set(r.key, r); await idb.put('rec', d.rec);
      const seen = new Set(PL.log.map(l => l.id)), nl = d.log.filter(l => !seen.has(l.id)); PL.log = [...PL.log, ...nl].sort((a, b) => b.at.localeCompare(a.at)); await idb.put('log', nl);
      for (const k of ['plans', 'codemap', 'lic', 'maps', 'persons']) if (d.meta?.[k] && !(Array.isArray(PL.meta[k]) ? PL.meta[k].length : Object.keys(PL.meta[k]).length)) { PL.meta[k] = d.meta[k]; metaSave(k); }
      render(); toast('꾸러미를 합쳤습니다.');
    } catch (e) { toast('모집단 꾸러미 파일이 아닙니다.'); }
  },
  pwipe: async () => { if (!confirm('이 브라우저의 모집단 자료(레코드·로그·계획)를 모두 지울까요? 되돌릴 수 없습니다.')) return; await Promise.all([idb.clear('rec'), idb.clear('log'), idb.clear('meta')]); PL.rec = new Map(); PL.log = []; PL.meta = { plans: [], codemap: [], lic: {}, maps: {}, persons: {}, notdup: [], fdb: null }; render(); toast('지웠습니다.'); },
});
