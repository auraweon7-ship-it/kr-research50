/* 국민 서비스(공개): 이야기 페이지, 국민 참여(지역·분야 찾기·투표·응원), 오픈 데이터, 전시 모드.
   연구자 입력 폼(#/form/토큰)도 여기서 그린다. 서버가 없으면 투표·응원·폼은 안내만 보인다. */
const SVC_SUBS = [['story', '이야기', '성과·인물 스크롤 스토리'], ['join', '국민 참여', '찾기·투표·응원'], ['open', '오픈 데이터', 'CSV·JSON·API'], ['kiosk', '전시 모드', '50주년 전시 화면']];
VIEWS.splice(VIEWS.findIndex(v => v.id === 'outreach') + 1, 0, { id: 'svc', t: ['국민', '서비스'], sub: '대표성과·연구자의 이야기를 읽고, 내 지역·분야의 성과를 찾고, 국민이 뽑는 대표성과에 투표하고 응원을 남깁니다. 공개 데이터도 내려받을 수 있습니다.' });
VIEWS.push({ id: 'form', hidden: true, t: ['연구자', '정보 입력'], sub: '한국연구재단 50년 대표 연구자 사례 발굴을 위한 정보 입력' });
state.ssub = 'story'; state.story = null;
state.svc = { region: '', domain: '', votes: null, mine: [], cheers: null, cheerItem: '', pending: null, kiosk: { kind: 'all', list: 'sel', pick: [], sec: 14 }, form: null };
const svcPick = () => { const L = [...OUTCOMES, ...PEOPLE].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)); return byId(state.story || '') || L[0]; };
const nameOf2 = it => it.kind === 'o' ? it.title : `${it.field} 연구자`;

/* ---------- 이야기: 스크롤하면 장면이 바뀌는 한 편의 이야기 ---------- */
const storySec = (n, kicker, title, body, visual) => `<section class="st-sec" data-n="${n}"><div class="st-vis">${visual}</div><div class="st-txt"><span class="st-k">${kicker}</span><h3>${title}</h3>${body}</div></section>`;
const storyHtml = it => {
  const o = it.kind === 'o', d = dom(it.domain), era = ERAS.find(e => e.id === it.era);
  const people = o ? it.people.map(byId) : [], outs = o ? [] : it.outcomes.map(byId).filter(Boolean);
  const big = (v, u, l) => `<div class="st-big" style="color:${d.color}"><b data-to="${v}">${v}</b><small>${u}</small><span>${l}</span></div>`;
  const cheers = (state.svc.cheers || []).filter(c => c.item === it.id).slice(0, 3);
  const secs = o ? [
    storySec(1, '이야기의 시작', `${it.path[0].year}년, 한 과제에서 출발했습니다`, `<p>「${it.path[0].program}」 지원으로 ${it.path[0].desc}. ${era.no} ${era.label}, ${era.sys}의 시기였습니다.</p>`, big(it.path[0].year, '년', '첫 지원')),
    storySec(2, '이어받은 사람들', `${it.path[3].year - it.path[0].year}년에 걸친 확산의 길`, ul(it.path.map((p, i) => `<b>${p.year}</b> ${PATH_STAGES[i]} · ${p.program}`)), `<div class="st-axis">${infoAxis(it)}</div>`),
    storySec(3, '누가 함께 만들었나', '정부 지원이 마중물이 되었습니다', `<p>초기 단계 정부 지원 ${it.mix[0][0]}%에서 활용 단계 ${it.mix[3][0]}%로, 민간 투자는 ${it.mix[0][3]}%에서 ${it.mix[3][3]}%로 바뀌었습니다. 지원이 길을 열고 민간과 지역이 이어받은 구조입니다.</p>`, `<div class="st-stack">${it.mix.map((m, i) => `<div><small>${PATH_STAGES[i]}</small><div class="grow">${stack(m)}</div></div>`).join('')}${legend(FACTORS)}</div>`),
    storySec(4, '함께한 연구자', people.length ? `${people.length}명의 연구자가 이었습니다` : '연구자 확인 중', people.length ? ul(people.map(p => `${p.title} · ${p.field} · 배출 인력 ${p.alumni}명`)) : '<p>연계 연구자를 확인하고 있습니다.</p>', big(people.reduce((a, p) => a + p.alumni, 0), '명', '연계 연구자가 길러 낸 인력')),
    storySec(5, '국민의 삶에서', FEEL[it.guide], `<p>${USE_DESC[it.guide]}. ${it.region}에서 시작된 성과가 생활 곳곳으로 이어졌습니다.</p>`, big(it.path[3].year, '년', PATH_STAGES[3])),
  ] : [
    storySec(1, '첫 지원', `${it.y0}년, 연구자의 길이 열렸습니다`, `<p>「${it.life[0].program}」 지원으로 ${ROLES[0]}에서 출발했습니다. ${era.no} ${era.label}의 일입니다.</p>`, big(it.y0, '년', '첫 지원')),
    storySec(2, '성장 궤적', '생애주기를 따라 자랐습니다', ul(it.life.map((p, i) => `<b>${p.year}</b> ${p.stage} · ${ROLES[i]}`)), `<div class="st-axis">${axisSvg(it.life.map((p, i) => ({ year: p.year, label: p.stage, star: i === Math.min(it.turn, it.life.length - 1) && it.turn > 0 })), d.color, '성장 궤적')}</div>`),
    storySec(3, '지원이 키운 것', `${it.years}년의 지원, ${it.grants}개의 과제`, `<p>${it.gap ? `지원 공백 ${it.gap}년을 지나 다시 이어진 연구는` : '단절 없는 후속 지원 속에서'} 대표 논문·저서 ${it.papers}편, 특허·기술이전 ${it.patents}건으로 이어졌습니다.</p>`, big(it.papers, '편', '대표 논문·저서')),
    storySec(4, '다음 세대로', `${it.alumni}명이 학계와 산업으로`, `<p>공동연구자 ${it.coauthors}명과 함께 연구했고, 길러 낸 인력이 다음 연구를 잇습니다.${outs.length ? ` 연계 대표성과: ${outs.map(x => x.title).join(', ')}.` : ''}</p>`, big(it.alumni, '명', '배출 인력')),
    storySec(5, '전하고 싶은 말', FEEL[it.guide], `<p>${P_GUIDE[it.guide]} 유형의 연구자입니다.</p>`, big(it.life.at(-1).year, '년', it.life.at(-1).stage)),
  ];
  return `<article class="story-pg">
    <header class="st-hero ${d.g}"><span>대한민국 연구 50년 · ${o ? '대표성과' : '대표 연구자'} ${it.id}</span><h2>${esc(nameOf2(it))}</h2><p>${FEEL[it.guide]}</p><em>아래로 스크롤하세요 ↓</em><i class="pd1"></i><i class="pd2"></i></header>
    ${secs.join('')}
    <section class="st-end"><h3>이 이야기를 나누세요</h3><div class="chips"><button class="btn pri" data-act="stshare" data-v="${it.id}">공유 링크 복사</button><button class="btn" data-act="stcard" data-v="${it.id}">공유 이미지 내려받기</button><button class="btn" data-act="open" data-v="${it.id}">자세히 보기</button><button class="btn" data-act="nav" data-v="svc:join">응원 남기기</button></div>
      ${cheers.length ? `<div class="cheers">${cheers.map(c => `<p>“${esc(c.text)}” <span class="mute">— ${esc(c.nick)}</span></p>`).join('')}</div>` : ''}</section></article>`;
};
const SV = {};
SV.story = () => {
  const it = svcPick(), list = [...OUTCOMES, ...PEOPLE].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a));
  if (state.svc.cheers === null) svcLoad();
  return `<div class="toolbar" style="margin-bottom:14px"><select class="field" data-chg="stpick" style="flex:1 1 320px" aria-label="이야기 고르기">${list.map(x => `<option value="${x.id}" ${x.id === it.id ? 'selected' : ''}>${x.kind === 'o' ? '성과' : '연구자'} · ${esc(nameOf2(x))}${stageOf(x) === 3 ? ' (최종선정)' : ''}</option>`).join('')}</select></div>
    <div id="storystage">${storyHtml(it)}</div>`;
};
// 이야기 장면은 화면에 들어올 때 하나씩 나타난다
const storyMotion = () => {
  const el = $('#storystage'); if (!el) return;
  const secs = [...el.querySelectorAll('.st-sec')], count = s => s.querySelectorAll('[data-to]').forEach(b => { const to = +b.dataset.to, t0 = performance.now(); const f = now => { const k = Math.min(1, (now - t0) / 1100); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; b.textContent = 0; requestAnimationFrame(f); });
  const check = () => { if (!el.isConnected) return removeEventListener('scroll', check, true); for (const s of secs) if (!s.classList.contains('in') && s.getBoundingClientRect().top < innerHeight * .8) { s.classList.add('in'); count(s); } if (secs.every(s => s.classList.contains('in'))) removeEventListener('scroll', check, true); };
  addEventListener('scroll', check, { capture: true, passive: true }); check(); setTimeout(check, 400);
};

/* ---------- 국민 참여 ---------- */
const svcLoad = async () => {
  if (state.svc.cheers !== null && state.svc.votes !== null) return;
  state.svc.cheers = []; state.svc.votes = {};
  try { const [v, c] = await Promise.all([apiJ('/api/votes'), apiJ('/api/cheers')]); state.svc.votes = v; state.svc.cheers = c; state.svc.srv = true; } catch (e) { state.svc.srv = false; }
  if (isAdmin()) { try { state.svc.pending = (await apiJ('/api/cheers?all=1')).filter(c => !c.ok); } catch (e) { /* 서버 없음 */ } }
  if (state.view === 'svc') render();
};
SV.join = () => {
  const S = state.svc; if (S.cheers === null) svcLoad();
  const outs = OUTCOMES.filter(o => (!S.region || o.region === S.region) && (!S.domain || o.domain === S.domain)), ppl = PEOPLE.filter(p => !S.domain || p.domain === S.domain);
  const vote = [...OUTCOMES].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)).slice(0, 50), V = S.votes || {}, vmax = Math.max(1, ...Object.values(V)), top = Object.entries(V).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return `
  ${slide('내 지역·내 분야의 <b>성과 찾기</b>', `<div class="toolbar mt"><select class="field" data-chg="jregion" style="flex:0 1 180px"><option value="">전국</option>${REGIONS.map(r => `<option ${S.region === r.id ? 'selected' : ''}>${r.id}</option>`).join('')}</select>
      <select class="field" data-chg="jdomain" style="flex:0 1 220px"><option value="">모든 분야</option>${DOMAINS.map(d => `<option value="${d.id}" ${S.domain === d.id ? 'selected' : ''}>${d.label}</option>`).join('')}</select></div>
    <p class="sm mt"><b>${S.region || '전국'}</b>에서 확산된 성과 ${outs.length}건${S.domain ? ` · 같은 분야 연구자 ${ppl.length}명` : ''}</p>
    <div class="chips mt">${outs.slice(0, 24).map(o => `<button class="chip" data-act="stgo" data-v="${o.id}"><i style="background:${dom(o.domain).color}"></i>${esc(o.title)}</button>`).join('') || '<span class="mute sm">조건에 맞는 성과가 없습니다.</span>'}</div>`, '사는 지역과 관심 분야를 고르면 그곳에서 확산된 대표성과를 찾아 이야기로 보여 줍니다.')}
  <div class="row c2">
    ${slide('국민이 뽑는 <b>대표성과</b>', S.srv === false ? noSrv('투표') : `<p class="sm mt">마음에 드는 성과를 3개까지 고르세요 (하루 한 번, 다시 보내면 바뀝니다).</p>
      <div class="votelist">${vote.map(o => `<label class="${S.mine.includes(o.id) ? 'on' : ''}"><input type="checkbox" data-chg="vpick" data-v="${o.id}" ${S.mine.includes(o.id) ? 'checked' : ''}> ${esc(o.title)}</label>`).join('')}</div>
      <div class="chips mt"><button class="btn pri" data-act="vsend" ${S.mine.length ? '' : 'disabled'}>투표하기 (${S.mine.length}/3)</button></div>
      ${top.length ? `<h3 class="mt" style="font-size:13px">지금까지 결과</h3>${top.map(([id, n], i) => bar(esc(byId(id)?.title || id), n / vmax * 100, `${n}표`, GC[i % 4], '1fr 120px 50px')).join('')}` : ''}`)}
    ${slide('연구자에게 <b>응원 남기기</b>', S.srv === false ? noSrv('응원') : `<div class="qfgrid"><label style="grid-column:1/-1">대상<select class="field" data-chg="chitem">${[...OUTCOMES, ...PEOPLE].map(x => `<option value="${x.id}" ${S.cheerItem === x.id ? 'selected' : ''}>${x.kind === 'o' ? '성과' : '연구자'} · ${esc(nameOf2(x))}</option>`).join('')}</select></label>
        <label>이름(별명)<input class="field" id="chnick" maxlength="20" placeholder="익명"></label><label style="grid-column:1/-1">응원 한마디 (200자)<textarea class="field" id="chtext" maxlength="200" rows="3"></textarea></label></div>
      <div class="chips"><button class="btn pri" data-act="chsend">응원 보내기</button></div><p class="mute sm mt">보낸 응원은 운영자 확인 후 게시됩니다. 개인정보(연락처 등)는 적지 마세요.</p>
      ${(S.cheers || []).length ? `<div class="cheers">${S.cheers.slice(0, 8).map(c => `<p>“${esc(c.text)}” <span class="mute">— ${esc(c.nick)} · ${esc(nameOf2(byId(c.item) || { kind: 'o', title: c.item }))}</span></p>`).join('')}</div>` : ''}
      ${isAdmin() && S.pending?.length ? `<h3 class="mt" style="font-size:13px">게시 대기 ${S.pending.length}건 (관리자)</h3>${tbl(['대상', '응원', ''], S.pending.map(c => [esc(c.item), `${esc(c.text)} <span class="mute">— ${esc(c.nick)}</span>`, `<div class="chips" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-act="chok" data-v="${c.id}">게시</button><button class="btn" data-act="chdel" data-v="${c.id}">삭제</button></div>`]))}` : ''}`)}
  </div>`;
};

/* ---------- 오픈 데이터 ---------- */
const OPEN_FIELDS = { outcomes: [['id', '성과 번호'], ['title', '성과명'], ['domain', '지원 영역'], ['type', '발굴 유형'], ['first_support', '첫 지원 연도'], ['spread_years', '확산 기간(년)'], ['region', '확산 권역'], ['stages', '영향경로 단계'], ['status', '검증 단계'], ['message', '국민 체감 문구']], people: [['id', '연구자 번호(익명)'], ['field', '연구 분야'], ['domain', '지원 영역'], ['type', '발굴 유형'], ['first_support', '첫 지원 연도'], ['support_years', '누적 지원(년)'], ['grants', '재단 지원 과제 수'], ['alumni', '배출 인력'], ['stages', '생애주기 단계'], ['status', '검증 단계']] };
SV.open = () => `
  ${slide('공개 <b>데이터</b>', `<div class="row c2">${['outcomes', 'people'].map(k => `<div class="story"><b>${k === 'outcomes' ? '대표성과' : '대표 연구자'}</b> <span class="mute sm">${(k === 'outcomes' ? OUTCOMES : PEOPLE).length}건</span>
      <div class="chips mt"><a class="btn" href="/api/open/${k}.csv" download>CSV</a><a class="btn" href="/api/open/${k}.json" target="_blank" rel="noopener">JSON · API</a><button class="btn" data-act="opendl" data-v="${k}">이 브라우저에서 CSV 만들기</button></div>
      ${tbl(['열', '뜻'], OPEN_FIELDS[k].map(([a, b]) => [`<code>${a}</code>`, b]))}</div>`).join('')}</div>`,
    '대표성과·대표 연구자의 공개 항목을 CSV·JSON으로 제공합니다. 이용조건: CC BY 4.0 — 출처 "대한민국 연구 50년(한국연구재단·한국외국어대학교)"를 표시하면 자유롭게 쓸 수 있습니다. 연구자는 익명 처리했고, 지금 값은 시연용 예시입니다.')}
  ${slide('API <b>사용 예</b>', `<pre class="code">fetch('${location.origin}/api/open/outcomes.json')
  .then(r => r.json())
  .then(d => console.log(d.license, d.count, d.items[0]));</pre><p class="mute sm mt">주소: <code>/api/open/outcomes.json</code> · <code>/api/open/people.json</code> · <code>.csv</code> — 다른 사이트에서도 호출할 수 있고(CORS 허용) 분당 60회로 제한합니다. 서버 없이 정적 호스팅만 할 때는 "이 브라우저에서 CSV 만들기"를 쓰세요.</p>`)}`;

/* ---------- 전시 모드 ---------- */
// 전시 대상: 종류(대표성과·대표 연구자·모두) × 범위(최종선정·상위 20·전체·직접 선택)
const kioskPool = () => { const K = state.svc.kiosk; return (K.kind === 'o' ? OUTCOMES : K.kind === 'p' ? PEOPLE : [...OUTCOMES, ...PEOPLE]).slice().sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)); };
const kioskList = () => {
  const K = state.svc.kiosk, L = kioskPool();
  if (K.list === 'pick') { const s = new Set(K.pick); return L.filter(it => s.has(it.id)); }
  if (K.list === 'all') return L;
  if (K.list === 'top') return L.slice(0, 20);
  const s = L.filter(it => stageOf(it) === 3); return s.length ? s : L.slice(0, 20);
};
SV.kiosk = () => {
  const K = state.svc.kiosk, L = kioskList(), pool = kioskPool(), chip = (k, v, l) => `<button class="chip ${K[k] === v ? 'on' : ''}" data-act="ksset" data-k="${k}" data-v="${v}">${l}</button>`;
  return `
  ${slide('50주년 <b>전시 모드</b>', `<div class="kset">
      <div><span>전시 대상</span><div class="chips">${chip('kind', 'o', `대표성과 ${OUTCOMES.length}`)}${chip('kind', 'p', `대표 연구자 ${PEOPLE.length}`)}${chip('kind', 'all', '모두')}</div></div>
      <div><span>범위</span><div class="chips">${chip('list', 'sel', '최종선정')}${chip('list', 'top', '점수 상위 20')}${chip('list', 'all', '전체')}${chip('list', 'pick', '직접 선택')}</div></div>
      <div><span>넘김 간격</span><div class="chips">${[10, 14, 20, 30].map(s => `<button class="chip ${K.sec === s ? 'on' : ''}" data-act="kssec" data-v="${s}">${s}초</button>`).join('')}</div></div>
    </div>
    ${K.list === 'pick' ? `<div class="kpick"><div class="toolbar" style="margin:0 0 8px"><b class="sm" style="flex:1">${K.pick.filter(id => pool.some(x => x.id === id)).length} / ${pool.length} 선택</b><button class="btn" data-act="kpall">모두 선택</button><button class="btn" data-act="kpnone">모두 해제</button><button class="btn" data-act="kpsel">최종선정만 선택</button></div>
      <div class="kpick-grid">${pool.map(it => `<label class="${K.pick.includes(it.id) ? 'on' : ''}"><input type="checkbox" data-chg="kpone" data-v="${it.id}" ${K.pick.includes(it.id) ? 'checked' : ''}><i style="background:${dom(it.domain).color}"></i>${it.kind === 'o' ? '성과' : '연구자'} · ${esc(nameOf2(it))}${stageOf(it) === 3 ? ' ★' : ''}</label>`).join('')}</div></div>` : ''}
    <div class="chips mt"><button class="btn pri kgo" data-act="kstart" data-v="0" ${L.length ? '' : 'disabled'}>⛶ 전시 모드로 전환 (${L.length}편)</button></div>
    <p class="mute sm mt">전시 모드는 화면 전체를 쓰는 키오스크 화면입니다. 인포그래픽이 모션과 함께 자동으로 넘어가고, 화면을 누르면 멈춘 뒤 "자세히"로 상세를 볼 수 있습니다. Esc 또는 닫기로 끝냅니다.</p>`, '전시장 화면에 띄워 두면 고른 대표성과·연구자의 인포그래픽이 차례로 돌아갑니다.')}
  <section class="slide"><div class="toolbar" style="margin-bottom:10px"><h2 style="flex:1 1 200px">전시 화면 <b>미리보기</b> <span class="mute sm" id="kp-n"></span></h2>
      <button class="btn" data-act="kpprev">←</button><button class="btn" data-act="kppause" id="kp-play">❚❚ 멈춤</button><button class="btn" data-act="kpnext">→</button><button class="btn pri" data-act="kpfull">⛶ 이 화면부터 전시 모드</button></div>
    ${L.length ? `<div class="kprev" id="kprev"><div class="kp-top"><b>대한민국 연구 50년</b><span id="kp-title"></span></div><div class="kp-bar"><i></i></div><div class="kp-stage"><div class="kp-inner"></div></div></div>
      <div class="kp-thumbs">${L.slice(0, 60).map((it, i) => `<button class="kp-th" data-act="kpgo" data-v="${i}" style="--c:${dom(it.domain).color}" title="${esc(nameOf2(it))}">${i + 1}</button>`).join('')}</div>` : '<p class="mute sm mt">전시할 항목이 없습니다. 대상과 범위를 바꿔 보세요.</p>'}
  </section>`;
};
// 미리보기: 실제 전시 화면(1200px)을 축소해 같은 순서·간격으로 돌린다(포스터 전체가 보이도록 높이를 맞춤)
const kp = { i: 0, timer: null, paused: false };
// 화면보다 긴 포스터는 넘김 간격 동안 천천히 아래로 훑어 내려간다
const autoScroll = (inn, k, h, sec) => { inn.getAnimations().forEach(a => a.cancel()); const dist = Math.max(0, inn.scrollHeight - h / k); inn.style.transform = `scale(${k})`; if (!dist || REDUCE) return; inn.animate([{ transform: `scale(${k}) translateY(0)` }, { transform: `scale(${k}) translateY(-${dist}px)` }], { duration: Math.max(3000, (sec - 4) * 1000), delay: 2500, fill: 'forwards', easing: 'ease-in-out' }); };
const kpFit = (scroll) => { const st = $('#kprev .kp-stage'), inn = st?.firstElementChild; if (!inn) return; const k = st.clientWidth / 1200, h = inn.scrollHeight * k; st.style.height = `${h}px`; if (scroll) autoScroll(inn, k, h, kp.paused ? 9999 : state.svc.kiosk.sec); else if (!inn.getAnimations().length) inn.style.transform = `scale(${k})`; };
const kpShow = () => {
  const L = kioskList(), el = $('#kprev'); if (!el || !L.length) return; kp.i = (kp.i + L.length) % L.length; const it = L[kp.i];
  const inn = el.querySelector('.kp-inner'); inn.innerHTML = it.kind === 'o' ? infoPoster(it) : pinfoPoster(it); kpFit(!kp.paused); infoPlay(inn, true);
  $('#kp-title').textContent = nameOf2(it); $('#kp-n').textContent = `${kp.i + 1} / ${L.length}`;
  document.querySelectorAll('.kp-th').forEach((b, i) => b.classList.toggle('on', i === kp.i));
  const bar = el.querySelector('.kp-bar i'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = `width ${state.svc.kiosk.sec}s linear`; bar.style.width = kp.paused ? '0' : '100%';
};
const kpTick = () => { clearTimeout(kp.timer); if (kp.paused) return; kp.timer = setTimeout(() => { if (!$('#kprev')) return; kp.i++; kpShow(); kpTick(); }, state.svc.kiosk.sec * 1000); };
const kioskPrevMount = () => { const el = $('#kprev'); if (!el) { clearTimeout(kp.timer); return; } if (el.dataset.on) return; el.dataset.on = '1'; kpShow(); kpTick(); if (!kp.ro) { kp.ro = new ResizeObserver(() => kpFit()); } kp.ro.disconnect(); kp.ro.observe(el); };
const kiosk = { i: 0, timer: null, paused: false };
const kioskShow = () => {
  const L = kioskList(), el = $('#kiosk'); if (!el) return; const it = L[kiosk.i % L.length];
  el.querySelector('.ks-body').innerHTML = it.kind === 'o' ? infoPoster(it) : pinfoPoster(it);
  el.querySelector('.ks-n').textContent = `${kiosk.i % L.length + 1} / ${L.length}`; el.querySelector('.ks-body').scrollTop = 0;
  const bar = el.querySelector('.ks-bar i'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = `width ${state.svc.kiosk.sec}s linear`; bar.style.width = kiosk.paused ? '0' : '100%';
  infoPlay(el, true); el.dataset.id = it.id;
  // 전시 화면도 포스터 끝까지 천천히 내려간다(멈춤이면 그대로)
  const body = el.querySelector('.ks-body'); cancelAnimationFrame(kiosk.raf); if (!kiosk.paused && !REDUCE) { const t0 = performance.now() + 2500, dur = Math.max(3000, (state.svc.kiosk.sec - 4) * 1000); const step = now => { if (!body.isConnected || kiosk.paused) return; const u = Math.max(0, Math.min(1, (now - t0) / dur)), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; body.scrollTop = (body.scrollHeight - body.clientHeight) * e; if (u < 1) kiosk.raf = requestAnimationFrame(step); }; kiosk.raf = requestAnimationFrame(step); }
};
const kioskTick = () => { clearTimeout(kiosk.timer); if (kiosk.paused) return; kiosk.timer = setTimeout(() => { kiosk.i++; kioskShow(); kioskTick(); }, state.svc.kiosk.sec * 1000); };
const kioskStop = () => { const was = !!$('#kiosk'); clearTimeout(kiosk.timer); $('#kiosk')?.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); if (was && $('#kprev')) { kp.i = kiosk.i; kpShow(); kpTick(); } };

/* ---------- 연구자 입력 폼 (#/form/토큰) ---------- */
R.form = () => {
  const F = state.svc.form;
  if (!F || F.token !== state.formToken) { state.svc.form = { token: state.formToken, load: true }; apiJ(`/api/forms/${encodeURIComponent(state.formToken)}`).then(j => { state.svc.form = { token: state.formToken, ...j }; render(); }).catch(e => { state.svc.form = { token: state.formToken, err: e.message }; render(); }); return '<p class="mute">확인 중…</p>'; }
  if (F.load) return '<p class="mute">확인 중…</p>';
  if (F.err) return slide('링크를 <b>열 수 없습니다</b>', `<p class="sm mt">${esc(F.err)}</p><p class="mute sm mt">링크가 만료되었으면 담당 연구진에게 새 링크를 요청해 주세요.</p>`);
  if (F.done) return slide('보내 주셔서 <b>감사합니다</b>', '<p class="sm mt">입력하신 내용이 연구진에게 전달되었습니다. 기한 안에는 같은 링크로 다시 고쳐 보낼 수 있습니다.</p>');
  const t = (k, l, ph = '', rows = 4) => `<label style="grid-column:1/-1">${l}<textarea class="field" data-ff="${k}" rows="${rows}" placeholder="${ph}"></textarea></label>`, i = (k, l, ph = '', type = 'text') => `<label>${l}<input class="field" data-ff="${k}" type="${type}" placeholder="${ph}"></label>`;
  return `${slide('대표 연구자 <b>정보 입력</b>', `<p class="sm mt">한국연구재단 50년 대표 연구자 사례 발굴을 위해 연구 이력과 공개 동의를 여쭙습니다. 대상: <b>${esc(F.field || '')} 분야 연구자 (${esc(F.id)})</b> · ${esc(F.until)}까지 입력할 수 있습니다.${F.sent ? ' <span class="tag">이미 보낸 내용이 있습니다 — 다시 보내면 새 내용으로 바뀝니다</span>' : ''}</p>
    <div class="qfgrid">${i('name', '성명')}${i('org', '소속·직위')}${i('email', '연락 이메일', '', 'email')}${i('schedule', '인터뷰 가능 일정', '예: 11월 둘째 주 오후')}
      ${t('career', '연구 이력', '첫 재단 지원 과제, 이후 주요 과제와 역할 변화(학생 → 신진 → 중견 → 리더)')}${t('works', '대표 성과', '논문·특허·기술이전·창업·정책 기여 등 (링크 가능)')}${t('story', '연구 이야기', '연구를 시작한 계기, 성장의 전환점, 재단 지원이 만든 차이, 후속세대 양성')}${t('note', '기타 의견', '', 2)}</div>
    <div class="consent">${[['agreeInterview', '심층 인터뷰에 참여하겠습니다.'], ['agreeName', '사례집·플랫폼에 실명과 소속을 공개하는 데 동의합니다. (동의하지 않으면 분야로 익명 표기)'], ['agreePhoto', '제공한 사진을 사례집·홍보물에 쓰는 데 동의합니다.'], ['agreeData', '[필수] 위 개인정보(성명·소속·연락처·이력)를 사례 발굴·검증·연락 목적으로 수집·이용하고, 사업 종료 후 파기하는 데 동의합니다.']].map(([k, l]) => `<label class="chk"><input type="checkbox" data-ff="${k}"> ${l}</label>`).join('')}</div>
    <div class="chips mt"><button class="btn pri" data-act="ffsend">보내기</button></div>
    <p class="mute sm mt">수집 항목: 성명·소속·이메일·이력 · 목적: 대표 연구자 사례 발굴·검증·인터뷰 연락 · 보유: 사업 종료 시까지 · 동의를 거부할 수 있으나 필수 동의가 없으면 제출되지 않습니다. 사진은 담당 연구진에게 별도로 보내 주세요.</p>`)}`;
};

R.svc = () => `<div class="chips subtabs">${SVC_SUBS.map(([v, l]) => `<button class="chip ${state.ssub === v ? 'on' : ''}" data-act="nav" data-v="svc:${v}">${l}</button>`).join('')}</div>${SV[state.ssub]()}`;
Object.assign(ACT, {
  stpick: v => { state.story = v; syncHash(true); render(); scrollTo(0, 0); },
  stgo: v => { state.ssub = 'story'; state.story = v; state.view = 'svc'; syncHash(true); render(); scrollTo(0, 0); },
  stshare: async v => { const u = srvOk() ? `${location.origin}/s/${v}` : `${location.origin}${location.pathname}#/svc/story/${v}`; try { await navigator.clipboard.writeText(u); toast('공유 링크를 복사했습니다.'); } catch (e) { prompt('링크를 복사하세요.', u); } },
  stcard: async v => { const it = byId(v), rank = cardTop(it.kind).findIndex(x => x.id === it.id) + 1, s = cardSpecs(it, Math.max(1, rank), 5)[0]; download(`공유이미지_${v}.png`, new Blob([await cardImage(s, 0, false)], { type: 'image/png' })); },
  jregion: v => { state.svc.region = v; render(); }, jdomain: v => { state.svc.domain = v; render(); },
  vpick: (v, t) => { const S = state.svc, id = t.dataset.v; if (t.checked) { if (S.mine.length >= 3) { t.checked = false; return toast('3개까지 고를 수 있습니다.'); } S.mine.push(id); } else S.mine = S.mine.filter(x => x !== id); render(); },
  vsend: async () => { try { await apiJ('/api/vote', { method: 'POST', body: { ids: state.svc.mine } }); state.svc.votes = await apiJ('/api/votes'); render(); toast('투표했습니다. 감사합니다.'); } catch (e) { toast(e.message); } },
  chitem: v => { state.svc.cheerItem = v; },
  chsend: async () => { const id = state.svc.cheerItem || OUTCOMES[0].id, text = $('#chtext').value.trim(); if (text.length < 2) return toast('응원 한마디를 적어 주세요.'); try { await apiJ('/api/cheer', { method: 'POST', body: { id, text, nick: $('#chnick').value.trim() } }); $('#chtext').value = ''; toast('보냈습니다. 확인 후 게시됩니다.'); } catch (e) { toast(e.message || '보내지 못했습니다.'); } },
  chok: async v => { await apiJ(`/api/cheers/${v}`, { method: 'POST', body: { op: 'approve' } }).catch(e => toast(e.message)); state.svc.cheers = null; state.svc.votes = null; svcLoad(); },
  chdel: async v => { await apiJ(`/api/cheers/${v}`, { method: 'POST', body: { op: 'delete' } }).catch(e => toast(e.message)); state.svc.cheers = null; state.svc.votes = null; svcLoad(); },
  opendl: v => {
    const o = v === 'outcomes', rows = (o ? OUTCOMES : PEOPLE).map(x => o ? [x.id, x.title, dom(x.domain).label, O_GUIDE[x.guide], x.path[0].year, x.path[3].year - x.path[0].year, x.region, x.path.map((p, i) => `${p.year} ${PATH_STAGES[i]}`).join(' > '), STAGES[stageOf(x)], FEEL[x.guide]] : [x.id, x.field, dom(x.domain).label, P_GUIDE[x.guide], x.y0, x.years, x.grants, x.alumni, x.life.map(p => `${p.year} ${p.stage}`).join(' > '), STAGES[stageOf(x)]]);
    const q = c => `"${String(c ?? '').replace(/"/g, '""')}"`; download(`nrf50-${v}.csv`, new Blob(['﻿' + [OPEN_FIELDS[v].map(f => f[0]), ...rows].map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }));
  },
  ksset: (v, t) => { const K = state.svc.kiosk; K[t.dataset.k] = v; if (t.dataset.k === 'list' && v === 'pick' && !K.pick.length) K.pick = kioskPool().filter(it => stageOf(it) === 3).map(it => it.id); kp.i = 0; render(); },
  kssec: v => { state.svc.kiosk.sec = +v; render(); },
  kpone: (v, t) => { const K = state.svc.kiosk, id = t.dataset.v; K.pick = t.checked ? [...new Set([...K.pick, id])] : K.pick.filter(x => x !== id); kp.i = 0; render(); },
  kpall: () => { const K = state.svc.kiosk; K.pick = [...new Set([...K.pick, ...kioskPool().map(it => it.id)])]; kp.i = 0; render(); },
  kpnone: () => { const K = state.svc.kiosk, ids = new Set(kioskPool().map(it => it.id)); K.pick = K.pick.filter(id => !ids.has(id)); kp.i = 0; render(); },
  kpsel: () => { const K = state.svc.kiosk; K.pick = kioskPool().filter(it => stageOf(it) === 3).map(it => it.id); kp.i = 0; render(); },
  kpprev: () => { kp.i--; kpShow(); kpTick(); }, kpnext: () => { kp.i++; kpShow(); kpTick(); },
  kpgo: v => { kp.i = +v; kpShow(); kpTick(); },
  kppause: (v, t) => { kp.paused = !kp.paused; t.textContent = kp.paused ? '▶ 재생' : '❚❚ 멈춤'; if (kp.paused) clearTimeout(kp.timer); kpShow(); kpTick(); },
  kpfull: () => ACT.kstart(String(kp.i)),
  kstart: v => {
    if (!kioskList().length) return toast('전시할 항목이 없습니다.');
    clearTimeout(kp.timer); kioskStop(); kiosk.i = +v || 0; kiosk.paused = false;
    const el = document.createElement('div'); el.id = 'kiosk'; el.innerHTML = `<div class="ks-top"><b>대한민국 연구 50년</b><span class="ks-n"></span><button class="btn" data-act="kpause">멈춤</button><button class="btn" data-act="kprev">←</button><button class="btn" data-act="knext">→</button><button class="btn" data-act="kdetail">자세히</button><button class="btn" data-act="kstop">닫기</button></div><div class="ks-bar"><i></i></div><div class="ks-body"></div>`;
    document.body.appendChild(el); el.requestFullscreen?.().catch(() => {}); kioskShow(); kioskTick();
    el.querySelector('.ks-body').addEventListener('click', () => { kiosk.paused = true; clearTimeout(kiosk.timer); el.querySelector('[data-act="kpause"]').textContent = '계속'; el.querySelector('.ks-bar i').style.width = '0'; });
  },
  kpause: (v, t) => { kiosk.paused = !kiosk.paused; t.textContent = kiosk.paused ? '계속' : '멈춤'; if (!kiosk.paused) { kioskShow(); kioskTick(); } else clearTimeout(kiosk.timer); },
  kprev: () => { kiosk.i = Math.max(0, kiosk.i - 1); kioskShow(); kioskTick(); }, knext: () => { kiosk.i++; kioskShow(); kioskTick(); },
  kdetail: () => { const id = $('#kiosk')?.dataset.id; kiosk.paused = true; clearTimeout(kiosk.timer); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); if (id) openModal(id); },
  kstop: () => kioskStop(),
  ffsend: async () => {
    const f = {}; document.querySelectorAll('[data-ff]').forEach(el => { f[el.dataset.ff] = el.type === 'checkbox' ? el.checked : el.value; });
    if (!f.agreeData) return toast('필수 동의에 체크해 주세요.');
    try { await apiJ(`/api/forms/${encodeURIComponent(state.formToken)}`, { method: 'POST', body: f }); state.svc.form.done = true; render(); scrollTo(0, 0); } catch (e) { toast(e.message); }
  },
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#kiosk') && $('#modal').hidden) kioskStop(); });
