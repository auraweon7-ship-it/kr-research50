/* 영문 전환(부분): 메뉴·라벨·유형·성과명·분야를 사전으로 바꾼다. 긴 설명문과 그림 속 글자는 한국어로 남는다.
   화면은 항상 한국어로 그린 뒤, 글자 조각이 사전과 정확히 맞을 때만 바꾼다. */
const EN = {
  // 메뉴와 화면 제목
  '대한민국 연구': 'Korea Research', '50년': '50 Years', '장기 파급효과 추적 플랫폼': 'Long-term impact tracing platform', '사업': 'Project', '목표': 'Goals', '사업 목표': 'Project Goals',
  '성과 발굴체계와': 'Discovery Framework &', '기준': 'Criteria', '성과 발굴체계와 기준': 'Discovery Framework & Criteria', '대표 성과': 'Top Outcomes', '50선': '50', '대표 성과 50선': 'Top 50 Outcomes',
  '대표 연구자': 'Top Researchers', '50인': '50', '대표 연구자 50인': 'Top 50 Researchers', '연구': 'Research', '네트워크': 'Network', '연구 네트워크': 'Research Network', '정부 지원': 'Government Support',
  '기여도 분석': 'Contribution Analysis', '정부 지원 기여도 분석': 'Contribution Analysis', '홍보': 'Outreach', '확산': '& Diffusion', '홍보 확산': 'Outreach & Diffusion', '관리': 'Admin', '연구 관리': 'Research Admin',
  '기획 개요': 'Planning overview', '연구자 생애주기 성장 흐름도': 'Researcher life-cycle growth flow', '지원사업 연계 기술·학술 발전 경로도': 'Programme-linked development path', '연구성과 대국민 확산 지도': 'Public diffusion map',
  '대표성과 인포그래픽': 'Outcome infographic', '카드 뉴스': 'Card news', '데이터 관리': 'Data', '선정위 심의': 'Committee review', '균형 점검': 'Balance check', '민감도 분석': 'Sensitivity', '인터뷰 관리': 'Interviews',
  '공개용': 'Public', '연구용': 'Staff', '안내': 'Note', '메뉴': 'Menu', '구역': 'Section', '성과': 'Outcome', '연구자': 'Researcher',
  // 공통 버튼·라벨
  '상세 열기': 'Open detail', '링크 복사': 'Copy link', '선택 해제': 'Clear selection', '성과 상세': 'Outcome detail', '인쇄': 'Print', '화면 맞춤': 'Fit view', '다시 배치': 'Re-layout', '전체 화면': 'Fullscreen', 'PNG 저장': 'Save PNG',
  '성과 트랙': 'Outcome track', '인물 트랙': 'Researcher track', '연구자 트랙': 'Researcher track', '발굴체계와 기준': 'Framework & criteria', '전체 영역': 'All domains', '전체 후보': 'All candidates', '최종선정만': 'Selected only',
  '← 이전': '← Prev', '다음 →': 'Next →', '삭제': 'Delete', '취소': 'Cancel', '복사': 'Copy', '근거 추가': 'Add evidence', '비교에 추가': 'Add to compare', '대상에 추가': 'Add', '제외': 'Remove', '보류': 'Hold',
  '검증 단계 지정': 'Set review stage', '세부기준 점수': 'Criteria scores', '근거 패키지': 'Evidence package', '연계 연구자': 'Linked researchers', '연계 대표 성과': 'Linked outcomes', '기본 정보': 'Basic info', '지원 이력': 'Funding history',
  '성과 이력': 'Achievements', '성장경로 분석': 'Growth-path analysis', '영향경로 분석': 'Impact-path analysis', '분석 결과': 'Findings', '사례 콘텐츠': 'Case content', '지식 확산 연결망': 'Knowledge diffusion network',
  '1. 성과 개요': '1. Overview', '2. 지원 이력 · 3. 영향경로': '2. Funding history · 3. Impact path', '4. 기여 유형·강도': '4. Contribution type & strength', '5. 국민 체감 포인트': '5. Public relevance', '6. 연구자 인터뷰 발췌': '6. Interview excerpt',
  '단계별 기여 구성': 'Contribution mix by stage', '연결 허브': 'Connection hubs', '최단 연결 경로': 'Shortest path', '경로 찾기': 'Find path', '경로 지우기': 'Clear path', '1단계 이웃': '1-hop', '2단계 이웃': '2-hop',
  '색': 'Colour', '크기': 'Size', '연결 수': 'Degree', '시대 구간': 'Era', '검증 단계': 'Review stage', '성과·연구자': 'Type', '지원 영역': 'Domain', '반발력': 'Repulsion', '연결 거리': 'Link distance', '중심 인력': 'Gravity',
  // 검증 단계·트랙·영역
  '후보': 'Candidate', '심층검토': 'In review', '선정위 상정': 'To committee', '최종선정': 'Selected', '양 트랙 일치': 'Both tracks', '정방향만': 'Forward only', '역방향만': 'Reverse only',
  '기초·원천·전략 R&D': 'Basic & strategic R&D', '인문사회·기초학술': 'Humanities & social sciences', '대학 연구역량·인재양성': 'University capacity & talent', '국제협력': 'International cooperation', '인문사회': 'HSS', '인재양성': 'Talent',
  // 발굴 유형
  '세계적 연구성과': 'World-class research', '산업·제품·서비스 활용': 'Industry & product use', '국민생활·사회문제 해결': 'Solving social problems', '국가전략기술 기반': 'National strategic technology', '학술 대전환·정책 기여': 'Scholarly shift & policy',
  '국제협력·연구위상': 'Global cooperation & standing', '세계적 연구역량·권위': 'World-class standing', '연구 생태계 기여': 'Ecosystem building', '사회·산업 혁신 기여': 'Social & industrial innovation', '딥테크 창업': 'Deep-tech startup',
  '대형 기술이전 주도': 'Major tech transfer', '정책 수립·담론 주도': 'Policy & public discourse',
  // 기여 유형·강도·기준·요인
  '직접기여': 'Direct', '핵심기반 기여': 'Foundational', '후속개발 기여': 'Follow-on development', '인재양성 기여': 'Talent development', 'A 직접기여': 'A Direct', 'B 핵심기반 기여': 'B Foundational', 'C 후속개발 기여': 'C Follow-on development', 'D 인재양성 기여': 'D Talent development',
  '결정적 기여': 'Decisive', '핵심 기여': 'Core', '보완 기여': 'Complementary', '간접 기여': 'Indirect', '성과 수준 (C2)': 'Outcome level (C2)', '파급 범위·지속성 (C3)': 'Reach & durability (C3)', '지원 연계·연속성 (C1)': 'Funding linkage (C1)',
  '국민 체감·대표성 (C6)': 'Public relevance (C6)', '정부 지원': 'Government', '연구기관': 'Institution', '기업·민간 투자': 'Private investment', '성과 점수': 'Outcome score', '투자 대비 성과 지수': 'Return-on-funding index',
  '실질 투입': 'Real funding', '기여 강도': 'Contribution strength', '확산 기간': 'Diffusion span', '첫 지원': 'First grant', '성과 지수': 'Index',
  // 시대·경로·생애주기
  '태동기': 'Founding', '성장기': 'Growth', '확장기': 'Expansion', '통합기': 'Integration', '도약기': 'Leap', '기초·원천연구': 'Basic research', '후속 연구': 'Follow-on research', '기술·지식 축적': 'Knowledge accumulation', '산업·사회 활용': 'Industrial & social use',
  '대학원·박사후': 'Graduate & postdoc', '신진 연구자': 'Early-career', '중견 연구자': 'Mid-career', '리더 연구자': 'Leading', '국가·글로벌 리더': 'National & global leader', '전환점': 'Turning point',
  '수도권': 'Capital area', '강원권': 'Gangwon', '충청권': 'Chungcheong', '대경권': 'Daegu–Gyeongbuk', '호남권': 'Honam', '동남권': 'Southeast', '제주권': 'Jeju',
  // 연결 종류
  '성과–연구자 연계': 'Outcome–researcher link', '공동연구': 'Co-research', '인용·후속과제 계보': 'Citation & follow-on lineage', '사제 관계': 'Mentorship', '대표 성과 ●': 'Outcomes ●', '대표 연구자 ○': 'Researchers ○',
  // 성과명
  '차세대 이차전지 양극 소재 원천기술': 'Next-generation battery cathode materials', '메모리 반도체 신소자 구조 기초연구': 'Novel memory device structures', 'mRNA 전달체 플랫폼 기초연구': 'mRNA delivery platform research',
  '그래핀 대면적 합성 기술': 'Large-area graphene synthesis', '유전자가위 교정 정밀도 향상 연구': 'Higher-precision gene editing', '페로브스카이트 태양전지 효율 향상': 'Perovskite solar cell efficiency',
  '유연 디스플레이용 산화물 반도체': 'Oxide semiconductors for flexible displays', '우주발사체 엔진 연소 기초연구': 'Launch-vehicle engine combustion', '양자점 발광 소재': 'Quantum-dot emitters',
  '신종 감염병 신속진단 원천기술': 'Rapid diagnostics for emerging infections', '줄기세포 분화 제어 기전 규명': 'Stem-cell differentiation mechanisms', '한국어 인공지능 언어모델 기반연구': 'Korean-language AI model foundations',
  '청정수소 생산 촉매': 'Clean-hydrogen catalysts', '미세먼지 생성 기전 규명 및 저감': 'Fine-dust formation and mitigation', '치매 조기진단 바이오마커': 'Biomarkers for early dementia diagnosis',
  '차세대 이동통신 안테나 원천기술': 'Next-generation mobile antennas', '웨어러블 헬스케어 센서': 'Wearable healthcare sensors', '항암 면역치료 표적 발굴': 'Cancer immunotherapy targets', '초전도·양자 소자 기초연구': 'Superconducting and quantum devices',
  '지진·재난 조기경보 모델': 'Earthquake and disaster early warning', '뇌 신경회로 지도 작성': 'Mapping brain neural circuits', '생분해성 플라스틱 소재': 'Biodegradable plastics', '로봇 보행 제어 알고리즘': 'Robot locomotion control',
  '식물 환경스트레스 내성 유전자 규명': 'Plant stress-tolerance genes', '나노의약 약물전달 시스템': 'Nanomedicine drug delivery', '차세대 원자로 안전 해석': 'Next-generation reactor safety analysis', '마이크로바이옴 기반 질환 연구': 'Microbiome-based disease research',
  '조합론·정수론 난제 해결': 'Open problems in combinatorics and number theory', '자율주행 인지 알고리즘': 'Perception for autonomous driving', '중력파·입자물리 국제공동 관측': 'International gravitational-wave and particle observation',
  '한국어 말뭉치·사전 편찬 기반 구축': 'Korean corpus and dictionary infrastructure', '고전 국역 및 한국학 자료 집성': 'Classical translation and Korean studies archive', '저출생·고령화 사회정책 연구': 'Low fertility and ageing policy research',
  '사회조사 패널 데이터 구축': 'Social survey panel data', '지역소멸 대응 정책 모형': 'Policy models for regional decline', '디지털 인문학 아카이브': 'Digital humanities archive', '다문화 사회통합 연구': 'Multicultural integration research',
  '경제발전 경험 모형화': 'Modelling the development experience', '교육격차 종단연구': 'Longitudinal study of education gaps', '인공지능 윤리·법제 연구': 'AI ethics and law', '동아시아 비교문명 연구': 'East Asian comparative civilisation',
  '재난 심리·트라우마 회복 연구': 'Disaster psychology and trauma recovery', '대학원 연구중심 체제 전환': 'Research-centred graduate schools', '우수연구센터 기반 연구집단 육성': 'Research groups through centres of excellence',
  '신진연구자 조기 정착 지원체계': 'Early-career settlement support', '박사후연구원 해외연수 인재 환류': 'Postdoc overseas training and return', '지역대학 연구거점 육성': 'Regional university research hubs',
  '대학 연구장비 공동활용 인프라': 'Shared university research equipment', '여성과학기술인 경력 복귀 지원': 'Career return for women in science', '반도체·AI 전문인력 양성': 'Semiconductor and AI talent',
  '인문사회 학문후속세대 펠로우십': 'HSS next-generation fellowships', '산학협력 기반 기술창업 인재': 'Industry–academia startup talent', '해외우수연구기관 공동연구센터 유치': 'Joint centres with leading overseas institutes',
  '다자 공동연구 프로그램 참여': 'Multilateral joint research programmes', '개도국 과학기술 협력(ODA)': 'Science ODA with developing countries', '국제 대형연구시설 공동 활용': 'Shared international large facilities',
  '글로벌 연구자 네트워크': 'Global researcher network', '극지·해양 국제 공동탐사': 'Polar and ocean joint expeditions', '국제 핵융합 공동연구 참여': 'International fusion research', '글로벌 감염병 대응 공동연구': 'Joint research on global infectious disease',
  // 분야
  '소재화학': 'Materials chemistry', '반도체 물리': 'Semiconductor physics', '분자생물학': 'Molecular biology', '나노과학': 'Nanoscience', '유전체학': 'Genomics', '에너지공학': 'Energy engineering', '전자공학': 'Electronics',
  '항공우주공학': 'Aerospace engineering', '광전자공학': 'Optoelectronics', '감염내과·진단': 'Infectious disease & diagnostics', '줄기세포생물학': 'Stem-cell biology', '인공지능': 'Artificial intelligence', '촉매화학': 'Catalysis',
  '대기과학': 'Atmospheric science', '신경과학': 'Neuroscience', '통신공학': 'Communications engineering', '의공학': 'Biomedical engineering', '종양면역학': 'Tumour immunology', '응집물질물리': 'Condensed-matter physics',
  '지구물리': 'Geophysics', '고분자공학': 'Polymer engineering', '로봇공학': 'Robotics', '식물과학': 'Plant science', '약학': 'Pharmacy', '원자력공학': 'Nuclear engineering', '미생물학': 'Microbiology', '수학': 'Mathematics',
  '컴퓨터비전': 'Computer vision', '구조생물학': 'Structural biology', '기계공학': 'Mechanical engineering', '국어학': 'Korean linguistics', '한국사': 'Korean history', '사회학': 'Sociology', '경제학': 'Economics',
  '행정학': 'Public administration', '철학': 'Philosophy', '교육학': 'Education', '법학': 'Law', '심리학': 'Psychology', '인류학': 'Anthropology', '고전문학': 'Classical literature', '지리학': 'Geography', '화학공학': 'Chemical engineering',
  '재료공학': 'Materials engineering', '생명공학': 'Biotechnology', '물리학': 'Physics', '전산학': 'Computer science', '과학기술정책': 'Science & technology policy', '산업공학': 'Industrial engineering', '통계학': 'Statistics',
  '입자물리': 'Particle physics', '극지과학': 'Polar science', '핵융합': 'Fusion', '천문학': 'Astronomy', '국제보건': 'Global health', '해양학': 'Oceanography', '기후과학': 'Climate science', '개발협력': 'Development cooperation',
};
const EN_ATTR = { '통합 검색  ( / )': 'Search  ( / )', '성과명 검색': 'Search outcomes', '분야·ID 검색': 'Search field or ID', '성과명·분야 검색 (그래프에서 강조)': 'Search (highlights in graph)' };
// 'A · B', '01 제목', '제목 12' 처럼 사전에 있는 낱말이 구분자와 섞인 조각도 나눠서 바꾼다
const trPart = s => {
  const t = s.trim(); if (!t) return s;
  if (EN[t]) return s.replace(t, EN[t]);
  let m = t.match(/^(\d+\.?|[A-Z]-\d+|0\d)\s+(.+)$/); if (m && EN[m[2]]) return s.replace(t, `${m[1]} ${EN[m[2]]}`);
  m = t.match(/^(.+?)\s+([\d.,]+%?)$/); if (m && EN[m[1]]) return s.replace(t, `${EN[m[1]]} ${m[2]}`);
  m = t.match(/^연구자 (R-\d+)$/); if (m) return s.replace(t, `Researcher ${m[1]}`);
  m = t.match(/^(.+) 연구자$/); if (m && EN[m[1]]) return s.replace(t, `${EN[m[1]]} researcher`);
  m = t.match(/^(.+) 출발$/); if (m && EN[m[1]]) return s.replace(t, `Started in ${EN[m[1]]} era`);
  return s;
};
const trText = s => /[가-힣]/.test(s) ? s.split(/( · | › | → | \/ )/).map(p => / · | › | → | \/ /.test(p) ? p : trPart(p)).join('') : s;
const applyLang = (root = document.body) => {
  document.documentElement.lang = state.lang;
  if (state.lang !== 'en' || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('script,style,textarea,canvas,svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  for (let n; (n = w.nextNode());) { const v = n.nodeValue; if (v.length < 90) { const t = trText(v); if (t !== v) n.nodeValue = t; } }
  root.querySelectorAll('[placeholder]').forEach(el => { const p = EN_ATTR[el.getAttribute('placeholder')]; if (p) el.setAttribute('placeholder', p); });
};
