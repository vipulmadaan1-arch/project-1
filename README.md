# Dinkum Calc

Free everyday tools on one site, as tiles, with a focus on Australian money calculators. It's a static site: no backend and no build step. Everything runs in the browser.

## Tools (16)
**Money:** Stamp Duty, all 8 states and territories · NSW Stamp Duty (2026/27) · Capital Gains Tax (2027 rules) · Take-Home Pay AU (2026-27) · Mortgage Repayments · Offset Account Savings · Rental Yield · Compound Interest · GST
**Everyday:** Calculator (basic and scientific) · Percentage · Unit Converter · Date Calculator
**Time:** World Clock (with time converter) · Stopwatch · Countdown Timer

## Design
- Type: one family, Instrument Sans (variable, 400–700), for headings, body and figures, the way production finance sites use a single grotesque (Stripe: Söhne; Wise: Wise Sans). Numbers use tabular figures (`--tnum`) wherever they update live or line up, and its tabular setting keeps the thousands comma narrow. No monospace or all-caps labels. A metric-matched Arial fallback prevents layout shift while the font loads. The fonts are self-hosted in `fonts/` (SIL Open Font License; see `fonts/LICENSE.txt`), so no request goes to Google and the site still works offline. To change the font, replace the file and recompute the fallback overrides in `css/style.css`.
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
2. **Site name:** change `SITE_NAME` in `js/config.js`, the `| Dinkum Calc` suffix in the page `<title>` tags, and `name`/`short_name` in `manifest.webmanifest`.

## Revenue
**Buy Me a Coffee:** set `BMC_URL` in `js/config.js`. The header button, footer link and the prompt under results appear automatically.

**Google AdSense:** off until configured. Once AdSense approves your site (you'll need your own domain):
1. In AdSense, create one responsive display ad unit.
2. Set `ADSENSE_CLIENT` (e.g. `ca-pub-1234567890123456`) and `ADSENSE_SLOT` (the unit's ID) in `js/config.js`.
3. Run `npm run ads-txt` and commit the generated `ads.txt` (it's deployed to the site root).
4. In AdSense → Privacy & messaging, publish the European regulations message so EEA, UK and Swiss visitors get a consent banner.
5. Set `CONTACT_EMAIL` so the privacy page lists a contact.

Ads appear in one labelled slot per page: after each tool's results (before the explainer) and on the home page below the tool list. Space is reserved so the page doesn't jump when an ad loads. Calculator inputs stay out of the page address (only "Copy link" adds them, after the `#`), so ad scripts can't read them from the URL. The privacy policy is `privacy.html`; update it if you add other services.

## Security
- Every page has a Content-Security-Policy `<meta>` tag, written by `npm run seo` (`csp()` in `scripts/seo.mjs`): the boot script's hash plus `'strict-dynamic'`, and `'self'` only for everything else (no eval, frames or form submissions; `base-uri 'none'`). Injected markup can't run scripts. Scripts are loaded by one small inline boot script whose hash is in the policy, so don't add `<script src>` tags or `onclick=` attributes; `npm test` checks this. Turning on AdSense widens the policy the next time `npm run seo` runs.
- Results links carry inputs after the `#`, which browsers never send to the server. Values from a link are checked against each field before use.
- GitHub Pages can't send security headers, so `frame-ancestors`, HSTS and other header-only protections aren't set. A proxy such as Cloudflare in front of the site can add them later.

## Run locally
```
npm run serve      # http://localhost:8080
npm test           # unit tests for all calculations
npm run launch-check   # lists anything still to set before launch
npm run ads-txt        # writes ads.txt from ADSENSE_CLIENT
npm run seo            # canonical/share tags, static tool links, sitemap.xml, robots.txt
```

## Deploy (GitHub Pages, free)
1. Merge this branch into `main`.
2. Go to repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` now runs the tests and, if they pass, deploys the site (`.github/workflows/pages.yml`).
4. For a custom domain, add a `CNAME` file containing the domain (e.g. `dinkumcalc.com.au`) and set the domain's DNS as GitHub Pages instructs.
5. Set `SITE_URL` in `js/config.js` (e.g. `'https://dinkumcalc.com.au'`), run `npm run seo`, bump `VERSION` in `sw.js` and commit. See **Search and sharing** below.
6. Add the site to Google Search Console and submit `sitemap.xml`.

**After you change any file**, bump `VERSION` in `sw.js` so returning visitors get the update, and run `node scripts/sw-hashes.mjs` (or `npm run seo`, which runs it) so the worker downloads only the files that changed. Add new files to its `FILES` list too; `npm test` fails if one is missing or a hash is stale. The comment at the top of `sw.js` explains how updates and offline fallback work.

The app icons in `img/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) are PNG renders of `img/icon.svg`. If you change the SVG, re-export them at those sizes; the maskable and Apple icons are full-bleed squares (no rounded corners), as those platforms apply their own mask.

## Search and sharing (SEO)
The domain is set in one place: `SITE_URL` in `js/config.js`. `npm run seo` (`scripts/seo.mjs`) reads it and writes:
- in every page's `<head>`, between `<!-- seo:start -->` and `<!-- seo:end -->`: the canonical link, Open Graph and Twitter card tags (share image `img/og.png`, 1200×630), BreadcrumbList structured data built from the page's visible breadcrumb, and WebSite structured data (site name) on the home page;
- the static tool tiles on the home and 404 pages, between `<!-- tiles:start -->` and `<!-- tiles:end -->`, so every tool has a plain link in the HTML before JavaScript runs;
- `sitemap.xml` (each page's `lastmod` is the date of its last commit) and `robots.txt`;
- the `<base>` of `404.html`, which GitHub Pages serves for any missing address.

Don't hand-edit between those markers. Rerun `npm run seo` after changing a page title or description, adding a tool, or changing `SITE_URL`. Until `SITE_URL` is set it writes only the tags that don't need an address. `npm test` checks that titles and descriptions are unique, every page has one `h1`, all JSON-LD parses, and (once `SITE_URL` is set) every page has the right canonical link and sitemap entry.

## Editing page text
The How it works / FAQ / Related tools section of each tool page is generated from `scripts/content.py`. Edit the text there and run `python3 scripts/content.py`. It is safe to rerun.

## Adding a tool
1. Add an entry to `js/tools.js` (with `cat`, `meta`) and an icon to `js/icons.js`.
2. Create `tools/<slug>.html` (copy an existing page, including the content/FAQ section, and change `data-module` on the boot script in `<head>` to `../js/pages/<slug>.js`) and `js/pages/<slug>.js`. Give it a unique `<title>` and meta description. `npm run seo` writes the `<link rel="modulepreload">` lines for the page module and every module it imports (`npm test` checks them).
3. Put any maths in `js/calc.js` and add a test in `tests/calc.test.mjs`.
4. Add both files to `FILES` in `sw.js`.
5. Run `python3 scripts/content.py` and `npm run seo`.

## Rates to update every year (1 July)
| What | Where | Source |
|---|---|---|
| NSW transfer duty thresholds (CPI-indexed) | `NSW_BRACKETS`, `NSW_PREMIUM` in `js/calc.js` | Revenue NSW: How to calculate transfer duty |
| Other states' transfer duty tables, home and first home rules, foreign surcharges | `STATES` and the tables above it in `js/duty.js`; update `DUTY_CHECKED` | Each state's revenue office (links in `source` per state) |
| CPI quarterly index (ABS, Sep 2025 = 100) for CGT indexation; add each quarter as published | `CPI` in `js/cgt.js` | ABS Consumer Price Index, All groups, weighted average of eight capital cities |
| "In Aussie terms" benchmarks: minimum wage (1 July), ABS earnings, Cotality rent and home values, MCG, ABS population, DCCEEW kangaroo counts | `BENCH` and `COUNTS` in `js/aussie.js` (each has its source and date) | Fair Work, ABS, Cotality, DCCEEW, AFL, MCC |
| Income tax brackets, Medicare levy thresholds, HECS/HELP bands, Medicare levy surcharge tiers, standard deduction, LITO, super guarantee, maximum contribution base and concessional cap, per income year; then `CURRENT_YEAR` | `YEARS` in `js/rates.js` (every engine reads them from there; each figure names its ATO page in `SOURCES`). `tests/rollover.test.mjs` fails 14 days after `CURRENT_YEAR` ends | ATO pages listed in `SOURCES` |
| NSW public holidays (add next year's dates) | `NSW_HOLIDAYS`, `NSW_HOLIDAY_YEARS` | nsw.gov.au/about-nsw/public-holidays |

Last checked against official sources on 14 Oct 2026. The Medicare thresholds are the 2025-26 figures, the latest the ATO has published.
Rate tables also appear in the how-it-works text in `scripts/content.py` (stamp duty, take-home pay), so update them there too and rerun it. Worked figures in the FAQs are recomputed from the engines by `tests/faq-figures.test.mjs`, so a rate change fails the tests until the text matches.

The NSW first home buyer concession (homes $800k–$1m) uses a formula published by independent calculators. Revenue NSW doesn't publish it, so check it against their First Home Buyer calculator.

Other figures marked as estimates on the all-states page: the Victorian first home buyer taper ($600k–$750k) and Northern Territory rates from $3 million. Check them against the SRO Victoria and Territory Revenue Office calculators each year. The FAQ's $750k comparison table in `scripts/content.py` is locked to the calculator by a test, so rate changes fail the build until the FAQ is updated.

## Disclaimer
The financial calculators give general estimates only. They are not financial, tax or legal advice.
