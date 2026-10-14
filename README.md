# ToolTiles

Free everyday tools on one site, as tiles, with a focus on Australian money calculators. It's a static site: no backend and no build step. Everything runs in the browser.

## Tools
Calculator · Stopwatch · Countdown Timer · World Clock · Compound Interest · Mortgage Repayments · Offset Account Savings · NSW Stamp Duty (2026/27) · Take-Home Pay AU (2026-27) · Unit Converter

On the home page, users tap ☆ to pin favourites. Pins are saved in the browser.

## Setup
1. **Buy Me a Coffee:** create an account at buymeacoffee.com, then set `BMC_URL` in `js/config.js`.
2. **Site name:** change `SITE_NAME` in `js/config.js`, and the `| ToolTiles` suffix in the page `<title>` tags.

## Run locally
```
npm run serve      # http://localhost:8080
npm test           # unit tests for all calculations
```

## Deploy (GitHub Pages, free)
Repo **Settings → Pages → Deploy from a branch** → pick the branch and `/ (root)`.
Then add the site to Google Search Console so Google can index it.

## Adding a tool
1. Add an entry to `js/tools.js`.
2. Create `tools/<slug>.html` (copy an existing page) and `js/pages/<slug>.js`.
3. Put any maths in `js/calc.js` and add a test in `tests/calc.test.mjs`.

## Rates to update every year (1 July)
| What | Where | Source |
|---|---|---|
| NSW transfer duty thresholds (CPI-indexed) | `NSW_BRACKETS`, `NSW_PREMIUM` in `js/calc.js` | Revenue NSW: How to calculate transfer duty |
| Income tax brackets (14% from 1 July 2027) | `TAX_BRACKETS` | ATO tax rates, Australian residents |
| Medicare levy low-income thresholds | `MEDICARE` | ATO: Medicare levy reduction for low-income earners |
| Super guarantee rate | `SUPER_GUARANTEE` | ATO |

Last checked 14 Oct 2026. The Medicare thresholds are the 2025-26 figures, the latest the ATO has published.

## Disclaimer
The financial calculators give general estimates only. They are not financial, tax or legal advice.
