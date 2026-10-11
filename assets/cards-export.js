/* 카드 뉴스 내보내기: 카드 명세를 1080×1920 캔버스에 완성 상태로 그려 PNG로 만들고, 무압축 ZIP으로 묶는다.
   화면의 Remotion 컴포지션(cards-remotion.js)과 같은 배치를 따른다. */
const CW = 1080, CH = 1920, CINK = '#27365A', CGREY = '#7A869C', CF = 'Pretendard, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
const BARC = ['#fff', '#FFD0DF', '#FFE2B5', '#B7F0DF'];

const rr = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
// 띄어쓰기 단위로 줄을 나누고, 한 단어가 너무 길면 글자 단위로 자른다
const cwrap = (c, text, maxW) => {
  const out = []; let line = '';
  for (const word of String(text).split(' ')) {
    const t = line ? line + ' ' + word : word;
    if (c.measureText(t).width <= maxW) { line = t; continue; }
    if (line) out.push(line);
    let w = word;
    while (c.measureText(w).width > maxW) { let i = w.length; while (i > 1 && c.measureText(w.slice(0, i)).width > maxW) i--; out.push(w.slice(0, i)); w = w.slice(i); }
    line = w;
  }
  if (line) out.push(line);
  return out;
};
// 글 덩어리를 그리고 다음 요소가 올 y를 돌려준다
const ctext = (c, text, x, y, size, weight, maxW, lh = 1.3, alpha = 1) => {
  c.font = `${weight} ${size}px ${CF}`; c.globalAlpha = alpha;
  const L = cwrap(c, text, maxW); L.forEach((l, i) => c.fillText(l, x, y + i * size * lh + size * (lh - 1) / 2));
  c.globalAlpha = 1; return y + L.length * size * lh;
};
const cpill = (c, text, x, y, size, bg = '#fff', fg = CINK) => {
  c.font = `700 ${size}px ${CF}`; const w = c.measureText(text).width + size * 1.9, h = size * 2.15;
  c.fillStyle = bg; rr(c, x, y, w, h, h / 2); c.fill(); c.fillStyle = fg; c.fillText(text, x + size * .95, y + size * .56); c.fillStyle = '#fff'; return w;
};
const cnote = (c, text, x, y, w, size) => {
  c.font = `400 ${size}px ${CF}`; const L = cwrap(c, text, w - 76), h = L.length * size * 1.5 + 60;
  c.fillStyle = 'rgba(255,255,255,.16)'; rr(c, x, y, w, h, 32); c.fill(); c.fillStyle = '#fff'; ctext(c, text, x + 38, y + 30, size, 400, w - 76, 1.5); return y + h;
};

const CDRAW = {
  cover(c, s, kick) {
    c.strokeStyle = 'rgba(255,255,255,.26)'; c.lineWidth = 34; c.beginPath(); c.ellipse(910, 1340, 300, 280, .3, 0, 7); c.stroke();
    let y = kick(430) + 44;
    y = ctext(c, s.title, 80, y, s.title.length > 16 ? 96 : 116, 800, 920, 1.18) + 50;
    ctext(c, s.sub, 80, y, 48, 400, 920, 1.45, .95);
    let x = 80, ty = 1500;
    for (const t of s.tags) { c.font = `700 34px ${CF}`; const w = c.measureText(t).width + 65; if (x + w > 1000) { x = 80; ty += 92; } cpill(c, t, x, ty, 34); x += w + 18; }
  },
  big(c, s, kick) {
    let y = kick(400) + 70;
    c.font = `800 330px ${CF}`; const num = String(s.big); c.fillText(num, 72, y); const w = c.measureText(num).width;
    c.font = `600 90px ${CF}`; c.fillText(s.unit, 72 + w + 16, y + 210);
    y += 330 + 50; rr(c, 80, y, 920, 10, 5); c.fill(); y += 60;
    y = ctext(c, s.title, 80, y, 68, 800, 920, 1.3) + 36;
    y = ctext(c, s.sub, 80, y, 44, 400, 920, 1.5, .95) + 70;
    cnote(c, s.note, 80, y, 920, 34);
  },
  steps(c, s, kick) {
    const y0 = kick(300) + 36; ctext(c, s.title, 80, y0, 80, 800, 920, 1.25);
    const n = s.steps.length, gap = Math.min(270, 1080 / n), top = 620;
    rr(c, 137, top, 8, gap * (n - 1), 4); c.fill();
    s.steps.forEach((st, i) => {
      const cy = top + i * gap - 3;
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(141, cy, 61, 57, i % 2 ? -.3 : .3, 0, 7); c.fill();
      c.fillStyle = s.color; c.font = `800 54px ${CF}`; c.textAlign = 'center'; c.fillText(i + 1, 141, cy - 30); c.textAlign = 'left'; c.fillStyle = '#fff';
      c.font = `700 40px ${CF}`; c.globalAlpha = .9; c.fillText(st.year, 246, cy - 62); const yw = c.measureText(String(st.year)).width; c.globalAlpha = 1;
      if (st.mark) cpill(c, '전환점', 246 + yw + 18, cy - 66, 23, '#fff', '#EC5C8D');
      c.font = `800 56px ${CF}`; c.fillText(st.label, 246, cy - 12);
      ctext(c, st.desc, 246, cy + 56, 34, 400, 760, 1.3, .92);
    });
  },
  nums(c, s, kick) {
    let y = kick(300) + 36; y = ctext(c, s.title, 70, y, 80, 800, 940, 1.25) + 70;
    s.nums.forEach((x, i) => {
      const bx = 70 + (i % 2) * 485, by = y + Math.floor(i / 2) * 330, v = Number(x.v).toLocaleString();
      c.fillStyle = '#fff'; rr(c, bx, by, 455, 300, 44); c.fill();
      c.font = `800 124px ${CF}`; const vw = c.measureText(v).width; c.font = `600 46px ${CF}`; const uw = c.measureText(x.u).width, sx = bx + (455 - vw - uw - 10) / 2;
      c.fillStyle = CINK; c.font = `800 124px ${CF}`; c.fillText(v, sx, by + 44); c.fillStyle = CGREY; c.font = `600 46px ${CF}`; c.fillText(x.u, sx + vw + 10, by + 114);
      c.font = `400 36px ${CF}`; c.textAlign = 'center'; c.fillText(x.l, bx + 227, by + 206); c.textAlign = 'left';
    });
    c.fillStyle = '#fff'; y += 660 + 40;
    if (!s.bar) return void cnote(c, s.note, 70, y, 940, 40);
    c.font = `700 36px ${CF}`; c.fillText(s.barTitle, 70, y); y += 62;
    c.save(); rr(c, 70, y, 940, 56, 28); c.clip(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(70, y, 940, 56);
    let bx = 70; s.bar.forEach((v, i) => { c.fillStyle = BARC[i]; c.fillRect(bx, y, 940 * v / 100, 56); bx += 940 * v / 100; }); c.restore();
    y += 82; let lx = 70; c.font = `400 30px ${CF}`;
    s.barLabels.forEach((l, i) => { const t = `${l} ${s.bar[i]}%`, w = c.measureText(t).width + 64; if (lx + w > 1010) { lx = 70; y += 50; } c.fillStyle = BARC[i]; rr(c, lx, y + 4, 24, 24, 7); c.fill(); c.fillStyle = '#fff'; c.fillText(t, lx + 34, y); lx += w; });
  },
  end(c, s, kick) {
    let y = kick(330) + 50;
    c.font = `800 260px ${CF}`; c.globalAlpha = .35; c.fillText('“', 72, y); c.globalAlpha = 1; y += 160;
    y = ctext(c, s.quote, 80, y, 82, 800, 920, 1.32) + 70;
    for (const l of s.lines) { c.globalAlpha = .3; c.fillRect(80, y, 920, 2); c.globalAlpha = 1; y = ctext(c, l, 80, y + 22, 40, 400, 920, 1.45) + 22; }
    c.font = `700 36px ${CF}`; const fits = c.measureText(s.badge).width + 70 <= 920;
    if (fits) cpill(c, s.badge, 80, y + 50, 36); else cnote(c, s.badge, 80, y + 50, 920, 34);
  },
};

const drawCard = (s, idx) => {
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const c = cv.getContext('2d'); c.textBaseline = 'top';
  const g = c.createLinearGradient(0, 0, CW * .6, CH); g.addColorStop(0, s.color); g.addColorStop(.22, s.color); g.addColorStop(.82, CINK); g.addColorStop(1, CINK);
  c.fillStyle = g; c.fillRect(0, 0, CW, CH);
  c.fillStyle = '#fff'; c.globalAlpha = .13; c.beginPath(); c.ellipse(1000, 110, 310, 280, .5, 0, 7); c.fill();
  c.globalAlpha = .09; c.beginPath(); c.ellipse(55, 1650, 165, 155, -.4, 0, 7); c.fill(); c.globalAlpha = 1;
  ['#EC5C8D', '#F6A53A', '#27B894'].forEach((col, i) => { c.fillStyle = '#fff'; rr(c, 80 + i * 38, 84, 28, 28, 8); c.fill(); c.fillStyle = col; rr(c, 83 + i * 38, 87, 22, 22, 6); c.fill(); });
  c.fillStyle = '#fff'; c.font = `700 36px ${CF}`; c.fillText('대한민국 연구 50년', 208, 80);
  let dx = 1000; for (let i = 4; i >= 0; i--) { const w = i === idx ? 54 : 18; dx -= w; c.globalAlpha = i === idx ? 1 : .4; rr(c, dx, 89, w, 18, 9); c.fill(); dx -= 12; }
  c.font = `400 27px ${CF}`; c.globalAlpha = .8; c.fillText('한국연구재단 | 한국외국어대학교', 80, 1812); c.textAlign = 'right'; c.fillText(`${s.ref} · 예시 데이터`, 1000, 1812); c.textAlign = 'left'; c.globalAlpha = 1;
  const kick = y => { rr(c, 80, y + 16, 70, 8, 4); c.fill(); c.font = `700 40px ${CF}`; c.globalAlpha = .9; c.fillText(s.kicker, 168, y); c.globalAlpha = 1; return y + 48; };
  CDRAW[s.type](c, s, kick);
  return cv;
};
// jpg=true면 용량이 작은 JPEG(품질 0.92)로 만든다
const cardImage = async (s, idx, jpg) => new Uint8Array(await (await new Promise(res => drawCard(s, idx).toBlob(res, jpg ? 'image/jpeg' : 'image/png', .92))).arrayBuffer());

/* --- 무압축(STORE) ZIP 작성기 --- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = ~0; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return ~c >>> 0; };
// files: [{ name, data: Uint8Array }]. 파일명은 UTF-8 플래그(0x0800)로 기록한다
const zipStore = files => {
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data), n = f.data.length, h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    parts.push(h.buffer, nm, f.data); cd.push(c.buffer, nm); off += 30 + nm.length + n;
  }
  const size = cd.reduce((a, b) => a + b.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cd, e.buffer], { type: 'application/zip' });
};
