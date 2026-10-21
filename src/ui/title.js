import { guildMarkDataURL } from '../world/mark.js';

export const DISCLAIMER = 'Fan-made concept demo, not affiliated with or endorsed by Hiro Mashima, Kodansha or the Fairy Tail rights holders.';

/** Title screen. Resolves 'new' or 'continue'. */
export function titleScreen(hasSave) {
  return new Promise((resolve) => {
    const root = document.createElement('div'); root.id = 'title';
    root.innerHTML = `<canvas class="sky"></canvas>
      <div class="tcard">
        <img class="mark" alt="" src="${guildMarkDataURL('#e0303a', 256)}">
        <h1>FAIRY TAIL <span>RPG</span></h1>
        <div class="sub">Fairy Tail RPG — fan-made pitch prototype</div>
        <div class="tag">Join the guild. Take the job. Break (only some of) the town.</div>
        <div class="btns">
          ${hasSave ? '<button class="btn gold" id="t-cont">Continue ▸</button>' : ''}
          <button class="btn ${hasSave ? '' : 'gold'}" id="t-new">${hasSave ? 'New recruit' : 'Join Fairy Tail ▸'}</button>
        </div>
        <div class="pillars"><span>Toram-style builds</span><span>Albion-style gear</span><span>RS3-style skills</span><span>AQ3D-style charm</span></div>
      </div>
      <div class="disc">${DISCLAIMER}</div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'); const x = cv.getContext('2d'); let alive = true;
    const P = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.6, v: Math.random() * 0.04 + 0.01, h: Math.random() < 0.3 ? 20 : 45 + Math.random() * 15 }));
    const t0 = performance.now();
    const draw = () => {
      if (!alive) return; requestAnimationFrame(draw);
      const w = cv.width = innerWidth * Math.min(2, devicePixelRatio), h = cv.height = innerHeight * Math.min(2, devicePixelRatio);
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#120a2e'); g.addColorStop(0.55, '#3a1640'); g.addColorStop(1, '#b0402a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const t = (performance.now() - t0) / 1000;
      // distant Magnolia skyline silhouette, cathedral spire in the middle
      x.fillStyle = '#1a0c1e';
      x.beginPath(); x.moveTo(0, h);
      for (let i = 0; i <= 40; i++) { const px = (i / 40) * w; const bh = (0.12 + 0.08 * Math.abs(Math.sin(i * 1.7)) + (i % 7 === 0 ? 0.08 : 0)) * h; x.lineTo(px, h - bh); x.lineTo(px + w / 80, h - bh); }
      x.lineTo(w, h); x.fill();
      x.beginPath(); x.moveTo(w * 0.47, h); x.lineTo(w * 0.47, h * 0.7); x.lineTo(w * 0.5, h * 0.52); x.lineTo(w * 0.53, h * 0.7); x.lineTo(w * 0.53, h); x.fill();
      for (const p of P) {
        p.y -= p.v / 60; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const px = (p.x + Math.sin(t * 0.6 + p.y * 9) * 0.01) * w, py = p.y * h;
        x.fillStyle = `hsla(${p.h},100%,${65 + 20 * Math.sin(t * 3 + p.x * 20)}%,0.85)`; x.beginPath(); x.arc(px, py, p.r * devicePixelRatio, 0, Math.PI * 2); x.fill();
      }
    };
    draw();
    const done = (v) => { alive = false; root.classList.add('out'); setTimeout(() => root.remove(), 350); resolve(v); };
    root.querySelector('#t-new').onclick = () => { if (hasSave && !confirm('Start a new recruit? Your current save will be replaced.')) return; done('new'); };
    const c = root.querySelector('#t-cont'); if (c) c.onclick = () => done('continue');
  });
}
