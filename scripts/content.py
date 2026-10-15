import json, re, html, sys, os
# Writes the How it works / FAQ / Related tools section and JSON-LD into each tools/*.html page.
# Edit the text in C below, then run: python3 scripts/content.py
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

C = {
'gross-up': dict(
 how="""<p>Tell us the take-home pay you want and we work backwards to the salary you'd need to earn. It uses exactly the same 2026-27 rates as our Take-Home Pay calculator: resident income tax, the low income tax offset, the Medicare levy and, if you tick it, compulsory HECS/HELP repayments. The calculator tries salaries until the take-home pay matches yours to the cent.</p>
<p>Employer super of 12% is paid on top of salary, so we also show your <strong>package</strong> (salary plus super). Tick <em>Show the answer as a package</em> if the job ads or offers you're comparing quote total pay including super.</p>""",
 faq=[("How much do I need to earn to take home $1,000 a week?","About $62,436 a year before tax in 2026-27. A HECS/HELP debt doesn't change that, because compulsory repayments only start above $69,528."),
      ("How much do I need to earn to take home $100,000 a year?","About $133,118 a year in 2026-27 with no HECS/HELP debt, or about $154,650 with one. Employer super of 12% is paid on top."),
      ("Why does each extra dollar of take-home pay cost more than a dollar of salary?","Every extra dollar you earn is taxed at your marginal rate (30% from $45,001), plus the 2% Medicare levy and, with a study loan, 15% to 17% for HECS/HELP. At $90,000 with no HELP debt, an extra $1,000 in your pocket needs about $1,471 more salary."),
      ("Does this include HECS/HELP?","Yes, if you tick “I have a HECS/HELP debt”. It uses the 2026-27 marginal repayment rates on salary only. The ATO uses repayment income, which can include fringe benefits and salary-sacrificed super."),
      ("What isn't included?","The Medicare levy surcharge, salary sacrifice, deductions and offsets other than the low income tax offset. Your payslip may differ slightly because employers use ATO withholding tables.")],
 related=['take-home-pay','hecs-help','capital-gains-tax','gst']),
'hecs-help': dict(
 how="""<p>Each year the ATO works out a compulsory repayment from your repayment income. From 2025-26 it's a marginal system: you only repay on income above the threshold.</p>
<table><thead><tr><th>Repayment income (2026-27)</th><th>Compulsory repayment</th></tr></thead><tbody>
<tr><td>$0 – $69,528</td><td>Nil</td></tr><tr><td>$69,529 – $129,717</td><td>15c for each $1 over $69,528</td></tr>
<tr><td>$129,718 – $186,050</td><td>$9,028 plus 17c for each $1 over $129,717</td></tr><tr><td>$186,051 and over</td><td>10% of total repayment income</td></tr></tbody></table>
<p>On 1 June each year the ATO adds <strong>indexation</strong> to debt that's more than 11 months old, at the lower of CPI and wage growth (2.8% on 1 June 2026). The calculator repeats this year by year using your pay rise. It treats voluntary repayments as made before 1 June and compulsory repayments as coming off after each tax return. Future indexation isn't known, so it uses the rate you enter. Repayment thresholds are held at 2026-27 values; they normally rise each year, so the real payoff may take a little longer.</p>""",
 faq=[("How is HECS/HELP indexation worked out?","On 1 June each year the ATO indexes the part of your debt that's more than 11 months old, at the lower of the Consumer Price Index and the Wage Price Index. It was 2.8% on 1 June 2026, 3.2% in 2025 and 4% in 2024."),
      ("What happened with the 20% HECS cut?","The Government cut study loan debts by 20%, based on your balance at 1 June 2025, before that year's indexation. The ATO applied it from November 2025. Your balance in myGov already includes it, so enter that figure."),
      ("Is it worth making voluntary HECS repayments?","It saves indexation and can shorten the time you're repaying, which the calculator shows. There's no interest beyond indexation, so paying off higher-interest debt or building an offset balance often comes first. To beat a 1 June indexation, the ATO needs your payment in time; in 2026 that meant paying by 26 May."),
      ("When do I have to start repaying HECS?","When your repayment income is above $69,528 in 2026-27. Below that there's no compulsory repayment, but indexation still applies each year."),
      ("Does my HECS debt get written off?","Not because of time or low income. HELP debts stay until repaid, apart from limited cases such as death or a special-circumstances cancellation.")],
 related=['take-home-pay','gross-up','compound-interest','offset']),
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
 related=['stamp-duty','mortgage','offset','rental-yield']),
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
 how="""<p>Switch between <strong>Basic</strong> for everyday sums and <strong>Scientific</strong> for trigonometry, logarithms, powers, roots and factorials. It follows the normal order of operations: brackets, then powers, then × and ÷, then + and −. So <em>−2²</em> is −4 and <em>2³²</em> (2^3^2) is 512.</p>
<p>Trig functions work in degrees or radians: tap the angle button to switch. A number next to a bracket, π or a function multiplies, so <em>2π</em> and <em>3 sin(30)</em> work as written. The % key divides by 100, so <em>50% × 200</em> = 100.</p>
<p>On a keyboard, use * for ×, / for ÷, ^ for powers, ! for factorial, Enter for equals, Backspace to delete and Esc to clear.</p>""",
 faq=[("Does it use degrees or radians?","Degrees by default, which suits most school and trade maths. Tap the Degrees button to switch to radians; your choice is remembered on this device."),
      ("Why does it say Math error?","The input has no real answer, such as the square root of a negative number, the log of 0, tan 90° or the factorial of a fraction."),
      ("Is anything I type saved or sent anywhere?","No. Everything runs in your browser. The tape of recent sums is cleared when you leave the page."),
      ("Why does 0.1 + 0.2 show 0.3?","Results are rounded to 15 significant digits to hide the tiny floating-point errors common in computer arithmetic. Very large and very small results are shown in scientific notation.")],
 related=['percentage','unit-converter','compound-interest','gst']),
'capital-gains-tax': dict(
 how="""<p>A capital gain is what you sell an asset for, less its <strong>cost base</strong>: the price plus buying costs, improvements and selling costs. The taxable part is added to your income for the year and taxed at your marginal rate, plus the Medicare levy. Your home is exempt.</p>
<p><strong>Until 30 June 2027</strong>, Australian residents who've held an asset for more than 12 months pay tax on only half the gain (the 50% CGT discount).</p>
<p><strong>From 1 July 2027</strong>, the Treasury Laws Amendment (Tax Reform No. 1) Act 2026 replaces the discount with two rules:</p>
<ul><li><strong>Indexation:</strong> the cost base grows with inflation (CPI, quarter by quarter, to 3 decimal places), so only the real gain is taxed. Indexation can reduce a gain to nil but can't create a loss.</li>
<li><strong>A 30% minimum tax:</strong> if your marginal rate on the gain is below 30%, you pay a top-up so the gain from 1 July 2027 is taxed at 30% at least (Medicare levy not counted). People receiving income support, such as the Age Pension or JobSeeker, are exempt.</li></ul>
<p><strong>Held across 1 July 2027?</strong> The asset is treated as sold and bought back at its value on that date. The gain to then keeps the 50% discount; growth after it is indexed and minimum-taxed. If you don't have a valuation, Treasury's draft method estimates one by assuming steady, compounding growth over the whole time you owned it.</p>
<p><strong>Newly built residential property</strong> can choose the 50% discount or indexation; this calculator picks whichever costs less. Foreign and temporary residents get neither the discount nor indexation.</p>""",
 faq=[("Does the new CGT apply to shares I already own?","Only to growth from 1 July 2027. Gains up to 30 June 2027 keep the 50% discount when you eventually sell, if you've held the asset for more than 12 months in total. For listed shares, the value at 30 June 2027 is their market price that day."),
      ("Is the new CGT law passed?","Yes. The Treasury Laws Amendment (Tax Reform No. 1) Act 2026 received Royal Assent on 26 June 2026. Some details are still being finalised, including the definition of a new build and the apportioning method, so the calculator says when it relies on them."),
      ("Will I pay more tax under the new rules?","It depends on inflation, how long you hold the asset and your income. Growth well above inflation is taxed more than under the 50% discount; slow growth in high inflation can be taxed less. The 30% minimum tax mainly affects people with lower incomes, such as retirees not on the Age Pension. The calculator shows both results side by side."),
      ("Why do I need to enter my other income?","Capital gains are added to your taxable income, so the tax depends on your marginal rate. A $50,000 gain costs much less for someone with no other income than for someone earning $200,000."),
      ("What isn't covered?","Partial main residence exemptions, small business concessions, assets bought before 21 September 1999 using frozen indexation, trusts and companies, and the Working Australians Tax Offset. Ask a registered tax agent if these apply to you.")],
 related=['take-home-pay','rental-yield','stamp-duty','compound-interest']),
'stamp-duty': dict(
 how="""<p>Each state and territory sets its own transfer (stamp) duty on property purchases, charged on the <strong>dutiable value</strong>: usually the higher of the price and the market value. Rates step up in brackets, and most states charge less if you'll live in the home or are buying your first home.</p>
<table><thead><tr><th>State</th><th>First home buyers</th><th>Foreign buyer surcharge</th></tr></thead><tbody>
<tr><td>NSW</td><td>No duty up to $800,000; reduced to $1 million</td><td>9%</td></tr>
<tr><td>VIC</td><td>No duty up to $600,000; reduced to $750,000</td><td>8%</td></tr>
<tr><td>QLD</td><td>New homes: no duty, no cap. Others: concession under $800,000</td><td>8%</td></tr>
<tr><td>SA</td><td>New homes and vacant land: no duty, no cap</td><td>7%</td></tr>
<tr><td>WA</td><td>No duty up to $600,000; reduced to $800,000</td><td>7%</td></tr>
<tr><td>TAS</td><td>Established-home exemption ended 30 June 2026</td><td>8%</td></tr>
<tr><td>ACT</td><td>No duty at any price under the Home Buyer Concession Scheme, if no buyer has owned property in 5 years</td><td>None</td></tr>
<tr><td>NT</td><td>No first home concession. Any buyer of a new house and land package from a builder pays no duty (to 30 June 2027)</td><td>None</td></tr>
</tbody></table>
<p>Rates and thresholds were checked against each state's revenue office on 15 October 2026. Tick <em>I'll live in it</em> for owner-occupier rates (Victoria up to $550,000, Queensland's home concession, the ACT owner-occupier scale and WA's concessional rate up to $200,000).</p>
<p><strong>Foreign buyers</strong> pay the surcharge on the full dutiable value, on top of duty and before any concession. First home relief needs at least one buyer who is an Australian citizen or permanent resident in every state except the ACT and NT, and from 1 August 2026 Queensland's home concession does too. With a joint purchase the surcharge applies only to the foreign buyer's share.</p>""",
 faq=[("Which state has the cheapest stamp duty?","It depends on price and who's buying. On a $750,000 investment property the duty is $22,200 in the ACT, $26,775 in Queensland, $27,937 in NSW, $28,935 in Tasmania, $29,741 in WA, $35,080 in South Australia, $37,125 in the NT and $40,070 in Victoria. First home buyers can pay nothing in several states, depending on price and whether the home is new."),
      ("Why does the new home box matter?","In Queensland and South Australia, first home buyers pay no duty on a new home regardless of price, but get less or no relief on an established home. In the NT, anyone buying a new house and land package from a builder to live in pays no duty, for contracts signed to 30 June 2027."),
      ("Can foreign buyers get first home buyer relief?","Not on their own, except in the ACT. NSW, Victoria, Queensland, South Australia, WA and Tasmania need at least one buyer to be an Australian citizen or permanent resident (New Zealand citizens on a special category visa usually count too). If you buy with one, the surcharge applies only to the foreign buyer's share, so check the exact figure with your state's revenue office."),
      ("Are any figures estimates?","Yes. Victoria's and NSW's first home buyer tapers, and NT rates above $3 million, use formulas published by independent calculators because the revenue offices don't publish them. The page tells you when a result uses one."),
      ("Does this cover commercial property or vacant land?","No. It covers residential purchases. Vacant land and commercial property often have different rules; check your state's revenue office.")],
 related=['stamp-duty-nsw','mortgage','offset','rental-yield']),
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
    name = re.search(r'<h1>(.*?)</h1>', s).group(1)
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
      {"@context":"https://schema.org","@type":"WebApplication","name":name,"description":desc,"inLanguage":"en-AU","isAccessibleForFree":True,"applicationCategory":"UtilitiesApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"AUD"}},
      {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":strip_tags(a)}} for q,a in c['faq']]},
    ]
    # Escape "</" so text in the FAQ can never close the script tag early.
    ldtag = '\n  <script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'
    s = s.replace('\n</head>', ldtag + '\n</head>')
    if BOOT not in s:
        sys.exit(f'{p} has no boot script. Copy the <head> of an existing tool page.')
    # Open Graph, canonical and breadcrumb tags are written by scripts/seo.mjs (between seo:start/end).
    open(p,'w').write(s)
    print('ok', slug)

if BOOT not in open('index.html').read():
    sys.exit('index.html has no boot script.')
