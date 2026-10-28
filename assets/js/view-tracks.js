/* 03·04 성과관·인물관 목록과 상세 화면 */
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
    [`${count(k, it => evOf(it) >= 2)}<small> ${u}</small>`, '근거문헌 2건 이상 확인'],
  ].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['선정', '후보', '핵심', '근거'][i]}</div><div class="n">${n}</div><div class="l">${l} (예시)</div></div>`).join('')}</div>
  <div class="row c4">${[
    ['선정 달성률', selected(k).length, TARGET, `목표 ${TARGET}${k === 'o' ? '선' : '인'} 대비`],
    ['후보군 풀 확보율', LIST[k].length, 300, '목표 300건 대비'],
    ['핵심 후보 비율', count(k, it => it.track === 'both'), LIST[k].length, '후보 중 두 트랙 공통 도출'],
    ['근거 확인율', count(k, it => evOf(it) >= 2), LIST[k].length, '후보 중 근거문헌 2건 이상'],
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
  <div class="staff-only">${trackKpi('o')}</div>
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
  <div class="staff-only">${trackKpi('p')}</div>
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
  const list = LIST[k].filter(it => (staff() || stageOf(it) === 3) && (!q || (it.title + (it.field || '') + it.id).toLowerCase().includes(q)) && (!f.domain || it.domain === f.domain) &&
    (!f.guide || it.guide === f.guide) && (!f.ctype || it.ctype === f.ctype) && (!f.era || it.era === f.era) && (!f.track || it.track === f.track) && (f.stage === '' || stageOf(it) === +f.stage))
    .sort((a, b) => key(b) - key(a));
  $('#count').textContent = `${list.length}${k === 'o' ? '건' : '명'} · 최종선정 ${selected(k).length}/${TARGET}`; $('#count').setAttribute('aria-live', 'polite');
  el.innerHTML = list.map((it, i) => {
    const d = dom(it.domain);
    return `<button class="card" data-act="open" data-v="${it.id}">
      <div class="card-top"><div class="blob ${d.g} ${['', 'b2', 'b3'][i % 3]}">${d.short}</div><div><div class="id">${it.id}</div>${pill(it)}</div><div class="score" title="${f.sort === 'roi' ? '투자 대비 성과 지수' : '성과 점수'}">${f.sort === 'roi' ? roi(it).toFixed(1) : score(it)}</div></div>
      <h4>${k === 'p' ? `${it.title} <span class="mute" style="font-weight:500">· ${it.field}</span>` : it.title}</h4>${it.imported ? '<span class="tag ok" style="align-self:flex-start">가져온 데이터</span>' : ''}
      <p class="mute sm">${FEEL[it.guide]}</p>
      <div class="tags"><span class="tag">${guides[it.guide]}</span>${k === 'o' ? `<span class="tag">${STORY[it.ctype].k} ${it.ctype}</span>` : `<span class="tag">${it.life[it.life.length - 1].stage}</span>`}<span class="tag">${GRADES[it.grade].label}</span></div>
      ${typeof cardTable === 'function' ? cardTable(it) : ''}
      <div class="card-foot">${trackDots(it)}<span class="mute sm">${k === 'o' ? `${it.path[0].year} → ${it.path[3].year}` : `첫 지원 ${it.y0} · ${it.years}년`}</span></div>
    </button>`;
  }).join('') || '<p class="mute">조건에 맞는 후보가 없습니다.</p>';
};


/* ---------- 상세 ---------- */
const info = rows => `<div class="info">${rows.map(([k, v]) => `<span>${k}</span><div>${v}</div>`).join('')}</div>`;
const evTag = it => `<span class="tag ${evOf(it) >= 2 ? 'ok' : 'no'}">근거문헌 ${evOf(it)}건 ${evOf(it) >= 2 ? '확인' : '· 2건 이상 필요'}</span>`;
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

// 근거 패키지: 후보별 근거문헌을 등록하고 '2건 이상 확인' 기준을 자동 판정한다 (연구용 화면)
const EV_TYPES = ['과제 보고서', '논문·저서', '특허·기술이전', '언론·수상', '정책 문서', '인터뷰', '기타'];
const evidenceSec = it => {
  const L = db.data.evidence[it.id], n = evOf(it);
  return `<div class="sec staff-only"><h3>근거 패키지 <span class="tag ${n >= 2 ? 'ok' : 'no'}">${n}건 · ${n >= 2 ? '2건 이상 확인 기준 충족' : '2건 이상 필요'}</span></h3>
    ${L ? `<ol class="rank evlist">${L.map((e, i) => `<li style="cursor:default"><b>${i + 1}</b><span><span class="tag">${esc(e.type)}</span> ${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)}</a>` : esc(e.title)}${e.note ? ` <span class="mute">· ${esc(e.note)}</span>` : ''}</span><button class="btn" data-act="evdel" data-v="${i}" data-id="${it.id}" aria-label="근거 ${i + 1} 삭제">삭제</button></li>`).join('') || '<li style="cursor:default"><b></b><span class="mute">등록된 근거가 없습니다.</span><b></b></li>'}</ol>`
      : `<p class="mute sm">등록한 근거가 없어 예시 건수(${it.ev}건)를 표시하고 있습니다. 근거를 하나라도 등록하면 등록 건수로 판정합니다.</p>`}
    <div class="evform toolbar" style="margin:12px 0 0"><select class="field" aria-label="근거 유형" data-f="type" style="flex:0 1 150px">${EV_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
      <input class="field" data-f="title" placeholder="근거 제목 (필수)" aria-label="근거 제목"><input class="field" data-f="url" placeholder="링크 https://… (선택)" aria-label="근거 링크"><input class="field" data-f="note" placeholder="메모 (선택)" aria-label="근거 메모">
      <button class="btn pri" data-act="evadd" data-id="${it.id}">근거 추가</button></div>${isAdmin() && typeof lookupSec === 'function' ? lookupSec(it) : ''}</div>`;
};
const INT_TAGS = ['첫 지원', '전환점', '지원이 만든 차이', '후속세대 양성', '정책 제언'];
const interviewNote = it => { const iv = db.data.interviews.find(x => x.id === it.id && x.memo); return iv ? `${esc(iv.memo)}${iv.tags?.length ? `<br>${iv.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}` : ''}` : ''; };

const detail = it => {
  const d = dom(it.domain), o = it.kind === 'o', guides = o ? O_GUIDE : P_GUIDE, g = GRADES[it.grade], s = o ? STORY[it.ctype] : null;
  const era = ERAS.find(e => e.id === it.era), links = (o ? it.people : it.outcomes).map(byId);
  const m = o ? [[score(it), '점', '성과 점수'], [g.coef.toFixed(1), '', g.label], [it.invest, '억', '실질 투입(2025년 기준)'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']]
    : [[it.grants, '건', '재단 지원과제'], [it.years, '년', '누적 지원기간'], [it.alumni, '명', '배출 인력'], [roi(it).toFixed(1), '', '투자 대비 성과 지수']];
  const head = `<div class="panel-head">
      <div class="blob ${d.g}">${d.short}</div>
      <div><div class="mute sm">${it.id} · ${d.label}</div><h2 id="dlg-title">${it.title}${o ? '' : ` · ${it.field}`}</h2>
        <div class="chips" style="gap:6px;margin-top:8px">${pill(it)}<span class="tag">${guides[it.guide]}</span>${o ? `<span class="tag">${s.k} ${it.ctype}</span>` : ''}<span class="tag">${g.label}</span>${evTag(it)}</div></div>
      <button class="btn sharebtn" data-act="share" data-v="${it.id}">링크 복사</button><button class="x" data-act="close" aria-label="닫기">✕</button>
    </div>
    <div class="row c4 sec" style="margin-bottom:0;gap:16px">${m.map(([n, u, l]) => `<div class="tile"><div class="n">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div>`;
  const scores = `<h3>세부기준 점수 <span class="mute">· 종합 ${score(it)}</span></h3>
        ${CRIT.map((l, i) => `<div class="kv" style="grid-template-columns:150px 1fr 34px"><span>${l}</span><div class="bar"><span style="width:${it.scores[i]}%;background:${d.color}"></span></div><b>${it.scores[i]}</b></div>`).join('')}
        <p class="sm mt">${trackDots(it)} <span class="mute">· ${it.track === 'both' ? '핵심 후보(두 트랙 공통)' : '추가 근거 확인 대상'}</span></p>`;
  const tail = `<div class="sec"><h3>${o ? '연계 연구자' : '연계 대표 성과'}</h3><div class="chips mt">${links.map(l => `<button class="chip" data-act="open" data-v="${l.id}">${l.kind === 'p' ? `${l.title} · ${l.field}` : l.title}</button>`).join('') || '<span class="mute sm">연계 후보 없음</span>'}</div></div>
    ${typeof linkedSec === 'function' ? linkedSec(it) : ''}${typeof anaSec === 'function' ? anaSec(it) : ''}${evidenceSec(it)}${typeof wfSec === 'function' ? wfSec(it) : ''}<div class="sec staff-only"><h3>검증 단계 지정</h3><div class="chips mt">${STAGES.map((st, i) => `<button class="btn ${stageOf(it) === i ? 'on' : ''}" data-act="stage" data-v="${i}" data-id="${it.id}">${st}</button>`).join('')}</div></div>`;

  if (o) {
    const span = it.path[3].year - it.path[0].year;
    return `<div class="panel" role="dialog" aria-modal="true" aria-labelledby="dlg-title">${head}
    <div class="sec"><h3>1. 성과 개요</h3>${info([['발굴 유형', guides[it.guide]], ['지원 영역', d.label], ['출발 시기', `${era.no} ${era.label} · ${it.path[0].year}년 첫 지원`], ['확산 기간', `${span}년 (${it.path[0].year} → ${it.path[3].year})`], ['확산 권역', it.region], ['활용 양상', USE_DESC[it.guide]]])}</div>
    <div class="sec"><h3>2. 지원 이력 · 3. 영향경로</h3><p class="mute sm">현재의 활용 단계에서 초기 지원 과제까지 역추적한 경로 (지원사업 연계 기술·학술 발전 경로도)</p>
      <div class="flow">${it.path.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[(i + 3) % 4]} b${i % 3 + 1}">${i + 1}</div><div class="yr">${p.year}</div><h4>${PATH_STAGES[i]}</h4><p><b>${p.program}</b><br>${p.desc}</p></div>`).join('')}</div>
      ${tbl(['단계', '시기', '지원 사업', '연구 주체', '주요 산출물'], it.path.map((p, i) => [PATH_STAGES[i], p.year, p.program, PATH_ACTOR[i], PATH_OUT[i]]))}</div>
    ${typeof tlSec === 'function' ? tlSec(it) : ''}${pathAnalysis(it)}
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>4. 기여 유형·강도</h3>${info([['주 유형', `${s.k} ${it.ctype}`], ['부 유형', it.sub ? `${STORY[it.sub].k} ${it.sub}` : '<span class="mute">해당 없음</span>'], ['기여 강도', `${g.label} · 계수 ${g.coef.toFixed(1)}`], ['판정 근거(예)', g.ev], ['대안 설명', it.alts.map(a => `<span class="tag">${a}</span>`).join(' ') || '<span class="mute">확인된 병행 요인 없음</span>']])}</div>
      <div><h3>단계별 기여 구성</h3>${it.mix.map((mm, i) => `<div class="srow" style="grid-template-columns:100px 1fr"><span class="sm">${PATH_STAGES[i]}</span>${stack(mm)}</div>`).join('')}${legend(FACTORS)}</div>
    </div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>5. 국민 체감 포인트</h3><div class="story"><b>${FEEL[it.guide]}</b><br><span class="mute">국민 눈높이의 용어로 생활 속 접점을 제시합니다.</span></div></div>
      <div><h3>6. 연구자 인터뷰 발췌</h3><div class="story">${interviewNote(it) || '<span class="mute">심층 인터뷰(20인 내외) 대상 확정 후 수록합니다. 문항: 연구 출발과 첫 지원, 전환점, 지원이 만든 차이와 대안 요인.</span>'}</div></div>
    </div>
    <div class="sec"><h3>스토리텔링 모델 · ${s.k} ${it.ctype}</h3><div class="story"><b>${s.arc.join(' → ')}</b><br>핵심 질문: ${s.q}<br><span class="mute">주요 근거: ${s.ev}</span></div>${media('심층 사례 원고', '대표성과 백서 수록')}</div>
    <div class="sec staff-only">${scores}</div>${tail}</div>`;
  }

  const last = it.life[it.life.length - 1], turn = it.life[Math.min(it.turn, it.life.length - 1)], before = it.life[Math.max(0, Math.min(it.turn, it.life.length - 1) - 1)];
  return `<div class="panel" role="dialog" aria-modal="true" aria-labelledby="dlg-title">${head}
    <div class="sec"><h3>기본 정보</h3>${info([['분야', `${it.field} · ${d.label}`], ['발굴 유형', guides[it.guide]], ['현재 단계', last.stage], ['대표 키워드', `<span class="tag">${it.field}</span> <span class="tag">${d.short}</span> <span class="tag">${era.label} 첫 지원</span>`], ['공개 동의', it.consent ? '<span class="tag ok">동의 완료</span> 웹플랫폼·백서 활용 범위 안내' : '<span class="tag no">동의 진행 중</span> 동의 전에는 익명 표기'], ['성명·소속', '<span class="mute">공개 동의 범위 내에서 표기 (예시 데이터는 익명 ID)</span>']])}</div>
    <div class="sec"><h3>성장 궤적 · 연구자 생애주기 성장 흐름도</h3><p class="mute sm">지원 이력 × 성과 이력 × 역할 변화를 시계열로 결합</p>
      <div class="flow">${it.life.map((p, i) => `${i ? arrow : ''}<div class="flow-item"><div class="blob ${G[i % 4]} b${i % 3 + 1}" style="width:${56 + i * 7}px;height:${52 + i * 7}px">${i + 1}</div><div class="yr">${p.year}${p === turn ? ' · 전환점' : ''}</div><h4>${p.stage}</h4><p><b>${p.program}</b><br>${p.out}</p></div>`).join('')}</div></div>
    <div class="sec"><h3>지원 이력</h3>${tbl(['지원 단계', '시기', '사업(유형 예시)', '역할', '주요 산출'], it.life.map((p, i) => [p.stage, `${p.year}~`, p.program, ROLES[i], p.out]))}</div>
    ${typeof tlSec === 'function' ? tlSec(it) : ''}${growthAnalysis(it)}
    <div class="sec"><h3>성과 이력</h3><div class="row c5" style="margin:12px 0 0;gap:14px">${[[it.papers, '편', '대표 논문·저서'], [it.patents, '건', '특허·기술이전'], [it.awards, '회', '수상'], [it.startup ? '있음' : '—', '', '창업'], [it.policy, '건', '정책·자문 활동']].map(([n, u, l]) => `<div class="tile"><div class="n" style="font-size:22px">${n}<small> ${u}</small></div><div class="l">${l} (예시)</div></div>`).join('')}</div></div>
    <div class="row c2 sec" style="margin-bottom:0">
      <div><h3>기여 강도 · ${g.label}</h3><div class="story">${g.def}<br><span class="mute">판정 근거(예): ${g.ev}</span></div></div>
      <div><h3>확산 네트워크 · 사제·공동연구</h3>${netSvg(it)}${legend([{ label: '대표 연구자', color: '#EC5C8D' }, { label: `배출 인력 ${it.alumni}명`, color: '#F6A53A' }, { label: `공동연구자 ${it.coauthors}명`, color: '#3D9FE6' }])}<p class="mute sm mt">점의 수는 규모를 줄여 나타낸 약식 도해입니다.</p></div>
    </div>
    <div class="sec"><h3>사례 콘텐츠</h3>${info([['국민 체감 메시지', `<b>${FEEL[it.guide]}</b>`], ['인터뷰 요지', interviewNote(it) || '<span class="mute">심층 인터뷰 후 수록 · 연구 출발과 첫 지원, 성장의 전환점, 후속세대 양성, 정책 제언</span>'], ['대표 일화', '<span class="mute">생애사 중심 원고 작성 시 대상 연구자 사실 확인을 거쳐 수록</span>']])}${media('생애사 사례 원고', '대표 연구자 50인 백서 수록')}</div>
    <div class="sec staff-only">${scores}</div>${tail}</div>`;
};
