/* 이력 타임라인: 대표 성과·대표 연구자 상세에서 지원 단계, 연계 항목, 데이터 검색으로 연결한 자료를
   한 가로 시간축에 겹쳐 성장과 영향을 한눈에 보이게 한다. 연결 자료(검증 전 검색 결과)는 관리자에게만 보인다. */
const TL_COL = ['#3D9FE6', '#EC5C8D', '#F6A53A', '#27B894', '#8A7CF0'];
const TL = { W: 900, L: 112, R: 18, lane: 34 };
// 연결 자료 구분 색: 지원 단계(영역 색)와 겹치지 않게 영역 색을 뺀 팔레트를 쓴다
const tlRoleCol = (it, roles, r) => { const P = TL_COL.filter(c => c !== dom(it.domain).color); return P[roles.indexOf(r) % P.length]; };

const tlData = it => {
  const o = it.kind === 'o', stages = o ? it.path.map((p, i) => ({ year: p.year, label: PATH_STAGES[i], sub: p.program }))
    : it.life.map((p, i) => ({ year: p.year, label: p.stage, sub: p.program, turn: i === Math.min(it.turn, it.life.length - 1) }));
  // 연계 항목: 성과는 연계 연구자의 첫 지원, 연구자는 연계 성과의 확산 구간
  const rel = (o ? it.people : it.outcomes).map(byId).filter(Boolean).map(x => x.kind === 'p' ? { id: x.id, label: `${x.title}`, from: x.y0, to: x.y0 } : { id: x.id, label: x.title, from: x.path[0].year, to: x.path[3].year });
  const roles = typeof LK_ROLES === 'object' ? LK_ROLES[it.kind] : [];
  const linked = isAdmin() && typeof lkList === 'function' ? lkList(it.id).filter(x => x.year) : [];
  return { stages, rel, roles, linked };
};

const tlSvg = (it, D) => {
  const lanes = [['지원 단계', 'stage'], [it.kind === 'o' ? '연계 연구자' : '연계 성과', 'rel'], ...D.roles.filter(r => D.linked.some(x => x.role === r)).map(r => [r, 'role'])];
  const years = [...D.stages.map(s => s.year), ...D.rel.flatMap(r => [r.from, r.to]), ...D.linked.map(x => x.year)].filter(Boolean);
  const y0 = Math.min(...years) - 1, y1 = Math.max(2026, ...years) + 1;
  const curveH = D.linked.length ? 86 : 0, top = 26, H = top + lanes.length * TL.lane + curveH + 30;
  const X = y => TL.L + (y - y0) / (y1 - y0) * (TL.W - TL.L - TL.R), laneY = i => top + i * TL.lane + TL.lane / 2;
  const t = (x, y, s, a = '', cls = 'tl-t') => `<text x="${x}" y="${y}" class="${cls}" ${a}>${esc(String(s))}</text>`;
  let g = '';
  // 시대 구간 띠
  ERAS.forEach((e, i) => { const a = Math.max(e.from, y0), b = Math.min(e.to + 1, y1); if (b <= a) return;
    g += `<rect x="${X(a)}" y="${top - 18}" width="${X(b) - X(a)}" height="${H - top - 12}" fill="${TL_COL[i % 5]}" opacity=".06"/>${t(X(a) + 4, top - 6, `${e.no} ${e.label}`, '', 'tl-t tl-era')}`; });
  // 연도 눈금
  for (let y = Math.ceil(y0 / 5) * 5; y <= y1; y += 5) g += `<line x1="${X(y)}" x2="${X(y)}" y1="${top}" y2="${H - 22}" class="tl-grid"/>${t(X(y), H - 8, y, 'text-anchor="middle"')}`;
  lanes.forEach(([name], i) => { g += `<line x1="${TL.L}" x2="${TL.W - TL.R}" y1="${laneY(i)}" y2="${laneY(i)}" class="tl-lane"/>${t(TL.L - 10, laneY(i) + 4, name, 'text-anchor="end"', 'tl-t tl-name')}`; });
  // 지원 단계: 이어지는 막대 + 단계 점
  const S = D.stages, col = dom(it.domain).color;
  S.forEach((s, i) => { const nx = S[i + 1] ? X(S[i + 1].year) : X(Math.min(2026, s.year + 3));
    g += `<rect x="${X(s.year)}" y="${laneY(0) - 5}" width="${Math.max(2, nx - X(s.year))}" height="10" rx="5" fill="${col}" opacity="${.35 + i * .15}"><title>${esc(`${s.year} ${s.label} · ${s.sub}`)}</title></rect>`;
    g += `<circle cx="${X(s.year)}" cy="${laneY(0)}" r="${s.turn ? 8 : 6}" fill="${s.turn ? '#F6A53A' : col}" stroke="#fff" stroke-width="2"><title>${esc(`${s.year} ${s.label}${s.turn ? ' (전환점)' : ''} · ${s.sub}`)}</title></circle>`;
    g += t(X(s.year), laneY(0) - 11, `${s.label}${s.turn ? ' ★' : ''}`, `text-anchor="${i === S.length - 1 && X(s.year) > TL.W - 80 ? 'end' : 'start'}"`, 'tl-t tl-st'); });
  // 연계 항목
  D.rel.forEach((r, k) => { const y = laneY(1) + (k % 3 - 1) * 6;
    g += r.to > r.from ? `<line x1="${X(r.from)}" x2="${X(r.to)}" y1="${y}" y2="${y}" stroke="#8A7CF0" stroke-width="4" stroke-linecap="round" opacity=".7" data-act="open" data-v="${r.id}" class="tl-hit"><title>${esc(`${r.id} ${r.label} · ${r.from}→${r.to}`)}</title></line>`
      : `<circle cx="${X(r.from)}" cy="${y}" r="5" fill="#8A7CF0" data-act="open" data-v="${r.id}" class="tl-hit"><title>${esc(`${r.id} ${r.label} · 첫 지원 ${r.from}`)}</title></circle>`; });
  // 연결 자료: 피인용에 비례한 점, 재단 지원 자료는 테두리
  const maxC = Math.max(1, ...D.linked.map(x => +x.cites || 0));
  lanes.forEach(([name, kind], i) => { if (kind !== 'role') return; const c = tlRoleCol(it, D.roles, name);
    D.linked.filter(x => x.role === name).forEach((x, k) => { const r = 3.5 + Math.sqrt((+x.cites || 0) / maxC) * 9;
      g += `<circle cx="${X(x.year) + (k % 3 - 1) * 2}" cy="${laneY(i)}" r="${r}" fill="${c}" fill-opacity=".55" stroke="${x.nrf ? '#27365A' : c}" stroke-width="${x.nrf ? 2 : 1}"><title>${esc(`${x.year} · ${x.title}${x.venue ? ` · ${x.venue}` : ''} · 피인용 ${x.cites ?? '—'}${x.nrf ? ' · 재단 지원' : ''}`)}</title></circle>`; }); });
  // 성장 곡선: 누적 자료 수(막대: 연도별 건수), 누적 피인용(선)
  if (curveH) {
    const base = top + lanes.length * TL.lane + curveH - 6, h = curveH - 22, by = {};
    for (const x of D.linked) (by[x.year] ||= { n: 0, c: 0 }), by[x.year].n++, by[x.year].c += +x.cites || 0;
    const ys = Object.keys(by).map(Number).sort((a, b) => a - b), maxN = Math.max(...ys.map(y => by[y].n));
    let cn = 0, cc = 0; const pts = [], ptsN = [], totC = Math.max(1, D.linked.reduce((a, x) => a + (+x.cites || 0), 0));
    for (const y of ys) { cn += by[y].n; cc += by[y].c; ptsN.push([X(y), base - cn / D.linked.length * h]); pts.push([X(y), base - cc / totC * h]);
      g += `<rect x="${X(y) - 3}" y="${base - by[y].n / maxN * h * .5}" width="6" height="${by[y].n / maxN * h * .5}" fill="${col}" opacity=".35"><title>${y}년 ${by[y].n}건 · 피인용 ${by[y].c}</title></rect>`; }
    const line = (P, c, dash = '') => `<polyline points="${[[P[0][0], base], ...P, [X(Math.max(2026, ys[ys.length - 1])), P[P.length - 1][1]]].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2.2" ${dash}/>`;
    g += `<line x1="${TL.L}" x2="${TL.W - TL.R}" y1="${base}" y2="${base}" class="tl-lane"/>${t(TL.L - 10, base - h / 2, '누적 성장', 'text-anchor="end"', 'tl-t tl-name')}${line(ptsN, col)}${line(pts, '#EC5C8D', 'stroke-dasharray="5 4"')}`;
  }
  return `<div class="tlwrap" tabindex="0" aria-label="${esc(it.id)} 이력 타임라인"><svg viewBox="0 0 ${TL.W} ${H}" class="tlsvg" role="img" aria-label="연도별 지원 단계와 성과 이력">${g}</svg></div>`;
};

const tlFacts = (it, D) => {
  const F = [], s0 = D.stages[0].year, last = D.stages[D.stages.length - 1];
  F.push(`첫 지원 <b>${s0}</b> → ${it.kind === 'o' ? '산업·사회 활용' : last.label} <b>${last.year}</b> · ${last.year - s0}년`);
  if (it.kind === 'p') { const tp = D.stages.find(s => s.turn); if (tp) F.push(`전환점 <b>${tp.year}</b> ${esc(tp.label)} 진입`); }
  if (D.rel.length) F.push(`${it.kind === 'o' ? '연계 연구자' : '연계 성과'} ${D.rel.length}건`);
  if (D.linked.length) {
    const ys = D.linked.map(x => x.year), by = {}; ys.forEach(y => by[y] = (by[y] || 0) + 1);
    const peak = Object.entries(by).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0], first = Math.min(...ys), recent = ys.filter(y => y >= 2022).length;
    const top = [...D.linked].sort((a, b) => (+b.cites || 0) - (+a.cites || 0))[0];
    F.push(`연결 자료 첫 연도 <b>${first}</b> (첫 지원 후 ${first - s0}년)${peak[1] > 1 ? ` · 가장 많은 해 <b>${peak[0]}</b> (${peak[1]}건)` : ''}`);
    F.push(`최근 5년(2022~) 비중 <b>${Math.round(recent / ys.length * 100)}%</b> · 피인용 최다: ${esc(top.title.slice(0, 50))}${top.title.length > 50 ? '…' : ''} (${top.cites ?? 0})`);
    const nrf = D.linked.filter(x => x.nrf).map(x => x.year); if (nrf.length) { const n0 = Math.min(...nrf); F.push(`재단 지원 표시 자료 ${nrf.length}건 · 그 뒤(${n0}~) 이어진 자료 <b>${ys.filter(y => y > n0).length}건</b>`); }
  }
  return F;
};

const tlSec = it => {
  const D = tlData(it), legendItems = [{ label: '지원 단계', color: dom(it.domain).color }, { label: it.kind === 'o' ? '연계 연구자' : '연계 성과', color: '#8A7CF0' },
    ...D.roles.filter(r => D.linked.some(x => x.role === r)).map(r => ({ label: r, color: tlRoleCol(it, D.roles, r) }))];
  return `<div class="sec"><h3>이력 타임라인 <span class="mute">· 성장과 영향</span></h3>
    <p class="mute sm">가로축은 연도, 줄마다 지원 단계·${it.kind === 'o' ? '연계 연구자' : '연계 성과'}${D.linked.length ? '·연결 자료(구분별)' : ''}입니다.${D.linked.length ? ' 점 크기는 피인용, 진한 테두리는 재단 지원 표시 자료입니다. 아래 실선은 누적 자료 수, 점선은 누적 피인용입니다.' : ''} 점에 마우스를 올리면 내용이, 연계 항목을 누르면 상세가 열립니다.</p>
    ${tlSvg(it, D)}${legend(legendItems)}
    <ul class="bul find mt">${tlFacts(it, D).map(f => `<li>${f}</li>`).join('')}</ul>
    ${isAdmin() && !D.linked.length ? '<p class="mute sm">데이터 검색에서 자료를 이 항목에 연결하면 연도별 성과 줄과 누적 성장 곡선이 함께 그려집니다.</p>' : ''}</div>`;
};
