/* 07 홍보 확산 추가: 대표연구자 인포그래픽(대표성과 인포그래픽과 같은 양식·모션·HTML 내보내기), 사례집 조판(인쇄·PDF·HTML) */
SUBS.splice(SUBS.findIndex(s => s[0] === 'info') + 1, 0, ['pinfo', '대표연구자 인포그래픽', '인물 중심']);
SUBS.push(['book', '사례집 조판', '인쇄·PDF·HTML']);

/* ---------- 대표연구자 인포그래픽 ---------- */
const pinfoPoster = it => {
  const d = dom(it.domain), g = GRADES[it.grade], era = ERAS.find(e => e.id === it.era), n = it.life.length, last = it.life[n - 1], ti = Math.min(it.turn, n - 1), turn = it.life[ti];
  const peers = PEOPLE.filter(o => o.domain === it.domain), avg = fn => peers.reduce((a, o) => a + fn(o), 0) / peers.length, r1 = x => +x.toFixed(1);
  const rank = [...PEOPLE].sort((a, b) => roi(b) - roi(a)).findIndex(o => o.id === it.id) + 1, drank = [...peers].sort((a, b) => score(b) - score(a)).findIndex(o => o.id === it.id) + 1;
  const cmp = [['재단 지원 과제', it.grants, avg(o => o.grants), '건'], ['누적 지원', it.years, avg(o => o.years), '년'], ['배출 인력', it.alumni, avg(o => o.alumni), '명'], ['대표 논문·저서', it.papers, avg(o => o.papers), '편'], ['투자 대비 성과 지수', roi(it), avg(roi), '']];
  const outs = it.outcomes.map(byId).filter(Boolean), gaps = it.life.slice(1).map((p, i) => [p.year - it.life[i].year, `${it.life[i].stage} → ${p.stage}`]);
  const recs = [['대표 논문·저서', it.papers, Math.max(...peers.map(o => o.papers)), '편'], ['특허·기술이전', it.patents, Math.max(1, ...peers.map(o => o.patents)), '건'], ['수상', it.awards, Math.max(...peers.map(o => o.awards)), '회'], ['정책·자문', it.policy, Math.max(1, ...peers.map(o => o.policy)), '건'], ['공동연구자', it.coauthors, Math.max(...peers.map(o => o.coauthors)), '명']];
  const sc = peers.map(score), lo = Math.min(...sc), hi = Math.max(...sc), px = v => hi > lo ? (v - lo) / (hi - lo) * 100 : 50, me = px(score(it));
  const iv = db.data.interviews.find(x => x.id === it.id), span = Math.max(1, last.year - it.y0);
  return `<article class="poster wide mo" id="poster-${it.id}">
      <header class="${d.g}"><span>대한민국 연구 50년 · 대표 연구자 ${it.id}</span><h2>${it.field} 연구자</h2><p>${FEEL[it.guide]}</p>
        <p class="p-lead">${it.y0}년 「${it.life[0].program}」에서 출발해 <b>${last.year - it.y0}년</b> 만에 ${last.stage}로 성장한 연구자</p>
        <div class="p-tags">${[P_GUIDE[it.guide], d.label, `${era.no} ${era.label} 첫 지원`, last.stage, STAGES[stageOf(it)]].map((t, i) => `<em ${mo(i + 2)}>${t}</em>`).join('')}</div><i class="pd1"></i><i class="pd2"></i><i class="pd3"></i></header>
      <div class="p-nums six">${[[it.y0, '년', '첫 지원'], [it.years, '년', '누적 지원 기간'], [it.grants, '건', '재단 지원 과제'], [it.alumni, '명', '배출 인력'], [it.papers, '편', '대표 논문·저서'], [roi(it).toFixed(1), '', `투자 대비 성과 지수 · 전체 ${rank}위`]].map(([v, u, l], i) => `<div ${mo(i)}><b>${cnt(v)}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>

      <h4>50년 시간축 · 첫 지원에서 오늘까지</h4>
      <div class="p-axis">${axisSvg(it.life.map((p, i) => ({ year: p.year, label: p.stage, star: i === ti && ti > 0 })), d.color, `${it.y0}년부터 ${last.year}년까지 성장 궤적 시간축`)}</div>
      <div class="p-gaps">${gaps.slice(0, 3).map(([gp, l], i) => `<div ${mo(i, .15)}><b>${cnt(gp)}<small>년</small></b><span>${l}</span></div>`).join('')}<div ${mo(3, .15)}><b>${cnt(turn.year - it.y0)}<small>년</small></b><span>첫 지원 → 전환점(${turn.stage})</span></div></div>

      <h4>성장 궤적 · 생애주기마다 무엇이 바뀌었나</h4>
      <div class="p-stages${n > 4 ? ' five' : ''}">${it.life.map((p, i) => { const nx = it.life[i + 1]?.year ?? 2026, dur = Math.max(1, nx - p.year); return `<div ${mo(i, .12)}><span class="blob ${G[i % 4]} b${i % 3 + 1}">${i + 1}</span><small>${p.year}${nx > p.year ? ` ~ ${it.life[i + 1] ? nx : ''}` : ''}${i === ti && ti > 0 ? ' · 전환점 ★' : ''}</small><b>${p.stage}</b>
        <dl><dt>지원 사업</dt><dd>${p.program}</dd><dt>역할</dt><dd>${ROLES[i]}</dd><dt>주요 산출</dt><dd>${p.out}</dd><dt>기간</dt><dd><b>${dur}년</b></dd></dl>
        <div class="grow p-dur" style="--d:${(.3 + i * .15).toFixed(2)}s"><i style="width:${Math.min(100, dur / span * 100 * 1.6)}%;background:${d.color}"></i></div></div>`; }).join('')}</div>
      <div class="p-legend"><span>막대는 단계에 머문 기간</span><span class="mute">· ${it.gap ? `지원 공백 ${it.gap}년을 지나 다시 이어진 연구` : '단절 없는 후속 지원이 이어진 연구'}</span></div>

      <div class="p-three">
        <div ${mo(0)}><h4>연구가 남긴 것 <span style="letter-spacing:0;font-weight:500">· 영역 최고값 대비</span></h4><div class="p-bars">${recs.map(([l, v, m]) => pbar(l, v / m * 100, v, d.color)).join('')}</div>
          <p class="p-note">${it.startup ? '연구 성과가 창업으로 이어졌습니다.' : '학계·산업으로 이어진 연구 네트워크'} · ${d.short} 연구자 ${peers.length}명 기준</p></div>
        <div ${mo(1)}><h4>재단 지원은 어떻게 기여했나</h4><div class="p-type"><span class="blob ${G[it.grade % 4]}">${g.label.slice(0, 2)}</span><div><b>${P_GUIDE[it.guide]}</b><br>${g.def}</div></div>
          <div class="p-kv"><span>기여 강도</span><div><b>${g.label}</b> · 계수 ${g.coef.toFixed(1)}</div><span>판정 근거</span><div>${g.ev}</div><span>전환점</span><div>${turn.year}년 ${turn.stage} · 「${turn.program}」</div><span>지원 연속성</span><div>${it.gap ? `공백 ${it.gap}년` : '공백 없음'} · 누적 ${it.years}년</div></div></div>
        <div ${mo(2)}><h4>세부기준 점수</h4><div class="p-bars">${CRIT.map((c, i) => pbar(c.replace(/ \(.*/, ''), it.scores[i], it.scores[i], d.color)).join('')}</div>
          <h4>영역 평균과 비교 <span style="letter-spacing:0;font-weight:500">· ${d.short} ${peers.length}명</span></h4>
          <div class="p-cmp">${cmp.map(([l, v, a, u]) => { const mx = Math.max(v, a) || 1, f = x => (Number.isInteger(x) ? x : x.toFixed(1)) + u; return `<div><span>${l}</span><i><em class="grow" style="width:${v / mx * 100}%;background:${d.color}"></em><em class="grow" style="width:${a / mx * 100}%;background:#C5CCD9;--d:.2s"></em></i><b>${f(v)}<small> / ${f(a)}</small></b></div>`; }).join('')}</div></div>
      </div>

      <div class="p-two">
        <div ${mo(0)}><h4>영역 안에서의 위치 · ${d.short} ${peers.length}명 중 성과 점수 ${drank}위</h4>
          <div class="p-dist"><div class="p-dline">${peers.map(o => `<i style="left:${px(score(o))}%" ${o.id === it.id ? 'class="me"' : ''}></i>`).join('')}<b style="left:${me}%;background:${d.color};transform:translateX(-${me > 85 ? 100 : me < 15 ? 0 : 50}%)">${score(it)}점</b></div><div class="p-dax"><span>${lo}점</span><span>영역 평균 ${r1(avg(score))}점</span><span>${hi}점</span></div></div>
          <p class="p-note">전체 ${PEOPLE.length}명 중 투자 대비 성과 지수 ${rank}위${rank <= PEOPLE.length / 2 ? ` · 상위 ${Math.max(1, Math.round(rank / PEOPLE.length * 100))}%` : ""}</p></div>
        <div ${mo(1)}><h4>사람으로 이어진 확산 · 사제·공동연구</h4>
          <div class="p-gaps four">${[[it.alumni, '명', '배출 인력'], [it.coauthors, '명', '공동연구자'], [it.policy, '건', '정책·자문'], [outs.length, '건', '연계 대표성과']].map(([v, u, l], i) => `<div ${mo(i + 2)}><b>${cnt(v)}<small>${u}</small></b><span>${l}</span></div>`).join('')}</div>
          <p class="p-note">길러 낸 연구 인력이 학계와 산업으로 퍼져 다음 세대 연구를 잇습니다.</p></div>
      </div>

      ${typeof realRow === 'function' ? realRow(it) : ''}
      <div class="p-three">
        <div ${mo(0)}><h4>발굴·검증</h4><div class="p-kv"><span>발굴 트랙</span><div>${TRACKS[it.track]}${it.track === 'both' ? ' · 핵심 후보' : ' · 추가 근거 확인'}</div><span>근거문헌</span><div>${evOf(it)}건 확인 ${evOf(it) >= 2 ? '(기준 충족)' : '(2건 이상 필요)'}</div><span>검증 단계</span><div>${STAGES.map((st, i) => `<em class="p-step ${i <= stageOf(it) ? 'on' : ''}">${st}</em>`).join('')}</div><span>공개 동의</span><div>${iv?.consent || it.consent ? '인터뷰·공개 동의' : '동의 확인 중 (익명 표기)'}</div></div></div>
        <div ${mo(1)}><h4>함께 만든 대표성과</h4>${outs.map(o => `<div class="p-person"><span class="blob ${dom(o.domain).g}">${o.id.slice(2)}</span><div><b>${o.title}</b><br>${o.path[0].year} → ${o.path[3].year} · ${PATH_STAGES[3]}까지 ${o.path[3].year - o.path[0].year}년</div></div>`).join('') || '<p class="p-note">연계 성과 확인 중</p>'}</div>
        <div ${mo(2)}><h4>이야기의 흐름</h4><div class="p-arc">${ROLES.slice(0, n).map((a, i) => `${i ? chev : ''}<b class="arc" style="--d:${(.4 + i * .2).toFixed(2)}s">${a}</b>`).join('')}</div><p class="p-note">성장의 전환점 · ${turn.year}년 ${turn.stage}, 「${turn.program}」</p><p class="p-note">핵심 메시지 · ${FEEL[it.guide]}</p><p class="p-note">다음 세대 · 배출 인력 ${it.alumni}명이 학계와 산업으로</p></div>
      </div>
      <footer><span>데이터 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터 · 연구자 익명 처리)</span><span>한국연구재단 | 한국외국어대학교</span></footer>
    </article>`;
};
OUT.pinfo = () => {
  const pk = picker('pinfo', 'p'), it = byId(state.pick.pinfo);
  return `
  ${spec('인물 중심', [['보여주는 것', '대표 연구자 한 명의 성장을 한 장으로 — 첫 지원부터 전환점, 생애주기별 역할 변화, 연구가 남긴 것, 사람으로 이어진 확산'], ['구성 요소', '제목·한 줄 요약·체감 문구 · 핵심 숫자 6개 · 50년 시간축(전환점 ★)과 단계 간 시차 · 생애주기 단계별 사업·역할·산출·기간 · 성과 이력 · 기여 강도와 전환점 · 세부기준 점수 · 영역 평균 비교 · 영역 내 위치 · 사제·공동연구 확산 · 발굴·검증·공개 동의 · 연계 대표성과 · 이야기 흐름 · 출처'], ['모션', '대표성과 인포그래픽과 같음 — 숫자 올라가기, 시간축 그리기, 막대 차오르기, 차례로 떠오르기'], ['개인정보', '연구자는 분야로 익명 표기, 공개 동의 확인 후 실명·사진 사용'], ['활용처', '인물관 상세, 사례집·백서, 웹 게시용 단독 HTML, 50주년 전시']])}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:16px"><h2 style="flex:1 1 220px">대표연구자 <b>인포그래픽 예제</b></h2>${pk}
      <button class="btn pri" data-act="inforefresh" data-v="${it.id}" ${isAdmin() ? '' : 'disabled title="관리자·연구진 로그인 후 쓸 수 있습니다"'}>데이터 갱신</button><button class="btn" data-act="idview2" data-v="${it.id}" ${isAdmin() ? '' : 'hidden'}>수집 값 검토</button><button class="btn" data-act="inforeplay">모션 다시 재생</button><button class="btn" data-act="infohtml" data-v="one" data-k="p">HTML 내려받기</button><button class="btn" data-act="infohtml" data-v="all" data-k="p">50인 전체 HTML (ZIP)</button><button class="btn" data-act="print">인쇄</button></div>
    ${infoStatus(it)}
    <div id="infostage">${pinfoPoster(it)}</div>
    <p class="mute sm mt">HTML 파일은 스타일과 모션이 모두 들어 있는 단독 파일입니다(글꼴만 인터넷에서 받습니다).</p>
    <div class="chips mt"><button class="btn" data-act="open" data-v="${it.id}">연구자 상세 열기</button><button class="btn" data-act="sub" data-v="life">이 연구자의 성장 흐름도 보기</button></div>
  </section>`;
};

/* ---------- 사례집 조판: 표준 양식의 인쇄용 HTML(인쇄 창에서 PDF로 저장) ---------- */
state.book = { scope: 'sel', kinds: 'op', n: 10 };
const bookItems = () => { const B = state.book, pick = k => { const L = [...LIST[k]].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)); return B.scope === 'sel' ? L.filter(it => stageOf(it) === 3) : L.slice(0, B.n); }; return [...(B.kinds.includes('o') ? pick('o') : []), ...(B.kinds.includes('p') ? pick('p') : [])]; };
const bookStory = it => { const d = db.data.drafts[it.id]; return d?.draft && d.status !== '초안' ? d.draft.sections.map(s => `<h4>${esc(s.heading)}</h4>${s.paras.map(p => `<p>${esc(p.text)}</p>`).join('')}`).join('') : null; };
const bookPage = (it, i) => {
  const o = it.kind === 'o', d = dom(it.domain), name = o ? it.title : `${it.field} 연구자`, ev = db.data.evidence[it.id] || [], story = bookStory(it);
  const rows = o ? it.path.map((p, k) => [p.year, PATH_STAGES[k], p.program, PATH_OUT[k]]) : it.life.map((p, k) => [p.year, p.stage, p.program, p.out]);
  return `<section class="bk-page"><div class="bk-band" style="background:${d.color}"></div><p class="bk-k">${o ? '대표성과' : '대표 연구자'} ${String(i + 1).padStart(2, '0')} · ${d.label}</p><h2>${esc(name)}</h2><p class="bk-lead">${esc(FEEL[it.guide])}</p>
    <table class="bk-facts"><tr>${(o ? [[`${it.path[0].year}년`, '첫 지원'], [`${it.path[3].year - it.path[0].year}년`, '확산 기간'], [`${it.invest}억`, '실질 투입'], [`${score(it)}점`, '성과 점수']] : [[`${it.y0}년`, '첫 지원'], [`${it.years}년`, '누적 지원'], [`${it.grants}건`, '지원 과제'], [`${it.alumni}명`, '배출 인력']]).map(([v, l]) => `<td><b>${v}</b><span>${l}</span></td>`).join('')}</tr></table>
    <h3>${o ? '영향경로' : '성장 궤적'}</h3><table class="bk-tbl"><thead><tr><th>연도</th><th>${o ? '단계' : '생애주기'}</th><th>지원 사업</th><th>${o ? '주요 산출물' : '주요 산출'}</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <h3>이야기</h3>${story || `<p>${esc(o ? `${it.path[0].year}년 「${it.path[0].program}」 지원으로 시작된 연구는 ${it.path[1].year}년 후속 연구, ${it.path[2].year}년 ${it.path[2].program}을 거쳐 ${it.path[3].year}년 ${PATH_STAGES[3]}에 이르렀습니다. ${USE_DESC[it.guide]}.` : `${it.y0}년 「${it.life[0].program}」으로 연구를 시작해 ${it.life.map(p => `${p.year}년 ${p.stage}`).join(', ')}로 성장했습니다. 배출 인력 ${it.alumni}명, 공동연구자 ${it.coauthors}명과 함께 연구를 이어 왔습니다.`)}</p><p class="bk-note">※ 확정 원고가 없어 사실 목록으로 만든 요약입니다.</p>`}
    <h3>근거</h3>${ev.length ? `<ol class="bk-ev">${ev.map(e => `<li>${esc(e.type)} · ${esc(e.title)}${e.note ? ` · ${esc(e.note)}` : ''}</li>`).join('')}</ol>` : '<p class="bk-note">등록된 근거 문헌 없음</p>'}
    <p class="bk-foot">${it.id} · 대한민국 연구 50년 · 시연용 예시 데이터</p></section>`;
};
const bookHtml = () => {
  const L = bookItems(), today = new Date().toISOString().slice(0, 10);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>대한민국 연구 50년 · 대표 사례집</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>@page{size:A4;margin:18mm 16mm}body{font-family:Pretendard,"Malgun Gothic",sans-serif;color:#27365A;margin:0;line-height:1.65;font-size:10.5pt}
.bk-cover{height:250mm;display:flex;flex-direction:column;justify-content:center;padding:0 10mm;background:linear-gradient(150deg,#3D9FE6,#27365A);color:#fff;page-break-after:always}.bk-cover h1{font-size:34pt;margin:0 0 6mm}.bk-cover p{font-size:13pt;opacity:.9;margin:2mm 0}
.bk-toc{page-break-after:always}.bk-toc h2{font-size:18pt}.bk-toc ol{columns:2;column-gap:10mm;font-size:10pt}.bk-toc li{margin:1.2mm 0;break-inside:avoid}
.bk-page{page-break-before:always;position:relative}.bk-band{height:3mm;border-radius:2mm;margin-bottom:5mm}.bk-k{font-size:9pt;color:#5D6980;margin:0;letter-spacing:.04em}.bk-page h2{font-size:20pt;margin:1mm 0 2mm}.bk-lead{font-size:11.5pt;color:#5D6980;margin:0 0 5mm}
.bk-facts{width:100%;border-collapse:separate;border-spacing:3mm 0;margin:0 -3mm 4mm}.bk-facts td{background:#F1F4F8;border-radius:3mm;padding:3mm;text-align:center}.bk-facts b{display:block;font-size:15pt}.bk-facts span{font-size:8.5pt;color:#5D6980}
h3{font-size:12pt;margin:6mm 0 2mm;border-left:3px solid #3D9FE6;padding-left:2.5mm}h4{font-size:11pt;margin:4mm 0 1mm}.bk-tbl{width:100%;border-collapse:collapse;font-size:9.5pt}.bk-tbl th,.bk-tbl td{border-bottom:1px solid #DDE2EA;padding:1.6mm 2mm;text-align:left;vertical-align:top}.bk-tbl th{background:#F1F4F8}
.bk-ev{font-size:9pt;padding-left:5mm}.bk-note{font-size:8.5pt;color:#7A869C}.bk-foot{font-size:8pt;color:#9AA4B5;margin-top:8mm;border-top:1px solid #E3E7EE;padding-top:2mm}
.bk-bar{position:sticky;top:0;background:#fff;padding:8px;text-align:right;border-bottom:1px solid #eee}@media print{.bk-bar{display:none}}</style></head><body>
<div class="bk-bar"><button onclick="print()">인쇄 · PDF로 저장</button></div>
<section class="bk-cover"><p>한국연구재단 50주년</p><h1>대한민국 연구 50년<br>대표 사례집</h1><p>${L.filter(x => x.kind === 'o').length ? `대표성과 ${L.filter(x => x.kind === 'o').length}편` : ''}${L.filter(x => x.kind === 'o').length && L.filter(x => x.kind === 'p').length ? ' · ' : ''}${L.filter(x => x.kind === 'p').length ? `대표 연구자 ${L.filter(x => x.kind === 'p').length}인` : ''}</p><p style="margin-top:20mm;font-size:10pt">${today} · 한국연구재단 | 한국외국어대학교 · 시연용 예시 데이터</p></section>
<section class="bk-toc"><h2>차례</h2><ol>${L.map(it => `<li>${esc(it.kind === 'o' ? it.title : `${it.field} 연구자`)} <span style="color:#7A869C">· ${it.id}</span></li>`).join('')}</ol></section>
${L.map((it, i) => bookPage(it, L.filter(x => x.kind === it.kind).indexOf(it))).join('')}</body></html>`;
};
OUT.book = () => {
  const B = state.book, L = bookItems();
  return `
  ${spec('성과·인물 중심', [['보여주는 것', '확정된 대표성과·대표 연구자를 표준 양식의 사례집으로 일괄 조판'], ['구성', '표지 · 차례 · 항목마다 한 쪽 이상(영역 색 띠, 핵심 숫자 4개, 영향경로·성장 궤적 표, 이야기, 근거 목록, 출처)'], ['이야기 본문', '원고 초안의 상태가 "검토 중"·"확정"이면 그 원고를, 아니면 사실 목록으로 만든 요약을 넣습니다.'], ['출력', '한글(HWPX) 문서 · 인쇄 창에서 PDF로 저장(A4) · 단독 HTML. HWPX는 표지·차례·항목별 새 쪽(핵심 숫자 표, 영향경로·성장 궤적 표, 이야기, 관련 성과 표, 근거)으로 구성되며 한글에서 바로 열어 고칠 수 있습니다.']])}
  <section class="slide"><div class="toolbar" style="margin-bottom:10px"><h2 style="flex:1 1 220px">사례집 <b>조판</b> <span class="mute sm">${L.length}편</span></h2>
    <select class="field" data-chg="bkscope" style="flex:0 1 170px">${[['sel', '최종선정만'], ['top', '점수 상위']].map(([v, l]) => `<option value="${v}" ${B.scope === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    ${B.scope === 'top' ? `<select class="field" data-chg="bkn" style="flex:0 1 110px">${[5, 10, 20, 50].map(n => `<option value="${n}" ${B.n === n ? 'selected' : ''}>각 ${n}편</option>`).join('')}</select>` : ''}
    <select class="field" data-chg="bkkinds" style="flex:0 1 160px">${[['op', '성과 + 연구자'], ['o', '대표성과만'], ['p', '대표 연구자만']].map(([v, l]) => `<option value="${v}" ${B.kinds === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <button class="btn pri" data-act="bookprint" ${L.length ? '' : 'disabled'}>인쇄 · PDF</button><button class="btn pri" data-act="bookhwpx" ${L.length ? '' : 'disabled'}>한글(HWPX) 내려받기</button><button class="btn" data-act="bookhtml" ${L.length ? '' : 'disabled'}>HTML 내려받기</button></div>
    ${L.length ? `<div class="bookprev">${bookPage(L[0], 0)}</div><p class="mute sm mt">첫 쪽 미리보기입니다. 원고가 확정된 항목: ${L.filter(it => bookStory(it)).length} / ${L.length}</p>` : '<p class="mute sm mt">조건에 맞는 항목이 없습니다. 최종선정이 없으면 "점수 상위"로 바꿔 보세요.</p>'}
  </section>`;
};
Object.assign(ACT, {
  bkscope: v => { state.book.scope = v; render(); }, bkn: v => { state.book.n = +v; render(); }, bkkinds: v => { state.book.kinds = v; render(); },
  bookprint: () => { const w = window.open('', '_blank'); if (!w) return toast('팝업이 막혀 있습니다. HTML 내려받기를 쓰세요.'); w.document.write(bookHtml()); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* 사용자가 직접 인쇄 */ } }, 800); },
  bookhwpx: async (v, t) => { const l = t.textContent; t.textContent = '만드는 중…'; try { download(`대한민국연구50년_사례집_${new Date().toISOString().slice(0, 10)}.hwpx`, new Blob([await bookHwpx(bookItems())], { type: 'application/hwp+zip' })); t.textContent = '내려받기 완료'; } catch (e) { console.error(e); t.textContent = '만들기 실패'; } setTimeout(() => { if (t.isConnected) t.textContent = l; }, 2500); },
  bookhtml: () => download(`대한민국연구50년_사례집_${new Date().toISOString().slice(0, 10)}.html`, new Blob([bookHtml()], { type: 'text/html' })),
});
