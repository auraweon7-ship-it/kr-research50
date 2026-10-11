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
  ].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['선정', '후보', '핵심', '근거'][i]}</div><div class="n">${n}</div><div class="l">${l} (예시)</div></div>`).join('')}</div>`;
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

/* ========== 06 홍보 확산 ========== */
const SUBS = [['plan', '기획 개요', '사례집·시각화'], ['life', '연구자 생애주기 성장 흐름도', '인물 중심'], ['path', '지원사업 연계 기술·학술 발전 경로도', '성과 중심'], ['map', '연구성과 대국민 확산 지도', '성과 중심'], ['info', '대표성과 인포그래픽', '성과 중심']];
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
    <div class="sec"><h3>성과 이력</h3><div class="row c5" style="margin:12px 0 0;gap:14px">${[[it.papers, '편', '대표 논문·저서'], [it.patents, '건', '특허·기술이전'], [it.awards, '회', '수상'], [it.startup ? '있음' : '—', '', '창업'], [it.policy, '건', '정책·자문 활동']].map(([n, u, l]) => `<div class="tile"><div class="n" style="font-size:22px">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div></div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>성장경로 분석</h3>${info([['전환점', `${turn.year}년 ${turn.stage} 진입 · 직전 지원 「${before.program}」`], ['연속성', it.gap ? `지원 공백 ${it.gap}년 확인 · 누적 지원 ${it.years}년` : `단절 없는 후속 지원 · 누적 ${it.years}년`], ['확산', `배출 인력 ${it.alumni}명 · 공동연구자 ${it.coauthors}명`], ['대표성', P_GUIDE[it.guide]]])}
        <h3 class="mt2">기여 강도 · ${g.label}</h3><div class="story">${g.def}<br><span class="mute">판정 근거(예): ${g.ev}</span></div></div>
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
  $('#main').innerHTML = `<header class="page-head"><div><div class="dots"><i></i><i></i><i></i></div><h1>${v.t[0]} <b>${v.t[1]}</b></h1><p>${v.id === 'outreach' && state.sub !== 'plan' ? `<b style="color:var(--ink)">${SUBS.find(x => x[0] === state.sub)[1]}</b> · ${SUBS.find(x => x[0] === state.sub)[2]} 시각화 자료 예제` : v.sub}</p></div><div class="badge-no"><span>0${i + 1}</span></div></header>${R[v.id]()}
    <footer class="site-foot"><div class="dots sm"><i></i><i></i><i></i></div>한국연구재단 <span>|</span> 한국외국어대학교(연구책임자: 박정원 교수)</footer>`;
  renderGrid(); renderRank(); mountMap();
};
const openModal = id => { const m = $('#modal'); m.innerHTML = detail(byId(id)); m.hidden = false; };
const closeModal = () => { $('#modal').hidden = true; };

const ACT = {
  nav: v => { const [a, b] = v.split(':'); state.view = a; if (a === 'outreach') state.sub = b || 'plan'; closeModal(); render(); window.scrollTo(0, 0); },
  sub: v => { state.sub = v; render(); window.scrollTo(0, 0); },
  region: v => { state.region = v; render(); },
  focus: v => { const m = (gm.marks || []).find(x => x.oid === v); if (m) { gm.map.panTo(m.getPosition()); google.maps.event.trigger(m, 'click'); } else openModal(v); },
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
  const k = e.target.dataset.sel, p = e.target.dataset.pick;
  if (k) { state.f[state.kind][k] = e.target.value; renderGrid(); }
  if (p) { state.pick[p] = e.target.value; render(); }
});
render();
