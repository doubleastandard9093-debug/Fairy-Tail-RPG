// Crafting recipes. station: forge (Smithing) or workbench (Crafting).
// in/out are { itemId: qty }. Add a recipe here and it appears at its station automatically.
export const RECIPES = [];
const add = (r) => RECIPES.push(r);
const lv = [0, 1, 10, 20, 30, 40], xpm = [0, 1, 2, 3.5, 5.5, 8];
for (let t = 1; t <= 5; t++) {
  // Refining (Albion-style): raw -> refined
  add({ id: `ref_bar_${t}`, station: 'forge', skill: 'smithing', level: lv[t], xp: 14 * xpm[t], in: { [`ore_t${t}`]: 2 }, out: { [`bar_t${t}`]: 1 }, group: 'Refine' });
  add({ id: `ref_plank_${t}`, station: 'workbench', skill: 'crafting', level: lv[t], xp: 12 * xpm[t], in: { [`wood_t${t}`]: 2 }, out: { [`plank_t${t}`]: 1 }, group: 'Refine' });
  add({ id: `ref_cloth_${t}`, station: 'workbench', skill: 'crafting', level: lv[t], xp: 12 * xpm[t], in: { [`fibre_t${t}`]: 2 }, out: { [`cloth_t${t}`]: 1 }, group: 'Refine' });
  add({ id: `ref_leather_${t}`, station: 'workbench', skill: 'crafting', level: lv[t], xp: 12 * xpm[t], in: { [`hide_t${t}`]: 2 }, out: { [`leather_t${t}`]: 1 }, group: 'Refine' });
  // Gear
  add({ id: `sw1_${t}`, station: 'forge', skill: 'smithing', level: lv[t] + 1, xp: 40 * xpm[t], in: { [`bar_t${t}`]: 3 }, out: { [`sword1h_t${t}`]: 1 }, group: 'Weapons', gear: true });
  add({ id: `sw2_${t}`, station: 'forge', skill: 'smithing', level: lv[t] + 3, xp: 62 * xpm[t], in: { [`bar_t${t}`]: 5 }, out: { [`sword2h_t${t}`]: 1 }, group: 'Weapons', gear: true });
  add({ id: `plate_${t}`, station: 'forge', skill: 'smithing', level: lv[t] + 4, xp: 70 * xpm[t], in: { [`bar_t${t}`]: 6 }, out: { [`plate_t${t}`]: 1 }, group: 'Armor', gear: true });
  add({ id: `bow_${t}`, station: 'workbench', skill: 'crafting', level: lv[t] + 1, xp: 45 * xpm[t], in: { [`plank_t${t}`]: 4 }, out: { [`bow_t${t}`]: 1 }, group: 'Weapons', gear: true });
  add({ id: `staff_${t}`, station: 'workbench', skill: 'crafting', level: lv[t] + 1, xp: 45 * xpm[t], in: { [`plank_t${t}`]: 3, [`cloth_t${t}`]: 1 }, out: { [`staff_t${t}`]: 1 }, group: 'Weapons', gear: true });
  add({ id: `knuck_${t}`, station: 'workbench', skill: 'crafting', level: lv[t] + 2, xp: 45 * xpm[t], in: { [`leather_t${t}`]: 3 }, out: { [`knuckles_t${t}`]: 1 }, group: 'Weapons', gear: true });
  add({ id: `robe_${t}`, station: 'workbench', skill: 'crafting', level: lv[t] + 3, xp: 60 * xpm[t], in: { [`cloth_t${t}`]: 5 }, out: { [`robe_t${t}`]: 1 }, group: 'Armor', gear: true });
  add({ id: `jacket_${t}`, station: 'workbench', skill: 'crafting', level: lv[t] + 3, xp: 60 * xpm[t], in: { [`leather_t${t}`]: 5 }, out: { [`jacket_t${t}`]: 1 }, group: 'Armor', gear: true });
}

// Albion-style: T4+ gear also needs a lacrima shard bound in (an enhancement material from bosses and S-Class jobs)
for (const r of RECIPES) if (r.gear && /_t[45]$/.test(Object.keys(r.out)[0])) r.in.lacrima_shard = Object.keys(r.out)[0].endsWith('5') ? 2 : 1;
// Albion-style refining chain: T2+ refined materials also eat one refined piece of the tier below.
for (const r of RECIPES) { const o = Object.keys(r.out)[0]; const m = o.match(/^(bar|plank|cloth|leather)_t(\d)$/); if (r.group === 'Refine' && m && +m[2] > 1) r.in[`${m[1]}_t${+m[2] - 1}`] = 1; }
for (const r of RECIPES) { const t = Object.keys(r.out)[0].match(/_t(\d)$/); if (t) r.group = `T${t[1]} ${r.group}`; }
