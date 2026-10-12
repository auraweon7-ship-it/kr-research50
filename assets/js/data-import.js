/* 실데이터 가져오기: CSV·엑셀 행을 성과·연구자 후보로 바꿔 예시 데이터 옆에 추가한다.
   가져온 행은 정규화한 형태로 저장소에 두고, 화면을 열 때마다 후보 객체로 다시 만든다. */
const IMP_COLS = {
  o: [['title', '성과명', 1], ['domain', '지원영역', 1], ['guide', '발굴유형'], ['ctype', '기여유형'], ['grade', '기여강도'], ['y0', '첫지원연도', 1], ['y1', '후속연구연도'], ['y2', '축적연도'], ['y3', '활용연도'],
    ['p0', '지원사업1'], ['p1', '지원사업2'], ['invest', '실질투입_억'], ['region', '확산권역'], ['s0', '성과수준'], ['s1', '파급지속성'], ['s2', '지원연계'], ['s3', '국민체감'], ['track', '발굴트랙'], ['links', '연계연구자ID']],
  p: [['name', '연구자명'], ['field', '분야', 1], ['domain', '지원영역', 1], ['guide', '발굴유형'], ['grade', '기여강도'], ['y0', '첫지원연도', 1], ['y1', '신진연도'], ['y2', '중견연도'], ['y3', '리더연도'], ['y4', '석학연도'],
    ['grants', '지원과제수'], ['years', '누적지원기간'], ['alumni', '배출인력'], ['papers', '논문저서수'], ['patents', '특허기술이전수'], ['awards', '수상횟수'], ['coauthors', '공동연구자수'], ['invest', '실질투입_억'],
    ['s0', '성과수준'], ['s1', '파급지속성'], ['s2', '지원연계'], ['s3', '국민체감'], ['track', '발굴트랙'], ['consent', '공개동의'], ['links', '연계성과ID']],
};
const IMP_SAMPLE = {
  o: ['예시 성과명', 'R&D', '세계적 연구성과', '핵심기반 기여', '핵심 기여', 1998, 2004, 2009, 2015, '신진연구', '중견연구', 35, '충청권', 88, 80, 85, 75, '양 트랙 일치', ''],
  p: ['홍길동', '소재화학', 'R&D', '세계적 연구역량·권위', '핵심 기여', 1995, 2000, 2007, 2014, '', 12, 24, 60, 180, 14, 5, 40, 30, 90, 82, 88, 70, '양 트랙 일치', 'Y', ''],
};
const impNorm = s => String(s ?? '').replace(/[\s_()·\-/]/g, '').toLowerCase();
// 가져온 글자는 화면 여러 곳에 그대로 들어가므로 태그 문자를 걸러낸다
const impClean = v => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, 200);
const impNum = v => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : null; };
const IMP_LOOK = {
  domain: v => { const s = impNorm(v); return DOMAINS.find(d => s === d.id || s === impNorm(d.short) || s === impNorm(d.label))?.id || (/인문|사회|학술/.test(s) ? 'hs' : /인재|대학|역량/.test(s) ? 'hr' : /국제|협력/.test(s) ? 'ic' : /r&d|rd|기초|원천|전략|이공/.test(s) ? 'rd' : null); },
  guide: (v, k) => { const G0 = k === 'o' ? O_GUIDE : P_GUIDE, s = impNorm(v), code = String(v ?? '').trim().toUpperCase(); return G0[code] ? code : Object.keys(G0).find(g => s && (impNorm(G0[g]).includes(s) || s.includes(impNorm(G0[g]).slice(0, 5)))) || Object.keys(G0)[0]; },
  ctype: v => { const s = impNorm(v); return CTYPES.find(c => s && (impNorm(c).includes(s) || s.includes(impNorm(c).slice(0, 3)))) || CTYPES['abcd'.indexOf(s[0])] || CTYPES[1]; },
  grade: v => { const s = impNorm(v), i = ['결정', '핵심', '보완', '간접'].findIndex(x => s.includes(x)); return i >= 0 ? i : 1; },
  track: v => { const s = impNorm(v); return /양|both|일치/.test(s) ? 'both' : /역|reverse/.test(s) ? 'reverse' : 'forward'; },
  region: v => { const s = impNorm(v); return REGIONS.find(r => s && s.includes(r.id.slice(0, 2)))?.id || '수도권'; },
  consent: v => /^(y|yes|예|동의|true|1|o)$/i.test(String(v ?? '').trim()),
};

// 쉼표·탭 구분 텍스트를 행 배열로. 따옴표 안의 구분자와 줄바꿈을 지킨다
const parseCSV = text => {
  text = text.replace(/^﻿/, '');
  const first = text.slice(0, text.indexOf('\n') < 0 ? text.length : text.indexOf('\n')), dl = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === dl) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim())) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some(x => x.trim())) rows.push(row);
  return rows;
};
// 엑셀에서 저장한 CSV는 CP949인 경우가 많아 UTF-8 해석이 깨지면 EUC-KR로 다시 읽는다
const decodeText = buf => { try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('euc-kr').decode(buf); } };
const loadXLSX = () => loadXLSX.p ||= new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = rej; document.head.appendChild(s); });

// 행 배열(첫 줄은 머리글)을 검사해 정규화한 행과 오류 목록으로 만든다
const impRead = (k, table) => {
  const cols = IMP_COLS[k], head = (table[0] || []).map(impNorm), map = {}, unknown = [];
  head.forEach((h, i) => { const c = cols.find(([key, label]) => h === impNorm(label) || h === key); if (c) map[c[0]] = i; else if (h) unknown.push(table[0][i]); });
  const missing = cols.filter(c => c[2] && map[c[0]] === undefined).map(c => c[1]), rows = [], errors = [];
  if (missing.length) return { kind: k, rows, errors: [`필수 열이 없습니다: ${missing.join(', ')}`], unknown, matched: Object.keys(map).length };
  table.slice(1).forEach((r, ri) => {
    const g = key => map[key] === undefined ? '' : r[map[key]], n = {}, line = ri + 2;
    n.domain = IMP_LOOK.domain(g('domain')); n.y0 = impNum(g('y0'));
    if (k === 'o') { n.title = impClean(g('title')); if (!n.title) return errors.push(`${line}행: 성과명이 비어 있습니다`); }
    else { n.field = impClean(g('field')); n.name = impClean(g('name')); if (!n.field) return errors.push(`${line}행: 분야가 비어 있습니다`); }
    if (!n.domain) return errors.push(`${line}행: 지원영역 "${impClean(g('domain'))}"을(를) 알 수 없습니다 (R&D·인문사회·인재양성·국제협력)`);
    if (!n.y0 || n.y0 < 1977 || n.y0 > 2026) return errors.push(`${line}행: 첫지원연도는 1977~2026 사이여야 합니다`);
    n.y0 = Math.round(n.y0); n.guide = IMP_LOOK.guide(g('guide'), k); n.grade = IMP_LOOK.grade(g('grade')); n.track = IMP_LOOK.track(g('track'));
    for (const y of ['y1', 'y2', 'y3', 'y4']) { const v = impNum(g(y)); n[y] = v && v >= n.y0 && v <= 2026 ? Math.round(v) : null; }
    for (const s of ['s0', 's1', 's2', 's3']) { const v = impNum(g(s)); n[s] = v === null ? null : Math.max(0, Math.min(100, Math.round(v))); }
    n.invest = Math.max(1, impNum(g('invest')) || 0) || null; n.links = impClean(g('links')).split(/[;,\s]+/).filter(x => /^[OR]-\d+$/.test(x));
    if (k === 'o') { n.ctype = IMP_LOOK.ctype(g('ctype')); n.region = IMP_LOOK.region(g('region')); n.p0 = impClean(g('p0')); n.p1 = impClean(g('p1')); }
    else { for (const f of ['grants', 'years', 'alumni', 'papers', 'patents', 'awards', 'coauthors']) n[f] = Math.max(0, Math.round(impNum(g(f)) || 0)); n.consent = IMP_LOOK.consent(g('consent')); }
    rows.push(n);
  });
  return { kind: k, rows, errors, unknown, matched: Object.keys(map).length };
};

const impOutcome = (n, i) => {
  const r = rng(i * 37 + 501), cap = y => Math.min(2026, y), y1 = n.y1 || cap(n.y0 + 5), y2 = n.y2 || cap(y1 + 4), y3 = n.y3 || cap(y2 + 5);
  return { id: `O-${501 + i}`, kind: 'o', imported: true, title: n.title, domain: n.domain, guide: n.guide, ctype: n.ctype, y0: n.y0, era: eraOf(n.y0).id,
    scores: [n.s0, n.s1, n.s2, n.s3].map(v => v ?? 70), track: n.track, region: n.region,
    path: [{ year: n.y0, program: n.p0 || '지원 사업 미입력', desc: '초기 과제 지원으로 핵심 원리·개념 확보' }, { year: y1, program: n.p1 || n.p0 || '지원 사업 미입력', desc: '후속 과제로 실증·고도화, 연구집단 형성' },
      { year: y2, program: '지식재산·표준·DB', desc: '특허·표준·학설·DB로 기술·지식 축적' }, { year: y3, program: '활용·확산', desc: USE_DESC[n.guide] }],
    mix: [0, 1, 2, 3].map(s => mix(r, s, n.domain)), grade: n.grade, invest: n.invest || 10, alts: [], sub: '', ev: 0, people: [], stage0: 0 };
};
const impPerson = (n, i) => {
  const id = `R-${501 + i}`, ys = [n.y0, n.y1, n.y2, n.y3, n.y4];
  const life = ys.map((y, k) => y ? { stage: LIFE[k], year: y, program: LIFE_PROG[n.domain][k], out: LIFE_OUT[k] } : null).filter(Boolean);
  const p = { id, kind: 'p', imported: true, name: n.name, field: n.field, domain: n.domain, guide: n.guide, y0: n.y0, era: eraOf(n.y0).id, scores: [n.s0, n.s1, n.s2, n.s3].map(v => v ?? 70), grade: n.grade, invest: n.invest || 10,
    track: n.track, life, grants: n.grants, years: n.years || 2026 - n.y0, alumni: n.alumni, papers: n.papers, patents: n.patents, awards: n.awards, startup: false, policy: 0, coauthors: n.coauthors,
    turn: Math.min(1, life.length - 1), gap: 0, consent: n.consent, ev: 0, outcomes: [], stage0: 0 };
  // 실명은 공개 동의가 있거나 연구용 화면일 때만 보인다
  Object.defineProperty(p, 'title', { get() { return this.name && (this.consent || staff()) ? this.name : `연구자 ${this.id}`; }, enumerable: true });
  return p;
};
// 저장소의 가져온 행으로 후보 배열을 다시 맞춘다. 예시 데이터는 건드리지 않는다
const applyImported = () => {
  for (const arr of [OUTCOMES, PEOPLE]) for (let i = arr.length - 1; i >= 0; i--) if (arr[i].imported) arr.splice(i, 1);
  OUTCOMES.forEach(o => { o.people = o.people.filter(id => +id.slice(2) < 500); }); PEOPLE.forEach(p => { p.outcomes = p.outcomes.filter(id => +id.slice(2) < 500); });
  const im = db.data.imported, os = im.o.map(impOutcome), ps = im.p.map(impPerson);
  OUTCOMES.push(...os); PEOPLE.push(...ps);
  const link = (o, p) => { if (o && p) { if (!o.people.includes(p.id)) o.people.push(p.id); if (!p.outcomes.includes(o.id)) p.outcomes.push(o.id); } };
  im.o.forEach((n, i) => n.links.forEach(id => link(os[i], PEOPLE.find(x => x.id === id))));
  im.p.forEach((n, i) => n.links.forEach(id => link(OUTCOMES.find(x => x.id === id), ps[i])));
  if (typeof gx !== 'undefined') gx.all = null;
  if (typeof gc !== 'undefined') gc.top = null;
};
const impTemplate = k => download(`가져오기_양식_${k === 'o' ? '대표성과' : '대표연구자'}.csv`, new Blob(['﻿' + [IMP_COLS[k].map(c => c[1]), IMP_SAMPLE[k]].map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv' }));
