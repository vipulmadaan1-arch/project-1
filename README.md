# ToolTiles

Free everyday tools on one site, as tiles, with a focus on Australian money calculators. It's a static site: no backend and no build step. Everything runs in the browser.

## Tools (14)
**Money:** NSW Stamp Duty (2026/27) · Take-Home Pay AU (2026-27) · Mortgage Repayments · Offset Account Savings · Rental Yield · Compound Interest · GST
**Everyday:** Calculator · Percentage · Unit Converter · Date Calculator
**Time:** World Clock (with time converter) · Stopwatch · Countdown Timer

## Features
- Pin favourite tiles on the home page. Pins are saved in the browser.
- Calculators save their inputs in the URL, so "Copy link" shares the exact results.
- Works offline after the first visit (service worker) and can be installed as an app.
- Each tool page has a how-it-works section, FAQs and structured data (JSON-LD) for search engines.
- Light and dark mode.

## Setup
1. **Buy Me a Coffee:** create an account at buymeacoffee.com, then set `BMC_URL` in `js/config.js`. Until then all coffee links stay hidden, so the site can go live without them.
2. **Site name:** change `SITE_NAME` in `js/config.js`, and the `| ToolTiles` suffix in the page `<title>` tags.

## Run locally
```
npm run serve      # http://localhost:8080
npm test           # unit tests for all calculations
npm run launch-check   # lists anything still to set before launch
```

## Deploy (GitHub Pages, free)
1. Merge this branch into `main`.
2. Go to repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` now runs the tests and, if they pass, deploys the site (`.github/workflows/pages.yml`).
4. For a custom domain, add a `CNAME` file containing the domain (e.g. `tooltiles.com.au`) and set the domain's DNS as GitHub Pages instructs.
Once you have a domain, run `npm run sitemap -- https://your-domain.com.au` and commit the result.
Then add the site to Google Search Console and submit `sitemap.xml`.

**After you change any file**, bump `VERSION` in `sw.js` so returning visitors get the update. Add new files to its `FILES` list too; `npm test` fails if one is missing.

## Editing page text
The How it works / FAQ / Related tools section of each tool page is generated from `scripts/content.py`. Edit the text there and run `python3 scripts/content.py`. It is safe to rerun.

## Adding a tool
1. Add an entry to `js/tools.js`.
2. Create `tools/<slug>.html` (copy an existing page, including the content/FAQ section) and `js/pages/<slug>.js`.
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
