// Hand-drawn, procedural stand-in for a guild mark: a stylised winged fairy with a curling tail.
// Drawn from scratch with canvas paths (no official artwork is used or copied).
import * as THREE from 'three';

export function drawGuildMark(x, cx, cy, s, color = '#e0303a', outline = null) {
  x.save(); x.translate(cx, cy); x.scale(s / 100, s / 100);
  const path = () => {
    x.beginPath();
    // head
    x.moveTo(-6, -40); x.bezierCurveTo(-2, -52, 14, -52, 16, -40); x.bezierCurveTo(18, -30, 8, -26, 4, -26);
    // wing sweeping back (upper)
    x.bezierCurveTo(22, -36, 46, -44, 52, -30); x.bezierCurveTo(40, -28, 30, -20, 22, -12);
    // lower wing
    x.bezierCurveTo(36, -12, 44, -2, 40, 6); x.bezierCurveTo(30, 0, 20, -2, 12, 0);
    // body into tail curl
    x.bezierCurveTo(16, 16, 10, 34, -6, 42); x.bezierCurveTo(-22, 50, -38, 40, -34, 26);
    x.bezierCurveTo(-31, 16, -18, 16, -16, 26); x.bezierCurveTo(-15, 32, -22, 34, -24, 28);
    x.bezierCurveTo(-20, 38, -4, 34, -2, 20); x.bezierCurveTo(0, 8, -8, -2, -12, -10);
    // front arm / back to head
    x.bezierCurveTo(-26, -6, -40, -14, -44, -26); x.bezierCurveTo(-30, -22, -18, -24, -10, -28);
    x.bezierCurveTo(-14, -32, -10, -38, -6, -40); x.closePath();
  };
  if (outline) { path(); x.lineWidth = 10; x.strokeStyle = outline; x.lineJoin = 'round'; x.stroke(); }
  path(); x.fillStyle = color; x.fill();
  x.restore();
}

const cache = new Map();
export function guildMarkTexture(color = '#e0303a', size = 128) {
  const k = color + size; if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  drawGuildMark(x, size / 2, size / 2, size * 0.9, color);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cache.set(k, t); return t;
}
export function guildMarkDataURL(color = '#e0303a', size = 256, outline = '#1a1020') {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  drawGuildMark(x, size / 2, size / 2, size * 0.86, color, outline); return c.toDataURL();
}
export const MARK_PLACES = ['right arm', 'left arm', 'right shoulder', 'left shoulder', 'chest', 'stomach', 'back', 'right hand', 'left hand', 'right thigh', 'left thigh'];
/** Who in the guild wears their mark there (shown as a hint while choosing). */
export const MARK_HINTS = { 'right shoulder': 'like Natsu', 'left shoulder': 'like Wendy and Gajeel', 'chest': 'like Gray', 'right hand': 'like Lucy', 'left arm': 'like Erza', 'left thigh': 'like Juvia and Mirajane', 'back': 'like Levy', 'stomach': 'like Cana' };
export const MARK_SIZES = { small: 0.12, medium: 0.17, large: 0.24 };
export const MARK_COLORS = ['#e0303a', '#ff7ab0', '#3a68d0', '#20a060', '#f0c030', '#1a1a1a', '#ffffff', '#9a50ff'];
