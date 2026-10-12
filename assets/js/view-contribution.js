/* 06 정부 지원 기여도 분석 */
/* ========== 06 정부 지원 기여도 분석 ========== */
const scatter = list => {
  const W = 760, H = 280, L = 40, B = 30, T = 12, x = v => L + (W - L - 12) * (Math.log10(v) / 2.6), y = v => T + (H - T - B) * (1 - (v - 50) / 50);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="실질 투입 대비 성과 점수 산점도">
    ${[50, 60, 70, 80, 90, 100].map(v => `<line x1="${L}" x2="${W - 12}" y1="${y(v)}" y2="${y(v)}" stroke="#D5DAE4"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
    ${[1, 3, 10, 30, 100, 300].map(v => `<text x="${x(v)}" y="${H - 10}" text-anchor="middle">${v}억</text>`).join('')}
    ${list.map(o => `<circle cx="${x(o.invest).toFixed(1)}" cy="${y(score(o)).toFixed(1)}" r="${4 + GRADES[o.grade].coef * 5}" fill="${GC[o.grade]}" opacity=".8" stroke="#fff" stroke-width="1.5" data-act="open" data-v="${o.id}" style="cursor:pointer"><title>${o.title} · 성과 ${score(o)} · 투입 ${o.invest}억 · 지수 ${roi(o).toFixed(1)}</title></circle>`).join('')}
    <text x="${L}" y="${T + 2}">성과 점수 ↑</text><text x="${W - 12}" y="${H - 22}" text-anchor="end">실질 투입액(로그 척도) →</text></svg>`;
};
R.contribution = () => {
  const list = state.scope === 'sel' ? selected('o') : OUTCOMES, n = list.length || 1;
  const top = [...list].sort((a, b) => roi(b) - roi(a)).slice(0, 8);
  return `
  ${jump(['기여 관점과 6단계', '기여 강도 판정', '단계별 기여 구성', '투자 대비 성과 지수', '정량·정성 검증'])}
  <div class="chips" style="margin-bottom:6px">
    <button class="chip ${state.scope === 'all' ? 'on' : ''}" data-act="scope" data-v="all">전체 성과 후보 ${OUTCOMES.length}건</button>
    <button class="chip ${state.scope === 'sel' ? 'on' : ''}" data-act="scope" data-v="sel">최종선정 ${selected('o').length}건</button>
  </div>

  ${sub(1, '귀속이 아닌 <b>기여 관점</b>', '재단 지원이 해당 성과에 어떤 차이를 만들었는가')}
  ${slide('기여분석(Contribution Analysis) <b>6단계</b>', `${steps(C.ca)}
    <div class="formula mt2"><b>원칙</b> 성과를 재단에 "귀속"하지 않고, 정부·연구자·기관·기업의 복합 요인 속에서 재단 지원의 "기여"를 근거 수준과 함께 제시합니다 (Mayne의 기여분석 접근 응용).</div>${foot('기여분석')}`,
    '지원 규모·시점, 후속 과제와 인용·특허 연계 같은 정량 데이터에 연구자 인터뷰·전문가 검증으로 확인한 정성적 파급효과를 더해 기여 스토리를 작성합니다.')}

  ${sub(2, '기여 강도 <b>4등급 판정</b>', '세부기준 C4 · 기여 계수는 투자 대비 성과 지수에 반영')}
  ${slide('기여 강도 <b>판정 기준</b>', tbl(['등급', '정의', '판정 근거(예)', '계수(안)', '후보'], GRADES.map((g, i) => [`<i class="dot" style="background:${GC[i]}"></i>${g.label}`, g.def, g.ev, g.coef.toFixed(1), `${list.filter(o => o.grade === i).length}건`])) +
    `<div class="mt2">${GRADES.map((g, i) => bar(g.label, list.filter(o => o.grade === i).length / n * 100, `${Math.round(list.filter(o => o.grade === i).length / n * 100)}%`, GC[i], '96px 1fr 44px')).join('')}</div>`)}

  ${sub(3, '발전 단계별 <b>기여 구성</b>', '기초·원천연구 → 후속 연구 → 기술·지식 축적 → 산업·사회 활용')}
  <div class="row c64">
    <section class="slide">
      <h2>단계별 <b>복합 요인</b> 구성</h2>${dots}
      <p class="lead">초기에는 정부 지원이 마중물이 되고, 활용 단계로 갈수록 기업·민간 투자 비중이 커지는 구조를 단계별로 확인합니다.</p>
      ${PATH_STAGES.map((s, i) => `<div class="srow"><span>${s}</span>${stack(avgMix(list, i))}</div>`).join('')}
      ${legend(FACTORS)}${foot('기여 구성')}
    </section>
    <section class="slide">
      <h2>4대 <b>기여(확산) 유형</b></h2>${dots}
      ${CTYPES.map((c, i) => bar(`${STORY[c].k} ${c}`, list.filter(o => o.ctype === c).length / n * 100, list.filter(o => o.ctype === c).length, G[i], '118px 1fr 30px')).join('')}
      <p class="mute sm mt">복수 유형이 공존하면 주 유형과 부 유형을 함께 기록합니다.</p>
      <h3 class="mt2">대안 설명 검토</h3><p class="mute sm">성과에 영향을 준 다른 요인을 함께 기록해 판단의 객관성을 높입니다.</p>
      ${ALTS.map((a, i) => bar(a, list.filter(o => o.alts.includes(a)).length / n * 100, `${list.filter(o => o.alts.includes(a)).length}건`, GC[(i + 2) % 4], '118px 1fr 44px')).join('')}
    </section>
  </div>
  ${slide('영역별 <b>초기 단계 정부 기여</b>', DOMAINS.map(d => { const v = avgMix(list.filter(o => o.domain === d.id), 0)[0]; return bar(d.label, v, `${v}%`, d.color, '170px 1fr 44px'); }).join(''))}

  ${sub(4, '<b>투자 대비 성과</b> 지수', '절대 규모가 아니라 실질 투입 대비 성과와 기여 강도를 함께 평가')}
  ${slide('지수 산정과 <b>세부기준 적용 절차</b>', `${steps(C.roi)}<div class="formula mt2"><b>산식(안)</b> 투자 대비 성과 지수 = 표준화 성과 점수 × 기여 계수 ÷ 실질 투입 지수(로그 척도)<br><span class="mute">성과 점수 단독 순위와 병행 제시해 대형 투자 성과와 고효율 성과를 모두 포착합니다.</span></div>`)}
  ${slide('실질 투입 × 성과 점수 × <b>기여 강도</b>', `${scatter(list)}${legend(GRADES.map((g, i) => ({ label: `${g.label} (계수 ${g.coef.toFixed(1)})`, color: GC[i] })))}<p class="mute sm mt">원의 크기와 색은 기여 강도입니다. 왼쪽 위(적은 투입·높은 성과)일수록 투자 효율이 높습니다. 점을 누르면 상세가 열립니다. 수치는 예시입니다.</p>`)}
  ${slide('투자 대비 성과 지수 <b>상위 성과</b>', `<div class="tw"><table><thead><tr><th>성과</th><th>기여 유형</th><th>기여 강도</th><th>실질 투입</th><th>성과 점수</th><th>지수</th></tr></thead><tbody>
    ${top.map(o => `<tr data-act="open" data-v="${o.id}"><td><b>${o.title}</b></td><td><span class="tag">${STORY[o.ctype].k} ${o.ctype}</span></td><td>${GRADES[o.grade].label}</td><td>${o.invest}억</td><td>${score(o)}</td><td><b>${roi(o).toFixed(1)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="mute">최종선정된 성과가 없습니다.</td></tr>'}
    </tbody></table></div>`)}

  ${sub(5, '정량·정성 <b>통합 검증</b>', '네트워크·계량 분석, 심층 인터뷰, 전문가 검증')}
  ${tiles(C.network)}
  <div class="row c2">
    ${slide('연구자 <b>심층 인터뷰</b> 설계', tbl(['구분', '내용'], C.interview))}
    ${slide('성과 관리 <b>지표(KPI)</b>', tbl(['구분', '지표', '목표'], C.kpi))}
  </div>`;
};
