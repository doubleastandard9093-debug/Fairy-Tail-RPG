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

// ---------------- Life-skill recipes (data/skills.js) ----------------
// Each chain deliberately consumes other skills' outputs, so the skills feed each other:
// fish+fibre -> meals (Cooking) · fibre+fish -> solvent/potions (Alchemy) · bars+solvent -> cells (Lacrima)
// planks -> parchment, fibre+cell -> ink (Script) · cloth+ink+cell -> sigils (Enchanting)
// bar+ink+stardust -> gate keys (Celestial) · plate+rune plate+cell -> Requip armor.
const L = (r) => { r.group ||= 'Recipes'; RECIPES.push(r); };
for (let t = 1; t <= 5; t++) {
  L({ id: `cook_meal_${t}`, station: 'kitchen', skill: 'cooking', level: lv[t] || 1, xp: 30 * xpm[t], in: { [`fish_t${t}`]: 2, [`fibre_t${t}`]: 1 }, out: { [`meal_t${t}`]: 1 }, group: 'Meals' });
}
L({ id: 'cook_snack', station: 'kitchen', skill: 'cooking', level: 1, xp: 12, in: { fish_t1: 1 }, out: { fish_snack: 2 }, group: 'Exceed Treats' });
L({ id: 'cook_platter', station: 'kitchen', skill: 'cooking', level: 22, xp: 120, in: { fish_t3: 2, fish_t2: 2, solvent: 1 }, out: { fish_feast: 1 }, group: 'Exceed Treats' });
L({ id: 'cook_stew', station: 'kitchen', skill: 'cooking', level: 8, xp: 40, in: { fish_t2: 1, hide_t1: 1, fibre_t2: 1 }, out: { stew: 2 }, group: 'Meals' });

L({ id: 'alc_solvent', station: 'alchemy', skill: 'alchemy', level: 1, xp: 16, in: { fibre_t1: 1, fish_t1: 1 }, out: { solvent: 2 }, group: 'Bases' });
L({ id: 'alc_solvent2', station: 'alchemy', skill: 'alchemy', level: 15, xp: 48, in: { fibre_t3: 1, fish_t2: 1 }, out: { solvent: 5 }, group: 'Bases' });
L({ id: 'alc_tonic', station: 'alchemy', skill: 'alchemy', level: 1, xp: 14, in: { fibre_t1: 2 }, out: { tonic_hp: 2 }, group: 'Potions' });
L({ id: 'alc_tea', station: 'alchemy', skill: 'alchemy', level: 5, xp: 20, in: { fibre_t2: 1, fish_t1: 1 }, out: { tea_mp: 2 }, group: 'Potions' });
L({ id: 'alc_gather', station: 'alchemy', skill: 'alchemy', level: 8, xp: 34, in: { fibre_t2: 2, solvent: 1 }, out: { brew_gather: 1 }, group: 'Potions' });
L({ id: 'alc_str', station: 'alchemy', skill: 'alchemy', level: 12, xp: 55, in: { hide_t2: 1, fibre_t2: 1, solvent: 1 }, out: { elixir_str: 1 }, group: 'Elixirs' });
L({ id: 'alc_iron', station: 'alchemy', skill: 'alchemy', level: 14, xp: 55, in: { ore_t2: 1, fibre_t2: 1, solvent: 1 }, out: { elixir_iron: 1 }, group: 'Elixirs' });
L({ id: 'alc_ether', station: 'alchemy', skill: 'alchemy', level: 18, xp: 70, in: { fish_t3: 1, fibre_t3: 1, cell_t1: 1 }, out: { elixir_ether: 1 }, group: 'Elixirs' });

for (let t = 1; t <= 3; t++) L({ id: `lac_cell_${t}`, station: 'lacrima', skill: 'lacrima', level: [0, 1, 15, 30][t], xp: [0, 26, 70, 150][t], in: { [`bar_t${t}`]: 1, solvent: t, ...(t > 1 ? { [`cell_t${t - 1}`]: 1 } : {}) }, out: { [`cell_t${t}`]: 1 }, group: 'Cells' });
L({ id: 'lac_shard', station: 'lacrima', skill: 'lacrima', level: 35, xp: 260, in: { cell_t3: 2, bar_t3: 2, stardust: 1 }, out: { lacrima_shard: 1 }, group: 'Condense' });

L({ id: 'scr_parch', station: 'scriptdesk', skill: 'script', level: 1, xp: 14, in: { plank_t1: 1 }, out: { parchment: 3 }, group: 'Materials' });
L({ id: 'scr_ink', station: 'scriptdesk', skill: 'script', level: 4, xp: 24, in: { fibre_t1: 1, cell_t1: 1 }, out: { ink: 3 }, group: 'Materials' });
const TOME_LV = { fishing: 8, cooking: 10, alchemy: 14, smithing: 18, lacrima: 22, celestial: 26, requip: 32 };
for (const [k, l] of Object.entries(TOME_LV)) L({ id: `scr_tome_${k}`, station: 'scriptdesk', skill: 'script', level: l, xp: 40 + l * 3, in: { parchment: 4, ink: 2, ...(l >= 20 ? { cloth_t2: 1 } : {}) }, out: { [`tome_${k}`]: 1 }, group: 'Tomes' });

L({ id: 'enc_power', station: 'runecircle', skill: 'enchanting', level: 1, xp: 40, in: { cloth_t1: 1, ink: 1, cell_t1: 1 }, out: { sigil_power: 1 }, group: 'Sigils' });
L({ id: 'enc_ward', station: 'runecircle', skill: 'enchanting', level: 6, xp: 50, in: { leather_t1: 1, ink: 1, cell_t1: 1 }, out: { sigil_ward: 1 }, group: 'Sigils' });
L({ id: 'enc_spirit', station: 'runecircle', skill: 'enchanting', level: 16, xp: 90, in: { cloth_t2: 1, ink: 2, stardust: 1 }, out: { sigil_spirit: 1 }, group: 'Sigils' });
L({ id: 'enc_plate', station: 'runecircle', skill: 'enchanting', level: 20, xp: 140, in: { bar_t3: 2, ink: 3, cell_t2: 1 }, out: { rune_plate: 1 }, group: 'Rune Plates' });

L({ id: 'cel_dust', station: 'starcircle', skill: 'celestial', level: 1, xp: 30, in: { fibre_t2: 2, solvent: 1 }, out: { stardust: 1 }, group: 'Stardust' });
L({ id: 'cel_ram', station: 'starcircle', skill: 'celestial', level: 6, xp: 90, in: { bar_t2: 2, ink: 1, stardust: 2 }, out: { key_ram: 1 }, group: 'Gate Keys' });
L({ id: 'cel_coral', station: 'starcircle', skill: 'celestial', level: 12, xp: 120, in: { bar_t2: 2, fish_t3: 2, ink: 1, stardust: 2 }, out: { key_coral: 1 }, group: 'Gate Keys' });
L({ id: 'cel_leo', station: 'starcircle', skill: 'celestial', level: 28, xp: 320, in: { bar_t3: 3, cell_t2: 1, ink: 2, stardust: 4 }, out: { key_leo: 1 }, group: 'Gate Keys' });

L({ id: 'rq_heaven', station: 'requip', skill: 'requip', level: 10, xp: 300, in: { plate_t3: 1, rune_plate: 1, cell_t2: 1 }, out: { rq_heaven: 1 }, group: 'Requip Armor' });
L({ id: 'rq_flame', station: 'requip', skill: 'requip', level: 15, xp: 340, in: { jacket_t3: 1, rune_plate: 1, meal_t2: 2, cell_t2: 1 }, out: { rq_flame: 1 }, group: 'Requip Armor' });
L({ id: 'rq_sea', station: 'requip', skill: 'requip', level: 15, xp: 340, in: { robe_t3: 1, rune_plate: 1, elixir_ether: 2 }, out: { rq_sea: 1 }, group: 'Requip Armor' });
L({ id: 'rq_blackwing', station: 'requip', skill: 'requip', level: 30, xp: 700, in: { jacket_t4: 1, rune_plate: 2, cell_t3: 1, sigil_power: 1 }, out: { rq_blackwing: 1 }, group: 'Requip Armor' });
L({ id: 'rq_adamantine', station: 'requip', skill: 'requip', level: 38, xp: 900, in: { plate_t5: 1, rune_plate: 3, cell_t3: 2, sigil_ward: 1 }, out: { rq_adamantine: 1 }, group: 'Requip Armor' });
// Requip practice: re-fit any refined plate (trains Requip from level 1).
L({ id: 'rq_fit', station: 'requip', skill: 'requip', level: 1, xp: 60, in: { plate_t1: 1, cell_t1: 1 }, out: { bar_t1: 2 }, group: 'Practice Fittings' });
