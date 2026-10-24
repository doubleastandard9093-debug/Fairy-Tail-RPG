// Guild life: rank perks, the S-Class trial, rival guilds and contested requests.
// Fame is a light "Fiore guild standings" score. Rivals gain fame every real day and when they win a contested job.
export const RANK_PERKS = {
  E: { jobs: 3, title: 'Rookie Wizard', perk: 'Take E and D requests.' },
  D: { jobs: 3, title: 'Wizard', perk: 'Take C requests.' },
  C: { jobs: 4, title: 'Seasoned Wizard', perk: 'Carry 4 jobs at once.' },
  B: { jobs: 4, title: 'Veteran Wizard', perk: 'Take A-rank requests. Rival guilds start contesting your jobs.' },
  A: { jobs: 5, title: 'Ace of the Guild', perk: 'Carry 5 jobs. You may enter the S-Class Promotion Trial.' },
  S: { jobs: 6, title: 'Rank S (needs the Trial)', perk: 'Carry 6 jobs. S-Class missions need the S-Class title from the Trial.' },
};
// The guild's own S-Class wizards (and you, once you pass). gp is a fictional standing for the leaderboard.
export const MEMBERS = [
  { name: 'Gildarts Clive', rank: 'S', gp: 9800, note: 'Walks through Magnolia (literally; the town moves for him).' },
  { name: 'Mirajane Strauss', rank: 'S', gp: 7200, note: 'Demon. Bartender. Both.' },
  { name: 'Erza Scarlet', rank: 'S', gp: 6900, note: 'Titania.' },
  { name: 'Laxus Dreyar', rank: 'S', gp: 6600, note: 'Pretends he does not care about the rankings.' },
  { name: 'Mystogan', rank: 'S', gp: 6000, note: 'Puts everyone to sleep before taking a job.' },
  { name: 'Natsu Dragneel', rank: 'A', gp: 2600, note: 'Property damage counted separately.' },
  { name: 'Gray Fullbuster', rank: 'A', gp: 2400, note: 'Clothes not included.' },
  { name: 'Lucy Heartfilia', rank: 'B', gp: 900, note: 'Rent: always due.' },
  { name: 'Wendy Marvell', rank: 'C', gp: 450, note: 'The sky is on her side.' },
];
export const RIVALS = {
  phantom: { name: 'Phantom Lord', color: '#4a3a6a', icon: '👻', fame: 5200, perDay: 40, blurb: 'Fiore\'s biggest guild until recently, and very sore about it. Master Jose hates Fairy Tail.' },
  pegasus: { name: 'Blue Pegasus', color: '#5aa0e8', icon: '🐎', fame: 3900, perDay: 25, blurb: 'The Trimens. Ichiya. Men~. Friendly rivals with a very particular perfume.' },
  lamia: { name: 'Lamia Scale', color: '#3ab08a', icon: '🐍', fame: 4300, perDay: 30, blurb: 'Lyon Vastia\'s guild. Lyon will remind Gray of this.' },
  sabertooth: { name: 'Sabertooth', color: '#d0a030', icon: '🐯', fame: 4800, perDay: 35, blurb: 'Says it is the strongest guild in Fiore. Loudly.' },
  cerberus: { name: 'Quatro Cerberus', color: '#c04a2a', icon: '🐕', fame: 3000, perDay: 20, blurb: 'WILD...FOUR! Their slogan. All of it.' },
};
export const FAIRY_FAME_BASE = 4000; // your fame = base + gp*2 + contested wins*120
// Contested request window: a rival also took the job and will finish it after this many seconds of play.
export const CONTEST_TIME = 600;
