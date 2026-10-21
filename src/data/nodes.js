// Gathering nodes. type -> skill and item. Tier bands push higher tiers deeper into the field.
export const NODE_TYPES = {
  ore: { skill: 'mining', verb: 'Mine', names: ['Copper Rock', 'Iron Rock', 'Starsilver Vein'] },
  wood: { skill: 'woodcutting', verb: 'Chop', names: ['Birch Tree', 'Oak Tree', 'Moonwillow'] },
  fibre: { skill: 'foraging', verb: 'Pick', names: ['Cotton Bush', 'Flax Patch', 'Silkweed Clump'] },
};
// The item a node gives is `${type}_t${tier}` (see data/items.js).
export const NODE_TIERS = [
  null,
  { level: 1, xp: 25, time: 1.6, uses: 4 },
  { level: 10, xp: 48, time: 2.2, uses: 4 },
  { level: 20, xp: 85, time: 2.8, uses: 3 },
];
export const NODE_BANDS = [
  { tier: 1, z: [50, 92], perType: 5 },
  { tier: 2, z: [92, 132], perType: 4 },
  { tier: 3, z: [132, 166], perType: 3 },
];
export const NODE_RESPAWN = 18;
// Where nodes grow in the Fiore world (place id or world `at`, ring min..spread). Tiers rise with distance from Magnolia.
export const NODE_PLACEMENT = [
  { type: 'ore', tier: 1, at: [-14, 58], spread: 14, n: 2 }, { type: 'wood', tier: 1, at: [16, 60], spread: 14, n: 2 }, { type: 'fibre', tier: 1, at: [-10, 64], spread: 12, n: 2 },
  { type: 'wood', tier: 1, place: 'eastforest', spread: 70, min: 14, n: 5 }, { type: 'fibre', tier: 1, place: 'eastforest', spread: 70, min: 14, n: 4 }, { type: 'ore', tier: 1, at: [60, -60], spread: 30, n: 4 },
  { type: 'fibre', tier: 2, place: 'scilliora', spread: 85, min: 60, n: 4 }, { type: 'wood', tier: 2, place: 'scilliora', spread: 85, min: 60, n: 3 },
  { type: 'ore', tier: 2, place: 'hakobetrail', spread: 40, min: 12, n: 4 }, { type: 'wood', tier: 2, place: 'hargeon', spread: 70, min: 40, n: 3 }, { type: 'ore', tier: 2, place: 'crocus', spread: 60, min: 30, n: 3 },
  { type: 'wood', tier: 2, place: 'oshibana', spread: 60, min: 32, n: 3 }, { type: 'fibre', tier: 2, place: 'clover', spread: 50, min: 30, n: 3 },
  { type: 'ore', tier: 3, place: 'hakobe', spread: 45, min: 10, n: 4 }, { type: 'wood', tier: 3, place: 'tenrou', spread: 60, min: 18, n: 4 },
  { type: 'fibre', tier: 3, place: 'galuna', spread: 60, min: 20, n: 4 }, { type: 'ore', tier: 3, place: 'canyon', spread: 26, min: 8, n: 2 },
];
