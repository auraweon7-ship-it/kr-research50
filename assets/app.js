const TARGET = 50;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경에서는 세션 내 상태만 유지 */ } },
};
const state = {
  view: 'goal', kind: 'o', era: 'e5', scope: 'all', rankBy: 'roi',
  w: { o: [25, 25, 25, 25], p: [25, 25, 25, 25] },
  status: store.get('nrf50.status', {}),
  f: { o: { q: '', domain: '', guide: '', ctype: '', track: '', stage: '' }, p: { q: '', domain: '', guide: '', track: '', stage: '' } },
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
  { id: 'outcomes', t: ['대표 성과', '50선'], sub: '국민 체감과 국가·산업·사회적 파급효과가 높은 성과 후보를 탐색하고 영향경로를 역추적합니다.', kind: 'o' },
  { id: 'people', t: ['대표 연구자', '50인'], sub: '재단 지원을 발판으로 성장한 연구자 후보의 생애주기 성장경로를 추적합니다.', kind: 'p' },
  { id: 'contribution', t: ['정부 지원', '기여도 분석'], sub: '성과를 재단에 귀속하지 않고, 정부·연구자·기관·기업의 복합 요인 속에서 재단 지원의 기여를 근거 수준과 함께 제시합니다.' },
  { id: 'outreach', t: ['대국민', '확산자료 기획'], sub: '통합 웹플랫폼, 백서 2종, 홍보 책자, AI 모션그래픽 영상·인포그래픽 각 100편, YouTube 서비스로 성과를 국민의 언어로 전합니다.' },
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
const listView = k => {
  const f = state.f[k], guides = k === 'o' ? O_GUIDE : P_GUIDE;
  const sel = (key, label, opts) => `<select class="field" data-sel="${key}" aria-label="${label}"><option value="">${label} 전체</option>${opts.map(([v, l]) => `<option value="${v}" ${f[key] === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `
  <div class="toolbar">
    <input class="field" type="search" placeholder="${k === 'o' ? '성과명 검색' : '분야·ID 검색'}" value="${esc(f.q)}" data-q aria-label="검색">
    ${sel('guide', '발굴 유형', Object.entries(guides))}
    ${k === 'o' ? sel('ctype', '기여 유형', CTYPES.map(c => [c, `${STORY[c].k} ${c}`])) : ''}
    ${sel('track', '발굴 트랙', Object.entries(TRACKS))}
    ${sel('stage', '검증 단계', STAGES.map((s, i) => [i, s]))}
  </div>
  <div class="chips" style="margin-bottom:22px">
    <button class="chip ${f.domain ? '' : 'on'}" data-act="domain" data-v="">전체 영역</button>
    ${DOMAINS.map(d => `<button class="chip ${f.domain === d.id ? 'on' : ''}" data-act="domain" data-v="${d.id}"><i style="background:${d.color}"></i>${d.label}</button>`).join('')}
    <span class="mute sm" id="count" style="margin-left:auto;align-self:center"></span>
  </div>
  <div class="cards" id="grid"></div>`;
};
R.outcomes = () => listView('o');
R.people = () => listView('p');
const renderGrid = () => {
  const el = $('#grid'); if (!el) return;
  const k = state.kind, f = state.f[k], q = f.q.trim().toLowerCase();
  const guides = k === 'o' ? O_GUIDE : P_GUIDE;
  const list = LIST[k].filter(it => (!q || (it.title + (it.field || '') + it.id).toLowerCase().includes(q)) && (!f.domain || it.domain === f.domain) &&
    (!f.guide || it.guide === f.guide) && (!f.ctype || it.ctype === f.ctype) && (!f.track || it.track === f.track) && (f.stage === '' || stageOf(it) === +f.stage))
    .sort((a, b) => score(b) - score(a));
  $('#count').textContent = `${list.length}${k === 'o' ? '건' : '명'} · 최종선정 ${selected(k).length}/${TARGET}`;
  el.innerHTML = list.map((it, i) => {
    const d = dom(it.domain);
    return `<button class="card" data-act="open" data-v="${it.id}">
      <div class="card-top"><div class="blob ${d.g} ${['', 'b2', 'b3'][i % 3]}">${d.short}</div><div><div class="id">${it.id}</div>${pill(it)}</div><div class="score">${score(it)}</div></div>
      <h4>${k === 'p' ? `${it.title} <span class="mute" style="font-weight:500">· ${it.field}</span>` : it.title}</h4>
      <div class="tags"><span class="tag">${guides[it.guide]}</span>${k === 'o' ? `<span class="tag">${STORY[it.ctype].k} ${it.ctype}</span>` : `<span class="tag">첫 지원 ${it.y0}</span>`}<span class="tag">${GRADES[it.grade].label}</span></div>
      <div class="card-foot">${trackDots(it)}<span class="mute sm">${k === 'o' ? `${it.path[0].year} → ${it.path[3].year}` : `지원 ${it.years}년`}</span></div>
    </button>`;
  }).join('') || '<p class="mute">조건에 맞는 후보가 없습니다.</p>';
};

/* ========== 05 정부 지원 기여도 분석 ========== */
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

/* ========== 06 대국민 확산자료 기획 ========== */
R.outreach = () => {
  const so = selected('o'), sp = selected('p');
  const part = (obj, list) => Object.entries(obj).map(([k, l]) => `${l} ${list.filter(x => x.guide === k).length}`).join(' · ');
  const reg = REGIONS.map(r => ({ ...r, n: so.filter(o => o.region === r.id).length }));
  const toc = (rows, live) => `<ol class="toc">${rows.map(([h, p], i) => `<li><b>${i && i < 5 ? `PART ${i}` : i ? '부록' : '서문'}</b><span><b>${h}</b><br><span class="mute sm">${p}${live[i] ? `<br>${live[i]}` : ''}</span></span></li>`).join('')}</ol>`;
  return `
  ${jump(['산출물 총괄', '통합 웹플랫폼', '백서 2종·홍보 책자', 'AI 영상·인포그래픽·YouTube', '시각화 콘텐츠 10종', '스토리텔링 모델', '확산 채널'])}

  ${sub(1, '대국민 확산 <b>산출물 총괄</b>', '같은 이야기를 국민·연구계·정책 관계자에게 각각 맞는 형식으로')}
  <div class="row c4">${[['1식', '통합 웹플랫폼'], ['2종', '백서 (각 200쪽 내외, ebook)'], ['1종', '대국민 홍보 책자 (40쪽 내외, ebook)'], ['100편', 'AI 모션그래픽 영상'], ['100편', '1장형 인포그래픽'], ['1편', 'AI 홍보영상 (3분 내외)'], ['101편', 'YouTube 공개·운영'], ['10종', '시각화 콘텐츠']].map(([n, l]) => `<div class="tile"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('산출물 <b>구성(안)</b>', tbl(['산출물', '주요 구성', '규격·수량(안)'], C.deliver) + foot('산출물'), '국민 눈높이의 용어, 성과의 생활 속 접점, 연구자의 목소리를 살린 서술을 원칙으로 하고 전문가 원고자문으로 정확성을 검수합니다.')}

  ${sub(2, '통합 <b>웹플랫폼</b>', '「한국연구재단 50년 대표성과 웹플랫폼」 · 성과관 · 인물관 · 50년 아카이브관 · 자료실')}
  <div class="row c3">${C.halls.map(([h, f, src, v], i) => `<${v ? `button data-act="nav" data-v="${v}"` : 'div'} class="tile" style="text-align:left"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}">${h.slice(0, 2)}</div><h3>${h}</h3><p class="mute sm" style="margin-top:6px">${f}</p><div style="margin-top:10px"><span class="tag">${src}</span></div></${v ? 'button' : 'div'}>`).join('')}</div>
  ${slide('구축 절차 · <b>요구분석에서 공개·이관까지</b>', steps(C.build.map(([h, m, p]) => [h, p, m])) + foot('웹플랫폼'))}
  ${tiles(C.buildRules)}

  ${sub(3, '백서 2종과 <b>홍보 책자</b>', '성과 백서는 "무엇을 바꾸었는가", 인물 백서는 "누구를 키웠는가"')}
  <div class="row c2">
    ${slide('「한국연구재단 50년 <b>대표성과 백서</b>」', toc(C.book1, { 2: `현재 최종선정 ${so.length}/${TARGET} — ${CTYPES.map(c => `${STORY[c].k} ${so.filter(o => o.ctype === c).length}`).join(' · ')}` }))}
    ${slide('「대한민국 <b>대표 연구자 50인 백서</b>」', toc(C.book2, { 2: `현재 최종선정 ${sp.length}/${TARGET} — ${part(P_GUIDE, sp)}` }))}
  </div>
  ${slide('제작 절차와 <b>4단계 검수</b>', `${steps(C.press.map(([h, m, p]) => [h, p, m]))}
    <div class="row c3 mt2" style="margin-bottom:0">${[['대표성과 백서', '무엇을 바꾸었는가'], ['대표 연구자 50인 백서', '누구를 키웠는가'], ['대국민 홍보 책자', '숫자로 보는 50년, 대표성과·인물 하이라이트, 인포그래픽']].map(([h, p]) => `<div class="story"><b>${h}</b><br><span class="mute">${p}</span></div>`).join('')}</div>
    <p class="mute sm mt">연구진 집필 → 대상 연구자 사실 확인 → 외부 전문가 원고자문 → 편집 교정의 4단계 검수. 인쇄 없이 전자책(ebook·PDF)으로 발간해 자료실에 탑재합니다.</p>
    <div class="chips mt"><button class="btn pri" data-act="export">선정 결과 JSON 내보내기</button><button class="btn" data-act="print">구성안 인쇄</button></div>`)}

  ${sub(4, 'AI 모션그래픽 영상 · 인포그래픽 · <b>YouTube</b>', '대표성과 50편 + 대표 연구자 50편, 같은 형식과 품질로 일괄 제작')}
  <div class="row c2">${C.videoArc.map(([h, arc, p], i) => slide(`${h.split(' ')[0]} ${h.split(' ')[1]} <b>${h.split(' ')[2]}</b>`, `<div class="para mt">${arc.map((x, j) => `${j ? '<svg viewBox="0 0 24 12" width="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 6h18M15 2l5 4-5 4"/></svg>' : ''}<b>${x}</b>`).join('')}</div><p class="mute sm mt">${i ? '인포그래픽: 생애주기 성장 궤적·지원 이력·대표 성과' : '인포그래픽: 지원 이력·영향경로·기여 유형·국민 체감 포인트'}</p>`, p)).join('')}</div>
  ${slide('제작 <b>파이프라인</b>', `${steps(C.video)}<div class="formula mt2"><b>검증·권리</b> 모든 영상·인포그래픽은 연구진 사실 확인과 대상 연구자 확인을 거쳐 공개합니다. 초상·음성 활용 동의를 받고, AI 생성물임을 표기하며, 저작권이 확인된 소재만 사용합니다. 수치·연도·인명은 연계 DB 값과 대조하고 데이터 출처(NTIS·KRM 등)를 표기합니다.</div>`)}
  ${tiles(C.youtube)}

  ${sub(5, '성과 <b>시각화 콘텐츠 10종</b>', '웹플랫폼에는 인터랙티브로, 백서·홍보 책자에는 전자책용 도해로 공통 적용')}
  <div class="row c5">${C.viz.map(([tag, h, v], i) => `<button class="tile" style="text-align:left" data-act="nav" data-v="${v}"><div class="blob ${G[['인물', '성과', '투입', '기여', '종합'].indexOf(tag) % 4]} ${i % 2 ? 'b2' : 'b3'}">${String(i + 1).padStart(2, '0')}</div><span class="tag">${tag}</span><h3 style="margin-top:8px">${h}</h3></button>`).join('')}</div>
  ${slide('성과 <b>확산 지도</b> 미리보기', `<div class="map">${reg.map((r, i) => { const s = 46 + r.n * 9; return `<div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : 'b3'}" style="left:${r.x}%;top:${r.y}%;width:${s}px;height:${s * .92}px">${r.id}<br>${r.n}</div>`; }).join('')}</div>`, '04. 성과 확산 지도 · 최종선정 성과의 권역별 분포(예시)')}

  ${sub(6, '성과 확산 유형별 <b>스토리텔링 모델</b>', '유형별 서사 구조 4종과 표준 사례 양식으로 심층 사례 50편 작성')}
  <div class="row c4">${CTYPES.map((c, i) => { const s = STORY[c]; return `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${s.k}</div><h3>${c}</h3><p class="mute sm" style="margin-top:4px">${s.def}</p><p class="sm" style="margin-top:10px"><b>${s.arc.join(' → ')}</b></p><p class="sm" style="margin-top:8px">“${s.q}”</p><p class="mute sm" style="margin-top:6px">근거: ${s.ev}</p><div style="margin-top:10px"><span class="tag">최종선정 ${so.filter(o => o.ctype === c).length}건</span></div></div>`; }).join('')}</div>
  ${slide('표준 <b>사례 양식</b>', `<div class="para mt">${['성과 개요', '지원 이력', '영향경로', '기여 유형·강도', '국민 체감 포인트', '연구자 인터뷰 발췌'].map(x => `<b>${x}</b>`).join('')}</div>`)}

  ${sub(7, '확산 <b>채널</b>과 이관', '연구 종료 시 소스·데이터·운영 매뉴얼과 채널 권한을 재단에 이관')}
  ${slide('확산 채널별 <b>계획</b>', tbl(['채널', '내용', '시기'], C.channels) + foot('확산 채널'))}`;
};

/* ---------- 상세 ---------- */
const detail = it => {
  const d = dom(it.domain), o = it.kind === 'o', guides = o ? O_GUIDE : P_GUIDE, g = GRADES[it.grade];
  const flow = o
    ? it.path.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</div><div class="yr">${p.year}</div><h4>${PATH_STAGES[i]}</h4><p><b>${p.program}</b><br>${p.desc}</p></div>`).join('')
    : it.life.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[i % 4]} b${i % 3 + 1}" style="width:${56 + i * 7}px;height:${52 + i * 7}px">${i + 1}</div><div class="yr">${p.year}</div><h4>${p.stage}</h4><p><b>${p.program}</b><br>${p.out}</p></div>`).join('');
  const links = (o ? it.people : it.outcomes).map(byId);
  const m = o ? [[score(it), '점', '성과 점수'], [g.coef.toFixed(1), '', g.label], [it.invest, '억', '실질 투입(2025년 기준)'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']]
    : [[it.grants, '건', '재단 지원과제'], [it.years, '년', '누적 지원기간'], [it.alumni, '명', '배출 인력'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']];
  const s = o ? STORY[it.ctype] : null;
  return `<div class="panel" role="dialog" aria-modal="true" aria-label="${esc(it.title)}">
    <div class="panel-head">
      <div class="blob ${d.g}">${d.short}</div>
      <div><div class="mute sm">${it.id} · ${d.label}</div><h2>${it.title}${o ? '' : ` · ${it.field}`}</h2>
        <div class="chips" style="gap:6px;margin-top:8px">${pill(it)}<span class="tag">${guides[it.guide]}</span>${o ? `<span class="tag">${s.k} ${it.ctype}</span><span class="tag">${it.region}</span>` : ''}<span class="tag">${g.label}</span><span class="tag">${ERAS.find(e => e.id === it.era).label} 출발</span></div></div>
      <button class="x" data-act="close" aria-label="닫기">✕</button>
    </div>
    <div class="row c4 sec" style="margin-bottom:0;gap:16px">${m.map(([n, u, l]) => `<div class="tile"><div class="n">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div>
    <div class="sec"><h3>${o ? '영향경로 · 지원사업 연계 발전 경로도' : '성장경로 · 연구자 생애주기 성장 흐름도'}</h3>
      <p class="mute sm">${o ? '현재 활용 단계에서 초기 지원 과제까지 역추적한 경로' : '지원 이력 × 성과 이력 × 역할 변화(학생 → 책임자 → 멘토)를 시계열로 결합'}</p><div class="flow">${flow}</div></div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>세부기준 점수 <span class="mute">· 종합 ${score(it)}</span></h3>
        ${CRIT.map((l, i) => `<div class="kv" style="grid-template-columns:150px 1fr 34px"><span>${l}</span><div class="bar"><span style="width:${it.scores[i]}%;background:${d.color}"></span></div><b>${it.scores[i]}</b></div>`).join('')}
        <p class="sm mt">${trackDots(it)} <span class="mute">· ${it.track === 'both' ? '핵심 후보(두 트랙 공통)' : '추가 근거 확인 대상'}</span></p></div>
      <div>${o ? `<h3>단계별 기여 구성</h3>${it.mix.map((mm, i) => `<div class="srow" style="grid-template-columns:100px 1fr"><span class="sm">${PATH_STAGES[i]}</span>${stack(mm)}</div>`).join('')}${legend(FACTORS)}
          <p class="sm mt"><b>대안 설명 검토</b> ${it.alts.map(a => `<span class="tag">${a}</span>`).join(' ') || '<span class="mute">확인된 병행 요인 없음</span>'}</p>`
        : `<h3>성장경로 분석 포인트</h3><div class="story"><ol><li><b>전환점</b> 성장이 가속된 시점과 직전 지원 사업 (${it.y0}, ${it.life[0].program})</li><li><b>연속성</b> 단절 없는 후속 지원의 효과 · 누적 ${it.years}년</li><li><b>확산</b> 제자·공동연구자 네트워크 · 배출 ${it.alumni}명</li><li>${P_GUIDE[it.guide]} 관점의 대표성</li></ol></div>`}</div>
    </div>
    <div class="sec"><h3>기여 강도 판정 · ${g.label}</h3><div class="story">${g.def}<br><span class="mute">판정 근거(예): ${g.ev}</span></div></div>
    ${o ? `<div class="sec"><h3>스토리텔링 모델 · ${s.k} ${it.ctype}</h3><div class="story"><b>${s.arc.join(' → ')}</b><br>핵심 질문: ${s.q}<br><span class="mute">주요 근거: ${s.ev}</span></div></div>` : ''}
    <div class="sec"><h3>${o ? '연계 연구자' : '연계 대표 성과'}</h3><div class="chips mt">${links.map(l => `<button class="chip" data-act="open" data-v="${l.id}">${l.kind === 'p' ? `${l.title} · ${l.field}` : l.title}</button>`).join('') || '<span class="mute sm">연계 후보 없음</span>'}</div></div>
    <div class="sec"><h3>검증 단계 지정</h3><div class="chips mt">${STAGES.map((st, i) => `<button class="btn ${stageOf(it) === i ? 'on' : ''}" data-act="stage" data-v="${i}" data-id="${it.id}">${st}</button>`).join('')}</div></div>
  </div>`;
};

/* ---------- 렌더·이벤트 ---------- */
const render = () => {
  const i = VIEWS.findIndex(v => v.id === state.view), v = VIEWS[i];
  if (v.kind) state.kind = v.kind;
  $('#nav').innerHTML = VIEWS.map((q, j) => `<button class="nav-item ${q.id === v.id ? 'on' : ''}" data-act="nav" data-v="${q.id}"><span class="nav-ic ${G[j % 4]}">0${j + 1}</span>${q.t.join(' ')}</button>`).join('');
  $('#main').innerHTML = `<header class="page-head"><div><div class="dots"><i></i><i></i><i></i></div><h1>${v.t[0]} <b>${v.t[1]}</b></h1><p>${v.sub}</p></div><div class="badge-no"><span>0${i + 1}</span></div></header>${R[v.id]()}
    <footer class="site-foot"><div class="dots sm"><i></i><i></i><i></i></div>한국연구재단 <span>|</span> 한국외국어대학교(연구책임자: 박정원 교수)</footer>`;
  renderGrid(); renderRank();
};
const openModal = id => { const m = $('#modal'); m.innerHTML = detail(byId(id)); m.hidden = false; };
const closeModal = () => { $('#modal').hidden = true; };

const ACT = {
  nav: v => { state.view = v; closeModal(); render(); window.scrollTo(0, 0); },
  jump: v => document.getElementById(v)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  era: v => { state.era = v; render(); },
  kind: v => { state.kind = v; render(); },
  scope: v => { state.scope = v; render(); },
  rankby: v => { state.rankBy = v; render(); },
  domain: v => { state.f[state.kind].domain = v; render(); },
  open: openModal, close: closeModal,
  stage: (v, t) => { state.status[t.dataset.id] = +v; store.set('nrf50.status', state.status); render(); openModal(t.dataset.id); },
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
});
document.addEventListener('change', e => {
  const k = e.target.dataset.sel;
  if (k) { state.f[state.kind][k] = e.target.value; renderGrid(); }
});
render();
