/* 저장소: 기본은 이 브라우저(localStorage). config.js에 Supabase 주소와 키를 넣으면 연구진이 함께 쓰는 공유 저장소로 동기화한다.
   공유 대상은 검증 단계, 근거 패키지, 선정위 심의, 인터뷰, 가져온 데이터, 항목별 연결 자료다. 표는 supabase/schema.sql 참고. */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경에서는 세션 내 상태만 유지 */ } },
};
const db = {
  KEYS: ['status', 'evidence', 'review', 'interviews', 'imported', 'linked'],
  data: { status: {}, evidence: {}, review: {}, interviews: [], imported: { o: [], p: [] }, linked: {} },
  load() {
    const d = LS.get('nrf50.db', null);
    if (d) for (const k of this.KEYS) if (d[k] !== undefined) this.data[k] = d[k];
    // 분리 저장하던 이전 버전의 검증 단계를 이어받는다
    if (!d) { const old = LS.get('nrf50.status', null); if (old) this.data.status = old; }
  },
  save(key) { LS.set('nrf50.db', this.data); remote.push(key); },
};
const remote = {
  on: !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY), state: 'off', last: null, timers: {}, pending: 0,
  url: q => `${CONFIG.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/nrf50_state${q}`,
  hdr: extra => ({ apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...extra }),
  // 서버 값을 받아 로컬을 덮어쓴다(나중에 쓴 쪽이 이긴다). 바뀐 것이 있으면 true
  async pull() {
    if (!this.on || this.pending) return false;
    try {
      const r = await fetch(this.url('?select=key,value'), { headers: this.hdr() }); if (!r.ok) throw new Error(r.status);
      let changed = false;
      for (const row of await r.json()) if (db.KEYS.includes(row.key) && JSON.stringify(db.data[row.key]) !== JSON.stringify(row.value)) { db.data[row.key] = row.value; changed = true; }
      if (changed) LS.set('nrf50.db', db.data);
      this.state = 'ok'; this.last = new Date(); return changed;
    } catch (e) { this.state = 'err'; return false; }
  },
  push(key) {
    if (!this.on) return;
    clearTimeout(this.timers[key]); this.pending++;
    this.timers[key] = setTimeout(async () => {
      try {
        const r = await fetch(this.url('?on_conflict=key'), { method: 'POST', headers: this.hdr({ Prefer: 'resolution=merge-duplicates' }), body: JSON.stringify({ key, value: db.data[key], updated_at: new Date().toISOString() }) });
        this.state = r.ok ? 'ok' : 'err'; if (r.ok) this.last = new Date();
      } catch (e) { this.state = 'err'; }
      this.pending = 0;
      const el = document.getElementById('storestat'); if (el) el.textContent = storeLabel();
    }, 700);
  },
};
const storeLabel = () => !remote.on ? '저장: 이 브라우저' : remote.state === 'err' ? '저장: 서버 연결 실패 · 이 브라우저에 보관' : `저장: 공유 서버${remote.last ? ` · ${remote.last.toTimeString().slice(0, 5)} 동기화` : ' · 연결 중'}`;
db.load();
