/* 운영: 사업 진척 대시보드, 검증 흐름·품질 점검·변경 이력, 계정·감사·서버 백업, 연구자 입력 링크 관리.
   서버 API(/api/*)는 npm start로 띄운 서버에서만 동작하고, 정적 호스팅에서는 안내 문구만 보인다. */
const apiJ = async (url, opt = {}) => {
  const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...opt, headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) }, body: opt.body && typeof opt.body !== 'string' ? JSON.stringify(opt.body) : opt.body });
  let j = null; try { j = await r.json(); } catch (e) { /* 본문 없음 */ }
  if (!r.ok) throw new Error(j?.error || `서버 오류 ${r.status}`);
  return j;
};
const srvOk = () => typeof srvStore === 'object' && srvStore.on;
const noSrv = what => `<p class="mute sm mt">${what}은(는) 플랫폼 서버(npm start, Railway)에서만 동작합니다. 지금 화면은 서버 저장소에 연결되어 있지 않습니다.</p>`;

ADMIN_SUBS.find(x => x[0] === 'review').push(['reviewer']);
ADMIN_SUBS.splice(0, 0, ['progress', '사업 진척', '목표 대비 현황', ['reviewer', 'foundation']]);
ADMIN_SUBS.push(['quality', '검증·품질', '흐름·점검·이력', ['foundation']], ['forms', '연구자 입력', '링크·동의 접수', ['foundation']], ['accounts', '계정·감사', '역할·로그·백업']);
state.asub = 'progress';
state.ops = { users: null, audit: null, forms: null, formLink: null };

/* ---------- 검증 흐름: 항목별 콘텐츠(원고·사례)의 작성 → 검토 요청 → 승인 ---------- */
const WF = ['작성 중', '검토 요청', '수정 요청', '승인'];
const WF_NEXT = { '작성 중': [['검토 요청', ['admin', 'researcher']]], '수정 요청': [['검토 요청', ['admin', 'researcher']]], '검토 요청': [['승인', ['admin', 'reviewer']], ['수정 요청', ['admin', 'reviewer']]], '승인': [['작성 중', ['admin']]] };
const wfOf = id => db.data.workflow[id] || { state: '작성 중', history: [] };
const who = () => state.role ? `${ROLE_NAME[state.role]}` : '로컬';
// 저장할 때마다 이 브라우저의 변경 기록에 남긴다(서버가 있으면 서버 감사 로그가 기준)
const wfTouch = key => { try { const L = LS.get('nrf50.changes', []); L.unshift({ at: new Date().toISOString(), key, who: who() }); LS.set('nrf50.changes', L.slice(0, 300)); } catch (e) { /* 저장 불가 */ } };
const wfSec = it => {
  if (!staff() || !(isAdmin() || state.role)) return '';
  const w = wfOf(it.id), next = (WF_NEXT[w.state] || []).filter(([, r]) => r.includes(state.role) || (!state.role && isAdmin()));
  return `<div class="sec"><h3>검증 흐름 <span class="tag ${w.state === '승인' ? 'ok' : w.state === '수정 요청' ? 'no' : ''}">${w.state}</span></h3>
    <div class="wfline">${WF.filter(s => s !== '수정 요청').map(s => `<span class="${s === w.state || (w.state === '수정 요청' && s === '작성 중') ? 'on' : ''}">${s}</span>`).join('<i>→</i>')}</div>
    ${next.length ? `<div class="toolbar mt"><input class="field" id="wfnote" placeholder="의견 (선택)" style="flex:1 1 220px">${next.map(([to]) => `<button class="btn ${to === '승인' ? 'pri' : ''}" data-act="wfgo" data-v="${it.id}" data-to="${to}">${to}</button>`).join('')}</div>` : `<p class="mute sm mt">${state.role === 'foundation' ? '재단 담당자는 열람만 합니다.' : '지금 역할로 바꿀 수 있는 단계가 없습니다.'}</p>`}
    ${w.history.length ? `<ol class="rank" style="margin-top:10px">${w.history.slice(-6).reverse().map(h => `<li style="cursor:default"><b></b><span>${esc(h.from)} → <b>${esc(h.to)}</b> <span class="mute">· ${esc(h.who)} · ${esc(h.at.slice(0, 16).replace('T', ' '))}${h.note ? ` · ${esc(h.note)}` : ''}</span></span><b></b></li>`).join('')}</ol>` : ''}</div>`;
};

/* ---------- 사업 진척 ---------- */
const kpi4 = items => `<div class="row c4">${items.map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : ''}">${['①', '②', '③', '④'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
ADM.progress = () => {
  if (typeof PL === 'object' && !PL.loaded) poolLoad();
  const pool = typeof PL === 'object' ? [...PL.rec.values()] : [], poolO = pool.filter(r => r.pool === 'o' && !r.sent).length, poolP = typeof PL === 'object' ? Object.values(PL.meta.persons).filter(x => x.cand && !x.sent).length : 0;
  const so = selected('o'), sp = selected('p'), cand = { o: OUTCOMES.length + poolO, p: PEOPLE.length + poolP };
  const deep = [...OUTCOMES, ...PEOPLE].filter(it => stageOf(it) >= 2), evOk = deep.filter(it => evOf(it) >= 2).length;
  const ints = db.data.interviews, cons = ints.filter(x => x.consent).length, forms = state.ops.forms ? Object.keys(state.ops.forms).length : null;
  const wfc = Object.fromEntries(WF.map(s => [s, [...OUTCOMES, ...PEOPLE].filter(it => wfOf(it.id).state === s).length]));
  const linked = [...OUTCOMES, ...PEOPLE].filter(it => (db.data.linked[it.id] || []).length).length, drafts = Object.keys(db.data.drafts).length;
  const bar2 = (l, a, b, c) => bar(l, pct(a, b), `${a} / ${b}`, c, '150px 1fr 90px');
  const era = k => ERAS.map((e, i) => [e, selected(k).filter(it => it.era === e.id).length, i]);
  const todo = [
    so.length < TARGET && `대표 성과 최종선정 ${TARGET - so.length}건 남음`, sp.length < TARGET && `대표 연구자 최종선정 ${TARGET - sp.length}인 남음`,
    deep.length - evOk > 0 && `심층검토 이상 ${deep.length - evOk}건 근거 2건 미달`, ...ERAS.filter(e => selected('o').filter(it => it.era === e.id).length < Math.ceil(e.min / 2)).map(e => `성과 ${e.no} ${e.label} 선정 부족 (최소 ${Math.ceil(e.min / 2)}건 권장)`),
    sp.length - cons > 0 && `선정 연구자 중 동의 미확보 가능 ${Math.max(0, sp.length - cons)}인`, wfc['검토 요청'] && `검토 요청 대기 ${wfc['검토 요청']}건`,
  ].filter(Boolean);
  if (srvOk() && state.ops.forms === null && (isAdmin() || hasRole('foundation'))) { state.ops.forms = {}; apiJ('/api/forms').then(f => { state.ops.forms = f; if (state.asub === 'progress') render(); }).catch(() => {}); }
  return `
  ${kpi4([[so.length, `/ ${TARGET}`, '대표 성과 최종선정'], [sp.length, `/ ${TARGET}`, '대표 연구자 최종선정'], [`${pct(evOk, deep.length)}`, '%', `근거 2건 충족 (심층검토 이상 ${deep.length}건)`], [cons, '인', `인터뷰 동의${forms !== null ? ` · 입력 폼 ${forms}건` : ''}`]])}
  <div class="row c2">
    ${slide('후보 <b>확보</b>', `${bar2('성과 후보 (목표 300)', cand.o, 300, 'g-blue')}${bar2('인물 후보 (목표 300)', cand.p, 300, 'g-pink')}${bar2('연결 자료가 있는 항목', linked, OUTCOMES.length + PEOPLE.length, 'g-teal')}${bar2('원고 초안', drafts, TARGET * 2, 'g-orange')}<p class="mute sm mt">후보 수 = 현재 후보 목록 + 모집단 구축에서 표시했지만 아직 보내지 않은 후보</p>`)}
    ${slide('콘텐츠 <b>검증 흐름</b>', `${WF.map((s, i) => bar(s, pct(wfc[s], OUTCOMES.length + PEOPLE.length), wfc[s], GC[i % 4], '110px 1fr 50px')).join('')}<p class="mute sm mt">항목 상세의 "검증 흐름"에서 작성 → 검토 요청 → 승인으로 넘깁니다.</p>`)}
  </div>
  <div class="row c2">
    ${['o', 'p'].map(k => slide(`${k === 'o' ? '성과' : '연구자'} 선정 · <b>영역·시대 균형</b>`, `${DOMAINS.map(d => bar(d.short, pct(selected(k).filter(it => it.domain === d.id).length, Math.max(1, selected(k).length)), selected(k).filter(it => it.domain === d.id).length, d.color, '90px 1fr 40px')).join('')}
      <h3 class="mt" style="font-size:12.5px">시대 구간</h3>${era(k).map(([e, n, i]) => bar(`${e.no} ${e.label}`, pct(n, Math.max(1, ...era(k).map(x => x[1]))), n, GC[i % 4], '90px 1fr 40px')).join('')}`)).join('')}
  </div>
  ${slide('다음 <b>할 일</b>', todo.length ? ul(todo.map(esc)) : '<p class="mute sm mt">목표 대비 남은 일이 없습니다.</p>', '목표(성과 50선·연구자 50인, 근거 2건 이상, 시대·영역 균형, 동의 확보) 대비 부족한 부분을 자동으로 뽑습니다.')}`;
};

/* ---------- 검증·품질: 데이터 점검과 변경 이력 ---------- */
const qualityChecks = () => {
  const all = [...OUTCOMES, ...PEOPLE], out = [], add = (it, kind, msg) => out.push({ it, kind, msg });
  for (const it of all) {
    const st = stageOf(it);
    if (st >= 2 && evOf(it) < 2) add(it, '근거', `근거 ${evOf(it)}건 (2건 이상 필요)`);
    if (it.kind === 'o') {
      const ys = it.path.map(p => p.year); if (ys.some((y, i) => i && y < ys[i - 1])) add(it, '연도', `영향경로 연도 역전 (${ys.join('→')})`);
      if (ys.some(y => y > 2026 || y < 1977)) add(it, '연도', `범위 밖 연도 (${ys.join('·')})`);
    } else {
      const iv = db.data.interviews.find(x => x.id === it.id), f = state.ops.forms?.[it.id];
      if (st === 3 && !(iv?.consent || f?.agreeInterview)) add(it, '동의', '최종선정 연구자 인터뷰·공개 동의 미확인');
    }
    const L = db.data.linked[it.id] || [], y0 = it.kind === 'o' ? it.path[0].year : it.y0;
    const early = L.filter(x => x.year && x.year < y0 - 5); if (early.length) add(it, '연결 자료', `첫 지원(${y0})보다 5년 넘게 앞선 자료 ${early.length}건`);
    const d = db.data.drafts[it.id]; if (d?.draft && typeof draftCheck === 'function') { const c = draftCheck(it, d.draft); if (c.uncited + c.nums.length) add(it, '원고', `근거 없는 문단 ${c.uncited}개 · 근거에 없는 수치 ${c.nums.length}개`); }
  }
  const seen = new Map(); for (const it of all) { const k = (it.kind === 'o' ? it.title : '').replace(/\s/g, ''); if (!k) continue; if (seen.has(k)) add(it, '중복', `제목 중복 (${seen.get(k)})`); else seen.set(k, it.id); }
  return out;
};
ADM.quality = () => {
  const Q = qualityChecks(), kinds = [...new Set(Q.map(q => q.kind))], wq = [...OUTCOMES, ...PEOPLE].filter(it => wfOf(it.id).state === '검토 요청');
  const ch = LS.get('nrf50.changes', []), A = state.ops.audit;
  if (srvOk() && A === null && (isAdmin() || hasRole('foundation'))) { state.ops.audit = []; apiJ('/api/audit').then(a => { state.ops.audit = a; if (state.asub === 'quality') render(); }).catch(() => {}); }
  return `
  ${kpi4([[Q.length, '건', '점검 항목'], [kinds.length, '종', '점검 유형'], [wq.length, '건', '검토 요청 대기'], [[...OUTCOMES, ...PEOPLE].filter(it => wfOf(it.id).state === '승인').length, '건', '승인 완료']])}
  ${slide('검토 <b>대기</b>', wq.length ? tbl(['항목', '요청', ''], wq.map(it => { const h = wfOf(it.id).history.at(-1); return [`${it.id} ${esc(it.kind === 'o' ? it.title : `${it.title} · ${it.field}`)}`, h ? `${esc(h.who)} · ${h.at.slice(0, 10)}${h.note ? ` · ${esc(h.note)}` : ''}` : '—', `<button class="btn" data-act="open" data-v="${it.id}">열어서 검토</button>`]; })) : '<p class="mute sm mt">검토를 기다리는 항목이 없습니다.</p>')}
  ${slide('데이터 <b>품질 점검</b>', Q.length ? `<div class="chips mt">${kinds.map(k => `<span class="tag">${k} ${Q.filter(q => q.kind === k).length}</span>`).join('')}</div>${tbl(['항목', '유형', '내용', ''], Q.slice(0, 120).map(q => [`${q.it.id} ${esc(q.it.kind === 'o' ? q.it.title : q.it.field)}`, q.kind, esc(q.msg), `<button class="btn" data-act="open" data-v="${q.it.id}">열기</button>`]))}${Q.length > 120 ? `<p class="mute sm mt">앞 120건만 표시 · 전체 ${Q.length}건</p>` : ''}` : '<p class="mute sm mt">발견된 문제가 없습니다.</p>',
    '근거 미달, 연도 역전·범위 밖, 선정 연구자 동의 미확인, 연결 자료 연도 이상, 원고의 근거 없는 문단·수치, 제목 중복을 점검합니다.')}
  ${slide('변경 <b>이력</b>', A && A.length ? tbl(['일시', '사용자', '역할', '작업', '대상'], A.slice(0, 80).map(a => [esc(a.at.slice(0, 16).replace('T', ' ')), esc(a.user), esc(ROLE_NAME[a.role] || a.role || '—'), esc(a.action), esc(a.key || a.target || a.n || '')]))
    : ch.length ? `${tbl(['일시', '저장한 항목', '역할'], ch.slice(0, 60).map(c => [esc(c.at.slice(0, 16).replace('T', ' ')), esc(c.key), esc(c.who)]))}<p class="mute sm mt">서버 감사 로그가 없어 이 브라우저의 저장 기록을 보여 줍니다.</p>` : '<p class="mute sm mt">기록이 없습니다.</p>',
    '서버에 연결되어 있으면 로그인·저장·계정·추적 등 모든 쓰기 작업이 감사 로그(누가·언제·무엇을)로 남습니다.')}`;
};

/* ---------- 계정·감사·서버 백업 (관리자) ---------- */
ADM.accounts = () => {
  if (!hasRole('admin')) return slide('계정 <b>관리</b>', '<p class="mute sm mt">관리자 계정만 사용할 수 있습니다.</p>');
  const U = state.ops.users;
  if (srvOk() && U === null) { state.ops.users = []; apiJ('/api/users').then(u => { state.ops.users = u; if (state.asub === 'accounts') render(); }).catch(e => toast(e.message)); }
  return `
  ${slide('역할별 <b>계정</b>', srvOk() ? `${U?.length ? tbl(['아이디', '이름', '역할', '만든 날', ''], U.map(u => [esc(u.id), esc(u.name || '—'), esc(ROLE_NAME[u.role] || u.role), esc((u.at || '').slice(0, 10)), `<button class="btn" data-act="userdel" data-v="${esc(u.id)}">삭제</button>`])) : '<p class="mute sm mt">만든 계정이 없습니다.</p>'}
      <div class="qfgrid"><label>아이디<input class="field" id="uid" placeholder="영문·숫자 3자 이상" autocomplete="off"></label><label>이름<input class="field" id="uname" autocomplete="off"></label>
        <label>역할<select class="field" id="urole">${['researcher', 'reviewer', 'foundation', 'admin'].map(r => `<option value="${r}">${ROLE_NAME[r]}</option>`).join('')}</select></label><label>임시 암호<input class="field" id="upw" type="password" placeholder="8자 이상" autocomplete="new-password"></label></div>
      <div class="chips"><button class="btn pri" data-act="useradd">계정 만들기·암호 바꾸기</button></div>` : noSrv('계정 관리'),
    '연구진: 관리 도구 전체 · 선정위원: 사업 진척·선정위 심의·검증 흐름 승인 · 재단 담당자: 진척·품질·입력 현황 열람. 암호는 서버에 scrypt 해시로만 저장되고, 공유한 관리자 암호 대신 사람마다 계정을 쓰면 감사 로그에 누가 했는지 남습니다.')}
  ${slide('서버 <b>백업</b>', srvOk() ? `<div class="chips mt"><a class="btn" href="/api/backup" download>서버 저장소 전체 백업 (JSON)</a></div><p class="mute sm mt">공유 상태·모집단·자동 추적·입력 폼·투표·응원·감사 로그를 한 파일로 받습니다. Railway에서는 서버 저장소 폴더(DATA_DIR)에 볼륨을 붙여야 다시 배포해도 자료가 남습니다. 정기 백업은 이 파일을 주기적으로 받아 보관하세요.</p>` : noSrv('서버 백업'))}`;
};
Object.assign(ACT, {
  wfgo: async (v, t) => {
    const w = { ...wfOf(v) }, to = t.dataset.to, note = impClean($('#wfnote')?.value || '').slice(0, 200);
    w.history = [...(w.history || []), { at: new Date().toISOString(), who: who(), from: w.state, to, note }].slice(-30); w.state = to;
    db.data.workflow[v] = w; db.save('workflow'); reopen(v); toast(`${to}(으)로 바꿨습니다.`);
  },
  useradd: async () => {
    try { await apiJ('/api/users', { method: 'POST', body: { id: $('#uid').value.trim(), name: $('#uname').value.trim(), role: $('#urole').value, password: $('#upw').value } }); state.ops.users = null; render(); toast('계정을 저장했습니다. 아이디와 임시 암호를 따로 전달하세요.'); }
    catch (e) { toast(e.message); }
  },
  userdel: async v => { if (!confirm(`${v} 계정을 삭제할까요?`)) return; try { await apiJ('/api/users', { method: 'DELETE', body: { id: v } }); state.ops.users = null; render(); } catch (e) { toast(e.message); } },
});

/* ---------- 연구자 입력 링크 ---------- */
ADM.forms = () => {
  const F = state.ops.forms;
  if (srvOk() && F === null) { state.ops.forms = {}; apiJ('/api/forms').then(f => { state.ops.forms = f; if (state.asub === 'forms') render(); }).catch(e => toast(e.message)); }
  const people = [...PEOPLE].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a)), L = state.ops.formLink;
  return `
  ${slide('입력 <b>링크 만들기</b>', srvOk() ? `<div class="toolbar mt"><select class="field" id="fpick" style="flex:1 1 260px">${people.map(p => `<option value="${p.id}">${p.id} · ${esc(p.field)}${stageOf(p) === 3 ? ' (최종선정)' : ''}${F?.[p.id] ? ' · 접수됨' : ''}</option>`).join('')}</select>
      <select class="field" id="fdays" style="flex:0 1 120px">${[14, 30, 60, 90].map(d => `<option value="${d}" ${d === 30 ? 'selected' : ''}>${d}일 유효</option>`).join('')}</select>${isAdmin() ? '<button class="btn pri" data-act="formlink">링크 만들기</button>' : ''}</div>
      ${L ? `<div class="story sm mt"><b>${L.id}</b> 전용 링크 (${L.days}일 유효)<br><input class="field" value="${esc(L.url)}" readonly style="width:100%;margin-top:6px" onfocus="this.select()"><div class="chips mt"><button class="btn" data-act="formcopy">복사</button></div></div>` : ''}
      <p class="mute sm mt">연구자에게 링크를 전달하면 로그인 없이 이력·대표 성과·인터뷰 가능 일정·공개 동의를 직접 입력합니다. 링크는 서버 서명으로 위조할 수 없고 기한이 지나면 열리지 않습니다. 서버의 AUTH_SECRET을 바꾸면 기존 링크는 모두 무효가 됩니다.</p>` : noSrv('연구자 입력 링크'),
    '인물관 검증과 공개 동의를 연구자 본인에게서 직접 받습니다.')}
  ${slide('접수 <b>현황</b>', F && Object.keys(F).length ? tbl(['연구자', '입력자·소속', '동의', '인터뷰 가능', '접수', ''], Object.entries(F).sort((a, b) => b[1].at.localeCompare(a[1].at)).map(([id, f]) => [`${id} ${esc(byId(id)?.field || '')}`, esc([f.name, f.org].filter(Boolean).join(' · ') || '—'),
      ['agreeInterview', 'agreeName', 'agreePhoto'].map((k, i) => `<span class="tag ${f[k] ? 'ok' : 'no'}">${['인터뷰', '실명', '사진'][i]}</span>`).join(' '), esc(f.schedule || '—'), esc(f.at.slice(0, 10)),
      `<div class="chips" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-act="formview" data-v="${id}">보기</button>${isAdmin() ? `<button class="btn" data-act="formapply" data-v="${id}">인터뷰 관리에 반영</button>` : ''}</div>`])) + (state.ops.formView ? formDetail(state.ops.formView) : '') : '<p class="mute sm mt">접수된 입력이 없습니다.</p>')}`;
};
const formDetail = id => { const f = state.ops.forms[id]; return `<div class="story sm mt"><b>${id} 입력 내용</b>${info([['이름·소속', esc([f.name, f.org].filter(Boolean).join(' · ') || '—')], ['연락', esc(f.email || '—')], ['이력', esc(f.career || '—').replace(/\n/g, '<br>')], ['대표 성과', esc(f.works || '—').replace(/\n/g, '<br>')], ['연구 이야기', esc(f.story || '—').replace(/\n/g, '<br>')], ['인터뷰 가능 일정', esc(f.schedule || '—')], ['기타', esc(f.note || '—')]])}</div>`; };
Object.assign(ACT, {
  formlink: async () => {
    const id = $('#fpick').value, days = +$('#fdays').value;
    try { const j = await apiJ('/api/forms/token', { method: 'POST', body: { id, days } }); state.ops.formLink = { id, days: j.days, url: `${location.origin}${location.pathname}#/form/${j.token}` }; render(); } catch (e) { toast(e.message); }
  },
  formcopy: async () => { try { await navigator.clipboard.writeText(state.ops.formLink.url); toast('링크를 복사했습니다.'); } catch (e) { toast('복사하지 못했습니다. 칸을 눌러 직접 복사하세요.'); } },
  formview: v => { state.ops.formView = state.ops.formView === v ? null : v; render(); },
  formapply: v => {
    const f = state.ops.forms[v]; let iv = db.data.interviews.find(x => x.id === v);
    if (!iv) { iv = { id: v, date: '', mode: '대면', status: INT_STATUS[0], consent: false, agree: false, memo: '', tags: [] }; db.data.interviews.push(iv); }
    iv.consent = !!f.agreeInterview; iv.agree = !!(f.agreeName || f.agreePhoto); if (f.schedule) iv.memo = impClean(`${iv.memo ? iv.memo + ' / ' : ''}가능 일정: ${f.schedule}`).slice(0, 500);
    db.save('interviews'); toast('인터뷰 관리에 동의·일정을 반영했습니다.');
  },
});
