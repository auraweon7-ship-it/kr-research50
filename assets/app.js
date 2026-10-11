const TARGET = 50;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경에서는 세션 내 상태만 유지 */ } },
};
const state = {
  view: 'goal', sub: 'plan', pick: {}, region: '수도권', kind: 'o', era: 'e5', scope: 'all', rankBy: 'roi',
  w: { o: [25, 25, 25, 25], p: [25, 25, 25, 25] },
  status: store.get('nrf50.status', {}),
  f: { o: { q: '', domain: '', guide: '', ctype: '', era: '', track: '', stage: '', sort: 'score' }, p: { q: '', domain: '', guide: '', era: '', track: '', stage: '', sort: 'score' } },
};
const LIST = { o: OUTCOMES, p: PEOPLE };
const KIND = { o: '성과', p: '연구자' };
const byId = id => (id[0] === 'O' ? OUTCOMES : PEOPLE).find(x => x.id === id);
const dom = id => DOMAINS.find(d => d.id === id);
const stageOf = it => state.status[it.id] ?? it.stage0;
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
const tbl = (head, rows) => `<div class="tw"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i ? c : `<b>${c}</b>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const ul = a => `<ul class="bul">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
const tiles = (items, cols = 3) => `<div class="row c${cols}">${items.map(([b, h, p, v], i) => `<${v ? `button data-act="nav" data-v="${v}"` : 'div'} class="tile" style="text-align:left"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${b}</div><h3>${h}</h3>${Array.isArray(p) ? ul(p) : `<p class="mute sm" style="margin-top:6px">${p}</p>`}</${v ? 'button' : 'div'}>`).join('')}</div>`;
// items: [제목, 설명, 상단 라벨?]
const steps = items => `<div class="flow">${items.map(([h, p, y], i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[i % 4]} b${i % 3 + 1}">${i + 1}</div>${y ? `<div class="yr">${y}</div>` : ''}<h4>${h}</h4><p>${p}</p></div>`).join('')}</div>`;
const bar = (label, pct, text, fill, cols = '130px 1fr 60px') => `<div class="kv" style="grid-template-columns:${cols}"><span>${label}</span><div class="bar"><span ${fill.startsWith('g-') ? `class="${fill}"` : ''} style="width:${Math.min(100, pct)}%;${fill.startsWith('g-') ? '' : `background:${fill}`}"></span></div><b>${text}</b></div>`;

const VIEWS = [
  { id: 'goal', t: ['사업', '목표'], sub: '한국연구재단 50년 지원 성과의 확산 경로를 역추적해 국가 R&D와 학술·인재양성 투자의 장기적 가치를 규명하고 「50년 대표성과」로 체계화합니다.' },
  { id: 'system', t: ['성과 발굴체계와', '기준'], sub: '50년 투입 포트폴리오, 투자 대비 성과 발굴체계(S1~S6)와 세부기준(C1~C6), 투웨이 하이브리드, 선정위원회 검증을 다룹니다.' },
  { id: 'outcomes', t: ['대표 성과', '50선'], sub: '성과관 · 기초·원천연구에서 산업·사회 활용까지의 영향경로를 복원하고, 재단 지원이 작용한 방식을 4대 기여 유형으로 체계화합니다.', kind: 'o' },
  { id: 'people', t: ['대표 연구자', '50인'], sub: '인물관 · 학문후속세대에서 신진·중견·리더로 이어지는 생애주기 성장 궤적과 전환점·연속성·확산을 분석합니다.', kind: 'p' },
  { id: 'network', t: ['연구', '네트워크'], sub: '대표 성과와 대표 연구자가 서로 어떻게 이어져 있는지 그래프로 탐색합니다. 성과–연구자 연계, 공동연구, 인용·후속과제 계보, 사제 관계를 한 화면에서 봅니다.' },
  { id: 'contribution', t: ['정부 지원', '기여도 분석'], sub: '성과를 재단에 귀속하지 않고, 정부·연구자·기관·기업의 복합 요인 속에서 재단 지원의 기여를 근거 수준과 함께 제시합니다.' },
  { id: 'outreach', t: ['홍보', '확산'], sub: '「50년 대표 성과·연구자 사례집」 기획·원고와 성과 시각화 자료 구성안. 시각화 자료 네 가지는 하위 메뉴에서 예제로 볼 수 있습니다.' },
];
const R = {};

/* ========== 01 사업 목표 ========== */
R.goal = () => {
  const prog = { '50선': selected('o').length, '50인': selected('p').length };
  return `
  <section class="slide">
    <div class="deco g-pink" style="width:220px;height:200px;right:-60px;top:-70px"></div>
    <div class="hero">
      <div>
        <span class="tag">비전</span>
        <h2 style="margin-top:10px">국민이 체감하는 50년 연구지원의 가치를<br><b>증거로 말한다.</b></h2>${dots}
        <p class="lead">'얼마를 투자했는가'에서 '무엇을 바꾸었는가'로. 연구자 한 사람의 첫 독립 과제에서 세계적 연구 성과, 원천기술 기반 산업, 학문 분야의 형성, 국가 정책의 토대로 이어진 50년의 계보를 복원합니다.</p>
        <div class="chips mt"><span class="tag">연구기간 ${C.period}</span><span class="tag">한국연구재단 정책연구 공모과제</span></div>
        <div class="chips mt"><button class="btn pri" data-act="nav" data-v="outcomes">성과 트랙</button><button class="btn" data-act="nav" data-v="people">인물 트랙</button><button class="btn" data-act="nav" data-v="system">발굴체계와 기준</button></div>
      </div>
      <div class="ring"><div><span class="mute sm">1977 – 2026</span><span class="big">50년</span><span>대표 성과 <b>50선</b> · 대표 연구자 <b>50인</b></span></div></div>
    </div>
    ${foot('사업 목표')}
  </section>
  ${jump(['추진배경', '단기 성과관리의 한계', '연구 필요성', '연구 목적', '산출물·정량 목표', '추진전략·로드맵', '기대효과·활용'])}

  ${sub(1, '추진배경 · <b>50년의 흐름</b>', '재단 지원 50년을 맞는 지금이 지원 이력과 성과를 재조명하고 다음 50년의 투자 전략 근거를 마련할 적기')}
  ${slide('재단 지원 50년의 흐름과 <b>패러다임 전환</b>', `${steps(C.flow50.map(([h, y, p]) => [h, p, y]))}
    <div class="para mt2">${C.paradigm.map(([a, b]) => `<div><span class="old">${a}</span><svg viewBox="0 0 24 12" width="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 6h18M15 2l5 4-5 4"/></svg><b>${b}</b></div>`).join('')}</div>
    <p class="lead mt">성과가 과제·사업·연도 단위로 분절 관리되고 통합 이전 기관별 데이터 체계가 달라, '어떤 지원이 누구를 키웠고 무엇을 바꾸었는가'를 하나의 계보로 제시하지 못하고 있습니다.</p>${foot('추진배경')}`)}

  ${sub(2, '단기 정량 성과관리의 <b>구조적 한계</b>', '시차 · 귀속 · 정성 가치 누락 · 분절')}
  ${tiles(C.limits, 4)}
  <div class="row c2">
    ${slide('파급효과의 <b>시차</b>와 추적 구간', `<div class="lag">${C.lag.map((l, i) => `<div><span class="${G[i % 4]}" style="height:${20 + i * 20}%"></span><small>${l}</small></div>`).join('')}</div>
      <div class="range"><span class="g-orange" style="width:26%"></span></div><p class="sm"><b>현행 성과관리 관측 구간</b> <span class="mute">과제 종료 후 약 5년 내외</span></p>
      <div class="range"><span class="g-teal" style="width:100%"></span></div><p class="sm"><b>본 연구 추적 구간</b> <span class="mute">최초 지원 시점 ~ 현재(최대 50년)</span></p>
      <p class="mute sm mt">막대는 시간에 따른 확산 단계를 나타낸 개념도이며 실측값이 아닙니다.</p>`)}
    ${slide('현행 성과관리와 <b>본 연구의 접근</b>', tbl(['구분', '현행 단기 성과관리', '장기 파급효과 추적'], C.compare))}
  </div>

  ${sub(3, '연구의 <b>필요성</b>', 'RFP의 세 가지 추진배경에 기여 관점의 공신력 확보를 더한 네 축')}
  ${slide('현황·문제 → 정책 수요 → <b>본 연구의 대응</b>', `<div class="need head"><span>현황·문제</span><span>정책 수요</span><span>본 연구의 대응</span></div>${C.needs.map(n => `<div class="need"><div>${n[0]}</div><div>${n[1]}</div><div class="on">${n[2]}</div></div>`).join('')}
    <p class="lead mt">통합 이전 기관의 지원 이력은 현재 성과 DB와 연결되어 있지 않아, 시간이 지날수록 근거 자료와 당사자 증언 확보가 어려워집니다. 지금 추적하지 않으면 복원 비용이 급증합니다.</p>`)}

  ${sub(4, '연구 <b>목적</b>', '최종 목표와 세부목표 ①②③')}
  <section class="slide goalbox"><span class="tag">최종 목표</span><h2 style="margin-top:8px">한국연구재단 50년 지원 성과의 <b>장기 파급효과 규명</b>과 <b>「50년 대표성과」 체계화</b></h2></section>
  ${tiles(C.goals.map(([b, h, l]) => [b.slice(-1), `${b} ${h}`, l]))}
  ${slide('역추적의 기본 틀 · <b>확산 경로</b>', steps([['연구지원', '기초·원천·전략 R&D, 학술지원, 국제협력, 인재양성 투입'], ['연구자 성장·인재양성', '생애주기별 지원으로 연구자와 후속세대가 성장'], ['지식·기술 축적', '원천성과와 연구집단, 인프라가 쌓여 기반 형성'], ['산업·사회 활용', '제품·서비스, 정책, 국민 생활로 확산']]) + foot('연구 목적'))}

  ${sub(5, '핵심 산출물과 <b>정량 목표</b>', '선정위원회 의결과 산출물 점검으로 검증')}
  <div class="row c4">${C.outputs.map(([n, l], i) => `<div class="tile"><div class="n">${n}</div><div class="l">${l}</div>${prog[n] !== undefined ? `<div class="bar" style="margin-top:10px"><span class="${G[i % 4]}" style="width:${prog[n] / TARGET * 100}%"></span></div><div class="l" style="margin-top:4px">현재 최종선정 ${prog[n]} (예시)</div>` : ''}</div>`).join('')}</div>
  ${slide('연구 목표별 <b>성과 목표</b>', tbl(['구분', '성과 목표', '목표치', '검증 방법'], [
    ['발굴', '대표 연구성과 / 대표 연구자', '50선 / 50인', '선정위원회 의결'], ['발굴', '성과·인물 후보군 풀', '각 300건 이상', '후보군 DB'],
    ['분석', '투입-성과 연계 DB', '1식(50선·50인 연계)', '데이터 사전·품질 점검표'], ['분석', '연구자 심층 인터뷰', '20인 내외', '인터뷰 기록·코딩 결과'],
    ['검증', '선정위원회 / 세미나·워크숍', '3회 / 3회', '회의록'], ['확산', '통합 웹플랫폼(성과관·인물관·아카이브)', '1식', '시연 점검·재단 이관'],
    ['확산', '백서 2종 · 대국민 홍보 책자', '2종 · 1종(ebook)', '발간본·전문가 감수'], ['확산', '대표성과·연구자 인포그래픽 / AI 모션그래픽 영상', '각 100편', '웹플랫폼 게시본'],
    ['제도', '장기 성과관리 매뉴얼·정책 제언', '각 1건', '최종보고서']]))}

  ${sub(6, '4대 추진전략과 <b>8개월 로드맵</b>', '데이터 증거 · AI×전문가 이중 검증 · 공신력 있는 선정 · 스토리·확산')}
  ${tiles(C.strategy.map(([h, p, e], i) => [`전략${i + 1}`, h, `${p}<br><b style="color:var(--ink)">→ ${e}</b>`]), 4)}
  ${slide('단계별 <b>추진 로드맵</b>', `<div class="tw"><div class="gantt"><span></span>${C.months.map((m, i) => `<b class="gm">${m}<small>${i + 1}개월차</small></b>`).join('')}
    ${C.phases.map(([t, d, s, e], i) => `<span class="gl"><b>${t}</b></span><div class="gb ${G[i % 4]}" style="grid-column:${s + 1}/${e + 2}">${d}</div>`).join('')}
    <span class="gl"><b>마일스톤</b></span>${C.milestones.map(m => `<small class="ms">${m ? `<i></i>${m}` : ''}</small>`).join('')}</div></div>
    <p class="mute sm mt">단계가 겹치는 구간은 부문 간 병렬 수행으로 일정 위험을 줄입니다. 재단 협의체 월 1회, 단계별 품질관리, 개인정보·연구윤리 준수를 기반으로 합니다.</p>${foot('로드맵')}`)}

  ${sub(7, '기대효과와 <b>활용</b>', '단발성 기념 자료가 아니라 재단의 상시 성과관리 체계로 이관')}
  ${tiles(C.impact.map(([h, l]) => [h.slice(0, 2), h, l]), 4)}
  ${slide('이해관계자별 <b>유용성</b>', tiles(C.users.map(([h, l]) => [h.slice(0, 2), h, l]), 4).replace('class="row', 'style="margin-bottom:0" class="row mt'))}
  ${slide('단계별 활용 로드맵과 <b>정책 환류 순환</b>', `${tiles(C.roadmap.map(([h, s, l]) => [h.slice(0, 2), `${h} · ${s}`, l])).replace('class="row', 'style="margin-bottom:0" class="row mt')}
    <div class="para mt2">${['지원', '성장·성과', '장기 추적', '기여 분석', '정책 개선', '지원'].map((x, i) => `${i ? '<svg viewBox="0 0 24 12" width="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 6h18M15 2l5 4-5 4"/></svg>' : ''}<b>${x}</b>`).join('')}</div>${foot('활용')}`)}`;
};

/* ========== 02 성과 발굴체계와 기준 ========== */
const chartHTML = () => {
  const { years, series } = PORTFOLIO, n = years.length, W = 760, H = 250, L = 36, B = 24, T = 10;
  const tot = years.map((_, i) => DOMAINS.reduce((a, d) => a + series[d.id][i], 0));
  const max = Math.max(...tot), x = i => L + (W - L - 8) * i / (n - 1), y = v => T + (H - T - B) * (1 - v / max);
  let base = Array(n).fill(0), paths = '';
  DOMAINS.forEach(d => {
    const top = base.map((b, i) => b + series[d.id][i]);
    const pts = a => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    paths += `<path d="M${pts(top).join(' L')} L${pts(base).reverse().join(' L')} Z" fill="${d.color}" opacity=".88"/>`;
    base = top;
  });
  const e = ERAS.find(q => q.id === state.era), i0 = e.from - 1977, i1 = e.to - 1977;
  const grid = [0, .25, .5, .75, 1].map(g => `<line x1="${L}" x2="${W - 8}" y1="${y(max * g)}" y2="${y(max * g)}" stroke="#D5DAE4"/><text x="${L - 6}" y="${y(max * g) + 3}" text-anchor="end">${Math.round(max * g)}</text>`).join('');
  const xl = years.filter(v => v % 10 === 0 || v === 1977).map(v => `<text x="${x(v - 1977)}" y="${H - 6}" text-anchor="middle">${v}</text>`).join('');
  const sum = id => series[id].slice(i0, i1 + 1).reduce((a, b) => a + b, 0), all = DOMAINS.reduce((a, d) => a + sum(d.id), 0);
  const inputs = [
    ['재정', '재정적 투입', `${Math.round(all).toLocaleString()}<small> 지수</small>`, '시기 누적 지원 규모 · 2025년 기준 실질가치 환산(예시)'],
    ['인적', '인적 투입', `${Math.round(all * 38).toLocaleString()}<small> 명</small>`, '책임·참여 연구자와 학문후속세대(예시)'],
    ['물리', '물리적 투입', '', '대형 장비·연구센터·기초학문자료 인프라'],
    ['제도', '제도적 투입', '', e.sys],
    ['시간', '시간적 투입', `${e.period}<small> 년</small>`, '과제당 평균 지원기간 · 연속지원과 지원 공백(예시)'],
  ];
  return `
  <section class="slide">
    <h2>시대별 <b>지원 규모 흐름</b></h2>${dots}
    <div class="chips">${ERAS.map(q => `<button class="chip ${q.id === state.era ? 'on' : ''}" data-act="era" data-v="${q.id}">${q.no} ${q.label} <span class="mute">${q.from}–${String(q.to).slice(2)}</span></button>`).join('')}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="영역별 지원 규모 누적 영역 차트">
      <rect x="${x(i0)}" y="${T}" width="${x(i1) - x(i0)}" height="${H - T - B}" rx="10" fill="#fff" opacity=".7"/>${grid}${paths}${xl}
    </svg>
    ${legend(DOMAINS)}<p class="mute sm mt">차트 수치는 구조 시연용 예시 지수입니다. 실제 분석은 통합 前·後 사업 코드를 매핑해 하나의 시계열로 통합합니다.</p>${foot('투입 포트폴리오')}
  </section>
  <div class="row c5">${inputs.map(([b, h, nn, l], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${b}</div><h3>${h}</h3>${nn ? `<div class="n">${nn}</div>` : ''}<div class="l" style="margin-top:4px">${l}</div></div>`).join('')}</div>`;
};

const frameworkHTML = () => {
  const k = state.kind, list = LIST[k], c = t => count(k, it => it.track === t);
  return `
  <div class="chips" style="margin-bottom:22px">${['o', 'p'].map(q => `<button class="chip ${q === k ? 'on' : ''}" data-act="kind" data-v="${q}">${KIND[q]} 트랙</button>`).join('')}</div>
  <section class="slide">
    <h2>Two-Way <b>Hybrid</b> 발굴·검증</h2>${dots}
    <div class="hybrid">
      <div class="tile"><div class="blob g-blue">정</div><h3>방식 1 · 정방향 기준 트랙</h3>
        ${ul(['재단 50년 지원 과제·연구자 전체(NTIS·KRM 모집단)에서 출발', '사전 정립 기준(6대 가이드라인) 적용', '정량 스크리닝 · 데이터 연계'])}
        <div class="kv" style="grid-template-columns:1fr auto"><span class="mute">정방향만 도출 → 추가 근거 확인</span><b>${c('forward')}</b></div></div>
      <div class="mid"><span class="mute sm">두 트랙 공통 · 핵심 후보</span><span class="n">${c('both')}</span><span class="sm">/ ${list.length} 후보</span><span class="mute sm" style="margin-top:6px">누락 보완 · 과대평가 제거</span></div>
      <div class="tile"><div class="blob g-pink b2">역</div><h3>방식 2 · 역방향 핀포인트 트랙</h3>
        ${ul(['현재의 대표 성과·기술·인물에서 출발(수상·기술이전·창업·정책)', '초기 지원 과제·수혜 이력 역추적', '재단 DB·NTIS·KRM·사사·인터뷰'])}
        <div class="kv" style="grid-template-columns:1fr auto"><span class="mute">역방향만 도출 → 추가 근거 확인</span><b>${c('reverse')}</b></div></div>
    </div>
    ${foot('투웨이 하이브리드')}
  </section>
  ${slide('AI 기반 역추적과 <b>Human-in-the-loop</b> 검증', `${steps(C.hitl)}
    <div class="row c3 mt2" style="margin-bottom:0">${[['자동화 영역', '대량 문서 탐색, 항목 추출, 후보 매칭, 근거 위치 표시'], ['사람 판단 영역', '근거 진위 확인, 기여 강도 판정, 최종 선정 — AI 단독 판정 금지'], ['품질 관리', '표본 재검증으로 정밀도 점검, 판정 로그 전량 보존, 미공개 자료는 보안 환경에서 처리']].map(([h, p]) => `<div class="story"><b>${h}</b><br><span class="mute">${p}</span></div>`).join('')}</div>`,
    'AI는 탐색과 구조화를, 사람은 판단을 맡습니다. 모든 추출 결과에 원문 위치와 출처를 붙이고 근거문헌 2건 이상을 대조한 경우에만 확정합니다.')}
  ${slide('주요 <b>자료원</b>과 활용 목적', tbl(['자료원', '주요 정보', '활용 목적'], C.sources), 'NTIS와 KRM을 2대 기반 자료원으로 삼고 재단 내부 DB, 통합 이전 기관 자료, 국내외 학술·특허 DB로 보강해 수집 → 정제·연계 → 분석 → 활용의 4계층 연계 DB를 구축합니다.')}`;
};

const criteriaHTML = () => {
  const k = state.kind;
  const gt = (kk, guides, rows) => tbl(['가이드라인', '평가지표(예시)', '가중치(안)', '현재 후보'], [...rows.map(([g, ind, w]) => [guides[g], ind, `<b>${w}</b>`, count(kk, it => it.guide === g)]), ['합계', '', `<b>${rows.reduce((a, r) => a + r[2], 0)}</b>`, LIST[kk].length]]);
  return `
  ${slide('표 2-7 · 대표 연구성과 발굴 기준 <b>6대 가이드라인과 평가지표</b>', gt('o', O_GUIDE, C.guideO) + foot('표 2-7'),
    '국민이 체감·인지할 수 있는 세계적 연구성과부터 국가 연구위상을 높인 국제협력 성과까지, 균형 있는 후보군을 발굴하기 위한 기준입니다.')}
  ${slide('표 2-8 · 대표 연구자 발굴 기준 <b>6대 가이드라인과 평가지표</b>', gt('p', P_GUIDE, C.guideP) +
    '<p class="mute sm mt">가중치는 착수 단계 기준 세미나와 선정위원회 1차 회의에서 확정하며, 단순 정량 건수가 특정 분야에 유리하게 작용하지 않도록 분야별 표준화 점수를 적용합니다. 인문사회 연구자는 저술·정책·학문 체계화 기여를 별도 가중합니다.</p>' + foot('표 2-8'),
    '단순 논문·과제 건수를 지양하고, 영역별 대표성과 파급력을 종합 검증하는 다각적 평가지표입니다.')}
  <div class="row c2">
    <section class="slide">
      <h2>세부기준 <b>가중치 시뮬레이션</b></h2>${dots}
      <p class="lead">가중치를 조정하면 성과 점수와 투자 대비 성과 지수, 순위가 즉시 다시 계산됩니다(민감도 점검).</p>
      ${CRIT.map((l, i) => `<label class="slider"><span>${l}</span><input type="range" min="0" max="50" value="${state.w[k][i]}" data-w="${i}" aria-label="${l} 가중치"><b id="w${i}">${state.w[k][i]}</b></label>`).join('')}
      <div class="formula mt2"><b>투자 대비 성과 지수(안)</b><br>표준화 성과 점수 × 기여 계수(C4) ÷ 실질 투입 지수(로그 척도, C5)</div>
      <button class="btn mt" data-act="resetw">균등 가중치로 되돌리기</button>
    </section>
    <section class="slide">
      <h2>가중치 반영 <b>상위 8</b></h2>${dots}
      <div class="chips">${[['roi', '투자 대비 성과 지수'], ['score', '성과 점수 단독']].map(([v, l]) => `<button class="chip ${state.rankBy === v ? 'on' : ''}" data-act="rankby" data-v="${v}">${l}</button>`).join('')}</div>
      <ol class="rank" id="rank"></ol>
      <p class="mute sm mt">두 순위를 병행 제시해 대형 투자 성과와 소규모 고효율 성과를 모두 포착합니다.</p>
    </section>
  </div>`;
};

R.system = () => {
  const k = state.kind;
  return `
  ${jump(['투입 포트폴리오', '발굴체계 S1~S6', '세부기준 C1~C6', '50년 시대 구간', '투웨이 하이브리드', '6대 가이드라인·가중치', '선정 절차·선정위원회'])}

  ${sub(1, '50년 <b>투입 포트폴리오</b> 분석', '성과와 인물이 어떤 투입 구조 속에서 탄생했는지 설명하는 기초 · 5대 투입요소 × 5개 지원영역')}
  ${chartHTML()}
  ${slide('5대 투입요소 × 5개 지원영역 <b>분석 매트릭스</b>', tbl(['투입 요소', ...C.areas], C.matrix.map(([h, s, cells]) => [`${h}<br><span class="mute" style="font-weight:400">${s}</span>`, ...cells])) +
    '<div class="row c2 mt2" style="margin-bottom:0"><div class="story"><b>시기 축</b><br><span class="mute">통합 前(기관별) · 통합 後(2009~) 비교</span></div><div class="story"><b>연계 축</b><br><span class="mute">과제 ID·연구자 ID를 공통 키로 50선·50인과 결합</span></div></div>')}
  ${slide('투입 요소별 분석 지표와 <b>성과 연계요소</b>', tbl(['투입 요소', '주요 분석 지표', '자료원', '성과·인물 연계요소'], C.inputLinks))}
  ${slide('지원체계 <b>변천사</b>', `<div class="tl">${HISTORY.map(([yr, t, d]) => `<div class="tl-item" style="--c:${dom(d).color}"><b>${yr}</b>${t}</div>`).join('')}</div><p class="mute sm">통합 이전 기관의 백서·연차보고서·사사와 사업 공고문으로 변천사와 사업 코드 매핑표를 작성합니다. 연혁은 재단 공식 자료와 대조 검증이 필요합니다.</p>`)}

  ${sub(2, '투자 대비 <b>성과 발굴체계</b>', '투입(Investment) → 성과(Outcome) → 기여(Contribution)를 잇는 6개 체계 모듈 S1~S6')}
  ${slide('체계 모듈 <b>S1 ~ S6</b>', `${steps(C.S.map(([id, h, f]) => [`${id} ${h}`, f.split(',')[0]]))}<div class="mt2"></div>${tbl(['체계 모듈', '주요 기능', '입력 자료', '산출물'], C.S.map(([id, h, f, i, o]) => [`${id} ${h}`, f, i, o]))}${foot('발굴체계')}`,
    '50년 전 기간·전 지원 영역을 하나의 기준으로 비교합니다. 성과의 절대 규모만이 아니라 실질 투입액·지원 단계·지원 기간 대비 성과의 크기와 재단 기여 강도를 함께 평가해, 소규모·초기 지원이 큰 성과로 이어진 사례까지 발굴합니다.')}

  ${sub(3, '세부기준 모듈 <b>C1 ~ C6</b>', '투입 · 성과 · 파급 · 기여 · 효율 · 대표성의 여섯 측면에서 판정 지표를 정의')}
  <div class="row c3">${C.Cm.map(([id, h, s, ind, ap], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${id}</div><h3>${h}</h3><p class="sm" style="margin-top:4px">${s}</p><p class="mute sm" style="margin-top:6px">${ind}</p><div style="margin-top:10px"><span class="tag">적용 ${ap}</span></div></div>`).join('')}</div>

  ${sub(4, '연구지원 50년 <b>시대 구간</b>', '최근 성과에 편중되지 않도록 구간별 최소 후보 수를 설정')}
  ${slide('5개 시대 구간과 <b>후보 도출 기준(안)</b>', tbl(['시대 구간', '시기', '지원 체계의 특징', '최소 기준(안)', `현재 후보 (성과·인물)`], ERAS.map(e => { const a = count('o', o => o.era === e.id), b = count('p', o => o.era === e.id); return [`${e.no} ${e.label}`, `${e.from}~${e.to}`, e.sys, `각 ${e.min}건 이상`, `<span class="${a >= e.min ? '' : 'warn'}">${a}</span> · <span class="${b >= e.min ? '' : 'warn'}">${b}</span>`]; })) +
    '<p class="mute sm mt">시대 구간과 최소 기준은 제안값이며 기준 세미나에서 확정합니다. 최근 구간은 관측 기간이 짧으므로 시차 보정 점수를 적용합니다. 현재 후보 수는 시연용 예시이며 주황색은 최소 기준 미달입니다.</p>')}

  ${sub(5, '<b>투웨이 하이브리드</b> 설계', '정방향 기준 트랙 + 역방향 핀포인트 트랙의 교차검증과 AI·전문가 이중 확인')}
  ${frameworkHTML()}

  ${sub(6, '6대 가이드라인과 <b>가중치</b>', '성과 수준 기준(C2)의 평가지표와 투자 대비 성과 지수')}
  ${criteriaHTML()}

  ${sub(7, '단계별 선정 절차와 <b>선정위원회</b>', '4단계 깔때기와 외부 전문가 중심의 최종 검증')}
  ${slide('표 2-9 · 대표성과 50선 <b>영역별 배분(안)</b>', tbl(['영역', '배분(안)', '대표 후보 성격'], [...C.quota.map(([l, n, d]) => [l, `<b>${n}</b>`, d]), ['합계', `<b>${C.quota.reduce((a, q) => a + q[1], 0)}</b>`, '']]) +
    '<p class="mute sm mt">배분은 하한 기준이며, 후보 분포와 선정위원회 심의 결과에 따라 조정합니다.</p>' + foot('표 2-9'),
    '이공계 기술 혁신, 인문사회·기초학술, 대학 연구역량·인재양성, 국제협력이 고르게 대표되도록 영역별 최소 배분 원칙을 둡니다.')}
  <div class="row c2">
    ${slide(`${KIND[k]} 선정 <b>깔때기</b>`,`<div class="funnel">${C.funnel.map(([l, t, d, st], i) => `<div class="${['g-navy', 'g-blue', 'g-orange', 'g-teal'][i]}" style="width:${100 - i * 14}%"><span>${l}<small> ${d}</small></span><b>${i ? '약 ' : ''}${t}${i ? '' : '+'}</b></div>`).join('')}</div>
      <p class="mute sm mt">목표 규모 기준. 현재 예시 데이터: 후보 ${LIST[k].length} → 심층검토 이상 ${count(k, it => stageOf(it) >= 1)} → 선정위 상정 이상 ${count(k, it => stageOf(it) >= 2)} → 최종선정 ${selected(k).length}</p>`)}
    ${slide('영역별 배분 <b>비중</b>', C.quota.map(([l, n], i) => bar(l, n / 15 * 100, n, G[i % 4], '150px 1fr 30px')).join(''))}
  </div>
  <div class="row c2">
    ${slide('선정위원회 <b>구성·운영(안)</b>', tbl(['구분', '내용'], C.committee))}
    ${slide('세미나·워크숍 <b>3회</b>', tbl(['회차', '시기', '주제'], C.seminars) + '<p class="mute sm mt">모든 산식·가중치·판정 근거는 판정 로그로 보존하고 발굴·검증 매뉴얼에 수록해 재단이 연례 발굴에 그대로 적용할 수 있게 합니다.</p>')}
  </div>`;
};
const renderRank = () => {
  const el = $('#rank'); if (!el) return;
  el.innerHTML = [...LIST[state.kind]].sort((a, b) => rankVal(b) - rankVal(a)).slice(0, 8)
    .map((it, i) => `<li data-act="open" data-v="${it.id}"><b>${i + 1}</b><span>${it.kind === 'p' ? `${it.title} · ${it.field}` : it.title} <span class="mute">· ${GRADES[it.grade].label} · ${it.invest}억</span></span><b>${state.rankBy === 'roi' ? roi(it).toFixed(1) : score(it)}</b></li>`).join('');
};

/* ========== 03·04 성과관 · 인물관 ========== */
const SORTS = { score: '성과 점수순', roi: '투자 대비 성과 지수순', year: '출발 연도순' };
const listView = k => {
  const f = state.f[k], guides = k === 'o' ? O_GUIDE : P_GUIDE;
  const sel = (key, label, opts, all = true) => `<select class="field" data-sel="${key}" aria-label="${label}">${all ? `<option value="">${label} 전체</option>` : ''}${opts.map(([v, l]) => `<option value="${v}" ${f[key] === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `
  <div class="toolbar">
    <input class="field" type="search" placeholder="${k === 'o' ? '성과명 검색' : '분야·ID 검색'}" value="${esc(f.q)}" data-q aria-label="검색">
    ${sel('guide', '발굴 유형', Object.entries(guides))}
    ${k === 'o' ? sel('ctype', '기여 유형', CTYPES.map(c => [c, `${STORY[c].k} ${c}`])) : ''}
    ${sel('era', '시기', ERAS.map(e => [e.id, `${e.no} ${e.label} ${e.from}~${e.to}`]))}
    ${sel('track', '발굴 트랙', Object.entries(TRACKS))}
    ${sel('stage', '검증 단계', STAGES.map((s, i) => [i, s]))}
    ${sel('sort', '정렬', Object.entries(SORTS), false)}
  </div>
  <div class="chips" style="margin-bottom:22px">
    <button class="chip ${f.domain ? '' : 'on'}" data-act="domain" data-v="">전체 영역</button>
    ${DOMAINS.map(d => `<button class="chip ${f.domain === d.id ? 'on' : ''}" data-act="domain" data-v="${d.id}"><i style="background:${d.color}"></i>${d.label}</button>`).join('')}
    <span class="mute sm" id="count" style="margin-left:auto;align-self:center"></span>
  </div>
  <div class="cards" id="grid"></div>`;
};
const trackKpi = k => {
  const u = k === 'o' ? '건' : '명';
  return `<div class="row c4">${[
    [`${selected(k).length}<small> / ${TARGET}${k === 'o' ? '선' : '인'}</small>`, '최종선정 (선정위원회 의결)'],
    [`${LIST[k].length}<small> ${u}</small>`, '후보군 풀 · 목표 300건 이상'],
    [`${count(k, it => it.track === 'both')}<small> ${u}</small>`, '핵심 후보 · 두 트랙 공통 도출'],
    [`${count(k, it => it.ev >= 2)}<small> ${u}</small>`, '근거문헌 2건 이상 확인'],
  ].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['선정', '후보', '핵심', '근거'][i]}</div><div class="n">${n}</div><div class="l">${l} (예시)</div></div>`).join('')}</div>
  <div class="row c4">${[
    ['선정 달성률', selected(k).length, TARGET, `목표 ${TARGET}${k === 'o' ? '선' : '인'} 대비`],
    ['후보군 풀 확보율', LIST[k].length, 300, '목표 300건 대비'],
    ['핵심 후보 비율', count(k, it => it.track === 'both'), LIST[k].length, '후보 중 두 트랙 공통 도출'],
    ['근거 확인율', count(k, it => it.ev >= 2), LIST[k].length, '후보 중 근거문헌 2건 이상'],
  ].map(([h, v, t, l], i) => gauge(h, v, t, l, GC[i], u)).join('')}</div>`;
};
// 반원 게이지: 값/기준의 비율을 호의 길이로 나타낸다
const gauge = (title, v, total, note, color, unit) => {
  const pct = Math.max(0, Math.min(1, v / (total || 1))), R0 = 70, len = Math.PI * R0, a = Math.PI * (1 - pct), nx = 90 + Math.cos(a) * 52, ny = 88 - Math.sin(a) * 52;
  return `<div class="tile gauge"><h3>${title}</h3>
    <svg viewBox="0 0 180 104" role="img" aria-label="${title} ${Math.round(pct * 100)}퍼센트">
      <path d="M20 88 A${R0} ${R0} 0 0 1 160 88" fill="none" stroke="#DCE1EA" stroke-width="14" stroke-linecap="round"/>
      <path d="M20 88 A${R0} ${R0} 0 0 1 160 88" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${(len * pct).toFixed(1)} ${len.toFixed(1)}"/>
      ${[0, .25, .5, .75, 1].map(t => { const b = Math.PI * (1 - t); return `<line x1="${(90 + Math.cos(b) * 57).toFixed(1)}" y1="${(88 - Math.sin(b) * 57).toFixed(1)}" x2="${(90 + Math.cos(b) * 53).toFixed(1)}" y2="${(88 - Math.sin(b) * 53).toFixed(1)}" stroke="#A9B2C3" stroke-width="1.5"/>`; }).join('')}
      <line x1="90" y1="88" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#27365A" stroke-width="3" stroke-linecap="round"/><circle cx="90" cy="88" r="6" fill="#27365A"/>
      <text x="20" y="102" text-anchor="middle">0</text><text x="160" y="102" text-anchor="middle">${total}</text>
    </svg>
    <div class="n">${Math.round(pct * 100)}<small>%</small></div><div class="l">${v} / ${total}${unit} · ${note} (예시)</div></div>`;
};
// 후보 대비 최종선정 분포 막대
const dist = (k, rows) => { const mx = Math.max(1, ...rows.map(r => r[1])); return rows.map(([l, n, s, c]) => bar(l, n / mx * 100, `${s} / ${n}`, c, '150px 1fr 56px')).join(''); };
const outTiles = items => `<div class="row c5">${items.map(([n, h, p], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${n}</div><h3>${h}</h3><p class="mute sm" style="margin-top:6px">${p}</p></div>`).join('')}</div>`;

R.outcomes = () => {
  const so = selected('o');
  return `
  ${trackKpi('o')}
  ${jump(['후보 탐색', '발전 과정과 기여 유형', '발굴 현황과 균형', '심층 사례와 산출물'])}
  ${sub(1, '대표성과 <b>후보 탐색</b>', '영역 · 기여 유형 · 시기별로 탐색하고, 성과별 영향경로와 지원 이력을 확인')}
  ${listView('o')}

  ${sub(2, '발전 과정과 <b>4대 기여 유형</b>', '각 대표성과의 발전 단계를 시계열로 복원하고 재단 지원이 작용한 방식을 분류')}
  ${slide('대표성과의 <b>영향경로</b>', steps(C.oPath) + foot('영향경로'), '단계별로 관여한 지원 사업, 연구 주체, 타 부처·기업 투자, 주요 산출물(논문·특허·표준·제품)을 매핑해 영향경로 지도를 작성합니다.')}
  <div class="row c4">${CTYPES.map((c, i) => { const s = STORY[c]; return `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${s.k}</div><h3>유형 ${s.k} · ${c}</h3><p class="mute sm" style="margin-top:6px">${s.def}</p><p class="sm" style="margin-top:10px"><b>${s.arc.join(' → ')}</b></p><div style="margin-top:10px"><span class="tag">후보 ${count('o', o => o.ctype === c)} · 선정 ${so.filter(o => o.ctype === c).length}</span></div></div>`; }).join('')}</div>
  <p class="mute sm" style="margin:-10px 4px 0">하나의 성과에 복수 유형이 공존하면 주 유형과 부 유형을 함께 기록합니다.</p>

  ${sub(3, '발굴 현황과 <b>균형</b>', '6대 가이드라인 · 지원 영역 · 시대 구간별 최종선정 / 후보 (예시)')}
  <div class="row c3">
    ${slide('가이드라인별', dist('o', Object.entries(O_GUIDE).map(([g, l], i) => [l, count('o', o => o.guide === g), so.filter(o => o.guide === g).length, G[i % 4]])))}
    ${slide('지원 영역별', dist('o', DOMAINS.map(d => [d.label, count('o', o => o.domain === d.id), so.filter(o => o.domain === d.id).length, d.color])) + '<p class="mute sm mt">영역별 최소 배분(표 2-9)은 하한 기준으로 적용합니다.</p>')}
    ${slide('시대 구간별', dist('o', ERAS.map((e, i) => [`${e.no} ${e.label}`, count('o', o => o.era === e.id), so.filter(o => o.era === e.id).length, G[i % 4]])) + '<p class="mute sm mt">최근 구간은 시차 보정 점수를 적용합니다.</p>')}
  </div>

  ${sub(4, '심층 사례와 <b>산출물</b>', '표준 사례 양식으로 50편의 심층 사례를 쓰고 성과관·영상·인포그래픽·백서로 확산')}
  ${slide('표준 <b>사례 양식</b>', `<div class="row c3 mt" style="margin-bottom:0;gap:14px">${C.caseForm.map(([h, p], i) => `<div class="story"><b>${i + 1}. ${h}</b><br><span class="mute">${p}</span></div>`).join('')}</div>`, '후보 카드를 열면 이 양식 순서대로 구성된 상세 화면이 나타납니다.')}
  ${outTiles(C.oOut)}`;
};

R.people = () => {
  const sp = selected('p');
  return `
  ${trackKpi('p')}
  ${jump(['후보 탐색', '생애주기 성장경로', '다각적 평가와 현황', '프로필 DB와 산출물'])}
  ${sub(1, '대표 연구자 <b>후보 탐색</b>', '생애주기 성장 타임라인, 지원 이력, 사제·공동연구 네트워크를 확인')}
  ${listView('p')}

  ${sub(2, '생애주기 <b>성장경로</b> 분석 틀', '학문후속세대 지원부터 신진·중견·리더 연구에 이르는 성장 궤적 복원')}
  ${slide('연구자 생애주기별 <b>지원과 성장 궤적</b>', steps(C.life) + '<div class="formula mt2">지원 이력(과제·사업) × 성과 이력(논문·특허·수상·창업·정책) × 역할 변화(학생 → 책임자 → 멘토)를 시계열로 결합합니다.</div><p class="mute sm mt">사업명은 유형 예시이며, 실제 분석은 시기별 재단·통합 前 기관의 사업 체계를 따릅니다.</p>' + foot('성장경로'))}
  ${tiles(C.lifeAn)}

  ${sub(3, '다각적 평가와 <b>발굴 현황</b>', '단순 논문·과제 건수를 지양 · 최종선정 / 후보 (예시)')}
  <div class="row c3">
    ${slide('가이드라인별', dist('p', Object.entries(P_GUIDE).map(([g, l], i) => [l, count('p', o => o.guide === g), sp.filter(o => o.guide === g).length, G[i % 4]])))}
    ${slide('지원 영역별', dist('p', DOMAINS.map(d => [d.label, count('p', o => o.domain === d.id), sp.filter(o => o.domain === d.id).length, d.color])))}
    ${slide('첫 지원 시기별', dist('p', ERAS.map((e, i) => [`${e.no} ${e.label}`, count('p', o => o.era === e.id), sp.filter(o => o.era === e.id).length, G[i % 4]])))}
  </div>
  <p class="mute sm" style="margin:-10px 4px 0">분야 간 출판·인용 관행 차이를 고려해 분야 표준화 지표를 쓰고, 인문사회 연구자는 저술·정책·학문 체계화 기여를 별도 가중합니다.</p>

  ${sub(4, '프로필 DB와 <b>산출물</b>', '표준 항목으로 프로필 DB를 구축하고 인물관·영상·인포그래픽·백서로 확산')}
  ${slide('표 2-11 · 대표 연구자 <b>프로필 DB 표준 항목</b>', tbl(['영역', '항목'], C.profileDB) +
    '<div class="formula mt2"><b>윤리·동의</b> 대상 연구자에게 웹플랫폼·백서 활용 범위를 안내하고 공개 동의를 받으며, 동의 범위를 벗어난 개인정보는 DB·플랫폼·백서에서 제외합니다. 이 화면의 연구자는 모두 익명 ID로 표기한 예시입니다.</div>' + foot('프로필 DB'))}
  ${outTiles(C.pOut)}`;
};

const renderGrid = () => {
  const el = $('#grid'); if (!el) return;
  const k = state.kind, f = state.f[k], q = f.q.trim().toLowerCase();
  const guides = k === 'o' ? O_GUIDE : P_GUIDE;
  const key = { score, roi, year: it => -it.y0 }[f.sort] || score;
  const list = LIST[k].filter(it => (!q || (it.title + (it.field || '') + it.id).toLowerCase().includes(q)) && (!f.domain || it.domain === f.domain) &&
    (!f.guide || it.guide === f.guide) && (!f.ctype || it.ctype === f.ctype) && (!f.era || it.era === f.era) && (!f.track || it.track === f.track) && (f.stage === '' || stageOf(it) === +f.stage))
    .sort((a, b) => key(b) - key(a));
  $('#count').textContent = `${list.length}${k === 'o' ? '건' : '명'} · 최종선정 ${selected(k).length}/${TARGET}`;
  el.innerHTML = list.map((it, i) => {
    const d = dom(it.domain);
    return `<button class="card" data-act="open" data-v="${it.id}">
      <div class="card-top"><div class="blob ${d.g} ${['', 'b2', 'b3'][i % 3]}">${d.short}</div><div><div class="id">${it.id}</div>${pill(it)}</div><div class="score" title="${f.sort === 'roi' ? '투자 대비 성과 지수' : '성과 점수'}">${f.sort === 'roi' ? roi(it).toFixed(1) : score(it)}</div></div>
      <h4>${k === 'p' ? `${it.title} <span class="mute" style="font-weight:500">· ${it.field}</span>` : it.title}</h4>
      <p class="mute sm">${FEEL[it.guide]}</p>
      <div class="tags"><span class="tag">${guides[it.guide]}</span>${k === 'o' ? `<span class="tag">${STORY[it.ctype].k} ${it.ctype}</span>` : `<span class="tag">${it.life[it.life.length - 1].stage}</span>`}<span class="tag">${GRADES[it.grade].label}</span></div>
      <div class="card-foot">${trackDots(it)}<span class="mute sm">${k === 'o' ? `${it.path[0].year} → ${it.path[3].year}` : `첫 지원 ${it.y0} · ${it.years}년`}</span></div>
    </button>`;
  }).join('') || '<p class="mute">조건에 맞는 후보가 없습니다.</p>';
};

/* ========== 05 연구 네트워크 (옵시디언 그래프 스타일) ========== */
const LINKT = { tie: ['성과–연구자 연계', '#C9D2E3', '대표 성과와 그 성과를 만든 연구자'], co: ['공동연구', '#3D9FE6', '공저·공동과제로 이어진 연구자'], gen: ['인용·후속과제 계보', '#F6A53A', '앞선 성과가 뒤 성과의 토대가 된 관계'], ment: ['사제 관계', '#EC5C8D', '지도교수와 배출 인력'] };
const ERA_C = ['#EC5C8D', '#F6A53A', '#27B894', '#3D9FE6', '#9B8CFF'], STAGE_C = ['#7E8AA6', '#3D9FE6', '#F6A53A', '#27B894'];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gx = { pos: {}, tf: { x: 0, y: 0, k: 1 }, cam: null, auto: true, show: { o: true, p: true }, types: { tie: true, co: true, gen: true, ment: true }, domain: '', scope: 'all',
  sel: null, hover: null, q: '', alpha: 0, year: 2026, playing: false, color: 'domain', size: 'deg', depth: 1, pathMode: false, path: null, force: { rep: 520, dist: 62, grav: 5 }, N: [], L: [], V: [], VL: [], vadj: {} };
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
    const f = Math.min(5, F.rep * a / d2); p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
  }
  for (const l of gx.VL) { const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, d = Math.hypot(dx, dy) || 1, f = (d - F.dist) / d * .06 * a; l.a.vx += dx * f; l.a.vy += dy * f; l.b.vx -= dx * f; l.b.vy -= dy * f; }
  for (const n of N) { n.vx -= n.x * F.grav / 100 * a; n.vy -= n.y * F.grav / 77 * a; n.vx *= .82; n.vy *= .82; if (!n.fixed) { n.x += n.vx; n.y += n.vy; } gx.pos[n.id] = [n.x, n.y]; }
  gx.alpha *= .988;
};
const gFitTarget = () => {
  if (!gx.V.length) return { x: 0, y: 0, k: 1 };
  const xs = gx.V.map(n => n.x), ys = gx.V.map(n => n.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
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
  c.setTransform(gx.dpr, 0, 0, gx.dpr, 0, 0); c.globalAlpha = 1; c.fillStyle = '#1B2238'; c.fillRect(0, 0, w, h);
  const bg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .62); bg.addColorStop(0, 'rgba(61,159,230,.13)'); bg.addColorStop(1, 'rgba(61,159,230,0)'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const hl = gx.hl, id = gx.hlId, path = gx.path, q = gx.q.trim().toLowerCase(), rs = Math.max(.7, Math.min(1.7, k)), drift = REDUCE ? 0 : 1.6;
  for (const n of gx.V) { n.sx = (n.x + Math.sin(t * .7 + n.ph) * drift) * k + ox; n.sy = (n.y + Math.cos(t * .6 + n.ph * 1.7) * drift) * k + oy; }
  const linkOn = l => path ? path.edges.has(l.key) : !hl || (hl.has(l.a.id) && hl.has(l.b.id) && (gx.depth > 1 || l.a.id === id || l.b.id === id));

  for (const l of gx.VL) {
    const on = linkOn(l);
    c.globalAlpha = on ? (hl ? .95 : .26) : .035; c.strokeStyle = LINKT[l.type][1]; c.lineWidth = on && hl ? (path ? 2.6 : 1.8) : 1;
    c.beginPath(); c.moveTo(l.a.sx, l.a.sy); c.lineTo(l.b.sx, l.b.sy); c.stroke();
  }
  // 연결을 따라 흐르는 입자: 지식이 이동하는 방향감을 준다
  if (!REDUCE) for (const l of gx.VL) {
    const on = linkOn(l); if (hl && !on) continue;
    const hot = hl && on, n = hot ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const u = (t * (hot ? (path ? .7 : .42) : .11) + l.ph + i / n) % 1;
      c.globalAlpha = (hot ? 1 : .55) * Math.sin(u * Math.PI); c.fillStyle = hot ? '#fff' : LINKT[l.type][1];
      c.beginPath(); c.arc(l.a.sx + (l.b.sx - l.a.sx) * u, l.a.sy + (l.b.sy - l.a.sy) * u, hot ? 2.6 : 1.5, 0, 7); c.fill();
    }
  }
  c.textAlign = 'center'; c.font = '11px Pretendard, "Malgun Gothic", sans-serif';
  for (const n of gx.V) {
    const on = !hl || hl.has(n.id), age = n.born ? (now - n.born) / 650 : 1, grow = age >= 1 ? 1 : 1 + 2.7 * Math.pow(age - 1, 3) + 1.7 * Math.pow(age - 1, 2);
    const r = n.r * rs * Math.max(.05, grow), col = n.col, hit = q && gLabel(n.it).toLowerCase().includes(q), a0 = on ? 1 : .1;
    if (n.born && now - n.born < 1100) { const u = (now - n.born) / 1100; c.globalAlpha = (1 - u) * .7 * a0; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(n.sx, n.sy, r + u * 34, 0, 7); c.stroke(); }
    if ((n.deg >= 7 || hit) && on) { c.globalAlpha = (hit ? .3 : .13) + .06 * Math.sin(t * 2 + n.ph); c.fillStyle = hit ? '#FFE082' : col; c.beginPath(); c.arc(n.sx, n.sy, r * 2.3 + 3, 0, 7); c.fill(); }
    c.globalAlpha = a0; c.beginPath(); c.arc(n.sx, n.sy, r, 0, 7);
    if (n.it.kind === 'o') { c.fillStyle = col; c.fill(); } else { c.fillStyle = '#1B2238'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = col; c.stroke(); }
    if (n.id === gx.sel || n.id === gx.hover) {
      c.beginPath(); c.arc(n.sx, n.sy, r + 4, 0, 7); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
      if (n.id === gx.sel && !REDUCE) { const u = (t * .8) % 1; c.globalAlpha = (1 - u) * .8; c.beginPath(); c.arc(n.sx, n.sy, r + 4 + u * 22, 0, 7); c.stroke(); }
    }
    const la = hl ? (on ? 1 : 0) : hit ? 1 : Math.max(n.deg >= 7 ? .8 : 0, Math.min(1, (k - 1.05) / .5));
    if (la > .02 && grow > .6) { const s = gLabel(n.it); c.globalAlpha = la; c.fillStyle = '#E6EBF5'; c.fillText(s.length > 16 ? s.slice(0, 15) + '…' : s, n.sx, n.sy + r + 13); }
  }
  if (gx.playing || gx.vy < 2026) { c.globalAlpha = .2; c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = '700 54px Pretendard, sans-serif'; c.fillText(gx.vy, 22, 64); }
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
  for (const n of gx.V) { const d = Math.hypot(n.sx - mx, n.sy - my); if (d < n.r * 1.7 + 6 && d < bd) { best = n; bd = d; } }
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
  cv.onpointerdown = e => { const n = gAt(e); drag = { n, x: e.clientX, y: e.clientY, moved: 0 }; if (n) n.fixed = true; cv.setPointerCapture(e.pointerId); };
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
      else { gx.sel = drag.n ? drag.n.id : null; gx.path = null; gx.pathMode = false; }
      gHl(); gPanel();
    }
    drag = null;
  };
  cv.onpointerleave = () => { if (!drag && gx.hover) { gx.hover = null; gHl(); } };
  cv.ondblclick = e => { const n = gAt(e); if (n) openModal(n.id); };
  cv.onwheel = e => {
    e.preventDefault(); hands();
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
    <button class="btn" data-act="gfit">화면 맞춤</button><button class="btn" data-act="grelayout">다시 배치</button><button class="btn" data-act="gfull">전체 화면</button><button class="btn" data-act="gpng">PNG 저장</button>
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
      <div class="graph-wrap"><canvas id="graph" aria-label="대표 성과와 대표 연구자의 연구 네트워크 그래프"></canvas>
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
  ${slide('연결의 <b>종류</b>', tbl(['연결', '의미', '분석 근거', '수'], Object.entries(LINKT).map(([t, [l, c, d]]) => [`<i class="dot" style="background:${c}"></i>${l}`, d, { tie: '투입-성과 연계 DB (과제 ID·연구자 ID)', co: '공저 네트워크, 공동 과제', gen: '인용 네트워크, 과제-후속과제 연결망', ment: '프로필 DB의 배출 인력' }[t], links.filter(x => x.type === t).length])) +
    '<p class="mute sm mt">성과–연구자 연계는 후보 데이터의 연결이고, 공동연구·계보·사제 관계는 구조를 보여주기 위해 생성한 예시입니다. 실제 분석에서는 인용·공저 네트워크와 과제-후속과제 연결망으로 지식 확산 경로를, 사제·공동연구 네트워크로 연구 생태계의 범위와 다음 세대로의 확산을 측정합니다.</p>' + foot('연구 네트워크'))}`;
};

/* ========== 06 정부 지원 기여도 분석 ========== */
const scatter = list => {
  const W = 760, H = 280, L = 40, B = 30, T = 12, x = v => L + (W - L - 12) * (Math.log10(v) / 2.6), y = v => T + (H - T - B) * (1 - (v - 50) / 50);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="실질 투입 대비 성과 점수 산점도">
    ${[50, 60, 70, 80, 90, 100].map(v => `<line x1="${L}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}" stroke="#D5DAE4"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    ${[1, 3, 10, 30, 100, 300].map(v => `<text x="${x(v)}" y="${H - 10}" text-anchor="middle">${v}억</text>`).join('')}
    ${list.map(o => `<circle cx="${x(o.invest).toFixed(1)}" cy="${y(score(o)).toFixed(1)}" r="${4 + GRADES[o.grade].coef * 5}" fill="${GC[o.grade]}" opacity=".8" stroke="#fff" stroke-width="1.5" data-act="open" data-v="${o.id}" style="cursor:pointer"><title>${o.title} · 성과 ${score(o)} · 투입 ${o.invest}억 · 지수 ${roi(o).toFixed(1)}</title></circle>`).join('')}
    <text x="${L}" y="${T + 2}">성과 점수 ↑</text><text x="${W - 12}" y="${H - 22}" text-anchor="end">실질 투입액(로그 척도) →</text></svg>`;
};
R.contribution = () => {
  const list = state.scope === 'sel' ? selected('o') : OUTCOMES, n = list.length || 1;
  const top = [...list].sort((a, b) => roi(b) - roi(a)).slice(0, 8);
  return `
  ${jump(['기여 관점과 6단계', '기여 강도 판정', '단계별 기여 구성', '투자 대비 성과 지수', '정량·정성 검증'])}
  <div class="chips" style="margin-bottom:6px">
    <button class="chip ${state.scope === 'all' ? 'on' : ''}" data-act="scope" data-v="all">전체 성과 후보 ${OUTCOMES.length}건</button>
    <button class="chip ${state.scope === 'sel' ? 'on' : ''}" data-act="scope" data-v="sel">최종선정 ${selected('o').length}건</button>
  </div>

  ${sub(1, '귀속이 아닌 <b>기여 관점</b>', '재단 지원이 해당 성과에 어떤 차이를 만들었는가')}
  ${slide('기여분석(Contribution Analysis) <b>6단계</b>', `${steps(C.ca)}
    <div class="formula mt2"><b>원칙</b> 성과를 재단에 "귀속"하지 않고, 정부·연구자·기관·기업의 복합 요인 속에서 재단 지원의 "기여"를 근거 수준과 함께 제시합니다 (Mayne의 기여분석 접근 응용).</div>${foot('기여분석')}`,
    '지원 규모·시점, 후속 과제와 인용·특허 연계 같은 정량 데이터에 연구자 인터뷰·전문가 검증으로 확인한 정성적 파급효과를 더해 기여 스토리를 작성합니다.')}

  ${sub(2, '기여 강도 <b>4등급 판정</b>', '세부기준 C4 · 기여 계수는 투자 대비 성과 지수에 반영')}
  ${slide('기여 강도 <b>판정 기준</b>', tbl(['등급', '정의', '판정 근거(예)', '계수(안)', '후보'], GRADES.map((g, i) => [`<i class="dot" style="background:${GC[i]}"></i>${g.label}`, g.def, g.ev, g.coef.toFixed(1), `${list.filter(o => o.grade === i).length}건`])) +
    `<div class="mt2">${GRADES.map((g, i) => bar(g.label, list.filter(o => o.grade === i).length / n * 100, `${Math.round(list.filter(o => o.grade === i).length / n * 100)}%`, GC[i], '96px 1fr 44px')).join('')}</div>`)}

  ${sub(3, '발전 단계별 <b>기여 구성</b>', '기초·원천연구 → 후속 연구 → 기술·지식 축적 → 산업·사회 활용')}
  <div class="row c64">
    <section class="slide">
      <h2>단계별 <b>복합 요인</b> 구성</h2>${dots}
      <p class="lead">초기에는 정부 지원이 마중물이 되고, 활용 단계로 갈수록 기업·민간 투자 비중이 커지는 구조를 단계별로 확인합니다.</p>
      ${PATH_STAGES.map((s, i) => `<div class="srow"><span>${s}</span>${stack(avgMix(list, i))}</div>`).join('')}
      ${legend(FACTORS)}${foot('기여 구성')}
    </section>
    <section class="slide">
      <h2>4대 <b>기여(확산) 유형</b></h2>${dots}
      ${CTYPES.map((c, i) => bar(`${STORY[c].k} ${c}`, list.filter(o => o.ctype === c).length / n * 100, list.filter(o => o.ctype === c).length, G[i], '118px 1fr 30px')).join('')}
      <p class="mute sm mt">복수 유형이 공존하면 주 유형과 부 유형을 함께 기록합니다.</p>
      <h3 class="mt2">대안 설명 검토</h3><p class="mute sm">성과에 영향을 준 다른 요인을 함께 기록해 판단의 객관성을 높입니다.</p>
      ${ALTS.map((a, i) => bar(a, list.filter(o => o.alts.includes(a)).length / n * 100, `${list.filter(o => o.alts.includes(a)).length}건`, GC[(i + 2) % 4], '118px 1fr 44px')).join('')}
    </section>
  </div>
  ${slide('영역별 <b>초기 단계 정부 기여</b>', DOMAINS.map(d => { const v = avgMix(list.filter(o => o.domain === d.id), 0)[0]; return bar(d.label, v, `${v}%`, d.color, '170px 1fr 44px'); }).join(''))}

  ${sub(4, '<b>투자 대비 성과</b> 지수', '절대 규모가 아니라 실질 투입 대비 성과와 기여 강도를 함께 평가')}
  ${slide('지수 산정과 <b>세부기준 적용 절차</b>', `${steps(C.roi)}<div class="formula mt2"><b>산식(안)</b> 투자 대비 성과 지수 = 표준화 성과 점수 × 기여 계수 ÷ 실질 투입 지수(로그 척도)<br><span class="mute">성과 점수 단독 순위와 병행 제시해 대형 투자 성과와 고효율 성과를 모두 포착합니다.</span></div>`)}
  ${slide('실질 투입 × 성과 점수 × <b>기여 강도</b>', `${scatter(list)}${legend(GRADES.map((g, i) => ({ label: `${g.label} (계수 ${g.coef.toFixed(1)})`, color: GC[i] })))}<p class="mute sm mt">원의 크기와 색은 기여 강도입니다. 왼쪽 위(적은 투입·높은 성과)일수록 투자 효율이 높습니다. 점을 누르면 상세가 열립니다. 수치는 예시입니다.</p>`)}
  ${slide('투자 대비 성과 지수 <b>상위 성과</b>', `<div class="tw"><table><thead><tr><th>성과</th><th>기여 유형</th><th>기여 강도</th><th>실질 투입</th><th>성과 점수</th><th>지수</th></tr></thead><tbody>
    ${top.map(o => `<tr data-act="open" data-v="${o.id}"><td><b>${o.title}</b></td><td><span class="tag">${STORY[o.ctype].k} ${o.ctype}</span></td><td>${GRADES[o.grade].label}</td><td>${o.invest}억</td><td>${score(o)}</td><td><b>${roi(o).toFixed(1)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="mute">최종선정된 성과가 없습니다.</td></tr>'}
    </tbody></table></div>`)}

  ${sub(5, '정량·정성 <b>통합 검증</b>', '네트워크·계량 분석, 심층 인터뷰, 전문가 검증')}
  ${tiles(C.network)}
  <div class="row c2">
    ${slide('연구자 <b>심층 인터뷰</b> 설계', tbl(['구분', '내용'], C.interview))}
    ${slide('성과 관리 <b>지표(KPI)</b>', tbl(['구분', '지표', '목표'], C.kpi))}
  </div>`;
};

/* ========== 07 홍보 확산 ========== */
const SUBS = [['plan', '기획 개요', '사례집·시각화'], ['life', '연구자 생애주기 성장 흐름도', '인물 중심'], ['path', '지원사업 연계 기술·학술 발전 경로도', '성과 중심'], ['map', '연구성과 대국민 확산 지도', '성과 중심'], ['info', '대표성과 인포그래픽', '성과 중심'], ['cards', '카드 뉴스', '성과·인물 중심']];
const chev = '<svg viewBox="0 0 24 12" width="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 6h18M15 2l5 4-5 4"/></svg>';
const chain = a => `<div class="para mt">${a.map((x, j) => `${j ? chev : ''}<b>${x}</b>`).join('')}</div>`;
// 예제 대상 선택: 최종선정 → 점수 순으로 정렬
const picker = (key, kind) => {
  // 인물은 생애주기 단계를 많이 거친 사례가 먼저 오도록 한다
  const list = [...LIST[kind]].sort((a, b) => stageOf(b) - stageOf(a) || (b.life?.length || 0) - (a.life?.length || 0) || score(b) - score(a));
  if (!byId(state.pick[key] || 'O-000')) state.pick[key] = list[0].id;
  return `<select class="field" data-pick="${key}" aria-label="예제 대상 선택" style="max-width:100%">${list.map(it => `<option value="${it.id}" ${it.id === state.pick[key] ? 'selected' : ''}>${it.id} · ${kind === 'p' ? it.field : it.title}${stageOf(it) === 3 ? ' (최종선정)' : ''}</option>`).join('')}</select>`;
};
const spec = (type, rows) => slide(`시각화 자료 <b>구성안</b>`, info([['유형', `<span class="tag">${type}</span>`], ...rows]) + '<p class="mute sm mt">구성안 예제입니다. 디자인·인쇄는 과업 범위에서 제외되며, 수치는 시연용 예시 데이터입니다.</p>');

const OUT = {};

OUT.plan = () => {
  const so = selected('o'), sp = selected('p');
  const part = (obj, list) => Object.entries(obj).map(([k, l]) => `${l} ${list.filter(x => x.guide === k).length}`).join(' · ');
  const toc = (rows, live) => `<ol class="toc">${rows.map(([h, p], i) => `<li><b>${i && i < 5 ? `PART ${i}` : i ? '부록' : '서문'}</b><span><b>${h}</b><br><span class="mute sm">${p}${live[i] ? `<br>${live[i]}` : ''}</span></span></li>`).join('')}</ol>`;
  const ex = [['life', '인물', '연구자 생애주기 성장 흐름도', '초기 연구지원부터 현재까지 지원·성장 궤적'], ['path', '성과', '지원사업 연계 기술·학술 발전 경로도', '단계별 지원사업을 통한 기술 발전과 성과 확산 경로'], ['map', '성과', '연구성과 대국민 확산 지도', '성과가 닿은 권역과 생활 분야'], ['info', '성과', '대표성과 인포그래픽', '한 장으로 보는 성과의 가치와 기여 구성']];
  return `
  ${jump(['사례집 기획·원고', '시각화 자료 구성안', '스토리텔링 모델', '확산 산출물', '통합 웹플랫폼', '백서·홍보 책자', '영상·인포그래픽·YouTube', '확산 채널'])}

  ${sub(1, '「50년 대표 성과·연구자 <b>사례집</b>」 기획 및 원고', '국민 체감형 스토리텔링 사례집 · 디자인·인쇄 제외, 기획과 원고 작성이 과업 범위')}
  <div class="row c64">
    <section class="slide">
      <h2>「한국연구재단 50년 대표 성과·연구자 사례집」 <b>구성안</b></h2>${dots}
      <ol class="toc">
        <li><b>PART 1</b><span><b>연구지원 50년의 흐름</b><br><span class="mute sm">숫자로 보는 50년 · 시대별 투입 포트폴리오와 지원체계 변천</span></span><span class="tag">5개 시기</span></li>
        <li><b>PART 2</b><span><b>대표 성과 50선 — 무엇을 바꾸었는가</b><br><span class="mute sm">기여 유형별 심층 사례 · ${CTYPES.map(c => `${STORY[c].k} ${so.filter(o => o.ctype === c).length}`).join(' · ')}</span></span><span class="tag">${so.length}/${TARGET}</span></li>
        <li><b>PART 3</b><span><b>대표 연구자 50인 — 누구를 키웠는가</b><br><span class="mute sm">생애사 중심 성장 서사 · ${part(P_GUIDE, sp)}</span></span><span class="tag">${sp.length}/${TARGET}</span></li>
        <li><b>PART 4</b><span><b>기여 관점의 파급효과와 정책 제언</b><br><span class="mute sm">장기 투자의 가치, 생애주기별 지원 고도화, 장기 성과관리 체계</span></span><span class="tag">환류</span></li>
      </ol>
      <p class="lead mt">사례집 기획 원고와 시각화 콘텐츠는 통합 웹플랫폼, 백서 2종, 홍보 책자에 탑재·수록되어 50주년 기념사업과 언론·SNS 홍보로 확산됩니다.</p>
      <div class="chips mt"><button class="btn pri" data-act="export">선정 결과 JSON 내보내기</button><button class="btn" data-act="print">구성안 인쇄</button></div>
      ${foot('사례집 구성안')}
    </section>
    <section class="slide">
      <h2>원고 <b>작성 현황</b></h2>${dots}
      ${bar('성과 사례 원고', so.length / TARGET * 100, `${so.length}/50`, 'g-pink', '104px 1fr 50px')}
      ${bar('연구자 서사 원고', sp.length / TARGET * 100, `${sp.length}/50`, 'g-orange', '104px 1fr 50px')}
      <p class="mute sm mt">최종선정된 성과·연구자가 원고 작성 대상입니다(예시 집계).</p>
      <h3 class="mt2">4단계 검수</h3>
      ${chain(['연구진 집필', '대상 연구자 사실 확인', '외부 전문가 원고자문', '편집 교정'])}
      <h3 class="mt2">서술 원칙</h3>
      ${ul(['국민 눈높이의 용어 사용', '성과의 생활 속 접점 제시', '연구자의 목소리를 살린 서술', '표기 기준(용어·수치·인명·기관명) 착수 단계 확정'])}
    </section>
  </div>
  <div class="row c2">
    ${slide('성과 사례 <b>원고 양식</b>', `<div class="row c2 mt" style="margin-bottom:0;gap:12px">${C.caseForm.map(([h, p], i) => `<div class="story"><b>${i + 1}. ${h}</b><br><span class="mute">${p}</span></div>`).join('')}</div>`, '대표 성과 50선 · 표준 사례 양식 6항목')}
    ${slide('연구자 서사 <b>원고 양식</b>', `<div class="row c2 mt" style="margin-bottom:0;gap:12px">${[['첫 지원', '연구의 출발과 첫 독립 과제'], ['전환점', '성장이 가속된 시점과 직전 지원'], ['연속 지원', '단절 없는 후속 지원이 만든 차이'], ['확산', '제자·공동연구자, 산업·사회로의 확장'], ['국민 체감 메시지', '이 연구자의 일이 내 삶과 닿는 지점'], ['다음 세대에게', '후속세대 연구자에게 전하는 말']].map(([h, p], i) => `<div class="story"><b>${i + 1}. ${h}</b><br><span class="mute">${p}</span></div>`).join('')}</div>`, '대표 연구자 50인 · 생애사 중심 서사 6항목')}
  </div>

  ${sub(2, '성과 <b>시각화 자료</b> 구성안', '인물 중심과 성과 중심 두 축 · 아래 네 가지는 하위 메뉴에서 예제로 구현')}
  ${tiles([['인물', '인물 중심', '연구자 생애주기별 지원·성장 궤적. 학문후속세대에서 리더까지, 지원 이력과 성과 이력, 역할 변화를 한 흐름으로 보여줍니다.'], ['성과', '성과 중심', '단계별 지원사업을 통한 기술 발전 및 성과 확산 경로. 기초·원천연구에서 산업·사회 활용까지, 누가 무엇을 이어받았는지 보여줍니다.']], 2)}
  <div class="row c4">${ex.map(([v, tag, h, p], i) => `<button class="tile" style="text-align:left" data-act="sub" data-v="${v}"><div class="blob ${G[i]} ${i % 2 ? 'b2' : 'b3'}">예제</div><span class="tag">${tag} 중심</span><h3 style="margin-top:8px">${h}</h3><p class="mute sm" style="margin-top:6px">${p}</p><p class="sm" style="margin-top:10px;color:var(--blue);font-weight:700">예제 보기 →</p></button>`).join('')}</div>
  ${slide('시각화 콘텐츠 <b>10종</b>', `<div class="row c5 mt" style="margin-bottom:0;gap:14px">${C.viz.map(([tag, h, v], i) => `<button class="story" style="text-align:left" data-act="nav" data-v="${v}"><span class="mute sm">${String(i + 1).padStart(2, '0')} · ${tag}</span><br><b>${h}</b></button>`).join('')}</div>`, '웹플랫폼에는 인터랙티브 콘텐츠로, 사례집·백서·홍보 책자에는 전자책용 도해로 공통 적용합니다.')}

  ${sub(3, '성과유형별 <b>스토리텔링 모델</b>', '유형별 서사 구조 4종으로 국민 체감형 사례를 작성')}
  <div class="row c4">${CTYPES.map((c, i) => { const s = STORY[c]; return `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${s.k}</div><h3>${c}</h3><p class="mute sm" style="margin-top:4px">${s.def}</p><p class="sm" style="margin-top:10px"><b>${s.arc.join(' → ')}</b></p><p class="sm" style="margin-top:8px">“${s.q}”</p><p class="mute sm" style="margin-top:6px">근거: ${s.ev}</p><div style="margin-top:10px"><span class="tag">최종선정 ${so.filter(o => o.ctype === c).length}건</span></div></div>`; }).join('')}</div>

  ${sub(4, '확산 <b>산출물 총괄</b>', '같은 이야기를 국민·연구계·정책 관계자에게 각각 맞는 형식으로')}
  <div class="row c4">${[['1식', '통합 웹플랫폼'], ['2종', '백서 (각 200쪽 내외, ebook)'], ['1종', '대국민 홍보 책자 (40쪽 내외, ebook)'], ['100편', 'AI 모션그래픽 영상'], ['100편', '1장형 인포그래픽'], ['1편', 'AI 홍보영상 (3분 내외)'], ['101편', 'YouTube 공개·운영'], ['10종', '시각화 콘텐츠']].map(([n, l]) => `<div class="tile"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('산출물 <b>구성(안)</b>', tbl(['산출물', '주요 구성', '규격·수량(안)'], C.deliver) + foot('산출물'))}

  ${sub(5, '통합 <b>웹플랫폼</b>', '성과관 · 인물관 · 50년 아카이브관 · 자료실')}
  <div class="row c3">${C.halls.map(([h, f, src, v], i) => `<${v ? `button data-act="nav" data-v="${v}"` : 'div'} class="tile" style="text-align:left"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${h.slice(0, 2)}</div><h3>${h}</h3><p class="mute sm" style="margin-top:6px">${f}</p><div style="margin-top:10px"><span class="tag">${src}</span></div></${v ? 'button' : 'div'}>`).join('')}</div>
  ${slide('구축 절차 · <b>요구분석에서 공개·이관까지</b>', steps(C.build.map(([h, m, p]) => [h, p, m])) + foot('웹플랫폼'))}
  ${tiles(C.buildRules)}

  ${sub(6, '백서 2종과 <b>홍보 책자</b>', '사례집 원고를 바탕으로 전자책(ebook) 발간')}
  <div class="row c2">
    ${slide('「한국연구재단 50년 <b>대표성과 백서</b>」', toc(C.book1, {}))}
    ${slide('「대한민국 <b>대표 연구자 50인 백서</b>」', toc(C.book2, {}))}
  </div>
  ${slide('제작 <b>절차</b>', steps(C.press.map(([h, m, p]) => [h, p, m])))}

  ${sub(7, 'AI 모션그래픽 영상 · 인포그래픽 · <b>YouTube</b>', '대표성과 50편 + 대표 연구자 50편')}
  <div class="row c2">${C.videoArc.map(([h, arc, p], i) => slide(`${h.split(' ')[0]} ${h.split(' ')[1]} <b>${h.split(' ')[2]}</b>`, `${chain(arc)}<p class="mute sm mt">${i ? '인포그래픽: 생애주기 성장 궤적·지원 이력·대표 성과' : '인포그래픽: 지원 이력·영향경로·기여 유형·국민 체감 포인트'}</p>`, p)).join('')}</div>
  ${slide('제작 <b>파이프라인</b>', `${steps(C.video)}<div class="formula mt2"><b>검증·권리</b> 연구진 사실 확인과 대상 연구자 확인을 거쳐 공개합니다. 초상·음성 활용 동의를 받고, AI 생성물임을 표기하며, 저작권이 확인된 소재만 사용합니다. 데이터 출처(NTIS·KRM 등)를 표기합니다.</div>`)}
  ${tiles(C.youtube)}

  ${sub(8, '확산 <b>채널</b>과 이관', '연구 종료 시 소스·데이터·운영 매뉴얼과 채널 권한을 재단에 이관')}
  ${slide('확산 채널별 <b>계획</b>', tbl(['채널', '내용', '시기'], C.channels) + foot('확산 채널'))}`;
};

/* --- 예제 1: 연구자 생애주기 성장 흐름도 --- */
const lifeEvents = it => {
  const L = it.life, at = (i, d) => Math.min(2026, (L[Math.min(i, L.length - 1)].year) + d);
  return [[at(1, 2), '첫 대표 논문'], [at(2, 1), '연구집단 형성'], [at(3, 2), `주요 학술상 등 수상 ${it.awards}회`], ...(it.patents > 5 ? [[at(2, 4), '대형 기술이전']] : []), ...(it.startup ? [[at(3, 3), '원천기술 기반 창업']] : []), ...(it.policy > 4 ? [[at(4, 1), '국가 정책 자문']] : [])]
    .filter(e => L.length > 1).sort((a, b) => a[0] - b[0]);
};
const lifeSvg = it => {
  const W = 860, H = 340, L = 34, Rr = 40, y0 = it.y0, sp = Math.max(8, 2026 - y0), x = y => L + (W - L - Rr) * (y - y0) / sp, ly = i => 226 - i * 42;
  const pts = it.life.map((p, i) => [x(p.year), ly(i)]), last = pts[pts.length - 1], ti = Math.min(it.turn, it.life.length - 1);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [cx, cy] = pts[i], mx = (px + cx) / 2; d += ` C${mx},${py} ${mx},${cy} ${cx},${cy}`; }
  d += ` L${x(2026)},${last[1]}`;
  const ticks = []; for (let y = Math.ceil(y0 / 5) * 5; y <= 2026; y += 5) ticks.push(y);
  const yOn = yr => { let i = 0; while (i < it.life.length - 1 && it.life[i + 1].year <= yr) i++; return ly(i); };
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${it.title} 생애주기 성장 흐름도">
    <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#EC5C8D"/><stop offset=".4" stop-color="#F6A53A"/><stop offset=".7" stop-color="#27B894"/><stop offset="1" stop-color="#3D9FE6"/></linearGradient></defs>
    ${ticks.map(y => `<line x1="${x(y)}" x2="${x(y)}" y1="30" y2="258" stroke="#DCE1EA" stroke-dasharray="3 4"/><text x="${x(y)}" y="${H - 6}" text-anchor="middle">${y}</text>`).join('')}
    <path d="${d} L${x(2026)},258 L${pts[0][0]},258 Z" fill="url(#lg)" opacity=".1"/>
    <path d="${d}" fill="none" stroke="url(#lg)" stroke-width="5" stroke-linecap="round"/>
    ${it.life.map((p, i) => { const nx = x(i + 1 < it.life.length ? it.life[i + 1].year : 2026), w = Math.max(6, nx - pts[i][0] - 4); return `<rect x="${pts[i][0]}" y="268" width="${w}" height="24" rx="12" fill="${GC[i % 4]}" opacity=".9"><title>${p.program}</title></rect>${w > 96 ? `<text x="${pts[i][0] + 10}" y="284" style="fill:#fff;font-weight:600">${p.program.length > w / 9 ? p.program.slice(0, Math.floor(w / 9)) + '…' : p.program}</text>` : ''}`; }).join('')}
    ${lifeEvents(it).map(([yr]) => `<circle cx="${x(yr)}" cy="${yOn(yr)}" r="4.5" fill="#fff" stroke="#27365A" stroke-width="2"/>`).join('')}
    ${pts.map(([px, py], i) => `${i === ti ? `<circle cx="${px}" cy="${py}" r="21" fill="none" stroke="#EC5C8D" stroke-width="2" stroke-dasharray="4 4"/>` : ''}<circle cx="${px}" cy="${py}" r="14" fill="${GC[i % 4]}" stroke="#fff" stroke-width="3"/><text x="${px}" y="${py + 4}" text-anchor="middle" style="fill:#fff;font-weight:700;font-size:11px">${i + 1}</text>
      <text x="${px}" y="${py - 24}" text-anchor="${px > W - 110 ? 'end' : px < 80 ? 'start' : 'middle'}" style="fill:#27365A;font-weight:700;font-size:12px">${it.life[i].stage}${i === ti ? ' · 전환점' : ''}</text><text x="${px}" y="${py + 30}" text-anchor="middle">${it.life[i].year}</text>`).join('')}
    <text x="${L}" y="262" style="font-size:9.5px">지원 이력 ▼</text></svg>`;
};
OUT.life = () => {
  const pk = picker('life', 'p'), it = byId(state.pick.life), d = dom(it.domain), ti = Math.min(it.turn, it.life.length - 1), turn = it.life[ti], before = it.life[Math.max(0, ti - 1)];
  return `
  ${spec('인물 중심', [['보여주는 것', '초기 연구지원부터 현재까지 연구자 생애주기별 지원과 성장 궤적'], ['구성 요소', '성장 곡선(생애주기 5단계) · 지원 이력 띠 · 성과 이력 표지 · 전환점'], ['사용 데이터', '프로필 DB의 지원 이력, 성과 이력, 성장 궤적 항목'], ['활용처', '인물관 프로필 화면, 사례집·백서 도해, 인물 인포그래픽·영상의 장면 구성']])}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:10px"><h2 style="flex:1 1 260px">${it.title} · <b>${it.field}</b></h2>${pk}</div>
    <div class="chips" style="gap:6px">${pill(it)}<span class="tag">${P_GUIDE[it.guide]}</span><span class="tag">${d.label}</span><span class="tag">첫 지원 ${it.y0}</span></div>
    <div class="tw">${lifeSvg(it).replace('class="chart"', 'class="chart" style="min-width:640px"')}</div>
    ${legend([{ label: '성장 곡선 · 단계 번호', color: '#F6A53A' }, { label: '지원 이력(사업 유형)', color: '#27B894' }, { label: '성과 이력 표지(흰 점)', color: '#27365A' }, { label: '전환점(점선 고리)', color: '#EC5C8D' }])}
    ${foot('생애주기 성장 흐름도')}
  </section>
  <div class="row c2">
    ${slide('단계별 <b>지원과 역할</b>', tbl(['단계', '시기', '지원 사업(유형 예시)', '역할'], it.life.map((p, i) => [p.stage, p.year, p.program, ROLES[i]])))}
    ${slide('성과 이력과 <b>분석 포인트</b>', `<ol class="rank" style="margin-top:6px">${lifeEvents(it).map(([y, l]) => `<li style="cursor:default"><b>${y}</b><span>${l}</span><b></b></li>`).join('')}</ol>
      ${info([['전환점', `${turn.year}년 ${turn.stage} 진입 · 직전 지원 「${before.program}」`], ['연속성', it.gap ? `지원 공백 ${it.gap}년 · 누적 ${it.years}년` : `단절 없는 후속 지원 · 누적 ${it.years}년`], ['확산', `배출 인력 ${it.alumni}명 · 공동연구자 ${it.coauthors}명`]])}
      <div class="chips mt"><button class="btn" data-act="open" data-v="${it.id}">프로필 상세 열기</button></div>`)}
  </div>`;
};

/* --- 예제 2: 지원사업 연계 기술·학술 발전 경로도 --- */
OUT.path = () => {
  const pk = picker('path', 'o'), it = byId(state.pick.path), d = dom(it.domain), s = STORY[it.ctype];
  const altAt = ['해외 연구 경험', '기관 인프라', '타 부처 R&D', '기업 투자'];
  const row = (label, cells) => `<span class="ll">${label}</span>${cells.join('')}`;
  return `
  ${spec('성과 중심', [['보여주는 것', '단계별 지원사업을 통한 기술·학술 발전과 성과 확산 경로'], ['구성 요소', '발전 4단계 · 재단 지원 사업 · 연구 주체 · 주요 산출물 · 병행 투자 · 단계별 기여 구성'], ['사용 데이터', '투입-성과 연계 DB의 성과 사슬(과제 → 성과 → 후속 과제 → 활용)과 기여분석 결과'], ['활용처', '성과관 영향경로 지도, 사례집·백서 도해, 성과 영상의 표준 장면 구성']])}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:10px"><h2 style="flex:1 1 260px"><b>${it.title}</b></h2>${pk}</div>
    <div class="chips" style="gap:6px">${pill(it)}<span class="tag">${O_GUIDE[it.guide]}</span><span class="tag">${s.k} ${it.ctype}</span><span class="tag">${GRADES[it.grade].label}</span><span class="tag">${it.domain === 'hs' ? '학술' : '기술'} 발전 경로 · ${it.path[3].year - it.path[0].year}년</span></div>
    <div class="tw"><div class="lanes">
      <span></span>${it.path.map((p, i) => `<div class="lh"><div class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</div><b>${PATH_STAGES[i]}</b><small>${p.year}${i < 3 ? ` ~ ${it.path[i + 1].year}` : ' ~'}</small></div>`).join('')}
      ${row('재단 지원 사업', it.path.map((p, i) => `<div class="lc ${i < 2 ? 'on' : ''}" ${i < 2 ? `style="border-color:${d.color}"` : ''}><b>${p.program}</b><br><span class="mute">${p.desc}</span></div>`))}
      ${row('연구 주체', PATH_ACTOR.map(a => `<div class="lc">${a}</div>`))}
      ${row('주요 산출물', PATH_OUT.map(a => `<div class="lc">${a}</div>`))}
      ${row('병행 투자·요인', altAt.map(a => `<div class="lc ${it.alts.includes(a) ? '' : 'off'}">${it.alts.includes(a) ? a : '—'}</div>`))}
      ${row('기여 구성', it.mix.map(m => `<div class="lc flat">${stack(m)}</div>`))}
    </div></div>
    ${legend(FACTORS)}
    <div class="formula mt2"><b>${s.k} ${it.ctype}</b> · ${s.arc.join(' → ')}<br><span class="mute">${s.def}. 색 테두리 칸이 재단의 직접 지원 구간이며, 뒤 단계로 갈수록 기업·민간 투자 비중이 커집니다.</span></div>
    <div class="chips mt">${it.people.map(byId).map(p => `<button class="chip" data-act="open" data-v="${p.id}">연계 연구자 ${p.id} · ${p.field}</button>`).join('')}<button class="btn" data-act="open" data-v="${it.id}">성과 상세 열기</button></div>
    ${foot('발전 경로도')}
  </section>`;
};

/* --- 예제 3: 연구성과 대국민 확산 지도 (Google Maps + Remotion 팝업) --- */
// 권역 중심 좌표. 성과별 위치는 권역 안에 흩어 놓은 예시이며 실제 소재지가 아니다.
const GEO = { 수도권: [37.5, 127.02], 강원권: [37.78, 128.3], 충청권: [36.42, 127.3], 대경권: [35.95, 128.62], 호남권: [35.3, 126.92], 동남권: [35.32, 128.85], 제주권: [33.38, 126.55] };
const geoOf = o => { const r = rng(+o.id.slice(2) * 53 + 7), [la, ln] = GEO[o.region], j = o.region === '제주권' ? [.12, .5] : [.34, .42]; return { lat: la + (r() - .5) * j[0], lng: ln + (r() - .5) * j[1] }; };
const MAP_STYLE = [{ elementType: 'geometry', stylers: [{ saturation: -55 }, { lightness: 12 }] }, { featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }, { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] }, { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE3F5' }] }];
const mapList = () => state.scope === 'sel' ? selected('o') : OUTCOMES;
const popData = o => ({ id: o.id, title: o.title, region: o.region, color: dom(o.domain).color, feel: FEEL[o.guide], y0: o.path[0].year, span: o.path[3].year - o.path[0].year, invest: o.invest, roi: +roi(o).toFixed(1),
  ctype: `${STORY[o.ctype].k} ${o.ctype}`, grade: GRADES[o.grade].label, stages: o.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i] })), mix: FACTORS.map((_, i) => Math.round(o.mix.reduce((a, x) => a + x[i], 0) / 4)) });
// Remotion을 불러오지 못할 때 쓰는 CSS 애니메이션 카드
const popFallback = o => { const d = popData(o); return `<div class="mpop" style="background:linear-gradient(135deg,${d.color},#27365A)"><small>대한민국 연구 50년 · ${d.id} · ${d.region}</small><h3>${d.title}</h3><p>${d.feel}</p><div class="mp-n">${[[d.y0, '년', '첫 지원'], [d.span, '년', '확산 기간'], [d.invest, '억', '실질 투입'], [d.roi, '', '성과 지수']].map(([n, u, l], i) => `<div style="animation-delay:${.3 + i * .12}s"><b>${n}<i>${u}</i></b><span>${l}</span></div>`).join('')}</div><div class="mp-b"><span>${d.ctype} · ${d.grade}</span></div></div>`; };
const bubbleMap = () => { const reg = REGIONS.map(r => ({ ...r, n: mapList().filter(o => o.region === r.id).length })), mx = Math.max(1, ...reg.map(r => r.n)); return reg.map((r, i) => { const sz = 58 + r.n / mx * 52; return `<button class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'} ${r.id === state.region ? 'sel' : ''}" data-act="region" data-v="${r.id}" style="left:${r.x}%;top:${r.y}%;width:${sz}px;height:${sz * .92}px">${r.id}<br><b style="font-size:1.3em">${r.n}</b></button>`; }).join(''); };

const gm = {};
const mapFallback = msg => { if (msg) gm.msg = msg; gm.el.className = 'map big'; gm.el.innerHTML = `${bubbleMap()}<p class="gm-note">Google 지도를 표시하지 못해 약식 도해로 대체했습니다${gm.msg ? ` (${gm.msg})` : ''}.</p>`; };
const loadMaps = () => gm.p ||= new Promise((res, rej) => {
  window.__gmReady = res;
  window.gm_authFailure = () => { gm.fail = true; mapFallback('API 키 인증 실패 · 키의 리퍼러 제한과 결제 설정 확인'); };
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=__gmReady&v=weekly&language=ko&region=KR&loading=async`;
  s.onerror = rej; document.head.appendChild(s);
});
const openPop = (o, marker) => {
  gm.un?.(); gm.un = null;
  const box = document.createElement('div'); box.className = 'gpop';
  box.innerHTML = `<div class="gpop-stage">${popFallback(o)}</div><div class="gpop-foot"><span class="mute sm">${dom(o.domain).label} · ${O_GUIDE[o.guide]}</span><button class="btn" data-act="open" data-v="${o.id}">성과 상세</button></div>`;
  gm.info.setContent(box); gm.info.open({ map: gm.map, anchor: marker });
  import('./popup-remotion.js').then(m => { const st = document.createElement('div'); gm.un = m.mount(st, popData(o)); box.firstChild.replaceChildren(st); }).catch(() => { /* CDN 차단 시 CSS 카드 유지 */ });
};
const drawMarkers = () => {
  (gm.marks || []).forEach(m => m.setMap(null)); (gm.rings || []).forEach(c => c.setMap(null)); gm.info.close();
  const list = mapList();
  gm.rings = REGIONS.map((r, i) => { const n = list.filter(o => o.region === r.id).length, [lat, lng] = GEO[r.id];
    const c = new google.maps.Circle({ map: gm.map, center: { lat, lng }, radius: 14000 + Math.sqrt(n) * 9000, strokeColor: GC[i % 4], strokeOpacity: r.id === state.region ? .9 : .35, strokeWeight: r.id === state.region ? 3 : 1, fillColor: GC[i % 4], fillOpacity: r.id === state.region ? .16 : .07, clickable: false }); return c; });
  gm.marks = list.map((o, i) => { const sel = stageOf(o) === 3;
    const m = new google.maps.Marker({ map: gm.map, position: geoOf(o), title: o.title, animation: google.maps.Animation.DROP, zIndex: sel ? 2 : 1,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: sel ? 10 : 7, fillColor: dom(o.domain).color, fillOpacity: .95, strokeColor: '#fff', strokeWeight: sel ? 3 : 2 } });
    m.oid = o.id; m.addListener('click', () => openPop(o, m)); return m; });
  if (gm.region !== state.region) { gm.region = state.region; const [lat, lng] = GEO[state.region]; gm.map.panTo({ lat, lng }); gm.map.setZoom(state.region === '제주권' ? 10 : 9); }
};
const mountMap = () => {
  const ph = $('#gmap'); if (!ph) return;
  if (gm.el && gm.el !== ph) ph.replaceWith(gm.el); else gm.el = ph;
  if (gm.fail) return mapFallback();
  if (gm.map) return drawMarkers();
  loadMaps().then(() => {
    if (gm.fail || gm.map) return;
    gm.map = new google.maps.Map(gm.el, { center: { lat: 36.0, lng: 127.8 }, zoom: 7, mapTypeControl: false, streetViewControl: false, styles: MAP_STYLE });
    gm.info = new google.maps.InfoWindow({ maxWidth: 460 });
    gm.info.addListener('closeclick', () => { gm.un?.(); gm.un = null; });
    gm.region = state.region; drawMarkers();
  }).catch(() => { gm.fail = true; mapFallback('지도 스크립트를 불러오지 못했습니다'); });
};

const spreadPoster = (list, reg) => {
  const n = list.length || 1, span = Math.round(list.reduce((a, o) => a + o.path[3].year - o.path[0].year, 0) / n), top = [...reg].sort((a, b) => b.items.length - a.items.length), mx = Math.max(1, top[0].items.length);
  const g = Object.entries(O_GUIDE).map(([k, l]) => [l, list.filter(o => o.guide === k).length]), gmx = Math.max(1, ...g.map(x => x[1]));
  return `<article class="poster">
    <header class="g-teal"><span>대한민국 연구 50년 · 확산 인포그래픽</span><h2>연구실에서 시작해<br>전국의 일상으로</h2><p>재단 지원 성과가 닿은 권역과 생활 분야를 한 장으로</p><i class="pd1"></i><i class="pd2"></i></header>
    <div class="p-nums">${[[list.length, '건', '확산 성과'], [reg.filter(r => r.items.length).length, '개', '확산 권역'], [span, '년', '평균 확산 기간'], [avgMix(list, 3)[3], '%', '활용 단계 민간 투자 비중']].map(([v, u, l]) => `<div><b>${v}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>
    <div class="p-two">
      <div><h4>권역별 확산 성과</h4><div class="p-bars">${top.map((r, i) => `<p><span>${r.id}</span><i><em class="${G[i % 4]}" style="width:${r.items.length / mx * 100}%"></em></i><b>${r.items.length}</b></p>`).join('')}</div></div>
      <div><h4>어떤 분야에 닿았나</h4><div class="p-blobs">${g.map(([l, v], i) => { const sz = 40 + v / gmx * 34; return `<div><span class="blob ${G[i % 4]} b${i % 3 + 1}" style="width:${sz}px;height:${sz * .92}px">${v}</span><small>${l}</small></div>`; }).join('')}</div></div>
    </div>
    <h4>확산의 경로</h4>
    <div class="p-arc">${PATH_STAGES.map((a, i) => `${i ? chev : ''}<b>${a} <span style="color:var(--mute);font-weight:500">정부 ${avgMix(list, i)[0]}%</span></b>`).join('')}</div>
    <h4>시대별 확산 속도</h4>
    <div class="p-path" style="grid-template-columns:repeat(5,1fr)">${ERAS.map((e, i) => { const l = list.filter(o => o.era === e.id), s = l.length ? Math.round(l.reduce((a, o) => a + o.path[3].year - o.path[0].year, 0) / l.length) : 0; return `<div><span class="blob ${G[i % 4]} b${i % 3 + 1}">${l.length}</span><small>${e.no} ${e.label}</small><b>${s ? `평균 ${s}년` : '—'}</b><em>${e.from}~${e.to}</em></div>`; }).join('')}</div>
    <footer><span>데이터 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터)</span><span>한국연구재단 | 한국외국어대학교</span></footer>
  </article>`;
};

OUT.map = () => {
  const list = mapList(), reg = REGIONS.map(r => ({ ...r, items: list.filter(o => o.region === r.id) })), cur = reg.find(r => r.id === state.region) || reg[0];
  return `
  ${spec('성과 중심', [['보여주는 것', '연구성과가 국민 생활과 산업 현장으로 퍼진 권역과 분야'], ['구성 요소', 'Google 지도 위 성과 표지 · 권역 원 · 모션그래픽 팝업 · 권역별 성과 목록 · 확산 인포그래픽'], ['사용 데이터', '성과 사슬의 기술이전·사업화·공공 활용 위치 정보, 6대 가이드라인 분류'], ['활용처', '50년 아카이브관, 홍보 책자 "숫자로 보는 50년", 50주년 전시 콘텐츠']])}
  <div class="chips" style="margin-bottom:14px">
    <button class="chip ${state.scope === 'all' ? 'on' : ''}" data-act="scope" data-v="all">전체 성과 후보 ${OUTCOMES.length}건</button>
    <button class="chip ${state.scope === 'sel' ? 'on' : ''}" data-act="scope" data-v="sel">최종선정 ${selected('o').length}건</button>
  </div>
  <div class="chips" style="margin-bottom:22px">${reg.map((r, i) => `<button class="chip ${r.id === cur.id ? 'on' : ''}" data-act="region" data-v="${r.id}"><i style="background:${GC[i % 4]}"></i>${r.id} ${r.items.length}</button>`).join('')}</div>
  <div class="row c64">
    <section class="slide">
      <h2>성과 <b>확산 지도</b></h2>${dots}
      <div id="gmap"></div>
      ${legend(DOMAINS)}
      <p class="mute sm mt">표지를 누르면 성과 정보가 모션그래픽 팝업으로 재생됩니다. 큰 표지는 최종선정 성과입니다. 표지 위치는 권역 안에 임의로 흩어 놓은 예시이며 실제 소재지가 아닙니다.</p>
      ${foot('대국민 확산 지도')}
    </section>
    <section class="slide">
      <h2><b>${cur.id}</b> 확산 성과 ${cur.items.length}건</h2>${dots}
      <ol class="rank">${[...cur.items].sort((a, b) => score(b) - score(a)).slice(0, 8).map((o, i) => `<li data-act="focus" data-v="${o.id}"><b>${i + 1}</b><span>${o.title}</span><b>${score(o)}</b></li>`).join('') || '<li style="cursor:default"><b></b><span class="mute">해당 권역 성과 없음</span><b></b></li>'}</ol>
      <p class="mute sm mt">목록을 누르면 지도에서 해당 성과의 팝업이 열립니다.</p>
      <h3 class="mt2">생활 분야별 분포</h3>
      ${Object.entries(O_GUIDE).map(([g, l], i) => bar(l, cur.items.filter(o => o.guide === g).length / Math.max(1, cur.items.length) * 100, cur.items.filter(o => o.guide === g).length, G[i % 4], '150px 1fr 26px')).join('')}
    </section>
  </div>
  <section class="slide">
    <div class="toolbar" style="margin-bottom:16px"><h2 style="flex:1">확산 <b>인포그래픽</b></h2><button class="btn" data-act="print">인쇄</button></div>
    ${spreadPoster(list, reg)}
  </section>
  ${slide('권역 × <b>지원 영역</b>', tbl(['권역', ...DOMAINS.map(x => x.short), '합계'], reg.map(r => [r.id, ...DOMAINS.map(x => r.items.filter(o => o.domain === x.id).length || '<span class="mute">—</span>'), `<b>${r.items.length}</b>`])))}`;
};

/* --- 예제 4: 대표성과 인포그래픽 --- */
const donut = m => {
  const R0 = 52, Cc = 2 * Math.PI * R0; let off = 0;
  return `<svg viewBox="0 0 140 140" width="150" role="img" aria-label="기여 구성 도넛">${m.map((v, i) => { const len = v / 100 * Cc, seg = `<circle cx="70" cy="70" r="${R0}" fill="none" stroke="${FACTORS[i].color}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${(Cc - len + 2).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 70 70)"/>`; off += len; return seg; }).join('')}<text x="70" y="66" text-anchor="middle" style="font-size:22px;font-weight:700;fill:#27365A">${m[0]}%</text><text x="70" y="84" text-anchor="middle" style="font-size:10px;fill:#7A869C">정부 지원</text></svg>`;
};
const pbar = (label, pct, text, fill) => `<p><span>${label}</span><i><em ${fill.startsWith('g-') ? `class="${fill}"` : `style="background:${fill}"`} style="width:${Math.min(100, pct)}%;${fill.startsWith('g-') ? '' : `background:${fill}`}"></em></i><b>${text}</b></p>`;
OUT.info = () => {
  const pk = picker('info', 'o'), it = byId(state.pick.info), d = dom(it.domain), s = STORY[it.ctype], g = GRADES[it.grade], era = ERAS.find(e => e.id === it.era);
  const m = FACTORS.map((_, i) => Math.round(it.mix.reduce((a, x) => a + x[i], 0) / 4)); m[0] += 100 - m.reduce((a, b) => a + b, 0);
  const span = it.path[3].year - it.path[0].year, peers = OUTCOMES.filter(o => o.domain === it.domain), avg = fn => peers.reduce((a, o) => a + fn(o), 0) / peers.length;
  const rank = [...OUTCOMES].sort((a, b) => roi(b) - roi(a)).findIndex(o => o.id === it.id) + 1;
  // 같은 지원 영역 평균과의 비교: [항목, 이 성과, 영역 평균, 단위]
  const cmp = [['성과 점수', score(it), avg(score), '점'], ['확산 기간', span, avg(o => o.path[3].year - o.path[0].year), '년'], ['실질 투입', it.invest, avg(o => o.invest), '억'], ['투자 대비 성과 지수', roi(it), avg(roi), '']];
  const people = it.people.map(byId);
  return `
  ${spec('성과 중심', [['보여주는 것', '대표성과 하나의 가치를 한 장으로 — 지원 이력, 영향경로, 기여 유형, 국민 체감 포인트'], ['구성 요소', '제목·체감 문구 · 핵심 숫자 6개 · 영향경로 4단계 · 기여 구성 · 기여 유형과 강도 · 세부기준 점수 · 영역 평균 비교 · 발굴·검증 · 연계 연구자 · 출처'], ['사용 데이터', '확정 사례 원고와 연계 DB 값(수치·연도는 DB와 대조)'], ['활용처', '성과관 상세 화면, 사례집·백서·홍보 책자, SNS 카드뉴스, 50주년 전시 (100편 표준 템플릿)']])}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:16px"><h2 style="flex:1 1 220px">대표성과 <b>인포그래픽 예제</b></h2>${pk}<button class="btn" data-act="print">인쇄</button></div>
    <article class="poster wide">
      <header class="${d.g}"><span>대한민국 연구 50년 · 대표성과 ${it.id}</span><h2>${it.title}</h2><p>${FEEL[it.guide]}</p>
        <div class="p-tags">${[O_GUIDE[it.guide], d.label, `${era.no} ${era.label} 출발`, `${it.region} 확산`, STAGES[stageOf(it)]].map(t => `<em>${t}</em>`).join('')}</div><i class="pd1"></i><i class="pd2"></i></header>
      <div class="p-nums six">${[[it.path[0].year, '년', '첫 지원'], [span, '년', '확산 기간'], [it.invest, '억', '실질 투입(2025년 기준)'], [score(it), '점', '성과 점수'], [roi(it).toFixed(1), '', `투자 대비 성과 지수 · 전체 ${rank}위`], [people.length, '명', '연계 대표 연구자']].map(([n, u, l]) => `<div><b>${n}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>

      <h4>영향경로 · 누가 무엇을 이어받았나</h4>
      <div class="p-stages">${it.path.map((p, i) => `<div><span class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</span><small>${p.year}${i < 3 ? ` ~ ${it.path[i + 1].year}` : ' ~'}</small><b>${PATH_STAGES[i]}</b>
        <dl><dt>지원 사업</dt><dd>${p.program}</dd><dt>연구 주체</dt><dd>${PATH_ACTOR[i]}</dd><dt>주요 산출물</dt><dd>${PATH_OUT[i]}</dd></dl>
        ${stack(it.mix[i])}</div>`).join('')}</div>
      <div class="p-legend">${FACTORS.map(f => `<span><i style="background:${f.color}"></i>${f.label}</span>`).join('')}<span class="mute">· 막대는 단계별 기여 구성</span></div>

      <div class="p-three">
        <div><h4>누가 함께 만들었나</h4><div class="p-donut">${donut(m)}<div>${FACTORS.map((f, i) => `<p><i style="background:${f.color}"></i>${f.label} <b>${m[i]}%</b></p>`).join('')}</div></div>
          <p class="p-note">4개 단계 평균. 초기 단계 정부 지원 ${it.mix[0][0]}% → 활용 단계 ${it.mix[3][0]}%, 민간 투자 ${it.mix[0][3]}% → ${it.mix[3][3]}%</p></div>
        <div><h4>재단 지원은 어떻게 기여했나</h4><div class="p-type"><span class="blob ${G[CTYPES.indexOf(it.ctype)]}">${s.k}</span><div><b>${it.ctype}</b><br>${s.def}</div></div>
          <div class="p-kv"><span>부 유형</span><div>${it.sub ? `${STORY[it.sub].k} ${it.sub}` : '해당 없음'}</div><span>기여 강도</span><div><b>${g.label}</b> · 계수 ${g.coef.toFixed(1)}</div><span>판정 근거</span><div>${g.ev}</div><span>병행 요인</span><div>${it.alts.join(' · ') || '확인된 요인 없음'}</div></div></div>
        <div><h4>세부기준 점수</h4><div class="p-bars">${CRIT.map((c, i) => pbar(c.replace(/ \(.*/, ''), it.scores[i], it.scores[i], d.color)).join('')}</div>
          <h4>영역 평균과 비교 <span style="letter-spacing:0;font-weight:500">· ${d.short} ${peers.length}건</span></h4>
          <div class="p-cmp">${cmp.map(([l, v, a, u]) => { const mx = Math.max(v, a) || 1, f = x => (Number.isInteger(x) ? x : x.toFixed(1)) + u; return `<div><span>${l}</span><i><em style="width:${v / mx * 100}%;background:${d.color}"></em><em style="width:${a / mx * 100}%;background:#C5CCD9"></em></i><b>${f(v)}<small> / ${f(a)}</small></b></div>`; }).join('')}</div></div>
      </div>

      <div class="p-three">
        <div><h4>발굴·검증</h4><div class="p-kv"><span>발굴 트랙</span><div>${TRACKS[it.track]}${it.track === 'both' ? ' · 핵심 후보' : ' · 추가 근거 확인'}</div><span>근거문헌</span><div>${it.ev}건 확인 ${it.ev >= 2 ? '(기준 충족)' : '(2건 이상 필요)'}</div><span>검증 단계</span><div>${STAGES.map((st, i) => `<em class="p-step ${i <= stageOf(it) ? 'on' : ''}">${st}</em>`).join('')}</div><span>시대 구간</span><div>${era.no} ${era.label} (${era.from}~${era.to})</div></div></div>
        <div><h4>함께한 연구자</h4>${people.map(p => `<div class="p-person"><span class="blob ${dom(p.domain).g}">${p.id.slice(2)}</span><div><b>${p.title}</b> · ${p.field}<br>${p.life[p.life.length - 1].stage} · 배출 인력 ${p.alumni}명 · 지원 ${p.years}년</div></div>`).join('') || '<p class="p-note">연계 후보 없음</p>'}</div>
        <div><h4>이야기의 흐름</h4><div class="p-arc">${s.arc.map((a, i) => `${i ? chev : ''}<b>${a}</b>`).join('')}</div><p class="p-note">핵심 질문 · “${s.q}”</p><p class="p-note">주요 근거 · ${s.ev}</p><p class="p-note">활용 양상 · ${USE_DESC[it.guide]}</p></div>
      </div>
      <footer><span>데이터 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터)</span><span>한국연구재단 | 한국외국어대학교</span></footer>
    </article>
    <div class="chips mt"><button class="btn" data-act="open" data-v="${it.id}">성과 상세 열기</button><button class="btn" data-act="sub" data-v="path">이 성과의 발전 경로도 보기</button><button class="btn" data-act="sub" data-v="map">확산 지도에서 보기</button></div>
  </section>`;
};

/* --- 카드 뉴스: 대표성과 10선·대표 연구자 10인 × 5장, 9:16 Remotion 모션그래픽 --- */
// 카드 뉴스 대상: 성과·연구자 각 50. 최종선정을 앞에 두고, 연구자는 성장 궤적이 충분한(4단계 이상) 사례를 먼저 놓는다
const CARD_N = 50;
const cardFit = it => it.kind === 'o' || (it.life.length >= 4 && !(it.domain === 'hs' && ['P4', 'P5'].includes(it.guide)));
const cardTop = k => (gc.top ||= {})[k] ||= [...LIST[k]].sort((a, b) => stageOf(b) - stageOf(a) || cardFit(b) - cardFit(a) || score(b) - score(a)).slice(0, CARD_N);
// 카드 5장의 장면 명세. cards-remotion.js가 type별로 그린다
const cardSpecs = (it, rank) => {
  const d = dom(it.domain), era = ERAS.find(e => e.id === it.era), no = String(rank).padStart(2, '0'), base = { color: d.color, ref: it.id };
  if (it.kind === 'o') {
    const s = STORY[it.ctype], g = GRADES[it.grade], span = it.path[3].year - it.path[0].year;
    const m = FACTORS.map((_, i) => Math.round(it.mix.reduce((a, x) => a + x[i], 0) / 4)); m[0] += 100 - m.reduce((a, b) => a + b, 0);
    return [
      { type: 'cover', kicker: `대표성과 50선 · ${no}`, title: it.title, sub: FEEL[it.guide], tags: [d.short, O_GUIDE[it.guide], `${it.region} 확산`] },
      { type: 'big', kicker: '이야기의 시작', big: it.path[0].year, unit: '년', title: `「${it.path[0].program}」 지원에서 출발했습니다`, sub: it.path[0].desc, note: `${era.no} ${era.label} · ${era.sys}` },
      { type: 'steps', kicker: '영향경로', title: `${span}년에 걸친 확산의 길`, steps: it.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i], desc: p.program })) },
      { type: 'nums', kicker: '숫자로 보기', title: '함께 만든 성과', nums: [{ v: span, u: '년', l: '확산 기간' }, { v: it.invest, u: '억', l: '실질 투입' }, { v: score(it), u: '점', l: '성과 점수' }, { v: it.people.length, u: '명', l: '연계 연구자' }], bar: m, barTitle: '누가 함께 만들었나', barLabels: FACTORS.map(f => f.label) },
      { type: 'end', kicker: '재단 지원의 기여', quote: FEEL[it.guide], lines: [`${s.k} ${it.ctype} · ${s.def}`, `${g.label} · ${g.def}`, USE_DESC[it.guide]], badge: s.arc.join(' → ') },
    ].map(c => ({ ...base, ...c }));
  }
  const n = it.life.length, ti = Math.min(it.turn, n - 1), first = it.outcomes.map(byId)[0];
  return [
    { type: 'cover', kicker: `대표 연구자 50인 · ${no}`, title: `${it.field} 연구자`, sub: FEEL[it.guide], tags: [d.short, P_GUIDE[it.guide], it.life[n - 1].stage] },
    { type: 'big', kicker: '첫 지원', big: it.y0, unit: '년', title: `「${it.life[0].program}」으로 시작했습니다`, sub: `${ROLES[0]}에서 출발한 연구 여정`, note: `${era.no} ${era.label} · ${era.sys}` },
    { type: 'steps', kicker: '성장 궤적', title: '생애주기를 따라 자란 연구자', steps: it.life.map((p, i) => ({ year: p.year, label: p.stage, desc: p.program, mark: i === ti && ti > 0 })) },
    { type: 'nums', kicker: '숫자로 보기', title: '지원이 키운 것', nums: [{ v: it.years, u: '년', l: '누적 지원' }, { v: it.grants, u: '건', l: '재단 지원 과제' }, { v: it.alumni, u: '명', l: '배출 인력' }, { v: it.papers, u: '편', l: '대표 논문·저서' }], note: it.gap ? `지원 공백 ${it.gap}년을 지나 다시 이어진 연구` : '단절 없는 후속 지원이 만든 성장' },
    { type: 'end', kicker: '다음 세대로', quote: FEEL[it.guide], lines: [`공동연구자 ${it.coauthors}명과 함께한 연구`, `배출 인력 ${it.alumni}명이 학계와 산업으로`, first ? `연계 대표 성과 · ${first.title}` : '연계 대표 성과 발굴 중'], badge: `${ROLES[0]} → ${ROLES[n - 1]}` },
  ].map(c => ({ ...base, ...c }));
};
// Remotion을 불러오기 전이나 불러오지 못했을 때 보이는 정지 카드
const cardStill = (c, i) => `<div class="ccard"><div class="cstill" style="background:linear-gradient(162deg,${c.color} 0%,${c.color} 22%,#27365A 82%)"><small>대한민국 연구 50년 · ${i + 1}/5</small><span>${c.kicker}</span>
  <h3>${c.type === 'big' ? `${c.big}${c.unit}` : c.title || c.quote}</h3><p>${c.type === 'cover' ? c.sub : c.type === 'big' ? c.title : c.type === 'steps' ? c.steps.map(s => `${s.year} ${s.label}`).join('<br>') : c.type === 'nums' ? c.nums.map(x => `${x.l} ${x.v}${x.u}`).join('<br>') : c.lines.join('<br>')}</p><em>${c.ref} · 예시 데이터</em></div></div>`;
const cardItem = () => { const all = [...cardTop('o'), ...cardTop('p')]; return all.find(x => x.id === state.card) || all[0]; };
const gc = {};
const CARD_NAMES = ['표지', '시작', '경로', '숫자로보기', '기여와메시지'];
// items의 카드를 PNG로 그려 ZIP Blob을 만든다. onStep(done, total)로 진행 상황을 알린다
const buildCardZip = async (items, onStep = () => {}, jpg = false) => {
  await Promise.all(['400', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Pretendard`))).catch(() => {});
  const files = [], total = items.length * 5; let done = 0;
  for (const it of items) {
    const rank = cardTop(it.kind).findIndex(x => x.id === it.id) + 1, no = String(rank).padStart(2, '0');
    const name = (it.kind === 'o' ? it.title : `${it.field}-연구자`).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
    const dir = `${it.kind === 'o' ? '대표성과' : '대표연구자'}_${no}_${name}`, specs = cardSpecs(it, rank);
    for (let i = 0; i < specs.length; i++) {
      files.push({ name: `${dir}/${i + 1}_${CARD_NAMES[i]}.${jpg ? 'jpg' : 'png'}`, data: await cardImage(specs[i], i, jpg) });
      onStep(++done, total); await new Promise(r => setTimeout(r));
    }
  }
  files.push({ name: '안내.txt', data: new TextEncoder().encode(`대한민국 연구 50년 · 카드 뉴스\r\n\r\n규격: 세로형 9:16 (1080 x 1920) ${jpg ? 'JPG' : 'PNG'}, 세트당 5장\r\n구성: 1 표지 / 2 시작 / 3 경로 / 4 숫자로 보기 / 5 기여와 메시지\r\n수록: ${items.length}세트 ${total}장\r\n\r\n수치와 후보는 시연용 예시 데이터이며 실제 선정 결과가 아닙니다.\r\n연구자는 익명 처리해 분야로 표기했습니다.\r\n\r\n한국연구재단 | 한국외국어대학교\r\n`) });
  return zipStore(files);
};
const mountCards = () => {
  gc.un?.(); gc.un = null;
  const el = $('#cardstage'); if (!el) return;
  const it = cardItem(), specs = cardSpecs(it, cardTop(it.kind).findIndex(x => x.id === it.id) + 1);
  import('./cards-remotion.js').then(m => { if (el.isConnected) gc.un = m.mount(el, specs); }).catch(() => { const n = $('#cardnote'); if (n) n.textContent = '모션그래픽 모듈을 불러오지 못해 정지 카드로 표시합니다.'; });
};
OUT.cards = () => {
  const it = cardItem(), k = it.kind, rank = cardTop(k).findIndex(x => x.id === it.id) + 1, specs = cardSpecs(it, rank);
  const pick = kk => `<div class="chips cardpick">${cardTop(kk).map((x, i) => `<button class="chip ${x.id === it.id ? 'on' : ''}" data-act="card" data-v="${x.id}"><i style="background:${dom(x.domain).color}"></i>${String(i + 1).padStart(2, '0')} ${kk === 'o' ? x.title : `${x.field} 연구자`}</button>`).join('')}</div>`;
  return `
  ${slide('카드 뉴스 <b>구성안</b>', info([['유형', '<span class="tag">성과 중심</span> <span class="tag">인물 중심</span>'], ['규격', '세로형 9:16 (1080 × 1920) · 장당 6초 반복 모션그래픽'], ['수량', '대표성과 50선 × 5장 + 대표 연구자 50인 × 5장 = <b>500장</b>'], ['5장 구성', '① 표지 → ② 시작(첫 지원) → ③ 경로(영향경로·성장 궤적) → ④ 숫자로 보기 → ⑤ 기여와 메시지'], ['제작 방식', 'Remotion 컴포지션 5종(표지·큰 숫자·단계·숫자판·맺음)에 연계 DB 값을 넣어 일괄 생성'], ['활용처', '인스타그램·유튜브 쇼츠·카카오 채널 등 세로형 SNS, 웹플랫폼 성과관·인물관, 50주년 전시']]) +
    '<p class="mute sm mt">대상은 성과·연구자 각 50으로, 최종선정을 앞에 두고 나머지는 성과 점수 순으로 채웠습니다. 수치는 시연용 예시이며, 연구자는 익명 처리해 분야로 표기합니다.</p>')}
  ${slide('대표성과 <b>50선</b>', pick('o'))}
  ${slide('대표 연구자 <b>50인</b>', pick('p'))}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:6px"><h2 style="flex:1 1 260px">${k === 'o' ? '대표성과' : '대표 연구자'} ${String(rank).padStart(2, '0')} · <b>${k === 'o' ? it.title : `${it.field} 연구자`}</b></h2>
      <button class="btn" data-act="cardstep" data-v="-1">← 이전</button><button class="btn" data-act="cardstep" data-v="1">다음 →</button><button class="btn" data-act="open" data-v="${it.id}">상세 열기</button></div>
    <div class="chips" style="margin:6px 0 10px"><button class="btn pri" data-act="cardzip" data-v="one">이 세트 ZIP 내려받기 (PNG 5장)</button><button class="btn" data-act="cardzip" data-v="o">대표성과 50선 ZIP (JPG 250장)</button><button class="btn" data-act="cardzip" data-v="p">대표 연구자 50인 ZIP (JPG 250장)</button><button class="btn" data-act="cardzip" data-v="all">전체 ZIP (JPG 500장)</button></div>
    <p class="mute sm" id="cardnote">카드를 누르면 멈추거나 다시 재생됩니다. ZIP에는 각 카드의 완성 장면이 1080×1920 이미지로 담깁니다. 50선·50인·전체 묶음은 용량을 줄이려고 JPG로 만들며, 전체는 수십 초가 걸립니다.</p>
    <div class="cardrow" id="cardstage">${specs.map(cardStill).join('')}</div>
    <div class="cardcap">${['표지', '시작', '경로', '숫자로 보기', '기여와 메시지'].map((l, i) => `<span><b>${i + 1}</b> ${l}</span>`).join('')}</div>
    ${foot('카드 뉴스')}
  </section>`;
};

R.outreach = () => `<div class="chips subtabs">${SUBS.map(([v, l, t]) => `<button class="chip ${state.sub === v ? 'on' : ''}" data-act="sub" data-v="${v}">${l}</button>`).join('')}</div>${OUT[state.sub]()}`;

/* ---------- 상세 ---------- */
const info = rows => `<div class="info">${rows.map(([k, v]) => `<span>${k}</span><div>${v}</div>`).join('')}</div>`;
const evTag = it => `<span class="tag ${it.ev >= 2 ? 'ok' : 'no'}">근거문헌 ${it.ev}건 ${it.ev >= 2 ? '확인' : '· 2건 이상 필요'}</span>`;
const media = (a, b) => `<div class="chips mt" style="gap:8px">${[a, 'AI 모션그래픽 영상 1~2분', '1장형 인포그래픽', b].map(x => `<span class="tag">${x} · 제작 예정</span>`).join('')}</div>`;
// 사제·공동연구 네트워크 약식 도해: 안쪽 고리는 배출 인력, 바깥 고리는 공동연구자
const netSvg = it => {
  const ring = (n, rad, col) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + rad / 40, x = 150 + Math.cos(a) * rad, y = 105 + Math.sin(a) * rad * .78; return `<line x1="150" y1="105" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#D5DAE4"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad > 70 ? 5 : 7}" fill="${col}"/>`; }).join('');
  return `<svg class="chart" viewBox="0 0 300 210" role="img" aria-label="사제·공동연구 네트워크 도해" style="max-width:340px;margin:auto">${ring(Math.min(16, Math.round(it.coauthors / 6)), 96, '#3D9FE6')}${ring(Math.min(12, Math.round(it.alumni / 10)), 56, '#F6A53A')}<circle cx="150" cy="105" r="15" fill="#EC5C8D" stroke="#fff" stroke-width="3"/></svg>`;
};

// 영향경로 분석: 단계 간 시차, 기여 비중 변화, 지식 확산 연결망 지표(예시)를 한 구역으로 묶는다
const pathStats = o => {
  const r = rng(+o.id.slice(2) * 71 + 3), soft = o.domain === 'hs';
  return { follow: 3 + Math.floor(r() * 12), cites: 120 + Math.floor(r() * 2300), patents: soft ? Math.floor(r() * 3) : 2 + Math.floor(r() * 38), transfer: soft ? Math.floor(r() * 2) : Math.floor(r() * 9), orgs: 3 + Math.floor(r() * 18) };
};
const pathAnalysis = it => {
  const d = dom(it.domain), yrs = it.path.map(p => p.year), lags = [yrs[1] - yrs[0], yrs[2] - yrs[1], yrs[3] - yrs[2]], span = yrs[3] - yrs[0] || 1, keep = 2026 - yrs[3];
  const peers = OUTCOMES.filter(o => o.domain === it.domain), avg = Math.round(peers.reduce((a, o) => a + o.path[3].year - o.path[0].year, 0) / peers.length);
  const li = lags.indexOf(Math.max(...lags)), gov = it.mix.map(m => m[0]), ind = it.mix.map(m => m[3]), cross = it.mix.findIndex(m => m[3] > m[0]), st = pathStats(it), era = ERAS.find(e => e.id === it.era);
  // 정부 지원·민간 투자 비중 추이 꺾은선
  const W = 360, H = 150, x = i => 34 + i * (W - 60) / 3, y = v => 14 + (H - 44) * (1 - v / 80);
  const line = (a, c) => `<polyline points="${a.map((v, i) => `${x(i)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${a.map((v, i) => `<circle cx="${x(i)}" cy="${y(v).toFixed(1)}" r="4.5" fill="#fff" stroke="${c}" stroke-width="2.5"/><text x="${x(i)}" y="${(y(v) - 9).toFixed(1)}" text-anchor="middle" style="fill:${c};font-weight:700">${v}</text>`).join('')}`;
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="단계별 정부 지원·민간 투자 비중 추이" style="margin-top:6px">
    ${[0, 40, 80].map(v => `<line x1="28" x2="${W - 14}" y1="${y(v)}" y2="${y(v)}" stroke="#DCE1EA"/><text x="24" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    ${line(gov, FACTORS[0].color)}${line(ind, FACTORS[3].color)}
    ${PATH_STAGES.map((s, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${i + 1}. ${s.split('·')[0]}</text>`).join('')}</svg>`;
  const find = [
    `<b>총 확산 기간 ${span}년</b> — ${d.short} 영역 평균 ${avg}년보다 ${span === avg ? '같은 수준' : `${Math.abs(span - avg)}년 ${span < avg ? '빠름' : '김'}`}`,
    `<b>최장 구간</b>은 ${PATH_STAGES[li]} → ${PATH_STAGES[li + 1]} ${lags[li]}년(전체의 ${Math.round(lags[li] / span * 100)}%) — 후속 지원 연계가 확산 속도를 좌우한 구간`,
    `<b>정부 지원 비중</b> ${gov[0]}% → ${gov[3]}%, <b>민간 투자</b> ${ind[0]}% → ${ind[3]}% — ${cross < 0 ? '전 단계에서 정부 지원이 우위' : `${cross + 1}단계(${PATH_STAGES[cross]})에서 민간 투자가 정부 지원을 넘어섬`}`,
    `<b>재단 직접 지원 구간</b>은 1~2단계(${yrs[0]}~${yrs[2]}, ${yrs[2] - yrs[0]}년) — ${STORY[it.ctype].def}`,
    keep > 0 ? `활용 단계 진입 후 <b>${keep}년째 지속</b> — 파급 범위·지속성 기준(C3)의 ${keep >= 10 ? '10년 이상 지속 활용 요건 충족' : '지속 활용 관측 중'}` : '활용 단계 진입 직후로 지속성 관측 필요',
    ...(it.era === 'e5' || it.era === 'e4' ? [`<b>${era.label}</b> 출발 성과로 관측 기간이 짧아 시차 보정 점수 적용 대상`] : []),
  ];
  return `<div class="sec"><h3>영향경로 분석</h3><p class="mute sm">성과 사슬 연결(S2)과 네트워크·계량 분석으로 본 단계 간 시차와 기여 구조 · 수치는 예시</p>
    <div class="lagbar">${lags.map((n, i) => `<div style="flex:${Math.max(n, 1)}" class="${G[(i + 3) % 4]}"><b>${n}년</b><small>${PATH_STAGES[i].split('·')[0]} → ${PATH_STAGES[i + 1].split('·')[0]}</small></div>`).join('')}${keep > 0 ? `<div style="flex:${keep}" class="keep"><b>${keep}년</b><small>활용 지속</small></div>` : ''}</div>
    <div class="lagaxis">${yrs.map((v, i) => `<span style="flex:${i < 3 ? Math.max(lags[i], 1) : Math.max(keep, 0.001)}">${v}</span>`).join('')}<span style="flex:0">2026</span></div>
    <div class="row c2" style="margin:18px 0 0;gap:22px">
      <div><h4 class="h4">단계별 기여 비중 추이 (%)</h4>${chart}${legend([FACTORS[0], FACTORS[3]])}</div>
      <div><h4 class="h4">분석 결과</h4><ul class="bul find">${find.map(f => `<li>${f}</li>`).join('')}</ul></div>
    </div>
    <h4 class="h4" style="margin-top:18px">지식 확산 연결망</h4>
    <div class="row c5" style="margin:10px 0 0;gap:12px">${[[st.follow, '건', '과제-후속과제 연결'], [st.cites.toLocaleString(), '편', '인용 계보 논문'], [st.patents, '건', '특허·표준'], [st.transfer, '건', '기술이전·사업화'], [st.orgs, '곳', '공저·참여 기관']].map(([n, u, l]) => `<div class="tile" style="padding:12px 14px"><div class="n" style="font-size:20px">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
    <p class="mute sm mt">인용·공저 네트워크와 과제-후속과제 연결망으로 지식 확산 경로와 핵심기반 기여를 실증하고, 지원 시점과 성과 도달 시점의 시차를 생애주기 지원 정책의 근거로 활용합니다.</p></div>`;
};

// 성장경로 분석: 단계별 체류 기간, 전환점 전후 성과 변화, 연속성·확산 지표(예시)를 한 구역으로 묶는다
const growthStats = p => {
  const r = rng(+p.id.slice(2) * 89 + 11), n = p.life.length, ti = Math.min(p.turn, n - 1);
  const out = p.life.map((_, i) => Math.round([6, 18, 40, 68, 88][i] * (.8 + r() * .4) * (i >= ti && ti > 0 ? 1.3 : 1)));
  return { ti, out, alum: p.life.map((_, i) => Math.round([0, 8, 30, 70, 100][i] * (i === n - 1 ? 1 : .85 + r() * .15))), dur: p.life.map((s, i) => (i + 1 < n ? p.life[i + 1].year : 2026) - s.year) };
};
const growthAnalysis = it => {
  const d = dom(it.domain), n = it.life.length, st = growthStats(it), ti = st.ti, turn = it.life[ti], before = it.life[Math.max(0, ti - 1)], last = it.life[n - 1];
  const peers = PEOPLE.filter(p => p.domain === it.domain), lead = peers.filter(p => p.life.length >= 4), avgLead = lead.length ? Math.round(lead.reduce((a, p) => a + p.life[3].year - p.y0, 0) / lead.length) : 0;
  const step = n > 1 ? ((last.year - it.y0) / (n - 1)).toFixed(1) : '—', mv = peers.filter(p => p.life.length > 1), avgStep = (mv.reduce((a, p) => a + (p.life[p.life.length - 1].year - p.y0) / (p.life.length - 1), 0) / (mv.length || 1)).toFixed(1);
  const jump = ti > 0 ? (st.out[ti] / Math.max(1, st.out[ti - 1])).toFixed(1) : null, mx = Math.max(100, ...st.out);
  const W = 360, H = 150, x = i => 34 + i * (W - 60) / 4, y = v => 14 + (H - 44) * (1 - v / mx);
  const line = (a, c) => `<polyline points="${a.map((v, i) => `${x(i)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${a.map((v, i) => `<circle cx="${x(i)}" cy="${y(v).toFixed(1)}" r="4.5" fill="#fff" stroke="${c}" stroke-width="2.5"/><text x="${x(i)}" y="${(y(v) - 9).toFixed(1)}" text-anchor="middle" style="fill:${c};font-weight:700">${v}</text>`).join('')}`;
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="생애주기 단계별 성과 지수와 누적 배출 인력" style="margin-top:6px">
    ${[0, 50, 100].map(v => `<line x1="28" x2="${W - 14}" y1="${y(v)}" y2="${y(v)}" stroke="#DCE1EA"/><text x="24" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    ${ti > 0 ? `<line x1="${x(ti)}" x2="${x(ti)}" y1="10" y2="${H - 30}" stroke="#EC5C8D" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${x(ti) + 5}" y="18" style="fill:#EC5C8D;font-weight:700">전환점</text>` : ''}
    ${line(st.alum, '#F6A53A')}${line(st.out, d.color)}
    ${LIFE.map((s, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" ${i < n ? '' : 'opacity=".4"'}>${i + 1}. ${s.split(' ')[0].split('·')[0]}</text>`).join('')}</svg>`;
  const find = [
    ti > 0 ? `<b>전환점 ${turn.year}년</b> ${turn.stage} 진입 — 직전 지원 「${before.program}」 이후 성과 지수 ${st.out[ti - 1]} → ${st.out[ti]} (${jump}배)` : `<b>전환점</b> 식별 전 — 첫 단계 진행 중`,
    it.gap ? `<b>연속성</b> 지원 공백 ${it.gap}년 확인 — 공백 직후 단계 이동 지연 여부 인터뷰 확인 대상` : `<b>연속성</b> 단절 없는 후속 지원 — 누적 ${it.years}년, 과제 ${it.grants}건`,
    `<b>단계 이동 속도</b> 평균 ${step}년 — ${d.short} 영역 평균 ${avgStep}년`,
    n >= 4 ? `<b>리더 연구자 도달</b> 첫 지원 후 ${it.life[3].year - it.y0}년 — 영역 평균 ${avgLead}년보다 ${it.life[3].year - it.y0 === avgLead ? '같은 수준' : `${Math.abs(it.life[3].year - it.y0 - avgLead)}년 ${it.life[3].year - it.y0 < avgLead ? '빠름' : '김'}`}` : `<b>현재 ${last.stage}</b> 단계 — 5단계 중 ${n}단계 도달, 후속 지원 연계 관찰 대상`,
    `<b>확산</b> 배출 인력 ${it.alumni}명 · 공동연구자 ${it.coauthors}명 · 연계 대표 성과 ${it.outcomes.length}건`,
    `<b>역할 변화</b> ${ROLES[0]} → ${ROLES[n - 1]}`,
  ];
  return `<div class="sec"><h3>성장경로 분석</h3><p class="mute sm">지원 이력 × 성과 이력 × 역할 변화를 시계열로 결합한 전환점·연속성·확산 분석 · 수치는 예시</p>
    <div class="lagbar">${st.dur.map((v, i) => `<div style="flex:${Math.max(v, 1)}" class="${G[i % 4]}"><b>${v}년</b><small>${it.life[i].stage}${i === ti && ti > 0 ? ' · 전환점' : ''}</small></div>`).join('')}</div>
    <div class="lagaxis">${it.life.map((s, i) => `<span style="flex:${Math.max(st.dur[i], 1)}">${s.year}</span>`).join('')}<span style="flex:0">2026</span></div>
    <div class="row c3" style="margin:16px 0 0;gap:14px">${[['전환점 분석', ti > 0 ? `${turn.year}<small> 년</small>` : '—', ti > 0 ? `${turn.stage} 진입 · 성과 지수 ${jump}배` : '식별 전'], ['연속성 분석', it.gap ? `${it.gap}<small> 년 공백</small>` : `${it.years}<small> 년 연속</small>`, it.gap ? '지원 공백의 영향 확인 필요' : '단절 없는 후속 지원'], ['확산 분석', `${it.alumni + it.coauthors}<small> 명</small>`, `배출 인력 ${it.alumni} · 공동연구자 ${it.coauthors}`]].map(([h, v, l]) => `<div class="tile" style="padding:14px 16px"><div class="l" style="font-weight:700">${h}</div><div class="n" style="font-size:24px">${v}</div><div class="l">${l}</div></div>`).join('')}</div>
    <div class="row c2" style="margin:18px 0 0;gap:22px">
      <div><h4 class="h4">단계별 성과 지수와 누적 배출 인력 (지수)</h4>${chart}${legend([{ label: '연구 성과 지수', color: d.color }, { label: '누적 배출 인력(현재=100)', color: '#F6A53A' }])}</div>
      <div><h4 class="h4">분석 결과</h4><ul class="bul find">${find.map(f => `<li>${f}</li>`).join('')}</ul></div>
    </div>
    <p class="mute sm mt">전환점 분석으로 성장이 가속된 시점과 직전 지원 사업을 식별하고, 연속성 분석으로 단절 없는 후속 지원의 효과를, 확산 분석으로 제자·공동연구자 네트워크의 확장을 확인해 생애주기별 지원체계 개선의 근거로 씁니다.</p></div>`;
};

const detail = it => {
  const d = dom(it.domain), o = it.kind === 'o', guides = o ? O_GUIDE : P_GUIDE, g = GRADES[it.grade], s = o ? STORY[it.ctype] : null;
  const era = ERAS.find(e => e.id === it.era), links = (o ? it.people : it.outcomes).map(byId);
  const m = o ? [[score(it), '점', '성과 점수'], [g.coef.toFixed(1), '', g.label], [it.invest, '억', '실질 투입(2025년 기준)'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']]
    : [[it.grants, '건', '재단 지원과제'], [it.years, '년', '누적 지원기간'], [it.alumni, '명', '배출 인력'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']];
  const head = `<div class="panel-head">
      <div class="blob ${d.g}">${d.short}</div>
      <div><div class="mute sm">${it.id} · ${d.label}</div><h2>${it.title}${o ? '' : ` · ${it.field}`}</h2>
        <div class="chips" style="gap:6px;margin-top:8px">${pill(it)}<span class="tag">${guides[it.guide]}</span>${o ? `<span class="tag">${s.k} ${it.ctype}</span>` : ''}<span class="tag">${g.label}</span>${evTag(it)}</div></div>
      <button class="x" data-act="close" aria-label="닫기">✕</button>
    </div>
    <div class="row c4 sec" style="margin-bottom:0;gap:16px">${m.map(([n, u, l]) => `<div class="tile"><div class="n">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div>`;
  const scores = `<h3>세부기준 점수 <span class="mute">· 종합 ${score(it)}</span></h3>
        ${CRIT.map((l, i) => `<div class="kv" style="grid-template-columns:150px 1fr 34px"><span>${l}</span><div class="bar"><span style="width:${it.scores[i]}%;background:${d.color}"></span></div><b>${it.scores[i]}</b></div>`).join('')}
        <p class="sm mt">${trackDots(it)} <span class="mute">· ${it.track === 'both' ? '핵심 후보(두 트랙 공통)' : '추가 근거 확인 대상'}</span></p>`;
  const tail = `<div class="sec"><h3>${o ? '연계 연구자' : '연계 대표 성과'}</h3><div class="chips mt">${links.map(l => `<button class="chip" data-act="open" data-v="${l.id}">${l.kind === 'p' ? `${l.title} · ${l.field}` : l.title}</button>`).join('') || '<span class="mute sm">연계 후보 없음</span>'}</div></div>
    <div class="sec"><h3>검증 단계 지정</h3><div class="chips mt">${STAGES.map((st, i) => `<button class="btn ${stageOf(it) === i ? 'on' : ''}" data-act="stage" data-v="${i}" data-id="${it.id}">${st}</button>`).join('')}</div></div>`;

  if (o) {
    const span = it.path[3].year - it.path[0].year;
    return `<div class="panel" role="dialog" aria-modal="true" aria-label="${esc(it.title)}">${head}
    <div class="sec"><h3>1. 성과 개요</h3>${info([['발굴 유형', guides[it.guide]], ['지원 영역', d.label], ['출발 시기', `${era.no} ${era.label} · ${it.path[0].year}년 첫 지원`], ['확산 기간', `${span}년 (${it.path[0].year} → ${it.path[3].year})`], ['확산 권역', it.region], ['활용 양상', USE_DESC[it.guide]]])}</div>
    <div class="sec"><h3>2. 지원 이력 · 3. 영향경로</h3><p class="mute sm">현재의 활용 단계에서 초기 지원 과제까지 역추적한 경로 (지원사업 연계 기술·학술 발전 경로도)</p>
      <div class="flow">${it.path.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</div><div class="yr">${p.year}</div><h4>${PATH_STAGES[i]}</h4><p><b>${p.program}</b><br>${p.desc}</p></div>`).join('')}</div>
      ${tbl(['단계', '시기', '지원 사업', '연구 주체', '주요 산출물'], it.path.map((p, i) => [PATH_STAGES[i], p.year, p.program, PATH_ACTOR[i], PATH_OUT[i]]))}</div>
    ${pathAnalysis(it)}
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>4. 기여 유형·강도</h3>${info([['주 유형', `${s.k} ${it.ctype}`], ['부 유형', it.sub ? `${STORY[it.sub].k} ${it.sub}` : '<span class="mute">해당 없음</span>'], ['기여 강도', `${g.label} · 계수 ${g.coef.toFixed(1)}`], ['판정 근거(예)', g.ev], ['대안 설명', it.alts.map(a => `<span class="tag">${a}</span>`).join(' ') || '<span class="mute">확인된 병행 요인 없음</span>']])}</div>
      <div><h3>단계별 기여 구성</h3>${it.mix.map((mm, i) => `<div class="srow" style="grid-template-columns:100px 1fr"><span class="sm">${PATH_STAGES[i]}</span>${stack(mm)}</div>`).join('')}${legend(FACTORS)}</div>
    </div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>5. 국민 체감 포인트</h3><div class="story"><b>${FEEL[it.guide]}</b><br><span class="mute">국민 눈높이의 용어로 생활 속 접점을 제시합니다.</span></div></div>
      <div><h3>6. 연구자 인터뷰 발췌</h3><div class="story"><span class="mute">심층 인터뷰(20인 내외) 대상 확정 후 수록합니다. 문항: 연구 출발과 첫 지원, 전환점, 지원이 만든 차이와 대안 요인.</span></div></div>
    </div>
    <div class="sec"><h3>스토리텔링 모델 · ${s.k} ${it.ctype}</h3><div class="story"><b>${s.arc.join(' → ')}</b><br>핵심 질문: ${s.q}<br><span class="mute">주요 근거: ${s.ev}</span></div>${media('심층 사례 원고', '대표성과 백서 수록')}</div>
    <div class="sec">${scores}</div>${tail}</div>`;
  }

  const last = it.life[it.life.length - 1], turn = it.life[Math.min(it.turn, it.life.length - 1)], before = it.life[Math.max(0, Math.min(it.turn, it.life.length - 1) - 1)];
  return `<div class="panel" role="dialog" aria-modal="true" aria-label="${esc(it.title)}">${head}
    <div class="sec"><h3>기본 정보</h3>${info([['분야', `${it.field} · ${d.label}`], ['발굴 유형', guides[it.guide]], ['현재 단계', last.stage], ['대표 키워드', `<span class="tag">${it.field}</span> <span class="tag">${d.short}</span> <span class="tag">${era.label} 첫 지원</span>`], ['공개 동의', it.consent ? '<span class="tag ok">동의 완료</span> 웹플랫폼·백서 활용 범위 안내' : '<span class="tag no">동의 진행 중</span> 동의 전에는 익명 표기'], ['성명·소속', '<span class="mute">공개 동의 범위 내에서 표기 (예시 데이터는 익명 ID)</span>']])}</div>
    <div class="sec"><h3>성장 궤적 · 연구자 생애주기 성장 흐름도</h3><p class="mute sm">지원 이력 × 성과 이력 × 역할 변화를 시계열로 결합</p>
      <div class="flow">${it.life.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[i % 4]} b${i % 3 + 1}" style="width:${56 + i * 7}px;height:${52 + i * 7}px">${i + 1}</div><div class="yr">${p.year}${p === turn ? ' · 전환점' : ''}</div><h4>${p.stage}</h4><p><b>${p.program}</b><br>${p.out}</p></div>`).join('')}</div></div>
    <div class="sec"><h3>지원 이력</h3>${tbl(['지원 단계', '시기', '사업(유형 예시)', '역할', '주요 산출'], it.life.map((p, i) => [p.stage, `${p.year}~`, p.program, ROLES[i], p.out]))}</div>
    ${growthAnalysis(it)}
    <div class="sec"><h3>성과 이력</h3><div class="row c5" style="margin:12px 0 0;gap:14px">${[[it.papers, '편', '대표 논문·저서'], [it.patents, '건', '특허·기술이전'], [it.awards, '회', '수상'], [it.startup ? '있음' : '—', '', '창업'], [it.policy, '건', '정책·자문 활동']].map(([n, u, l]) => `<div class="tile"><div class="n" style="font-size:22px">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div></div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>기여 강도 · ${g.label}</h3><div class="story">${g.def}<br><span class="mute">판정 근거(예): ${g.ev}</span></div></div>
      <div><h3>확산 네트워크 · 사제·공동연구</h3>${netSvg(it)}${legend([{ label: '대표 연구자', color: '#EC5C8D' }, { label: `배출 인력 ${it.alumni}명`, color: '#F6A53A' }, { label: `공동연구자 ${it.coauthors}명`, color: '#3D9FE6' }])}<p class="mute sm mt">점의 수는 규모를 줄여 나타낸 약식 도해입니다.</p></div>
    </div>
    <div class="sec"><h3>사례 콘텐츠</h3>${info([['국민 체감 메시지', `<b>${FEEL[it.guide]}</b>`], ['인터뷰 요지', '<span class="mute">심층 인터뷰 후 수록 · 연구 출발과 첫 지원, 성장의 전환점, 후속세대 양성, 정책 제언</span>'], ['대표 일화', '<span class="mute">생애사 중심 원고 작성 시 대상 연구자 사실 확인을 거쳐 수록</span>']])}${media('생애사 사례 원고', '대표 연구자 50인 백서 수록')}</div>
    <div class="sec">${scores}</div>${tail}</div>`;
};

/* ---------- 렌더·이벤트 ---------- */
const render = () => {
  const i = VIEWS.findIndex(v => v.id === state.view), v = VIEWS[i];
  if (v.kind) state.kind = v.kind;
  $('#nav').innerHTML = VIEWS.map((q, j) => `<button class="nav-item ${q.id === v.id ? 'on' : ''}" data-act="nav" data-v="${q.id}"><span class="nav-ic ${G[j % 4]}">0${j + 1}</span>${q.t.join(' ')}</button>${q.id === 'outreach' ? `<div class="nav-subs">${SUBS.map(([sv, sl]) => `<button class="nav-sub ${v.id === 'outreach' && state.sub === sv ? 'on' : ''}" data-act="nav" data-v="outreach:${sv}">${sl}</button>`).join('')}</div>` : ''}`).join('');
  $('#main').innerHTML = `<header class="page-head"><div><div class="dots"><i></i><i></i><i></i></div><h1>${v.t[0]} <b>${v.t[1]}</b></h1><p>${v.id === 'outreach' && state.sub !== 'plan' ? `<b style="color:var(--ink)">${SUBS.find(x => x[0] === state.sub)[1]}</b> · ${SUBS.find(x => x[0] === state.sub)[2]} ${state.sub === 'cards' ? '확산 콘텐츠' : '시각화 자료 예제'}` : v.sub}</p></div><div class="badge-no"><span>0${i + 1}</span></div></header>${R[v.id]()}
    <footer class="site-foot"><div class="dots sm"><i></i><i></i><i></i></div>한국연구재단 <span>|</span> 한국외국어대학교(연구책임자: 박정원 교수)</footer>`;
  renderGrid(); renderRank(); mountMap(); mountGraph(); mountCards();
};
const openModal = id => { const m = $('#modal'); m.innerHTML = detail(byId(id)); m.hidden = false; };
const closeModal = () => { $('#modal').hidden = true; };

const ACT = {
  nav: v => { const [a, b] = v.split(':'); state.view = a; if (a === 'outreach') state.sub = b || 'plan'; closeModal(); render(); window.scrollTo(0, 0); },
  sub: v => { state.sub = v; render(); window.scrollTo(0, 0); },
  region: v => { state.region = v; render(); },
  card: v => { state.card = v; render(); },
  cardzip: async (v, t) => {
    if (gc.busy) return; gc.busy = true;
    const label = t.textContent, items = v === 'one' ? [cardItem()] : v === 'all' ? [...cardTop('o'), ...cardTop('p')] : cardTop(v);
    try {
      const blob = await buildCardZip(items, (d, n) => { t.textContent = `만드는 중 ${d}/${n}`; }, v !== 'one');
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = { one: `카드뉴스_${items[0].id}.zip`, o: '카드뉴스_대표성과50선.zip', p: '카드뉴스_대표연구자50인.zip', all: '카드뉴스_대표성과50선_대표연구자50인.zip' }[v]; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      t.textContent = '내려받기 완료';
    } catch (e) { t.textContent = '만들기 실패'; console.error(e); }
    gc.busy = false; setTimeout(() => { if (t.isConnected) t.textContent = label; }, 2500);
  },
  cardstep: v => { const all = [...cardTop('o'), ...cardTop('p')], i = all.findIndex(x => x.id === cardItem().id); state.card = all[(i + +v + all.length) % all.length].id; render(); },
  gshow: v => { gx.show[v] = !gx.show[v]; render(); },
  gtype: v => { gx.types[v] = !gx.types[v]; render(); },
  gdom: v => { gx.domain = v; render(); },
  gscope: v => { gx.scope = v; render(); },
  gcolor: v => { gx.color = v; render(); },
  gsizem: v => { gx.size = v; render(); },
  gsel: v => { gx.sel = v || null; gx.path = null; gx.pathMode = false; const n = gx.V.find(x => x.id === v); if (n) { const k = Math.max(gx.tf.k, 1.25); gx.auto = false; gx.cam = { k, x: -n.x * k, y: -n.y * k }; } gHl(); gPanel(); },
  gdepth: v => { gx.depth = +v; gHl(); gPanel(); },
  gpathmode: () => { gx.pathMode = !gx.pathMode; gPanel(); },
  gclear: () => { gx.path = null; gHl(); gPanel(); },
  gfit: () => { gx.auto = false; gx.cam = gFitTarget(); },
  grelayout: () => { gx.pos = {}; gx.tf = { x: 0, y: 0, k: 1 }; gx.year = 2026; gx.playing = false; render(); },
  gplay: () => { if (!gx.playing && gx.vy >= 2026) { gx.V = []; gx.vy = null; gSetYear(1977, true); } gx.playing = !gx.playing; gx.auto = true; gBtn(); },
  gfull: () => { const w = $('.graph-wrap'); document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen?.(); },
  gpng: () => { const a = document.createElement('a'); a.href = gx.cv.toDataURL('image/png'); a.download = 'research-network.png'; a.click(); },
  focus: v => { const m = (gm.marks || []).find(x => x.oid === v); if (m) { gm.map.panTo(m.getPosition()); google.maps.event.trigger(m, 'click'); } else openModal(v); },
  jump: v => document.getElementById(v)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  era: v => { state.era = v; render(); },
  kind: v => { state.kind = v; render(); },
  scope: v => { state.scope = v; render(); },
  rankby: v => { state.rankBy = v; render(); },
  domain: v => { state.f[state.kind].domain = v; render(); },
  open: openModal, close: closeModal,
  stage: (v, t) => { state.status[t.dataset.id] = +v; store.set('nrf50.status', state.status); gc.top = null; render(); openModal(t.dataset.id); },
  resetw: () => { state.w[state.kind] = [25, 25, 25, 25]; render(); },
  print: () => window.print(),
  export: () => {
    const pack = k => selected(k).map(it => ({ id: it.id, title: it.title, field: it.field, domain: dom(it.domain).label, type: (k === 'o' ? O_GUIDE : P_GUIDE)[it.guide], score: score(it), grade: GRADES[it.grade].label, roiIndex: +roi(it).toFixed(1), track: TRACKS[it.track] }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ outcomes: pack('o'), researchers: pack('p') }, null, 2)], { type: 'application/json' }));
    a.download = 'nrf50-selection.json'; a.click(); URL.revokeObjectURL(a.href);
  },
};
document.addEventListener('click', e => {
  if (e.target.id === 'modal') return closeModal();
  const t = e.target.closest('[data-act]');
  if (t) ACT[t.dataset.act](t.dataset.v, t);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.w !== undefined) { state.w[state.kind][+t.dataset.w] = +t.value; $('#w' + t.dataset.w).textContent = t.value; renderRank(); }
  else if (t.dataset.q !== undefined) { state.f[state.kind].q = t.value; renderGrid(); }
  else if (t.dataset.gq !== undefined) gx.q = t.value;
  else if (t.dataset.gyear !== undefined) { gx.playing = false; gSetYear(+t.value, true); gBtn(); }
  else if (t.dataset.gf !== undefined) { gx.force[t.dataset.gf] = +t.value; $('#gf-' + t.dataset.gf).textContent = t.value; gx.alpha = Math.max(gx.alpha, .6); }
});
document.addEventListener('change', e => {
  const k = e.target.dataset.sel, p = e.target.dataset.pick;
  if (k) { state.f[state.kind][k] = e.target.value; renderGrid(); }
  if (p) { state.pick[p] = e.target.value; render(); }
});
render();
