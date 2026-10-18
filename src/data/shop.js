// Market board listings (Albion-style player-market feel). Prices drift daily by a seeded
// random factor; selling pays SELL_RATE of the drifted value.
export const SHOP_LISTINGS = [
  { id: 'tonic_hp', seller: 'Bubbles the Alchemist' },
  { id: 'tea_mp', seller: 'Granny Steep' },
  { id: 'stew', seller: 'Marzipan Doughty' },
  { id: 'sword1h_t1', seller: 'Greta Sootwhistle' },
  { id: 'bow_t1', seller: 'Fletcher Twang' },
  { id: 'staff_t1', seller: 'Old Mage Dorrin' },
  { id: 'knuckles_t1', seller: 'Brakka' },
  { id: 'sword2h_t2', seller: 'Greta Sootwhistle' },
  { id: 'robe_t2', seller: 'Tailor Snip' },
  { id: 'jacket_t2', seller: 'Tailor Snip' },
  { id: 'plate_t2', seller: 'Greta Sootwhistle' },
  { id: 'key_ram', seller: 'A Mysterious Stargazer' },
  { id: 'key_coral', seller: 'A Mysterious Stargazer' },
  { id: 'lac_flame', seller: 'Zazzle the Marvelous' },
  { id: 'lac_ice', seller: 'Zazzle the Marvelous' },
  { id: 'lac_celestial', seller: 'Zazzle the Marvelous' },
  { id: 'lac_lightning', seller: 'Zazzle the Marvelous' },
  { id: 'lac_rune', seller: 'Academy of Glyphs' },
  { id: 'lac_requip', seller: 'Pocket Armory Co.' },
  { id: 'sword1h_t4', seller: 'Traveling Adept' },
  { id: 'bow_t4', seller: 'Traveling Adept' },
  { id: 'staff_t5', seller: 'An Expert Who Will Not Stop Talking' },
];
export const BUY_MARKUP = 1.3;
export const SELL_RATE = 0.6;
