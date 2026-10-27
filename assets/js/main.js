/* 화면 조립, 주소(딥링크), 공개용·연구용 전환, 이벤트 연결. 가장 마지막에 불러온다 */
const SUBMAP = { outreach: [SUBS, 'sub'], admin: [ADMIN_SUBS, 'asub'] };
const visibleViews = () => VIEWS.filter(v => (staff() || !v.staff) && (isAdmin() || !v.admin));

/* ---------- 주소 ↔ 상태 ----------
   #/화면[/하위화면][/후보ID]  예) #/outcomes/O-018  #/outreach/cards/R-013  #/admin/review */
const route = () => {
  const v = state.view, sm = SUBMAP[v]; let h = `#/${v}`;
  if (sm) h += `/${state[sm[1]]}`;
  if (v === 'outreach' && state.sub === 'cards') { if (state.card) h += `/${state.card}`; } else if (state.open) h += `/${state.open}`;
  return h;
};
const syncHash = push => { const h = route(); if (location.hash !== h) history[push ? 'pushState' : 'replaceState'](null, '', h); };
const applyHash = () => {
  const p = decodeURIComponent(location.hash).replace(/^#\/?/, '').split('/').filter(Boolean), v = VIEWS.find(x => x.id === p[0]);
  if (!v) return false;
  if ((v.staff && !staff()) || (v.admin && !isAdmin())) { state.view = 'goal'; state.open = null; return true; }
  state.view = v.id; const sm = SUBMAP[v.id], rest = p.slice(1);
  if (sm && rest[0] && sm[0].some(s => s[0] === rest[0])) state[sm[1]] = rest.shift();
  const id = rest[0]; state.open = null;
  if (id && /^[OR]-\d+$/.test(id) && byId(id)) { if (v.id === 'outreach' && state.sub === 'cards') state.card = id; else state.open = id; }
  return true;
};

/* ---------- 렌더 ---------- */
const sideTools = () => `
  <div class="qbox"><input class="field" id="q" type="search" placeholder="통합 검색  ( / )" aria-label="통합 검색" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="qres"><div id="qres" role="listbox" hidden></div></div>
  <div class="chips" style="gap:6px">
    <button class="chip ${staff() ? '' : 'on'}" data-act="mode" data-v="public" aria-pressed="${!staff()}">공개용</button><button class="chip ${staff() ? 'on' : ''}" data-act="mode" data-v="staff" aria-pressed="${staff()}">연구용</button>
    <button class="chip" data-act="lang" aria-label="언어 전환">${state.lang === 'ko' ? 'EN' : '한국어'}</button>
  </div>
  <div class="mute" style="font-size:11px" id="storestat">${storeLabel()}</div>`;
const render = () => {
  const views = visibleViews(); if (!views.some(v => v.id === state.view)) state.view = 'goal';
  const i = views.findIndex(v => v.id === state.view), v = views[i], sm = SUBMAP[v.id];
  if (v.kind) state.kind = v.kind;
  document.body.classList.toggle('mode-public', !staff());
  document.title = `${v.t.join(' ')} · 대한민국 연구 50년`;
  $('.brand-t').innerHTML = '대한민국 연구 <b>50년</b>'; $('.brand-s').textContent = '장기 파급효과 추적 플랫폼';
  $('.brand-v').textContent = `v${CONFIG.VERSION}`;
  $('.side-note').innerHTML = `<b>안내</b>${staff() ? '체계·기준·일정은 연구계획서의 제안값(안)입니다. 후보·점수·투입액 등 수치는 시연용 예시이며 실제 선정 결과가 아닙니다.' : '이 화면의 성과·연구자와 수치는 플랫폼 시연용 예시이며 실제 선정 결과가 아닙니다.'}`;
  $('#sidetools').innerHTML = sideTools();
  $('#nav').innerHTML = views.map((q, j) => { const s = SUBMAP[q.id];
    return `<button class="nav-item ${q.id === v.id ? 'on' : ''}" data-act="nav" data-v="${q.id}" ${q.id === v.id ? 'aria-current="page"' : ''}><span class="nav-ic ${G[j % 4]}" aria-hidden="true">0${j + 1}</span>${q.t.join(' ')}</button>${s ? `<div class="nav-subs">${s[0].map(([sv, sl]) => `<button class="nav-sub ${v.id === q.id && state[s[1]] === sv ? 'on' : ''}" data-act="nav" data-v="${q.id}:${sv}" ${v.id === q.id && state[s[1]] === sv ? 'aria-current="page"' : ''}>${sl}</button>`).join('')}</div>` : ''}`; }).join('');
  const cur = sm && sm[0].find(x => x[0] === state[sm[1]]), first = sm && sm[0][0][0];
  const lead = cur && cur[0] !== first ? `<b style="color:var(--ink)">${cur[1]}</b> · ${cur[2]}${v.id === 'outreach' ? (state.sub === 'cards' ? ' 확산 콘텐츠' : ' 시각화 자료 예제') : ''}` : v.sub;
  $('#main').innerHTML = `<header class="page-head"><div><div class="dots" aria-hidden="true"><i></i><i></i><i></i></div><h1>${v.t[0]} <b>${v.t[1]}</b></h1><p>${lead}</p></div><div class="head-r"><button class="adminbtn ${isAdmin() ? 'on' : ''}" data-act="adminbtn" aria-label="${isAdmin() ? '관리자 모드 로그아웃' : '관리자 모드 로그인'}" title="${isAdmin() ? '관리자 모드 · 누르면 로그아웃' : '관리자 모드 로그인'}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="${isAdmin() ? 'M8 11V7a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'}"/><circle cx="12" cy="16" r="1.3" fill="currentColor"/></svg>${isAdmin() ? '<span>관리자</span>' : ''}</button><div class="badge-no" aria-hidden="true"><span>0${i + 1}</span></div></div></header>${R[v.id]()}
    <footer class="site-foot"><div class="dots sm" aria-hidden="true"><i></i><i></i><i></i></div>한국연구재단 <span>|</span> 한국외국어대학교(연구책임자: 박정원 교수)</footer>`;
  renderGrid(); renderRank(); mountMap(); mountGraph(); mountCards(); graphKeys();
  if (state.open) showModal(state.open); else $('#modal').hidden = true;
  applyLang($('.side')); applyLang($('#main'));
};

/* ---------- 상세 창: 초점을 가두고, 닫으면 원래 자리로 돌려준다 ---------- */
let lastFocus = null;
const showModal = id => {
  const it = byId(id), m = $('#modal'); if (!it) return;
  const keep = m.hidden ? 0 : $('.panel', m)?.scrollTop || 0;
  if (m.hidden) lastFocus = document.activeElement;
  m.innerHTML = detail(it); m.hidden = false; $('.panel', m).scrollTop = keep;
  if (!keep) $('.x', m)?.focus();
  applyLang(m);
};
const openModal = id => { state.open = id; syncHash(true); showModal(id); };
const closeModal = () => { const m = $('#modal'); if (m.hidden) return; m.hidden = true; state.open = null; syncHash(false); if (lastFocus?.isConnected) lastFocus.focus(); };
// 열린 상세 창을 스크롤 위치 그대로 다시 그린다
const reopen = id => { render(); if (state.open !== id) { state.open = id; } showModal(id); };

// 그래프를 키보드로: 좌우 화살표로 연결 많은 순서대로 노드를 옮겨 다니고 Enter로 상세를 연다
const graphKeys = () => {
  const cv = $('#graph'); if (!cv || cv.dataset.keys) return;
  cv.dataset.keys = 1; cv.tabIndex = 0; cv.setAttribute('role', 'application');
  cv.addEventListener('keydown', e => {
    const order = [...gx.V].sort((a, b) => b.deg - a.deg), i = order.findIndex(n => n.id === gx.sel);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); ACT.gsel(order[(i + 1) % order.length].id); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); ACT.gsel(order[(i - 1 + order.length) % order.length].id); }
    else if (e.key === 'Enter' && gx.sel) openModal(gx.sel);
    const n = gx.N.find(x => x.id === gx.sel); if (n) $('#live').textContent = `${gLabel(n.it)}, 연결 ${n.deg}개`;
  });
};

/* ---------- 동작 ---------- */
Object.assign(ACT, {
  nav: v => {
    const [a, b] = v.split(':'), view = VIEWS.find(x => x.id === a);
    if (view?.admin && !isAdmin()) return toast('관리자 모드에서만 볼 수 있습니다. 오른쪽 위 자물쇠로 로그인하세요.');
    if (view?.staff && !staff()) return toast('연구용 화면입니다. 왼쪽에서 연구용으로 바꾸면 볼 수 있습니다.');
    state.view = a; const sm = SUBMAP[a]; if (sm) state[sm[1]] = b || sm[0][0][0];
    state.open = null; syncHash(true); render(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true });
  },
  // 검색 결과 등에서 쓰는 이동: 화면[/하위][/ID][@구역]
  go: v => {
    const [path, anchor] = v.split('@'); history.pushState(null, '', `#/${path}`);
    if (!applyHash()) return; render(); if (!state.open) window.scrollTo(0, 0);
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 60);
  },
  sub: v => ACT.nav(`outreach:${v}`),
  mode: v => {
    if (v === state.mode) return;
    if (v === 'staff' && CONFIG.STAFF_PASSCODE && prompt('연구용 화면 암호를 입력하세요.') !== CONFIG.STAFF_PASSCODE) return toast('암호가 맞지 않습니다.');
    state.mode = v; LS.set('nrf50.mode', v); state.open = null; syncHash(false); render(); toast(v === 'staff' ? '연구용 화면입니다. 발굴 기준·점수·관리 도구가 보입니다.' : '공개용 화면입니다. 최종선정된 성과·연구자만 보입니다.');
  },
  adminbtn: () => {
    if (isAdmin()) { state.admin = false; try { sessionStorage.removeItem('nrf50.admin'); } catch (e) { /* 저장 불가 환경 */ } if (state.view === 'admin') state.view = 'goal'; syncHash(false); render(); return toast('관리자 모드에서 나왔습니다.'); }
    const d = $('#login'); d.hidden = false; $('#loginmsg').textContent = ''; const i = $('#loginpw'); i.value = ''; i.focus();
  },
  adminclose: () => { $('#login').hidden = true; $('.adminbtn')?.focus(); },
  adminlogin: async () => {
    const pw = $('#loginpw').value, msg = $('#loginmsg');
    if (!crypto.subtle) return void (msg.textContent = '이 주소에서는 로그인을 확인할 수 없습니다 (https 또는 localhost 필요).');
    const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nrf50:' + pw)))].map(b => b.toString(16).padStart(2, '0')).join('');
    if (h !== CONFIG.ADMIN_HASH) { msg.textContent = '암호가 맞지 않습니다.'; $('#loginpw').select(); return; }
    state.admin = true; try { sessionStorage.setItem('nrf50.admin', '1'); } catch (e) { /* 저장 불가 환경 */ }
    state.mode = 'staff'; LS.set('nrf50.mode', 'staff'); $('#login').hidden = true; render(); toast('관리자 모드입니다. 연구 관리와 데이터 검색 메뉴가 열렸습니다.');
  },
  lang: () => { state.lang = state.lang === 'ko' ? 'en' : 'ko'; LS.set('nrf50.lang', state.lang); render(); },
  share: async v => { const url = `${location.origin}${location.pathname}#/${byId(v).kind === 'o' ? 'outcomes' : 'people'}/${v}`; try { await navigator.clipboard.writeText(url); toast('이 화면의 주소를 복사했습니다.'); } catch (e) { prompt('주소를 복사하세요.', url); } },
  evadd: (_, t) => {
    const f = t.closest('.evform'), g = k => $(`[data-f="${k}"]`, f).value.trim(), id = t.dataset.id, title = g('title'), url = g('url');
    if (!title) return toast('근거 제목을 입력하세요.');
    if (url && !/^https?:\/\//i.test(url)) return toast('링크는 http:// 또는 https:// 로 시작해야 합니다.');
    (db.data.evidence[id] ||= []).push({ type: g('type'), title: title.slice(0, 200), url: url.slice(0, 500), note: g('note').slice(0, 300) }); db.save('evidence'); reopen(id);
  },
  evdel: (v, t) => { const id = t.dataset.id; db.data.evidence[id].splice(+v, 1); db.save('evidence'); reopen(id); },
  region: v => { state.region = v; render(); },
  card: v => { state.card = v; syncHash(false); render(); },
  cardzip: async (v, t) => {
    if (gc.busy) return; gc.busy = true;
    const label = t.textContent, items = v === 'one' ? [cardItem()] : v === 'all' ? [...cardTop('o'), ...cardTop('p')] : cardTop(v);
    try {
      const blob = await buildCardZip(items, (d, n) => { t.textContent = `만드는 중 ${d}/${n}`; }, v !== 'one');
      download({ one: `카드뉴스_${items[0].id}.zip`, o: '카드뉴스_대표성과50선.zip', p: '카드뉴스_대표연구자50인.zip', all: '카드뉴스_대표성과50선_대표연구자50인.zip' }[v], blob);
      t.textContent = '내려받기 완료';
    } catch (e) { t.textContent = '만들기 실패'; console.error(e); }
    gc.busy = false; setTimeout(() => { if (t.isConnected) t.textContent = label; }, 2500);
  },
  cardmp4: async (v, t) => {
    if (gc.busy) return; gc.busy = true;
    const label = t.textContent, items = v === 'one' ? [cardItem()] : cardTop(v).slice(0, 10), files = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i], rank = cardTop(it.kind).findIndex(x => x.id === it.id) + 1;
        const blob = await cardVideo(cardSpecs(it, rank), (d, n) => { t.textContent = `영상 만드는 중 ${items.length > 1 ? `${i + 1}/${items.length} · ` : ''}${d}/${n}장`; });
        files.push({ name: `${it.kind === 'o' ? '대표성과' : '대표연구자'}_${String(rank).padStart(2, '0')}_${it.id}.mp4`, data: new Uint8Array(await blob.arrayBuffer()), blob });
      }
      if (files.length === 1) download(`카드뉴스_${items[0].id}.mp4`, files[0].blob); else download(`카드뉴스_영상_${v === 'o' ? '대표성과' : '대표연구자'}_상위10.zip`, zipStore(files));
      t.textContent = '내려받기 완료';
    } catch (e) { t.textContent = e.message === 'unsupported' ? '이 브라우저는 MP4 만들기를 지원하지 않습니다' : '만들기 실패'; console.error(e); }
    gc.busy = false; setTimeout(() => { if (t.isConnected) t.textContent = label; }, 3500);
  },
  cardstep: v => { const all = [...cardTop('o'), ...cardTop('p')], i = all.findIndex(x => x.id === cardItem().id); state.card = all[(i + +v + all.length) % all.length].id; syncHash(false); render(); },
  gshow: v => { gx.show[v] = !gx.show[v]; render(); },
  gtype: v => { gx.types[v] = !gx.types[v]; render(); },
  gdom: v => { gx.domain = v; render(); },
  gscope: v => { gx.scope = v; render(); },
  gcolor: v => { gx.color = v; render(); },
  gsizem: v => { gx.size = v; render(); },
  gsel: v => { gx.sel = v || null; gx.path = null; gx.pathMode = false; const n = gx.V.find(x => x.id === v); if (n) { const k = Math.max(gx.tf.k, 1.25); gx.auto = false; gx.cam = { k, x: -n.x * k, y: -n.y * k }; } gHl(); gPanel(); applyLang($('#gpanel')); },
  gdepth: v => { gx.depth = +v; gHl(); gPanel(); },
  gpathmode: () => { gx.pathMode = !gx.pathMode; gPanel(); },
  gclear: () => { gx.path = null; gHl(); gPanel(); },
  gfit: () => { gx.auto = false; gx.cam = gFitTarget(); },
  grelayout: () => { gx.pos = {}; gx.tf = { x: 0, y: 0, k: 1 }; gx.year = 2026; gx.playing = false; render(); },
  gplay: () => { if (!gx.playing && gx.vy >= 2026) { gx.V = []; gx.vy = null; gSetYear(1977, true); } gx.playing = !gx.playing; gx.auto = true; gBtn(); },
  gfull: () => { const w = $('.graph-wrap'); document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen?.(); },
  gpng: () => gx.cv.toBlob(b => download('research-network.png', b)),
  focus: v => { const m = (gm.marks || []).find(x => x.oid === v); if (m) { gm.map.panTo(m.getPosition()); google.maps.event.trigger(m, 'click'); } else openModal(v); },
  jump: v => document.getElementById(v)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }),
  era: v => { state.era = v; render(); },
  kind: v => { state.kind = v; state.cmp = []; state.imp = null; render(); },
  scope: v => { state.scope = v; render(); },
  rankby: v => { state.rankBy = v; render(); },
  domain: v => { state.f[state.kind].domain = v; render(); },
  open: openModal, close: closeModal,
  stage: (v, t) => { db.data.status[t.dataset.id] = +v; db.save('status'); gc.top = null; reopen(t.dataset.id); },
  resetw: () => { state.w[state.kind] = [25, 25, 25, 25]; render(); },
  print: () => window.print(),
  export: () => {
    const pack = k => selected(k).map(it => ({ id: it.id, title: it.title, field: it.field, domain: dom(it.domain).label, type: (k === 'o' ? O_GUIDE : P_GUIDE)[it.guide], score: score(it), grade: GRADES[it.grade].label, roiIndex: +roi(it).toFixed(1), track: TRACKS[it.track], evidence: evOf(it) }));
    download('nrf50-selection.json', new Blob([JSON.stringify({ outcomes: pack('o'), researchers: pack('p') }, null, 2)], { type: 'application/json' }));
  },
});

/* ---------- 이벤트 ---------- */
document.addEventListener('click', e => {
  if (e.target.id === 'modal') return closeModal();
  if (e.target.id === 'login') return ACT.adminclose();
  if (!e.target.closest('.qbox')) searchClose();
  const t = e.target.closest('[data-act]');
  if (t && !t.disabled) ACT[t.dataset.act]?.(t.dataset.v, t);
});
document.addEventListener('keydown', e => {
  const m = $('#modal');
  if (e.key === 'Escape') { if (!$('#login').hidden) return ACT.adminclose(); if (!$('#qres').hidden) return searchClose(); return closeModal(); }
  if (e.key === 'Enter' && document.activeElement?.id === 'loginpw') return ACT.adminlogin();
  if (e.key === 'Tab' && !m.hidden) {   // 상세 창 안에서만 초점이 돌게 한다
    const f = [...m.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')].filter(x => x.offsetParent !== null); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); }
  if (document.activeElement?.id === 'q') searchKey(e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') searchRun(t.value);
  else if (t.dataset.w !== undefined) { state.w[state.kind][+t.dataset.w] = +t.value; $('#w' + t.dataset.w).textContent = t.value; renderRank(); }
  else if (t.dataset.q !== undefined) { state.f[state.kind].q = t.value; renderGrid(); }
  else if (t.dataset.gq !== undefined) gx.q = t.value;
  else if (t.dataset.gyear !== undefined) { gx.playing = false; gSetYear(+t.value, true); gBtn(); }
  else if (t.dataset.gf !== undefined) { gx.force[t.dataset.gf] = +t.value; $('#gf-' + t.dataset.gf).textContent = t.value; gx.alpha = Math.max(gx.alpha, .6); }
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.sel, p = t.dataset.pick;
  if (k) { state.f[state.kind][k] = t.value; renderGrid(); }
  if (p) { state.pick[p] = t.value; render(); }
  if (t.dataset.chg) ACT[t.dataset.chg]?.(t.value, t);
});
const onRoute = () => { if (location.hash !== route() && applyHash()) render(); };
window.addEventListener('popstate', onRoute);
window.addEventListener('hashchange', onRoute);

// 부분 갱신(목록·순위·그래프 패널)으로 새로 들어온 글자도 영문 전환을 따라가게 한다
new MutationObserver(ms => { if (state.lang !== 'en') return; for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) applyLang(n); }).observe(document.body, { childList: true, subtree: true });

/* ---------- 시작 ---------- */
applyImported();
applyHash();
render(); syncHash(false);
if (remote.on) { const tick = async () => { if (await remote.pull()) { applyImported(); render(); } else { const el = $('#storestat'); if (el) el.textContent = storeLabel(); } }; tick(); setInterval(tick, 45000); }
