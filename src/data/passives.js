// Passive skill trees (spent with Passive Points, PP). Three trees:
//  body   - Physique: flat stat passives (HP, mana, defence, crit, speed)
//  arcana - Arcana: on-hit / on-kill procs (ignite, static chain, stun, lifesteal, execute, mana siphon)
//  bond   - Life Bond: passives that scale with your 15 life skills and unlock from Skill Set tiers
// Node: { id, name, icon, kind:'passive', max, req:[[id,rank]], row, col, fx (per rank), per?:{skill, fx (per rank per skill level)},
//         reqSkill?:[skill, level], reqSet?:[setId, tier], reqLvl?, desc }
// fx keys understood by the engine (passiveFx): hp, mp, def, crit, critDmg, cdr, move, dmg, dr, dodge, thorns, regen, mpRegen,
//  lifesteal, burnProc, stunProc, chainProc, execute, mpOnKill, hpOnKill, allyUp, xp, gspeed, yield
const P = (id, name, icon, max, row, col, fx, desc, extra = {}) => ({ id, name, icon, kind: 'passive', max, row, col, fx, desc, req: [], ...extra });
export const PASSIVE_TREES = {
  body: { key: 'body', name: 'Physique', icon: '💪', points: 'pp', group: 'passive', nodes: [
    P('body:vigor', 'Dragon Vigor', '❤️', 5, 0, 1, { hp: 0.04 }, '+4% max health per rank'),
    P('body:well', 'Mana Wellspring', '💧', 5, 1, 0, { mp: 8, mpRegen: 0.4 }, '+8 max mana and +0.4 mana/s per rank', { req: [['body:vigor', 1]] }),
    P('body:hide', 'Iron Hide', '🪨', 5, 1, 2, { def: 3 }, '+3 defence per rank', { req: [['body:vigor', 1]] }),
    P('body:step', 'Light Step', '👟', 3, 2, 0, { move: 0.03, dodge: 0.02 }, '+3% move speed and +2% dodge per rank', { req: [['body:well', 2]] }),
    P('body:eye', 'Hawk Eye', '🎯', 5, 2, 2, { crit: 0.015 }, '+1.5% crit chance per rank', { req: [['body:hide', 2]] }),
    P('body:fury', 'Fairy Fury', '💢', 3, 3, 2, { critDmg: 0.12 }, '+12% critical damage per rank', { req: [['body:eye', 3]], reqLvl: 10 }),
    P('body:tempo', 'Battle Tempo', '⏱️', 3, 3, 0, { cdr: 0.03 }, '-3% all cooldowns per rank', { req: [['body:step', 1]], reqLvl: 10 }),
    P('body:second', 'Second Origin', '🌟', 1, 4, 1, { hp: 0.1, mp: 30, dmg: 0.06 }, 'Unlock your Second Origin: +10% health, +30 mana, +6% damage', { req: [['body:fury', 1], ['body:tempo', 1]], reqLvl: 18 }),
  ] },
  arcana: { key: 'arcana', name: 'Arcana', icon: '🔮', points: 'pp', group: 'passive', nodes: [
    P('arcana:focus', 'Magic Focus', '✨', 5, 0, 1, { dmg: 0.03 }, '+3% damage per rank'),
    P('arcana:ignite', 'Ignition', '🔥', 3, 1, 0, { burnProc: 0.06 }, '6% chance per rank for any hit to ignite the target', { req: [['arcana:focus', 1]] }),
    P('arcana:static', 'Static Chain', '⚡', 3, 1, 2, { chainProc: 0.06 }, '6% chance per rank for a hit to arc to a nearby enemy for 40% damage', { req: [['arcana:focus', 1]] }),
    P('arcana:leech', 'Ethernano Leech', '🩸', 3, 2, 0, { lifesteal: 0.02 }, 'Heal for 2% of damage dealt per rank', { req: [['arcana:ignite', 1]] }),
    P('arcana:jolt', 'Concussive Spell', '💫', 3, 2, 2, { stunProc: 0.04 }, '4% chance per rank to briefly stun on hit', { req: [['arcana:static', 1]] }),
    P('arcana:siphon', 'Mana Siphon', '🌀', 3, 3, 0, { mpOnKill: 4, hpOnKill: 6 }, 'Defeating an enemy restores 4 mana and 6 health per rank', { req: [['arcana:leech', 1]], reqLvl: 8 }),
    P('arcana:exec', 'Finishing Blow', '☠️', 3, 3, 2, { execute: 0.1 }, '+10% damage per rank to enemies under 30% health', { req: [['arcana:jolt', 1]], reqLvl: 8 }),
    P('arcana:thorn', 'Rune Thorns', '🌵', 3, 4, 0, { thorns: 0.1 }, 'Reflect 10% of damage taken per rank', { req: [['arcana:siphon', 1]] }),
    P('arcana:drive', 'Magic Drive', '🌠', 1, 4, 2, { dmg: 0.08, cdr: 0.05, burnProc: 0.05, chainProc: 0.05 }, 'Magic Drive: +8% damage, -5% cooldowns, +5% ignite and chain chance', { req: [['arcana:exec', 2], ['arcana:focus', 5]], reqLvl: 16 }),
  ] },
  bond: { key: 'bond', name: 'Life Bond', icon: '🤝', points: 'pp', group: 'passive', nodes: [
    P('bond:stomach', 'Iron Stomach', '🍳', 3, 0, 0, {}, '+0.3% max health per Cooking level, per rank', { per: { skill: 'cooking', fx: { hp: 0.003 } } }),
    P('bond:angler', "Angler's Patience", '🎣', 3, 0, 2, {}, '+0.1% crit per Fishing level, per rank', { per: { skill: 'fishing', fx: { crit: 0.001 } } }),
    P('bond:smith', "Smith's Arm", '🔨', 3, 1, 0, {}, '+0.2% damage per Smithing level, per rank', { per: { skill: 'smithing', fx: { dmg: 0.002 } }, req: [['bond:stomach', 1]] }),
    P('bond:conduit', 'Lacrima Conduit', '🔮', 3, 1, 2, {}, '+0.6 max mana per Lacrima level, per rank', { per: { skill: 'lacrima', fx: { mp: 0.6 } }, req: [['bond:angler', 1]] }),
    P('bond:wings', 'Aye Sir Wings', '🐱', 3, 1, 1, {}, '+0.15% move speed per Exceed level, per rank', { per: { skill: 'exceed', fx: { move: 0.0015 } } }),
    P('bond:ward', 'Enchanted Ward', '🛡️', 3, 2, 0, {}, '+0.15% damage reduction per Rune Enchanting level, per rank', { per: { skill: 'enchanting', fx: { dr: 0.0015 } }, req: [['bond:smith', 1]] }),
    P('bond:stars', 'Stellar Resonance', '🌟', 3, 2, 2, {}, '+0.5% summon power per Celestial level, per rank', { per: { skill: 'celestial', fx: { allyUp: 0.005 } }, req: [['bond:conduit', 1]] }),
    P('bond:script', 'Living Letters', '📜', 3, 2, 1, {}, '-0.1% cooldowns per Solid Script level, per rank', { per: { skill: 'script', fx: { cdr: 0.001 } }, req: [['bond:wings', 1]] }),
    P('bond:hearth', "Hearth Ember", '🔥', 1, 3, 0, { burnProc: 0.08, regen: 0.3 }, "Dragon's Hearth set: +8% ignite chance, +30% regen", { reqSet: ['hearth', 1] }),
    P('bond:artifice', 'Artificer Overload', '⚙️', 1, 3, 1, { chainProc: 0.08, mp: 20 }, 'Arcane Artificer set: +8% chain chance, +20 mana', { reqSet: ['artificer', 1] }),
    P('bond:titania', "Titania's Resolve", '⚔️', 1, 3, 2, { def: 8, critDmg: 0.15 }, "Titania's Arsenal set: +8 defence, +15% crit damage", { reqSet: ['titania', 1] }),
    P('bond:scholar', 'Spirit Covenant', '🗝️', 1, 4, 0, { allyUp: 0.2, mpRegen: 1 }, 'Celestial Scholar set: summons +20%, +1 mana/s', { reqSet: ['scholar', 1] }),
    P('bond:wander', 'Wanderer\'s Instinct', '🧭', 1, 4, 1, { gspeed: 0.08, yield: 0.06, move: 0.04 }, 'Fiore Wanderer set: faster, richer gathering and +4% move speed', { reqSet: ['forager', 1] }),
    P('bond:quarter', 'Guild Provisioner', '🍺', 1, 4, 2, { hpOnKill: 10, xp: 0.05 }, 'Guild Quartermaster set: +10 health on kill, +5% skill XP', { reqSet: ['quartermaster', 1] }),
  ] },
};
