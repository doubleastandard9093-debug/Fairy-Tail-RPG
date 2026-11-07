# Support development link (off by default)

The title screen can show an optional **♥ Support development** link to a page hosted by a payment provider. The game never collects card data, secrets, or donor info. Nothing in the game is unlocked by supporting.

## Enable (build-time; e.g. repository Actions variables used by `pages.yml`)
- `VITE_SUPPORT_URL`: an https link on an allowlisted host (`src/ui/support.js`), e.g. a Ko-fi page, GitHub Sponsors, or a Stripe Payment Link. Prefer one-time contributions, with no recurring default.
- `VITE_SUPPORT_RIGHTS_OK=yes`: set this only after the owner confirms fundraising is permitted.

If either setting is missing or invalid, the link is not rendered.

## Rights caution (not legal advice)
This project is an unofficial fan game that uses the *Fairy Tail* name, characters and setting (© Hiro Mashima / Kodansha). Collecting money in connection with it may conflict with the rights holders' policies, even if it's framed as donations and even with the disclaimer. Get permission or qualified advice first, or point the link only at a separate, original project. Do not promise perks or make tax-deductibility claims.
