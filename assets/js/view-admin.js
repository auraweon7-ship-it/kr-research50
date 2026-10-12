/* 08 연구 관리: 데이터 관리 · 선정위 심의 · 균형 점검 · 민감도 분석 · 인터뷰 관리 (연구용 화면) */
const ADMIN_SUBS = [['data', '데이터 관리', '가져오기·저장'], ['review', '선정위 심의', '비교·평점·회의록'], ['balance', '균형 점검', '배분·시대 구간'], ['sens', '민감도 분석', '순위 안정성'], ['interview', '인터뷰 관리', '일정·동의·코딩']];
const ADM = {};
const kindTabs = act => `<div class="chips" style="margin-bottom:22px">${['o', 'p'].map(q => `<button class="chip ${q === state.kind ? 'on' : ''}" data-act="${act}" data-v="${q}">${KIND[q]} 트랙</button>`).join('')}</div>`;
const nameOf = it => it.kind === 'o' ? it.title : `${it.title} · ${it.field}`;

/* ---------- 데이터 관리 ---------- */
ADM.data = () => {
  const im = db.data.imported, p = state.imp, cols = p ? IMP_COLS[p.kind] : [];
  const cnt = (o, n) => `${n}<small> ${o}</small>`;
  return `
  <div class="row c4">${[[cnt('건', OUTCOMES.filter(o => !o.imported).length), '예시 성과 후보'], [cnt('명', PEOPLE.filter(o => !o.imported).length), '예시 연구자 후보'], [cnt('건', im.o.length), '가져온 성과'], [cnt('명', im.p.length), '가져온 연구자']].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['예시', '예시', '실제', '실제'][i]}</div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('실데이터 <b>가져오기</b>', `
    <div class="row c3 mt" style="margin-bottom:0;gap:14px">
      <div class="story"><b>1. 양식 받기</b><br><span class="mute">첫 줄이 열 이름인 CSV입니다. 엑셀로 열어 채웁니다.</span><div class="chips mt" style="gap:8px"><button class="btn" data-act="imptpl" data-v="o">성과 양식</button><button class="btn" data-act="imptpl" data-v="p">연구자 양식</button></div></div>
      <div class="story"><b>2. 종류 고르고 파일 올리기</b><br><span class="mute">CSV(UTF-8·CP949), TSV, 엑셀(xlsx) 지원</span><div class="chips mt" style="gap:8px">${['o', 'p'].map(q => `<button class="chip ${state.kind === q ? 'on' : ''}" data-act="kind" data-v="${q}">${KIND[q]}</button>`).join('')}</div>
        <input class="field mt" type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" data-chg="impfile" aria-label="가져올 파일" style="width:100%"></div>
      <div class="story"><b>또는 붙여넣기</b><br><span class="mute">엑셀에서 머리글 포함해 복사한 범위</span><textarea class="field mt" id="imppaste" rows="3" placeholder="여기에 붙여넣기" aria-label="붙여넣을 표" style="width:100%;resize:vertical"></textarea><div class="chips mt"><button class="btn" data-act="imppaste">붙여넣은 내용 읽기</button></div></div>
    </div>
    <p class="mute sm mt">필수 열: 성과는 성과명·지원영역·첫지원연도, 연구자는 분야·지원영역·첫지원연도. 비워 둔 항목은 기본값으로 채우고 "가져온 데이터" 로 표시합니다. 연구자 실명은 공개동의가 Y이거나 연구용 화면일 때만 보입니다.</p>`,
    '재단 과제 DB, NTIS, KRM에서 정리한 후보를 올리면 성과관·인물관·네트워크·분석 화면에 바로 반영됩니다. 예시 데이터는 그대로 남고 옆에 추가됩니다.')}
  ${p ? slide(`미리보기 · ${KIND[p.kind]} <b>${p.rows.length}건</b>`, `
    <p class="sm">인식한 열 ${p.matched}개${p.unknown.length ? ` · <span class="warn">알 수 없는 열 ${p.unknown.length}개: ${p.unknown.map(esc).join(', ')}</span>` : ''}${p.errors.length ? ` · <span class="warn">제외된 행 ${p.errors.length}개</span>` : ''}</p>
    ${p.errors.length ? `<ul class="bul">${p.errors.slice(0, 8).map(e => `<li>${esc(e)}</li>`).join('')}${p.errors.length > 8 ? `<li>… 외 ${p.errors.length - 8}건</li>` : ''}</ul>` : ''}
    ${p.rows.length ? tbl(p.kind === 'o' ? ['성과명', '지원영역', '발굴유형', '기여유형', '기여강도', '첫 지원', '실질 투입', '트랙'] : ['연구자', '분야', '지원영역', '발굴유형', '첫 지원', '단계 수', '공개 동의'],
      p.rows.slice(0, 8).map(n => p.kind === 'o' ? [esc(n.title), dom(n.domain).short, O_GUIDE[n.guide], n.ctype, GRADES[n.grade].label, n.y0, n.invest ? `${n.invest}억` : '<span class="mute">기본값</span>', TRACKS[n.track]]
        : [esc(n.name || '(익명)'), esc(n.field), dom(n.domain).short, P_GUIDE[n.guide], n.y0, [n.y0, n.y1, n.y2, n.y3, n.y4].filter(Boolean).length, n.consent ? '동의' : '<span class="mute">미동의 · 익명 표시</span>'])) + (p.rows.length > 8 ? `<p class="mute sm mt">앞 8행만 표시 · 전체 ${p.rows.length}행</p>` : '') : ''}
    <div class="chips mt">${p.rows.length ? `<button class="btn pri" data-act="impgo">${p.rows.length}건 가져오기</button>` : ''}<button class="btn" data-act="impcancel">취소</button></div>`) : ''}
  <div class="row c2">
    ${slide('가져온 <b>데이터</b>', `${['o', 'p'].map(k => `<div class="kv" style="grid-template-columns:1fr auto auto"><span>${KIND[k]} ${im[k].length}${k === 'o' ? '건' : '명'}</span><span class="mute sm">${im[k].slice(0, 2).map(n => esc(n.title || n.name || n.field)).join(', ')}${im[k].length > 2 ? ' 외' : ''}</span><button class="btn" data-act="impclear" data-v="${k}" ${im[k].length ? '' : 'disabled'}>모두 삭제</button></div>`).join('')}
      <p class="mute sm mt">가져온 후보의 ID는 O-501, R-501부터 붙습니다. 삭제하면 그 후보의 검증 단계·근거·심의 기록은 저장소에 남지만 화면에서는 사라집니다.</p>`)}
    ${slide('저장소와 <b>백업</b>', `<p class="sm"><b id="storestat">${storeLabel()}</b></p>
      <p class="mute sm mt">${remote.on ? '검증 단계·근거·심의·인터뷰·가져온 데이터가 공유 서버에 저장되어 연구진이 같은 내용을 봅니다. 나중에 저장한 쪽이 반영됩니다.' : '지금은 이 브라우저에만 저장됩니다. assets/config.js에 Supabase 주소와 키를 넣으면 연구진 공유 저장소로 바뀝니다 (표 정의: supabase/schema.sql).'}</p>
      <div class="chips mt"><button class="btn" data-act="backup">전체 백업 내려받기 (JSON)</button><label class="btn" style="cursor:pointer">백업 복원<input type="file" accept=".json" data-chg="restore" hidden></label>${remote.on ? '<button class="btn" data-act="syncnow">지금 동기화</button>' : ''}</div>`)}
  </div>`;
};

/* ---------- 선정위원회 심의 ---------- */
const MEMBERS = [['m1', '위원 A', '이공계'], ['m2', '위원 B', '이공계'], ['m3', '위원 C', '인문사회'], ['m4', '위원 D', '산업·기술사업화'], ['m5', '위원 E', '정책·과학커뮤니케이션']];
// 이해충돌로 배제한 위원을 뺀 평균 평점과 참여 위원 수
const reviewAvg = id => { const r = db.data.review[id] || {}, v = MEMBERS.map(([m]) => r[m]).filter(x => x && !x.coi && x.r); return { n: v.length, avg: v.length ? v.reduce((a, x) => a + x.r, 0) / v.length : 0, coi: MEMBERS.filter(([m]) => r[m]?.coi).length }; };
const minutes = k => {
  const rated = LIST[k].filter(it => db.data.review[it.id] && reviewAvg(it.id).n).sort((a, b) => reviewAvg(b.id).avg - reviewAvg(a.id).avg), d = new Date();
  const line = (it, i) => { const a = reviewAvg(it.id), r = db.data.review[it.id], coi = MEMBERS.filter(([m]) => r[m]?.coi).map(m => m[1]);
    return `${i + 1}. ${nameOf(it)} (${it.id})\n   - 평균 평점 ${a.avg.toFixed(2)} / 5 (참여 ${a.n}인${coi.length ? `, 이해충돌 배제: ${coi.join(', ')}` : ''})\n   - 성과 점수 ${score(it)}, 투자 대비 성과 지수 ${roi(it).toFixed(1)}, ${GRADES[it.grade].label}, 근거문헌 ${evOf(it)}건\n   - 결정: ${STAGES[stageOf(it)]}${MEMBERS.map(([m, nm]) => r[m]?.c ? `\n   - ${nm} 의견: ${r[m].c}` : '').join('')}`; };
  return `한국연구재단 50년 대표${k === 'o' ? '성과 50선' : ' 연구자 50인'} 선정위원회 회의록(초안)\n\n일시: ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일\n참석: ${MEMBERS.map(m => `${m[1]}(${m[2]})`).join(', ')}\n안건: 후보 ${rated.length}건 심의\n현재 최종선정: ${selected(k).length} / ${TARGET}\n\n[심의 결과]\n${rated.map(line).join('\n\n') || '평점이 입력된 후보가 없습니다.'}\n\n[운영 원칙 확인]\n- 이해충돌 위원은 해당 후보 심의에서 배제함\n- 영역별 최소 배분과 시대 구간 균형을 함께 검토함\n- 심의 근거와 회의록 공개 범위는 사전 확정한 기준에 따름\n\n※ 자동 생성 초안입니다. 위원 확인 후 확정합니다.\n`;
};
ADM.review = () => {
  const k = state.kind, pool = [...LIST[k]].sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a));
  const cmp = state.cmp.map(byId).filter(x => x && x.kind === k), up = pool.filter(it => stageOf(it) === 2);
  const row = (label, fn) => `<tr><td><b>${label}</b></td>${cmp.map(it => `<td>${fn(it)}</td>`).join('')}</tr>`;
  const mrow = ([m, nm, fd]) => `<tr><td><b>${nm}</b><br><span class="mute sm">${fd}</span></td>${cmp.map(it => { const r = db.data.review[it.id]?.[m] || {};
    return `<td><div class="rvcell"><select class="field" data-chg="rvrate" data-id="${it.id}" data-m="${m}" aria-label="${nm} 평점" ${r.coi ? 'disabled' : ''}><option value="">평점</option>${[5, 4, 3, 2, 1].map(v => `<option value="${v}" ${r.r === v ? 'selected' : ''}>${v}점</option>`).join('')}</select>
      <label class="sm"><input type="checkbox" data-chg="rvcoi" data-id="${it.id}" data-m="${m}" ${r.coi ? 'checked' : ''}> 이해충돌</label></div><input class="field" data-chg="rvnote" data-id="${it.id}" data-m="${m}" value="${esc(r.c || '')}" placeholder="의견" aria-label="${nm} 의견" style="width:100%;margin-top:6px" ${r.coi ? 'disabled' : ''}></td>`; }).join('')}</tr>`;
  return `
  ${kindTabs('kind')}
  <div class="row c4">${[[up.length, '선정위 상정 후보'], [selected(k).length, `최종선정 / 목표 ${TARGET}`], [LIST[k].filter(it => reviewAvg(it.id).n).length, '평점 입력 후보'], [LIST[k].filter(it => reviewAvg(it.id).coi).length, '이해충돌 배제 발생']].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['상정', '선정', '평점', '배제'][i]}</div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('비교할 <b>후보 고르기</b>', `<div class="toolbar" style="margin:12px 0 0"><select class="field" id="cmppick" aria-label="비교 후보">${pool.filter(it => !state.cmp.includes(it.id)).map(it => `<option value="${it.id}">${STAGES[stageOf(it)]} · ${it.id} · ${nameOf(it)}</option>`).join('')}</select>
      <button class="btn pri" data-act="cmpadd" ${cmp.length >= 3 ? 'disabled' : ''}>비교에 추가</button><button class="btn" data-act="cmpauto">상정 후보 상위 3 불러오기</button></div>
    <div class="chips mt">${cmp.map(it => `<button class="chip on" data-act="cmpdel" data-v="${it.id}">${nameOf(it)} ✕</button>`).join('') || '<span class="mute sm">최대 3건까지 나란히 비교합니다.</span>'}</div>`,
    '후보별 근거 패키지(지원 이력, 성과 근거, 기여 강도 판정안, 인터뷰 요지)를 놓고 위원 5인이 심의합니다.')}
  ${cmp.length ? slide('후보 <b>나란히 비교</b>', `<div class="tw"><table class="cmp"><thead><tr><th scope="col">항목</th>${cmp.map(it => `<th scope="col"><button class="chip" data-act="open" data-v="${it.id}">${it.id} 상세</button><br><b style="font-size:13.5px;color:var(--ink)">${nameOf(it)}</b></th>`).join('')}</tr></thead><tbody>
      ${row('검증 단계', it => pill(it))}${row('지원 영역 · 유형', it => `${dom(it.domain).short} · ${(k === 'o' ? O_GUIDE : P_GUIDE)[it.guide]}`)}
      ${row('성과 점수', it => `<b>${score(it)}</b>`)}${row('투자 대비 성과 지수', it => `<b>${roi(it).toFixed(1)}</b>`)}${row('기여 강도', it => GRADES[it.grade].label)}
      ${row('출발 시기', it => `${ERAS.find(e => e.id === it.era).label} · ${it.y0}`)}${row('발굴 트랙', it => TRACKS[it.track])}${row('근거문헌', it => evTag(it))}
      ${row('국민 체감', it => FEEL[it.guide])}
      ${MEMBERS.map(mrow).join('')}
      ${row('평균 평점', it => { const a = reviewAvg(it.id); return a.n ? `<b style="font-size:18px">${a.avg.toFixed(2)}</b> <span class="mute sm">/ 5 · ${a.n}인${a.coi ? ` · 배제 ${a.coi}인` : ''}</span>` : '<span class="mute">미입력</span>'; })}
      ${row('의결', it => `<div class="chips" style="gap:6px">${[[3, '최종선정'], [1, '보류'], [0, '제외']].map(([v, l]) => `<button class="btn ${stageOf(it) === v ? 'on' : ''}" data-act="setstage" data-v="${v}" data-id="${it.id}">${l}</button>`).join('')}</div>`)}
    </tbody></table></div>`) : ''}
  ${slide('회의록 <b>초안</b>', `<textarea class="field" id="minutes" rows="12" aria-label="회의록 초안" style="width:100%;margin-top:12px;font-family:inherit;line-height:1.6;resize:vertical">${esc(minutes(k))}</textarea>
    <div class="chips mt"><button class="btn pri" data-act="mincopy">복사</button><button class="btn" data-act="minsave">텍스트 파일로 저장</button></div>`, '평점이 입력된 후보를 평균 평점 순으로 정리합니다. 평점이나 의견을 바꾸면 다시 만들어집니다.')}`;
};

/* ---------- 균형 점검 ---------- */
// 표 2-9의 여섯 영역으로 성과를 나눈다
const quotaOf = o => o.domain === 'hs' ? 2 : o.domain === 'hr' ? 3 : o.domain === 'ic' ? 5 : o.guide === 'G4' ? 1 : o.guide === 'G3' ? 4 : 0;
ADM.balance = () => {
  const so = selected('o'), sp = selected('p');
  const q = C.quota.map(([l, t], i) => { const sel = so.filter(o => quotaOf(o) === i), pool = OUTCOMES.filter(o => quotaOf(o) === i && stageOf(o) !== 3).sort((a, b) => score(b) - score(a)); return { l, t, n: sel.length, lack: Math.max(0, t - sel.length), pool }; });
  const lackSum = q.reduce((a, x) => a + x.lack, 0), eraLack = ERAS.filter(e => count('o', o => o.era === e.id) < e.min || count('p', o => o.era === e.id) < e.min).length;
  const meter = (n, t, col) => `<div class="meter"><span class="${col}" style="width:${Math.min(100, n / Math.max(t, n, 1) * 100)}%"></span><i style="left:${Math.min(100, t / Math.max(t, n, 1) * 100)}%"></i></div>`;
  return `
  <div class="row c4">${[[`${so.length}<small> / ${TARGET}</small>`, '성과 최종선정'], [`${sp.length}<small> / ${TARGET}</small>`, '연구자 최종선정'], [`${q.filter(x => !x.lack).length}<small> / 6</small>`, '배분 기준 충족 영역'], [`${eraLack}<small> / 5</small>`, '후보 기준 미달 시대 구간']].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['성과', '인물', '영역', '시대'][i]}</div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('표 2-9 영역별 배분과 <b>현재 선정</b>', `<div class="tw"><table><thead><tr><th scope="col">영역</th><th scope="col">배분(하한)</th><th scope="col">현재 선정</th><th scope="col" style="width:38%">달성</th><th scope="col">상태</th></tr></thead><tbody>
      ${q.map((x, i) => `<tr><td><b>${x.l}</b></td><td>${x.t}</td><td><b>${x.n}</b></td><td>${meter(x.n, x.t, G[i % 4])}</td><td>${x.lack ? `<span class="warn">${x.lack}건 부족</span>` : '<span class="tag ok">충족</span>'}</td></tr>`).join('')}
      <tr><td><b>합계</b></td><td>${C.quota.reduce((a, x) => a + x[1], 0)}</td><td><b>${so.length}</b></td><td></td><td>${lackSum ? `<span class="warn">총 ${lackSum}건 부족</span>` : '<span class="tag ok">전 영역 충족</span>'}</td></tr></tbody></table></div>
    <p class="mute sm mt">세로선이 배분 하한입니다. 이공계 성과는 발굴 유형이 국가전략기술이면 전략 R&D, 국민생활·사회문제 해결이면 사회문제 영역으로 나눴습니다.</p>`, '배분은 하한 기준이며 선정위원회 심의로 조정합니다.')}
  ${slide('부족 영역 <b>보충 후보</b>', q.some(x => x.lack) ? q.filter(x => x.lack).map(x => `<h3 class="mt" style="font-size:13px">${x.l} <span class="warn">${x.lack}건 부족</span></h3><ol class="rank">${x.pool.slice(0, Math.min(4, x.lack + 1)).map((o, i) => `<li style="cursor:default"><b>${i + 1}</b><span><button class="chip" data-act="open" data-v="${o.id}" style="font-size:11.5px;padding:4px 10px">${o.title}</button> <span class="mute">· ${STAGES[stageOf(o)]} · 성과 ${score(o)} · 근거 ${evOf(o)}건</span></span><button class="btn" data-act="setstage" data-v="3" data-id="${o.id}">최종선정</button></li>`).join('') || '<li style="cursor:default"><b></b><span class="mute">남은 후보가 없습니다. 후보군을 더 확보해야 합니다.</span><b></b></li>'}</ol>`).join('') : '<p class="mute sm mt">모든 영역이 배분 하한을 채웠습니다.</p>', '부족한 영역에서 아직 선정되지 않은 후보를 성과 점수 순으로 보여줍니다.')}
  <div class="row c2">
    ${slide('시대 구간별 <b>후보·선정</b>', tbl(['시대 구간', '최소 후보', '성과 후보 / 선정', '연구자 후보 / 선정'], ERAS.map(e => { const a = count('o', o => o.era === e.id), b = count('p', o => o.era === e.id); return [`${e.no} ${e.label}`, e.min, `<span class="${a >= e.min ? '' : 'warn'}">${a}</span> / ${so.filter(o => o.era === e.id).length}`, `<span class="${b >= e.min ? '' : 'warn'}">${b}</span> / ${sp.filter(o => o.era === e.id).length}`]; })) + '<p class="mute sm mt">주황색은 후보 수가 최소 기준에 못 미치는 구간입니다.</p>')}
    ${slide('연구자 <b>유형·영역 분포</b>', `${Object.entries(P_GUIDE).map(([g, l], i) => bar(l, sp.filter(p => p.guide === g).length / Math.max(1, sp.length) * 100, sp.filter(p => p.guide === g).length, G[i % 4], '150px 1fr 26px')).join('')}<h3 class="mt2" style="font-size:13px">지원 영역</h3>${DOMAINS.map(d => bar(d.short, sp.filter(p => p.domain === d.id).length / Math.max(1, sp.length) * 100, sp.filter(p => p.domain === d.id).length, d.color, '150px 1fr 26px')).join('')}`)}
  </div>`;
};

/* ---------- 민감도 분석 ---------- */
// 가중치와 기여 계수를 ±amp% 범위에서 무작위로 흔들어 순위가 얼마나 달라지는지 본다
const sensRun = (k, amp, by, top, runs = 400) => {
  const list = LIST[k], r = rng(amp * 131 + top * 7 + (by === 'roi' ? 3 : 1) + list.length), a = amp / 100;
  const calc = (w, coef) => it => { const s = w.reduce((x, y) => x + y, 0) || 1, sc = it.scores.reduce((x, v, i) => x + v * w[i], 0) / s; return by === 'roi' ? sc * coef[it.grade] / (1 + Math.log10(it.invest)) : sc; };
  const rankOf = fn => { const order = [...list].sort((x, y) => fn(y) - fn(x)), m = {}; order.forEach((it, i) => { m[it.id] = i + 1; }); return m; };
  const base = rankOf(calc(state.w[k], GRADES.map(g => g.coef))), st = Object.fromEntries(list.map(it => [it.id, { min: 999, max: 0, sum: 0, in: 0 }]));
  let keep = 0;
  for (let n = 0; n < runs; n++) {
    const rk = rankOf(calc(state.w[k].map(v => v * (1 + (r() * 2 - 1) * a)), GRADES.map(g => g.coef * (1 + (r() * 2 - 1) * a / 2))));
    for (const it of list) { const v = rk[it.id], s = st[it.id]; s.min = Math.min(s.min, v); s.max = Math.max(s.max, v); s.sum += v; if (v <= top) { s.in++; if (base[it.id] <= top) keep++; } }
  }
  const rows = list.map(it => ({ it, base: base[it.id], min: st[it.id].min, max: st[it.id].max, mean: st[it.id].sum / runs, p: st[it.id].in / runs })).sort((x, y) => x.base - y.base);
  return { rows, keep: keep / (runs * Math.min(top, list.length)), shift: rows.reduce((x, y) => x + Math.abs(y.mean - y.base), 0) / rows.length, runs };
};
ADM.sens = () => {
  const k = state.kind, s = state.sens, top = Math.min(s.top, LIST[k].length - 1), R0 = sensRun(k, s.amp, s.by, top);
  const edge = R0.rows.filter(x => x.p > .1 && x.p < .9).sort((a, b) => Math.abs(.5 - a.p) - Math.abs(.5 - b.p)), show = R0.rows.slice(0, Math.min(30, R0.rows.length)), N = LIST[k].length;
  const W = 760, rowH = 17, H = show.length * rowH + 34, L = 190, x = v => L + (W - L - 16) * (v - 1) / (N - 1);
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="기준 순위 상위 후보의 순위 변동 범위">
    <line x1="${x(top + .5)}" x2="${x(top + .5)}" y1="6" y2="${H - 22}" stroke="#EC5C8D" stroke-dasharray="4 4"/><text x="${x(top + .5) + 4}" y="14" style="fill:#EC5C8D;font-weight:700">상위 ${top} 경계</text>
    ${[1, 10, 20, 30, 40, 50, N].filter((v, i, a) => v <= N && a.indexOf(v) === i).map(v => `<text x="${x(v)}" y="${H - 6}" text-anchor="middle">${v}위</text>`).join('')}
    ${show.map((d, i) => { const y = 24 + i * rowH, nm = nameOf(d.it); return `<text x="${L - 8}" y="${y + 3}" text-anchor="end">${d.base}. ${nm.length > 15 ? nm.slice(0, 14) + '…' : nm}</text><line x1="${x(d.min)}" x2="${x(d.max)}" y1="${y}" y2="${y}" stroke="${dom(d.it.domain).color}" stroke-width="6" stroke-linecap="round" opacity=".45"/><circle cx="${x(d.base)}" cy="${y}" r="4.5" fill="${dom(d.it.domain).color}" stroke="#fff" stroke-width="1.5"/>`; }).join('')}</svg>`;
  const chips = (key, opts) => opts.map(([v, l]) => `<button class="chip ${s[key] === v ? 'on' : ''}" data-act="sens" data-k="${key}" data-v="${v}">${l}</button>`).join('');
  return `
  ${kindTabs('kind')}
  <div class="chips" style="margin-bottom:10px"><span class="mute sm" style="align-self:center">변동 폭</span>${chips('amp', [[10, '±10%'], [20, '±20%'], [30, '±30%'], [50, '±50%']])}
    <span style="width:10px"></span><span class="mute sm" style="align-self:center">순위 기준</span>${chips('by', [['score', '성과 점수'], ['roi', '투자 대비 성과 지수']])}</div>
  <div class="chips" style="margin-bottom:22px"><span class="mute sm" style="align-self:center">선정 규모</span>${chips('top', [[10, '상위 10'], [20, '상위 20'], [30, '상위 30'], [50, '상위 50']])}</div>
  <div class="row c4">${[[`${Math.round(R0.keep * 100)}<small>%</small>`, `상위 ${top} 유지율`], [`${R0.shift.toFixed(1)}<small> 계단</small>`, '평균 순위 이동'], [`${R0.rows.filter(x => x.p >= .9).length}<small> ${k === 'o' ? '건' : '명'}</small>`, '안정 선정 (90% 이상)'], [`${edge.length}<small> ${k === 'o' ? '건' : '명'}</small>`, '경계 후보 (10~90%)']].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['유지', '이동', '안정', '경계'][i]}</div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('순위 <b>변동 범위</b>', `<div class="tw">${chart.replace('class="chart"', 'class="chart" style="min-width:620px"')}</div><p class="mute sm mt">점은 현재 가중치의 순위, 띠는 ${R0.runs}회 모의에서 나온 최고~최저 순위입니다. 띠가 경계선을 넘나드는 후보는 가중치에 따라 당락이 바뀝니다.</p>`, `세부기준 가중치를 ±${s.amp}%, 기여 계수를 ±${s.amp / 2}% 범위에서 무작위로 바꿔 ${R0.runs}회 다시 계산했습니다.`)}
  ${slide('경계 <b>후보</b>', edge.length ? tbl(['후보', '기준 순위', '순위 범위', `상위 ${top} 진입 확률`, '검증 단계'], edge.slice(0, 12).map(d => [`<button class="chip" data-act="open" data-v="${d.it.id}" style="font-size:11.5px;padding:4px 10px">${nameOf(d.it)}</button>`, d.base, `${d.min} ~ ${d.max}`, `<div class="bar" style="display:inline-block;width:90px;vertical-align:middle"><span class="g-orange" style="width:${d.p * 100}%"></span></div> <b>${Math.round(d.p * 100)}%</b>`, pill(d.it)])) : '<p class="mute sm mt">이 조건에서는 경계에 걸친 후보가 없습니다. 순위가 가중치 변화에 안정적입니다.</p>', '가중치에 따라 선정 여부가 갈리는 후보입니다. 근거 패키지와 정성 검토로 판단을 보강할 대상입니다.')}`;
};

/* ---------- 인터뷰 관리 ---------- */
const INT_STATUS = ['섭외 중', '일정 확정', '인터뷰 완료', '전사 완료', '코딩 완료'], INT_TARGET = 20;
ADM.interview = () => {
  const L = db.data.interviews, items = L.map(x => ({ x, it: byId(x.id) })).filter(v => v.it), done = L.filter(x => INT_STATUS.indexOf(x.status) >= 2).length;
  const pool = [...OUTCOMES, ...PEOPLE].filter(it => !L.some(x => x.id === it.id)).sort((a, b) => stageOf(b) - stageOf(a) || score(b) - score(a));
  return `
  <div class="row c4">${[[`${L.length}<small> / ${INT_TARGET}</small>`, '인터뷰 대상 (20인 내외)'], [done, '인터뷰 완료'], [L.filter(x => x.consent).length, '녹음·활용 동의'], [L.filter(x => x.agree).length, '2인 독립 코딩 일치']].map(([n, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['대상', '완료', '동의', '코딩'][i]}</div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('대상 <b>추가</b>', `<div class="toolbar" style="margin:12px 0 0"><select class="field" id="intpick" aria-label="인터뷰 대상">${pool.slice(0, 80).map(it => `<option value="${it.id}">${STAGES[stageOf(it)]} · ${it.id} · ${nameOf(it)}</option>`).join('')}</select><button class="btn pri" data-act="intadd">대상에 추가</button></div>
    <div class="mt">${DOMAINS.map(d => bar(d.short, items.filter(v => v.it.domain === d.id).length / Math.max(1, items.length) * 100, items.filter(v => v.it.domain === d.id).length, d.color, '90px 1fr 26px')).join('')}</div>`,
    '대표 연구자와 대표성과 핵심 연구자 20인 내외를 영역·세대·성별 균형을 고려해 고릅니다. 반구조화 인터뷰 1인당 60~90분, 동의 하에 녹음·전사합니다.')}
  ${slide('인터뷰 <b>진행 현황</b>', items.length ? items.map(({ x, it }) => `<div class="introw"><div class="intgrid">
      <div><button class="chip" data-act="open" data-v="${it.id}" style="font-size:11.5px;padding:4px 10px">${it.id}</button> <b>${nameOf(it)}</b><br><span class="mute sm">${dom(it.domain).short} · ${ERAS.find(e => e.id === it.era).label} 출발</span></div>
      <input class="field" type="date" value="${esc(x.date || '')}" data-chg="intset" data-id="${it.id}" data-k="date" aria-label="인터뷰 일자">
      <select class="field" data-chg="intset" data-id="${it.id}" data-k="mode" aria-label="방식">${['대면', '화상'].map(v => `<option ${x.mode === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select class="field" data-chg="intset" data-id="${it.id}" data-k="status" aria-label="진행 상태">${INT_STATUS.map(v => `<option ${x.status === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <label class="sm"><input type="checkbox" data-chg="intset" data-id="${it.id}" data-k="consent" ${x.consent ? 'checked' : ''}> 동의</label>
      <label class="sm"><input type="checkbox" data-chg="intset" data-id="${it.id}" data-k="agree" ${x.agree ? 'checked' : ''}> 코딩 일치</label>
      <button class="btn" data-act="intdel" data-v="${it.id}" aria-label="${it.id} 대상에서 제외">제외</button></div>
    <textarea class="field" rows="2" data-chg="intset" data-id="${it.id}" data-k="memo" placeholder="인터뷰 요지 (상세 화면의 인터뷰 발췌에 표시됩니다)" aria-label="인터뷰 요지" style="width:100%;margin-top:8px;resize:vertical">${esc(x.memo || '')}</textarea>
    <div class="chips" style="gap:6px;margin-top:8px"><span class="mute sm" style="align-self:center">주제 코딩</span>${INT_TAGS.map(t => `<button class="chip ${x.tags?.includes(t) ? 'on' : ''}" data-act="inttag" data-v="${t}" data-id="${it.id}" style="font-size:11.5px;padding:4px 10px">${t}</button>`).join('')}</div></div>`).join('') : '<p class="mute sm mt">아직 대상이 없습니다. 위에서 추가하세요.</p>',
    '주요 문항: 연구 출발과 첫 지원, 성장의 전환점, 지원이 만든 차이와 대안 요인, 후속세대 양성, 정책 제언. 주제 분석 후 2인 독립 코딩으로 신뢰도를 확보합니다.')}`;
};

R.admin = () => `<div class="chips subtabs">${ADMIN_SUBS.map(([v, l]) => `<button class="chip ${state.asub === v ? 'on' : ''}" data-act="nav" data-v="admin:${v}">${l}</button>`).join('')}</div>${ADM[state.asub]()}`;

/* ---------- 동작 ---------- */
const reviewCell = t => { const r = (db.data.review[t.dataset.id] ||= {}); return (r[t.dataset.m] ||= {}); };
const intOf = id => db.data.interviews.find(x => x.id === id);
Object.assign(ACT, {
  imptpl: v => impTemplate(v),
  impfile: async (_, el) => {
    const f = el.files[0]; if (!f) return;
    try {
      let table;
      if (/\.xlsx?$/i.test(f.name)) { const X = await loadXLSX(), wb = X.read(await f.arrayBuffer()); table = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }).filter(r => r.some(c => String(c).trim())); }
      else table = parseCSV(decodeText(await f.arrayBuffer()));
      state.imp = impRead(state.kind, table); render();
    } catch (e) { toast('파일을 읽지 못했습니다. CSV로 저장해 다시 올려 주세요.'); }
  },
  imppaste: () => { const v = $('#imppaste').value; if (!v.trim()) return toast('붙여넣은 내용이 없습니다.'); state.imp = impRead(state.kind, parseCSV(v)); render(); },
  impcancel: () => { state.imp = null; render(); },
  impgo: () => { const p = state.imp; db.data.imported[p.kind].push(...p.rows); db.save('imported'); applyImported(); state.imp = null; render(); toast(`${p.rows.length}건을 가져왔습니다.`); },
  impclear: v => { if (!confirm(`가져온 ${KIND[v]} ${db.data.imported[v].length}건을 모두 삭제할까요?`)) return; db.data.imported[v] = []; db.save('imported'); applyImported(); render(); toast('삭제했습니다.'); },
  backup: () => download(`nrf50-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(db.data, null, 2)], { type: 'application/json' })),
  restore: async (_, el) => {
    try { const d = JSON.parse(await el.files[0].text()); if (!confirm('현재 저장 내용을 백업 파일로 바꿀까요?')) return; for (const k of db.KEYS) if (d[k] !== undefined) { db.data[k] = d[k]; db.save(k); } applyImported(); render(); toast('복원했습니다.'); }
    catch (e) { toast('백업 파일을 읽지 못했습니다.'); }
  },
  syncnow: async () => { const ch = await remote.pull(); if (ch) applyImported(); render(); toast(remote.state === 'ok' ? '동기화했습니다.' : '서버에 연결하지 못했습니다.'); },
  cmpadd: () => { const v = $('#cmppick')?.value; if (v && state.cmp.length < 3) { state.cmp.push(v); render(); } },
  cmpdel: v => { state.cmp = state.cmp.filter(x => x !== v); render(); },
  cmpauto: () => { state.cmp = [...LIST[state.kind]].filter(it => stageOf(it) === 2).sort((a, b) => score(b) - score(a)).slice(0, 3).map(it => it.id); if (!state.cmp.length) toast('선정위 상정 단계 후보가 없습니다.'); render(); },
  rvrate: (v, t) => { reviewCell(t).r = +v || 0; db.save('review'); render(); },
  rvcoi: (_, t) => { const c = reviewCell(t); c.coi = t.checked; if (c.coi) c.r = 0; db.save('review'); render(); },
  rvnote: (v, t) => { reviewCell(t).c = v.slice(0, 300); db.save('review'); const m = $('#minutes'); if (m) m.value = minutes(state.kind); },
  mincopy: async () => { try { await navigator.clipboard.writeText($('#minutes').value); toast('회의록 초안을 복사했습니다.'); } catch (e) { $('#minutes').select(); toast('선택한 내용을 복사하세요.'); } },
  minsave: () => download(`선정위원회_회의록_초안_${state.kind === 'o' ? '성과' : '연구자'}.txt`, new Blob(['﻿' + $('#minutes').value], { type: 'text/plain' })),
  setstage: (v, t) => { db.data.status[t.dataset.id] = +v; db.save('status'); if (typeof gc !== 'undefined') gc.top = null; render(); },
  sens: (v, t) => { state.sens[t.dataset.k] = t.dataset.k === 'by' ? v : +v; render(); },
  intadd: () => { const v = $('#intpick')?.value; if (v && !intOf(v)) { db.data.interviews.push({ id: v, date: '', mode: '대면', status: INT_STATUS[0], consent: false, agree: false, memo: '', tags: [] }); db.save('interviews'); render(); } },
  intdel: v => { db.data.interviews = db.data.interviews.filter(x => x.id !== v); db.save('interviews'); render(); },
  intset: (v, t) => { const x = intOf(t.dataset.id); if (!x) return; const k = t.dataset.k; x[k] = t.type === 'checkbox' ? t.checked : String(v).slice(0, 2000); db.save('interviews'); if (k !== 'memo' && k !== 'date') render(); },
  inttag: (v, t) => { const x = intOf(t.dataset.id); if (!x) return; x.tags = x.tags?.includes(v) ? x.tags.filter(y => y !== v) : [...(x.tags || []), v]; db.save('interviews'); render(); },
});
