# Working notes for Claude

## Web research
Use research tools in this order, moving to the next only when the current one is exhausted or failing:
1. Firecrawl MCP (account has ~1,000 credits; switch when it reports credits/quota exhausted)
2. TinyFish MCP (search, fetch_content; it runs a cloud browser, so it reaches sites this environment's network blocks)
3. Tavily MCP (rate-limits with HTTP 429; space calls out)

Don't call Apify actors: the owner won't approve them.

Prefer official sources (ATO, budget.gov.au, Treasury, state revenue offices, ABS, legislation sites). Tag every
rate in code comments and page text with where it came from; anything not from an official source is an estimate
and the page must say so.

## Checks before pushing
- `node --test tests/*.test.mjs`
- After editing `scripts/content.py` run `python3 scripts/content.py` then `node scripts/seo.mjs`
- New files go in the `FILES` list in `sw.js`; bump `VERSION` on every change
