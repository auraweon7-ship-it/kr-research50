/* 사례집 HWPX(한글) 내보내기: assets/hwpx의 보고서 양식(OWPML)에 본문 section0.xml을 만들어 넣고 ZIP으로 묶는다.
   글자 모양 7=20pt 굵게(제목) 8=14pt 굵게(소제목) 9=10pt 굵게(표 머리) 11=9pt(작은 글) 13=12pt 굵게 돋움(절 제목)
   문단 모양 20=가운데 21=가운데(표) 22=양쪽(표) 27=절 제목 위아래 선, 테두리 3=표 선 4=표 머리 배경 */
const HWPX_FILES = ['mimetype', 'version.xml', 'settings.xml', 'META-INF/container.xml', 'META-INF/container.rdf', 'META-INF/manifest.xml', 'Contents/header.xml', 'Contents/content.hpf', 'Preview/PrvText.txt', 'Preview/PrvImage.png'];
const hx = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hwpxWriter = () => {
  let id = 1000000002, tid = 2000000001;
  const P = (text, char = 0, para = 0, brk = 0) => `<hp:p id="${id++}" paraPrIDRef="${para}" styleIDRef="0" pageBreak="${brk}" columnBreak="0" merged="0"><hp:run charPrIDRef="${char}">${text === '' || text == null ? '<hp:t/>' : `<hp:t>${hx(text)}</hp:t>`}</hp:run></hp:p>`;
  const R = (parts, para = 0, brk = 0) => `<hp:p id="${id++}" paraPrIDRef="${para}" styleIDRef="0" pageBreak="${brk}" columnBreak="0" merged="0">${parts.map(([t, c]) => `<hp:run charPrIDRef="${c}"><hp:t>${hx(t)}</hp:t></hp:run>`).join('')}</hp:p>`;
  // 표: 첫 행은 머리(배경색·굵게·가운데), 나머지는 본문. 열 너비 합은 본문폭 42520
  const T = (rows, widths, rowH = 2600) => {
    const cell = (txt, r, c, head) => `<hp:tc name="" header="${head ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="1" borderFillIDRef="${head ? 4 : 3}"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${P(txt, head ? 9 : 0, head ? 21 : 22)}</hp:subList><hp:cellAddr colAddr="${c}" rowAddr="${r}"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="${widths[c]}" height="${rowH}"/><hp:cellMargin left="425" right="425" top="283" bottom="283"/></hp:tc>`;
    const body = rows.map((row, r) => `<hp:tr>${row.map((t, c) => cell(t, r, c, r === 0)).join('')}</hp:tr>`).join('');
    return `<hp:p id="${id++}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:tbl id="${tid++}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rows.length}" colCnt="${widths.length}" cellSpacing="0" borderFillIDRef="3" noAdjust="0"><hp:sz width="42520" widthRelTo="ABSOLUTE" height="${rowH * rows.length}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="425" right="425" top="283" bottom="283"/>${body}</hp:tbl></hp:run></hp:p>`;
  };
  const H = text => P(text, 13, 27);
  return { P, R, T, H, E: () => P('') };
};
// 사례집 본문: 표지 → 차례 → 항목마다 새 쪽(핵심 숫자 표·경로 표·이야기·근거·출처)
const bookSection = items => {
  const w = hwpxWriter(), { P, R, T, H, E } = w, out = [], today = new Date().toISOString().slice(0, 10), nO = items.filter(x => x.kind === 'o').length, nP = items.length - nO;
  out.push(E(), E(), E(), E(), P('한국연구재단 50주년', 8, 20), E(), P('대한민국 연구 50년', 7, 20), P('대표 사례집', 7, 20), E(), P([nO && `대표성과 ${nO}편`, nP && `대표 연구자 ${nP}인`].filter(Boolean).join(' · '), 8, 20), E(), E(), E(), E(), P(today, 0, 20), P('한국연구재단 | 한국외국어대학교', 0, 20), P('수치와 후보는 시연용 예시 데이터이며 실제 선정 결과가 아닙니다.', 11, 20));
  out.push(P('차례', 7, 0, 1), E());
  items.forEach((it, i) => out.push(R([[`${String(i + 1).padStart(2, '0')}  `, 9], [it.kind === 'o' ? it.title : `${it.field} 연구자`, 0], [`  (${it.id} · ${dom(it.domain).short})`, 11]])));
  items.forEach(it => {
    const o = it.kind === 'o', d = dom(it.domain), k = items.filter(x => x.kind === it.kind).indexOf(it) + 1, ev = db.data.evidence[it.id] || [], story = typeof bookStory === 'function' ? db.data.drafts[it.id] : null;
    out.push(P(`${o ? '대표성과' : '대표 연구자'} ${String(k).padStart(2, '0')} · ${d.label}`, 11, 0, 1));
    out.push(P(o ? it.title : `${it.field} 연구자`, 7), P(FEEL[it.guide], 8), E());
    out.push(o ? T([['첫 지원', '확산 기간', '실질 투입', '성과 점수'], [`${it.path[0].year}년`, `${it.path[3].year - it.path[0].year}년`, `${it.invest}억 원`, `${score(it)}점`]], [10630, 10630, 10630, 10630])
      : T([['첫 지원', '누적 지원', '재단 지원 과제', '배출 인력'], [`${it.y0}년`, `${it.years}년`, `${it.grants}건`, `${it.alumni}명`]], [10630, 10630, 10630, 10630]));
    out.push(E(), H(o ? '영향경로' : '성장 궤적'));
    out.push(T([['연도', o ? '단계' : '생애주기', '지원 사업', o ? '주요 산출물' : '주요 산출'], ...(o ? it.path.map((p, i) => [String(p.year), PATH_STAGES[i], p.program, PATH_OUT[i]]) : it.life.map(p => [String(p.year), p.stage, p.program, p.out]))], [6000, 9000, 13760, 13760], 2400));
    out.push(E(), H('이야기'));
    const dr = story?.draft && story.status !== '초안' ? story.draft : null;
    if (dr) dr.sections.forEach(s => { out.push(P(s.heading, 8)); s.paras.forEach(p => out.push(P(p.text))); });
    else { out.push(P(o ? `${it.path[0].year}년 「${it.path[0].program}」 지원으로 시작된 연구는 ${it.path[1].year}년 후속 연구, ${it.path[2].year}년 ${it.path[2].program}을 거쳐 ${it.path[3].year}년 ${PATH_STAGES[3]}에 이르렀습니다. ${USE_DESC[it.guide]}.`
      : `${it.y0}년 「${it.life[0].program}」으로 연구를 시작해 ${it.life.map(p => `${p.year}년 ${p.stage}`).join(', ')}로 성장했습니다. 배출 인력 ${it.alumni}명, 공동연구자 ${it.coauthors}명과 함께 연구를 이어 왔습니다.`)); out.push(P('※ 확정 원고가 없어 사실 목록으로 만든 요약입니다.', 11)); }
    const R2 = typeof relatedOutputs === 'function' ? relatedOutputs(it) : [];
    if (R2.length && (o || staff())) { out.push(E(), H('관련 성과')); out.push(T([['연도', '구분', '성과'], ...R2.slice(0, 10).map(x => [String(x.year || '—'), x.type, x.title])], [6000, 8000, 28520], 2400)); }
    out.push(E(), H('근거'));
    if (ev.length) ev.forEach((e, i) => out.push(P(`${i + 1}. ${e.type} · ${e.title}${e.note ? ` · ${e.note}` : ''}`)));
    else out.push(P('등록된 근거 문헌 없음', 11));
    out.push(E(), P(`${it.id} · 대한민국 연구 50년 · 출처: 재단 과제 DB · NTIS · KRM (시연용 예시 데이터)`, 11));
  });
  return out.join('\n');
};
let hwpxTpl = null;
const bookHwpx = async items => {
  hwpxTpl ||= await Promise.all([...HWPX_FILES, 'sec_head.xml'].map(async f => [f, new Uint8Array(await (await fetch(`assets/hwpx/${f}?v=${CONFIG.VERSION}`)).arrayBuffer())]));
  const enc8 = new TextEncoder(), dec = new TextDecoder(), T = Object.fromEntries(hwpxTpl), today = new Date().toISOString();
  const section = `${dec.decode(T['sec_head.xml'])}\n${bookSection(items)}\n</hs:sec>`;
  const hpf = dec.decode(T['Contents/content.hpf']).replace('<opf:title/>', '<opf:title>대한민국 연구 50년 대표 사례집</opf:title>').replace(/name="creator" content="text"/, 'name="creator" content="대한민국 연구 50년"').replace(/name="CreatedDate" content="text"/, `name="CreatedDate" content="${today}"`).replace(/name="ModifiedDate" content="text"/, `name="ModifiedDate" content="${today}"`);
  const files = HWPX_FILES.map(f => ({ name: f, data: f === 'Contents/content.hpf' ? enc8.encode(hpf) : f === 'Preview/PrvText.txt' ? enc8.encode('대한민국 연구 50년 대표 사례집') : T[f] }));
  files.splice(files.findIndex(f => f.name === 'Contents/content.hpf'), 0, { name: 'Contents/section0.xml', data: enc8.encode(section) });
  return zipStore(files);
};
