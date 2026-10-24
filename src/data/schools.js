// Magic schools. 'starter' schools are offered at character creation;
// the others are sold on the market board as lacrima.
export const SCHOOLS = {
  flame: { name: 'Fire Dragon Slayer', icon: '🔥', color: '#ff6a20', starter: true, lacrima: 'lac_flame',
    blurb: "Natsu's lost magic. Eat fire, punch problems, apologise for the property damage later.",
    abilities: ['fl_fist', 'fl_bellow', 'fl_wing', 'fl_feast'], advanced: ['fl_talon', 'fl_lotus'] },
  ice: { name: 'Ice-Make', icon: '❄️', color: '#7fd8ff', starter: true, lacrima: 'lac_ice',
    blurb: "Gray's maker magic. Shape ice into lances, shields and hammers. Clothing optional, apparently.",
    abilities: ['ic_lance', 'ic_shield', 'ic_floor', 'ic_hammer'], advanced: ['ic_geyser', 'ic_cannon'] },
  celestial: { name: 'Celestial Spirit', icon: '✨', color: '#ffd76a', starter: true, lacrima: 'lac_celestial',
    blurb: "Lucy's holder magic. Open Gates with your keys: Taurus, Aquarius and Loke fight beside you (and complain).",
    abilities: ['ce_ram', 'ce_coral', 'ce_star', 'ce_bond'], advanced: ['ce_sagi', 'ce_urano'], startItems: ['key_ram', 'key_coral', 'key_leo'] },
  lightning: { name: 'Lightning Dragon (Laxus)', icon: '⚡', color: '#fff27a', starter: false, lacrima: 'lac_lightning',
    blurb: "Laxus's lightning. Fast, loud and extremely S-Class.", abilities: ['li_spark', 'li_lance', 'li_step', 'li_cage'], advanced: ['li_jaw', 'li_halberd'] },
  rune: { name: 'Solid Script / Runes', icon: '📜', color: '#c080ff', starter: false, lacrima: 'lac_rune',
    blurb: "Levy's and Freed's letters. Write words that become real, and runes that monsters regret crossing.", abilities: ['ru_bolt', 'ru_blast', 'ru_bind', 'ru_script'], advanced: ['ru_wall', 'ru_iron'] },
  requip: { name: 'Requip', icon: '💍', color: '#ffe8c0', starter: false, lacrima: 'lac_requip',
    blurb: "Erza's magic. Swap weapons and armor mid-combo, mid-sentence, mid-anything.", abilities: ['rq_swap', 'rq_lances', 'rq_armor', 'rq_storm'], advanced: ['rq_flight', 'rq_purg'] },
};
// Class rank (AQ3D-style): earned by using a school/weapon. Rank n needs RANK_XP[n] uses-xp.
export const RANK_XP = [0, 0, 40, 120, 260, 480, 800, 1250, 1850, 2600, 3600];
export function rankForXp(xp) { let r = 1; while (r < 10 && xp >= RANK_XP[r + 1]) r++; return r; }
