// Optional "Support development" link to a provider-hosted page (Ko-fi, GitHub Sponsors, Stripe Payment Link, ...).
// Hidden unless BOTH build-time settings are present:
//   VITE_SUPPORT_URL           https URL on an allowlisted provider host
//   VITE_SUPPORT_RIGHTS_OK=yes the owner confirmed fundraising is allowed for this project (see docs/SUPPORT.md)
// No payment data ever touches the game; gameplay is identical with or without it.
export const SUPPORT_HOSTS = ['ko-fi.com', 'github.com', 'buy.stripe.com', 'donate.stripe.com', 'www.paypal.com', 'paypal.me', 'www.buymeacoffee.com', 'opencollective.com', 'liberapay.com'];

export function supportUrl(env = (import.meta.env || {})) {
  if (String(env.VITE_SUPPORT_RIGHTS_OK || '').toLowerCase() !== 'yes') return null;
  let u; try { u = new URL(String(env.VITE_SUPPORT_URL || '')); } catch { return null; }
  if (u.protocol !== 'https:' || !SUPPORT_HOSTS.includes(u.hostname) || u.username || u.password) return null;
  return u.href;
}

export function supportLinkHTML(env) {
  const url = supportUrl(env); if (!url) return '';
  const safe = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<a class="support-link" href="${safe}" target="_blank" rel="noopener noreferrer">♥ Support development<span class="sr"> (opens an external page)</span></a>
    <div class="support-note">Optional. The game stays free and nothing in it is unlocked by supporting.</div>`;
}
