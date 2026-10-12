/* 07 홍보 확산: 카드 뉴스 */
/* --- 카드 뉴스: 대표성과 10선·대표 연구자 10인 × 5장, 9:16 Remotion 모션그래픽 --- */
// 카드 뉴스 대상: 성과·연구자 각 50. 최종선정을 앞에 두고, 연구자는 성장 궤적이 충분한(4단계 이상) 사례를 먼저 놓는다
const CARD_N = 50;
const cardFit = it => it.kind === 'o' || (it.life.length >= 4 && !(it.domain === 'hs' && ['P4', 'P5'].includes(it.guide)));
const cardTop = k => (gc.top ||= {})[k] ||= [...LIST[k]].sort((a, b) => stageOf(b) - stageOf(a) || cardFit(b) - cardFit(a) || score(b) - score(a)).slice(0, CARD_N);
// 카드 5장의 장면 명세. cards-remotion.js가 type별로 그린다
const cardSpecs = (it, rank) => {
  const d = dom(it.domain), era = ERAS.find(e => e.id === it.era), no = String(rank).padStart(2, '0'), base = { color: d.color, ref: it.id };
  if (it.kind === 'o') {
    const s = STORY[it.ctype], g = GRADES[it.grade], span = it.path[3].year - it.path[0].year;
    const m = FACTORS.map((_, i) => Math.round(it.mix.reduce((a, x) => a + x[i], 0) / 4)); m[0] += 100 - m.reduce((a, b) => a + b, 0);
    return [
      { type: 'cover', kicker: `대표성과 50선 · ${no}`, title: it.title, sub: FEEL[it.guide], tags: [d.short, O_GUIDE[it.guide], `${it.region} 확산`] },
      { type: 'big', kicker: '이야기의 시작', big: it.path[0].year, unit: '년', title: `「${it.path[0].program}」 지원에서 출발했습니다`, sub: it.path[0].desc, note: `${era.no} ${era.label} · ${era.sys}` },
      { type: 'steps', kicker: '영향경로', title: `${span}년에 걸친 확산의 길`, steps: it.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i], desc: p.program })) },
      { type: 'nums', kicker: '숫자로 보기', title: '함께 만든 성과', nums: [{ v: span, u: '년', l: '확산 기간' }, { v: it.invest, u: '억', l: '실질 투입' }, { v: score(it), u: '점', l: '성과 점수' }, { v: it.people.length, u: '명', l: '연계 연구자' }], bar: m, barTitle: '누가 함께 만들었나', barLabels: FACTORS.map(f => f.label) },
      { type: 'end', kicker: '재단 지원의 기여', quote: FEEL[it.guide], lines: [`${s.k} ${it.ctype} · ${s.def}`, `${g.label} · ${g.def}`, USE_DESC[it.guide]], badge: s.arc.join(' → ') },
    ].map(c => ({ ...base, ...c }));
  }
  const n = it.life.length, ti = Math.min(it.turn, n - 1), first = it.outcomes.map(byId)[0];
  return [
    { type: 'cover', kicker: `대표 연구자 50인 · ${no}`, title: `${it.field} 연구자`, sub: FEEL[it.guide], tags: [d.short, P_GUIDE[it.guide], it.life[n - 1].stage] },
    { type: 'big', kicker: '첫 지원', big: it.y0, unit: '년', title: `「${it.life[0].program}」으로 시작했습니다`, sub: `${ROLES[0]}에서 출발한 연구 여정`, note: `${era.no} ${era.label} · ${era.sys}` },
    { type: 'steps', kicker: '성장 궤적', title: '생애주기를 따라 자란 연구자', steps: it.life.map((p, i) => ({ year: p.year, label: p.stage, desc: p.program, mark: i === ti && ti > 0 })) },
    { type: 'nums', kicker: '숫자로 보기', title: '지원이 키운 것', nums: [{ v: it.years, u: '년', l: '누적 지원' }, { v: it.grants, u: '건', l: '재단 지원 과제' }, { v: it.alumni, u: '명', l: '배출 인력' }, { v: it.papers, u: '편', l: '대표 논문·저서' }], note: it.gap ? `지원 공백 ${it.gap}년을 지나 다시 이어진 연구` : '단절 없는 후속 지원이 만든 성장' },
    { type: 'end', kicker: '다음 세대로', quote: FEEL[it.guide], lines: [`공동연구자 ${it.coauthors}명과 함께한 연구`, `배출 인력 ${it.alumni}명이 학계와 산업으로`, first ? `연계 대표 성과 · ${first.title}` : '연계 대표 성과 발굴 중'], badge: `${ROLES[0]} → ${ROLES[n - 1]}` },
  ].map(c => ({ ...base, ...c }));
};
// Remotion을 불러오기 전이나 불러오지 못했을 때 보이는 정지 카드
const cardStill = (c, i) => `<div class="ccard"><div class="cstill" style="background:linear-gradient(162deg,${c.color} 0%,${c.color} 22%,#27365A 82%)"><small>대한민국 연구 50년 · ${i + 1}/5</small><span>${c.kicker}</span>
  <h3>${c.type === 'big' ? `${c.big}${c.unit}` : c.title || c.quote}</h3><p>${c.type === 'cover' ? c.sub : c.type === 'big' ? c.title : c.type === 'steps' ? c.steps.map(s => `${s.year} ${s.label}`).join('<br>') : c.type === 'nums' ? c.nums.map(x => `${x.l} ${x.v}${x.u}`).join('<br>') : c.lines.join('<br>')}</p><em>${c.ref} · 예시 데이터</em></div></div>`;
const cardItem = () => { const all = [...cardTop('o'), ...cardTop('p')]; return all.find(x => x.id === state.card) || all[0]; };
const gc = {};
const CARD_NAMES = ['표지', '시작', '경로', '숫자로보기', '기여와메시지'];
// items의 카드를 PNG로 그려 ZIP Blob을 만든다. onStep(done, total)로 진행 상황을 알린다
const buildCardZip = async (items, onStep = () => {}, jpg = false) => {
  await Promise.all(['400', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Pretendard`))).catch(() => {});
  const files = [], total = items.length * 5; let done = 0;
  for (const it of items) {
    const rank = cardTop(it.kind).findIndex(x => x.id === it.id) + 1, no = String(rank).padStart(2, '0');
    const name = (it.kind === 'o' ? it.title : `${it.field}-연구자`).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
    const dir = `${it.kind === 'o' ? '대표성과' : '대표연구자'}_${no}_${name}`, specs = cardSpecs(it, rank);
    for (let i = 0; i < specs.length; i++) {
      files.push({ name: `${dir}/${i + 1}_${CARD_NAMES[i]}.${jpg ? 'jpg' : 'png'}`, data: await cardImage(specs[i], i, jpg) });
      onStep(++done, total); await new Promise(r => setTimeout(r));
    }
  }
  files.push({ name: '안내.txt', data: new TextEncoder().encode(`대한민국 연구 50년 · 카드 뉴스\r\n\r\n규격: 세로형 9:16 (1080 x 1920) ${jpg ? 'JPG' : 'PNG'}, 세트당 5장\r\n구성: 1 표지 / 2 시작 / 3 경로 / 4 숫자로 보기 / 5 기여와 메시지\r\n수록: ${items.length}세트 ${total}장\r\n\r\n수치와 후보는 시연용 예시 데이터이며 실제 선정 결과가 아닙니다.\r\n연구자는 익명 처리해 분야로 표기했습니다.\r\n\r\n한국연구재단 | 한국외국어대학교\r\n`) });
  return zipStore(files);
};
const mountCards = () => {
  gc.un?.(); gc.un = null;
  const el = $('#cardstage'); if (!el) return;
  const it = cardItem(), specs = cardSpecs(it, cardTop(it.kind).findIndex(x => x.id === it.id) + 1);
  import(`../cards-remotion.js?v=${CONFIG.VERSION}`).then(m => { if (el.isConnected) gc.un = m.mount(el, specs); }).catch(() => { const n = $('#cardnote'); if (n) n.textContent = '모션그래픽 모듈을 불러오지 못해 정지 카드로 표시합니다.'; });
};
OUT.cards = () => {
  const it = cardItem(), k = it.kind, rank = cardTop(k).findIndex(x => x.id === it.id) + 1, specs = cardSpecs(it, rank);
  const pick = kk => `<div class="chips cardpick">${cardTop(kk).map((x, i) => `<button class="chip ${x.id === it.id ? 'on' : ''}" data-act="card" data-v="${x.id}"><i style="background:${dom(x.domain).color}"></i>${String(i + 1).padStart(2, '0')} ${kk === 'o' ? x.title : `${x.field} 연구자`}</button>`).join('')}</div>`;
  return `
  ${slide('카드 뉴스 <b>구성안</b>', info([['유형', '<span class="tag">성과 중심</span> <span class="tag">인물 중심</span>'], ['규격', '세로형 9:16 (1080 × 1920) · 장당 6초 반복 모션그래픽'], ['수량', '대표성과 50선 × 5장 + 대표 연구자 50인 × 5장 = <b>500장</b>'], ['5장 구성', '① 표지 → ② 시작(첫 지원) → ③ 경로(영향경로·성장 궤적) → ④ 숫자로 보기 → ⑤ 기여와 메시지'], ['제작 방식', 'Remotion 컴포지션 5종(표지·큰 숫자·단계·숫자판·맺음)에 연계 DB 값을 넣어 일괄 생성'], ['활용처', '인스타그램·유튜브 쇼츠·카카오 채널 등 세로형 SNS, 웹플랫폼 성과관·인물관, 50주년 전시']]) +
    '<p class="mute sm mt">대상은 성과·연구자 각 50으로, 최종선정을 앞에 두고 나머지는 성과 점수 순으로 채웠습니다. 수치는 시연용 예시이며, 연구자는 익명 처리해 분야로 표기합니다.</p>')}
  ${slide('대표성과 <b>50선</b>', pick('o'))}
  ${slide('대표 연구자 <b>50인</b>', pick('p'))}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:6px"><h2 style="flex:1 1 260px">${k === 'o' ? '대표성과' : '대표 연구자'} ${String(rank).padStart(2, '0')} · <b>${k === 'o' ? it.title : `${it.field} 연구자`}</b></h2>
      <button class="btn" data-act="cardstep" data-v="-1">← 이전</button><button class="btn" data-act="cardstep" data-v="1">다음 →</button><button class="btn" data-act="open" data-v="${it.id}">상세 열기</button></div>
    <div class="chips" style="margin:6px 0 10px"><button class="btn pri" data-act="cardzip" data-v="one">이 세트 ZIP 내려받기 (PNG 5장)</button><button class="btn" data-act="cardzip" data-v="o">대표성과 50선 ZIP (JPG 250장)</button><button class="btn" data-act="cardzip" data-v="p">대표 연구자 50인 ZIP (JPG 250장)</button><button class="btn" data-act="cardzip" data-v="all">전체 ZIP (JPG 500장)</button></div>
    <div class="chips" style="margin:0 0 10px"><button class="btn pri" data-act="cardmp4" data-v="one">이 세트 MP4 영상 (25초)</button><button class="btn" data-act="cardmp4" data-v="o">대표성과 상위 10 MP4 ZIP</button><button class="btn" data-act="cardmp4" data-v="p">대표 연구자 상위 10 MP4 ZIP</button></div>
    <p class="mute sm" id="cardnote">카드를 누르면 멈추거나 다시 재생됩니다. ZIP에는 각 카드의 완성 장면이 1080×1920 이미지로 담기고, MP4는 카드 5장을 이어 붙인 세로 영상(H.264, 30fps)입니다. 50선·50인·전체 묶음은 용량을 줄이려고 JPG로 만들며, 전체는 수십 초가 걸립니다.</p>
    <div class="cardrow" id="cardstage">${specs.map(cardStill).join('')}</div>
    <div class="cardcap">${['표지', '시작', '경로', '숫자로 보기', '기여와 메시지'].map((l, i) => `<span><b>${i + 1}</b> ${l}</span>`).join('')}</div>
    ${foot('카드 뉴스')}
  </section>`;
};
