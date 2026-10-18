// RuneScape-style XP curve: level 1..99 (120 virtual not used here).
const TABLE = [0, 0];
{
  let pts = 0;
  for (let l = 1; l < 120; l++) {
    pts += Math.floor(l + 300 * Math.pow(2, l / 7));
    TABLE[l + 1] = Math.floor(pts / 4);
  }
}
export const MAX_LEVEL = 99;
export function xpForLevel(l) { return TABLE[Math.max(1, Math.min(l, 120))]; }
export function levelForXp(xp) {
  let l = 1;
  while (l < MAX_LEVEL && xp >= TABLE[l + 1]) l++;
  return l;
}
export function progressToNext(xp) {
  const l = levelForXp(xp);
  if (l >= MAX_LEVEL) return 1;
  const a = TABLE[l], b = TABLE[l + 1];
  return (xp - a) / (b - a);
}
// Character (combat) level uses a gentler curve so stat points flow quickly.
export function charXpForLevel(l) { return Math.floor(40 * (l - 1) * (l - 1) + 60 * (l - 1)); }
export function charLevelForXp(xp) { let l = 1; while (l < 150 && xp >= charXpForLevel(l + 1)) l++; return l; }
