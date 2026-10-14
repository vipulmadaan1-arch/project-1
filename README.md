# Sorted, Mate

Free everyday tools on one site, as tiles, with a focus on Australian money calculators. It's a static site: no backend and no build step. Everything runs in the browser.

## Tools (14)
**Money:** NSW Stamp Duty (2026/27) · Take-Home Pay AU (2026-27) · Mortgage Repayments · Offset Account Savings · Rental Yield · Compound Interest · GST
**Everyday:** Calculator · Percentage · Unit Converter · Date Calculator
**Time:** World Clock (with time converter) · Stopwatch · Countdown Timer

## Design
- Type: Schibsted Grotesk (headings, figures), IBM Plex Sans (body), IBM Plex Mono (labels, stopwatch, timer and calculator digits). The fonts are self-hosted in `fonts/` (SIL Open Font License; see `fonts/LICENSE.txt`), so no request goes to Google and the site still works offline.
- Colour tokens and the type scale are at the top of `css/style.css`. Light and dark themes are defined in one place.
- Icons are inline SVG line icons in `js/icons.js`, one per tool, keyed by slug. A new tool needs an icon added there.
- Every result appears on the dark "readout" panel (class `readout`). It is the only high-contrast element on a page.

## Features
- Pin favourite tiles on the home page. Pins are saved in the browser.
- "Copy link" shares a calculator's exact inputs; opening the link restores them.
- Works offline after the first visit (service worker) and can be installed as an app.
- Each tool page has a how-it-works section, FAQs and structured data (JSON-LD) for search engines.
- Light and dark mode.

## Setup
1. **Buy Me a Coffee:** create an account at buymeacoffee.com, then set `BMC_URL` in `js/config.js`. Until then all coffee links stay hidden, so the site can go live without them.
2. **Site name:** change `SITE_NAME` in `js/config.js`, the `| Sorted, Mate` suffix in the page `<title>` tags, and `name`/`short_name` in `manifest.webmanifest`.

## Revenue
**Buy Me a Coffee:** set `BMC_URL` in `js/config.js`. The header button, footer link and the prompt under results appear automatically.

**Google AdSense:** off until configured. Once AdSense approves your site (you'll need your own domain):
1. In AdSense, create one responsive display ad unit.
2. Set `ADSENSE_CLIENT` (e.g. `ca-pub-1234567890123456`) and `ADSENSE_SLOT` (the unit's ID) in `js/config.js`.
3. Run `npm run ads-txt` and commit the generated `ads.txt` (it's deployed to the site root).
4. In AdSense → Privacy & messaging, publish the European regulations message so EEA, UK and Swiss visitors get a consent banner.
5. Set `CONTACT_EMAIL` so the privacy page lists a contact.

Ads appear in one labelled slot per page: after each tool's results (before the explainer) and on the home page below the tool list. Space is reserved so the page doesn't jump when an ad loads. Calculator inputs stay out of the page address (only "Copy link" adds them), so ad scripts can't read them from the URL. The privacy policy is `privacy.html`; update it if you add other services.

## Run locally
```
npm run serve      # http://localhost:8080
npm test           # unit tests for all calculations
npm run launch-check   # lists anything still to set before launch
npm run ads-txt        # writes ads.txt from ADSENSE_CLIENT
```

## Deploy (GitHub Pages, free)
1. Merge this branch into `main`.
2. Go to repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` now runs the tests and, if they pass, deploys the site (`.github/workflows/pages.yml`).
4. For a custom domain, add a `CNAME` file containing the domain (e.g. `sortedmate.com.au`) and set the domain's DNS as GitHub Pages instructs.
Once you have a domain, run `npm run sitemap -- https://your-domain.com.au` and commit the result.
Then add the site to Google Search Console and submit `sitemap.xml`.

**After you change any file**, bump `VERSION` in `sw.js` so returning visitors get the update. Add new files to its `FILES` list too; `npm test` fails if one is missing. The comment at the top of `sw.js` explains how updates and offline fallback work.

The app icons in `img/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) are PNG renders of `img/icon.svg`. If you change the SVG, re-export them at those sizes; the maskable and Apple icons are full-bleed squares (no rounded corners), as those platforms apply their own mask.

## Editing page text
The How it works / FAQ / Related tools section of each tool page is generated from `scripts/content.py`. Edit the text there and run `python3 scripts/content.py`. It is safe to rerun.

## Adding a tool
1. Add an entry to `js/tools.js` (with `cat`, `meta`) and an icon to `js/icons.js`.
2. Create `tools/<slug>.html` (copy an existing page, including the content/FAQ section) and `js/pages/<slug>.js`. Keep the `<link rel="modulepreload">` lines in the page head matching the modules its scripts import (`npm test` checks this).
3. Put any maths in `js/calc.js` and add a test in `tests/calc.test.mjs`.
4. Add both files to `FILES` in `sw.js`.

## Rates to update every year (1 July)
| What | Where | Source |
|---|---|---|
| NSW transfer duty thresholds (CPI-indexed) | `NSW_BRACKETS`, `NSW_PREMIUM` in `js/calc.js` | Revenue NSW: How to calculate transfer duty |
| Income tax brackets (14% from 1 July 2027) | `TAX_BRACKETS` | ATO tax rates, Australian residents |
| Medicare levy low-income thresholds | `MEDICARE` | ATO: Medicare levy reduction for low-income earners |
| HECS/HELP repayment thresholds (indexed yearly) | `HELP` | ATO: Study and training loan minimum repayment income and rates |
| NSW public holidays (add next year's dates) | `NSW_HOLIDAYS`, `NSW_HOLIDAY_YEARS` | nsw.gov.au/about-nsw/public-holidays |
| Super guarantee rate and maximum contribution base | `SUPER_GUARANTEE`, `SUPER_MAX_BASE` | ATO: key superannuation rates and thresholds |

Last checked against official sources on 14 Oct 2026. The Medicare thresholds are the 2025-26 figures, the latest the ATO has published.
Rate tables also appear in the how-it-works text in `scripts/content.py` (stamp duty, take-home pay), so update them there too and rerun it.

The NSW first home buyer concession (homes $800k–$1m) uses a formula published by independent calculators. Revenue NSW doesn't publish it, so check it against their First Home Buyer calculator.

## Disclaimer
The financial calculators give general estimates only. They are not financial, tax or legal advice.
