import json, re, html, sys, os
# Writes the How it works / FAQ / Related tools section and JSON-LD into each tools/*.html page.
# Edit the text in C below, then run: python3 scripts/content.py
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

C = {
'stamp-duty-nsw': dict(
 how="""<p>NSW transfer duty (stamp duty) is charged on a sliding scale on the property's <strong>dutiable value</strong> — the higher of the price you pay and the market value. Thresholds are indexed to CPI each year; the rate year is set by your contract date. This calculator uses the Revenue NSW 2026/27 rates.</p>
<table><thead><tr><th>Dutiable value</th><th>Duty</th></tr></thead><tbody>
<tr><td>$0 – $18,000</td><td>$1.25 per $100 (min $20)</td></tr>
<tr><td>$18,001 – $38,000</td><td>$225 + $1.50 per $100 over $18,000</td></tr>
<tr><td>$38,001 – $103,000</td><td>$525 + $1.75 per $100 over $38,000</td></tr>
<tr><td>$103,001 – $387,000</td><td>$1,662 + $3.50 per $100 over $103,000</td></tr>
<tr><td>$387,001 – $1,290,000</td><td>$11,602 + $4.50 per $100 over $387,000</td></tr>
<tr><td>Over $1,290,000</td><td>$52,237 + $5.50 per $100 over $1,290,000</td></tr>
<tr><td>Residential over $3,870,000 (premium)</td><td>$194,137 + $7.00 per $100 over $3,870,000</td></tr>
</tbody></table>
<p><strong>Example:</strong> a $750,000 home: $11,602 + ($750,000 − $387,000) × 4.5% = <strong>$27,937</strong>.</p>""",
 faq=[("Do first home buyers pay stamp duty in NSW?","Eligible first home buyers pay no transfer duty on a new or existing home valued at $800,000 or less, and get a reduced rate on homes valued under $1 million. Vacant land is exempt up to $350,000 with concessions under $450,000. Eligibility rules apply, including living in the home for 12 months."),
      ("How is the first home buyer concession worked out?","Between $800,000 and $1 million the discount shrinks evenly: full duty minus duty-on-$800,000 × ($1,000,000 − price) ÷ $200,000. On an $850,000 home that saves about $22,640. This formula comes from independent calculators, so confirm the figure with Revenue NSW."),
      ("What is the foreign purchaser surcharge?","Foreign persons buying residential-related property in NSW generally pay surcharge purchaser duty of 9% of the dutiable value, on top of normal transfer duty, unless an exemption applies."),
      ("When do the rates change?","NSW transfer duty thresholds are indexed to CPI and change each financial year from 1 July. The rate year that applies is based on your contract date."),
      ("Is this the exact amount I'll pay?","It's an estimate. Your conveyancer or solicitor confirms the final amount, which can depend on exemptions, concessions and how dutiable value is assessed.")],
 related=['mortgage','offset','rental-yield','take-home-pay']),
'take-home-pay': dict(
 how="""<p>Your take-home pay is your salary minus income tax and the Medicare levy. This calculator uses the 2026-27 resident tax rates, which cut the second bracket from 16% to 15% from 1 July 2026.</p>
<table><thead><tr><th>Taxable income</th><th>Tax rate (2026-27)</th></tr></thead><tbody>
<tr><td>$0 – $18,200</td><td>Nil</td></tr><tr><td>$18,201 – $45,000</td><td>15%</td></tr><tr><td>$45,001 – $135,000</td><td>30%</td></tr>
<tr><td>$135,001 – $190,000</td><td>37%</td></tr><tr><td>$190,001 and over</td><td>45%</td></tr></tbody></table>
<p>It then subtracts the <strong>low income tax offset</strong> (up to $700, phasing out by $66,667) and adds the <strong>Medicare levy</strong> of 2%, which is reduced for low incomes. Employer super of 12% is shown separately because it's paid on top of your salary, not out of it (unless you enter a package that includes super).</p>""",
 faq=[("Does this include HECS/HELP repayments?","Yes — tick “I have a HECS/HELP debt”. From 2025-26 repayments are marginal: nothing up to $69,528 in 2026-27, then 15c per dollar above that, rising to 17c above $129,717, and 10% of all income above $186,050. The ATO uses repayment income, which can include fringe benefits and salary-sacrificed super, so yours may be higher."),
      ("What isn't included?","The Medicare levy surcharge, salary sacrifice, deductions and offsets other than the low income tax offset."),
      ("What's the difference between salary and package?","A salary excludes super; your employer pays 12% super on top. A package (total remuneration) includes super, so your actual salary is lower. Tick “Salary includes super” if your figure is a package."),
      ("Why is my payslip slightly different?","Employers withhold tax using ATO tax tables per pay period, which round differently. Your final tax is settled when you lodge your return."),
      ("Is there a cap on super?","Yes. Super guarantee is only payable on earnings up to the maximum contribution base ($270,830 for 2026-27), which this calculator applies.")],
 related=['mortgage','compound-interest','gst','stamp-duty-nsw']),
'mortgage': dict(
 how="""<p>Repayments on a principal and interest loan are calculated with the standard amortisation formula: each repayment covers that period's interest and pays down some principal. Early on, most of each repayment is interest.</p>
<p><strong>Tip:</strong> paying fortnightly — half your monthly repayment every two weeks — means 26 half-payments a year, the equivalent of 13 monthly payments. That extra payment can cut years off a 30-year loan. This calculator shows the true fortnightly amount for the same term, so compare carefully.</p>""",
 faq=[("Does this include fees or LMI?","No. It covers principal and interest only, at a constant rate. Lender fees, lenders mortgage insurance and rate changes aren't included."),
      ("What about interest-only loans?","Interest-only repayments are simply loan amount × rate ÷ repayments per year. This calculator covers principal and interest loans."),
      ("How much will I save with an offset account?","Use the offset account calculator to see interest and time saved with a given offset balance.")],
 related=['offset','stamp-duty-nsw','rental-yield','take-home-pay']),
'offset': dict(
 how="""<p>An offset account is a transaction account linked to your home loan. Its balance is subtracted from your loan balance before interest is calculated, so $50,000 in offset on a $600,000 loan means you're charged interest on $550,000.</p>
<p>Because your repayment stays the same, more of each payment goes to principal and the loan finishes early. This calculator compares the loan with and without the offset to show interest and time saved.</p>""",
 faq=[("Is an offset better than extra repayments?","Financially they save the same interest. An offset keeps your money accessible; extra repayments may be harder to withdraw (redraw rules vary by lender)."),
      ("Does the calculator assume my offset balance changes?","No, it assumes a constant balance. In practice your balance moves with your pay and spending."),
      ("Is offset interest saving taxable?","Interest saved through an offset isn't income, so it isn't taxed — unlike interest earned in a savings account. Check your own situation with a tax professional.")],
 related=['mortgage','compound-interest','stamp-duty-nsw','rental-yield']),
'rental-yield': dict(
 how="""<p><strong>Gross yield</strong> = annual rent ÷ purchase price × 100. It's the quick comparison figure used in listings.</p>
<p><strong>Net yield</strong> = (annual rent after vacancy − annual costs) ÷ purchase price × 100. It's a better guide to what the property actually earns before mortgage interest and tax.</p>
<p><strong>Example:</strong> $520/week on a $550,000 property is $27,040 a year — a 4.92% gross yield.</p>""",
 faq=[("What costs should I include?","Council and water rates, landlord insurance, strata levies, property management fees, repairs and maintenance, and land tax if it applies."),
      ("Does this include mortgage repayments?","No. Yield measures the property's return on its price. Use the mortgage calculator for repayments and consider your cash flow separately."),
      ("What's a good rental yield?","It depends on the location, property type and growth prospects. Higher-yield areas often have lower capital growth, and vice versa.")],
 related=['mortgage','stamp-duty-nsw','offset','compound-interest']),
'compound-interest': dict(
 how="""<p>Compound interest means you earn interest on your interest. The balance grows by <em>A = P(1 + r/n)<sup>nt</sup></em>, where P is the starting amount, r the annual rate, n the compounding periods per year and t the years. Regular deposits are added each period.</p>
<p>The year-by-year table shows how much of your balance comes from deposits and how much from interest — over long periods, interest usually overtakes deposits.</p>""",
 faq=[("Does compounding frequency matter much?","A little. Daily compounding earns slightly more than monthly, and monthly slightly more than annually, at the same rate. Time and rate matter far more."),
      ("Does this include tax?","No. Interest earned in a savings account is taxable income in Australia. Results also ignore fees and rate changes."),
      ("Can I use this for investments?","Yes, as a rough guide with an expected average return — but investment returns vary year to year and aren't guaranteed.")],
 related=['offset','take-home-pay','percentage','mortgage']),
'gst': dict(
 how="""<p>Australia's GST rate is 10%.</p>
<ul><li><strong>Add GST:</strong> price × 1.1. $100 + GST = $110.</li>
<li><strong>Remove GST:</strong> price ÷ 1.1. $110 includes $10 GST.</li>
<li><strong>GST in a GST-inclusive price:</strong> price ÷ 11. For $220, GST is $20.</li></ul>
<p>A common mistake is taking 10% off a GST-inclusive price — $110 − 10% = $99, not $100.</p>""",
 faq=[("Why divide by 11?","Because a GST-inclusive price is 110% of the base price, GST is 10/110 = 1/11 of the total."),
      ("Do I need to charge GST?","Generally, businesses must register for GST when their GST turnover is $75,000 or more. Check the ATO for your situation.")],
 related=['percentage','calculator','take-home-pay','compound-interest']),
'percentage': dict(
 how="""<ul><li><strong>X% of Y</strong> = X ÷ 100 × Y. 15% of 200 = 30.</li>
<li><strong>X is what % of Y</strong> = X ÷ Y × 100. 30 is 25% of 120.</li>
<li><strong>Percentage change</strong> = (new − old) ÷ old × 100. From 80 to 100 is +25%.</li></ul>
<p>Note that a 25% increase followed by a 25% decrease doesn't get you back to where you started: 80 → 100 → 75.</p>""",
 faq=[("How do I add a percentage to a number?","Multiply by (1 + percent ÷ 100). To add 15% to 200: 200 × 1.15 = 230."),
      ("What's the difference between percent and percentage points?","If a rate goes from 5% to 6%, it rose by 1 percentage point, which is a 20% increase.")],
 related=['gst','calculator','compound-interest','unit-converter']),
'calculator': dict(
 how="""<p>A simple, fast calculator that follows the normal order of operations — brackets first, then × and ÷, then + and −. Type directly on your keyboard: use * for ×, / for ÷, Enter for equals, Backspace to delete and Esc to clear.</p>
<p>The % key divides by 100, so <em>50% × 200</em> = 100.</p>""",
 faq=[("Is anything I type saved or sent anywhere?","No. Everything runs in your browser."),
      ("Why does 0.1 + 0.2 show 0.3?","Results are rounded to 12 decimal places to hide floating-point errors common in computer arithmetic.")],
 related=['percentage','gst','unit-converter','date-calculator']),
'unit-converter': dict(
 how="""<p>Convert between metric and imperial units for length, mass, volume, area, speed and temperature. Australia uses metric, but you'll still meet feet, pounds and Fahrenheit in recipes, specs and overseas listings.</p>
<p>Australian real estate sometimes quotes house size in <strong>squares</strong> — one square is 100 square feet, or about 9.29 m².</p>""",
 faq=[("Is a cup the same everywhere?","No. This converter uses the Australian metric cup of 250 mL. A US cup is about 237 mL."),
      ("How do I convert Celsius to Fahrenheit?","°F = °C × 9/5 + 32. So 25 °C is 77 °F.")],
 related=['calculator','percentage','date-calculator','world-clock']),
'date-calculator': dict(
 how="""<p>Count the days between two dates, including a breakdown into years, months and days, weeks, and business days (Monday to Friday). You can also add or subtract days from a date — handy for notice periods, settlement dates and deadlines.</p>
<p>Business days skip weekends and NSW public holidays — useful for settlement periods and notice periods.</p>
<p>By default the end date isn't counted (1 Jan to 2 Jan is 1 day). Tick “Include the end date” to count both.</p>""",
 faq=[("Are public holidays excluded from business days?","Yes, NSW statewide public holidays for 2026 and 2027 are excluded when the box is ticked. Local public holidays and the August Bank Holiday aren't included, and other states' holidays differ."),
      ("Does daylight saving affect the count?","No. Dates are counted as whole calendar days, so daylight saving changes don't cause off-by-one errors.")],
 related=['world-clock','timer','calculator','stopwatch']),
'world-clock': dict(
 how="""<p>See the current time in cities around the world, with the difference from your own time. Add cities you call or work with often — your list is saved on this device.</p>
<p>To plan a call, use <strong>Convert a time</strong>: pick a date and time in any city, and every clock shows what time that will be there. Daylight saving is handled automatically, including the different change-over dates in Australia, Europe and North America.</p>""",
 faq=[("Why does the time difference change during the year?","Daylight saving starts and ends on different dates in different countries — and Queensland, the NT and WA don't use it at all — so the gap between two cities can shift by an hour."),
      ("Which time zone is Newcastle NSW in?","Newcastle uses Sydney time: AEST (UTC+10), or AEDT (UTC+11) during daylight saving.")],
 related=['date-calculator','timer','stopwatch','calculator']),
'stopwatch': dict(
 how="""<p>A precise online stopwatch with lap times. Each lap shows the split time and the total. It keeps accurate time even if you switch tabs.</p>
<p>Keyboard shortcuts: <strong>Space</strong> to start or pause, <strong>L</strong> to record a lap.</p>""",
 faq=[("Does it keep running if I switch tabs?","Yes. It measures elapsed time from the clock, so the time stays accurate when you come back."),
      ("Are my laps saved?","No. Laps clear when you reset or leave the page.")],
 related=['timer','world-clock','date-calculator','calculator']),
'timer': dict(
 how="""<p>Set hours, minutes and seconds, or tap a preset, then press Start. An alarm sounds and the time flashes when it reaches zero. The remaining time also shows in your browser tab, so you can keep an eye on it while working elsewhere.</p>
<p>The 25-minute preset suits the Pomodoro technique: 25 minutes of focus, then a short break.</p>""",
 faq=[("Why didn't the alarm make a sound?","Some browsers block audio until you interact with the page, and phones may mute it in silent mode. Make sure your volume is on."),
      ("Does it work in the background?","Yes, it's based on the clock time, so it stays accurate. Some phones pause background tabs to save battery, though.")],
 related=['stopwatch','world-clock','date-calculator','calculator']),
}

names = {}
src = open('js/tools.js').read()
for slug, name in re.findall(r"slug: '([^']+)', name: '([^']+)'", src): names[slug]=name

# Every page's <head> has the Content-Security-Policy meta tag and one inline boot script
# (theme + page script loader). Its hash is in the policy; npm test checks they match.
BOOT = "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){};(function(m){function go(){var s=document.createElement('script');s.type='module';s.src=m;document.head.appendChild(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})(document.currentScript.getAttribute('data-module'))"

def strip_tags(s): return re.sub(r'<[^>]+>', '', s)

for slug, c in C.items():
    p = f'tools/{slug}.html'; s = open(p).read()
    s = re.sub(r'\n    <!-- content:start -->.*?<!-- content:end -->', '', s, flags=re.S)
    s = re.sub(r'\n  <script type="application/ld\+json">.*?</script>', '', s, flags=re.S)
    title = re.search(r'<title>(.*?) \|', s).group(1)
    desc = re.search(r'<meta name="description" content="(.*?)">', s).group(1)
    faq_html = ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q,a in c['faq'])
    rel = ''.join(f'<a href="{r}.html">{names[r]}</a>' for r in c['related'])
    block = f'''
    <!-- content:start -->
    <section class="content">
      <h2>How it works</h2>
      {c['how']}
      <h2>Frequently asked questions</h2>
      {faq_html}
      <h2>Related tools</h2>
      <nav class="related">{rel}</nav>
    </section>
    <!-- content:end -->'''
    s = s.replace('\n  </main>', block + '\n  </main>')
    ld = [
      {"@context":"https://schema.org","@type":"WebApplication","name":title,"description":desc,"applicationCategory":"UtilitiesApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"AUD"}},
      {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":strip_tags(a)}} for q,a in c['faq']]},
    ]
    # Escape "</" so text in the FAQ can never close the script tag early.
    ldtag = '\n  <script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'
    s = s.replace('\n</head>', ldtag + '\n</head>')
    if BOOT not in s:
        sys.exit(f'{p} has no boot script. Copy the <head> of an existing tool page.')
    if 'og:title' not in s:
        s = s.replace('  <link rel="stylesheet"', f'  <meta property="og:title" content="{title}">\n  <meta property="og:description" content="{desc}">\n  <meta property="og:type" content="website">\n  <link rel="stylesheet"', 1)
    open(p,'w').write(s)
    print('ok', slug)

if BOOT not in open('index.html').read():
    sys.exit('index.html has no boot script.')
