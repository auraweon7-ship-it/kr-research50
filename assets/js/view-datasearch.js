/* 09 데이터 검색: 학술·R&D API를 한 번에 검색하고 결과를 분석한다 (관리자 모드).
   OpenAlex·Crossref·NCBI·Scopus는 브라우저에서 바로 부르고, NTIS·KCI·RISS·KRM은 server.js 중계를 거친다.
   API 키는 이 브라우저(localStorage)에만 저장하며 공유 저장소로 보내지 않는다. 받아온 글자는 모두 esc()로 거른다. */
const NRF_OA = 'F4320322120', NRF_CR = '501100003725';   // OpenAlex·Crossref의 한국연구재단 식별자
const DS_SRC = [
  { id: 'openalex', name: 'OpenAlex', key: '선택', desc: '전 세계 학술 문헌과 연구비 정보. 한국연구재단 지원 논문과 과제번호를 찾을 수 있습니다.', doc: 'https://docs.openalex.org', nrf: true, on: true },
  { id: 'crossref', name: 'Crossref', key: '없음', desc: 'DOI 메타데이터와 연구비 지원 기관 정보.', doc: 'https://api.crossref.org', nrf: true, on: true },
  { id: 'ncbi', name: 'NCBI PubMed', key: '선택', desc: '생명·의학 논문. 키가 있으면 요청 한도가 늘어납니다.', doc: 'https://www.ncbi.nlm.nih.gov/books/NBK25501/' },
  { id: 's2', name: 'Semantic Scholar', key: '선택', desc: '논문·피인용·분야. 키가 없으면 요청 한도가 매우 낮습니다.', doc: 'https://api.semanticscholar.org/api-docs/', auto: true },
  { id: 'scopus', name: 'Scopus', key: '필수', desc: 'Elsevier 인용 데이터베이스. 기관 구독 키가 필요합니다.', doc: 'https://dev.elsevier.com/', nrf: true },
  { id: 'ntis', name: 'NTIS', key: '필수', desc: '국가R&D 과제·성과. 응답은 XML입니다.', doc: 'https://www.ntis.go.kr/rndopen/api/mng/apiMain.do', proxy: true,
    tpl: 'https://www.ntis.go.kr/rndopen/openApi/public_project?apprvKey={key}&collection=project&SRWR={q}&searchRnkn=SCORE/DESC&startPosition=1&displayCnt={n}' },
  { id: 'kci', name: 'KCI', key: '필수', desc: '국내 학술지 논문과 인용 정보. 응답은 XML입니다.', doc: 'https://www.kci.go.kr/kciportal/po/openapi/openApiList.kci', proxy: true,
    tpl: 'https://open.kci.go.kr/po/openapi/openApiSearch.kci?apiCode=articleSearch&key={key}&title={q}&displayCount={n}&page=1' },
  { id: 'riss', name: 'RISS', key: '필수', desc: '학위논문·국내외 학술지. 응답은 XML입니다.', doc: 'https://www.riss.kr/openApi', proxy: true,
    tpl: 'http://www.riss.kr/openApi?key={key}&version=1.0&type=T&keyword={q}&rowcount={n}' },
  { id: 'krm', name: 'KRM', key: '필수', desc: '인문사회 연구과제·결과보고서 (공공데이터포털). 포털에서 받은 요청 주소를 넣어 주세요.', doc: 'https://www.data.go.kr', proxy: true,
    tpl: 'https://apis.data.go.kr/(공공데이터포털에서 확인한 KRM 주소)?serviceKey={key}&keyword={q}&numOfRows={n}&pageNo=1' },
];
const dsCfg = () => LS.get('nrf50.dsapi', { keys: {}, tpl: {}, custom: [], mailto: '' });
const dsSave = c => LS.set('nrf50.dsapi', c);
const dsSources = () => [...DS_SRC, ...dsCfg().custom.map(c => ({ ...c, custom: true, key: c.url.includes('{key}') ? '필수' : '없음', proxy: c.proxy, desc: `직접 추가한 API · ${c.type.toUpperCase()}` }))];
state.dsub = 'search';
const QF0 = () => ({ scope: 'all', type: '', field: '', lang: '', sort: 'rel', minCite: 0, oa: false, kr: false });
const RF0 = () => ({ src: '', y0: '', y1: '', minCite: '', type: '', topic: '', author: '', venue: '', nrf: false, award: false, doi: false, oa: false, fresh: false });
state.ds = { qf: QF0(), rf: RF0(), raw: [], fresh: null, srv: { keys: [], auth: false }, q: '', from: 1977, to: 2026, n: 25, nrf: false, on: Object.fromEntries(DS_SRC.map(s => [s.id, !!s.on])), st: {}, res: [], dup: 0, sel: new Set(), dom: 'rd', proxy: null, run: false };

/* ---------- 요청 ---------- */
// 중계 서버 상태: 서버에 공용 키가 있는 출처(keys)와 이 브라우저의 관리자 로그인 여부(auth)도 함께 받는다
const SRVKEY = '__SERVER_KEY__';
const dsProxy = async (force) => {
  if (state.ds.proxy !== null && !force) return state.ds.proxy;
  try { const r = await fetch('/proxy/health', { cache: 'no-store', credentials: 'same-origin' }), d = r.ok ? await r.json() : {}; state.ds.proxy = d.ok === true; state.ds.srv = { keys: d.keys || [], auth: !!d.auth }; }
  catch (e) { state.ds.proxy = false; state.ds.srv = { keys: [], auth: false }; }
  return state.ds.proxy;
};
// 내 키가 있으면 내 키, 없으면 (관리자 로그인 상태에서) 서버 공용 키 표시를 넘긴다. 실제 키는 서버가 끼워 넣는다
const dsKey = s => dsCfg().keys[s.id] || (state.ds.srv?.auth && state.ds.srv.keys.includes(s.id) ? SRVKEY : '');
const dsGet = async (src, url, headers = {}) => {
  const srv = url.includes(SRVKEY) || Object.values(headers).includes(SRVKEY), viaProxy = srv || src.proxy || (src.auto && await dsProxy());
  if (viaProxy && !(await dsProxy())) throw new Error('중계 서버 필요 · node server.js 로 실행한 주소에서만 됩니다');
  let r;
  try { r = await fetch(viaProxy ? `/proxy?url=${encodeURIComponent(url)}${srv ? `&src=${enc(src.id)}` : ''}` : url, { headers, credentials: 'same-origin' }); }
  catch (e) { throw new Error('연결 차단(CORS·네트워크) · 중계 서버를 거쳐야 할 수 있습니다'); }
  if (r.status === 401 || r.status === 403) throw new Error(`인증 실패(${r.status}) · API 키를 확인하세요`);
  if (r.status === 429) throw new Error('요청 한도 초과 · 잠시 후 다시 하거나 API 키를 넣으세요');
  if (!r.ok) throw new Error(`오류 ${r.status} · ${(await r.text()).slice(0, 80)}`);
  return r;
};
const enc = encodeURIComponent;
const httpUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const rec = (src, o) => ({ src, title: String(o.title || '').trim() || '(제목 없음)', year: +o.year || null, authors: (o.authors || []).filter(Boolean).slice(0, 6), venue: o.venue || '', cites: Number.isFinite(+o.cites) && o.cites !== '' && o.cites !== null ? +o.cites : null, doi: (o.doi || '').replace(/^https?:\/\/doi\.org\//i, ''), url: httpUrl(o.url), nrf: !!o.nrf, award: String(o.award || '').replace(/\u([0-9a-f]{4})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))), topics: (o.topics || []).filter(Boolean), type: o.type || '', oa: o.oa ?? null, lang: o.lang || '' });

// 검색 조건 필터(qf)를 출처마다 지원하는 만큼 요청에 싣는다. 지원하지 않는 조건은 결과 필터로 걸러진다
const QF_TYPES = [['', '전체 유형'], ['article', '학술 논문'], ['review', '리뷰'], ['book', '도서·도서 장'], ['proceedings', '학술대회 발표'], ['dissertation', '학위논문'], ['preprint', '프리프린트']];
const QF_FIELDS = [['', '전체 분야'], ['22', '공학'], ['25', '재료과학'], ['16', '화학'], ['15', '화학공학'], ['31', '물리·천문'], ['17', '컴퓨터과학'], ['26', '수학'], ['21', '에너지'], ['23', '환경과학'], ['19', '지구·행성과학'],
  ['13', '생화학·유전·분자생물'], ['24', '면역·미생물'], ['27', '의학'], ['28', '신경과학'], ['30', '약학·독성학'], ['11', '농업·생물과학'], ['33', '사회과학'], ['20', '경제·계량·금융'], ['14', '경영·회계'], ['32', '심리학'], ['12', '예술·인문'], ['18', '의사결정과학']];
// 출처별로 요청 단계에서 반영하는 조건 (나머지는 받아온 뒤 결과 필터로 거른다)
const QF_SUPPORT = { openalex: ['scope', 'type', 'oa', 'lang', 'kr', 'minCite', 'sort', 'field'], crossref: ['scope', 'type', 'sort'], ncbi: ['scope', 'type', 'oa', 'lang', 'kr', 'sort'], s2: ['type', 'oa', 'minCite'], scopus: ['scope', 'type', 'oa', 'lang', 'kr', 'sort'] };
const QF_LABEL = { scope: '제목만', type: '문헌 유형', oa: '오픈 액세스', lang: '언어', kr: '한국 기관', minCite: '최소 피인용', sort: '정렬', field: '분야' };
const qfOf = o => o.qf || {};

const DS_RUN = {
  async openalex(s, o, key) {
    const q = qfOf(o), T = { article: 'article', review: 'review', book: 'book|book-chapter', proceedings: 'article', dissertation: 'dissertation', preprint: 'preprint' };
    const f = [`publication_year:${o.from}-${o.to}`, ...(o.nrf ? [`funders.id:${NRF_OA}`] : []), ...(q.scope === 'title' ? [`title.search:${o.q.replace(/,/g, ' ')}`] : []),
      ...(q.type ? [`type:${T[q.type]}`] : []), ...(q.type === 'proceedings' ? ['primary_location.source.type:conference'] : []), ...(q.oa ? ['is_oa:true'] : []), ...(q.lang ? [`language:${q.lang}`] : []),
      ...(q.kr ? ['institutions.country_code:KR'] : []), ...(q.minCite > 0 ? [`cited_by_count:>${q.minCite - 1}`] : []), ...(q.field ? [`primary_topic.field.id:${q.field}`] : [])].map(x => x.split(':').map((p, i) => i ? enc(p).replace(/%7C/g, '|').replace(/%3E/g, '>') : p).join(':')).join(',');
    const sort = q.sort === 'new' ? '&sort=publication_date:desc' : q.sort === 'cite' ? '&sort=cited_by_count:desc' : '';
    const sel = 'id,title,publication_year,cited_by_count,doi,authorships,primary_location,primary_topic,funders,awards,type,open_access,language';
    const d = await (await dsGet(s, `https://api.openalex.org/works?${q.scope === 'title' ? '' : `search=${enc(o.q)}&`}filter=${f}${sort}&per-page=${Math.min(o.n, 200)}&page=${o.page || 1}&select=${sel}${key ? `&api_key=${enc(key)}` : ''}${dsCfg().mailto ? `&mailto=${enc(dsCfg().mailto)}` : ''}`)).json();
    return { total: d.meta?.count, rows: (d.results || []).map(w => rec('OpenAlex', { title: w.title, year: w.publication_year, authors: (w.authorships || []).map(a => a.author?.display_name), venue: w.primary_location?.source?.display_name, cites: w.cited_by_count, doi: w.doi, url: w.doi || w.id,
      nrf: (w.funders || []).some(f => f.id?.endsWith(NRF_OA)), award: (w.awards || []).filter(a => a.funder_id?.endsWith(NRF_OA) && a.funder_award_id).map(a => a.funder_award_id).join(', '), topics: [w.primary_topic?.field?.display_name, w.primary_topic?.display_name],
      type: w.primary_location?.source?.type === 'conference' ? 'proceedings' : w.type, oa: w.open_access?.is_oa, lang: w.language })) };
  },
  async crossref(s, o) {
    const q = qfOf(o), T = { article: 'journal-article', book: 'book,type:book-chapter', proceedings: 'proceedings-article', dissertation: 'dissertation', preprint: 'posted-content' };
    const f = [`from-pub-date:${o.from}`, `until-pub-date:${o.to}`, ...(o.nrf ? [`funder:${NRF_CR}`] : []), ...(q.type && T[q.type] ? [`type:${T[q.type]}`] : [])].join(',');
    const sort = q.sort === 'new' ? '&sort=published&order=desc' : q.sort === 'cite' ? '&sort=is-referenced-by-count&order=desc' : '';
    const d = await (await dsGet(s, `https://api.crossref.org/works?${q.scope === 'title' ? 'query.bibliographic' : 'query'}=${enc(o.q)}&rows=${Math.min(o.n, 100)}&offset=${((o.page || 1) - 1) * Math.min(o.n, 100)}&filter=${f}${sort}&select=DOI,title,issued,author,container-title,is-referenced-by-count,funder,subject,type${dsCfg().mailto ? `&mailto=${enc(dsCfg().mailto)}` : ''}`)).json();
    return { total: d.message?.['total-results'], rows: (d.message?.items || []).map(w => { const nf = (w.funder || []).find(f => (f.DOI || '').endsWith(NRF_CR) || /national research foundation of korea/i.test(f.name || ''));
      return rec('Crossref', { title: w.title?.[0], year: w.issued?.['date-parts']?.[0]?.[0], authors: (w.author || []).map(a => [a.given, a.family].filter(Boolean).join(' ')), venue: w['container-title']?.[0], cites: w['is-referenced-by-count'], doi: w.DOI, url: w.DOI ? `https://doi.org/${w.DOI}` : '', nrf: !!nf, award: (nf?.award || []).join(', '), topics: w.subject,
        type: { 'journal-article': 'article', 'proceedings-article': 'proceedings', 'book-chapter': 'book-chapter', 'posted-content': 'preprint' }[w.type] || w.type }); }) };
  },
  async ncbi(s, o, key) {
    const q = qfOf(o), k = key ? `&api_key=${enc(key)}` : '', T = { article: 'journal article[pt]', review: 'review[pt]', book: 'books and documents[filter]', preprint: 'preprint[pt]' };
    const term = [q.scope === 'title' ? `(${o.q})[ti]` : o.q, `${o.from}:${o.to}[dp]`, ...(q.type && T[q.type] ? [T[q.type]] : []), ...(q.oa ? ['free full text[sb]'] : []), ...(q.lang ? [{ en: 'english[la]', ko: 'korean[la]' }[q.lang]] : []), ...(q.kr ? ['korea[ad]'] : [])].join(' AND ');
    const ids = (await (await dsGet(s, `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${Math.min(o.n, 200)}&retstart=${((o.page || 1) - 1) * Math.min(o.n, 200)}${q.sort === 'new' ? '&sort=pub_date' : ''}&term=${enc(term)}${k}`)).json()).esearchresult;
    if (!ids?.idlist?.length) return { total: +ids?.count || 0, rows: [] };
    const d = (await (await dsGet(s, `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.idlist.join(',')}${k}`)).json()).result || {};
    return { total: +ids.count, rows: ids.idlist.map(id => d[id]).filter(Boolean).map(w => rec('PubMed', { title: w.title, year: (w.pubdate || '').slice(0, 4), authors: (w.authors || []).map(a => a.name), venue: w.fulljournalname || w.source, doi: (w.articleids || []).find(a => a.idtype === 'doi')?.value, url: `https://pubmed.ncbi.nlm.nih.gov/${w.uid}/`,
      type: (w.pubtype || []).some(t => /review/i.test(t)) ? 'review' : 'article', oa: q.oa ? true : null, lang: { eng: 'en', kor: 'ko' }[(w.lang || [])[0]] || (w.lang || [])[0] })) };
  },
  async s2(s, o, key) {
    const q = qfOf(o), T = { article: 'JournalArticle', review: 'Review', book: 'Book,BookSection', proceedings: 'Conference', preprint: '' };
    const extra = `${q.type && T[q.type] ? `&publicationTypes=${T[q.type]}` : ''}${q.oa ? '&openAccessPdf' : ''}${q.minCite > 0 ? `&minCitationCount=${q.minCite}` : ''}`;
    const d = await (await dsGet(s, `https://api.semanticscholar.org/graph/v1/paper/search?query=${enc(o.q)}&limit=${Math.min(o.n, 100)}&offset=${((o.page || 1) - 1) * Math.min(o.n, 100)}&year=${o.from}-${o.to}${extra}&fields=title,year,citationCount,authors,venue,externalIds,fieldsOfStudy,url,publicationTypes,isOpenAccess`, key ? { 'x-api-key': key } : {})).json();
    return { total: d.total, rows: (d.data || []).map(w => rec('Semantic Scholar', { title: w.title, year: w.year, authors: (w.authors || []).map(a => a.name), venue: w.venue, cites: w.citationCount, doi: w.externalIds?.DOI, url: w.url, topics: w.fieldsOfStudy,
      type: (w.publicationTypes || []).includes('Review') ? 'review' : (w.publicationTypes || []).includes('JournalArticle') ? 'article' : undefined, oa: w.isOpenAccess })) };
  },
  async scopus(s, o, key) {
    if (!key) throw new Error('API 키 필요');
    const q = qfOf(o), T = { article: 'ar', review: 're', book: 'bk OR DOCTYPE(ch)', proceedings: 'cp' };
    const qs = [`${q.scope === 'title' ? 'TITLE' : 'TITLE-ABS-KEY'}(${o.q})`, `PUBYEAR > ${o.from - 1}`, `PUBYEAR < ${o.to + 1}`, ...(o.nrf ? ['FUND-SPONSOR("National Research Foundation of Korea")'] : []), ...(q.type && T[q.type] ? [`DOCTYPE(${T[q.type]})`] : []),
      ...(q.oa ? ['OPENACCESS(1)'] : []), ...(q.lang ? [`LANGUAGE(${{ en: 'english', ko: 'korean' }[q.lang]})`] : []), ...(q.kr ? ['AFFILCOUNTRY("South Korea")'] : [])].join(' AND ');
    const sort = q.sort === 'new' ? '&sort=-coverDate' : q.sort === 'cite' ? '&sort=-citedby-count' : '';
    const d = (await (await dsGet(s, `https://api.elsevier.com/content/search/scopus?query=${enc(qs)}${sort}&count=${Math.min(o.n, 25)}&start=${((o.page || 1) - 1) * Math.min(o.n, 25)}`, { 'X-ELS-APIKey': key, Accept: 'application/json' })).json())['search-results'] || {};
    const e = (d.entry || []).filter(x => !x.error);
    return { total: +d['opensearch:totalResults'] || e.length, rows: e.map(w => rec('Scopus', { title: w['dc:title'], year: (w['prism:coverDate'] || '').slice(0, 4), authors: [w['dc:creator']], venue: w['prism:publicationName'], cites: w['citedby-count'], doi: w['prism:doi'], url: w['prism:doi'] ? `https://doi.org/${w['prism:doi']}` : '', nrf: o.nrf,
      type: { Article: 'article', Review: 'review', 'Conference Paper': 'proceedings', Book: 'book', 'Book Chapter': 'book-chapter' }[w.subtypeDescription] || w.subtypeDescription, oa: w.openaccessFlag })) };
  },
};

// 구조를 모르는 XML 응답: 가장 많이 반복되는 '자식이 있는 요소'를 한 건으로 보고, 이름으로 제목·연도 등을 짐작한다
const xmlRecords = (doc, name, tag) => {
  let recs;
  if (tag) recs = [...doc.getElementsByTagName(tag)];
  else {
    const cnt = {}; for (const el of doc.getElementsByTagName('*')) if (el.children.length) cnt[el.tagName] = (cnt[el.tagName] || 0) + 1;
    const best = Object.entries(cnt).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])[0]; recs = best ? [...doc.getElementsByTagName(best[0])] : [];
  }
  return recs.map(r => {
    const leaf = []; for (const el of r.getElementsByTagName('*')) if (!el.children.length && el.textContent.trim()) leaf.push([el.tagName, el.textContent.trim(), el.getAttribute('lang') || '']);
    const pick = re => leaf.find(([t]) => re.test(t))?.[1] || '';
    const titleK = leaf.find(([t, v, l]) => /title|titl|제목/i.test(t) && (l === 'original' || /[가-힣]/.test(v)))?.[1];
    return rec(name, { title: titleK || pick(/title|titl|제목/i), year: (pick(/year|date|pub|연도|일자/i).match(/(19|20)\d{2}/) || [])[0],
      authors: leaf.filter(([t]) => /author|writer|researcher|manager|저자|연구자|책임/i.test(t)).map(x => x[1]).slice(0, 4), venue: pick(/journal|publisher|agency|institution|org|학술지|기관/i),
      cites: (pick(/cit/i).match(/\d+/) || [])[0] ?? null, doi: pick(/^doi$/i), url: pick(/url|link/i) });
  });
};
const jsonPath = (o, p) => (p || '').split('.').filter(Boolean).reduce((a, k) => a?.[k], o);
const runTemplate = async (s, o, key) => {
  const t = (dsCfg().tpl[s.id] || s.tpl || s.url || '');
  if (/\(.*확인.*\)/.test(t)) throw new Error('요청 주소 입력 필요 · API 설정에서 넣어 주세요');
  if (t.includes('{key}') && !key) throw new Error('API 키 필요');
  const url = t.replace(/\{q\}/g, enc(o.q)).replace(/\{key\}/g, enc(key || '')).replace(/\{n\}/g, o.n).replace(/\{from\}/g, o.from).replace(/\{to\}/g, o.to).replace(/\{page\}/g, o.page || 1).replace(/\{start\}/g, ((o.page || 1) - 1) * o.n + 1);
  const text = await (await dsGet(s, url)).text();
  if (s.type === 'json' || /^\s*[{[]/.test(text)) {
    const d = JSON.parse(text), list = jsonPath(d, s.path) || [], fm = s.fields || {};
    return { rows: (Array.isArray(list) ? list : []).map(w => rec(s.name, { title: jsonPath(w, fm.title || 'title'), year: String(jsonPath(w, fm.year || 'year') || '').slice(0, 4), authors: [].concat(jsonPath(w, fm.authors || 'authors') || []).map(a => typeof a === 'string' ? a : a?.name), venue: jsonPath(w, fm.venue || 'venue'), cites: jsonPath(w, fm.cites || 'cites') })) };
  }
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('응답을 해석하지 못했습니다 (XML 아님)');
  const rows = xmlRecords(doc, s.name, s.path).filter(r => r.title !== '(제목 없음)');
  // 오류 응답은 메시지 요소를 먼저 찾고, 응답에 되돌아온 API 키는 가린다
  if (!rows.length) { const el = doc.querySelector('resultMsg, returnAuthMsg, errMsg, error, message, msg'), msg = ((el || doc.documentElement).textContent || '').trim().replace(/\s+/g, ' ').split(key || ' ').join('***').slice(0, 90); if (/error|err|인증|키|key|invalid|실패|없/i.test(msg)) throw new Error(`API 응답: ${msg}`); }
  return { rows };
};

/* ---------- 검색과 분석 ---------- */
const dsNorm = r => (r.doi ? `doi:${r.doi.toLowerCase()}` : `${r.title.toLowerCase().replace(/[^0-9a-z가-힣]/g, '')}:${r.year || ''}`);
// 여러 출처에서 같은 논문이 오면 하나로 합친다 (DOI, 없으면 제목+연도)
const dsMerge = () => {
  const ds = state.ds, seen = new Map();
  for (const r of ds.raw) { const k = dsNorm(r), p = seen.get(k); if (!p) seen.set(k, { ...r, srcs: [r.src] }); else { if (!p.srcs.includes(r.src)) p.srcs.push(r.src); p.nrf ||= r.nrf; p.award ||= r.award; if (p.cites === null || (r.cites ?? -1) > p.cites) p.cites = r.cites; if (!p.topics.length) p.topics = r.topics; } }
  ds.res = [...seen.values()]; ds.dup = ds.raw.length - ds.res.length;
};
const dsFetchPage = async (s, page) => {
  const ds = state.ds, o = { q: ds.q.trim(), from: ds.from, to: ds.to, n: ds.n, nrf: ds.nrf && s.nrf, page, qf: ds.qf }, key = dsKey(s);
  const r = DS_RUN[s.id] ? await DS_RUN[s.id](s, o, key) : await runTemplate(s, o, key);
  const prev = ds.st[s.id]?.got || 0;
  ds.st[s.id] = { state: 'ok', n: prev + r.rows.length, got: prev + r.rows.length, total: r.total, page, last: r.rows.length };
  ds.raw.push(...r.rows);
};
const dsSearch = async () => {
  const ds = state.ds, srcs = dsSources().filter(s => ds.on[s.id]);
  if (!ds.q.trim()) return toast('검색어를 입력하세요.');
  if (!srcs.length) return toast('검색할 데이터 출처를 하나 이상 고르세요.');
  await dsProxy(true);
  ds.run = true; ds.st = Object.fromEntries(srcs.map(s => [s.id, { state: 'run' }])); ds.res = []; ds.raw = []; ds.sel = new Set(); ds.fresh = null; ds.rf = RF0(); render();
  await Promise.all(srcs.map(async s => {
    try { await dsFetchPage(s, 1); } catch (e) { ds.st[s.id] = { state: 'err', msg: e.message }; }
    if (state.view === 'dsearch') render();
  }));
  dsMerge(); ds.run = false; render();
};
// 다음 쪽을 이어 받는다. 이미 끝까지 받은 출처는 건너뛴다
const dsMore = async () => {
  const ds = state.ds, srcs = dsSources().filter(s => ds.st[s.id]?.state === 'ok' && ds.st[s.id].last >= Math.min(ds.n, s.id === 'scopus' ? 25 : 100) && (!ds.st[s.id].total || ds.st[s.id].got < ds.st[s.id].total));
  if (!srcs.length) return toast('더 받을 결과가 없습니다.');
  ds.run = true; render();
  await Promise.all(srcs.map(async s => { const t = ds.st[s.id]; try { await dsFetchPage(s, t.page + 1); } catch (e) { ds.st[s.id] = { ...t, state: 'ok', msg: e.message, last: 0 }; } }));
  dsMerge(); ds.run = false; render();
};
// 받아온 결과에 결과 필터를 적용한다 (요청 단계에서 못 거른 조건도 여기서 맞춘다)
const dsView = () => {
  const ds = state.ds, f = ds.rf, q = ds.qf, low = x => String(x || '').toLowerCase();
  return ds.res.filter(r => (!f.src || r.srcs.includes(f.src)) && (!f.y0 || (r.year && r.year >= +f.y0)) && (!f.y1 || (r.year && r.year <= +f.y1))
    && (!(+f.minCite || q.minCite) || (r.cites ?? -1) >= Math.max(+f.minCite || 0, q.minCite || 0)) && (!f.type || r.type === f.type || (f.type === 'book' && r.type === 'book-chapter'))
    && (!q.type || r.type === q.type || (q.type === 'book' && r.type === 'book-chapter')) && (!q.oa || r.oa === true) && (!f.topic || r.topics.includes(f.topic)) && (!f.author || r.authors.some(a => low(a).includes(low(f.author)))) && (!f.venue || low(r.venue).includes(low(f.venue)))
    && (!f.nrf || r.nrf) && (!f.award || r.award) && (!f.doi || r.doi) && (!f.oa || r.oa === true) && (!f.fresh || ds.fresh?.has(dsNorm(r))));
};
const rfActive = () => Object.entries(state.ds.rf).filter(([k, v]) => v !== RF0()[k]).length;
const qfActive = () => Object.entries(state.ds.qf).filter(([k, v]) => v !== QF0()[k]).length;
const TYPE_KO = { article: '학술 논문', review: '리뷰', book: '도서', 'book-chapter': '도서 장', dissertation: '학위논문', preprint: '프리프린트', proceedings: '학술대회' };
const topN = (arr, n = 8) => { const m = new Map(); for (const x of arr) if (x) m.set(x, (m.get(x) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).slice(0, n); };
const yearChart = res => {
  const ys = res.map(r => r.year).filter(Boolean); if (!ys.length) return '<p class="mute sm mt">연도 정보가 없습니다.</p>';
  const y0 = Math.min(...ys), y1 = Math.max(...ys), srcs = [...new Set(res.map(r => r.srcs[0]))], col = s => GC[srcs.indexOf(s) % 4];
  const by = {}; for (const r of res) if (r.year) { (by[r.year] ||= {})[r.srcs[0]] = (by[r.year][r.srcs[0]] || 0) + 1; }
  const mx = Math.max(...Object.values(by).map(o => Object.values(o).reduce((a, b) => a + b, 0))), W = 760, H = 220, L = 30, B = 24, n = y1 - y0 + 1, bw = (W - L - 10) / n;
  let bars = '';
  for (let y = y0; y <= y1; y++) { let acc = 0; for (const s of srcs) { const v = by[y]?.[s] || 0; if (!v) continue; const h = v / mx * (H - B - 12); bars += `<rect x="${(L + (y - y0) * bw + 1).toFixed(1)}" y="${(H - B - acc - h).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${col(s)}"><title>${y} · ${esc(s)} ${v}건</title></rect>`; acc += h; } }
  const step = Math.max(1, Math.ceil(n / 10)), ticks = []; for (let y = y0; y <= y1; y += step) ticks.push(`<text x="${(L + (y - y0 + .5) * bw).toFixed(1)}" y="${H - 6}" text-anchor="middle">${y}</text>`);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="연도별 검색 결과 수"><line x1="${L}" x2="${W - 10}" y1="${H - B}" y2="${H - B}" stroke="#DCE1EA"/><text x="${L - 4}" y="16" text-anchor="end">${mx}</text>${bars}${ticks.join('')}</svg>${legend(srcs.map(s => ({ label: s, color: col(s) })))}`;
};
const rankList = (rows, empty) => rows.length ? `<ol class="rank">${rows.map(([k, v], i) => `<li style="cursor:default"><b>${i + 1}</b><span>${esc(k)}</span><b>${v}</b></li>`).join('')}</ol>` : `<p class="mute sm mt">${empty}</p>`;

/* ---------- 화면 ---------- */
const DSV = {};
DSV.search = () => {
  const ds = state.ds, cfg = dsCfg(), srcs = dsSources(), all = ds.res, res = dsView(), nrfSrc = res.filter(r => r.srcs.some(s => s === 'OpenAlex' || s === 'Crossref'));
  const cited = res.filter(r => r.cites !== null), stBadge = s => { const t = ds.st[s.id]; if (!t) return ''; return t.state === 'run' ? '<span class="tag">검색 중…</span>' : t.state === 'ok' ? `<span class="tag ok">${t.n}건${t.total ? ` / 전체 ${Number(t.total).toLocaleString()}` : ''}</span>` : `<span class="tag no" title="${esc(t.msg)}">${esc(t.msg)}</span>`; };
  const srvHas = s => state.ds.srv?.keys?.includes(s.id);
  const keyState = s => s.key === '없음' ? '<span class="mute sm">키 불필요</span>' : cfg.keys[s.id] ? '<span class="tag ok">키 입력됨</span>' : srvHas(s) ? (state.ds.srv.auth ? '<span class="tag ok">서버 공용 키</span>' : '<span class="tag">서버 키 있음 · 로그인 필요</span>') : s.key === '필수' ? '<span class="tag no">키 필요</span>' : '<span class="mute sm">키 선택</span>';
  return `
  ${slide('API <b>설정</b>', `<details class="alt" id="dscfg" ${(state.ds.cfgOpen ?? (srcs.some(s => s.key === '필수' && !cfg.keys[s.id]) && !Object.keys(cfg.keys).length)) ? 'open' : ''}><summary>API 키와 요청 주소 입력 · 직접 API 추가</summary>
    <div class="tw"><table><thead><tr><th scope="col">출처</th><th scope="col">설명</th><th scope="col">API 키</th><th scope="col">요청 주소</th><th scope="col"></th></tr></thead><tbody>
      ${srcs.map(s => `<tr><td><b>${esc(s.name)}</b><br>${keyState(s)}${s.proxy ? '<br><span class="mute sm">중계 서버 경유</span>' : ''}</td><td class="sm">${esc(s.desc)}${s.doc ? ` <a href="${esc(s.doc)}" target="_blank" rel="noopener noreferrer">문서</a>` : ''}</td>
        <td>${s.key === '없음' ? '<span class="mute sm">—</span>' : `<input class="field dskey" type="password" autocomplete="off" value="${esc(cfg.keys[s.id] || '')}" placeholder="${s.key === '필수' ? '필수' : '선택'}" data-chg="dskey" data-id="${esc(s.id)}" aria-label="${esc(s.name)} API 키">`}</td>
        <td>${s.tpl || s.custom ? `<input class="field dstpl" value="${esc(cfg.tpl[s.id] || s.tpl || s.url)}" data-chg="dstpl" data-id="${esc(s.id)}" aria-label="${esc(s.name)} 요청 주소">` : '<span class="mute sm">자동</span>'}</td>
        <td>${s.custom ? `<button class="btn" data-act="dsdel" data-v="${esc(s.id)}">삭제</button>` : `<button class="btn" data-act="dstest" data-v="${esc(s.id)}">연결 시험</button>`}${ds.st[s.id] ? `<br>${stBadge(s)}` : ''}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="toolbar mt"><input class="field" value="${esc(cfg.mailto || '')}" placeholder="연락 이메일 (OpenAlex·Crossref 권장, 선택)" data-chg="dsmail" aria-label="연락 이메일" style="flex:1 1 260px"></div>
    <p class="mute sm">요청 주소의 <code>{q}</code> 검색어, <code>{key}</code> API 키, <code>{n}</code> 건수, <code>{from}</code>·<code>{to}</code> 연도가 바뀌어 들어갑니다. 국내 API의 기본 주소는 공개 문서 기준 예시이므로 발급받은 안내서의 주소와 다르면 고쳐 주세요.
      키는 이 브라우저에만 저장되고 공유 저장소로 보내지 않습니다. 공용 PC에서는 사용 후 지워 주세요.</p>
    <h3 class="mt2" style="font-size:13.5px">직접 API 추가</h3>
    <div class="toolbar dsnew" style="margin-top:10px"><input class="field" data-f="name" placeholder="이름" aria-label="API 이름" style="flex:0 1 140px"><input class="field" data-f="url" placeholder="요청 주소 https://…{q}…{key}" aria-label="요청 주소" style="flex:2 1 300px">
      <select class="field" data-f="type" aria-label="응답 형식" style="flex:0 1 100px"><option value="json">JSON</option><option value="xml">XML</option></select><input class="field" data-f="path" placeholder="목록 위치 (예: results, 비우면 자동)" aria-label="목록 위치" style="flex:1 1 180px">
      <label class="sm"><input type="checkbox" data-f="proxy"> 중계 서버 경유</label><button class="btn pri" data-act="dsadd">추가</button></div>
    <p class="mute sm">JSON은 목록 안 항목의 title·year·authors·venue·cites 필드를 읽습니다. XML은 반복되는 항목을 자동으로 찾습니다. 중계 서버는 허용한 호스트만 통과시키므로 새 호스트는 서버의 PROXY_HOSTS 환경변수에 추가해야 합니다.</p></details>
    <p class="sm mt">서버 공용 키: ${state.ds.srv?.keys?.length ? `${state.ds.srv.keys.map(esc).join(', ')} · ${state.ds.srv.auth ? '<span class="tag ok">사용 중</span> 내 키를 넣지 않은 출처는 서버 키를 씁니다' : '<span class="tag">관리자 로그인 필요</span>'}` : '<span class="mute">없음 (서버 환경변수 KEY_NTIS 등으로 설정)</span>'}</p>
    <p class="sm">중계 서버: ${ds.proxy === null ? '<span class="mute">확인 전</span>' : ds.proxy ? '<span class="tag ok">사용 가능</span> 국내 API를 검색할 수 있습니다' : '<span class="tag no">없음</span> 국내 API(NTIS·KCI·RISS·KRM)는 <code>npm start</code>(server.js)로 실행한 주소에서만 검색됩니다'}</p>`,
    '학술·R&D 데이터베이스에 연결합니다. 키가 필요 없는 OpenAlex·Crossref·NCBI는 바로 쓸 수 있습니다.')}
  <section class="slide">
    <h2>통합 <b>검색</b></h2>${dots}
    <div class="toolbar mt"><input class="field" id="dsq" value="${esc(ds.q)}" placeholder="검색어 (예: graphene, 이차전지 양극재, CRISPR)" aria-label="검색어" data-chg="dsq" style="flex:2 1 260px">
      <label class="sm">연도 <input class="field" type="number" min="1900" max="2030" value="${ds.from}" data-chg="dsfrom" aria-label="시작 연도" style="width:90px"> ~ <input class="field" type="number" min="1900" max="2030" value="${ds.to}" data-chg="dsto" aria-label="끝 연도" style="width:90px"></label>
      <select class="field" data-chg="dsn" aria-label="출처별 건수" style="flex:0 1 120px">${[10, 25, 50, 100].map(v => `<option value="${v}" ${ds.n === v ? 'selected' : ''}>출처별 ${v}건</option>`).join('')}</select>
      <button class="btn pri" data-act="dsgo" ${ds.run ? 'disabled' : ''}>${ds.run ? '검색 중…' : '검색'}</button></div>
    ${savedStrip()}
    <div class="chips mt">${srcs.map(s => `<button class="chip ${ds.on[s.id] ? 'on' : ''}" data-act="dson" data-v="${esc(s.id)}" aria-pressed="${!!ds.on[s.id]}">${esc(s.name)} ${stBadge(s)}</button>`).join('')}</div>
    <label class="sm mt" style="display:inline-flex;gap:8px;align-items:center"><input type="checkbox" data-chg="dsnrf" ${ds.nrf ? 'checked' : ''}> 한국연구재단 지원 논문만 (OpenAlex·Crossref·Scopus에 적용)</label>
    <details class="alt" id="dsqf" ${ds.qfOpen ? 'open' : ''}><summary>상세 검색 조건 ${qfActive() ? `<span class="tag ok">${qfActive()}개 적용</span>` : ''}</summary>
      <div class="qfgrid">
        <label>검색 범위<select class="field" data-chg="dsqf" data-k="scope">${[['all', '제목·초록 등 전체'], ['title', '제목만']].map(([v, l]) => `<option value="${v}" ${ds.qf.scope === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>문헌 유형<select class="field" data-chg="dsqf" data-k="type">${QF_TYPES.map(([v, l]) => `<option value="${v}" ${ds.qf.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>분야<select class="field" data-chg="dsqf" data-k="field">${QF_FIELDS.map(([v, l]) => `<option value="${v}" ${ds.qf.field === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>언어<select class="field" data-chg="dsqf" data-k="lang">${[['', '전체 언어'], ['en', '영어'], ['ko', '한국어']].map(([v, l]) => `<option value="${v}" ${ds.qf.lang === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>정렬<select class="field" data-chg="dsqf" data-k="sort">${[['rel', '관련도순'], ['new', '최신순'], ['cite', '피인용순']].map(([v, l]) => `<option value="${v}" ${ds.qf.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>최소 피인용<input class="field" type="number" min="0" value="${ds.qf.minCite || ''}" placeholder="0" data-chg="dsqf" data-k="minCite"></label>
        <label class="chk"><input type="checkbox" data-chg="dsqf" data-k="oa" ${ds.qf.oa ? 'checked' : ''}> 오픈 액세스만</label>
        <label class="chk"><input type="checkbox" data-chg="dsqf" data-k="kr" ${ds.qf.kr ? 'checked' : ''}> 한국 기관 참여 논문만</label>
      </div>
      <div class="tw"><table class="qfsup"><thead><tr><th scope="col">조건</th>${Object.keys(QF_SUPPORT).map(id => `<th scope="col">${esc(DS_SRC.find(x => x.id === id).name)}</th>`).join('')}</tr></thead><tbody>
        ${Object.entries(QF_LABEL).map(([k, l]) => `<tr><td><b>${l}</b></td>${Object.keys(QF_SUPPORT).map(id => `<td>${QF_SUPPORT[id].includes(k) ? '<span class="tag ok">검색 단계</span>' : ['minCite', 'type', 'oa'].includes(k) ? '<span class="mute sm">결과 필터</span>' : '<span class="mute sm">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="mute sm">'검색 단계'는 출처에 조건을 보내 결과를 받고, '결과 필터'는 받아온 뒤 이 화면에서 거릅니다. 국내 API(NTIS·KCI·RISS·KRM)와 직접 추가한 API에는 검색어·연도·건수만 전달됩니다. 문헌 유형 분류는 출처마다 조금씩 다릅니다.</p>
      <div class="chips mt"><button class="btn" data-act="dsqfreset">조건 초기화</button></div>
    </details>
  </section>
  ${all.length ? `
  <section class="slide">
    <div class="toolbar" style="margin-bottom:4px"><h2 style="flex:1 1 200px">결과 <b>필터</b> <span class="mute sm">${res.length} / ${all.length}건${rfActive() ? ` · ${rfActive()}개 적용` : ''}</span></h2><button class="btn" data-act="dsrfreset" ${rfActive() ? '' : 'disabled'}>필터 초기화</button></div>
    <div class="qfgrid rf">
      <label>출처<select class="field" data-chg="dsrf" data-k="src"><option value="">전체 출처</option>${[...new Set(all.flatMap(r => r.srcs))].map(v => `<option ${ds.rf.src === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
      <label>연도<span class="yr2"><input class="field" type="number" value="${ds.rf.y0}" placeholder="${ds.from}" data-chg="dsrf" data-k="y0" aria-label="연도 시작"> ~ <input class="field" type="number" value="${ds.rf.y1}" placeholder="${ds.to}" data-chg="dsrf" data-k="y1" aria-label="연도 끝"></span></label>
      <label>최소 피인용<input class="field" type="number" min="0" value="${ds.rf.minCite}" placeholder="0" data-chg="dsrf" data-k="minCite"></label>
      <label>문헌 유형<select class="field" data-chg="dsrf" data-k="type"><option value="">전체 유형</option>${[...new Set(all.map(r => r.type).filter(Boolean))].map(v => `<option value="${esc(v)}" ${ds.rf.type === v ? 'selected' : ''}>${esc(TYPE_KO[v] || v)}</option>`).join('')}</select></label>
      <label>분야<select class="field" data-chg="dsrf" data-k="topic"><option value="">전체 분야</option>${topN(all.flatMap(r => r.topics), 40).map(([v, n]) => `<option value="${esc(v)}" ${ds.rf.topic === v ? 'selected' : ''}>${esc(v)} (${n})</option>`).join('')}</select></label>
      <label>저자 포함<input class="field" value="${esc(ds.rf.author)}" placeholder="이름 일부" data-chg="dsrf" data-k="author"></label>
      <label>학술지·기관 포함<input class="field" value="${esc(ds.rf.venue)}" placeholder="예: Nature" data-chg="dsrf" data-k="venue"></label>
      <div class="chks">${[['nrf', '재단 지원만'], ['award', '과제번호 있음'], ['doi', 'DOI 있음'], ['oa', '오픈 액세스만'], ...(ds.fresh ? [['fresh', '새 결과만']] : [])].map(([k, l]) => `<label class="chk"><input type="checkbox" data-chg="dsrf" data-k="${k}" ${ds.rf[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    </div>
    <p class="mute sm">받아온 결과 안에서 바로 거릅니다. 아래 분석·차트·표·CSV·후보 추가가 모두 필터 결과를 따릅니다.</p>
  </section>
  ${res.length ? `
  <div class="row c4">${[[res.length, '건', `검색 결과${rfActive() ? ` (필터 전 ${all.length}건)` : ''} · 중복 ${ds.dup}건 합침`], [new Set(res.flatMap(r => r.srcs)).size, '곳', '결과를 준 출처'], [cited.length ? Math.round(cited.reduce((a, r) => a + r.cites, 0) / cited.length) : '—', '회', '평균 피인용'], [nrfSrc.length ? Math.round(nrfSrc.filter(r => r.nrf).length / nrfSrc.length * 100) : '—', '%', '한국연구재단 지원 비율 (OpenAlex·Crossref 기준)']].map(([n, u, l], i) => `<div class="tile"><div class="blob ${G[i]} ${i % 2 ? 'b2' : ''}">${['결과', '출처', '인용', '재단'][i]}</div><div class="n">${n}<small> ${u}</small></div><div class="l">${l}</div></div>`).join('')}</div>
  ${slide('연도별 <b>분포</b>', yearChart(res))}
  <div class="row c3">
    ${slide('많이 나온 <b>저자</b>', rankList(topN(res.flatMap(r => r.authors)), '저자 정보가 없습니다.'))}
    ${slide('많이 나온 <b>학술지·기관</b>', rankList(topN(res.map(r => r.venue)), '학술지 정보가 없습니다.'))}
    ${slide('많이 나온 <b>분야</b>', rankList(topN(res.flatMap(r => r.topics)), '분야 정보는 OpenAlex·Crossref·Semantic Scholar 결과에만 있습니다.'))}
  </div>
  ${slide('공저 <b>네트워크</b>', coauthorNet(res))}
  ${slide('피인용 <b>상위 10</b>', cited.length ? tbl(['제목', '연도', '학술지', '피인용', '재단 과제번호'], [...cited].sort((a, b) => b.cites - a.cites).slice(0, 10).map(r => [r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title), r.year || '—', esc(r.venue || '—'), `<b>${r.cites.toLocaleString()}</b>`, esc(r.award || (r.nrf ? '지원 표시' : '—'))])) : '<p class="mute sm mt">피인용 정보가 있는 결과가 없습니다.</p>')}
  <section class="slide">
    <div class="toolbar" style="margin-bottom:6px"><h2 style="flex:1 1 200px">검색 <b>결과</b> <span class="mute sm">${res.length}건 · 선택 ${ds.sel.size}건${ds.fresh ? ` · 새 결과 ${ds.fresh.size}건` : ''}</span></h2>
      <button class="btn" data-act="dsall">${ds.sel.size && ds.sel.size === Math.min(res.length, 200) ? '선택 해제' : '앞 200건 모두 선택'}</button><button class="btn" data-act="dsmore" ${ds.run ? 'disabled' : ''}>더 가져오기 (출처별 +${ds.n}건)</button><button class="btn" data-act="dscsv">CSV 내려받기</button>
      <select class="field" data-chg="dsdom" aria-label="후보로 추가할 지원 영역" style="flex:0 1 150px">${DOMAINS.map(d => `<option value="${d.id}" ${ds.dom === d.id ? 'selected' : ''}>${d.short}</option>`).join('')}</select>
      <button class="btn pri" data-act="dsimport" ${ds.sel.size ? '' : 'disabled'}>선택 항목을 성과 후보로 추가</button></div>
    <p class="mute sm">성과 후보로 추가하면 역방향(현재 성과에서 출발) 트랙 후보로 데이터 관리에 들어갑니다. 첫 지원 연도는 출판 연도로 임시로 채우므로 지원 이력을 확인해 고쳐 주세요.</p>
    <div class="tw"><table class="dsres"><thead><tr><th scope="col"><span class="sr">선택</span></th><th scope="col">출처</th><th scope="col">제목</th><th scope="col">연도</th><th scope="col">저자</th><th scope="col">학술지·기관</th><th scope="col">피인용</th><th scope="col">재단</th></tr></thead><tbody>
      ${res.slice(0, 200).map((r, i) => `<tr><td><input type="checkbox" data-chg="dssel" data-v="${esc(dsNorm(r))}" ${ds.sel.has(dsNorm(r)) ? 'checked' : ''} aria-label="${i + 1}번 선택"></td><td class="sm">${r.srcs.map(esc).join('<br>')}${ds.fresh?.has(dsNorm(r)) ? '<br><span class="tag ok">새 결과</span>' : ''}</td>
        <td>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}${r.doi ? `<br><span class="mute sm">${esc(r.doi)}</span>` : ''}</td><td>${r.year || '—'}</td><td class="sm">${esc(r.authors.slice(0, 3).join(', '))}${r.authors.length > 3 ? ' 외' : ''}</td>
        <td class="sm">${esc(r.venue || '—')}</td><td>${r.cites ?? '—'}</td><td class="sm">${r.nrf ? `<span class="tag ok">지원</span>${r.award ? r.award.split(', ').map(a => `<br><button class="linkbtn" data-act="trpick" data-v="${esc(a)}" title="과제 역추적">${esc(a)}</button>`).join('') : ''}` : '—'}</td></tr>`).join('')}
    </tbody></table></div>${res.length > 200 ? '<p class="mute sm mt">앞 200건만 표시합니다. CSV에는 전체가 담깁니다.</p>' : ''}
  </section>` : slide('조건에 맞는 <b>결과 없음</b>', '<p class="mute sm mt">결과 필터를 풀거나 바꿔 보세요.</p>')}` : ds.run ? '' : slide('검색 <b>안내</b>', `<ul class="bul"><li>여러 출처를 한 번에 검색해 같은 논문(DOI 또는 제목·연도가 같은 것)은 하나로 합칩니다.</li><li>"한국연구재단 지원 논문만" 을 켜면 OpenAlex·Crossref의 연구비 정보로 재단 지원 논문만 남기고, 과제번호가 있으면 함께 보여줍니다.</li><li>결과는 연도별 분포, 저자·학술지·분야 순위, 피인용 상위로 분석하고, 골라서 성과 후보로 보낼 수 있습니다.</li></ul>`)}`;
};

/* ---------- 동작 ---------- */
const dsTpl = (form, k) => $(`[data-f="${k}"]`, form);
Object.assign(ACT, {
  dsq: v => { state.ds.q = v.slice(0, 200); },
  dsfrom: v => { state.ds.from = Math.max(1900, Math.min(2030, +v || 1977)); },
  dsto: v => { state.ds.to = Math.max(1900, Math.min(2030, +v || 2026)); },
  dsn: v => { state.ds.n = +v; },
  dsnrf: (_, t) => { state.ds.nrf = t.checked; },
  dsdom: v => { state.ds.dom = v; },
  dson: v => { state.ds.on[v] = !state.ds.on[v]; render(); },
  dsmore: () => dsMore(),
  dsqf: (v, t) => { const k = t.dataset.k; state.ds.qf[k] = t.type === 'checkbox' ? t.checked : k === 'minCite' ? Math.max(0, +v || 0) : v; render(); },
  dsqfreset: () => { state.ds.qf = QF0(); render(); },
  dsrf: (v, t) => { const k = t.dataset.k; state.ds.rf[k] = t.type === 'checkbox' ? t.checked : String(v).slice(0, 80); state.ds.sel = new Set(); render(); },
  dsrfreset: () => { state.ds.rf = RF0(); render(); },
  dsgo: () => { state.ds.q = $('#dsq')?.value.slice(0, 200) || state.ds.q; dsSearch(); },
  dskey: (v, t) => { const c = dsCfg(); if (v.trim()) c.keys[t.dataset.id] = v.trim(); else delete c.keys[t.dataset.id]; dsSave(c); render(); },
  dstpl: (v, t) => { const c = dsCfg(), s = dsSources().find(x => x.id === t.dataset.id); if (!/^https?:\/\//i.test(v.trim())) return toast('요청 주소는 http:// 또는 https:// 로 시작해야 합니다.');
    if (s.custom) { const x = c.custom.find(y => y.id === s.id); x.url = v.trim(); } else c.tpl[s.id] = v.trim(); dsSave(c); toast('요청 주소를 저장했습니다.'); },
  dsmail: v => { const c = dsCfg(); c.mailto = /^[^@\s]+@[^@\s]+$/.test(v.trim()) ? v.trim() : ''; dsSave(c); },
  dsadd: (_, t) => {
    const f = t.closest('.dsnew'), name = dsTpl(f, 'name').value.trim().slice(0, 40), url = dsTpl(f, 'url').value.trim();
    if (!name || !/^https?:\/\//i.test(url) || !url.includes('{q}')) return toast('이름과 {q}가 들어간 http(s) 요청 주소를 넣어 주세요.');
    const c = dsCfg(), id = `c${Date.now().toString(36)}`;
    c.custom.push({ id, name, url, type: dsTpl(f, 'type').value, path: dsTpl(f, 'path').value.trim(), proxy: dsTpl(f, 'proxy').checked }); dsSave(c); state.ds.on[id] = true; render(); toast(`${name} API를 추가했습니다.`);
  },
  dsdel: v => { const c = dsCfg(); c.custom = c.custom.filter(x => x.id !== v); delete c.keys[v]; dsSave(c); delete state.ds.on[v]; render(); },
  dstest: async v => {
    const s = dsSources().find(x => x.id === v), ds = state.ds; ds.st[v] = { state: 'run' }; render();
    try { await dsProxy(true); const o = { q: s.proxy ? '연구' : 'research', from: 2015, to: 2026, n: 3, nrf: false, page: 1 }, key = dsKey(s); const r = DS_RUN[v] ? await DS_RUN[v](s, o, key) : await runTemplate(s, o, key); ds.st[v] = { state: 'ok', n: r.rows.length, total: r.total }; }
    catch (e) { ds.st[v] = { state: 'err', msg: e.message }; }
    render();
  },
  dssel: (v, t) => { t.checked ? state.ds.sel.add(v) : state.ds.sel.delete(v); render(); },
  dsall: () => { const ds = state.ds, keys = dsView().slice(0, 200).map(dsNorm); ds.sel = ds.sel.size && ds.sel.size === keys.length ? new Set() : new Set(keys); render(); },
  dscsv: () => {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, rows = [['출처', '제목', '연도', '유형', '저자', '학술지·기관', '피인용', 'DOI', '주소', '오픈 액세스', '재단 지원', '재단 과제번호', '분야']];
    for (const r of dsView()) rows.push([r.srcs.join(' / '), r.title, r.year || '', TYPE_KO[r.type] || r.type, r.authors.join('; '), r.venue, r.cites ?? '', r.doi, r.url, r.oa === true ? 'Y' : r.oa === false ? 'N' : '', r.nrf ? 'Y' : '', r.award, r.topics.join('; ')]);
    download(`데이터검색_${state.ds.q.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)}.csv`, new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }));
  },
  dsimport: () => {
    const ds = state.ds, picked = ds.res.filter(r => ds.sel.has(dsNorm(r))), skip = picked.filter(r => !r.year || r.year < 1977).length;
    const rows = picked.filter(r => r.year && r.year >= 1977).map(r => ({ title: impClean(r.title), domain: ds.dom, guide: 'G1', ctype: CTYPES[1], grade: 1, y0: Math.min(2026, r.year), y1: null, y2: null, y3: null, y4: null,
      s0: null, s1: null, s2: null, s3: null, invest: null, links: [], region: '수도권', p0: impClean(r.award ? `재단 과제 ${r.award}` : `${r.srcs[0]} 검색`), p1: '', track: 'reverse' }));
    if (!rows.length) return toast('1977년 이후 연도가 있는 항목이 없습니다.');
    db.data.imported.o.push(...rows); db.save('imported'); applyImported(); ds.sel = new Set(); render();
    toast(`성과 후보 ${rows.length}건을 추가했습니다${skip ? ` (연도 없음·1977년 이전 ${skip}건 제외)` : ''}. 연구 관리 → 데이터 관리에서 확인하세요.`);
  },
});
dsProxy();
// 검색어 칸에서 Enter로 바로 검색
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'dsq') { e.preventDefault(); ACT.dsgo(); } });

R.dsearch = () => `<div class="chips subtabs">${DS_SUBS.map(([v, l]) => `<button class="chip ${state.dsub === v ? 'on' : ''}" data-act="nav" data-v="dsearch:${v}">${l}</button>`).join('')}</div>${DSV[state.dsub]()}`;
// API 설정을 펼치고 접은 상태를 기억한다 (toggle은 버블링되지 않아 캡처 단계에서 받는다)
document.addEventListener('toggle', e => { if (e.target.id === 'dscfg') state.ds.cfgOpen = e.target.open; if (e.target.id === 'dsqf') state.ds.qfOpen = e.target.open; }, true);
