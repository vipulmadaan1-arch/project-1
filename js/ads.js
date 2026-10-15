// Google AdSense, loaded only when ADSENSE_CLIENT is set in config.js.
// Ads go into <div class="ad-slot"> placeholders: one after each tool (below the results, chart and assumptions,
// before the explainer; js/layout.js adds it), one on the home page. Never anywhere else:
// - no slot on the pages in ADS_EXCLUDE (config.js explains why: ASIC's calculator relief);
// - a slot inside a form or the results panel, or between a tool's form and its result, is ignored;
// - this code never turns on AdSense Auto ads or anchor/vignette formats (no enable_page_level_ads, no
//   data-ad-format="autorelaxed"). Auto ads are switched on or off in the AdSense dashboard only: keep them off
//   (Ads → By site → Auto ads), or limit them to the explainer text and exclude the ADS_EXCLUDE pages, because
//   Auto ads can place an ad between a calculator's inputs and its result.
// Consent for EEA/UK/Swiss visitors is handled by AdSense's own "Privacy & messaging" banner,
// which you switch on in the AdSense dashboard; confirm it with CONSENT_CONFIRMED in config.js.
// Ads also need a contact address on the privacy page (CONTACT_EMAIL).
// The Content-Security-Policy on every page blocks eval and other origins while ads are off. Enabling AdSense
// requires re-adding 'unsafe-eval' to script-src and widening img-src, connect-src and frame-src: rerun
// node scripts/seo.mjs after setting the IDs, and it writes the wider policy (see csp() there).
import { ADSENSE_CLIENT, ADSENSE_SLOT, CONSENT_CONFIRMED, CONTACT_EMAIL, ADS_EXCLUDE } from './config.js';

export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d{6,12}$/.test(ADSENSE_SLOT)
  && CONSENT_CONFIRMED === true && !!CONTACT_EMAIL;

// True when a slot sits where an ad must never go: in a form, in the results panel or the two-column tool
// area (.cols, which holds the form and its result), or ahead of the results panel in the page.
export function badSlot(slot) {
  if (slot.closest('form, .readout, .cols, .result-actions')) return true;
  const readout = document.querySelector('.readout');
  return !!readout && !!(slot.compareDocumentPosition(readout) & Node.DOCUMENT_POSITION_FOLLOWING);
}

export function mountAds() {
  const page = location.pathname.match(/tools\/([^/]+)\.html$/)?.[1];
  if (!ADS_ENABLED || (page && ADS_EXCLUDE.includes(page))) return;
  const slots = [...document.querySelectorAll('.ad-slot')].filter((s) => !badSlot(s));
  if (!slots.length) return;

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
