// Site-wide settings. Change these in one place. npm run launch-check lists everything still to set before launch.
export const SITE_NAME = 'Sorted, Mate';

// The site's address, with no trailing slash (e.g. 'https://sortedmate.com.au').
// Leave empty until you have a domain. After changing it, run: npm run seo
// That writes canonical links, social share tags, breadcrumb data, sitemap.xml and robots.txt.
export const SITE_URL = 'https://vipulmadaan1-arch.github.io/project-1';

// Your Buy Me a Coffee page (e.g. 'https://buymeacoffee.com/jane'). Leave empty to hide every coffee link:
// the header button, the note under results (shown only after someone changes an input) and the About page line.
export const BMC_URL = 'https://buymeacoffee.com/sortedmate';

// Google AdSense. Leave empty to show no ads at all.
// Once approved, paste your publisher ID (e.g. 'ca-pub-1234567890123456') and the slot ID
// of one responsive display ad unit you create in AdSense (Ads → By ad unit → Display ads).
// Then run: npm run ads-txt   (writes ads.txt for your publisher ID)
// Then rerun: npm run seo     (widens the Content-Security-Policy for Google's ad scripts: they need
//                              'unsafe-eval' and images, frames and connections from Google's domains)
// Keep Auto ads OFF in the AdSense dashboard (Ads → By site → Auto ads), or limit them to the explainer text
// with page exclusions for the pages in ADS_EXCLUDE: Auto ads can put an ad between a form and its result,
// which this site's own ad slots never do (js/ads.js).
export const ADSENSE_CLIENT = '';
export const ADSENSE_SLOT = '';

// Pages (tool slugs) that never get an ad slot, even when ads are on.
// These calculators make projections about financial products (super, deposits, savings and investments).
// They rely on ASIC's calculator relief, which needs the calculator not to "advertise or promote a specific
// financial product" (ASIC Corporations (Generic Calculators) Instrument 2026/41, s 8(1)(a); super calculators
// have the same rule under ASIC Instrument 2022/603 and RG 276). Display ads are chosen by Google, not by us,
// and are often for a bank account, term deposit, super fund or investment platform, which next to a projection
// could read as the calculator promoting that product. So these pages carry no ads at all.
// rent-vs-buy is here too: it projects the return on investing a deposit instead of buying.
export const ADS_EXCLUDE = ['retirement', 'super', 'term-deposit', 'savings-goal', 'compound-interest', 'rent-vs-buy'];

// Google requires a Google-certified consent management platform (CMP) for visitors in the EEA, the UK and
// Switzerland before it serves them ads. Set this to true only once you've published the European regulations
// message in AdSense (Privacy & messaging) or set up another certified CMP. Ads stay off until it's true and
// CONTACT_EMAIL is set; npm run launch-check says what's missing.
export const CONSENT_CONFIRMED = false;

// Shown on the privacy, about and terms pages so visitors can reach you. Leave empty to hide the line.
// A valid address also switches on the Get in touch page's email buttons (contact.html), the footer's Get in touch
// link and the "Spot a wrong figure? Tell us" link under each calculator's results. Only a plain address is used
// (js/contact.js). After changing it, run: npm run seo (writes the footer link into every page).
export const CONTACT_EMAIL = 'sortedmate.site@gmail.com';

// Affiliate links: a "Tools I use" card below the FAQs, off by default. Turn it on only with a real list.
// Rules (npm run launch-check refuses a list that breaks them):
// - Non-financial products only, in a category listed in AFFILIATE_CATEGORIES (js/affiliates.js): no banks,
//   cards, loans, brokers, insurance, super, investing or crypto. Promoting a financial product next to a
//   calculator would break the ASIC calculator relief (Instrument 2026/41 s 8(1)(a)) and could need an AFS or
//   credit licence.
// - Only recommend things you actually use, and don't overstate them: the ACCC's guidance on online reviews and
//   endorsements, and the Australian Consumer Law ban on misleading conduct, apply to affiliate links.
// - Each item: { name, url (https), category, blurb, pages (optional: tool slugs; default AFFILIATE_DEFAULT_PAGES) }.
// Examples (not real links):
//   { name: 'A money book you rate', url: 'https://example.com/your-affiliate-link', category: 'books',
//     blurb: 'Plain-English budgeting basics.' },
//   { name: 'A budgeting app', url: 'https://example.com/ref', category: 'budgeting-app', blurb: 'Tracks spending by category.', pages: ['budget'] },
//   { name: 'Accounting software', url: 'https://example.com/ref', category: 'accounting-software',
//     blurb: 'GST and BAS for sole traders.', pages: ['gst', 'work-deductions'] },
export const AFFILIATES_ENABLED = false;
export const AFFILIATES = [];
