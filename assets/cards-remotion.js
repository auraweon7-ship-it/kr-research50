// 9:16 카드 뉴스용 Remotion 컴포지션. 카드 한 장이 하나의 Player이며, 빌드 없이 쓰기 위해 ESM CDN과 createElement를 쓴다.
import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import { Player } from 'https://esm.sh/@remotion/player@4.0.200?deps=react@18.3.1,react-dom@18.3.1';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'https://esm.sh/remotion@4.0.200?deps=react@18.3.1,react-dom@18.3.1';

const h = React.createElement;
const W = 1080, H = 1920, FPS = 30, DUR = 180;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const INK = '#27365A', BLOB1 = '58% 42% 47% 53%/46% 55% 45% 54%', BLOB2 = '42% 58% 55% 45%/55% 44% 56% 45%';
const txt = (extra = {}) => ({ wordBreak: 'keep-all', overflowWrap: 'anywhere', ...extra });

// 장면에서 공통으로 쓰는 시간 함수
const useAnim = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return {
    f,
    pop: (at, damping = 12) => spring({ frame: f - at, fps, config: { damping } }),
    fade: (a, b) => interpolate(f, [a, b], [0, 1], clamp),
    rise: (at, d = 60) => { const s = spring({ frame: f - at, fps, config: { damping: 15 } }); return { opacity: s, transform: `translateY(${(1 - s) * d}px)` }; },
    count: (v, a, b, from = 0) => interpolate(f, [a, b], [from, v], clamp),
  };
};
const Kicker = ({ a, children }) => h('div', { style: { fontSize: 40, fontWeight: 700, letterSpacing: 2, opacity: a.fade(4, 18) * .9, display: 'flex', alignItems: 'center', gap: 18 } },
  h('span', { style: { width: interpolate(a.f, [4, 26], [0, 70], clamp), height: 8, borderRadius: 4, background: '#fff' } }), children);

const Cover = ({ c, a }) => h(React.Fragment, null,
  h('div', { style: { position: 'absolute', right: -150, bottom: 250, width: 640, height: 600, borderRadius: BLOB2, border: '34px solid rgba(255,255,255,.26)', transform: `rotate(${a.f / 2.4}deg) scale(${a.pop(10, 14)})` } }),
  h('div', { style: { position: 'absolute', left: 80, right: 80, top: 430 } },
    h(Kicker, { a }, c.kicker),
    h('div', { style: txt({ fontSize: c.title.length > 16 ? 96 : 116, fontWeight: 800, lineHeight: 1.18, marginTop: 44, ...a.rise(12, 90) }) }, c.title),
    h('div', { style: txt({ fontSize: 48, lineHeight: 1.45, marginTop: 50, opacity: a.fade(36, 54) * .95 }) }, c.sub)),
  h('div', { style: { position: 'absolute', left: 80, right: 80, bottom: 300, display: 'flex', flexWrap: 'wrap', gap: 18 } },
    c.tags.map((t, i) => h('span', { key: i, style: { fontSize: 34, fontWeight: 700, padding: '16px 32px', borderRadius: 999, background: '#fff', color: INK, transform: `scale(${a.pop(58 + i * 8, 10)})` } }, t))));

const Big = ({ c, a }) => h('div', { style: { position: 'absolute', left: 80, right: 80, top: 400 } },
  h(Kicker, { a }, c.kicker),
  h('div', { style: { fontSize: 330, fontWeight: 800, lineHeight: 1, marginTop: 70, letterSpacing: -8, transform: `scale(${.7 + .3 * a.pop(10, 14)})`, transformOrigin: 'left center', opacity: a.fade(8, 20) } },
    Math.round(a.count(c.big, 12, 62, c.big - 48)), h('span', { style: { fontSize: 90, fontWeight: 600, marginLeft: 12, letterSpacing: 0 } }, c.unit)),
  h('div', { style: { height: 10, width: interpolate(a.f, [50, 84], [0, 920], clamp), background: '#fff', borderRadius: 5, margin: '50px 0' } }),
  h('div', { style: txt({ fontSize: 68, fontWeight: 800, lineHeight: 1.3, ...a.rise(64) }) }, c.title),
  h('div', { style: txt({ fontSize: 44, lineHeight: 1.5, marginTop: 36, opacity: a.fade(84, 100) * .95 }) }, c.sub),
  h('div', { style: txt({ fontSize: 34, lineHeight: 1.5, marginTop: 70, padding: '28px 36px', borderRadius: 30, background: 'rgba(255,255,255,.16)', ...a.rise(100, 40) }) }, c.note));

const Steps = ({ c, a }) => {
  const n = c.steps.length, gap = Math.min(270, 1080 / n), top = 620, lineH = interpolate(a.f, [24, 24 + n * 20], [0, gap * (n - 1)], clamp);
  return h(React.Fragment, null,
    h('div', { style: { position: 'absolute', left: 80, right: 80, top: 300 } }, h(Kicker, { a }, c.kicker),
      h('div', { style: txt({ fontSize: 80, fontWeight: 800, lineHeight: 1.25, marginTop: 36, ...a.rise(8) }) }, c.title)),
    h('div', { style: { position: 'absolute', left: 137, top, width: 8, height: gap * (n - 1), background: 'rgba(255,255,255,.25)', borderRadius: 4 } }),
    h('div', { style: { position: 'absolute', left: 137, top, width: 8, height: lineH, background: '#fff', borderRadius: 4 } }),
    c.steps.map((s, i) => {
      const p = a.pop(24 + i * 20, 9);
      return h('div', { key: i, style: { position: 'absolute', left: 80, right: 70, top: top + i * gap - 60, display: 'flex', gap: 44, alignItems: 'flex-start' } },
        h('div', { style: { flex: 'none', width: 122, height: 114, borderRadius: i % 2 ? BLOB2 : BLOB1, background: '#fff', color: c.color, fontSize: 54, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, boxShadow: '0 14px 30px rgba(0,0,0,.2)' } }, i + 1),
        h('div', { style: { opacity: p, transform: `translateX(${(1 - p) * 50}px)` } },
          h('div', { style: { fontSize: 40, fontWeight: 700, opacity: .9 } }, s.year, s.mark ? h('span', { style: { marginLeft: 18, fontSize: 30, padding: '6px 20px', borderRadius: 999, background: '#fff', color: '#EC5C8D' } }, '전환점') : null),
          h('div', { style: txt({ fontSize: 56, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }) }, s.label),
          h('div', { style: txt({ fontSize: 34, marginTop: 8, opacity: .92 }) }, s.desc)));
    }));
};

const Nums = ({ c, a }) => h('div', { style: { position: 'absolute', left: 70, right: 70, top: 300 } },
  h(Kicker, { a }, c.kicker),
  h('div', { style: txt({ fontSize: 80, fontWeight: 800, lineHeight: 1.25, marginTop: 36, ...a.rise(8) }) }, c.title),
  h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginTop: 70 } },
    c.nums.map((x, i) => h('div', { key: i, style: { background: '#fff', color: INK, borderRadius: 44, padding: '46px 30px', textAlign: 'center', transform: `scale(${a.pop(26 + i * 9, 11)})`, boxShadow: '0 18px 40px rgba(0,0,0,.2)' } },
      h('div', { style: { fontSize: 124, fontWeight: 800, letterSpacing: -3, lineHeight: 1.1 } }, Math.round(a.count(x.v, 30 + i * 9, 80 + i * 9)).toLocaleString(), h('span', { style: { fontSize: 46, fontWeight: 600, color: '#7A869C', marginLeft: 8, letterSpacing: 0 } }, x.u)),
      h('div', { style: { fontSize: 36, color: '#7A869C', marginTop: 6 } }, x.l)))),
  c.bar ? h('div', { style: { marginTop: 70, opacity: a.fade(84, 96) } },
    h('div', { style: { fontSize: 36, fontWeight: 700, marginBottom: 22 } }, c.barTitle),
    h('div', { style: { display: 'flex', height: 56, borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,.2)' } },
      c.bar.map((v, i) => h('div', { key: i, style: { width: `${v * interpolate(a.f, [90 + i * 8, 124 + i * 8], [0, 1], clamp)}%`, background: ['#fff', '#FFD0DF', '#FFE2B5', '#B7F0DF'][i] } }))),
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px 30px', marginTop: 22, fontSize: 30 } },
      c.barLabels.map((l, i) => h('span', { key: i, style: { display: 'flex', alignItems: 'center', gap: 10 } }, h('i', { style: { width: 24, height: 24, borderRadius: 7, background: ['#fff', '#FFD0DF', '#FFE2B5', '#B7F0DF'][i] } }), `${l} ${c.bar[i]}%`))))
    : h('div', { style: txt({ fontSize: 40, lineHeight: 1.5, marginTop: 70, padding: '32px 38px', borderRadius: 32, background: 'rgba(255,255,255,.16)', ...a.rise(90, 40) }) }, c.note));

const End = ({ c, a }) => h('div', { style: { position: 'absolute', left: 80, right: 80, top: 330 } },
  h(Kicker, { a }, c.kicker),
  h('div', { style: { fontSize: 260, fontWeight: 800, lineHeight: .7, marginTop: 90, opacity: a.fade(8, 20) * .35 } }, '“'),
  h('div', { style: txt({ fontSize: 82, fontWeight: 800, lineHeight: 1.32, marginTop: -30, ...a.rise(14, 80) }) }, c.quote),
  h('div', { style: { marginTop: 70 } },
    c.lines.map((l, i) => h('div', { key: i, style: txt({ fontSize: 40, lineHeight: 1.45, padding: '22px 0', borderTop: '2px solid rgba(255,255,255,.3)', ...a.rise(52 + i * 12, 40) }) }, l))),
  h('div', { style: txt({ display: 'inline-block', marginTop: 50, fontSize: 36, fontWeight: 700, padding: '20px 36px', borderRadius: 999, background: '#fff', color: INK, transform: `scale(${a.pop(100, 9)})`, transformOrigin: 'left center' }) }, c.badge));

const SCENES = { cover: Cover, big: Big, steps: Steps, nums: Nums, end: End };

const Card = ({ c }) => {
  const a = useAnim(), f = a.f, out = interpolate(f, [DUR - 12, DUR - 1], [1, 0], clamp);
  return h(AbsoluteFill, { style: { background: `linear-gradient(162deg, ${c.color} 0%, ${c.color} 22%, ${INK} 82%)`, color: '#fff', fontFamily: 'Pretendard, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif', overflow: 'hidden' } },
    h('div', { style: { position: 'absolute', width: 620, height: 560, right: -190 + Math.sin(f / 26) * 30, top: -170 + Math.cos(f / 32) * 24, borderRadius: BLOB2, background: '#fff', opacity: .13, transform: `rotate(${f / 4}deg)` } }),
    h('div', { style: { position: 'absolute', width: 330, height: 310, left: -110, bottom: 120 + Math.sin(f / 20) * 26, borderRadius: BLOB1, background: '#fff', opacity: .09, transform: `rotate(${-f / 5}deg)` } }),
    h('div', { style: { position: 'absolute', left: 80, right: 80, top: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: a.fade(0, 10) } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 700 } }, ['#EC5C8D', '#F6A53A', '#27B894'].map(x => h('i', { key: x, style: { width: 22, height: 22, borderRadius: 6, background: x, border: '3px solid #fff' } })), h('span', { style: { marginLeft: 8 } }, '대한민국 연구 50년')),
      h('div', { style: { display: 'flex', gap: 12 } }, [0, 1, 2, 3, 4].map(i => h('i', { key: i, style: { width: i === c.index ? 54 : 18, height: 18, borderRadius: 9, background: '#fff', opacity: i === c.index ? 1 : .4 } })))),
    h('div', { style: { opacity: out } }, h(SCENES[c.type], { c, a })),
    h('div', { style: { position: 'absolute', left: 80, right: 80, bottom: 76, display: 'flex', justifyContent: 'space-between', fontSize: 27, opacity: .8 } },
      h('span', null, '한국연구재단 | 한국외국어대학교'), h('span', null, `${c.ref} · 예시 데이터`)));
};

// el 안에 카드 수만큼 Player를 만든다. 반환값은 정리 함수
export function mount(el, cards) {
  el.replaceChildren();
  const roots = cards.map((c, i) => {
    const box = document.createElement('div'); box.className = 'ccard'; el.appendChild(box);
    const root = createRoot(box);
    root.render(h(Player, { component: Card, inputProps: { c: { ...c, index: i } }, durationInFrames: DUR, fps: FPS, compositionWidth: W, compositionHeight: H, style: { width: '100%', display: 'block' }, autoPlay: true, loop: true, controls: false, clickToPlay: true }));
    return root;
  });
  return () => roots.forEach(r => r.unmount());
}
