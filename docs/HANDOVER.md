# Dinkum Calc: handover (22 Oct 2026)

The site runs itself. Hosting (GitHub Pages), HTTPS, analytics, ads and search indexing all work without
anyone touching them. This is what needs a person, and when.

## Accounts (all under dinkumcalc@gmail.com unless noted)
| Service | What it's for | Notes |
|---|---|---|
| VentraIP | Domain dinkumcalc.com.au (and dinkumcalc.site) | Auto Renew on. Keep the card current. |
| GitHub (vipulmadaan1-arch/project-1) | Site code and hosting | Every push to branch claude/website-brainstorm-build-vyvb36 tests and publishes the site. |
| Google Search Console | Google indexing and search data | Domain property, verified by a TXT record at VentraIP. Never delete that record. |
| Bing Webmaster Tools | Bing, DuckDuckGo, Yahoo | Sitemap read (49 pages). IndexNow pings Bing on every publish. |
| Google AdSense | Ads | Under review. Auto ads OFF. Consent message published. Ads appear by themselves once approved. |
| Cloudflare | Visitor analytics | Web Analytics. |
| Buy Me a Coffee | Tips | buymeacoffee.com/dinkumcalc (login: sortedmate.site@gmail.com). |

## Calendar
| When | What | Who |
|---|---|---|
| Any day | AdSense approval email. If rejected, note the reason; adding your name or ABN to the About page is the first fix to try. | You |
| 28 Oct 2026 | ABS September quarter CPI released. Optional: add it to js/cpi-data.js (the inflation calculator works without it). | Developer / Claude |
| ~12 Nov 2026 | Search Console > Pages: check indexed count grows. "Crawled - not indexed" for super and date calculator is normal early on. | You |
| 13 Nov 2026 | Senate report on the new-build bill (Tax Reform No. 3). Once passed, update js/rental.js and js/cgt.js notes. | Developer / Claude |
| ~31 Oct 2026, then monthly | Search Console > Performance > 28 days: searches with 20+ impressions at position 8-30 are the ones to improve. | You |
| 16 Apr 2027 | 6-month checkpoint: are clicks growing? If flat and nobody pays, consider pausing or selling. | You |
| May-July 2027 | ATO publishes 2026-27 working from home rate and Medicare levy low-income thresholds (currently estimates), and 2027-28 rates. Update js/rates.js and js/deductions.js. CI fails after 30 June 2027 until the new year is added (tests/rollover.test.mjs). | Developer / Claude |
| Dec 2027 | Add 2028 public holidays for all states to js/calc.js (HOLIDAYS) from fairwork.gov.au. | Developer / Claude |
| 30 June 2027 | NT house-and-land stamp duty exemption and NT EV car duty concession end (js/duty.js, js/motor-duty.js). | Developer / Claude |
| Before promoting the site | Tax agent review of tax refund, capital gains tax, rental cashflow, take-home pay and work deductions calculators. | You |

## Growth (biggest lever: links from other sites)
- Answer real questions on r/AusFinance, r/fiaustralia, Whirlpool, OzBargain. One relevant calculator link per answer, only when it helps. Never paste the same link around.
- Free listings: SourceBottle and a few Australian directories.
- Monetisation test: email 20 NSW conveyancers/accountants offering their logo on an embeddable stamp duty calculator for a monthly fee. Pass = 3+ interested.

## How to change anything
Rules for editing are in CLAUDE.md (sources, checks before pushing, where each rate lives). Every rate in the code
cites its official source and the date it was checked. Run `npm test` before publishing.
