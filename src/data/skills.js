// Skill registry (data-driven). Every life skill lives here: category, station, milestone perks,
// cross-skill synergies and skill sets. Add a skill here + recipes in recipes.js and it shows up
// in the Skills panel, the synergy web, crafting stations and the artisan point pool automatically.
import { levelForXp } from '../core/xp.js';

// cat: gathering | production | arcane | support
export const SKILL_DEFS = {
  mining: { name: 'Mining', icon: '⛏️', cat: 'gathering', desc: 'Break ore veins across Fiore. Feeds Smithing, Lacrima Engineering and Requip.' },
  woodcutting: { name: 'Woodcutting', icon: '🪓', cat: 'gathering', desc: 'Fell trees for logs. Feeds Crafting and Solid Script (parchment).' },
  foraging: { name: 'Foraging', icon: '🌿', cat: 'gathering', desc: 'Pick fibres and herbs. Feeds Crafting, Cooking, Alchemy and Celestial stardust.' },
  fishing: { name: 'Fishing', icon: '🎣', cat: 'gathering', desc: 'Fish the lakes and coasts of Fiore. Feeds Cooking, Alchemy and Exceed Bonding. Aye!' },
  smithing: { name: 'Smithing', icon: '🔨', cat: 'production', station: 'forge', desc: 'Refine bars and forge swords and plate at Gajeel\'s forge.' },
  crafting: { name: 'Crafting', icon: '🧶', cat: 'production', station: 'workbench', desc: 'Refine planks, cloth and leather; craft bows, staves, knuckles, robes, jackets.' },
  cooking: { name: 'Cooking', icon: '🍳', cat: 'production', station: 'kitchen', desc: 'Mirajane\'s kitchen. Meals heal and grant Well-Fed buffs; fish snacks train Exceed Bonding.' },
  alchemy: { name: 'Alchemy', icon: '⚗️', cat: 'production', station: 'alchemy', desc: 'Brew tonics, combat elixirs and Lacrima Solvent (the base of every arcane craft).' },
  lacrima: { name: 'Lacrima Engineering', icon: '🔮', cat: 'arcane', station: 'lacrima', desc: 'Tune lacrima cells from bars and solvent, and condense Lacrima Shards for T4–T5 gear.' },
  script: { name: 'Solid Script', icon: '📜', cat: 'arcane', station: 'scriptdesk', desc: 'Levy\'s letter magic: parchment, script ink and Tomes that teach other skills.' },
  enchanting: { name: 'Rune Enchanting', icon: '✴️', cat: 'arcane', station: 'runecircle', desc: 'Freed-style Jutsu Shiki runes: combat sigils and rune plates for Requip armor.' },
  celestial: { name: 'Celestial Contracts', icon: '🌟', cat: 'arcane', station: 'starcircle', desc: 'Grind stardust and forge Gate Keys. Higher levels empower every summon.' },
  requip: { name: 'Requip Forging', icon: '💍', cat: 'production', station: 'requip', desc: 'Bind plate, runes and lacrima into Requip armors in the style of Titania.' },
  exceed: { name: 'Exceed Bonding', icon: '🐱', cat: 'support', desc: 'Feed Happy fish and fish snacks. Your partner Exceed speeds gathering and cuts travel costs.' },
  bartering: { name: 'Bartering', icon: '💰', cat: 'support', desc: 'Haggle at the Market Board. Selling and buying train it; levels improve prices.' },
};
export const SKILL_CATS = { gathering: '🌲 Gathering', production: '🔨 Production', arcane: '🔮 Arcane', support: '🤝 Support' };
export const STATIONS = {
  forge: { name: 'Forge & Anvil', icon: '🔥', skill: 'smithing' }, workbench: { name: 'Workbench', icon: '🪚', skill: 'crafting' },
  kitchen: { name: 'Guild Kitchen', icon: '🍳', skill: 'cooking' }, alchemy: { name: 'Alchemy Table', icon: '⚗️', skill: 'alchemy' },
  lacrima: { name: 'Lacrima Bench', icon: '🔮', skill: 'lacrima' }, scriptdesk: { name: 'Script Desk', icon: '📜', skill: 'script' },
  runecircle: { name: 'Rune Circle', icon: '✴️', skill: 'enchanting' }, starcircle: { name: 'Star Circle', icon: '🌟', skill: 'celestial' },
  requip: { name: 'Requip Altar', icon: '💍', skill: 'requip' },
};
// fx keys (per skill): xp (+% XP), yield (+chance of a bonus gather/output), speed (-% gather time),
// save (+% material return), quality (gear quality roll), potency (+% consumable strength).
// Global fx keys: allyUp (summon power), sell (+% sell price), buy (-% buy price), travel (-% fare), move (+% move speed).
// Milestone perks: reached by levelling the skill itself.
export const PERKS = {
  mining: [{ lv: 15, fx: { yield: 0.05 }, desc: 'Prospector: +5% bonus ore' }, { lv: 35, fx: { speed: 0.1 }, desc: 'Gajeel\'s Grip: -10% mining time' }],
  woodcutting: [{ lv: 15, fx: { yield: 0.05 }, desc: 'Lumberjack: +5% bonus logs' }, { lv: 35, fx: { speed: 0.1 }, desc: 'Forest Stride: -10% chop time' }],
  foraging: [{ lv: 15, fx: { yield: 0.05 }, desc: 'Keen Eye: +5% bonus fibre' }, { lv: 35, fx: { speed: 0.1 }, desc: 'Nature\'s Hand: -10% picking time' }],
  fishing: [{ lv: 10, fx: { yield: 0.06 }, desc: 'Double Hook: +6% chance of two fish' }, { lv: 30, fx: { speed: 0.12 }, desc: 'Lake Whisperer: -12% fishing time' }],
  smithing: [{ lv: 20, fx: { save: 0.05 }, desc: 'Iron Dragon\'s Thrift: +5% bars saved' }, { lv: 40, fx: { quality: 0.1 }, desc: 'Master Smith: better gear quality' }],
  crafting: [{ lv: 20, fx: { save: 0.05 }, desc: 'Careful Cutter: +5% materials saved' }, { lv: 40, fx: { quality: 0.1 }, desc: 'Master Artisan: better gear quality' }],
  cooking: [{ lv: 10, fx: { potency: 0.1 }, desc: 'Seasoned: meals +10% stronger' }, { lv: 25, fx: { yield: 0.1 }, desc: 'Big Batch: 10% chance of an extra dish' }, { lv: 40, fx: { potency: 0.15 }, desc: 'Mira\'s Secret Recipe: meals +15% stronger' }],
  alchemy: [{ lv: 10, fx: { yield: 0.1 }, desc: 'Steady Hand: 10% chance of an extra potion' }, { lv: 25, fx: { potency: 0.15 }, desc: 'Concentrate: potions +15% stronger' }, { lv: 40, fx: { save: 0.1 }, desc: 'Porlyusica\'s Notes: +10% herbs saved' }],
  lacrima: [{ lv: 10, fx: { save: 0.06 }, desc: 'Precise Tuning: +6% materials saved' }, { lv: 25, fx: { yield: 0.1 }, desc: 'Resonance: 10% chance of an extra cell' }],
  script: [{ lv: 10, fx: { yield: 0.1 }, desc: 'Fast Quill: 10% chance of extra ink/parchment' }, { lv: 30, fx: { potency: 0.2 }, desc: 'Gale-Force Reading Glasses: Tomes teach 20% more' }],
  enchanting: [{ lv: 10, fx: { potency: 0.1 }, desc: 'Tight Runes: sigils +10% stronger' }, { lv: 30, fx: { potency: 0.15 }, desc: 'Jutsu Shiki Mastery: sigils +15% stronger, and last longer' }],
  celestial: [{ lv: 10, gfx: { allyUp: 0.05 }, desc: 'Star Bond: summons +5% power' }, { lv: 25, gfx: { allyUp: 0.1 }, desc: 'Open Gate Mastery: summons +10% power' }, { lv: 40, gfx: { allyUp: 0.15 }, desc: 'Star Dress: summons +15% power' }],
  requip: [{ lv: 20, fx: { quality: 0.1 }, desc: 'Fitted Plates: better Requip quality' }, { lv: 35, fx: { save: 0.1 }, desc: 'Pocket Dimension: +10% materials saved' }],
  exceed: [{ lv: 5, gfx: { move: 0.03 }, desc: 'Aye Sir!: +3% move speed' }, { lv: 15, gfx: { travel: 0.15 }, desc: 'Max Speed: train and ferry fares -15%' }, { lv: 30, gfx: { move: 0.04, travel: 0.15 }, desc: 'Aerial Carry: +4% move speed, fares -15% more' }],
  bartering: [{ lv: 1, gfx: { sell: 0.003, buy: 0.002 }, per: true, desc: 'Haggler: +0.3% sell / -0.2% buy prices per level' }, { lv: 30, gfx: { sell: 0.05 }, desc: 'Market Darling: +5% sell prices' }],
};
// Cross-skill synergies: levelling `from` to `lv` buffs `to` (a skill id or a category).
export const SYNERGIES = [
  { from: 'fishing', lv: 10, to: 'cooking', fx: { xp: 0.1 }, desc: 'Fresh Catch: +10% Cooking XP' },
  { from: 'fishing', lv: 25, to: 'exceed', fx: { xp: 0.15 }, desc: 'Happy\'s Favourite: +15% Exceed XP' },
  { from: 'foraging', lv: 15, to: 'alchemy', fx: { save: 0.08 }, desc: 'Herb Lore: +8% Alchemy materials saved' },
  { from: 'foraging', lv: 30, to: 'cooking', fx: { potency: 0.1 }, desc: 'Wild Spices: meals +10% stronger' },
  { from: 'mining', lv: 20, to: 'lacrima', fx: { save: 0.08 }, desc: 'Vein Sense: +8% Lacrima materials saved' },
  { from: 'woodcutting', lv: 20, to: 'script', fx: { xp: 0.1 }, desc: 'Fine Grain: +10% Solid Script XP' },
  { from: 'smithing', lv: 30, to: 'requip', fx: { xp: 0.15 }, desc: 'Armorsmith: +15% Requip XP' },
  { from: 'crafting', lv: 20, to: 'script', fx: { save: 0.1 }, desc: 'Bookbinder: +10% Script materials saved' },
  { from: 'cooking', lv: 20, to: 'exceed', fx: { xp: 0.2 }, desc: 'Fish Chef: +20% Exceed XP' },
  { from: 'alchemy', lv: 20, to: 'lacrima', fx: { xp: 0.1 }, desc: 'Pure Solvent: +10% Lacrima XP' },
  { from: 'alchemy', lv: 30, to: 'cooking', fx: { potency: 0.05 }, desc: 'Infused Broth: meals +5% stronger' },
  { from: 'lacrima', lv: 15, to: 'enchanting', fx: { potency: 0.15 }, desc: 'Charged Runes: sigils +15% stronger' },
  { from: 'lacrima', lv: 30, to: 'celestial', fx: { save: 0.1 }, desc: 'Gate Resonance: +10% Celestial materials saved' },
  { from: 'script', lv: 15, to: 'enchanting', fx: { xp: 0.15 }, desc: 'Letter Runes: +15% Enchanting XP' },
  { from: 'script', lv: 25, to: 'celestial', fx: { xp: 0.15 }, desc: 'Star Charts: +15% Celestial XP' },
  { from: 'enchanting', lv: 25, to: 'requip', fx: { quality: 0.15 }, desc: 'Runed Plates: better Requip quality' },
  { from: 'enchanting', lv: 35, to: 'smithing', fx: { quality: 0.05 }, desc: 'Etched Steel: better Smithing quality' },
  { from: 'requip', lv: 20, to: 'smithing', fx: { save: 0.05 }, desc: 'Titania\'s Standards: +5% Smithing materials saved' },
  { from: 'celestial', lv: 15, to: 'alchemy', fx: { potency: 0.1 }, desc: 'Starlit Brew: potions +10% stronger' },
  { from: 'exceed', lv: 15, to: 'fishing', fx: { speed: 0.1 }, desc: 'Happy Spots the Fish: -10% fishing time' },
  { from: 'exceed', lv: 30, to: 'gathering', fx: { yield: 0.05 }, desc: 'Exceed Scout: +5% bonus resources on all gathering' },
  { from: 'bartering', lv: 15, to: 'production', fx: { xp: 0.03 }, desc: 'Market Demand: +3% XP on all production' },
  { from: 'bartering', lv: 25, to: 'arcane', fx: { save: 0.04 }, desc: 'Bulk Buyer: +4% arcane materials saved' },
];
// Skill sets: every member at a tier level grants the set bonus for that tier (tiers stack).
export const SETS = [
  { id: 'hearth', name: "Dragon's Hearth", icon: '🔥', skills: ['fishing', 'cooking', 'exceed'], tiers: [10, 25, 40], fx: { cooking: { potency: 0.1 }, exceed: { xp: 0.05 } }, gfx: { regen: 0.15 }, desc: 'Meals +10% stronger, Exceed XP +5%, +15% out-of-combat regen per tier' },
  { id: 'artificer', name: 'Arcane Artificer', icon: '🔮', skills: ['lacrima', 'script', 'enchanting'], tiers: [10, 25, 40], fx: { lacrima: { save: 0.03 }, script: { save: 0.03 }, enchanting: { potency: 0.1 } }, desc: 'Arcane materials +3% saved, sigils +10% stronger per tier' },
  { id: 'scholar', name: 'Celestial Scholar', icon: '🌟', skills: ['script', 'celestial', 'alchemy'], tiers: [10, 25, 40], fx: { alchemy: { potency: 0.05 } }, gfx: { allyUp: 0.05 }, desc: 'Summons +5% power, potions +5% stronger per tier' },
  { id: 'titania', name: "Titania's Arsenal", icon: '⚔️', skills: ['smithing', 'requip', 'enchanting'], tiers: [10, 25, 40], fx: { smithing: { quality: 0.05 }, requip: { quality: 0.05 } }, gfx: { dmgUp: 0.02 }, desc: 'Better Smithing/Requip quality and +2% damage per tier' },
  { id: 'forager', name: 'Fiore Wanderer', icon: '🧭', skills: ['mining', 'woodcutting', 'foraging', 'fishing'], tiers: [10, 25, 40], fx: { gathering: { speed: 0.04, yield: 0.03 } }, desc: 'All gathering 4% faster with +3% bonus yield per tier' },
  { id: 'quartermaster', name: 'Guild Quartermaster', icon: '🍺', skills: ['crafting', 'cooking', 'bartering'], tiers: [10, 25, 40], fx: { production: { xp: 0.03 } }, gfx: { sell: 0.04 }, desc: 'Production XP +3% and sell prices +4% per tier' },
];

const lvl = (G, k) => levelForXp((G.skills && G.skills[k]) || 0);
const matches = (to, skill) => to === skill || (SKILL_DEFS[skill] && SKILL_DEFS[skill].cat === to);
const addFx = (b, fx, m = 1) => { for (const [k, v] of Object.entries(fx || {})) b[k] = (b[k] || 0) + v * m; };
export function setTier(G, set) { const lo = Math.min(...set.skills.map((k) => lvl(G, k))); return set.tiers.filter((t) => lo >= t).length; }
/** Every bonus that applies to one skill, from its perks, incoming synergies and sets. */
export function skillBonus(G, skill) {
  const b = { xp: 0, yield: 0, speed: 0, save: 0, quality: 0, potency: 0 }; const L = lvl(G, skill);
  for (const p of PERKS[skill] || []) if (L >= p.lv && p.fx) addFx(b, p.fx);
  for (const s of SYNERGIES) if (matches(s.to, skill) && lvl(G, s.from) >= s.lv) addFx(b, s.fx);
  for (const set of SETS) { const t = setTier(G, set); if (!t) continue; for (const [to, fx] of Object.entries(set.fx || {})) if (matches(to, skill)) addFx(b, fx, t); }
  b.speed = Math.min(0.5, b.speed); b.save = Math.min(0.35, b.save);
  return b;
}
/** Bonuses that are not tied to a skill (combat, travel, market). */
export function globalSkillFx(G) {
  const b = { allyUp: 0, sell: 0, buy: 0, travel: 0, move: 0, regen: 0, dmgUp: 0 };
  for (const [k, ps] of Object.entries(PERKS)) { const L = lvl(G, k); for (const p of ps) if (L >= p.lv && p.gfx) addFx(b, p.gfx, p.per ? L : 1); }
  for (const set of SETS) { const t = setTier(G, set); if (t && set.gfx) addFx(b, set.gfx, t); }
  b.sell = Math.min(0.6, b.sell); b.buy = Math.min(0.3, b.buy); b.travel = Math.min(0.5, b.travel);
  return b;
}
/** Human-readable list of active and upcoming bonuses for one skill (for tooltips). */
export function skillLinks(G, skill) {
  return {
    perks: (PERKS[skill] || []).map((p) => ({ ...p, on: lvl(G, skill) >= p.lv })),
    incoming: SYNERGIES.filter((s) => matches(s.to, skill)).map((s) => ({ ...s, on: lvl(G, s.from) >= s.lv })),
    outgoing: SYNERGIES.filter((s) => s.from === skill).map((s) => ({ ...s, on: lvl(G, skill) >= s.lv })),
    sets: SETS.filter((s) => s.skills.includes(skill)).map((s) => ({ ...s, tier: setTier(G, s) })),
  };
}
