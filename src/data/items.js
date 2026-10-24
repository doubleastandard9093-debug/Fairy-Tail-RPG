import { TIERS, QUALITIES } from './tiers.js';

// Every item: { id, name, icon, kind, stack, value, tier?, ...kind-specific }
// kind: resource | refined | weapon | armor | lacrima | key | consumable | quest
export const ITEMS = {};
const add = (it) => { ITEMS[it.id] = { stack: true, value: 1, ...it }; };

// ---- Gathered resources (T1-T3) ----
const RES = {
  ore: { skill: 'mining', names: ['Copper Ore', 'Iron Ore', 'Starsilver Ore', 'Adamantine Ore', 'Etherion Crystal'], icon: '🪨', refined: 'bar', refinedNames: ['Copper Bar', 'Iron Bar', 'Starsilver Bar', 'Adamantine Bar', 'Etherion Ingot'], refIcon: '🟫' },
  wood: { skill: 'woodcutting', names: ['Birch Log', 'Oak Log', 'Moonwillow Log', 'Galuna Ebony Log', 'Tenrou Heartwood'], icon: '🪵', refined: 'plank', refinedNames: ['Birch Plank', 'Oak Plank', 'Moonwillow Plank', 'Ebony Plank', 'Heartwood Plank'], refIcon: '🟧' },
  fibre: { skill: 'foraging', names: ['Cotton Tuft', 'Flax Bundle', 'Silkweed', 'Moonlight Lily', 'Starweave Thread'], icon: '🌾', refined: 'cloth', refinedNames: ['Cotton Cloth', 'Linen', 'Silkweave', 'Moondrop Satin', 'Starweave Cloth'], refIcon: '🧵' },
  hide: { skill: null, names: ['Scruffy Hide', 'Boar Hide', 'Gleaming Hide', 'Wyvern Hide', 'Dragon Scale'], icon: '🟤', refined: 'leather', refinedNames: ['Rough Leather', 'Sturdy Leather', 'Gleamleather', 'Wyvern Leather', 'Dragonscale Leather'], refIcon: '🟫' },
};
export const RESOURCE_TYPES = RES;
for (const [type, r] of Object.entries(RES)) {
  for (let t = 1; t <= 5; t++) {
    add({ id: `${type}_t${t}`, name: r.names[t - 1], icon: r.icon, kind: 'resource', resType: type, tier: t, value: 4 * t * t });
    add({ id: `${r.refined}_t${t}`, name: r.refinedNames[t - 1], icon: r.refIcon, kind: 'refined', resType: r.refined, tier: t, value: 12 * t * t });
  }
}

// ---- Gear (T1-T8). Weapon type decides weapon abilities; armor type decides the armor ability. ----
export const WEAPON_TYPES = {
  sword1h: { name: 'Sword', icon: '🗡️', stat: 'STR', range: 2.4, mat: 'bar' },
  sword2h: { name: 'Greatsword', icon: '⚔️', stat: 'STR', range: 2.9, mat: 'bar' },
  bow: { name: 'Bow', icon: '🏹', stat: 'DEX', range: 16, mat: 'plank' },
  staff: { name: 'Staff', icon: '🪄', stat: 'INT', range: 14, mat: 'plank' },
  knuckles: { name: 'Knuckles', icon: '🥊', stat: 'AGI', range: 2.0, mat: 'leather' },
};
export const ARMOR_TYPES = {
  cloth: { id: 'robe', name: 'Robe', icon: '🥻', mat: 'cloth', def: 2, mp: 30 },
  leather: { id: 'jacket', name: 'Jacket', icon: '🧥', mat: 'leather', def: 4, mp: 10 },
  plate: { id: 'plate', name: 'Plate', icon: '🛡️', mat: 'bar', def: 7, mp: 0 },
};
for (let t = 1; t <= 8; t++) {
  const tn = TIERS[t].name;
  for (const [w, d] of Object.entries(WEAPON_TYPES)) {
    for (const q of QUALITIES) add({ id: `${w}_t${t}${q.sfx}`, base: `${w}_t${t}`, q: q.q, name: `${q.pre}${tn} ${d.name}`, icon: d.icon, kind: 'weapon', weaponType: w, tier: t, stack: false, value: Math.round(40 * t * t * t * q.mult), power: +(TIERS[t].power * q.mult).toFixed(3) });
  }
  for (const [a, d] of Object.entries(ARMOR_TYPES)) {
    for (const q of QUALITIES) add({ id: `${d.id}_t${t}${q.sfx}`, base: `${d.id}_t${t}`, q: q.q, name: `${q.pre}${tn} ${d.name}`, icon: d.icon, kind: 'armor', armorType: a, tier: t, stack: false, value: Math.round(40 * t * t * t * q.mult), def: Math.round(d.def * TIERS[t].power * q.mult), mp: Math.round(d.mp * TIERS[t].power * q.mult) });
  }
}

// ---- Lacrima: the equipped crystal decides your magic school (you are what you wear). ----
add({ id: 'lac_flame', name: 'Fire Dragon Slayer Lacrima', icon: '🔥', kind: 'lacrima', school: 'flame', stack: false, value: 300 });
add({ id: 'lac_ice', name: 'Ice-Make Lacrima', icon: '❄️', kind: 'lacrima', school: 'ice', stack: false, value: 300 });
add({ id: 'lac_celestial', name: 'Celestial Spirit Keyring', icon: '✨', kind: 'lacrima', school: 'celestial', stack: false, value: 300 });
add({ id: 'lac_lightning', name: 'Lightning Dragon Lacrima (Laxus)', icon: '⚡', kind: 'lacrima', school: 'lightning', stack: false, value: 900 });
add({ id: 'lac_rune', name: 'Solid Script Pen (Levy)', icon: '📜', kind: 'lacrima', school: 'rune', stack: false, value: 900 });
add({ id: 'lac_requip', name: 'Requip Ring (Erza)', icon: '💍', kind: 'lacrima', school: 'requip', stack: false, value: 900 });

// Celestial keys: summon abilities need the matching key in your bag.
add({ id: 'key_ram', name: 'Gate Key: Taurus', icon: '🗝️', kind: 'key', stack: false, value: 150 });
add({ id: 'key_leo', name: 'Gate Key: Leo (Loke)', icon: '🦁', kind: 'key', stack: false, value: 400 });
add({ id: 'key_coral', name: 'Gate Key: Aquarius', icon: '🔑', kind: 'key', stack: false, value: 150 });

add({ id: 'lacrima_shard', name: 'Lacrima Shard', icon: '🔷', kind: 'refined', value: 120 });

// ---- Consumables ----
add({ id: 'tonic_hp', name: 'Fizzy Tonic', icon: '🧪', kind: 'consumable', heal: 60, value: 15 });
add({ id: 'tea_mp', name: 'Starmilk Tea', icon: '🍵', kind: 'consumable', mana: 50, value: 15 });
add({ id: 'stew', name: "Mira's Special Stew", icon: '🍲', kind: 'consumable', heal: 120, mana: 40, value: 30 });

// ---- Drops / quest items ----
add({ id: 'spore', name: 'Vulcan Fur Tuft', icon: '🦍', kind: 'resource', value: 3 });
add({ id: 'ancient_bark', name: 'Woodsea Heartbark', icon: '🪵', kind: 'resource', value: 22 });
add({ id: 'fortune_card', name: "Cana's Lost Card", icon: '🃏', kind: 'resource', value: 1 });
add({ id: 'wisp_ember', name: 'Eisenwald Emblem', icon: '💀', kind: 'resource', value: 18 });
add({ id: 'pudding', name: "Erza's Strawberry Cake", icon: '🍮', kind: 'quest', value: 0 });
add({ id: 'tyrant_core', name: 'Broken Lullaby Flute', icon: '💎', kind: 'quest', value: 500 });
add({ id: 'mayor_hat', name: "Plue's Spare Lollipop", icon: '🎩', kind: 'quest', stack: false, value: 0 });


// ---- Life-skill items (see data/skills.js + recipes.js) ----
const FISH = ['Magnolia Minnow', 'Scilliora Trout', 'Hargeon Mackerel', 'Galuna Moonfish', 'Tenrou Starfin'];
const MEALS = ['Grilled Minnow Skewer', 'Herb-Crusted Trout', 'Hargeon Seafood Stew', 'Moonfish Sashimi Platter', 'Fairy Feast'];
for (let t = 1; t <= 5; t++) {
  add({ id: `fish_t${t}`, name: FISH[t - 1], icon: '🐟', kind: 'resource', resType: 'fish', tier: t, value: 5 * t * t });
  add({ id: `meal_t${t}`, name: MEALS[t - 1], icon: ['🍢', '🐟', '🍲', '🍣', '🍱'][t - 1], kind: 'consumable', tier: t, skill: 'cooking', value: 14 * t * t, heal: 50 + 45 * t, buff: { name: 'Well Fed', dur: 300, dmgUp: 0.02 * t, regen: 0.6 * t } });
  if (t <= 3) add({ id: `cell_t${t}`, name: ['Dim Lacrima Cell', 'Bright Lacrima Cell', 'Radiant Lacrima Cell'][t - 1], icon: '🔋', kind: 'refined', tier: t, value: 30 * t * t });
}
add({ id: 'fish_snack', name: "Happy's Fish Snack", icon: '🍡', kind: 'food', value: 10, bond: 60, desc: 'Happy would do anything for one. Feed it to him (Skills → Exceed Bonding or talk to Happy).' });
add({ id: 'fish_feast', name: 'Grand Fish Platter', icon: '🐠', kind: 'food', value: 90, bond: 420, desc: 'A mountain of fish. Happy will love you forever.' });
add({ id: 'solvent', name: 'Lacrima Solvent', icon: '💧', kind: 'refined', value: 20 });
add({ id: 'parchment', name: 'Archive Parchment', icon: '📄', kind: 'refined', value: 12 });
add({ id: 'ink', name: 'Solid Script Ink', icon: '🖋️', kind: 'refined', value: 24 });
add({ id: 'stardust', name: 'Stardust', icon: '✨', kind: 'refined', value: 60 });
add({ id: 'rune_plate', name: 'Rune-Etched Plate', icon: '🔶', kind: 'refined', value: 220 });
add({ id: 'elixir_str', name: 'Dragon Force Elixir', icon: '🧪', kind: 'consumable', skill: 'alchemy', value: 60, buff: { name: 'Dragon Force', dur: 240, dmgUp: 0.12 } });
add({ id: 'elixir_iron', name: 'Iron Skin Draught', icon: '🫙', kind: 'consumable', skill: 'alchemy', value: 60, buff: { name: 'Iron Skin', dur: 240, dr: 0.12 } });
add({ id: 'elixir_ether', name: 'Ethernano Draught', icon: '🔵', kind: 'consumable', skill: 'alchemy', value: 70, mana: 80, buff: { name: 'Ethernano Flow', dur: 240, mpRegen: 5 } });
add({ id: 'brew_gather', name: "Gatherer's Brew", icon: '🍺', kind: 'consumable', skill: 'alchemy', value: 45, buff: { name: "Gatherer's Brew", dur: 600, gspeed: 0.15 } });
add({ id: 'sigil_power', name: 'Jutsu Shiki: Power Sigil', icon: '🟥', kind: 'consumable', skill: 'enchanting', value: 140, buff: { name: 'Power Rune', dur: 600, dmgUp: 0.15 } });
add({ id: 'sigil_ward', name: 'Jutsu Shiki: Ward Sigil', icon: '🟦', kind: 'consumable', skill: 'enchanting', value: 140, buff: { name: 'Ward Rune', dur: 600, dr: 0.15 } });
add({ id: 'sigil_spirit', name: 'Jutsu Shiki: Spirit Sigil', icon: '🟨', kind: 'consumable', skill: 'enchanting', value: 160, buff: { name: 'Spirit Rune', dur: 600, allyUp: 0.25, mpRegen: 3 } });
const TOMES = { smithing: 'Iron Dragon Smithing Notes', alchemy: "Porlyusica's Herbal", fishing: "Happy's Fishing Diary", celestial: 'Heartfilia Star Almanac', requip: "Titania's Armory Ledger", cooking: "Mira's Recipe Book", lacrima: 'Lacrima Theory Primer' };
for (const [k, n] of Object.entries(TOMES)) add({ id: `tome_${k}`, name: n, icon: '📘', kind: 'tome', skill: 'script', teach: k, teachXp: 650, value: 160 });
const RQ = [
  ['rq_heaven', "Heaven's Wheel Armor", 'plate', 4, 40, 0, { dmgUp: 0.08 }],
  ['rq_flame', 'Flame Empress Armor', 'leather', 4, 26, 30, { dmgUp: 0.05, dr: 0.05 }],
  ['rq_sea', 'Sea Empress Armor', 'cloth', 4, 16, 140, { mpRegen: 4 }],
  ['rq_blackwing', 'Black Wing Armor', 'leather', 5, 38, 40, { dmgUp: 0.12 }],
  ['rq_adamantine', 'Adamantine Armor', 'plate', 5, 78, 0, { dr: 0.12 }],
];
for (const [id, name, a, t, def, mp, fx] of RQ) add({ id, base: id, q: 3, name, icon: '💍', kind: 'armor', armorType: a, tier: t, stack: false, value: 600 * t * t, def, mp, fx, requip: true });

export function itemName(id) { return ITEMS[id] ? ITEMS[id].name : id; }
