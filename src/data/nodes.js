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
