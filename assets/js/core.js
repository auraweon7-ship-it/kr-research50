/* 공통 상태·계산·화면 조각. 모든 화면 파일보다 먼저 불러온다 */
const TARGET = 50;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const state = {
  view: 'goal', sub: 'plan', asub: 'data', open: null, pick: {}, region: '수도권', kind: 'o', era: 'e5', scope: 'all', rankBy: 'roi',
  // 공개용은 국민에게 보이는 화면만, 연구용은 발굴 기준·점수·관리 도구까지. 배포 주소에서는 공개용이 기본이다
  mode: LS.get('nrf50.mode', /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'staff' : 'public'), lang: LS.get('nrf50.lang', 'ko'),
  cmp: [], sens: { amp: 20, by: 'score', top: 20 }, imp: null,
  admin: (() => { try { return sessionStorage.getItem('nrf50.admin') === '1'; } catch (e) { return false; } })(),
  w: { o: [25, 25, 25, 25], p: [25, 25, 25, 25] },
  status: db.data.status,
  f: { o: { q: '', domain: '', guide: '', ctype: '', era: '', track: '', stage: '', sort: 'score' }, p: { q: '', domain: '', guide: '', era: '', track: '', stage: '', sort: 'score' } },
};
const LIST = { o: OUTCOMES, p: PEOPLE };
const KIND = { o: '성과', p: '연구자' };
const byId = id => (id[0] === 'O' ? OUTCOMES : PEOPLE).find(x => x.id === id);
const dom = id => DOMAINS.find(d => d.id === id);
const stageOf = it => db.data.status[it.id] ?? it.stage0;
const staff = () => state.mode === 'staff';
// 관리자 모드는 로그인한 탭에서만 유지한다(탭을 닫으면 풀린다)
const isAdmin = () => state.admin;
// 근거를 등록한 후보는 등록 건수로, 아니면 예시 건수로 판정한다
const evOf = it => db.data.evidence[it.id] ? db.data.evidence[it.id].length : it.ev;
const ACT = {};
const toast = msg => { const el = $('#toast'); if (!el) return; el.textContent = msg; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); };
const download = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const score = it => {
  const w = state.w[it.kind], s = w.reduce((a, b) => a + b, 0) || 1;
  return Math.round(it.scores.reduce((a, v, i) => a + v * w[i], 0) / s);
};
// 투자 대비 성과 지수(안) = 표준화 성과 점수 × 기여 계수 ÷ 실질 투입 지수(로그 척도)
const roi = it => score(it) * GRADES[it.grade].coef / (1 + Math.log10(it.invest));
const rankVal = it => state.rankBy === 'roi' ? roi(it) : score(it);
const count = (kind, fn) => LIST[kind].filter(fn).length;
const selected = kind => LIST[kind].filter(it => stageOf(it) === 3);
const G = ['g-pink', 'g-orange', 'g-teal', 'g-blue'];
const GC = ['#EC5C8D', '#F6A53A', '#27B894', '#3D9FE6'];
const arrow = '<svg class="flow-arrow" viewBox="0 0 34 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 14c8-10 18-10 28-4"/><path d="M24 4l6 6-8 3"/></svg>';
const dots = '<div class="dots sm"><i></i><i></i><i></i></div>';
const foot = t => `<div class="foot"><span>대한민국 연구 50년 · ${t}</span><span>연구계획서 기반 · 후보 데이터는 예시</span></div>`;
const pill = it => `<span class="pill st${stageOf(it)}">${STAGES[stageOf(it)]}</span>`;
const trackDots = it => `<span class="track"><i class="${it.track !== 'reverse' ? 'f' : ''}"></i><i class="${it.track !== 'forward' ? 'r' : ''}"></i>${TRACKS[it.track]}</span>`;
const stack = m => `<div class="stack">${m.map((v, i) => `<span style="flex:${v};background:${FACTORS[i].color}">${v >= 9 ? v + '%' : ''}</span>`).join('')}</div>`;
const legend = arr => `<div class="legend">${arr.map(a => `<span><i style="background:${a.color}"></i>${a.label}</span>`).join('')}</div>`;
const avgMix = (list, st) => FACTORS.map((_, i) => list.length ? Math.round(list.reduce((a, o) => a + o.mix[st][i], 0) / list.length) : 0);

/* ---------- 공통 조각 ---------- */
const sub = (n, t, p) => `<div class="subhead" id="s${n}"><span class="blob ${G[(n - 1) % 4]} b${n % 3 + 1}">${n}</span><div><h2>${t}</h2><p class="mute sm">${p}</p></div></div>`;
const jump = items => `<div class="chips jump">${items.map((l, i) => `<button class="chip" data-act="jump" data-v="s${i + 1}">${i + 1}. ${l}</button>`).join('')}</div>`;
const slide = (title, body, lead = '') => `<section class="slide"><h2>${title}</h2>${dots}${lead ? `<p class="lead">${lead}</p>` : ''}${body}</section>`;
const tbl = (head, rows) => `<div class="tw"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i ? c : `<b>${c}</b>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const ul = a => `<ul class="bul">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
const tiles = (items, cols = 3) => `<div class="row c${cols}">${items.map(([b, h, p, v], i) => `<${v ? `button data-act="nav" data-v="${v}"` : 'div'} class="tile" style="text-align:left"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${b}</div><h3>${h}</h3>${Array.isArray(p) ? ul(p) : `<p class="mute sm" style="margin-top:6px">${p}</p>`}</${v ? 'button' : 'div'}>`).join('')}</div>`;
// items: [제목, 설명, 상단 라벨?]
const steps = items => `<div class="flow">${items.map(([h, p, y], i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[i % 4]} b${i % 3 + 1}">${i + 1}</div>${y ? `<div class="yr">${y}</div>` : ''}<h4>${h}</h4><p>${p}</p></div>`).join('')}</div>`;
const bar = (label, pct, text, fill, cols = '130px 1fr 60px') => `<div class="kv" style="grid-template-columns:${cols}"><span>${label}</span><div class="bar"><span ${fill.startsWith('g-') ? `class="${fill}"` : ''} style="width:${Math.min(100, pct)}%;${fill.startsWith('g-') ? '' : `background:${fill}`}"></span></div><b>${text}</b></div>`;

const VIEWS = [
  { id: 'goal', t: ['사업', '목표'], sub: '한국연구재단 50년 지원 성과의 확산 경로를 역추적해 국가 R&D와 학술·인재양성 투자의 장기적 가치를 규명하고 「50년 대표성과」로 체계화합니다.' },
  { id: 'system', staff: true, t: ['성과 발굴체계와', '기준'], sub: '50년 투입 포트폴리오, 투자 대비 성과 발굴체계(S1~S6)와 세부기준(C1~C6), 투웨이 하이브리드, 선정위원회 검증을 다룹니다.' },
  { id: 'outcomes', t: ['대표 성과', '50선'], sub: '성과관 · 기초·원천연구에서 산업·사회 활용까지의 영향경로를 복원하고, 재단 지원이 작용한 방식을 4대 기여 유형으로 체계화합니다.', kind: 'o' },
  { id: 'people', t: ['대표 연구자', '50인'], sub: '인물관 · 학문후속세대에서 신진·중견·리더로 이어지는 생애주기 성장 궤적과 전환점·연속성·확산을 분석합니다.', kind: 'p' },
  { id: 'network', t: ['연구', '네트워크'], sub: '대표 성과와 대표 연구자가 서로 어떻게 이어져 있는지 그래프로 탐색합니다. 성과–연구자 연계, 공동연구, 인용·후속과제 계보, 사제 관계를 한 화면에서 봅니다.' },
  { id: 'contribution', staff: true, t: ['정부 지원', '기여도 분석'], sub: '성과를 재단에 귀속하지 않고, 정부·연구자·기관·기업의 복합 요인 속에서 재단 지원의 기여를 근거 수준과 함께 제시합니다.' },
  { id: 'outreach', t: ['홍보', '확산'], sub: '「50년 대표 성과·연구자 사례집」 기획·원고와 성과 시각화 자료 구성안. 시각화 자료 네 가지는 하위 메뉴에서 예제로 볼 수 있습니다.' },
  { id: 'admin', admin: true, staff: true, t: ['연구', '관리'], sub: '실데이터 가져오기, 선정위원회 심의, 균형 점검, 민감도 분석, 인터뷰 관리. 연구진이 발굴·검증 작업에 쓰는 도구입니다.' },
  { id: 'dsearch', admin: true, staff: true, t: ['데이터', '검색'], sub: 'NTIS·KRM·RISS·KCI·Scopus·NCBI·OpenAlex·Semantic Scholar·Crossref를 한 번에 검색하고 연도·저자·학술지·분야·피인용으로 분석합니다. API 키와 요청 주소는 직접 입력합니다.' },
];
const R = {};
