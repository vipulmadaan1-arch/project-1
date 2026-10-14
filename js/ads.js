// Google AdSense, loaded only when ADSENSE_CLIENT is set in config.js.
// Ads go into <div class="ad-slot"> placeholders: one after each tool, one on the home page.
// Consent for EEA/UK/Swiss visitors is handled by AdSense's own "Privacy & messaging" banner,
// which you switch on in the AdSense dashboard. No extra code is needed here.
import { ADSENSE_CLIENT, ADSENSE_SLOT } from './config.js';

export const ADS_ENABLED = /^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT) && /^\d{6,12}$/.test(ADSENSE_SLOT);

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
