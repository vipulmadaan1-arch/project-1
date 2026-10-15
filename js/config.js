// Site-wide settings. Change these in one place.
export const SITE_NAME = 'Sorted, Mate';

// The site's address, with no trailing slash (e.g. 'https://sortedmate.com.au').
// Leave empty until you have a domain. After changing it, run: npm run seo
// That writes canonical links, social share tags, breadcrumb data, sitemap.xml and robots.txt.
export const SITE_URL = '';

// Replace YOUR_HANDLE with your Buy Me a Coffee username (e.g. https://buymeacoffee.com/jane).
export const BMC_URL = 'https://buymeacoffee.com/YOUR_HANDLE';

// Google AdSense. Leave empty to show no ads at all.
// Once approved, paste your publisher ID (e.g. 'ca-pub-1234567890123456') and the slot ID
// of one responsive display ad unit you create in AdSense (Ads → By ad unit → Display ads).
// Then run: npm run ads-txt   (writes ads.txt for your publisher ID)
// Then rerun: npm run seo     (widens the Content-Security-Policy for Google's ad scripts: they need
//                              'unsafe-eval' and images, frames and connections from Google's domains)
export const ADSENSE_CLIENT = '';
export const ADSENSE_SLOT = '';

// Google requires a Google-certified consent management platform (CMP) for visitors in the EEA, the UK and
// Switzerland before it serves them ads. Set this to true only once you've published the European regulations
// message in AdSense (Privacy & messaging) or set up another certified CMP. Ads stay off until it's true and
// CONTACT_EMAIL is set; npm run launch-check says what's missing.
export const CONSENT_CONFIRMED = false;

// Shown on the privacy page so visitors can reach you. Leave empty to hide the line.
export const CONTACT_EMAIL = '';
