// Magic schools. 'starter' schools are offered at character creation;
// the others are sold on the market board as lacrima.
export const SCHOOLS = {
  flame: { name: 'Flame Slayer', icon: '🔥', color: '#ff6a20', starter: true, lacrima: 'lac_flame',
    blurb: 'Eat fire, punch problems. A drake-style brawler who sets everything (and everyone) alight.',
    abilities: ['fl_fist', 'fl_bellow', 'fl_wing', 'fl_feast'] },
  ice: { name: 'Ice-Make', icon: '❄️', color: '#7fd8ff', starter: true, lacrima: 'lac_ice',
    blurb: 'Shape ice into lances, shields and very large hammers. Clothing optional, apparently.',
    abilities: ['ic_lance', 'ic_shield', 'ic_floor', 'ic_hammer'] },
  celestial: { name: 'Celestial Summoning', icon: '✨', color: '#ffd76a', starter: true, lacrima: 'lac_celestial',
    blurb: 'Open spirit gates with star keys. Your spirits fight beside you and complain about it.',
    abilities: ['ce_ram', 'ce_coral', 'ce_star', 'ce_bond'], startItems: ['key_ram', 'key_coral'] },
  lightning: { name: 'Lightning', icon: '⚡', color: '#fff27a', starter: false, lacrima: 'lac_lightning',
    blurb: 'Fast, loud and slightly unsafe.', abilities: ['li_spark', 'li_lance', 'li_step', 'li_cage'] },
  rune: { name: 'Script Runes', icon: '📜', color: '#c080ff', starter: false, lacrima: 'lac_rune',
    blurb: 'Write rules into the ground. Monsters that break them explode.', abilities: ['ru_bolt', 'ru_blast', 'ru_bind', 'ru_script'] },
  requip: { name: 'Requip', icon: '💍', color: '#ffe8c0', starter: false, lacrima: 'lac_requip',
    blurb: 'Swap between your main and reserve weapon mid-combo.', abilities: ['rq_swap', 'rq_lances', 'rq_armor', 'rq_storm'] },
};
// Class rank (AQ3D-style): earned by using a school/weapon. Rank n needs RANK_XP[n] uses-xp.
export const RANK_XP = [0, 0, 40, 120, 260, 480, 800, 1250, 1850, 2600, 3600];
export function rankForXp(xp) { let r = 1; while (r < 10 && xp >= RANK_XP[r + 1]) r++; return r; }
