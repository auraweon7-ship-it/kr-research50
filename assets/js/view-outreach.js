/* 07 홍보 확산: 기획 개요와 시각화 예제 */
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
// 지도 색: 연한 땅, 맑은 바다, 도로·지명은 최소로
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#EEF1F5' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#7A869C' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#C5CCD9' }, { weight: 1.2 }] }, { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }, { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural.terrain', stylers: [{ visibility: 'off' }] }, { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D3E6F7' }] }, { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
// 지도 필터: 지원 영역·생활 분야·시대·검색어, 색 기준, 기준 연도(시간 재생)
state.mapf = { domain: '', guide: '', era: '', q: '', color: 'domain', year: 2026, rings: true, flows: true };
const stageAt = (o, y) => { let s = -1; o.path.forEach((p, i) => { if (p.year <= y) s = i; }); return s; };
const mapBase = () => { const F = state.mapf, q = F.q.trim().toLowerCase(); return (state.scope === 'sel' ? selected('o') : OUTCOMES).filter(o => (!F.domain || o.domain === F.domain) && (!F.guide || o.guide === F.guide) && (!F.era || o.era === F.era) && (!q || `${o.title} ${o.id}`.toLowerCase().includes(q))); };
const mapList = () => mapBase().filter(o => stageAt(o, state.mapf.year) >= 0);
const STAGE_COL = ['#3D9FE6', '#8A7CF0', '#F6A53A', '#27B894'];
const GUIDE_COL = Object.fromEntries(Object.keys(O_GUIDE).map((k, i) => [k, ['#3D9FE6', '#EC5C8D', '#F6A53A', '#27B894', '#8A7CF0', '#5D6980'][i % 6]]));
const markCol = o => { const F = state.mapf; return F.color === 'stage' ? STAGE_COL[Math.max(0, stageAt(o, F.year))] : F.color === 'guide' ? GUIDE_COL[o.guide] : dom(o.domain).color; };
const mapLegend = () => { const F = state.mapf; return F.color === 'stage' ? PATH_STAGES.map((l, i) => ({ label: l, color: STAGE_COL[i] })) : F.color === 'guide' ? Object.entries(O_GUIDE).map(([k, l]) => ({ label: l, color: GUIDE_COL[k] })) : DOMAINS; };

const popData = o => ({ id: o.id, title: o.title, region: o.region, color: dom(o.domain).color, feel: FEEL[o.guide], y0: o.path[0].year, span: o.path[3].year - o.path[0].year, invest: o.invest, roi: +roi(o).toFixed(1),
  ctype: `${STORY[o.ctype].k} ${o.ctype}`, grade: GRADES[o.grade].label, stages: o.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i] })), mix: FACTORS.map((_, i) => Math.round(o.mix.reduce((a, x) => a + x[i], 0) / 4)) });
// Remotion을 불러오지 못할 때 쓰는 CSS 애니메이션 카드
const popFallback = o => { const d = popData(o); return `<div class="mpop" style="background:linear-gradient(135deg,${d.color},#27365A)"><small>대한민국 연구 50년 · ${d.id} · ${d.region}</small><h3>${d.title}</h3><p>${d.feel}</p><div class="mp-n">${[[d.y0, '년', '첫 지원'], [d.span, '년', '확산 기간'], [d.invest, '억', '실질 투입'], [d.roi, '', '성과 지수']].map(([n, u, l], i) => `<div style="animation-delay:${.3 + i * .12}s"><b>${n}<i>${u}</i></b><span>${l}</span></div>`).join('')}</div><div class="mp-b"><span>${d.ctype} · ${d.grade}</span></div></div>`; };
// 지도 대신 쓰는 약식 도해: 권역 크기 = 성과 수, 안의 점 = 성과(색 기준을 따름)
const bubbleMap = () => {
  const list = mapList(), reg = REGIONS.map(r => ({ ...r, items: list.filter(o => o.region === r.id) })), mx = Math.max(1, ...reg.map(r => r.items.length));
  return reg.map((r, i) => { const sz = 64 + r.items.length / mx * 60; return `<button class="mbub ${r.id === state.region ? 'sel' : ''}" data-act="region" data-v="${r.id}" style="left:${r.x}%;top:${r.y}%;width:${sz}px;height:${sz}px;--c:${GC[i % 4]}"><span>${r.id}<b>${r.items.length}</b></span>${r.items.slice(0, 18).map((o, k) => `<i style="background:${markCol(o)};transform:rotate(${k * 20}deg) translateY(-${sz / 2 - 6}px)"></i>`).join('')}</button>`; }).join('');
};

const gm = { byId: new Map() };
const mapFallback = msg => { if (msg) gm.msg = msg; gm.el.className = 'map big gfall'; gm.el.innerHTML = `${bubbleMap()}<p class="gm-note">Google 지도를 표시하지 못해 약식 도해로 대체했습니다${gm.msg ? ` (${gm.msg})` : ''}.</p>`; };
const loadMaps = () => gm.p ||= new Promise((res, rej) => {
  window.__gmReady = res;
  window.gm_authFailure = () => { gm.fail = true; mapFallback('API 키 인증 실패 · 키의 리퍼러 제한과 결제 설정 확인'); };
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=__gmReady&v=weekly&language=ko&region=KR&loading=async`;
  s.onerror = rej; document.head.appendChild(s);
});
const openPop = o => {
  gm.un?.(); gm.un = null;
  const box = document.createElement('div'); box.className = 'gpop';
  box.innerHTML = `<div class="gpop-stage">${popFallback(o)}</div><div class="gpop-path">${o.path.map((p, i) => `<span class="${p.year <= state.mapf.year ? 'on' : ''}" style="--c:${STAGE_COL[i]};--d:${(.15 + i * .12).toFixed(2)}s"><b>${p.year}</b>${PATH_STAGES[i]}</span>`).join('')}</div><div class="gpop-foot"><span class="mute sm">${dom(o.domain).label} · ${O_GUIDE[o.guide]}</span><button class="btn" data-act="open" data-v="${o.id}">성과 상세</button></div>`;
  const p = geoOf(o); gm.info.setContent(box); gm.info.setPosition(p); gm.info.setOptions({ pixelOffset: new google.maps.Size(0, -14) }); gm.info.open({ map: gm.map });
  gm.fx?.focus(o.id); gm.focusId = o.id; gm.focusT = performance.now();
  import(`../popup-remotion.js?v=${CONFIG.VERSION}`).then(m => { const st = document.createElement('div'); gm.un = m.mount(st, popData(o)); box.firstChild.replaceChildren(st); }).catch(() => { /* CDN 차단 시 CSS 카드 유지 */ });
};
const mapFocus = id => { const o = byId(id); if (!o || !gm.map) return openModal(id); gm.map.panTo(geoOf(o)); openPop(o); };

/* ---------- 모션 표지 층: Google 지도 위에 HTML 점을 얹어 CSS 모션(등장·성장·파동·폭발)을 준다 ---------- */
const makeFx = () => class FxLayer extends google.maps.OverlayView {
  constructor() { super(); this.nodes = new Map(); this.waves = new Map(); this.st = new Map(); }
  onAdd() {
    this.div = document.createElement('div'); this.div.className = 'fxlayer';
    this.getPanes().overlayMouseTarget.appendChild(this.div);
    this.div.addEventListener('click', e => { const n = e.target.closest('.fxm'); if (n) { e.stopPropagation(); openPop(byId(n.dataset.id)); } });
    if (this.pending) { const [l, o] = this.pending; this.pending = null; this.update(l, o); }
  }
  onRemove() { this.div?.remove(); this.nodes.clear(); this.waves.clear(); }
  draw() {
    const pj = this.getProjection(); if (!pj) return;
    // 지도 확대 단계와 지도 너비에 맞춰 표지·파동·제목 크기를 함께 바꾼다
    const map = this.getMap(), z = map.getZoom() || 7, cw = map.getDiv().clientWidth || 900;
    const zf = Math.max(.65, Math.min(2, (.85 + (z - 7) * .22) * Math.pow(cw / 900, .4))), lf = Math.max(.85, Math.min(1.35, .9 + (zf - 1) * .5));
    this.div.style.setProperty('--zf', zf.toFixed(3)); this.div.style.setProperty('--lf', lf.toFixed(3)); this.zf = zf;
    for (const [id, n] of this.nodes) { const p = pj.fromLatLngToDivPixel(new google.maps.LatLng(n._ll)); n._p = p; n.style.transform = `translate(${p.x}px,${p.y}px)`; }
    for (const [, w] of this.waves) { const p = pj.fromLatLngToDivPixel(new google.maps.LatLng(w._ll)); w.style.transform = `translate(${p.x}px,${p.y}px)`; }
    this.labels();
  }
  // 제목 겹침 정리: 중요한 표지(선택·최종선정·활용 단계) 제목부터 자리를 잡고, 겹치는 제목은 숨긴다(마우스를 올리면 보임)
  labels() {
    const y = state.mapf.year, live = [...this.nodes.values()].filter(n => !n.classList.contains('out') && n._p);
    const pr = n => (n.classList.contains('foc') ? 1e4 : 0) + (n.classList.contains('sel') ? 1e3 : 0) + Math.max(0, stageAt(byId(n.dataset.id), y)) * 10 + (n.classList.contains('reg') ? 5 : 0);
    const placed = [];
    for (const n of live.sort((a, b) => pr(b) - pr(a))) {
      const t = n.querySelector('.fxt'), w = t.offsetWidth || 80, h = t.offsetHeight || 18, R = [n._p.x + 6, n._p.y - h / 2, n._p.x + 10 + w, n._p.y + h / 2];
      const hit = placed.some(q => R[0] < q[2] && R[2] > q[0] && R[1] < q[3] && R[3] > q[1]);
      n.classList.toggle('lh', hit); if (!hit) placed.push(R);
    }
  }
  // list: 보일 성과. intro면 첫 지원 연도 순으로 차례로 떠오르고, 재생 중 단계가 오르면 터지는 파동을 낸다
  update(list, { intro = false, quiet = false } = {}) {
    if (!this.div) { this.pending = [list, { intro, quiet }]; return; }
    const on = new Set(list.map(o => o.id)), y = state.mapf.year, order = intro ? [...list].sort((a, b) => a.path[0].year - b.path[0].year).map(o => o.id) : null;
    for (const [id, n] of this.nodes) if (!on.has(id) && !n.classList.contains('out')) { n.classList.add('out'); setTimeout(() => { if (n.classList.contains('out')) { n.remove(); this.nodes.delete(id); } }, 380); }
    list.forEach((o, i) => {
      let n = this.nodes.get(o.id); const st = Math.max(0, stageAt(o, y)), prev = this.st.get(o.id);
      if (!n || n.classList.contains('out')) {
        n?.remove(); n = document.createElement('div'); n.className = 'fxm in'; n.dataset.id = o.id; n._ll = geoOf(o);
        n.innerHTML = `<i class="fxh"></i><i class="fxc"></i><span class="fxt" data-full="${esc(o.title)}">${esc(o.title.length > 13 ? `${o.title.slice(0, 12)}…` : o.title)}</span>`; n.title = o.title;
        n.style.setProperty('--d', `${intro ? Math.min(2.4, order.indexOf(o.id) * .04) : quiet ? 0 : Math.min(.6, i * .012)}s`);
        this.div.appendChild(n); this.nodes.set(o.id, n); setTimeout(() => n.classList.remove('in'), 2600);
      }
      n.style.setProperty('--c', markCol(o)); n.className = `fxm s${st}${stageOf(o) === 3 ? ' sel' : ''}${n.classList.contains('in') ? ' in' : ''}${n.classList.contains('foc') ? ' foc' : ''}${o.region === state.region ? ' reg' : ''}`;
      // 재생 중 단계가 올라가면 한 번 터진다
      if (quiet && prev != null && st > prev) { const b = document.createElement('i'); b.className = `fxb b${st}`; n.appendChild(b); setTimeout(() => b.remove(), 1300); }
      this.st.set(o.id, st);
    });
    // 권역 파동: 성과가 많을수록 크고 빠르게 퍼진다
    const reg = REGIONS.map((r, i) => ({ r, i, n: list.filter(o => o.region === r.id).length }));
    for (const { r, i, n } of reg) {
      let w = this.waves.get(r.id);
      if (!state.mapf.rings || !n) { if (w) { w.remove(); this.waves.delete(r.id); } continue; }
      if (!w) { w = document.createElement('div'); w.className = 'fxw'; w._ll = { lat: GEO[r.id][0], lng: GEO[r.id][1] }; w.innerHTML = '<i></i><i></i><i></i><b></b>'; this.div.prepend(w); this.waves.set(r.id, w); }
      const sz = 60 + Math.sqrt(n) * 34; w.style.setProperty('--s', `${sz}px`); w.style.setProperty('--c', GC[i % 4]); w.style.setProperty('--t', `${Math.max(2.2, 5 - n * .12)}s`);
      w.classList.toggle('reg', r.id === state.region); w.querySelector('b').textContent = `${r.id} ${n}`;
    }
    this.draw();
  }
  focus(id) { for (const [k, n] of this.nodes) n.classList.toggle('foc', k === id); this.labels(); }
};
const drawMarkers = (quiet, intro) => {
  const list = mapList();
  if (!quiet) { gm.info.close(); gm.focusId = null; gm.fx.focus(null); }
  gm.marks = list.map(o => ({ oid: o.id }));
  gm.fx.update(list, { quiet, intro });
  if (!quiet && gm.region !== state.region) { gm.region = state.region; const [lat, lng] = GEO[state.region]; gm.map.panTo({ lat, lng }); gm.map.setZoom(state.region === '제주권' ? 10 : 8); }
};
const mountMap = () => {
  const ph = $('#gmap'); if (!ph) { mapStop(); return; }
  if (gm.el && gm.el !== ph) ph.replaceWith(gm.el); else gm.el = ph;
  if (gm.fail) return mapFallback();
  if (gm.map) { drawMarkers(); mapCountUp(); flowStart(); return; }
  loadMaps().then(() => {
    if (gm.fail || gm.map) return;
    // 첫 화면: 조금 멀리서 시작해 한반도로 다가가며 성과가 첫 지원 연도 순으로 떠오른다
    gm.map = new google.maps.Map(gm.el, { center: { lat: 36.3, lng: 127.8 }, zoom: 6, mapTypeControl: false, streetViewControl: false, fullscreenControl: true, styles: MAP_STYLE, gestureHandling: 'cooperative' });
    gm.info = new google.maps.InfoWindow({ maxWidth: 460 });
    gm.info.addListener('closeclick', () => { gm.un?.(); gm.un = null; gm.fx?.focus(null); gm.focusId = null; });
    const Fx = makeFx(); gm.fx = new Fx(); gm.fx.setMap(gm.map);
    new ResizeObserver(() => gm.fx?.draw()).observe(gm.el);
    gm.region = state.region;
    const zoomIn = () => { if (gm.map.getZoom() < 7) gm.map.setZoom(7); };
    google.maps.event.addListenerOnce(gm.map, 'tilesloaded', () => setTimeout(zoomIn, 250)); setTimeout(zoomIn, 1500);
    setTimeout(() => drawMarkers(false, true), 60); mapCountUp(); flowStart();
  }).catch(() => { gm.fail = true; mapFallback('지도 스크립트를 불러오지 못했습니다'); });
};
// 권역 요약 숫자는 그려질 때 0부터 올라간다
const mapCountUp = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.regionpane .rkpi b[data-to]').forEach(b => { const to = +b.dataset.to, u = b.querySelector('small')?.outerHTML || '', t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / 900); b.innerHTML = `${Math.round(to * (1 - Math.pow(1 - k, 3)))}${u}`; if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
};

/* ---------- 50년 확산 재생: 연도를 옮기며 첫 지원 → 활용으로 자라는 표지 ---------- */
const mapTick = () => {
  const y = state.mapf.year, base = mapBase(), list = mapList(), use = base.filter(o => stageAt(o, y) === 3).length;
  const el = $('#mtime'); if (el) { el.querySelector('b').textContent = `${y}년`; el.querySelector('.mt-n').textContent = `지원 시작 ${list.length}건 · 산업·사회 활용 도달 ${use}건`; const r = el.querySelector('input'); if (+r.value !== y) r.value = y; el.querySelector('.mt-era').textContent = (ERAS.find(e => y >= e.from && y <= e.to) || ERAS.at(-1)).label; const pr = el.querySelector('.mt-prog i'); if (pr) pr.style.width = `${(y - 1977) / 49 * 100}%`; }
  const fy = $('#fxyear'); if (fy) { fy.querySelector('b').textContent = y; fy.querySelector('span').textContent = `활용 ${use} · 진행 ${list.length - use}`; fy.classList.remove('tick'); void fy.offsetWidth; fy.classList.add('tick'); }
  if (gm.map && gm.fx) drawMarkers(true); else if (gm.el && gm.fail) mapFallback();
};
const mapStop = () => { clearInterval(gm.play); gm.play = null; const b = $('#mplay'); if (b) b.textContent = '▶ 50년 재생'; $('.mapwrap')?.classList.remove('playing'); };
document.addEventListener('input', e => { if (e.target.id === 'myear') { mapStop(); state.mapf.year = +e.target.value; mapTick(); } });

/* ---------- 지식 흐름층: 관련 성과끼리 휘어진 흐름선과 입자, 선택하면 이어진 성과로 파동이 번진다 ---------- */
// 계보(앞선 성과 → 뒤 성과)와 같은 연구자를 공유하는 성과 쌍
const mapLinks = () => gm.links ||= (() => {
  const L = [], seen = new Set(), add = (a, b, type) => { const k = [a, b].sort().join('|'); if (a === b || seen.has(k)) return; seen.add(k); L.push({ a, b, type, ph: (L.length * .618) % 1 }); };
  graphLinks().filter(l => l.type === 'gen').forEach(l => add(l.s, l.t, 'gen'));
  OUTCOMES.forEach((o, i) => OUTCOMES.slice(i + 1).forEach(q => { if (o.people.some(p => q.people.includes(p))) add(o.id, q.id, 'share'); }));
  return L;
})();
const FLOW_COL = { gen: '#F6A53A', share: '#3D9FE6' };
const flowStart = () => {
  const cv = $('#fxcanvas'); if (!cv || !gm.fx) return;
  gm.fcv = cv; gm.fctx = cv.getContext('2d');
  const size = () => { const d = window.devicePixelRatio || 1; cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; gm.fdpr = d; };
  size(); if (!cv._ro) { cv._ro = new ResizeObserver(size); cv._ro.observe(cv); }
  if (!gm.frun) { gm.frun = true; requestAnimationFrame(flowLoop); }
};
const flowLoop = now => {
  const cv = gm.fcv, c = gm.fctx;
  if (!cv?.isConnected || !gm.fx) { gm.frun = false; return; }
  const pj = gm.fx.getProjection(), w = cv.clientWidth, h = cv.clientHeight, t = now / 1000;
  c.setTransform(gm.fdpr, 0, 0, gm.fdpr, 0, 0); c.clearRect(0, 0, w, h);
  if (pj && state.mapf.flows) {
    const live = new Set([...gm.fx.nodes].filter(([, n]) => !n.classList.contains('out')).map(([id]) => id)), P = {}, at = id => P[id] ||= (() => { const p = pj.fromLatLngToContainerPixel(new google.maps.LatLng(geoOf(byId(id)))); return [p.x, p.y]; })();
    const foc = gm.focusId, ft = gm.focusT ? (now - gm.focusT) / 1000 : 9, near = new Set();
    for (const l of mapLinks()) {
      if (!live.has(l.a) || !live.has(l.b)) continue;
      const A = at(l.a), B = at(l.b), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy); if (len < 6) continue;
      const hot = foc && (l.a === foc || l.b === foc); if (hot) near.add(l.a === foc ? l.b : l.a);
      // 거리에 비례해 위로 솟는 호: 멀리 갈수록 높게
      const C = [(A[0] + B[0]) / 2 - dy * .12, (A[1] + B[1]) / 2 + dx * .12 - Math.min(70, len * .18)], col = FLOW_COL[l.type];
      const grow = hot ? Math.min(1, ft / .6) : 1;
      c.globalAlpha = foc ? (hot ? .9 : .05) : .2; c.strokeStyle = col; c.lineWidth = hot ? 2.6 : 1.3;
      c.beginPath(); c.moveTo(A[0], A[1]);
      if (grow < 1) { const steps = 24; for (let i = 1; i <= steps * grow; i++) { const u = i / steps; c.lineTo((1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1]); } }
      else c.quadraticCurveTo(C[0], C[1], B[0], B[1]);
      c.stroke();
      if (REDUCE || (foc && !hot)) continue;
      const k = hot ? 3 : 1;
      for (let i = 0; i < k; i++) {
        const u = (t * (hot ? .45 : .14) + l.ph + i / k) % 1, x = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * C[0] + u * u * B[0], y = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * C[1] + u * u * B[1];
        c.globalAlpha = Math.sin(u * Math.PI) * (hot ? 1 : .8); c.fillStyle = hot ? '#fff' : col;
        c.beginPath(); c.arc(x, y, hot ? 3.2 : 2, 0, 7); c.fill();
        if (hot) { c.globalAlpha *= .35; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); }
      }
    }
    // 선택한 성과에서 이어진 성과로 번지는 파동
    if (foc && live.has(foc) && !REDUCE) {
      const F = at(foc); for (let i = 0; i < 2; i++) { const u = ((ft * .7) + i / 2) % 1; c.globalAlpha = (1 - u) * .7; c.strokeStyle = markCol(byId(foc)); c.lineWidth = 2.5; c.beginPath(); c.arc(F[0], F[1], 14 + u * 60, 0, 7); c.stroke(); }
      for (const id of near) { const N = at(id), u = (ft - .55) / 1.1; if (u > 0 && u < 1) { c.globalAlpha = (1 - u) * .9; c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.beginPath(); c.arc(N[0], N[1], 10 + u * 30, 0, 7); c.stroke(); } }
    }
  }
  requestAnimationFrame(flowLoop);
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

// 권역 시간 흐름: 연도별로 그 권역에서 활용 단계에 이른 성과 수(누적)
const regionSpark = items => {
  const ys = []; for (let y = 1980; y <= 2026; y += 2) ys.push([y, items.filter(o => o.path[3].year <= y).length]);
  const mx = Math.max(1, ...ys.map(x => x[1])), W = 300, H = 56, X = i => 4 + i / (ys.length - 1) * (W - 8), Y = v => H - 6 - v / mx * (H - 14);
  const d = ys.map(([, v], i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' '), cur = ys.findIndex(([y]) => y >= state.mapf.year);
  return `<svg viewBox="0 0 ${W} ${H}" class="rspark" role="img" aria-label="권역 활용 도달 누적 추이"><path class="rs-area" d="${d} L${X(ys.length - 1)},${H - 6} L${X(0)},${H - 6} Z" fill="var(--teal)" opacity=".14"/><path class="rs-line" pathLength="1" d="${d}" fill="none" stroke="var(--teal)" stroke-width="2.4"/>${cur >= 0 ? `<line x1="${X(cur)}" x2="${X(cur)}" y1="4" y2="${H - 6}" stroke="#27365A" stroke-dasharray="3 3"/>` : ''}<text x="4" y="${H - 0}" class="ia-t">1980</text><text x="${W - 4}" y="${H}" text-anchor="end" class="ia-t">2026</text></svg>`;
};

OUT.map = () => {
  const F = state.mapf, base = mapBase(), list = mapList(), reg = REGIONS.map(r => ({ ...r, items: list.filter(o => o.region === r.id) })), cur = reg.find(r => r.id === state.region) || reg[0];
  const chip = (k, v, l, extra = '') => `<button class="chip ${F[k] === v ? 'on' : ''}" data-act="mf" data-k="${k}" data-v="${v}">${extra}${l}</button>`;
  const span = cur.items.length ? Math.round(cur.items.reduce((a, o) => a + o.path[3].year - o.path[0].year, 0) / cur.items.length) : 0, use = cur.items.filter(o => stageAt(o, F.year) === 3).length;
  return `
  ${spec('성과 중심', [['보여주는 것', '연구성과가 국민 생활과 산업 현장으로 퍼진 권역·분야와, 50년 동안 첫 지원에서 활용까지 자라 온 과정'], ['구성 요소', 'Google 지도 · 지원 영역/생활 분야/시대 필터와 검색 · 색 기준(영역·분야·확산 단계) · 50년 확산 재생 · 권역 원 · 모션그래픽 팝업 · 권역 요약과 추이 · 확산 인포그래픽'], ['사용 데이터', '성과 사슬의 기술이전·사업화·공공 활용 위치 정보, 6대 가이드라인 분류, 영향경로 단계 연도'], ['활용처', '50년 아카이브관, 홍보 책자 "숫자로 보는 50년", 50주년 전시 콘텐츠']])}
  <section class="slide mapcard">
    <div class="toolbar" style="margin-bottom:10px"><h2 style="flex:1 1 220px">성과 <b>확산 지도</b> <span class="mute sm">${list.length}건 표시</span></h2>
      <input class="field" value="${esc(F.q)}" placeholder="성과 이름 검색" data-chg="mq" style="flex:0 1 200px" aria-label="성과 검색">
      <button class="chip ${state.scope === 'all' ? 'on' : ''}" data-act="scope" data-v="all">전체 ${OUTCOMES.length}</button><button class="chip ${state.scope === 'sel' ? 'on' : ''}" data-act="scope" data-v="sel">최종선정 ${selected('o').length}</button></div>
    <div class="mapfilters">
      <div><span>지원 영역</span><div class="chips">${chip('domain', '', '전체')}${DOMAINS.map(d => chip('domain', d.id, d.short, `<i style="background:${d.color}"></i>`)).join('')}</div></div>
      <div><span>생활 분야</span><div class="chips">${chip('guide', '', '전체')}${Object.entries(O_GUIDE).map(([k, l]) => chip('guide', k, l)).join('')}</div></div>
      <div><span>출발 시대</span><div class="chips">${chip('era', '', '전체')}${ERAS.map(e => chip('era', e.id, `${e.no} ${e.label}`)).join('')}</div></div>
    </div>
    <div class="row c64" style="margin-top:12px">
      <div>
        <div class="mapwrap">
          <div id="gmap"></div>
          <canvas id="fxcanvas" aria-hidden="true"></canvas>
          <div class="fxyear" id="fxyear" aria-hidden="true"><b>${F.year}</b><span>활용 ${base.filter(o => stageAt(o, F.year) === 3).length} · 진행 ${list.length - base.filter(o => stageAt(o, F.year) === 3).length}</span></div>
          <div class="mapctl"><span>색 기준</span>${[['domain', '지원 영역'], ['guide', '생활 분야'], ['stage', '확산 단계']].map(([v, l]) => `<button class="chip ${F.color === v ? 'on' : ''}" data-act="mcolor" data-v="${v}">${l}</button>`).join('')}
            <button class="chip ${F.rings ? 'on' : ''}" data-act="mrings">권역 파동</button><button class="chip ${F.flows ? 'on' : ''}" data-act="mflows">지식 흐름선</button><button class="chip" data-act="mfit">전국 보기</button></div>
          <div class="mtime" id="mtime"><button class="btn pri" id="mplay" data-act="mplay">${gm.play ? '❚❚ 멈춤' : '▶ 50년 재생'}</button><b>${F.year}년</b><span class="mt-era">${(ERAS.find(e => F.year >= e.from && F.year <= e.to) || ERAS.at(-1)).label}</span>
            <span class="mt-track"><input type="range" id="myear" min="1977" max="2026" value="${F.year}" aria-label="기준 연도"><span class="mt-prog"><i style="width:${(F.year - 1977) / 49 * 100}%"></i></span><span class="mt-eras">${ERAS.map((e, i) => `<em style="left:${(e.from - 1977) / 49 * 100}%;--c:${GC[i % 4]}">${e.no}</em>`).join('')}</span></span><span class="mt-n">지원 시작 ${list.length}건 · 산업·사회 활용 도달 ${base.filter(o => stageAt(o, F.year) === 3).length}건</span></div>
        </div>
        ${legend(mapLegend())}
        <p class="mute sm mt">표지를 누르면 모션그래픽 팝업과 확산 단계가 열립니다. 표지 크기는 기준 연도까지 도달한 확산 단계(클수록 활용에 가까움), 흰 테두리가 굵은 표지는 최종선정 성과입니다. "50년 재생"은 1977년부터 해마다 첫 지원을 받은 성과가 나타나고 단계가 자라는 과정을 보여 줍니다. 표지 위치는 권역 안에 흩어 놓은 예시이며 실제 소재지가 아닙니다.</p>
      </div>
      <div class="regionpane">
        <div class="chips">${reg.map((r, i) => `<button class="chip ${r.id === cur.id ? 'on' : ''}" data-act="region" data-v="${r.id}"><i style="background:${GC[i % 4]}"></i>${r.id} ${r.items.length}</button>`).join('')}</div>
        <h3 class="mt" style="font-size:16px"><b>${cur.id}</b> 확산 성과</h3>
        <div class="rkpi">${[[cur.items.length, '건', '성과'], [cur.items.filter(o => stageOf(o) === 3).length, '건', '최종선정'], [span, '년', '평균 확산'], [use, '건', `${F.year}년 활용 도달`]].map(([v, u, l], i) => `<div style="--d:${(i * .07).toFixed(2)}s"><b data-to="${v}">${v}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>
        <h4 class="h4 mt">활용 도달 누적 추이</h4>${regionSpark(cur.items)}
        <ol class="rank rlist">${[...cur.items].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)).map((o, i) => { const st = stageAt(o, F.year); return `<li data-act="focus" data-v="${o.id}"><b>${i + 1}</b><span>${esc(o.title)}<em class="rstages">${o.path.map((p, k) => `<i class="${k <= st ? 'on' : ''}" style="--c:${STAGE_COL[k]}" title="${p.year} ${PATH_STAGES[k]}"></i>`).join('')}<small>${o.path[0].year}→${o.path[3].year}</small></em></span><b>${score(o)}</b></li>`; }).join('') || '<li style="cursor:default"><b></b><span class="mute">조건에 맞는 성과 없음</span><b></b></li>'}</ol>
        <div class="chips mt"><button class="btn" data-act="mcsv">이 조건 CSV</button></div>
        <h4 class="h4 mt">생활 분야별 분포</h4>
        ${Object.entries(O_GUIDE).map(([g, l]) => bar(l, cur.items.filter(o => o.guide === g).length / Math.max(1, cur.items.length) * 100, cur.items.filter(o => o.guide === g).length, GUIDE_COL[g], '130px 1fr 26px')).join('')}
      </div>
    </div>
    ${foot('대국민 확산 지도')}
  </section>
  <section class="slide">
    <div class="toolbar" style="margin-bottom:16px"><h2 style="flex:1">확산 <b>인포그래픽</b></h2><button class="btn" data-act="print">인쇄</button></div>
    ${spreadPoster(list, reg)}
  </section>
  ${slide('권역 × <b>지원 영역</b>', tbl(['권역', ...DOMAINS.map(x => x.short), '합계'], reg.map(r => [r.id, ...DOMAINS.map(x => r.items.filter(o => o.domain === x.id).length || '<span class="mute">—</span>'), `<b>${r.items.length}</b>`])))}`;
};
Object.assign(ACT, {
  mf: (v, t) => { const k = t.dataset.k; state.mapf[k] = state.mapf[k] === v ? '' : v; render(); },
  mq: v => { state.mapf.q = String(v).slice(0, 60); render(); },
  mcolor: v => { state.mapf.color = v; render(); },
  mrings: () => { state.mapf.rings = !state.mapf.rings; render(); },
  mflows: (v, t) => { state.mapf.flows = !state.mapf.flows; t.classList.toggle('on', state.mapf.flows); },
  mfit: () => { if (gm.map) { gm.info.close(); gm.map.panTo({ lat: 36.1, lng: 127.8 }); gm.map.setZoom(7); gm.region = state.region; } },
  mplay: () => {
    if (gm.play) return mapStop();
    if (state.mapf.year >= 2026) state.mapf.year = 1977;
    $('#mplay').textContent = '❚❚ 멈춤'; $('.mapwrap')?.classList.add('playing'); mapTick();
    gm.play = setInterval(() => { if (!$('#mtime')) return mapStop(); state.mapf.year++; mapTick(); if (state.mapf.year >= 2026) { mapStop(); render(); } }, 420);
  },
  mcsv: () => {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, rows = mapList().map(o => [o.id, o.title, o.region, dom(o.domain).label, O_GUIDE[o.guide], ...o.path.map(p => p.year), STAGES[stageOf(o)], score(o)]);
    download(`확산지도_${state.mapf.year}.csv`, new Blob(['﻿' + [['번호', '성과', '권역', '지원 영역', '생활 분야', ...PATH_STAGES.map(s => `${s} 연도`), '검증 단계', '성과 점수'], ...rows].map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }));
  },
});

/* --- 예제 4: 대표성과 인포그래픽 --- */
// 도넛은 마스크 원(pathLength=1)이 그려지며 조각이 드러난다
const donut = m => {
  const R0 = 52, Cc = 2 * Math.PI * R0; let off = 0;
  return `<svg viewBox="0 0 140 140" width="150" role="img" aria-label="기여 구성 도넛"><defs><mask id="dmask"><circle cx="70" cy="70" r="${R0}" fill="none" stroke="#fff" stroke-width="22" pathLength="1" class="mo-draw" transform="rotate(-90 70 70)"/></mask></defs>
    <g mask="url(#dmask)">${m.map((v, i) => { const len = v / 100 * Cc, seg = `<circle cx="70" cy="70" r="${R0}" fill="none" stroke="${FACTORS[i].color}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${(Cc - len + 2).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 70 70)"/>`; off += len; return seg; }).join('')}</g>
    <text x="70" y="66" text-anchor="middle" style="font-size:22px;font-weight:700;fill:#27365A"><tspan data-to="${m[0]}">${m[0]}</tspan>%</text><text x="70" y="84" text-anchor="middle" style="font-size:10px;fill:#7A869C">정부 지원</text></svg>`;
};
const pbar = (label, pct, text, fill) => { const g = fill.startsWith('g-'); return `<p><span>${label}</span><i><em class="grow ${g ? fill : ''}" style="width:${Math.min(100, pct)}%;${g ? '' : `background:${fill}`}"></em></i><b data-to="${text}">${text}</b></p>`; };
// 숫자 칸: data-to가 있으면 재생 때 0에서부터 올라간다
const cnt = v => `<span data-to="${v}">${v}</span>`;
const mo = (i, step = .08) => `data-mo style="--d:${(i * step).toFixed(2)}s"`;

// 50년 시간축: 시대 띠 위에 영향경로 4단계를 선이 그려지며 잇는다
const infoAxis = it => axisSvg(it.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i] })), dom(it.domain).color, `${it.path[0].year}년부터 ${it.path[3].year}년까지 영향경로 시간축`);
const axisSvg = (P, col, aria) => {
  const W = 860, L = 24, Rr = 24, y0 = 1977, y1 = 2027, X = y => L + (y - y0) / (y1 - y0) * (W - L - Rr);
  const bands = ERAS.map((e, i) => `<rect x="${X(e.from)}" y="20" width="${X(Math.min(e.to + 1, y1)) - X(e.from)}" height="70" fill="${GC_HEX[i % 4]}" opacity=".08"/><text x="${X(e.from) + 6}" y="34" class="ia-era">${e.no} ${e.label}</text>`).join('');
  const ticks = [1980, 1990, 2000, 2010, 2020].map(y => `<text x="${X(y)}" y="106" text-anchor="middle" class="ia-t">${y}</text>`).join('');
  const d = `M${X(P[0].year)},62 ${P.slice(1).map(p => `L${X(p.year)},62`).join(' ')} L${X(2026)},62`;
  return `<svg viewBox="0 0 ${W} 112" class="ia" role="img" aria-label="${aria}">${bands}${ticks}
    <line x1="${L}" x2="${W - Rr}" y1="62" y2="62" stroke="#DDE2EA" stroke-width="4" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" pathLength="1" class="mo-draw"/>
    ${P.map((p, i) => `<g class="ia-dot" style="--d:${(.5 + i * .35).toFixed(2)}s"><circle cx="${X(p.year)}" cy="62" r="${p.star ? 13 : 11}" fill="#fff" stroke="${p.star ? '#F6A53A' : col}" stroke-width="4"/><circle cx="${X(p.year)}" cy="62" r="4.5" fill="${p.star ? '#F6A53A' : col}"/>
      <text x="${X(p.year)}" y="${i % 2 ? 90 : 46}" text-anchor="middle" class="ia-l">${p.year} ${p.label}${p.star ? ' ★' : ''}</text></g>`).join('')}
    <g class="ia-now" style="--d:1.9s"><circle cx="${X(2026)}" cy="62" r="7" fill="${col}" class="ia-pulse"/><text x="${X(2026)}" y="46" text-anchor="end" class="ia-l">2026 현재</text></g></svg>`;
};
const GC_HEX = ['#3D9FE6', '#EC5C8D', '#F6A53A', '#27B894'];

// 인포그래픽 한 장. 화면과 HTML 내보내기가 같은 마크업을 쓴다
const infoPoster = it => {
  const d = dom(it.domain), s = STORY[it.ctype], g = GRADES[it.grade], era = ERAS.find(e => e.id === it.era);
  const m = FACTORS.map((_, i) => Math.round(it.mix.reduce((a, x) => a + x[i], 0) / 4)); m[0] += 100 - m.reduce((a, b) => a + b, 0);
  const span = it.path[3].year - it.path[0].year, peers = OUTCOMES.filter(o => o.domain === it.domain), avg = fn => peers.reduce((a, o) => a + fn(o), 0) / peers.length;
  const rank = [...OUTCOMES].sort((a, b) => roi(b) - roi(a)).findIndex(o => o.id === it.id) + 1, drank = [...peers].sort((a, b) => score(b) - score(a)).findIndex(o => o.id === it.id) + 1;
  const cmp = [['성과 점수', score(it), avg(score), '점'], ['확산 기간', span, avg(o => o.path[3].year - o.path[0].year), '년'], ['실질 투입', it.invest, avg(o => o.invest), '억'], ['투자 대비 성과 지수', roi(it), avg(roi), '']];
  const people = it.people.map(byId), sum = k => people.reduce((a, p) => a + (p[k] || 0), 0);
  const gaps = it.path.slice(1).map((p, i) => p.year - it.path[i].year), r1 = x => +x.toFixed(1);
  // 같은 영역 성과들의 점수 분포 위에 이 성과의 위치
  const sc = peers.map(score), lo = Math.min(...sc), hi = Math.max(...sc), px = v => hi > lo ? (v - lo) / (hi - lo) * 100 : 50;
  return `<article class="poster wide mo" id="poster-${it.id}">
      <header class="${d.g}"><span>대한민국 연구 50년 · 대표성과 ${it.id}</span><h2>${it.title}</h2><p>${FEEL[it.guide]}</p>
        <p class="p-lead">${it.path[0].year}년 「${it.path[0].program}」 지원에서 출발해 <b>${span}년</b> 만에 ${PATH_STAGES[3]}에 이른 성과</p>
        <div class="p-tags">${[O_GUIDE[it.guide], d.label, `${era.no} ${era.label} 출발`, `${it.region} 확산`, STAGES[stageOf(it)]].map((t, i) => `<em ${mo(i + 2)}>${t}</em>`).join('')}</div><i class="pd1"></i><i class="pd2"></i><i class="pd3"></i></header>
      <div class="p-nums six">${[[it.path[0].year, '년', '첫 지원'], [span, '년', '확산 기간'], [it.invest, '억', '실질 투입(2025년 기준)'], [score(it), '점', '성과 점수'], [roi(it).toFixed(1), '', `투자 대비 성과 지수 · 전체 ${rank}위`], [people.length, '명', '연계 대표 연구자']].map(([n, u, l], i) => `<div ${mo(i)}><b>${cnt(n)}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>

      <h4>50년 시간축 · 첫 지원에서 오늘까지</h4>
      <div class="p-axis">${infoAxis(it)}</div>
      <div class="p-gaps">${gaps.map((gp, i) => `<div ${mo(i, .15)}><b>${cnt(gp)}<small>년</small></b><span>${PATH_STAGES[i]} → ${PATH_STAGES[i + 1]}</span></div>`).join('')}<div ${mo(3, .15)}><b>${cnt(2026 - it.path[3].year)}<small>년</small></b><span>활용 지속</span></div></div>

      <h4>영향경로 · 누가 무엇을 이어받았나</h4>
      <div class="p-stages">${it.path.map((p, i) => `<div ${mo(i, .12)}><span class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</span><small>${p.year}${i < 3 ? ` ~ ${it.path[i + 1].year}` : ' ~'}</small><b>${PATH_STAGES[i]}</b>
        <dl><dt>지원 사업</dt><dd>${p.program}</dd><dt>연구 주체</dt><dd>${PATH_ACTOR[i]}</dd><dt>주요 산출물</dt><dd>${PATH_OUT[i]}</dd><dt>정부 비중</dt><dd><b>${it.mix[i][0]}%</b>${i ? ` <span class="${it.mix[i][0] <= it.mix[i - 1][0] ? 'dn' : 'up'}">${it.mix[i][0] <= it.mix[i - 1][0] ? '▼' : '▲'} ${Math.abs(it.mix[i][0] - it.mix[i - 1][0])}p</span>` : ''}</dd></dl>
        <div class="grow" style="--d:${(.3 + i * .15).toFixed(2)}s">${stack(it.mix[i])}</div></div>`).join('')}</div>
      <div class="p-legend">${FACTORS.map(f => `<span><i style="background:${f.color}"></i>${f.label}</span>`).join('')}<span class="mute">· 막대는 단계별 기여 구성 · 정부 비중이 줄고 민간·지역이 늘수록 확산이 진행된 것</span></div>

      <div class="p-three">
        <div ${mo(0)}><h4>누가 함께 만들었나</h4><div class="p-donut">${donut(m)}<div>${FACTORS.map((f, i) => `<p><i style="background:${f.color}"></i>${f.label} <b>${m[i]}%</b></p>`).join('')}</div></div>
          <p class="p-note">4개 단계 평균. 초기 단계 정부 지원 ${it.mix[0][0]}% → 활용 단계 ${it.mix[3][0]}%, 민간 투자 ${it.mix[0][3]}% → ${it.mix[3][3]}%</p></div>
        <div ${mo(1)}><h4>재단 지원은 어떻게 기여했나</h4><div class="p-type"><span class="blob ${G[CTYPES.indexOf(it.ctype)]}">${s.k}</span><div><b>${it.ctype}</b><br>${s.def}</div></div>
          <div class="p-kv"><span>부 유형</span><div>${it.sub ? `${STORY[it.sub].k} ${it.sub}` : '해당 없음'}</div><span>기여 강도</span><div><b>${g.label}</b> · 계수 ${g.coef.toFixed(1)}</div><span>판정 근거</span><div>${g.ev}</div><span>병행 요인</span><div>${it.alts.join(' · ') || '확인된 요인 없음'}</div></div></div>
        <div ${mo(2)}><h4>세부기준 점수</h4><div class="p-bars">${CRIT.map((c, i) => pbar(c.replace(/ \(.*/, ''), it.scores[i], it.scores[i], d.color)).join('')}</div>
          <h4>영역 평균과 비교 <span style="letter-spacing:0;font-weight:500">· ${d.short} ${peers.length}건</span></h4>
          <div class="p-cmp">${cmp.map(([l, v, a, u]) => { const mx = Math.max(v, a) || 1, f = x => (Number.isInteger(x) ? x : x.toFixed(1)) + u; return `<div><span>${l}</span><i><em class="grow" style="width:${v / mx * 100}%;background:${d.color}"></em><em class="grow" style="width:${a / mx * 100}%;background:#C5CCD9;--d:.2s"></em></i><b>${f(v)}<small> / ${f(a)}</small></b></div>`; }).join('')}</div></div>
      </div>

      <div class="p-two">
        <div ${mo(0)}><h4>영역 안에서의 위치 · ${d.short} ${peers.length}건 중 성과 점수 ${drank}위</h4>
          <div class="p-dist"><div class="p-dline">${peers.map(o => `<i style="left:${px(score(o))}%" ${o.id === it.id ? 'class="me"' : ''}></i>`).join('')}<b style="left:${px(score(it))}%;background:${d.color};transform:translateX(-${px(score(it)) > 85 ? 100 : px(score(it)) < 15 ? 0 : 50}%)">${score(it)}점</b></div><div class="p-dax"><span>${lo}점</span><span>영역 평균 ${r1(avg(score))}점</span><span>${hi}점</span></div></div>
          <p class="p-note">전체 ${OUTCOMES.length}건 중 투자 대비 성과 지수 ${rank}위${rank <= OUTCOMES.length / 2 ? ` · 상위 ${Math.max(1, Math.round(rank / OUTCOMES.length * 100))}%` : ""}</p></div>
        <div ${mo(1)}><h4>사람으로 이어진 파급 · 연계 연구자 ${people.length}명</h4>
          ${people.length ? `<div class="p-gaps four">${[[sum('alumni'), '명', '배출 인력'], [sum('coauthors'), '명', '공동연구자'], [sum('papers'), '편', '논문·저서'], [sum('patents'), '건', '특허·기술이전']].map(([n, u, l], i) => `<div ${mo(i + 2)}><b>${cnt(n)}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>
            <p class="p-note">연계 대표 연구자 이력 합계. 한 성과가 사람을 키우고, 그 사람이 다음 연구를 잇는 구조를 보여 줍니다.</p>` : '<p class="p-note">연계 연구자 확인 중</p>'}</div>
      </div>

      ${typeof realRow === 'function' ? realRow(it) : ''}
      <div class="p-three">
        <div ${mo(0)}><h4>발굴·검증</h4><div class="p-kv"><span>발굴 트랙</span><div>${TRACKS[it.track]}${it.track === 'both' ? ' · 핵심 후보' : ' · 추가 근거 확인'}</div><span>근거문헌</span><div>${evOf(it)}건 확인 ${evOf(it) >= 2 ? '(기준 충족)' : '(2건 이상 필요)'}</div><span>검증 단계</span><div>${STAGES.map((st, i) => `<em class="p-step ${i <= stageOf(it) ? 'on' : ''}">${st}</em>`).join('')}</div><span>시대 구간</span><div>${era.no} ${era.label} (${era.from}~${era.to})</div></div></div>
        <div ${mo(1)}><h4>함께한 연구자</h4>${people.map(p => `<div class="p-person"><span class="blob ${dom(p.domain).g}">${p.id.slice(2)}</span><div><b>${p.title}</b> · ${p.field}<br>${p.life[p.life.length - 1].stage} · 배출 인력 ${p.alumni}명 · 지원 ${p.years}년</div></div>`).join('') || '<p class="p-note">연계 후보 없음</p>'}</div>
        <div ${mo(2)}><h4>이야기의 흐름</h4><div class="p-arc">${s.arc.map((a, i) => `${i ? chev : ''}<b class="arc" style="--d:${(.4 + i * .25).toFixed(2)}s">${a}</b>`).join('')}</div><p class="p-note">핵심 질문 · “${s.q}”</p><p class="p-note">주요 근거 · ${s.ev}</p><p class="p-note">활용 양상 · ${USE_DESC[it.guide]}</p></div>
      </div>
      <footer><span>데이터 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터)</span><span>한국연구재단 | 한국외국어대학교</span></footer>
    </article>`;
};

// 모션 재생기. 화면과 내보낸 HTML이 같은 함수를 쓴다(내보낼 때 함수 본문을 그대로 넣는다)
const infoPlay = (root, again) => {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.querySelectorAll('.poster.mo').forEach(p => {
    const run = () => {
      p.classList.remove('play'); void p.offsetWidth; p.classList.add('play');
      p.querySelectorAll('[data-to]').forEach(el => {
        const to = parseFloat(el.dataset.to), dec = (String(el.dataset.to).split('.')[1] || '').length, t0 = performance.now(), dur = 1300;
        if (reduce || isNaN(to)) { el.textContent = el.dataset.to; return; }
        const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
        el.textContent = (0).toFixed(dec); requestAnimationFrame(step);
      });
    };
    if (again) return run();
    if (p.dataset.seen) return;
    // 화면에 들어왔는지 스크롤 때마다 확인한다(IntersectionObserver가 멈추는 환경도 있어 직접 잰다)
    const check = () => { if (!p.isConnected || p.dataset.seen) return removeEventListener('scroll', check, true); const r = p.getBoundingClientRect(); if (r.top < innerHeight * .85 && r.bottom > 0) { removeEventListener('scroll', check, true); p.dataset.seen = '1'; run(); } };
    addEventListener('scroll', check, { capture: true, passive: true }); check(); setTimeout(check, 400);
  });
};
const infoMotion = () => { const el = document.querySelector('#infostage'); if (el) infoPlay(el); };

// 인포그래픽을 단독 HTML 파일로 만든다. 스타일시트는 한 번 받아 그대로 넣는다
let infoCss = null;
const infoHtml = async it => {
  infoCss ||= await (await fetch(`assets/style.css?v=${CONFIG.VERSION}`)).text();
  const poster = it.kind === 'p' ? pinfoPoster(it) : infoPoster(it), kindName = it.kind === 'p' ? '대표 연구자' : '대표성과';
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${it.id} ${esc(it.kind === 'p' ? `${it.field} 연구자` : it.title)} · ${kindName} 인포그래픽</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${infoCss}
body{display:block;padding:28px 16px 40px;margin:0}.info-export{max-width:1180px;margin:0 auto}.info-export .bar-top{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}
.info-export button{font:inherit;font-size:12.5px;font-weight:600;padding:8px 16px;border-radius:999px;border:0;background:#fff;color:#27365A;box-shadow:0 3px 10px rgba(39,54,90,.12);cursor:pointer}
@media print{.info-export .bar-top{display:none}body{padding:0}}</style></head>
<body><main class="info-export"><div class="bar-top"><button onclick="infoPlay(document,true)">모션 다시 재생</button><button onclick="print()">인쇄</button></div>
${poster}
<p style="text-align:center;color:#5D6980;font-size:11px;margin-top:14px">대한민국 연구 50년 · ${new Date().toISOString().slice(0, 10)} 내보냄 · 수치는 시연용 예시 데이터</p></main>
<script>const infoPlay = ${infoPlay.toString()};infoPlay(document);</script></body></html>`;
};
const infoFile = it => `${it.kind === 'p' ? '대표연구자' : '대표성과'}_${it.id}_${(it.kind === 'p' ? `${it.field}-연구자` : it.title).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-')}.html`;

OUT.info = () => {
  const pk = picker('info', 'o'), it = byId(state.pick.info);
  return `
  ${spec('성과 중심', [['보여주는 것', '대표성과 하나의 가치를 한 장으로 — 지원 이력, 50년 시간축, 영향경로, 기여 유형, 영역 내 위치, 사람으로 이어진 파급, 국민 체감 포인트'], ['구성 요소', '제목·한 줄 요약·체감 문구 · 핵심 숫자 6개 · 50년 시간축과 단계 간 시차 · 영향경로 4단계(정부 비중 변화) · 기여 구성 · 기여 유형과 강도 · 세부기준 점수 · 영역 평균 비교 · 영역 내 점수 분포 · 연계 연구자 파급 합계 · 발굴·검증 · 연계 연구자 · 이야기 흐름 · 출처'], ['모션', '화면에 들어오면 숫자가 올라가고, 시간축 선이 그려지며, 막대·도넛이 차오르고 카드가 차례로 떠오릅니다 (동작 줄이기 설정 시 정지 화면)'], ['사용 데이터', '확정 사례 원고와 연계 DB 값(수치·연도는 DB와 대조)'], ['활용처', '성과관 상세 화면, 사례집·백서·홍보 책자, 웹 게시용 단독 HTML, SNS 카드뉴스, 50주년 전시 (100편 표준 템플릿)']])}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:16px"><h2 style="flex:1 1 220px">대표성과 <b>인포그래픽 예제</b></h2>${pk}
      <button class="btn pri" data-act="inforefresh" data-v="${it.id}" ${isAdmin() ? '' : 'disabled title="관리자·연구진 로그인 후 쓸 수 있습니다"'}>데이터 갱신</button><button class="btn" data-act="idview2" data-v="${it.id}" ${isAdmin() ? '' : 'hidden'}>수집 값 검토</button><button class="btn" data-act="inforeplay">모션 다시 재생</button><button class="btn" data-act="infohtml" data-v="one">HTML 내려받기</button><button class="btn" data-act="infohtml" data-v="all">50선 전체 HTML (ZIP)</button><button class="btn" data-act="print">인쇄</button></div>
    ${infoStatus(it)}
    <div id="infostage">${infoPoster(it)}</div>
    <p class="mute sm mt">HTML 파일은 스타일과 모션이 모두 들어 있는 단독 파일이라 그대로 열거나 웹에 올릴 수 있습니다(글꼴만 인터넷에서 받습니다).</p>
    <div class="chips mt"><button class="btn" data-act="open" data-v="${it.id}">성과 상세 열기</button><button class="btn" data-act="sub" data-v="path">이 성과의 발전 경로도 보기</button><button class="btn" data-act="sub" data-v="map">확산 지도에서 보기</button></div>
  </section>`;
};
Object.assign(ACT, {
  inforeplay: () => { const el = $('#infostage'); if (el) infoPlay(el, true); },
  infohtml: async (v, t) => {
    if (t.dataset.busy) return; t.dataset.busy = '1'; const label = t.textContent;
    try {
      const k = t.dataset.k || 'o', key = k === 'p' ? 'pinfo' : 'info';
      if (v === 'one') { const it = byId(state.pick[key]); download(infoFile(it), new Blob([await infoHtml(it)], { type: 'text/html' })); }
      else {
        const items = [...LIST[k]].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)).slice(0, 50), enc8 = new TextEncoder(), files = [];
        for (let i = 0; i < items.length; i++) { files.push({ name: `${String(i + 1).padStart(2, '0')}_${infoFile(items[i])}`, data: enc8.encode(await infoHtml(items[i])) }); t.textContent = `만드는 중 ${i + 1}/${items.length}`; if (i % 10 === 9) await new Promise(r => setTimeout(r)); }
        download(k === 'p' ? '대표연구자_인포그래픽_50인_HTML.zip' : '대표성과_인포그래픽_50선_HTML.zip', zipStore(files));
      }
      t.textContent = '내려받기 완료';
    } catch (e) { t.textContent = '만들기 실패'; console.error(e); }
    delete t.dataset.busy; setTimeout(() => { if (t.isConnected) t.textContent = label; }, 2500);
  },
});

R.outreach = () => `<div class="chips subtabs">${SUBS.map(([v, l, t]) => `<button class="chip ${state.sub === v ? 'on' : ''}" data-act="sub" data-v="${v}">${l}</button>`).join('')}</div>${OUT[state.sub]()}`;
