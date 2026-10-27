/* 연결 자료: 데이터 검색 결과를 대표 성과 50선·대표 연구자 50인의 개별 항목에 연결해 항목별로 관리한다 (관리자 모드).
   저장은 db.data.linked = { 항목 id: [자료] }. 공유 저장소를 켜면 연구진과 함께 쓴다. 받아온 글자는 모두 esc()로 거른다. */
const LK_ROLES = { o: ['핵심 성과', '후속 성과', '파급·활용', '근거 문헌', '관련 연구'], p: ['대표 업적', '공동연구', '지원 과제 성과', '후속세대', '관련 연구'] };
state.lk = { kind: 'o', id: '', role: '', q: '', open: null };
DS_SUBS.push(['linked', '연결 자료', '성과·인물별 관리']);

const lkList = id => db.data.linked[id] || [];
const lkItems = kind => kind === 'o' ? OUTCOMES : PEOPLE;
const lkLabel = it => it.kind === 'p' ? `${it.title} · ${it.field}` : it.title;
// 검색 결과 키 → 연결된 항목 id 목록 (결과 표에 '연결됨' 표시용)
const lkIndex = () => { const m = new Map(); for (const [id, L] of Object.entries(db.data.linked)) for (const x of L) (m.get(x.k) || m.set(x.k, []).get(x.k)).push(id); return m; };
const lkPack = (r, role, q) => ({ k: dsNorm(r), title: impClean(r.title).slice(0, 300), year: r.year || null, authors: (r.authors || []).slice(0, 5).map(impClean), venue: impClean(r.venue || '').slice(0, 200), cites: r.cites ?? null,
  doi: impClean(r.doi || '').slice(0, 200), url: httpUrl(r.url) ? String(r.url).slice(0, 500) : '', srcs: (r.srcs || [r.src]).filter(Boolean).slice(0, 6), nrf: !!r.nrf, award: impClean(r.award || '').slice(0, 200), type: impClean(r.type || '').slice(0, 40),
  topics: (r.topics || []).slice(0, 3).map(impClean), role, note: '', q: impClean(q || '').slice(0, 200), at: new Date().toISOString() });
const lkSummary = L => {
  const ys = L.map(x => x.year).filter(Boolean);
  return { n: L.length, from: ys.length ? Math.min(...ys) : null, to: ys.length ? Math.max(...ys) : null, cites: L.reduce((a, x) => a + (+x.cites || 0), 0), nrf: L.filter(x => x.nrf).length };
};

// 검색 결과 위에 붙는 연결 막대
const linkBar = () => {
  const s = state.lk, items = lkItems(s.kind), n = state.ds.sel.size, roles = LK_ROLES[s.kind];
  state.ds.lkIdx = lkIndex();
  return `<div class="toolbar lkbar"><span class="sm" style="font-weight:700">선택 ${n}건을</span>
    <select class="field" data-chg="lkkind" aria-label="연결 대상 종류" style="flex:0 1 130px">${[['o', '대표 성과'], ['p', '대표 연구자']].map(([v, l]) => `<option value="${v}" ${s.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <select class="field" data-chg="lkid" aria-label="연결할 항목" style="flex:1 1 240px"><option value="">항목 고르기…</option>${items.map(it => `<option value="${it.id}" ${s.id === it.id ? 'selected' : ''}>${it.id} ${esc(lkLabel(it))} (${lkList(it.id).length})</option>`).join('')}</select>
    <select class="field" data-chg="lkrole" aria-label="연결 구분" style="flex:0 1 140px">${roles.map(r => `<option ${(s.role || roles[0]) === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
    <button class="btn pri" data-act="lkadd" ${n && s.id ? '' : 'disabled'}>항목에 연결</button>${s.id ? `<button class="btn" data-act="open" data-v="${s.id}">항목 열기</button>` : ''}</div>`;
};
const lkTags = key => { const ids = (state.ds.lkIdx || new Map()).get(key); return ids ? `<br>${ids.map(id => `<button class="tag ok" data-act="open" data-v="${id}" title="연결된 항목 열기">${id}</button>`).join(' ')}` : ''; };

// 항목 상세에 붙는 연결 자료 관리 (관리자만)
const linkedSec = it => {
  if (!isAdmin()) return '';
  const L = lkList(it.id), S = lkSummary(L), roles = LK_ROLES[it.kind];
  return `<div class="sec"><h3>연결 자료 <span class="tag ${L.length ? 'ok' : ''}">${L.length}건</span></h3>
    ${L.length ? `<p class="sm mt">${S.from ? `${S.from}~${S.to}년 · ` : ''}피인용 합계 ${S.cites.toLocaleString()} · 재단 지원 표시 ${S.nrf}건 · ${roles.map(r => [r, L.filter(x => x.role === r).length]).filter(x => x[1]).map(([r, c]) => `${r} ${c}`).join(' · ')}</p>
      <div class="tw"><table class="dsres"><thead><tr><th scope="col">자료</th><th scope="col">연도</th><th scope="col">피인용</th><th scope="col">구분</th><th scope="col">메모</th><th scope="col"><span class="sr">관리</span></th></tr></thead><tbody>
      ${L.map((x, i) => `<tr><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>` : esc(x.title)}<br><span class="mute sm">${esc([x.authors.slice(0, 3).join(', '), x.venue].filter(Boolean).join(' · '))}${x.nrf ? ' · <span class="tag ok">재단 지원</span>' : ''}${x.award ? ` ${esc(x.award)}` : ''}</span></td>
        <td>${x.year || '—'}</td><td>${x.cites ?? '—'}</td>
        <td><select class="field" data-chg="lkset" data-id="${it.id}" data-i="${i}" data-f="role" aria-label="구분" style="min-width:110px">${roles.map(r => `<option ${x.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
        <td><input class="field" value="${esc(x.note)}" data-chg="lkset" data-id="${it.id}" data-i="${i}" data-f="note" placeholder="메모" aria-label="메모" style="min-width:120px"></td>
        <td><div class="chips" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-act="lkev" data-id="${it.id}" data-v="${i}" style="padding:5px 10px;font-size:11.5px">근거로</button><button class="btn" data-act="lkdel" data-id="${it.id}" data-v="${i}" style="padding:5px 10px;font-size:11.5px" aria-label="연결 해제">해제</button></div></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="mute sm mt">연결된 자료가 없습니다. 데이터 검색에서 결과를 골라 이 항목에 연결하세요.</p>'}
    <div class="chips mt"><button class="btn" data-act="lkfind" data-v="${it.id}">데이터 검색에서 찾기</button>${L.length ? `<button class="btn" data-act="lkcsv" data-v="${it.id}">CSV</button>` : ''}</div></div>`;
};

// 데이터 검색 → 연결 자료: 100개 항목의 연결 현황
DSV.linked = () => {
  const s = state.lk, q = s.q.trim().toLowerCase();
  const rows = lkItems(s.kind).filter(it => !q || `${it.id} ${lkLabel(it)}`.toLowerCase().includes(q)).map(it => ({ it, L: lkList(it.id), S: lkSummary(lkList(it.id)) }));
  const all = Object.values(db.data.linked).flat(), done = lkItems(s.kind).filter(it => lkList(it.id).length).length;
  return `
  <div class="row c4">${[[all.length.toLocaleString(), '건', '연결한 자료 (전체)'], [done, `/ ${lkItems(s.kind).length}`, `자료가 있는 ${s.kind === 'o' ? '성과' : '연구자'}`], [OUTCOMES.filter(it => lkList(it.id).length).length, '개', '대표 성과'], [PEOPLE.filter(it => lkList(it.id).length).length, '명', '대표 연구자']].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i % 4]} ${i % 2 ? 'b2' : ''}">${['①', '②', '③', '④'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  <section class="slide"><div class="toolbar" style="margin-bottom:6px"><h2 style="flex:1 1 200px">항목별 <b>연결 자료</b></h2>
    <div class="chips">${[['o', '대표 성과 50선'], ['p', '대표 연구자 50인']].map(([v, l]) => `<button class="chip ${s.kind === v ? 'on' : ''}" data-act="lkkind" data-v="${v}">${l}</button>`).join('')}</div>
    <input class="field" value="${esc(s.q)}" placeholder="항목 이름·번호" data-chg="lkq" style="flex:0 1 200px"><button class="btn" data-act="lkcsv" data-v="">전체 CSV</button></div>
    <div class="tw"><table class="dsres"><thead><tr><th scope="col">항목</th><th scope="col">연결</th><th scope="col">구분</th><th scope="col">연도 범위</th><th scope="col">피인용 합계</th><th scope="col">재단 지원</th><th scope="col"><span class="sr">관리</span></th></tr></thead><tbody>
    ${rows.map(({ it, L, S }) => `<tr><td><span class="mute sm">${it.id}</span> <b>${esc(lkLabel(it))}</b></td><td>${S.n || '<span class="mute">—</span>'}</td><td class="sm">${LK_ROLES[it.kind].map(r => [r, L.filter(x => x.role === r).length]).filter(x => x[1]).map(([r, c]) => `${r} ${c}`).join('<br>') || '—'}</td>
      <td>${S.from ? `${S.from}~${S.to}` : '—'}</td><td>${S.n ? S.cites.toLocaleString() : '—'}</td><td>${S.n ? S.nrf : '—'}</td>
      <td><div class="chips" style="gap:4px;flex-wrap:nowrap"><button class="btn" data-act="open" data-v="${it.id}" style="padding:5px 10px;font-size:11.5px">열기</button><button class="btn" data-act="lkfind" data-v="${it.id}" style="padding:5px 10px;font-size:11.5px">찾기</button></div></td></tr>`).join('')}
    </tbody></table></div>
    <p class="mute sm mt">통합 검색 결과에서 자료를 골라 "항목에 연결"을 누르면 여기와 각 항목의 상세 화면에 쌓입니다. 같은 자료를 다시 연결하면 중복으로 넣지 않습니다. "근거로"를 누르면 근거 패키지에도 등록됩니다.</p></section>`;
};

const lkCsv = ids => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, rows = [['항목 id', '항목', '구분', '제목', '연도', '저자', '학술지·기관', '피인용', 'DOI', '링크', '출처', '재단 지원', '과제번호', '메모', '검색어', '연결 일시']];
  for (const id of ids) { const it = byId(id); for (const x of lkList(id)) rows.push([id, it ? lkLabel(it) : '', x.role, x.title, x.year, x.authors.join('; '), x.venue, x.cites, x.doi, x.url, x.srcs.join('; '), x.nrf ? 'Y' : '', x.award, x.note, x.q, x.at]); }
  download(`연결자료_${ids.length === 1 ? ids[0] : '전체'}.csv`, new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }));
};
const lkReopen = id => { if (state.open === id) reopen(id); else render(); };

Object.assign(ACT, {
  lkkind: v => { state.lk.kind = v; state.lk.id = ''; state.lk.role = ''; render(); },
  lkid: v => { state.lk.id = v; render(); },
  lkrole: v => { state.lk.role = v; },
  lkq: v => { state.lk.q = v; render(); },
  lkadd: () => {
    const s = state.lk, ds = state.ds, role = s.role || LK_ROLES[s.kind][0], L = (db.data.linked[s.id] ||= []), have = new Set(L.map(x => x.k));
    const picked = ds.res.filter(r => ds.sel.has(dsNorm(r)) && !have.has(dsNorm(r)));
    L.push(...picked.map(r => lkPack(r, role, ds.q))); db.save('linked');
    const dup = ds.sel.size - picked.length; ds.sel = new Set(); render();
    toast(`${s.id}에 ${picked.length}건을 연결했습니다${dup ? ` (이미 연결된 ${dup}건 제외)` : ''}.`);
  },
  lkset: (v, t) => { const x = lkList(t.dataset.id)[+t.dataset.i]; if (!x) return; x[t.dataset.f] = impClean(v).slice(0, 300); db.save('linked'); },
  lkdel: (v, t) => { const id = t.dataset.id; lkList(id).splice(+v, 1); if (!lkList(id).length) delete db.data.linked[id]; db.save('linked'); lkReopen(id); },
  lkev: (v, t) => {
    const id = t.dataset.id, x = lkList(id)[+v], E = (db.data.evidence[id] ||= []);
    if (E.some(e => e.title === x.title)) return toast('이미 근거로 등록한 자료입니다.');
    E.push({ type: '논문·저서', title: x.title, url: x.url, note: impClean(`${x.role} · ${x.year || ''} · ${x.venue || ''}${x.cites != null ? ` · 피인용 ${x.cites}` : ''}`).slice(0, 300) });
    db.save('evidence'); lkReopen(id); toast('근거 패키지에 등록했습니다.');
  },
  lkfind: v => {
    const it = byId(v); if (!it) return;
    state.lk.kind = it.kind; state.lk.id = it.id; state.lk.role = '';
    state.ds.q = it.kind === 'o' ? it.title : (it.field || '');
    if (state.open) closeModal();
    state.view = 'dsearch'; state.dsub = 'search'; render(); scrollTo(0, 0);
    toast(`${it.id}에 연결할 자료를 검색하세요. 검색어를 고쳐서 써도 됩니다.`);
  },
  lkcsv: v => lkCsv(v ? [v] : Object.keys(db.data.linked).sort()),
});
