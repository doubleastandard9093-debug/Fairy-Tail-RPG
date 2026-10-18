// Ability data. The engine (systems/combat.js) understands these mechanic types:
//  melee     - hit enemies in a frontal arc       {range, arc}
//  proj      - projectile at target / forward     {speed, pierce, splash}
//  beam      - instant line in front              {length, width}
//  aoe_self  - burst around the caster            {radius}
//  aoe_target- delayed burst at target/ahead      {radius, dist, delay}
//  dash      - lunge forward, hitting on the way  {dist, width}
//  buff      - self buff                          {buff:{shield, dmgUp, dr, mpRegen, dur}}
//  summon    - spirit ally                        {ally, dur, needs (item id)}
//  trap      - rune that bursts when a mob steps in {radius, dur, dist}
//  requip    - swap to your reserve weapon then strike {radius}
// Shared: cost{mp,adr}, gain (adrenaline), cd (s), mult (damage x weapon power),
// stat (scaling stat), effect{burn{dps,dur}, slow{pct,dur}, stun}, rank (class rank needed), color.
export const ABILITIES = {
  // ---------- Weapons ----------
  sw_slash: { name: 'Slash', icon: '🗡️', type: 'melee', range: 2.6, arc: 1.6, mult: 1.0, cd: 1.2, gain: 9, stat: 'STR', color: '#ffffff' },
  sw_rush: { name: 'Riposte Rush', icon: '💨', type: 'dash', dist: 6, width: 1.6, mult: 1.6, cd: 7, gain: 6, stat: 'STR', color: '#cfe8ff' },
  sw_crescent: { name: 'Crescent Cleave', icon: '🌙', type: 'melee', range: 3.6, arc: 3.4, mult: 3.4, cd: 12, cost: { adr: 50 }, stat: 'STR', color: '#9fd0ff' },

  gs_swing: { name: 'Heavy Swing', icon: '⚔️', type: 'melee', range: 3.0, arc: 2.0, mult: 1.4, cd: 1.8, gain: 10, stat: 'STR', color: '#ffe0a0' },
  gs_split: { name: 'Earthsplitter', icon: '🪓', type: 'beam', length: 9, width: 1.8, mult: 2.0, cd: 8, gain: 6, stat: 'STR', color: '#d8a060', effect: { stun: 0.8 } },
  gs_whirl: { name: 'Whirlwind', icon: '🌀', type: 'aoe_self', radius: 4.2, mult: 3.6, cd: 14, cost: { adr: 50 }, stat: 'STR', color: '#ffd080' },

  bow_shot: { name: 'Quick Shot', icon: '🏹', type: 'proj', speed: 34, mult: 1.0, cd: 1.1, gain: 9, stat: 'DEX', color: '#f8f0c0' },
  bow_pierce: { name: 'Piercing Arrow', icon: '➶', type: 'proj', speed: 44, pierce: true, mult: 1.8, cd: 7, gain: 6, stat: 'DEX', color: '#a0ffd0' },
  bow_rain: { name: 'Arrow Rain', icon: '☔', type: 'aoe_target', radius: 4.5, dist: 9, delay: 0.6, mult: 3.2, cd: 14, cost: { adr: 50 }, stat: 'DEX', color: '#d0ffb0' },

  st_bolt: { name: 'Mana Bolt', icon: '🔮', type: 'proj', speed: 26, mult: 1.0, cd: 1.2, gain: 9, stat: 'INT', color: '#c0a0ff' },
  st_burst: { name: 'Arcane Burst', icon: '💥', type: 'aoe_target', radius: 3.2, dist: 8, delay: 0.4, mult: 1.9, cd: 8, cost: { mp: 12 }, gain: 6, stat: 'INT', color: '#e0a0ff' },
  st_barrier: { name: 'Barrier', icon: '🔰', type: 'buff', buff: { shield: 60, dur: 10 }, cd: 20, cost: { adr: 40 }, stat: 'INT', color: '#a0d0ff' },

  kn_jab: { name: 'Jab', icon: '🥊', type: 'melee', range: 2.2, arc: 1.4, mult: 0.8, cd: 0.7, gain: 8, stat: 'AGI', color: '#ffc0a0' },
  kn_upper: { name: 'Rising Uppercut', icon: '⤴️', type: 'melee', range: 2.4, arc: 1.2, mult: 1.6, cd: 6, gain: 6, stat: 'AGI', color: '#ffa080', effect: { stun: 1.2 } },
  kn_hundred: { name: 'Hundred Fists', icon: '👊', type: 'beam', length: 4, width: 2.6, mult: 3.8, cd: 13, cost: { adr: 50 }, stat: 'AGI', color: '#ff9060' },

  // ---------- Armor (one each) ----------
  ar_meditate: { name: 'Meditate', icon: '🧘', type: 'buff', buff: { mpRegen: 8, dur: 6 }, cd: 25, color: '#80c0ff' },
  ar_roll: { name: 'Evasive Roll', icon: '🤸', type: 'dash', dist: 5, width: 0, mult: 0, cd: 9, iframes: 0.5, color: '#c0ffc0' },
  ar_guard: { name: 'Iron Guard', icon: '🛡️', type: 'buff', buff: { dr: 0.5, dur: 6 }, cd: 22, color: '#d0d0d0' },

  // ---------- Flame Slayer ----------
  fl_fist: { name: 'Blazing Fist', icon: '👊', type: 'melee', range: 2.6, arc: 1.4, mult: 1.6, cd: 2.5, cost: { mp: 6 }, gain: 8, stat: 'INT', color: '#ff7a2a', effect: { burn: { dps: 4, dur: 4 } }, rank: 1 },
  fl_bellow: { name: "Drake's Bellow", icon: '🐉', type: 'beam', length: 11, width: 2.6, mult: 2.6, cd: 9, cost: { mp: 18 }, gain: 6, stat: 'INT', color: '#ff5a10', effect: { burn: { dps: 6, dur: 5 } }, rank: 1 },
  fl_wing: { name: 'Cinder Wing Spiral', icon: '🌪️', type: 'aoe_self', radius: 5, mult: 3.6, cd: 15, cost: { adr: 60 }, stat: 'INT', color: '#ffa030', effect: { burn: { dps: 8, dur: 4 } }, rank: 2 },
  fl_feast: { name: 'Ember Feast', icon: '🍖', type: 'buff', buff: { dmgUp: 0.3, mpRestore: 40, dur: 10 }, cd: 30, stat: 'INT', color: '#ffcf40', rank: 3 },

  // ---------- Ice-Make ----------
  ic_lance: { name: 'Ice-Make: Lance', icon: '🧊', type: 'proj', speed: 30, pierce: true, mult: 1.5, cd: 2.5, cost: { mp: 6 }, gain: 8, stat: 'INT', color: '#a8e8ff', effect: { slow: { pct: 0.4, dur: 3 } }, rank: 1 },
  ic_shield: { name: 'Ice-Make: Shield', icon: '🛡️', type: 'buff', buff: { shield: 90, dur: 12 }, cd: 18, cost: { mp: 15 }, stat: 'INT', color: '#c8f4ff', rank: 1 },
  ic_floor: { name: 'Ice-Make: Floor', icon: '❄️', type: 'aoe_self', radius: 6, mult: 1.2, cd: 12, cost: { mp: 16 }, gain: 6, stat: 'INT', color: '#e0faff', effect: { slow: { pct: 0.6, dur: 4 } }, rank: 2 },
  ic_hammer: { name: 'Ice-Make: Hammer', icon: '🔨', type: 'aoe_target', radius: 3.6, dist: 7, delay: 0.7, mult: 4.0, cd: 15, cost: { adr: 60 }, stat: 'INT', color: '#8fdcff', effect: { stun: 1.5 }, rank: 3 },

  // ---------- Celestial Summoning ----------
  ce_ram: { name: 'Gate of the Brass Ram', icon: '🐏', type: 'summon', ally: 'spirit_ram', dur: 22, needs: 'key_ram', cd: 30, cost: { mp: 25 }, stat: 'INT', color: '#ffd27a', rank: 1 },
  ce_coral: { name: 'Gate of the Coral Maiden', icon: '🧜', type: 'summon', ally: 'spirit_coral', dur: 18, needs: 'key_coral', cd: 34, cost: { mp: 25 }, stat: 'INT', color: '#7ad8ff', rank: 1 },
  ce_star: { name: 'Starfall', icon: '🌠', type: 'aoe_target', radius: 4, dist: 8, delay: 0.8, mult: 2.4, cd: 10, cost: { mp: 14 }, gain: 6, stat: 'INT', color: '#fff0a0', rank: 2 },
  ce_bond: { name: 'Spirit Bond', icon: '💫', type: 'buff', buff: { dmgUp: 0.25, allyUp: 0.5, dur: 12 }, cd: 26, cost: { adr: 50 }, stat: 'INT', color: '#ffe8ff', rank: 3 },

  // ---------- Lightning ----------
  li_spark: { name: 'Spark Bolt', icon: '⚡', type: 'proj', speed: 48, mult: 1.4, cd: 1.8, cost: { mp: 5 }, gain: 9, stat: 'INT', color: '#fff27a', rank: 1 },
  li_lance: { name: 'Thunder Lance', icon: '🌩️', type: 'beam', length: 13, width: 1.4, mult: 2.4, cd: 8, cost: { mp: 15 }, gain: 6, stat: 'INT', color: '#ffff9a', effect: { stun: 0.6 }, rank: 1 },
  li_step: { name: 'Static Step', icon: '💨', type: 'dash', dist: 8, width: 2, mult: 1.2, cd: 9, cost: { mp: 10 }, stat: 'INT', color: '#e8f8ff', rank: 2 },
  li_cage: { name: 'Storm Cage', icon: '⛈️', type: 'aoe_self', radius: 5.5, mult: 3.4, cd: 15, cost: { adr: 60 }, stat: 'INT', color: '#f8ff8a', effect: { stun: 1.6 }, rank: 3 },

  // ---------- Script / Rune ----------
  ru_bolt: { name: 'Glyph Bolt', icon: '✒️', type: 'proj', speed: 24, mult: 1.2, cd: 1.6, cost: { mp: 4 }, gain: 9, stat: 'INT', color: '#d0a0ff', rank: 1 },
  ru_blast: { name: 'Rune Trap: Blast', icon: '💣', type: 'trap', radius: 3.4, dist: 4, dur: 20, mult: 3.0, cd: 8, cost: { mp: 12 }, stat: 'INT', color: '#c080ff', rank: 1 },
  ru_bind: { name: 'Rune Trap: Bind', icon: '⛓️', type: 'trap', radius: 3.8, dist: 4, dur: 20, mult: 0.8, cd: 12, cost: { mp: 12 }, stat: 'INT', color: '#9a7aff', effect: { stun: 2.5 }, rank: 2 },
  ru_script: { name: 'Script Detonation', icon: '📜', type: 'aoe_target', radius: 5, dist: 6, delay: 1.0, mult: 4.2, cd: 16, cost: { adr: 60 }, stat: 'INT', color: '#e0b0ff', rank: 3 },

  // ---------- Requip ----------
  rq_swap: { name: 'Requip: Swap', icon: '🔁', type: 'requip', radius: 3, mult: 1.6, cd: 4, cost: { mp: 6 }, gain: 10, stat: 'STR', color: '#fff0d0', rank: 1 },
  rq_lances: { name: 'Requip: Lance Volley', icon: '🔱', type: 'proj', speed: 36, pierce: true, mult: 2.0, cd: 8, cost: { mp: 12 }, gain: 6, stat: 'STR', color: '#ffe0b0', rank: 1 },
  rq_armor: { name: 'Requip: Bulwark', icon: '🏰', type: 'buff', buff: { dr: 0.4, shield: 50, dur: 10 }, cd: 24, cost: { mp: 15 }, stat: 'STR', color: '#f0e0c0', rank: 2 },
  rq_storm: { name: 'Requip: Blade Storm', icon: '🗡️', type: 'aoe_self', radius: 5, mult: 4.0, cd: 16, cost: { adr: 60 }, stat: 'STR', color: '#fff8e0', rank: 3 },

  // ---------- Mob-only ----------
  mob_bite: { name: 'Bite', type: 'mob' },
};

export const WEAPON_ABILITIES = {
  sword1h: ['sw_slash', 'sw_rush', 'sw_crescent'],
  sword2h: ['gs_swing', 'gs_split', 'gs_whirl'],
  bow: ['bow_shot', 'bow_pierce', 'bow_rain'],
  staff: ['st_bolt', 'st_burst', 'st_barrier'],
  knuckles: ['kn_jab', 'kn_upper', 'kn_hundred'],
  none: ['kn_jab'],
};
export const ARMOR_ABILITY = { cloth: 'ar_meditate', leather: 'ar_roll', plate: 'ar_guard' };

for (const k of Object.keys(ABILITIES)) ABILITIES[k].id = k;
