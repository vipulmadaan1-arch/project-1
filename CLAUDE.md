# Working notes for Claude

## Web research
Use research tools in this order, moving to the next only when the current one is exhausted or failing. The order
comes from a side-by-side test on 15 Oct 2026 (same ATO page and same search on each tool):
- TinyFish: live page with every table intact in ~2s; search put Revenue NSW (official) first of 10 results.
- Tavily: complete page but a stale cached copy (ATO "last updated 30 June" vs live "13 Oct"); official page only
  6th in search; frequent 429 rate limits. Always check the page's last-updated date against a live fetch.
- Apify (rag-web-browser): ATO fetch failed; search took 14s, returned Google redirect URLs, 1 of 3 pages failed.
- Firecrawl: couldn't be tested (out of credits).
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
