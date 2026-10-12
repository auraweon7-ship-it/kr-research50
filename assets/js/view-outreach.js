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
  import(`../popup-remotion.js?v=${CONFIG.VERSION}`).then(m => { const st = document.createElement('div'); gm.un = m.mount(st, popData(o)); box.firstChild.replaceChildren(st); }).catch(() => { /* CDN 차단 시 CSS 카드 유지 */ });
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
        <div><h4>발굴·검증</h4><div class="p-kv"><span>발굴 트랙</span><div>${TRACKS[it.track]}${it.track === 'both' ? ' · 핵심 후보' : ' · 추가 근거 확인'}</div><span>근거문헌</span><div>${evOf(it)}건 확인 ${evOf(it) >= 2 ? '(기준 충족)' : '(2건 이상 필요)'}</div><span>검증 단계</span><div>${STAGES.map((st, i) => `<em class="p-step ${i <= stageOf(it) ? 'on' : ''}">${st}</em>`).join('')}</div><span>시대 구간</span><div>${era.no} ${era.label} (${era.from}~${era.to})</div></div></div>
        <div><h4>함께한 연구자</h4>${people.map(p => `<div class="p-person"><span class="blob ${dom(p.domain).g}">${p.id.slice(2)}</span><div><b>${p.title}</b> · ${p.field}<br>${p.life[p.life.length - 1].stage} · 배출 인력 ${p.alumni}명 · 지원 ${p.years}년</div></div>`).join('') || '<p class="p-note">연계 후보 없음</p>'}</div>
        <div><h4>이야기의 흐름</h4><div class="p-arc">${s.arc.map((a, i) => `${i ? chev : ''}<b>${a}</b>`).join('')}</div><p class="p-note">핵심 질문 · “${s.q}”</p><p class="p-note">주요 근거 · ${s.ev}</p><p class="p-note">활용 양상 · ${USE_DESC[it.guide]}</p></div>
      </div>
      <footer><span>데이터 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터)</span><span>한국연구재단 | 한국외국어대학교</span></footer>
    </article>
    <div class="chips mt"><button class="btn" data-act="open" data-v="${it.id}">성과 상세 열기</button><button class="btn" data-act="sub" data-v="path">이 성과의 발전 경로도 보기</button><button class="btn" data-act="sub" data-v="map">확산 지도에서 보기</button></div>
  </section>`;
};

R.outreach = () => `<div class="chips subtabs">${SUBS.map(([v, l, t]) => `<button class="chip ${state.sub === v ? 'on' : ''}" data-act="sub" data-v="${v}">${l}</button>`).join('')}</div>${OUT[state.sub]()}`;
