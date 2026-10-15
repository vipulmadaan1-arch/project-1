import json, re, html, sys, os
from datetime import datetime
# Writes the How it works / FAQ / Related tools section and JSON-LD into each tools/*.html page.
# Edit the text in C below, then run: python3 scripts/content.py
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

C = {
'lmi': dict(
 how="""<p><strong>Lenders mortgage insurance (LMI)</strong> protects the lender, not you, if you borrow more than 80% of the property's value (an LVR over 80%). It's a one-off premium, paid at settlement or added to the loan, and it rises steeply with the LVR and the loan size.</p>
<p>Premiums are set by each lender and insurer (Helia and QBE), and no government body publishes them. This calculator uses the <strong>full-doc premium table of one lender, published by Home Loan Experts</strong> (updated May 2026), so treat the result as an <strong>estimate</strong>: your lender's quote can differ by thousands.</p>
<p>Most states charge duty on the premium: Victoria, WA, Tasmania and the NT 10%, Queensland 9% and South Australia 11%. NSW exempts LMI premiums paid from 1 July 2017, and the ACT has abolished insurance duty.</p>
<p>The <strong>Australian Government 5% Deposit Scheme</strong> (formerly the Home Guarantee Scheme) lets first home buyers borrow with a 5% deposit and <strong>no LMI</strong>, with no income caps since 1 October 2025, under price caps such as $1.5 million in Sydney and regional NSW centres, $950,000 in Melbourne and Geelong, $1 million in Brisbane, the Gold Coast, the Sunshine Coast and the ACT, $900,000 in Adelaide, $850,000 in Perth, $750,000 in Darwin and $700,000 in Hobart.</p>""",
 faq=[("How much is LMI on a $600,000 home?","About $11,772 with a 10% deposit in NSW, which charges no duty on LMI. With a 5% deposit it's about $22,788, and with 15% about $5,942. In Victoria, 10% duty brings those to $12,949, $25,067 and $6,536. These are estimates from one lender's published table; your quote can differ."),
      ("Which states charge stamp duty on LMI?","Victoria, WA, Tasmania and the NT charge 10% of the premium, Queensland 9% and South Australia 11%. NSW has exempted LMI premiums paid from 1 July 2017, and the ACT has abolished duty on insurance."),
      ("Can I avoid LMI with less than a 20% deposit?","Yes, if you qualify for the Australian Government 5% Deposit Scheme: first home buyers with at least a 5% deposit (2% for single parents), buying under the price cap for the area, with no income test since 1 October 2025. A family guarantee, or some lenders' waivers for professions like doctors and nurses, can also avoid it."),
      ("Should I add LMI to my loan?","It saves cash upfront, but you pay interest on it for the life of the loan, and it raises your LVR, which some lenders cap. Paying it upfront costs less overall if you can afford it."),
      ("Why is LMI so much higher at 95% than 90%?","The insurer's risk jumps with a thin deposit. On a $600,000 home, LMI goes from about $11,772 at 90% LVR to about $22,788 at 95% (NSW, no duty), because the rate almost doubles and applies to a bigger loan.")],
 related=['upfront-costs','stamp-duty','borrowing-power','mortgage']),
'upfront-costs': dict(
 how="""<p>Buying a home takes more cash than the deposit. This adds up the <strong>deposit</strong>, <strong>stamp duty</strong> (with home and first home buyer concessions), the land titles office fees to <strong>register the transfer</strong> and <strong>register the mortgage</strong>, an estimate of <strong>lenders mortgage insurance</strong> if you borrow more than 80%, and typical <strong>conveyancing, building and pest inspection and loan application</strong> costs that you can change.</p>
<p>Stamp duty and registration fees are 2026-27 government rates, checked 15 Oct 2026. Registration fees for 2026-27: NSW $182.73 for the transfer and $182.73 for the mortgage; Queensland $248.04 plus $46.56 per $10,000 over $180,000 for the transfer, and $248.04 for the mortgage; South Australia's transfer fee rises $105 per $10,000; Tasmania $256.76 and $167.58; the ACT $496 and $184; WA's mortgage fee is $225.10.</p>
<p>Some fees are estimates because the office publishes only a calculator or document: Victoria's transfer and mortgage fees, WA's transfer fee and South Australia's mortgage fee. Northern Territory registration fees aren't included. LMI and the typical costs are estimates too, not quotes.</p>""",
 faq=[("How much cash do I need to buy a $750,000 home in NSW?","About $122,080 with a 10% deposit: the $75,000 deposit plus $47,080 in costs. That's $27,937 stamp duty, $365 in registration fees, about $15,977 LMI and $2,800 for conveyancing, inspection and loan fees. A first home buyer using the 5% Deposit Scheme pays no duty and no LMI, so needs about $40,665 with a 5% deposit."),
      ("What are the upfront costs besides the deposit?","Stamp duty is usually the biggest. Then come the transfer and mortgage registration fees, LMI if your deposit is under 20%, conveyancing, a building and pest inspection and any loan application fee. On a $650,000 Queensland home with a 10% deposit they come to about $34,485."),
      ("How much are title registration fees in 2026-27?","In NSW, $182.73 each to register the transfer and the mortgage. In Queensland the transfer is $248.04 plus $46.56 per $10,000 over $180,000 ($2,436 on $650,000), plus $248.04 for the mortgage. Victoria's and South Australia's transfer fees also rise with the price."),
      ("Can I add LMI to my loan to need less cash?","Usually, yes. Tick the box to move LMI out of your cash total and into the loan. You'll pay interest on it, and it raises your loan amount."),
      ("Are the conveyancing and inspection costs accurate?","They're typical amounts, not quotes: $1,800 for conveyancing and legal, $600 for a building and pest inspection and $400 for a loan application fee. Change them to match your quotes; many lenders charge no application fee.")],
 related=['stamp-duty','lmi','borrowing-power','mortgage']),
'retirement': dict(
 how="""<p>The calculator projects your super year by year to your retirement age. Each year your employer pays <strong>12%</strong> of your salary (up to the maximum contribution base), plus any salary sacrifice. Your fund takes <strong>15% contributions tax</strong>. Salary sacrifice is cut back if your employer super plus sacrifice would go over the <strong>$32,500 concessional cap</strong>. Earnings are taxed at an assumed effective <strong>7%</strong>, then fees come off. Salary grows 3.7% a year by default (Moneysmart's 2.5% inflation plus 1.2% for rising living standards).</p>
<p>Results are in <strong>today's dollars</strong>: future balances are divided by inflation (2.5% by default) so you can compare them with prices now. With the defaults (age 35, $80,000 in super, $90,000 salary), you'd retire at 67 with about $827,116 in today's dollars, or $1,822,763 in 2058 dollars. Moneysmart also takes off the 1.2% for rising living standards, which would show $569,915.</p>
<p>In retirement we draw your chosen income at the start of each year. The balance keeps earning the same return after fees, with no tax on earnings (an assumption for a retirement-phase pension). The <strong>ASFA Retirement Standard</strong> (June quarter 2026) puts a comfortable retirement at $56,166 a year for a single homeowner and $78,998 for a couple, and a modest one at $36,548 and $52,690. The Age Pension (from age 67) isn't included, so super alone runs out sooner than your full retirement income would.</p>""",
 faq=[("How much super do I need to retire comfortably?","ASFA says $630,000 for a single homeowner and $730,000 for a couple at 67, in today's dollars. That assumes you also get a part Age Pension and spend the whole balance. On its own, without the pension, $630,000 drawing $56,166 a year lasts about 14 years here."),
      ("How long will my super last?","It depends on the income you draw and your returns. With the default inputs, $827,116 at 67 drawing ASFA's comfortable $56,166 a year lasts about 20 years, to age 87, before any Age Pension."),
      ("How much difference does salary sacrifice make?","With the defaults, an extra $5,000 a year (rising with wages) adds about $278,063 in today's dollars by 67, after the 15% contributions tax. Your employer super plus sacrifice must stay within the $32,500 concessional cap."),
      ("Do fees really matter?","Yes. With the defaults, an extra 0.5% a year in fees leaves you about $80,047 less at 67 in today's dollars. Compare your fund's fees and costs summary with Moneysmart's defaults of $59 a year plus 0.11%."),
      ("When can I get my super and the Age Pension?","You can usually take your super from 60 (your preservation age, if you were born after 30 June 1964) once you retire, or at 65 even if you keep working. The Age Pension starts at 67 and is means-tested. Check your rate with Services Australia.")],
 related=['super','take-home-pay','compound-interest','inflation']),
'budget': dict(
 how="""<p>Enter your take-home pay and each cost at whatever frequency you pay it: weekly, fortnightly, monthly, quarterly or yearly. Everything is converted to a yearly figure (52 weeks or 26 fortnights a year, as Moneysmart's budget planner does) and then shown per week, fortnight, month or year. So $100 a week is $433.33 a month, and $2,000 a month is $461.54 a week.</p>
<p>The main result is what's <strong>left over</strong> (or your <strong>shortfall</strong>) after spending and savings. The table lists each category from largest to smallest with its share of your income. With the example figures ($1,800 a week take-home pay), $5,893.33 of the $7,800.00 a month is spent or saved, leaving $1,906.67.</p>
<p>The <strong>50/30/20 rule</strong> is a popular rule of thumb, not an official standard: about half of take-home pay on needs, 30% on wants and 20% on savings and extra debt repayments. In the example, needs take 60.3%, wants 8.9% and savings 6.4%. Your figures stay in your browser and only go into a link if you choose Copy link.</p>""",
 faq=[("How do I convert weekly to monthly?","Multiply by 52 and divide by 12, so $100 a week is $433.33 a month. Multiplying by 4 understates it, because most months are a little over 4 weeks."),
      ("What is the 50/30/20 rule?","A rule of thumb, not an official guideline: about 50% of take-home pay on needs, 30% on wants and 20% on savings and extra debt repayments. In the example budget, needs take 60.3%, which is common where housing is expensive."),
      ("Should savings count as spending?","Here, yes. Treat savings as a bill you pay yourself. In the example, $500 a month in savings is 6.4% of income, and putting the $1,906.67 left over into savings would bring it to 30.9%."),
      ("Where are my numbers saved?","Only in your browser while the page is open. Copy link puts them after the # in the address, which isn't sent to our server, so you can bookmark or share them."),
      ("What if I have a shortfall?","Start with the biggest lines in the table. If bills are hard to pay, free financial counselling is available; Moneysmart lists how to get it.")],
 related=['take-home-pay','savings-goal','credit-card','compound-interest']),
'tax-refund': dict(
 how="""<p>Your refund is the tax your employer withheld minus the tax you actually owe for the year. We add your salary, interest, dividends and franking credits, take off your deductions to get your <strong>taxable income</strong>, then work out income tax at Australian resident rates, take off the <strong>low income tax offset</strong> (up to $700, phasing out by $66,667), and add the <strong>Medicare levy</strong> (2%, reduced below $35,013), the <strong>Medicare levy surcharge</strong> if you had no private hospital cover, and any compulsory <strong>HECS/HELP</strong> repayment. Franking credits come off what you owe and can be refunded.</p>
<table><thead><tr><th>Taxable income</th><th>2025-26</th><th>2026-27</th></tr></thead><tbody>
<tr><td>$0 to $18,200</td><td>Nil</td><td>Nil</td></tr><tr><td>$18,201 to $45,000</td><td>16%</td><td>15%</td></tr><tr><td>$45,001 to $135,000</td><td>30%</td><td>30%</td></tr>
<tr><td>$135,001 to $190,000</td><td>37%</td><td>37%</td></tr><tr><td>$190,001 and over</td><td>45%</td><td>45%</td></tr></tbody></table>
<p><strong>2026-27</strong> adds a $1,000 standard deduction for employees, applied automatically. Work-related expenses you claim reduce it dollar for dollar, so you get the larger of $1,000 and your claims. Union fees and professional association fees are claimed on top. The Medicare levy surcharge thresholds rise from $101,000 (2025-26) to $105,000 (2026-27) for singles, and the HECS/HELP repayment threshold from $67,000 to $69,528. The ATO hasn't published 2026-27 Medicare levy low-income thresholds yet, so 2025-26 figures ($28,011 and $35,013) are used.</p>""",
 faq=[("How much tax do I pay on $85,000 in 2025-26?","$17,988: $16,288 income tax plus a $1,700 Medicare levy, with no deductions. In 2026-27 the same salary pays $17,400 ($15,720 tax plus $1,680 Medicare levy), $588 less, thanks to the 15% bracket and the $1,000 standard deduction."),
      ("How much does the $1,000 standard deduction save?","$320 at a $85,000 salary in 2026-27 (30% tax plus 2% Medicare levy on $1,000). It isn't in your pay; it comes back when you lodge, so it adds to your refund. It doesn't exist for 2025-26."),
      ("Will I pay the Medicare levy surcharge without private health insurance?","Only above the surcharge threshold. A single person with $110,000 taxable income and no hospital cover pays $1,100 (1%) in 2025-26. In 2026-27 the same salary pays $1,090, because the $1,000 standard deduction takes taxable income to $109,000, still above the $105,000 threshold."),
      ("How much HECS/HELP comes out of my refund?","$2,700 on $85,000 in 2025-26: 15c for each $1 over $67,000. In 2026-27 it's $2,170.80, because the threshold rises to $69,528 and the standard deduction lowers taxable income to $84,000. Employers withhold extra for HELP during the year, so include that in tax withheld."),
      ("Why do I get a refund if I earn under $45,000?","Mostly the low income tax offset, which the ATO applies at tax time, not in your pay. On $30,000 in 2025-26 the $700 offset cuts income tax from $1,888 to $1,188. With a $198.90 Medicare levy and $1,500 withheld, the refund is $113.10.")],
 related=['take-home-pay','work-deductions','hecs-help','medicare-levy-surcharge']),
'rent-vs-buy': dict(
 how="""<p>The calculator follows two versions of you, month by month. <strong>The buyer</strong> pays the deposit, stamp duty (worked out for your state) and other upfront costs, then the loan repayments plus council rates, strata, insurance and maintenance. <strong>The renter</strong> invests the same upfront cash on day one and pays rent. Each month, whoever has the cheaper housing invests the difference.</p>
<p>At the end, the buyer's net wealth is the home's value less selling costs and the loan still owing, plus any investments. The renter's is their investments. The <strong>break-even year</strong> is the first year buying comes out ahead and stays ahead.</p>
<p><strong>Every number except stamp duty is an assumption you choose:</strong> home price growth, rent rises, investment returns, interest rates and costs are held steady, which real life won't be. Try a few values. Your home is generally exempt from capital gains tax; the renter's investment earnings are reduced by the tax rate you enter (0% compares pre-tax returns). Lenders mortgage insurance isn't added automatically: put an estimate in other upfront costs if your deposit is under 20%.</p>""",
 faq=[("Is it better to rent or buy in Australia?","It depends mostly on home price growth versus investment returns. With our example assumptions ($800,000 NSW home, 20% deposit, 6% loan, $650 a week rent, 5% growth, 7% returns taxed at 15%), buying is ahead by $112,914 after 10 years. At 4% growth the gap is only $3,115, and at 3% growth renting and investing is ahead by $97,391."),
      ("How long until buying beats renting?","In the example it takes 5 years: by year 4 the renter is still ahead, but from year 5 buying stays ahead. Upfront costs, such as $30,187 NSW stamp duty on $800,000, are why buying usually starts behind."),
      ("Does being a first home buyer change the answer?","Yes, through stamp duty. A NSW first home buyer pays no duty on an $800,000 home, so the upfront cash falls from $193,187 to $163,000. In the example, buying is then ahead by $166,719 after 10 years and from year 2."),
      ("Does the calculator include tax?","Partly. Your home is generally exempt from capital gains tax, so its growth isn't taxed. The renter's investment earnings lose the share you enter to tax: at 15% the renter has $622,036 after 10 years in the example, and at 0% (pre-tax) $674,213, which shrinks buying's lead to $60,736."),
      ("What investment return should I use?","It's an assumption you choose; no one knows future returns. In the example, a 5% return instead of 7% makes buying $188,995 ahead after 10 years instead of $112,914. Use a return you'd realistically earn after fees, and set the tax rate to suit how you'd invest.")],
 related=['mortgage','stamp-duty','borrowing-power','rental-yield']),
'refinance': dict(
 how="""<p>Enter your loan as it is now and the new rate you've been offered. The calculator works out both monthly repayments, the interest on each loan over its full term, and your net saving once switching costs (less any cashback) come off. Interest is charged monthly and both rates are assumed to stay the same.</p>
<p><strong>Break-even</strong> is the first month from which you stay ahead for good. It counts the cash you save on repayments plus how much less you owe on the new loan, so stretching the loan over a longer term can't look like a saving just because repayments are lower. If the new term is longer, the calculator says so.</p>
<p><strong>Switching costs:</strong> the discharge fee default of $350 is an estimate (several big banks charge this; some charge less or nothing). Government fees default to NSW's 2026-27 fees from <a href="https://nswlrs.com.au/assets/f/1129775276948026/x/5fed3e7cd6/2026-2027_nsw-lrs-fees_final.pdf" target="_blank" rel="noopener noreferrer">NSW Land Registry Services</a>: $182.73 to register the discharge and $182.73 for the new mortgage. Other states charge different amounts. If you're on a fixed rate, ask about break costs too. Tick the box to add the costs to the new loan, as <a href="https://moneysmart.gov.au/home-loans/mortgage-switching-calculator" target="_blank" rel="noopener noreferrer">Moneysmart's mortgage switching calculator</a> assumes.</p>
<p><strong>Pay it off sooner:</strong> if you keep paying your current repayment on the cheaper loan, the extra goes off the balance. The calculator shows how much sooner the loan is paid off and the interest that saves.</p>""",
 faq=[("How much will I save by refinancing?","About $54,792 after costs on a $500,000 loan with 25 years left, moving from 6.5% to 5.9% with $715 in switching costs. Repayments drop from $3,376.04 to $3,191.01 a month, a $185.02 saving, and interest falls by $55,507. Even a 0.25% cut (6.5% to 6.25%) saves $77.69 a month and $22,591 overall."),
      ("How long does it take to break even on refinancing?","3 months in the example above ($715 of costs, 6.5% to 5.9% on $500,000). With a smaller cut from 6.5% to 6.25%, it takes 7 months. If you add the costs to the new loan instead of paying them up front, you still break even in 3 months, but the net saving falls to $54,137 because you pay interest on the costs."),
      ("Should I keep my repayments the same after refinancing?","Yes, if you can afford it. In the example, keeping up the old $3,376.04 a month on the 5.9% loan pays it off 2 years 10 months sooner (22 years 2 months instead of 25 years) and saves $116,191 in interest, more than double what you save by just taking the lower repayment."),
      ("Is a longer loan term a good idea when refinancing?","Usually not, if your aim is to save money. Refinancing the same $500,000 at 5.9% over a fresh 30 years cuts repayments by $410.35 a month to $2,965.68, but you pay $54,835 more interest and end up $55,550 worse off after costs. The calculator says when a lower repayment comes from stretching the loan."),
      ("What does it cost to switch home loans?","Usually a discharge fee from your current lender (many big banks charge $350), any application, settlement or valuation fees from the new lender, and government fees to register the discharge and the new mortgage. In NSW for 2026-27 these are $182.73 each. Fixed-rate loans can also have break costs, and lender cashback offers can cover some or all of it.")],
 related=['mortgage','offset','borrowing-power','stamp-duty']),
'term-deposit': dict(
 how="""<p>Enter the amount, rate and term, and how often the bank pays interest. Interest paid at maturity is simple interest: amount × rate × months ÷ 12. If interest is paid monthly, quarterly or yearly, you choose whether it's paid out to your bank account (simple interest again) or added to the deposit, where it earns interest of its own (compounding).</p>
<p>Each month counts as one-twelfth of a year. Banks usually count days, so your bank's figure may differ by a few dollars. There are no fees. If the term isn't a whole number of payment periods, the last part-period earns interest pro rata.</p>
<p><strong>Tax:</strong> interest is taxable income. Enter your other taxable income to see the extra income tax and Medicare levy at your marginal rate, using 2026-27 resident rates. Offsets are ignored, and all the interest is counted in one income year.</p>
<p>As <a href="https://moneysmart.gov.au/investments-paying-interest/term-deposits" target="_blank" rel="noopener noreferrer">Moneysmart</a> explains, term deposits with banks, building societies and credit unions are covered by the Financial Claims Scheme up to $250,000, and breaking one early can cost you interest.</p>""",
 faq=[("How much interest will I earn on a $10,000 term deposit?","$450 over 12 months at 4.5% p.a. when interest is paid at maturity, leaving $10,450. Over 6 months at the same rate it's $225. If interest is paid monthly and reinvested it's $459.40, or $457.65 if it's paid quarterly and reinvested."),
      ("Is monthly or at-maturity interest better?","Reinvested monthly interest earns slightly more: $459.40 a year on $10,000 at 4.5%, against $450 at maturity. Interest paid out to your bank account earns no interest itself, so it totals $450 ($37.50 a month), the same as at maturity. Banks often offer a slightly lower rate for monthly interest, so compare the dollar results."),
      ("How is term deposit interest taxed?","As ordinary income, at your marginal rate plus the Medicare levy. On $2,250 of interest ($50,000 at 4.5% for a year), someone earning $80,000 pays $720 (32%) and keeps $1,530. On $150,000 the tax is $877.50 (39%). With no other income it's all under the tax-free threshold and no tax is payable."),
      ("What about terms longer than a year?","On a 2-year term at 4.5% with interest added each year, $10,000 earns $920.25. Many banks pay interest at least once a year on terms longer than 12 months, so check how yours does it."),
      ("Is my term deposit safe?","Deposits with an Australian bank, building society or credit union are covered by the government's Financial Claims Scheme up to $250,000. If you have more than that, consider spreading it across institutions. Check the provider is on APRA's list of authorised deposit-taking institutions.")],
 related=['compound-interest','savings-goal','take-home-pay','inflation']),
'balance-transfer': dict(
 how="""<p>Enter your card balance, its interest rate and what you can repay each month, then the offer's transfer fee, intro rate and period, and the revert rate. The calculator compares two plans with the same monthly repayment: staying on your current card, or transferring the balance.</p>
<p>The transfer fee is a percentage of the balance, added to the new card on day one. The intro rate then applies for the intro period, and the revert rate after that. As in <a href="https://moneysmart.gov.au/credit-cards/credit-card-calculator" target="_blank" rel="noopener noreferrer">Moneysmart's credit card calculator</a>, interest is charged monthly at the yearly rate ÷ 12, and it assumes no new purchases, cash advances or annual fees.</p>
<p>It also shows how much will be left when the intro period ends, and the monthly repayment needed to clear the balance (fee included) before the rate goes up.</p>""",
 faq=[("Is a balance transfer worth it?","Usually, if you avoid new spending and keep repaying. Moving $5,000 from a 20% card to 0% for 12 months with a 2% fee, paying $300 a month, costs $183.94 in fees and interest instead of $906.81: a $722.87 saving. The card is cleared in 18 months instead of 20."),
      ("What happens when the intro period ends?","Whatever's left starts attracting the revert rate. In the example above, $1,500 is still owing after 12 months, and at 21% that adds $83.94 of interest before it's cleared. Paying $425 a month would clear the whole $5,100 (fee included) within the 12 months."),
      ("How much should I pay to clear it before the 0% ends?","The balance plus the fee, divided by the months in the offer. For $10,000 with a 3% fee and 24 months at 0%, that's $429.17 a month. Paying $450 a month clears it in 23 months for just the $300 fee, against $2,594.68 of interest if you stay on a 20% card."),
      ("What if I only make small repayments?","The transfer still helps, but less. Paying $150 a month on $5,000, the transfer costs $1,003.24 in fees and interest, with $3,300 still owing when the 12 months at 0% end. Staying on 20% costs $2,359.09 and takes 50 months, against 41."),
      ("Do new purchases get the 0% rate?","Usually not. On many balance transfer cards new purchases are charged interest straight away, and repayments may go to the 0% balance first. Avoid spending on the card and read its key fact sheet before you apply.")],
 related=['credit-card','personal-loan','savings-goal','compound-interest']),
'rental-cashflow': dict(
 how="""<p>Rental income is the rent you collect, less weeks the property sits empty. Your cash costs are the loan repayments plus rates, strata, insurance, property management, repairs and land tax. For tax, only the <strong>interest</strong> part of a loan is deductible, not principal, and depreciation is deductible even though you don't spend it each year.</p>
<p>If deductions are more than the rent, you have a <strong>net rental loss</strong>. Until 30 June 2027 that loss reduces the tax on your salary and other income: this is negative gearing.</p>
<p><strong>From the 2027-28 income year</strong>, section 26-155 of the Income Tax Assessment Act 1997 (added by the Treasury Laws Amendment (Tax Reform No. 1) Act 2026) limits it. Losses on residential property can only reduce residential rental income and capital gains on residential property. Anything left over is carried forward to later years. The limit is worked out across all your caught properties together.</p>
<ul><li><strong>Bought before 7.30 pm (AEST) on 12 May 2026:</strong> not caught. The contract date counts, even if you settled later.</li>
<li><strong>New builds:</strong> not caught. The exact definition is still to be set. The Budget papers say it covers homes built on vacant land, or replacing demolished housing with more homes, bought from new.</li>
<li><strong>Shares and commercial property:</strong> not affected.</li></ul>""",
 faq=[("Can I still negatively gear an investment property?","Yes, if you signed the contract before 7.30 pm (AEST) on 12 May 2026 or it's a new build. Otherwise, from 2027-28 a rental loss can't reduce tax on your salary. A $650 a week rental with a $600,000 interest-only loan at 6.2% and $120,000 of other income makes a $12,475 loss. If it was bought before Budget night, that saves $3,992 in tax and costs you about $163 a week. If it was bought after, it saves nothing and costs $240 a week."),
      ("What happens to a loss I can't claim?","It's carried forward with no time limit. It reduces rental profit from your caught properties in later years and capital gains on residential property. For example, a $12,475 loss carried into a year when the property makes a $3,800 profit wipes out tax on that profit and leaves $8,675 to carry on. It never reduces tax on your salary."),
      ("I'm buying in 2026-27. Am I affected this year?","No. The limit starts with the 2027-28 income year, so in 2026-27 the same $12,475 loss saves $3,992 even on a property bought after Budget night. It's caught from 1 July 2027."),
      ("Does interest-only or principal and interest change the tax?","Only the interest is deductible. On a $600,000 loan at 6.2% over 30 years, principal and interest repayments in the first year include $37,001 of interest and $7,097 of principal. Cashflow is $133 a week worse than interest-only, but the tax loss is slightly smaller ($12,276 against $12,475)."),
      ("How much does a new build save?","With the same rent and loan plus $8,000 of depreciation, a new build's $20,475 tax loss saves $6,552 for someone earning $120,000 in 2027-28. That brings the cost down to about $114 a week after tax. Check the final definition of a new build before relying on it.")],
 related=['rental-yield','capital-gains-tax','mortgage','borrowing-power']),
'inflation': dict(
 how="""<p>Prices are tracked by the <strong>Consumer Price Index (CPI)</strong>, published every quarter by the Australian Bureau of Statistics. This calculator uses the All groups CPI for the weighted average of the eight capital cities, from the September quarter 1948 to the June quarter 2026. To convert an amount, it multiplies by the ratio of the two quarters' index numbers: <strong>value × CPI (later) ÷ CPI (earlier)</strong>.</p>
<p>The ABS re-based the index in 2025, so the June quarter 2026 is 102.31 and the September quarter 1999 is 47.72. Only the ratio matters, so $100 in September 1999 is worth $100 × 102.31 ÷ 47.72 = <strong>$214.40</strong> in June 2026. The average yearly rate is the steady yearly increase that would give the same total change.</p>
<p>The September quarter 2026 figure is due from the ABS in late October 2026. CPI measures average household prices, so your own costs may have risen faster or slower.</p>""",
 faq=[("What is $100 from 2000 worth today?","$100 in the June quarter 2000 is worth $209.78 in the June quarter 2026. Prices rose 109.8% in total, an average of 2.89% a year."),
      ("What was inflation in the year to June 2026?","3.9%, from a CPI of 98.43 in the June quarter 2025 to 102.31 in the June quarter 2026."),
      ("How much have prices risen since 1948?","$100 in the September quarter 1948 is worth $3,950.19 in the June quarter 2026: a rise of 3,850.2%, or an average of 4.84% a year."),
      ("When was inflation highest?","Over a year to a June quarter, the highest was 20.7% in the year to June 1952. Inflation was also high through the 1970s and early 1980s: $100 in June 1980 is worth $563.07 in June 2026."),
      ("Why is the index around 100 now?","The ABS re-based the CPI to 2025. Re-basing changes every index number by the same proportion, so the ratios this calculator uses, and its results, don't change.")],
 related=['savings-goal','capital-gains-tax','compound-interest','hecs-help']),
'borrowing-power': dict(
 how="""<p>Banks work out how much you can borrow by checking what's left of your take-home income after living expenses and existing debts, then finding the largest loan that amount could repay. APRA requires banks to test repayments at <strong>3 percentage points above the loan rate</strong> (the serviceability buffer), so a 6% loan is tested at 9%.</p>
<p>This estimate takes your income after 2026-27 tax, the Medicare levy and any HECS/HELP repayments. It counts <strong>80% of rental or other income</strong> and treats credit cards as fully drawn at <strong>3.8% of the limit a month</strong>, the repayment that clears the limit in three years. Both are typical lender practice, not official rules. It then subtracts your living expenses and other loan repayments.</p>
<p>From 1 February 2026, APRA limits each bank to 20% of new home loans at a <strong>debt-to-income ratio</strong> of 6 or more, so very high borrowing compared with income can be harder to get. Lenders also apply their own minimum living expenses, the Household Expenditure Measure, which isn't published. Most will lend less than this estimate.</p>""",
 faq=[("How much can I borrow on $100,000?","On a $100,000 salary with $2,500 a month in living expenses and no other debts, a 6% loan over 30 years tested at 9% gives about $491,000. Repayments at 6% would be about $2,948 a month, and the loan would be 4.9 times income."),
      ("How much does a credit card limit reduce borrowing power?","In that example, a $10,000 limit counts as $380 a month even if you never use it. That cuts the estimate to about $444,000, around $47,000 less."),
      ("What is the APRA serviceability buffer?","Banks must check you could repay at 3 percentage points above your loan rate. Without the buffer, the $100,000 example could borrow about $659,000 instead of $491,000."),
      ("How much can a couple borrow?","Two people earning $100,000 and $80,000, with $4,000 a month in living expenses, could borrow about $966,000 at 6% over 30 years. Repayments would be about $5,797 a month, at a debt-to-income ratio of 5.4."),
      ("Does rental income count?","Yes, but lenders usually count only about 80% of it. Adding $20,000 a year in rent to the $100,000 example raises the estimate to about $604,000.")],
 related=['mortgage','stamp-duty','stamp-duty-nsw','take-home-pay']),
'car-stamp-duty': dict(
 how="""<p>Every state and territory charges <strong>motor vehicle duty</strong> (often called car stamp duty) when you register a new car or transfer a used one into your name. It's worked out on the car's <strong>dutiable value</strong>: usually the higher of the price and the market value, including GST and luxury car tax. Most states round the value up to the next $100 (Victoria to the next $200) before applying the rate.</p>
<table><thead><tr><th>State</th><th>Passenger car rate</th></tr></thead><tbody>
<tr><td>NSW</td><td>$3 per $100; from $45,000: $1,350 + $5 per $100 over $45,000</td></tr>
<tr><td>VIC</td><td>$8.40 per $200 up to $80,809; $10.40 to $100,000; $14 to $150,000; $18 above (whole value). Green cars (120 g/km CO2 or less): $8.40 at any price</td></tr>
<tr><td>QLD</td><td>Per $100: hybrid/electric $2, 1–4 cylinders $3, 5–6 cylinders $3.50, 7+ cylinders $4; $2 more per $100 on the whole value above $100,000</td></tr>
<tr><td>SA</td><td>$60 + $4 per $100 over $3,000</td></tr>
<tr><td>WA</td><td>2.75% up to $25,000, sliding to 6.5% at $50,000 and above</td></tr>
<tr><td>TAS</td><td>$3 per $100 to $35,000; $1,050 + $11 per $100 to $40,000; $4 per $100 above</td></tr>
<tr><td>ACT</td><td>By CO2 emissions: new cars $2.50–$4.83 per $100 under $45,000, rising above $45,000 and $80,000. Used cars: zero-emission or standard rate</td></tr>
<tr><td>NT</td><td>$3 per $100; plug-in electric cars pay nothing on the first $50,000 to 30 June 2027</td></tr>
</tbody></table>
<p><strong>Example:</strong> a $60,000 petrol car in NSW: $1,350 + ($15,000 ÷ 100 × $5) = <strong>$2,100</strong>.</p>
<p>Rates were checked against each state's revenue office or transport department on 15 October 2026. Utes, vans, motorcycles, heavy vehicles and exemptions aren't covered.</p>""",
 faq=[("How much is stamp duty on a car?","It depends on the state, the car's value and sometimes its engine or emissions. On a $45,000 petrol car it's $1,350 in NSW, $1,890 in Victoria, $1,350 in Queensland (4 cylinders), $1,740 in South Australia, $2,587.50 in WA, $1,800 in Tasmania, $1,426.50 in the ACT (new, non-rated) and $1,350 in the NT."),
      ("Do you pay stamp duty on a used car?","Yes. You pay duty when you transfer the registration into your name, on the higher of the price and the market value. Only the ACT charges used cars a different rate from new ones; elsewhere the rate is the same."),
      ("Do electric cars pay stamp duty?","In most states, yes. Victoria charges its lower green car rate, Queensland its lowest hybrid and electric rate, and the ACT its lowest rate. The NT removes duty on the first $50,000 for plug-in electric cars until 30 June 2027. NSW's and Tasmania's EV exemptions have ended."),
      ("Is stamp duty included in a drive-away price?","Usually, yes. Drive-away prices include duty, registration and dealer delivery. In Victoria the SRO publishes factors to convert a drive-away price back to the dutiable value, so enter the car's price before on-road costs."),
      ("What is Victoria's luxury car stamp duty?","For 2026-27, passenger cars over $80,809 pay $10.40 per $200, over $100,000 pay $14 and over $150,000 pay $18, on the whole value. Green cars pay $8.40 per $200 at any price.")],
 related=['personal-loan','stamp-duty','gst','work-deductions']),
'super': dict(
 how="""<p>Your employer must pay <strong>12%</strong> of your salary into super (the super guarantee), up to the <strong>maximum contribution base of $270,830</strong> for 2026-27. With Payday Super this is now a yearly limit, so the most an employer must pay is $32,499.60. Salary you sacrifice still counts, so sacrificing doesn't reduce your employer's 12%.</p>
<p><strong>Salary sacrifice</strong> means asking your employer to pay part of your pre-tax salary into super. It isn't taxed at your marginal rate. Instead your fund takes <strong>15% contributions tax</strong>. If your marginal rate plus the 2% Medicare levy is more than 15%, you save the difference. On $100,000, sacrificing $10,000 saves $3,200 in income tax and Medicare, costs $1,500 in contributions tax, and cuts take-home pay by $6,800. That puts $8,500 more in super.</p>
<p>Employer, salary sacrifice and deductible personal contributions all count towards the <strong>concessional contributions cap of $32,500</strong> from 1 July 2026. Amounts over the cap are added to your taxable income and taxed at your marginal rate, less a 15% offset, so they save little. If your total super balance was under $500,000 on 30 June last year, you can use <strong>unused cap amounts</strong> from the past 5 years. myGov shows how much you have.</p>
<p>If your income plus concessional contributions is over <strong>$250,000</strong>, <strong>Division 293</strong> adds another 15% on the smaller of your contributions or the amount over $250,000.</p>""",
 faq=[("Is salary sacrifice worth it?","Usually, if your taxable income is over $45,000. There your tax rate is 30% or more plus the 2% Medicare levy, against 15% in super. Below about $45,000 the saving is small or nothing, and the money is locked away until you can access your super."),
      ("What is the concessional contributions cap for 2026-27?","$32,500, up from $30,000. It covers your employer's super guarantee, salary sacrifice and personal contributions you claim as a tax deduction, across all your funds."),
      ("How do I find my unused carry-forward cap?","Log in to myGov, open the ATO, then Super, Information, and Carry forward concessional contributions. You can only use it if your total super balance was under $500,000 on 30 June of the previous year. Unused amounts expire after 5 years."),
      ("What happens if I go over the cap?","The excess is added to your taxable income and taxed at your marginal rate, with a 15% offset for the tax your fund already paid. The ATO writes to you with options for paying it."),
      ("What is Division 293 tax?","An extra 15% on concessional contributions for people whose income plus contributions is over $250,000. It applies to the smaller of your contributions or the amount over $250,000. The ATO bills you separately, and you can pay it from your super.")],
 related=['take-home-pay','medicare-levy-surcharge','gross-up','compound-interest']),
'medicare-levy-surcharge': dict(
 how="""<p>The <strong>Medicare levy surcharge</strong> (MLS) is an extra 1% to 1.5% of income. You pay it on top of the 2% Medicare levy if you, your spouse and your dependent children don't have appropriate private hospital cover and your income is over the threshold.</p>
<table><thead><tr><th>2026-27</th><th>Singles</th><th>Families</th><th>Rate</th></tr></thead><tbody>
<tr><td>Base tier</td><td>$105,000 or less</td><td>$210,000 or less</td><td>0%</td></tr>
<tr><td>Tier 1</td><td>$105,001 to $123,000</td><td>$210,001 to $246,000</td><td>1%</td></tr>
<tr><td>Tier 2</td><td>$123,001 to $164,000</td><td>$246,001 to $328,000</td><td>1.25%</td></tr>
<tr><td>Tier 3</td><td>$164,001 or more</td><td>$328,001 or more</td><td>1.5%</td></tr></tbody></table>
<p>Family thresholds go up by $1,500 for each dependent child after the first. Couples and single parents use the family thresholds.</p>
<p>Your tier depends on your <strong>income for MLS purposes</strong>, combined with your spouse's if you have one: taxable income plus reportable fringe benefits, net investment losses and reportable super contributions. The surcharge itself is charged only on your taxable income and reportable fringe benefits.</p>
<p>To avoid it you need hospital cover from an Australian insurer with an excess of $750 or less for singles, or $1,500 or less for couples and families. Extras-only cover and travel insurance don't count.</p>""",
 faq=[("Is it cheaper to pay the Medicare levy surcharge or get private health insurance?","Hospital cover is cheaper whenever its yearly premium after the rebate is less than the surcharge. On $130,000 as a single, the surcharge is $1,625 a year, so a basic hospital policy costing less than that, with an excess of $750 or less, saves money. Enter a quote in the calculator to compare."),
      ("Do I pay the surcharge if my partner earns most of the income?","Couples are tested on combined income, but each person pays on their own taxable income and fringe benefits. If you had a spouse all year and your own income for MLS purposes is $28,011 or less (the 2025-26 figure; the 2026-27 one isn't published yet), you don't pay it."),
      ("Does salary sacrifice or negative gearing affect the surcharge?","Yes. Salary sacrificed super, deductible personal contributions and net investment losses are added back when working out your tier, even though they reduce your taxable income."),
      ("What if I only had cover for part of the year?","The surcharge is charged only for the days you didn't have appropriate hospital cover, so enter the number of days without it."),
      ("What is Lifetime Health Cover loading?","It's separate from the surcharge. If you don't hold hospital cover by 1 July after your 31st birthday, your premium goes up 2% for every year you're over 30 when you join, up to 70%. The loading is removed after 10 years of continuous cover.")],
 related=['take-home-pay','super','gross-up','capital-gains-tax']),
'personal-loan': dict(
 how="""<p>Repayments use the standard amortisation formula, with interest charged at your repayment frequency (the same assumption as Moneysmart's personal loan calculator). Each repayment covers that period's interest and pays off some of the loan.</p>
<p><strong>Fees:</strong> an upfront (establishment) fee can be added to the loan, so you pay interest on it, or paid at the start. A monthly account-keeping fee is added to every repayment. The <strong>true cost rate</strong> is the interest rate that would cost the same with no fees. It's worked out like a comparison rate, but on your own loan amount and term.</p>
<p><strong>Balloon (residual) payments</strong> are common on car loans and novated leases. A balloon is a lump sum still owing after the last regular repayment. It lowers your repayments, but you pay interest on it for the whole term, so the loan costs more overall. Plan how you'll pay it: with cash, by refinancing, or by selling or trading in the car.</p>""",
 faq=[("What is a comparison rate?","It's the interest rate plus most upfront and ongoing fees, shown as one yearly rate. Lenders must show it next to an advertised rate. For personal and car loans it's worked out on a standard $30,000 loan over 5 years, so a loan of a different size or term can cost more or less than the comparison rate suggests. This calculator's true cost rate uses your own figures."),
      ("Is a balloon payment a good idea on a car loan?","It lowers your repayments, but you pay more interest because part of the loan is never paid down during the term. At the end you must pay the balloon in one go, refinance it, or sell the car. If the car is worth less than the balloon by then, you'll need to make up the difference."),
      ("Are weekly repayments cheaper than monthly?","Slightly. You pay down the loan sooner, so less interest builds up. The bigger savings come from a lower rate, lower fees, a shorter term or extra repayments."),
      ("Does this include early repayment fees?","No. It assumes a fixed rate and that you make every repayment on time with no extra repayments. Check your loan contract for early exit or break fees, especially on fixed-rate loans."),
      ("Should I add the establishment fee to the loan?","Adding it means you don't pay it upfront, but you pay interest on it for the whole term. Tick or untick the box to compare the total cost.")],
 related=['car-stamp-duty','credit-card','savings-goal','borrowing-power']),
'credit-card': dict(
 how="""<p>Interest is charged each month at the yearly rate ÷ 12 on the balance, then your repayment comes off. Like Moneysmart's credit card calculator, it assumes no new purchases, cash advances or fees.</p>
<p><strong>Minimum repayments</strong> are usually a percentage of the closing balance or a set dollar amount, whichever is higher. By default this calculator uses 2% or $25; check your statement and change them to match. Because the minimum shrinks as the balance falls, paying only the minimum can take decades and cost several times the original balance in interest.</p>
<p>If your repayment doesn't cover the month's interest, the balance never goes down. The calculator warns you when that happens.</p>""",
 faq=[("How long will it take to pay off my credit card with minimum payments?","Often decades. A $5,000 balance at 20% p.a., paying a minimum of 2% or $25, takes about 40 years and costs around $18,500 in interest. Paying a fixed $200 a month clears it in 2 years 9 months with about $1,500 in interest."),
      ("How is the minimum repayment on a credit card calculated?","Usually as a percentage of your closing balance (often 2% to 3%) or a minimum dollar amount, whichever is higher. If you owe less than that amount, you pay the whole balance. Your statement shows your card's exact terms."),
      ("How much should I pay to clear my card in 2 years?","About $254 a month clears a $5,000 balance at 20% p.a. in 2 years, with about $1,107 in interest. For your own card, choose to work out the repayment to clear it by a set time and enter 24 months. Your statement also shows how much to pay each month to clear the balance in 3 years."),
      ("Is a balance transfer worth it?","It can be, if you clear the balance before the low-rate period ends and avoid new spending. Watch for transfer fees and the revert rate. Enter the revert rate here to see what happens to anything left over."),
      ("What if I can't afford the minimum repayment?","Contact your card provider about hardship options as soon as you can: lenders must consider you for help. Moneysmart explains how <a href=\"https://moneysmart.gov.au/managing-debt/financial-hardship\" target=\"_blank\" rel=\"noopener noreferrer\">financial hardship arrangements</a> work. You can also call the free National Debt Helpline on 1800 007 007.")],
 related=['personal-loan','savings-goal','borrowing-power','hecs-help']),
'savings-goal': dict(
 how="""<p>Enter your goal, what you've already saved and your interest rate. Then either enter how much you can save each week, fortnight or month to see how long it will take, or pick a date to see how much to put away each time.</p>
<p>Like Moneysmart's savings goals calculator, it assumes you deposit at the start of each period, reinvest the interest and keep the same rate. Interest compounds daily, monthly, quarterly or yearly as you choose. It ignores tax on interest, account fees and inflation, so allow a little extra if your goal is a long way off.</p>""",
 faq=[("How long will it take to save $10,000?","Saving $200 a month, with $1,000 already saved, takes about 3 years 5 months at 4.5% p.a. compounded monthly, and 3 years 9 months with no interest."),
      ("How much do I need to save each week to reach my goal?","About $86.54 a week saves $9,000 in 2 years with no interest, or about $82.25 a week at 5% p.a. compounded monthly. To work out your own, choose to save by a date, pick weekly and enter your date."),
      ("Is interest on savings taxed in Australia?","Yes. Interest is income and is taxed at your marginal rate, which this calculator doesn't include. Money held in a mortgage offset account saves interest that isn't taxed."),
      ("Does compounding frequency make much difference?","Only a little. Daily compounding earns slightly more than monthly at the same rate. How much you save and the rate matter far more."),
      ("What about saving for a home deposit?","Use this to set a target, then check the stamp duty calculator for the extra upfront costs, and the mortgage calculator for repayments on the loan.")],
 related=['inflation','compound-interest','offset','credit-card']),
'work-deductions': dict(
 how="""<p><strong>Working from home:</strong> the ATO's fixed rate method lets you claim a set amount for every hour you work from home: 70c an hour for 2024-25 and 2025-26. The rate covers home and mobile internet and data, phone use, electricity and gas for heating, cooling and lighting, and stationery and computer consumables, so you can't claim those separately. You can still claim depreciation on work equipment and furniture such as a desk, chair or computer. You need a record of the actual hours you worked from home (a timesheet, roster or diary kept at the time) and at least one bill for each expense the rate covers. The actual cost method isn't covered here.</p>
<p><strong>Car:</strong> the cents per kilometre method pays a set rate for every work-related kilometre, up to 5,000 km per car: 88c for 2024-25 and 2025-26, and 91c for 2026-27. The rate covers all running costs, including fuel, rego, insurance, servicing and depreciation. If you drive more than 5,000 km for work, the logbook method (total car costs × business-use percentage from a 12-week logbook) may give a bigger claim. Driving between home and your usual workplace usually doesn't count.</p>
<p><strong>From 2026-27</strong> eligible employees get a $1,000 standard deduction automatically, with no receipts needed. Work-related expenses you claim, including working from home and car, reduce it dollar for dollar, so claiming only adds to your deductions if they total more than $1,000. Union fees and professional association fees are the exception: claim them on top of the standard deduction.</p>""",
 faq=[("What is the working from home rate for 2025-26?","70 cents for each hour you work from home, the same as 2024-25. It covers internet, phone, energy and stationery. The ATO's examples round the result down to whole dollars."),
      ("What is the ATO cents per km rate for 2026-27?","91 cents per kilometre, up from 88c in 2024-25 and 2025-26. You can claim up to 5,000 work-related kilometres per car."),
      ("Should I claim working from home or take the $1,000 standard deduction?","From 2026-27, if your working from home, car and other work-related expenses add up to less than $1,000, it's better to take the $1,000 standard deduction. Claims above $1,000 replace it and need written evidence. Union fees and professional association fees don't count towards the $1,000: claim them as well."),
      ("Can I claim my phone and internet as well as the 70c rate?","No. The fixed rate already includes home and mobile phone and internet. You can claim depreciation on equipment and furniture, such as a desk, chair or laptop."),
      ("Can I claim driving to work?","Usually not. Trips between home and your normal workplace are private. You can claim trips between workplaces, to clients or to an alternative workplace, and trips carrying bulky tools you need for work.")],
 related=['take-home-pay','super','car-stamp-duty','gst']),
'gross-up': dict(
 how="""<p>Tell us the take-home pay you want and we work backwards to the salary you'd need to earn. It uses exactly the same 2026-27 rates as our Take-Home Pay calculator: resident income tax, the $1,000 standard deduction, the low income tax offset, the Medicare levy and, if you tick it, compulsory HECS/HELP repayments. The calculator tries salaries until the take-home pay matches yours to the cent.</p>
<p>Employer super of 12% is paid on top of salary, so we also show your <strong>package</strong> (salary plus super). Tick <em>Show the answer as a package</em> if the job ads or offers you're comparing quote total pay including super.</p>""",
 faq=[("How much do I need to earn to take home $1,000 a week?","About $61,932 a year before tax in 2026-27, including the $1,000 standard deduction. A HECS/HELP debt doesn't change that, because compulsory repayments only start above $69,528."),
      ("How much do I need to earn to take home $100,000 a year?","About $132,647 a year in 2026-27 with no HECS/HELP debt, or about $153,378 with one, including the $1,000 standard deduction. Employer super of 12% is paid on top."),
      ("Why does each extra dollar of take-home pay cost more than a dollar of salary?","Every extra dollar you earn is taxed at your marginal rate (30% from $45,001), plus the 2% Medicare levy and, with a study loan, 15% to 17% for HECS/HELP. At $90,000 with no HELP debt, an extra $1,000 in your pocket needs about $1,471 more salary."),
      ("Does this include HECS/HELP?","Yes, if you tick “I have a HECS/HELP debt”. It uses the 2026-27 marginal repayment rates on salary only. The ATO uses repayment income, which can include fringe benefits and salary-sacrificed super."),
      ("What salary do I need to take home $80,000 a year?","About $103,235 in 2026-27 with no HECS/HELP debt, or about $112,492 with one, including the $1,000 standard deduction. As a package including 12% super, the first is about $115,624. Your payslip may differ slightly because employers use ATO withholding tables.")],
 related=['take-home-pay','hecs-help','super','work-deductions']),
'hecs-help': dict(
 how="""<p>Each year the ATO works out a compulsory repayment from your repayment income. From 2025-26 it's a marginal system: you only repay on income above the threshold.</p>
<table><thead><tr><th>Repayment income (2026-27)</th><th>Compulsory repayment</th></tr></thead><tbody>
<tr><td>$0 – $69,528</td><td>Nil</td></tr><tr><td>$69,529 – $129,717</td><td>15c for each $1 over $69,528</td></tr>
<tr><td>$129,718 – $186,050</td><td>$9,028 plus 17c for each $1 over $129,717</td></tr><tr><td>$186,051 and over</td><td>10% of total repayment income</td></tr></tbody></table>
<p>On 1 June each year the ATO adds <strong>indexation</strong> to debt that's more than 11 months old, at the lower of CPI and wage growth (2.8% on 1 June 2026). The calculator repeats this year by year using your pay rise. It treats voluntary repayments as made before 1 June and compulsory repayments as coming off after each tax return. Future indexation isn't known, so it uses the rate you enter. Repayment thresholds are held at 2026-27 values; they normally rise each year, so the real payoff may take a little longer.</p>""",
 faq=[("How is HECS/HELP indexation worked out?","On 1 June each year the ATO indexes the part of your debt that's more than 11 months old, at the lower of the Consumer Price Index and the Wage Price Index. It was 2.8% on 1 June 2026, 3.2% in 2025 and 4% in 2024."),
      ("What happened with the 20% HECS cut?","The Government cut study loan debts by 20%, based on your balance at 1 June 2025, before that year's indexation. The ATO applied it in late 2025. Your balance in myGov already includes it, so enter that figure."),
      ("Is it worth making voluntary HECS repayments?","It saves indexation and can shorten the time you're repaying, which the calculator shows. There's no interest beyond indexation, so paying off higher-interest debt or building an offset balance often comes first. To beat a 1 June indexation, the ATO needs your payment in time; electronic payments can take up to 4 business days to arrive, so in 2026 that meant paying by Monday 25 May."),
      ("When do I have to start repaying HECS?","When your repayment income is above $69,528 in 2026-27. Below that there's no compulsory repayment, but indexation still applies each year."),
      ("Does my HECS debt get written off?","Not because of time or low income. HELP debts stay until repaid, apart from limited cases such as death or a special-circumstances cancellation.")],
 related=['take-home-pay','gross-up','savings-goal','offset']),
'stamp-duty-nsw': dict(
 how="""<p>NSW transfer duty (stamp duty) is charged on a sliding scale on the property's <strong>dutiable value</strong>: the higher of the price you pay and the market value. Thresholds are indexed to CPI each year; the rate year is set by your contract date. This calculator uses the Revenue NSW 2026-27 rates.</p>
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
 related=['stamp-duty','stamp-duty-vic','stamp-duty-qld','borrowing-power']),
# State stamp duty pages. Every figure comes from stampDuty() in js/duty.js (rates checked 15 Oct 2026
# against each revenue office, linked in each entry); tests/duty.test.mjs checks the worked examples.
'stamp-duty-vic': dict(
 how="""<p>Victorian land transfer duty (stamp duty) is charged on the property's <strong>dutiable value</strong>: the higher of the price you pay and the market value. This calculator uses the State Revenue Office Victoria rates for 2026-27.</p>
<table><thead><tr><th>Dutiable value</th><th>Duty (general rate)</th></tr></thead><tbody>
<tr><td>$0 – $25,000</td><td>1.4% of the value</td></tr>
<tr><td>$25,001 – $130,000</td><td>$350 + 2.4% of the value over $25,000</td></tr>
<tr><td>$130,001 – $960,000</td><td>$2,870 + 6% of the value over $130,000</td></tr>
<tr><td>$960,001 – $2,000,000</td><td>5.5% of the whole value</td></tr>
<tr><td>Over $2,000,000</td><td>$110,000 + 6.5% of the value over $2,000,000</td></tr>
</tbody></table>
<p><strong>Principal place of residence (PPR) rate:</strong> if you'll live in the home and it's valued at $550,000 or less, the band from $130,001 to $440,000 is charged at 5% instead of 6%, and from $440,001 to $550,000 duty is $18,370 + 6% of the value over $440,000. That saves up to $3,100: a $500,000 home costs $21,970 instead of $25,070. Above $550,000 the general rate applies.</p>
<p><strong>First home buyers:</strong> no duty on a home valued at $600,000 or less. From $600,001 to $750,000 the concession tapers, from no duty at $600,000 to full duty at $750,000. <strong>The taper is an estimate:</strong> the formula used here (full duty × (value − $600,000) ÷ $150,000) comes from independent calculators, not the SRO, so confirm the figure with the SRO or your conveyancer. At least one buyer must be an Australian citizen or permanent resident.</p>
<p><strong>Foreign purchasers</strong> pay an extra 8% of the dutiable value on top of duty, worked out on the full value before any concession. If you buy with an Australian citizen or permanent resident, it applies only to the foreign buyer's share.</p>
<p><strong>Worked example:</strong> a $700,000 home: $2,870 + ($700,000 − $130,000) × 6% = <strong>$37,070</strong>. The PPR rate doesn't apply at this price. An eligible first home buyer pays about $24,713 (estimate), and a foreign buyer pays $37,070 + $56,000 surcharge = $93,070.</p>
<p>Confirm rates and eligibility with the <a href="https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/understanding-land-transfer-stamp-duty" target="_blank" rel="noopener noreferrer">State Revenue Office Victoria</a>. Buying in another state? Use the <a href="stamp-duty.html">all-states stamp duty calculator</a>.</p>""",
 faq=[("How much is stamp duty on a $700,000 home in Victoria?","$37,070 at the general rate: $2,870 plus 6% of the value over $130,000. The principal place of residence rate stops at $550,000, so it doesn't help here. An eligible first home buyer pays about $24,713 (an estimate, as the SRO doesn't publish the taper formula), and a foreign buyer pays $93,070 including the 8% surcharge."),
      ("Do first home buyers pay stamp duty in Victoria?","$0 on a home valued at $600,000 or less. Between $600,001 and $750,000 the concession tapers: about $11,356 on a $650,000 home and $24,713 on $700,000, against $34,070 and $37,070 at full rates. From $750,000 you pay full duty ($40,070 at $750,000). The taper figures are estimates from a formula used by independent calculators, not published by the SRO."),
      ("How much does the principal place of residence concession save?","Up to $3,100, on homes valued from $440,000 to $550,000. A $500,000 home you'll live in costs $21,970 instead of $25,070. Above $550,000 there's no PPR concession, so a $600,000 home costs $31,070 whether you live in it or not."),
      ("How much is the foreign purchaser surcharge in Victoria?","8% of the dutiable value, on top of normal duty: $56,000 on a $700,000 home, for a total of $93,070. It's worked out on the full value before any concession, and a foreign buyer on their own can't get first home buyer relief."),
      ("How much is stamp duty on a $1 million home in Victoria?","$55,000. From $960,001 to $2,000,000 Victoria charges 5.5% of the whole value, not just the part over a threshold, and no home or first home concession applies at this price.")],
 related=['stamp-duty','stamp-duty-nsw','stamp-duty-qld','stamp-duty-wa','borrowing-power','mortgage']),
'stamp-duty-qld': dict(
 how="""<p>Queensland transfer duty is charged on the <strong>dutiable value</strong> (the higher of the price and the market value) for every $100 or part of $100. This calculator uses the Queensland Revenue Office rates for 2026-27. There are two scales: the general rate, and a lower home concession rate for a home you'll live in.</p>
<table><thead><tr><th>Dutiable value</th><th>General rate</th></tr></thead><tbody>
<tr><td>$0 – $5,000</td><td>Nil</td></tr>
<tr><td>$5,001 – $75,000</td><td>$1.50 per $100 over $5,000</td></tr>
<tr><td>$75,001 – $540,000</td><td>$1,050 + $3.50 per $100 over $75,000</td></tr>
<tr><td>$540,001 – $1,000,000</td><td>$17,325 + $4.50 per $100 over $540,000</td></tr>
<tr><td>Over $1,000,000</td><td>$38,025 + $5.75 per $100 over $1,000,000</td></tr>
</tbody></table>
<table><thead><tr><th>Dutiable value</th><th>Home concession rate</th></tr></thead><tbody>
<tr><td>$0 – $350,000</td><td>$1 per $100</td></tr>
<tr><td>$350,001 – $540,000</td><td>$3,500 + $3.50 per $100 over $350,000</td></tr>
<tr><td>$540,001 – $1,000,000</td><td>$10,150 + $4.50 per $100 over $540,000</td></tr>
<tr><td>Over $1,000,000</td><td>$30,850 + $5.75 per $100 over $1,000,000</td></tr>
</tbody></table>
<p><strong>Home concession:</strong> on any home valued at $350,000 or more it saves $7,175. From 1 August 2026 foreign buyers can't get it unless they are a specified foreign retiree (visa 405 or 410).</p>
<p><strong>First home buyers:</strong> a <strong>new home</strong> pays no duty, with no price cap (contracts from 1 May 2025). On an <strong>established home</strong> you pay the home concession rate less the first home concession: $17,350 off for homes under $710,000, then $1,735 less for each full $10,000 over $700,000, ending at $800,000. So there's no duty on an established first home up to $700,000, and $10,925 on a $750,000 home ($19,600 home rate less $8,675). At least one buyer must be an Australian citizen or permanent resident.</p>
<p><strong>Foreign purchasers</strong> pay an extra 8% of the dutiable value on top of duty. If you buy with an Australian citizen or permanent resident, it applies only to the foreign buyer's share.</p>
<p><strong>Worked example:</strong> a $700,000 home you'll live in: $10,150 + $4.50 × 1,600 (the $100s over $540,000) = <strong>$17,350</strong>. An investor pays $17,325 + $7,200 = $24,525. An eligible first home buyer pays $0, and a foreign buyer pays $24,525 + $56,000 surcharge = $80,525.</p>
<p>Confirm rates and eligibility with the <a href="https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/" target="_blank" rel="noopener noreferrer">Queensland Revenue Office</a>. Buying in another state? Use the <a href="stamp-duty.html">all-states stamp duty calculator</a>.</p>""",
 faq=[("How much is stamp duty on a $700,000 home in Queensland?","$17,350 if you'll live in it (the home concession rate), or $24,525 for an investor. An eligible first home buyer pays $0, whether the home is new or established, and a foreign buyer pays $80,525 including the 8% surcharge."),
      ("Do first home buyers pay stamp duty in Queensland?","$0 on a new home at any price. On an established home, $0 up to $700,000; then the first home concession shrinks, so a $750,000 home costs $10,925, and from $800,000 you pay the full home concession rate ($21,850 at $800,000)."),
      ("Does a new home make a difference for first home buyers?","Yes: $0 on a new $1 million first home, against $30,850 for an established one at the home concession rate. The new home concession has no price cap; the established home concession ends at $800,000."),
      ("How much does the Queensland home concession save?","$7,175 on any home valued at $350,000 or more. A $1 million home you'll live in costs $30,850 instead of $38,025."),
      ("How much is the foreign buyer surcharge in Queensland?","8% of the dutiable value: $56,000 on a $700,000 home. From 1 August 2026 foreign buyers also can't get the home concession unless they are a specified foreign retiree (visa 405 or 410), so a foreign buyer's total on a $700,000 home is $80,525.")],
 related=['stamp-duty','stamp-duty-nsw','stamp-duty-vic','stamp-duty-wa','borrowing-power','mortgage']),
'stamp-duty-wa': dict(
 how="""<p>Western Australian transfer duty is charged on the <strong>dutiable value</strong> (the higher of the price and the market value) for every $100 or part of $100. This calculator uses the RevenueWA rates for 2026-27.</p>
<table><thead><tr><th>Dutiable value</th><th>Duty (general rate)</th></tr></thead><tbody>
<tr><td>$0 – $120,000</td><td>$1.90 per $100</td></tr>
<tr><td>$120,001 – $150,000</td><td>$2,280 + $2.85 per $100 over $120,000</td></tr>
<tr><td>$150,001 – $360,000</td><td>$3,135 + $3.80 per $100 over $150,000</td></tr>
<tr><td>$360,001 – $725,000</td><td>$11,115 + $4.75 per $100 over $360,000</td></tr>
<tr><td>Over $725,000</td><td>$28,453 + $5.15 per $100 over $725,000</td></tr>
</tbody></table>
<p><strong>Concessional home rate:</strong> for a home you'll live in valued at $200,000 or less: $1.50 per $100 up to $120,000, then $1,800 + $4.04 per $100 over $120,000. A $150,000 home costs $3,012 instead of $3,135. Above $200,000 the general rate applies.</p>
<p><strong>First home buyers</strong> (the first home owner rate): no duty on a home valued at $600,000 or less, from 7 May 2026. From $600,001 to $800,000 duty is $16.15 per $100 over $600,000: $8,075 on a $650,000 home. Above $800,000 the general rate applies. At least one buyer must be an Australian citizen or permanent resident.</p>
<p><strong>Foreign purchasers</strong> pay an extra 7% of the dutiable value on top of duty. If you buy with an Australian citizen or permanent resident, it applies only to the foreign buyer's share.</p>
<p><strong>Worked example:</strong> a $700,000 home: $11,115 + $4.75 × 3,400 (the $100s over $360,000) = <strong>$27,265</strong>. An eligible first home buyer pays $16.15 × 1,000 = $16,150, and a foreign buyer pays $27,265 + $49,000 surcharge = $76,265.</p>
<p>Confirm rates and eligibility with <a href="https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment" target="_blank" rel="noopener noreferrer">RevenueWA</a>. Buying in another state? Use the <a href="stamp-duty.html">all-states stamp duty calculator</a>.</p>""",
 faq=[("How much is stamp duty on a $700,000 home in WA?","$27,265 at the general rate: $11,115 plus $4.75 per $100 over $360,000. WA's owner-occupier discount stops at $200,000, so living in it doesn't change this. An eligible first home buyer pays $16,150, and a foreign buyer pays $76,265 including the 7% surcharge."),
      ("Do first home buyers pay stamp duty in WA?","$0 on a home valued at $600,000 or less, from 7 May 2026. From $600,001 to $800,000 the first home owner rate is $16.15 per $100 over $600,000: $8,075 on a $650,000 home and $16,150 on $700,000, against $24,890 and $27,265 at the general rate. Above $800,000 normal duty applies."),
      ("Is there a stamp duty discount for owner-occupiers in WA?","Only on homes valued at $200,000 or less, through the concessional rate: a $150,000 home costs $3,012 instead of $3,135. Above $200,000 there's no owner-occupier discount unless you're a first home buyer."),
      ("How much is the foreign buyer surcharge in WA?","7% of the dutiable value, on top of normal duty: $49,000 on a $700,000 home, for a total of $76,265. A foreign buyer on their own can't use the first home owner rate."),
      ("How much is stamp duty on a $1 million home in WA?","$42,616: $28,453 plus $5.15 per $100 over $725,000. No home or first home concession applies at this price.")],
 related=['stamp-duty','stamp-duty-nsw','stamp-duty-vic','stamp-duty-qld','borrowing-power','mortgage']),
'take-home-pay': dict(
 how="""<p>Your take-home pay, or salary after tax, is your salary minus income tax and the Medicare levy. This calculator uses the 2026-27 resident tax rates, which cut the second bracket from 16% to 15% from 1 July 2026, and the new <strong>$1,000 standard deduction</strong> for work-related expenses that the ATO applies automatically from 2026-27.</p>
<table><thead><tr><th>Taxable income</th><th>Tax rate (2026-27)</th></tr></thead><tbody>
<tr><td>$0 – $18,200</td><td>Nil</td></tr><tr><td>$18,201 – $45,000</td><td>15%</td></tr><tr><td>$45,001 – $135,000</td><td>30%</td></tr>
<tr><td>$135,001 – $190,000</td><td>37%</td></tr><tr><td>$190,001 and over</td><td>45%</td></tr></tbody></table>
<p>It then subtracts the <strong>low income tax offset</strong> (up to $700, phasing out by $66,667) and adds the <strong>Medicare levy</strong> of 2%, which is reduced for low incomes. Employer super of 12% is shown separately because it's paid on top of your salary, not out of it (unless you enter a package that includes super).</p>
<h3>Tax on common salaries (2026-27)</h3>
<table><thead><tr><th>Salary</th><th>Income tax</th><th>Medicare levy</th><th>Take-home pay</th></tr></thead><tbody>
<tr><td>$50,000</td><td>$4,955</td><td>$980</td><td>$44,065</td></tr>
<tr><td>$70,000</td><td>$11,220</td><td>$1,380</td><td>$57,400</td></tr>
<tr><td>$90,000</td><td>$17,220</td><td>$1,780</td><td>$71,000</td></tr>
<tr><td>$100,000</td><td>$20,220</td><td>$1,980</td><td>$77,800</td></tr>
<tr><td>$120,000</td><td>$26,220</td><td>$2,380</td><td>$91,400</td></tr>
<tr><td>$150,000</td><td>$36,200</td><td>$2,980</td><td>$110,820</td></tr>
</tbody></table>
<p>Resident employees with the $1,000 standard deduction, the low income tax offset and no HECS/HELP debt. Per week, that's $847 on $50,000, $1,365 on $90,000 and $2,131 on $150,000. Super is paid on top.</p>""",
 faq=[("How much tax do I pay on $100,000 in Australia?","$22,200 in 2026-27: $20,220 in income tax plus $1,980 Medicare levy, after the $1,000 standard deduction. That leaves a salary after tax of $77,800, or $1,496 a week. Your employer also pays $12,000 super on top."),
      ("What is take-home pay on $80,000?","$64,200 a year in 2026-27, which is $1,234.62 a week or $2,469.23 a fortnight. Income tax is $14,220 and the Medicare levy $1,580, with the $1,000 standard deduction and no HECS/HELP debt."),
      ("Does this include HECS/HELP repayments?","Yes: tick “I have a HECS/HELP debt”. From 2025-26 repayments are marginal: nothing up to $69,528 in 2026-27, then 15c per dollar above that, rising to 17c above $129,717, and 10% of all income above $186,050. The ATO uses repayment income, which can include fringe benefits and salary-sacrificed super, so yours may be higher."),
      ("What is the $1,000 standard deduction?","From 2026-27 the ATO automatically takes up to $1,000 off the taxable income of resident employees, with no receipts needed. It's worth $320 a year at the 30% rate (with Medicare). It isn't taken out of your pay each week, so it comes back as part of your tax return. If you claim more than $1,000 of work expenses instead, untick it."),
      ("What isn't included?","The Medicare levy surcharge, salary sacrifice, and deductions and offsets other than the standard deduction and low income tax offset."),
      ("What's the difference between salary and package?","A salary excludes super; your employer pays 12% super on top. A package (total remuneration) includes super, so your actual salary is lower. Tick “Salary includes super” if your figure is a package."),
      ("Why is my payslip slightly different?","Employers withhold tax using ATO tax tables per pay period, which round differently. Your final tax is settled when you lodge your return."),
      ("Is there a cap on super?","Yes. Super guarantee is only payable on earnings up to the maximum contribution base ($270,830 for 2026-27), which this calculator applies.")],
 related=['gross-up','super','hecs-help','work-deductions']),
'mortgage': dict(
 how="""<p>Repayments on a principal and interest loan are calculated with the standard amortisation formula: each repayment covers that period's interest and pays down some principal. Early on, most of each repayment is interest.</p>
<h3>Monthly repayments over 30 years</h3>
<table><thead><tr><th>Loan</th><th>5.5% p.a.</th><th>6% p.a.</th><th>6.5% p.a.</th></tr></thead><tbody>
<tr><td>$400,000</td><td>$2,271</td><td>$2,398</td><td>$2,528</td></tr>
<tr><td>$500,000</td><td>$2,839</td><td>$2,998</td><td>$3,160</td></tr>
<tr><td>$600,000</td><td>$3,407</td><td>$3,597</td><td>$3,792</td></tr>
<tr><td>$750,000</td><td>$4,258</td><td>$4,497</td><td>$4,741</td></tr>
<tr><td>$1,000,000</td><td>$5,678</td><td>$5,996</td><td>$6,321</td></tr>
</tbody></table>
<p>Principal and interest, monthly repayments, constant rate, no fees.</p>
<p><strong>Tip:</strong> paying fortnightly, half your monthly repayment every two weeks, means 26 half-payments a year: the equivalent of 13 monthly payments. That extra payment can cut years off a 30-year loan. This calculator shows the true fortnightly amount for the same term, so compare carefully.</p>""",
 faq=[("What are the repayments on a $600,000 mortgage?","$3,597 a month at 6% p.a. over 30 years, or $1,659.50 a fortnight or $829.58 a week. At 5.5% it's $3,407 a month and at 6.5% it's $3,792."),
      ("How much interest will I pay over 30 years?","$695,029 on a $600,000 loan at 6% p.a. with monthly repayments, so you repay $1,295,029 in total. At 5.5% the interest is $626,424 and at 6.5% it's $765,267. In the first year, $35,800 of the $43,168 you repay is interest."),
      ("Does this include fees or LMI?","No. It covers principal and interest only, at a constant rate. Lender fees, lenders mortgage insurance and rate changes aren't included."),
      ("What about interest-only loans?","Interest-only repayments are simply loan amount × rate ÷ repayments per year. This calculator covers principal and interest loans."),
      ("How much will I save with an offset account?","About $202,175 in interest and 4 years 8 months off the loan, with $50,000 in offset against a $600,000 loan at 6% over 30 years and the same $3,597 monthly repayment. Use the <a href=\"offset.html\">offset account calculator</a> for your own balance.")],
 related=['borrowing-power','stamp-duty','offset','rental-cashflow']),
'offset': dict(
 how="""<p>On a $600,000 loan at 6% over 30 years, keeping $50,000 in offset saves <strong>$202,175</strong> in interest and finishes the loan <strong>4 years 8 months</strong> sooner. $100,000 in offset saves <strong>$338,658</strong> and <strong>7 years 10 months</strong>. Both assume the balance stays the same and you keep paying $3,597 a month.</p>
<p>An offset account is a transaction account linked to your home loan. Its balance is subtracted from your loan balance before interest is calculated, so $50,000 in offset on a $600,000 loan means you're charged interest on $550,000.</p>
<p>Because your repayment stays the same, more of each payment goes to principal and the loan finishes early. This calculator compares the loan with and without the offset to show interest and time saved.</p>""",
 faq=[("Is an offset better than extra repayments?","Financially they save the same interest. An offset keeps your money accessible; extra repayments may be harder to withdraw (redraw rules vary by lender)."),
      ("Does the calculator assume my offset balance changes?","No, it assumes a constant balance. In practice your balance moves with your pay and spending."),
      ("Is offset interest saving taxable?","Interest saved through an offset isn't income, so it isn't taxed, unlike interest earned in a savings account. Check your own situation with a tax professional.")],
 related=['mortgage','borrowing-power','savings-goal','hecs-help']),
'rental-yield': dict(
 how="""<p><strong>Gross yield</strong> = annual rent ÷ purchase price × 100. It's the quick comparison figure used in listings.</p>
<p><strong>Net yield</strong> = (annual rent after vacancy − annual costs) ÷ purchase price × 100. It's a better guide to what the property actually earns before mortgage interest and tax.</p>
<p><strong>Example:</strong> $520/week on a $550,000 property is $27,040 a year: a 4.92% gross yield. With 2 weeks' vacancy and $7,500 of yearly costs, net income is $18,500, a 3.36% net yield.</p>""",
 faq=[("What costs should I include?","Council and water rates, landlord insurance, strata levies, property management fees, repairs and maintenance, and land tax if it applies."),
      ("Does this include mortgage repayments?","No. Yield measures the property's return on its price. Use the mortgage calculator for repayments and consider your cash flow separately."),
      ("What's a good rental yield?","About 3% to 5% gross is typical in Australia's capital cities. Cotality's figures to 30 September 2026 put the national gross yield at 3.85%, with houses at 3.6% and units at 4.7%, and capital cities ranging from 3.4% in Sydney to 6.5% in Darwin. These are industry estimates, not official statistics. Higher-yield areas often have lower capital growth, so compare a property with its local average rather than a national rule.")],
 related=['rental-cashflow','mortgage','stamp-duty','capital-gains-tax']),
'compound-interest': dict(
 how="""<p>Compound interest means you earn interest on your interest. The balance grows by <em>A = P(1 + r/n)<sup>nt</sup></em>, where P is the starting amount, r the annual rate, n the compounding periods per year and t the years. Regular deposits are added each period.</p>
<p>The year-by-year table shows how much of your balance comes from deposits and how much from interest. Over long periods, interest usually overtakes deposits.</p>""",
 faq=[("Does compounding frequency matter much?","A little. Daily compounding earns slightly more than monthly, and monthly slightly more than annually, at the same rate. Time and rate matter far more."),
      ("Does this include tax?","No. Interest earned in a savings account is taxable income in Australia. Results also ignore fees and rate changes."),
      ("Can I use this for investments?","Yes, as a rough guide with an expected average return, but investment returns vary year to year and aren't guaranteed.")],
 related=['savings-goal','inflation','super','offset']),
'gst': dict(
 how="""<p>Australia's GST rate is 10%.</p>
<ul><li><strong>Add GST:</strong> price × 1.1. $100 + GST = $110.</li>
<li><strong>Remove GST:</strong> price ÷ 1.1. $110 includes $10 GST.</li>
<li><strong>GST in a GST-inclusive price:</strong> price ÷ 11. For $220, GST is $20.</li></ul>
<p>A common mistake is taking 10% off a GST-inclusive price: $110 − 10% = $99, not $100.</p>
<h3>Adding GST</h3>
<table><thead><tr><th>Price before GST</th><th>GST</th><th>Total</th></tr></thead><tbody>
<tr><td>$50</td><td>$5.00</td><td>$55.00</td></tr>
<tr><td>$99</td><td>$9.90</td><td>$108.90</td></tr>
<tr><td>$1,000</td><td>$100.00</td><td>$1,100.00</td></tr>
<tr><td>$5,500</td><td>$550.00</td><td>$6,050.00</td></tr>
</tbody></table>
<h3>Removing GST from a total</h3>
<table><thead><tr><th>Total with GST</th><th>GST inside</th><th>Price before GST</th></tr></thead><tbody>
<tr><td>$50</td><td>$4.55</td><td>$45.45</td></tr>
<tr><td>$99</td><td>$9.00</td><td>$90.00</td></tr>
<tr><td>$1,000</td><td>$90.91</td><td>$909.09</td></tr>
<tr><td>$5,500</td><td>$500.00</td><td>$5,000.00</td></tr>
</tbody></table>""",
 faq=[("How do I calculate GST from a total?","Divide the total by 11. For a $1,000 GST-inclusive price, the GST is $1,000 ÷ 11 = $90.91, and the price before GST is $1,000 ÷ 1.1 = $909.09."),
      ("Is GST charged on fresh food, rent or medical?","Mostly no. The ATO lists most basic food, some medical, health and care services, some medicines and some medical aids as <a href=\"https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/when-to-charge-gst-and-when-not-to/gst-free-sales\" target=\"_blank\" rel=\"noopener noreferrer\">GST-free</a>. Renting out a home is <a href=\"https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/when-to-charge-gst-and-when-not-to/input-taxed-sales\" target=\"_blank\" rel=\"noopener noreferrer\">input taxed</a>, so residential rent has no GST. Not every food is GST-free, so check the ATO's detailed food list."),
      ("Why divide by 11?","Because a GST-inclusive price is 110% of the base price, GST is 10/110 = 1/11 of the total."),
      ("Do I need to charge GST?","Generally, businesses must register for GST when their GST turnover is $75,000 or more. Check the <a href=\"https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst\" target=\"_blank\" rel=\"noopener noreferrer\">ATO's GST guide</a> for your situation.")],
 related=['percentage','work-deductions','car-stamp-duty','take-home-pay']),
'percentage': dict(
 how="""<ul><li><strong>X% of Y</strong> = X ÷ 100 × Y. 15% of 200 = 30.</li>
<li><strong>X is what % of Y</strong> = X ÷ Y × 100. 30 is 25% of 120.</li>
<li><strong>Percentage change</strong> = (new − old) ÷ old × 100. From 80 to 100 is +25%.</li></ul>
<p>Note that a 25% increase followed by a 25% decrease doesn't get you back to where you started: 80 → 100 → 75.</p>""",
 faq=[("How do I add a percentage to a number?","Multiply by (1 + percent ÷ 100). To add 15% to 200: 200 × 1.15 = 230."),
      ("What's the difference between percent and percentage points?","If a rate goes from 5% to 6%, it rose by 1 percentage point, which is a 20% increase.")],
 related=['gst','calculator','unit-converter','date-calculator']),
'calculator': dict(
 how="""<p>Switch between <strong>Basic</strong> for everyday sums and <strong>Scientific</strong> for trigonometry, logarithms, powers, roots and factorials. It follows the normal order of operations: brackets, then powers, then × and ÷, then + and −. So <em>−2²</em> is −4 and <em>2³²</em> (2^3^2) is 512.</p>
<p>Trig functions work in degrees or radians: tap the angle button to switch. A number next to a bracket, π or a function multiplies, so <em>2π</em> and <em>3 sin(30)</em> work as written. The % key divides by 100, so <em>50% × 200</em> = 100.</p>
<p>On a keyboard, use * for ×, / for ÷, ^ for powers, ! for factorial, Enter for equals, Backspace to delete and Esc to clear.</p>""",
 faq=[("Does it use degrees or radians?","Degrees by default, which suits most school and trade maths. Tap the Degrees button to switch to radians; your choice is remembered on this device."),
      ("Why does it say Math error?","The input has no real answer, such as the square root of a negative number, the log of 0, tan 90° or the factorial of a fraction."),
      ("Is anything I type saved or sent anywhere?","No. Everything runs in your browser. The tape of recent sums is cleared when you leave the page."),
      ("Why does 0.1 + 0.2 show 0.3?","Results are rounded to 15 significant digits to hide the tiny floating-point errors common in computer arithmetic. Very large and very small results are shown in scientific notation.")],
 related=['percentage','unit-converter','date-calculator','gst']),
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
      ("How much CGT will I pay on $100,000 profit?","About $16,350 if you sell before 1 July 2027, or about $33,861 under the new rules, for shares held more than 12 months by someone with $90,000 of other income. Selling before 1 July 2027 (bought 1 March 2025, sold 1 March 2027), the 50% discount means only $50,000 is taxed. Bought on 1 July 2027 and sold on 1 July 2029, indexation at an assumed 2.5% inflation (factor 1.051) reduces the taxable gain to $94,900, with no discount. Both include the Medicare levy; the 30% minimum tax adds nothing at this income."),
      ("Why do I need to enter my other income?","Capital gains are added to your taxable income, so the tax depends on your marginal rate. A $50,000 gain costs much less for someone with no other income than for someone earning $200,000."),
      ("What isn't covered?","Partial main residence exemptions, small business concessions, assets bought before 21 September 1999 using frozen indexation, trusts and companies, and the Working Australians Tax Offset. Ask a registered tax agent if these apply to you.")],
 related=['inflation','rental-cashflow','take-home-pay','medicare-levy-surcharge']),
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
<p><strong>Buying in NSW, Victoria, Queensland or WA?</strong> The <a href="stamp-duty-nsw.html">NSW</a>, <a href="stamp-duty-vic.html">Victoria</a>, <a href="stamp-duty-qld.html">Queensland</a> and <a href="stamp-duty-wa.html">WA</a> stamp duty calculators show that state's rate table, home and first home buyer rules and a worked example step by step.</p>
<p>Rates and thresholds were checked against each state's revenue office on 15 October 2026: <a href="https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty" target="_blank" rel="noopener noreferrer">Revenue NSW</a>, <a href="https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/understanding-land-transfer-stamp-duty" target="_blank" rel="noopener noreferrer">State Revenue Office Victoria</a>, <a href="https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/" target="_blank" rel="noopener noreferrer">Queensland Revenue Office</a>, <a href="https://revenuesa.sa.gov.au/stamp-duty/rate-of-stamp-duty" target="_blank" rel="noopener noreferrer">RevenueSA</a>, <a href="https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment" target="_blank" rel="noopener noreferrer">RevenueWA</a>, <a href="https://www.sro.tas.gov.au/property-transfer-duties/rates-of-duty" target="_blank" rel="noopener noreferrer">State Revenue Office Tasmania</a>, <a href="https://www.revenue.act.gov.au/rates-and-property-charges/conveyance-duty-stamp-duty/conveyance-duty-for-non-commercial-property" target="_blank" rel="noopener noreferrer">ACT Revenue Office</a> and <a href="https://nt.gov.au/property/buying-and-selling-a-home/settle-the-sale/stamp-duty-buying-or-selling-a-home/conveyance-calculator" target="_blank" rel="noopener noreferrer">Territory Revenue Office</a>. Tick <em>I'll live in it</em> for owner-occupier rates (Victoria up to $550,000, Queensland's home concession, the ACT owner-occupier scale and WA's concessional rate up to $200,000).</p>
<p><strong>Foreign buyers</strong> pay the surcharge on the full dutiable value, on top of duty and before any concession. First home relief needs at least one buyer who is an Australian citizen or permanent resident in every state except the ACT and NT, and from 1 August 2026 Queensland's home concession does too. With a joint purchase the surcharge applies only to the foreign buyer's share.</p>""",
 faq=[("Which state has the cheapest stamp duty?","On a $750,000 investment property the ACT is cheapest ($22,200) and Victoria the dearest ($40,070). In between are Queensland ($26,775), NSW ($27,937), Tasmania ($28,935), WA ($29,741), South Australia ($35,080) and the NT ($37,125). The order changes with price and buyer: first home buyers can pay nothing in several states, depending on price and whether the home is new."),
      ("Why does the new home box matter?","In Queensland and South Australia, first home buyers pay no duty on a new home regardless of price, but get less or no relief on an established home. In the NT, anyone buying a new house and land package from a builder to live in pays no duty, for contracts signed to 30 June 2027."),
      ("Can foreign buyers get first home buyer relief?","Not on their own, except in the ACT. NSW, Victoria, Queensland, South Australia, WA and Tasmania need at least one buyer to be an Australian citizen or permanent resident (New Zealand citizens on a special category visa usually count too). If you buy with one, the surcharge applies only to the foreign buyer's share, so check the exact figure with your state's revenue office."),
      ("Are any figures estimates?","Yes. Victoria's and NSW's first home buyer tapers use formulas published by independent calculators because the revenue offices don't publish them. The page tells you when a result uses one. NT rates above $3 million (5.75%, and 5.95% from $5 million) come from NT Treasury's 2024-25 Budget Paper 2."),
      ("Does this cover commercial property or vacant land?","No. It covers residential purchases. Vacant land and commercial property often have different rules; check your state's revenue office.")],
 related=['stamp-duty-nsw','stamp-duty-vic','stamp-duty-qld','stamp-duty-wa','borrowing-power','mortgage','car-stamp-duty']),
'unit-converter': dict(
 how="""<p>Convert between metric and imperial units for length, mass, volume, area, speed and temperature. Australia uses metric, but you'll still meet feet, pounds and Fahrenheit in recipes, specs and overseas listings.</p>
<p>Australian real estate sometimes quotes house size in <strong>squares</strong>: one square is 100 square feet, or about 9.29 m².</p>""",
 faq=[("Is a cup the same everywhere?","No. This converter uses the Australian metric cup of 250 mL. A US cup is about 237 mL."),
      ("How do I convert Celsius to Fahrenheit?","°F = °C × 9/5 + 32. So 25 °C is 77 °F.")],
 related=['calculator','percentage','date-calculator','world-clock']),
'date-calculator': dict(
 how="""<p>Count the days between two dates, including a breakdown into years, months and days, weeks, and business days (Monday to Friday). You can also add or subtract days from a date, handy for notice periods, settlement dates and deadlines.</p>
<p>Business days skip weekends and NSW public holidays, useful for settlement periods and notice periods.</p>
<p>By default the end date isn't counted (1 Jan to 2 Jan is 1 day). Tick “Include the end date” to count both.</p>""",
 faq=[("Are public holidays excluded from business days?","Yes, NSW statewide public holidays for 2026 and 2027 are excluded when the box is ticked. Local public holidays and the August Bank Holiday aren't included, and other states' holidays differ."),
      ("Does daylight saving affect the count?","No. Dates are counted as whole calendar days, so daylight saving changes don't cause off-by-one errors.")],
 related=['world-clock','timer','calculator','stopwatch']),
'world-clock': dict(
 how="""<p>See the current time in cities around the world, with the difference from your own time. Add cities you call or work with often; your list is saved on this device.</p>
<p>To plan a call, use <strong>Convert a time</strong>: pick a date and time in any city, and every clock shows what time that will be there. Daylight saving is handled automatically, including the different change-over dates in Australia, Europe and North America.</p>""",
 faq=[("Why does the time difference change during the year?","Daylight saving starts and ends on different dates in different countries, and Queensland, the NT and WA don't use it at all, so the gap between two cities can shift by an hour."),
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
cats = dict(re.findall(r"slug: '([^']+)'.*?cat: '([^']+)'", src))
RATES_CHECKED = re.search(r"RATES_CHECKED = '([^']+)'", src).group(1)
CHECKED_ISO = datetime.strptime(RATES_CHECKED, '%d %b %Y').date().isoformat()
config = open('js/config.js').read()
SITE_NAME = re.search(r"SITE_NAME = '([^']*)'", config).group(1)
SITE_URL = re.search(r"SITE_URL = '([^']*)'", config).group(1).rstrip('/')
# The same Organization that scripts/seo.mjs describes on the home page.
PUBLISHER = {"@type": "Organization", "name": SITE_NAME, **({"@id": f"{SITE_URL}/#organization", "url": f"{SITE_URL}/"} if SITE_URL else {})}

def ext(url, text): return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{text}</a>'

# Visible "checked" line at the top of each money tool's explainer: the date from js/tools.js and the
# main official source for that tool. Tools with no official rates name the Moneysmart calculator
# that uses the same method, so readers can cross-check a result.
TRUST = {
  'take-home-pay': ('rates', ext('https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents', "the ATO's resident tax rates")),
  'gross-up': ('rates', ext('https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents', "the ATO's resident tax rates")),
  'capital-gains-tax': ('rates', ext('https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax', "the ATO's capital gains tax pages")),
  'work-deductions': ('rates', ext('https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/working-from-home-expenses/fixed-rate-method', "the ATO's fixed rate method")),
  'hecs-help': ('rates', ext('https://www.ato.gov.au/tax-rates-and-codes/study-and-training-loan-minimum-repayment-income-and-rates', "the ATO's study loan repayment rates")),
  'gst': ('rates', ext('https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst', "the ATO's GST guide")),
  'super': ('rates', ext('https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps', "the ATO's super contribution caps")),
  'medicare-levy-surcharge': ('rates', ext('https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates', "the ATO's surcharge thresholds")),
  'stamp-duty': ('rates', "each state and territory revenue office (links below)"),
  'stamp-duty-nsw': ('rates', ext('https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty', 'Revenue NSW')),
  'stamp-duty-vic': ('rates', ext('https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/understanding-land-transfer-stamp-duty', 'State Revenue Office Victoria')),
  'stamp-duty-qld': ('rates', ext('https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/', 'Queensland Revenue Office')),
  'stamp-duty-wa': ('rates', ext('https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment', 'RevenueWA')),
  'car-stamp-duty': ('rates', "each state's revenue office or transport department"),
  'rental-cashflow': ('rates', ext('https://www.legislation.gov.au/C2026A00049/asmade/text', 'the Treasury Laws Amendment (Tax Reform No. 1) Act 2026') + ' and the ATO tax rates'),
  'borrowing-power': ('rates', ext('https://www.apra.gov.au/news-and-publications/apra-maintains-current-macroprudential-policy-settings-highly-uncertain', "APRA's serviceability buffer")),
  'inflation': ('rates', ext('https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia', 'ABS Consumer Price Index')),
  'mortgage': ('method', ext('https://moneysmart.gov.au/home-loans/mortgage-calculator', "Moneysmart's mortgage calculator")),
  'offset': ('note', 'Repayments use the same formula as ' + ext('https://moneysmart.gov.au/home-loans/mortgage-calculator', "Moneysmart's mortgage calculator") + ', with interest charged at your repayment frequency.'),
  'personal-loan': ('method', ext('https://moneysmart.gov.au/loans/personal-loan-calculator', "Moneysmart's personal loan calculator")),
  'savings-goal': ('method', ext('https://moneysmart.gov.au/saving/savings-goals-calculator', "Moneysmart's savings goals calculator")),
  'compound-interest': ('method', ext('https://moneysmart.gov.au/budgeting/compound-interest-calculator', "Moneysmart's compound interest calculator")),
  'credit-card': ('method', ext('https://moneysmart.gov.au/credit-cards/credit-card-calculator', "Moneysmart's credit card calculator")),
  'rental-yield': ('note', 'The costs to include follow ' + ext('https://moneysmart.gov.au/property-investment/buying-an-investment-property', "Moneysmart's guide to buying an investment property") + '.'),
  'refinance': ('note', 'Approach checked against ' + ext('https://moneysmart.gov.au/home-loans/mortgage-switching-calculator', "Moneysmart's mortgage switching calculator") + '; government fees from NSW Land Registry Services 2026-27.'),
  'balance-transfer': ('method', ext('https://moneysmart.gov.au/credit-cards/credit-card-calculator', "Moneysmart's credit card calculator")),
  'tax-refund': ('rates', ext('https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents', "the ATO's resident tax rates") + ' and the ATO Medicare levy, surcharge and study loan pages'),
  'rent-vs-buy': ('note', 'Stamp duty uses each state revenue office\'s rates; every other figure is an assumption you can change.'),
  'retirement': ('note', 'Defaults follow ' + ext('https://moneysmart.gov.au/how-super-works/superannuation-calculator', "Moneysmart's superannuation calculator") + '; ASFA standard as published by ' + ext('https://moneysmart.gov.au/glossary/asfa-retirement-standard', 'Moneysmart') + '.'),
  'budget': ('method', ext('https://moneysmart.gov.au/budgeting/budget-planner', "Moneysmart's budget planner")),
  'lmi': ('note', 'LMI premiums are an estimate from one lender\'s published table; duty on LMI checked against each state revenue office; scheme price caps from ' + ext('https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps', 'Housing Australia') + '.'),
  'upfront-costs': ('rates', "each state's revenue office and land titles office 2026-27 fee schedules"),
}
def trust_line(slug):
    if slug not in TRUST: return ''
    kind, src = TRUST[slug]
    if kind == 'rates': return f'<p class="checked-line">Rates checked {RATES_CHECKED} against {src}.</p>\n'
    if kind == 'note': return f'<p class="checked-line">Checked {RATES_CHECKED}. {src}</p>\n'
    return f'<p class="checked-line">Checked {RATES_CHECKED}. Uses the same approach as {src}, so you can cross-check a result there.</p>\n'

# Every page's <head> has the Content-Security-Policy meta tag and one inline boot script
# (theme + page script loader). Its hash is in the policy; npm test checks they match.
BOOT = "try{var d=document.documentElement,t=localStorage.getItem('theme');if(t==='light'||t==='dark')d.dataset.theme=t;if(/\"/.test(localStorage.getItem('pinnedTools')||''))d.classList.add('has-pins')}catch(e){};(function(m){function go(){var s=document.createElement('script');s.type='module';s.src=m;document.head.appendChild(s)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})(document.currentScript.getAttribute('data-module'))"

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
      {trust_line(slug)}{c['how']}
      <h2>Frequently asked questions</h2>
      {faq_html}
      <h2>Related tools</h2>
      <nav class="related">{rel}</nav>
    </section>
    <!-- content:end -->'''
    s = s.replace('\n  </main>', block + '\n  </main>')
    ld = [
      {"@context":"https://schema.org","@type":"WebApplication","name":name,"description":desc,"inLanguage":"en-AU","isAccessibleForFree":True,"applicationCategory":"FinanceApplication" if cats.get(slug) in ('tax','property','money') else "UtilitiesApplication","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"AUD"},"dateModified":CHECKED_ISO,"publisher":PUBLISHER},
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
