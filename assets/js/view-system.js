/* 02 성과 발굴체계와 기준 */
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
