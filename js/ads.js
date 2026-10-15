// Google AdSense, loaded only when ADSENSE_CLIENT is set in config.js.
// Ads go into <div class="ad-slot"> placeholders: one after each tool, one on the home page.
// Consent for EEA/UK/Swiss visitors is handled by AdSense's own "Privacy & messaging" banner,
// which you switch on in the AdSense dashboard; confirm it with CONSENT_CONFIRMED in config.js.
// Ads also need a contact address on the privacy page (CONTACT_EMAIL).
// The Content-Security-Policy on every page blocks eval and other origins while ads are off. Enabling AdSense
// requires re-adding 'unsafe-eval' to script-src and widening img-src, connect-src and frame-src: rerun
// node scripts/seo.mjs after setting the IDs, and it writes the wider policy (see csp() there).
import { ADSENSE_CLIENT, ADSENSE_SLOT, CONSENT_CONFIRMED, CONTACT_EMAIL } from './config.js';

export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d{6,12}$/.test(ADSENSE_SLOT)
  && CONSENT_CONFIRMED === true && !!CONTACT_EMAIL;

export function mountAds() {
  const slots = document.querySelectorAll('.ad-slot');
  if (!ADS_ENABLED || !slots.length) return;

  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.append(s);

  slots.forEach((slot) => {
    slot.hidden = false;
    slot.innerHTML = `<span class="ad-label">Advertisement</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${ADSENSE_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* blocked by an ad blocker */ }
  });
}
