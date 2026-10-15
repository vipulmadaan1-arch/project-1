# Working notes for Claude

## Web research
Use research tools in this order, moving to the next only when the current one is exhausted or failing:
1. TinyFish MCP: `search` and `fetch_content` are free and return full pages with tables intact, including sites
   this environment's network blocks. Its browser automation (`run_web_automation*`) is paid per step from a small
   wallet: use it only when fetch_content can't get the content (e.g. a calculator that only renders after input).
2. Tavily MCP (rate-limits with HTTP 429; space calls out)
3. Apify MCP: actors cost money per run, so use one only when 1 and 2 can't get the data, pick a well-used actor,
   and keep inputs small. The owner isn't always around to approve prompts; if a call is denied, carry on without it.
4. Firecrawl MCP (out of credits as of 15 Oct 2026; use only if it has been topped up)

Prefer official sources (ATO, budget.gov.au, Treasury, state revenue offices, ABS, legislation sites). Tag every
rate in code comments and page text with where it came from; anything not from an official source is an estimate
and the page must say so.

## Checks before pushing
- `node --test tests/*.test.mjs`
- After editing `scripts/content.py` run `python3 scripts/content.py` then `node scripts/seo.mjs`
- New files go in the `FILES` list in `sw.js`; bump `VERSION` on every change
