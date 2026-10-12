/* 01 사업 목표 */
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
