// 확산 지도 팝업용 Remotion 컴포지션. 빌드 없이 쓰기 위해 ESM CDN에서 불러오고 JSX 대신 createElement를 쓴다.
import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import { Player } from 'https://esm.sh/@remotion/player@4.0.200?deps=react@18.3.1,react-dom@18.3.1';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'https://esm.sh/remotion@4.0.200?deps=react@18.3.1,react-dom@18.3.1';

const h = React.createElement;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const W = 420, H = 300, DUR = 240, FPS = 30;

const Card = ({ d }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const pop = (at, cfg = {}) => spring({ frame: f - at, fps, config: { damping: 12, ...cfg } });
  const fade = (a, b) => interpolate(f, [a, b], [0, 1], clamp);
  const out = interpolate(f, [DUR - 14, DUR - 2], [1, 0], clamp);
  const title = pop(4, { damping: 14 });
  const lineW = interpolate(f, [84, 138], [0, 100], clamp);

  const nums = [[d.y0, '년', '첫 지원', false], [d.span, '년', '확산 기간', true], [d.invest, '억', '실질 투입', true], [d.roi, '', '성과 지수', true]];
  return h(AbsoluteFill, { style: { background: `linear-gradient(135deg, ${d.color}, #27365A)`, color: '#fff', fontFamily: 'Pretendard, "Malgun Gothic", sans-serif', opacity: out, overflow: 'hidden' } },
    // 떠다니는 유기적 도형
    h('div', { style: { position: 'absolute', width: 190, height: 170, right: -50 + Math.sin(f / 24) * 12, top: -50 + Math.cos(f / 30) * 10, borderRadius: '42% 58% 55% 45%/55% 44% 56% 45%', background: '#fff', opacity: .14, transform: `rotate(${f / 3}deg)` } }),
    h('div', { style: { position: 'absolute', width: 90, height: 84, left: -24, bottom: -30 + Math.sin(f / 18) * 8, borderRadius: '58% 42% 47% 53%/46% 55% 45% 54%', background: '#fff', opacity: .1 } }),

    h('div', { style: { position: 'absolute', left: 22, top: 18, right: 22 } },
      h('div', { style: { fontSize: 10, letterSpacing: 1, opacity: fade(0, 10) * .85 } }, `대한민국 연구 50년 · ${d.id} · ${d.region}`),
      h('div', { style: { fontSize: 21, fontWeight: 700, lineHeight: 1.25, marginTop: 6, opacity: title, transform: `translateY(${(1 - title) * 26}px)` } }, d.title),
      h('div', { style: { fontSize: 12, marginTop: 6, opacity: fade(18, 34) * .92, transform: `translateX(${(1 - fade(18, 34)) * -14}px)` } }, d.feel)),

    // 숫자 카운트업
    h('div', { style: { position: 'absolute', left: 16, right: 16, top: 118, display: 'flex', gap: 8 } },
      nums.map(([v, u, l, count], i) => {
        const s = pop(36 + i * 7), val = count ? interpolate(f, [40 + i * 7, 84 + i * 7], [0, v], clamp) : v;
        return h('div', { key: l, style: { flex: 1, background: 'rgba(255,255,255,.96)', color: '#27365A', borderRadius: 12, padding: '8px 4px', textAlign: 'center', transform: `scale(${s})`, boxShadow: '0 6px 14px rgba(0,0,0,.18)' } },
          h('div', { style: { fontSize: 19, fontWeight: 700 } }, Number.isInteger(v) ? Math.round(val) : val.toFixed(1), h('span', { style: { fontSize: 10, fontWeight: 500, color: '#7A869C', marginLeft: 2 } }, u)),
          h('div', { style: { fontSize: 9.5, color: '#7A869C' } }, l));
      })),

    // 영향경로: 선이 자라며 단계가 차례로 켜진다
    h('div', { style: { position: 'absolute', left: 34, right: 34, top: 196, height: 46 } },
      h('div', { style: { position: 'absolute', left: 0, right: 0, top: 9, height: 3, background: 'rgba(255,255,255,.28)', borderRadius: 2 } }),
      h('div', { style: { position: 'absolute', left: 0, width: `${lineW}%`, top: 9, height: 3, background: '#fff', borderRadius: 2 } }),
      d.stages.map((s, i) => {
        const p = pop(84 + i * 18, { damping: 9 });
        return h('div', { key: i, style: { position: 'absolute', left: `${i * 100 / 3}%`, top: 0, width: 0 } },
          h('div', { style: { width: 20, height: 20, marginLeft: -10, borderRadius: '50%', background: '#fff', color: d.color, fontSize: 11, fontWeight: 700, lineHeight: '20px', textAlign: 'center', transform: `scale(${p})` } }, i + 1),
          h('div', { style: { width: 90, marginLeft: -45, textAlign: 'center', fontSize: 9.5, marginTop: 4, opacity: p } }, h('b', null, s.year), ' ', s.label));
      })),

    // 기여 구성 막대와 등급 배지
    h('div', { style: { position: 'absolute', left: 22, right: 22, bottom: 16, display: 'flex', alignItems: 'center', gap: 10 } },
      h('div', { style: { flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.22)', display: 'flex', overflow: 'hidden' } },
        d.mix.map((v, i) => h('div', { key: i, style: { width: `${v * interpolate(f, [150 + i * 5, 178 + i * 5], [0, 1], clamp)}%`, background: ['#fff', '#FFD0DF', '#FFE2B5', '#B7F0DF'][i] } }))),
      h('div', { style: { fontSize: 10.5, fontWeight: 700, background: '#fff', color: '#27365A', padding: '4px 10px', borderRadius: 999, transform: `scale(${pop(176, { damping: 8 })})`, whiteSpace: 'nowrap' } }, `${d.ctype} · ${d.grade}`)));
};

export function mount(el, d) {
  const root = createRoot(el);
  root.render(h(Player, { component: Card, inputProps: { d }, durationInFrames: DUR, fps: FPS, compositionWidth: W, compositionHeight: H, style: { width: '100%', display: 'block' }, autoPlay: true, loop: true, controls: false, clickToPlay: false }));
  return () => root.unmount();
}
