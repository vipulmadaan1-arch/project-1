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

Ads appear in one labelled slot per page: after each tool's results (before the explainer) and on the home page below the tool list. Space is reserved so the page doesn't jump when an ad loads. Calculator inputs stay out of the page address (only "Copy link" adds them, after the `#`), so ad scripts can't read them from the URL. The privacy policy is `privacy.html`; update it if you add other services.

## Security
- Every page has a Content-Security-Policy `<meta>` tag in the form Google supports for AdSense (a hash plus `'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`). Injected markup can't run scripts. Scripts are loaded by one small inline boot script whose hash is in the policy, so don't add `<script src>` tags or `onclick=` attributes; `npm test` checks this. If you change the boot script, update the hash in every page (the test prints the new one).
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
4. For a custom domain, add a `CNAME` file containing the domain (e.g. `sortedmate.com.au`) and set the domain's DNS as GitHub Pages instructs.
5. Set `SITE_URL` in `js/config.js` (e.g. `'https://sortedmate.com.au'`), run `npm run seo`, bump `VERSION` in `sw.js` and commit. See **Search and sharing** below.
6. Add the site to Google Search Console and submit `sitemap.xml`.

**After you change any file**, bump `VERSION` in `sw.js` so returning visitors get the update. Add new files to its `FILES` list too; `npm test` fails if one is missing.

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
2. Create `tools/<slug>.html` (copy an existing page, including the content/FAQ section, and change `data-module` on the boot script in `<head>` to `../js/pages/<slug>.js`) and `js/pages/<slug>.js`. Give it a unique `<title>` and meta description.
3. Put any maths in `js/calc.js` and add a test in `tests/calc.test.mjs`.
4. Add both files to `FILES` in `sw.js`.
5. Run `python3 scripts/content.py` and `npm run seo`.

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
