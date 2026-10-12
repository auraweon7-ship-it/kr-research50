/* 통합 검색: 성과·연구자·메뉴·구역을 한 번에 찾는다. 사이드바 입력창(#q)과 결과 목록(#qres)을 쓴다 */
const SEARCH_SECTIONS = {
  goal: ['추진배경', '단기 성과관리의 한계', '연구 필요성', '연구 목적', '산출물·정량 목표', '추진전략·로드맵', '기대효과·활용'],
  system: ['투입 포트폴리오', '발굴체계 S1~S6', '세부기준 C1~C6', '50년 시대 구간', '투웨이 하이브리드', '6대 가이드라인·가중치', '선정 절차·선정위원회'],
  outcomes: ['후보 탐색', '발전 과정과 기여 유형', '발굴 현황과 균형', '심층 사례와 산출물'],
  people: ['후보 탐색', '생애주기 성장경로', '다각적 평가와 현황', '프로필 DB와 산출물'],
  contribution: ['기여 관점과 6단계', '기여 강도 판정', '단계별 기여 구성', '투자 대비 성과 지수', '정량·정성 검증'],
  'outreach/plan': ['사례집 기획·원고', '시각화 자료 구성안', '스토리텔링 모델', '확산 산출물', '통합 웹플랫폼', '백서·홍보 책자', '영상·인포그래픽·YouTube', '확산 채널'],
};
const sx = { items: [], cur: -1 };
const searchIndex = () => {
  const ok = id => staff() || !VIEWS.find(v => v.id === id).staff, out = [];
  const show = it => staff() || stageOf(it) === 3;   // 공개용에서는 최종선정만 찾는다
  for (const o of OUTCOMES) if (show(o)) out.push({ t: '성과', label: o.title, sub: `${o.id} · ${dom(o.domain).short} · ${o.y0}년 · ${o.region}`, key: `${o.title} ${o.id} ${dom(o.domain).label} ${O_GUIDE[o.guide]} ${o.ctype} ${o.region} ${o.y0}`, go: `outcomes/${o.id}` });
  for (const p of PEOPLE) if (show(p)) out.push({ t: '연구자', label: `${p.title} · ${p.field}`, sub: `${p.id} · ${dom(p.domain).short} · 첫 지원 ${p.y0}년`, key: `${p.title} ${p.field} ${p.id} ${dom(p.domain).label} ${P_GUIDE[p.guide]} ${p.y0}`, go: `people/${p.id}` });
  for (const v of visibleViews()) {
    out.push({ t: '메뉴', label: v.t.join(' '), sub: v.sub.slice(0, 46) + '…', key: v.t.join(' ') + ' ' + v.sub, go: v.id });
    for (const [sv, sl, st] of SUBMAP[v.id]?.[0] || []) out.push({ t: '메뉴', label: `${v.t.join(' ')} › ${sl}`, sub: st, key: `${sl} ${st}`, go: `${v.id}/${sv}` });
  }
  for (const [path, labels] of Object.entries(SEARCH_SECTIONS)) if (ok(path.split('/')[0])) labels.forEach((l, i) => out.push({ t: '구역', label: l, sub: VIEWS.find(v => v.id === path.split('/')[0]).t.join(' '), key: l, go: `${path}@s${i + 1}` }));
  return out;
};
const searchClose = () => { const r = $('#qres'); if (r && !r.hidden) { r.hidden = true; $('#q').setAttribute('aria-expanded', 'false'); } sx.cur = -1; };
const searchPaint = () => {
  const r = $('#qres'), q = $('#q');
  r.innerHTML = sx.items.length ? sx.items.map((x, i) => `<button role="option" id="qo${i}" aria-selected="${i === sx.cur}" class="${i === sx.cur ? 'on' : ''}" data-act="go" data-v="${x.go}"><span class="tag">${x.t}</span><span><b>${x.label}</b><br><small>${x.sub}</small></span></button>`).join('') : '<p class="mute sm" style="padding:10px 12px">찾는 결과가 없습니다.</p>';
  r.hidden = false; q.setAttribute('aria-expanded', 'true'); q.setAttribute('aria-activedescendant', sx.cur >= 0 ? `qo${sx.cur}` : '');
  applyLang(r);
};
const searchRun = text => {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return searchClose();
  const order = { 성과: 0, 연구자: 1, 메뉴: 2, 구역: 3 };
  sx.items = searchIndex().filter(x => { const k = x.key.toLowerCase(); return words.every(w => k.includes(w)); })
    .sort((a, b) => (b.label.toLowerCase().startsWith(words[0]) - a.label.toLowerCase().startsWith(words[0])) || order[a.t] - order[b.t]).slice(0, 12);
  sx.cur = sx.items.length ? 0 : -1; searchPaint();
};
const searchKey = e => {
  if ($('#qres').hidden || !sx.items.length) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sx.cur = (sx.cur + (e.key === 'ArrowDown' ? 1 : -1) + sx.items.length) % sx.items.length; searchPaint(); }
  else if (e.key === 'Enter' && sx.cur >= 0) { e.preventDefault(); const go = sx.items[sx.cur].go; $('#q').value = ''; searchClose(); ACT.go(go); }
};
