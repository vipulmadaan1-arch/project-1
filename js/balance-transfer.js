// Balance transfer: stay on your current card or move the balance to a low-rate intro offer.
// Pure maths, no rates to look up. Same monthly model as js/loans.js (and Moneysmart's credit card
// calculator, https://moneysmart.gov.au/credit-cards/credit-card-calculator): interest is charged each month
// at the annual rate ÷ 12, then the repayment comes off; no new purchases, cash advances or annual fees.
// The transfer fee is a percentage of the balance, added to the new card's balance on day one.
import { cardPayoff, cardPaymentFor } from './loans.js';

export const BALANCE_TRANSFER_CHECKED = '15 Oct 2026';
const MAX_MONTHS = 1200; // 100 years, as in loans.js

export function transferPayoff({ balance, introRatePct, introMonths, revertRatePct, payment }) {
  let bal = balance, interest = 0, paid = 0, months = 0, leftAtIntroEnd = introMonths === 0 ? balance : null;
  while (bal > 0.005 && months < MAX_MONTHS) {
    const rate = months < introMonths ? introRatePct : revertRatePct;
    const charge = bal * rate / 100 / 12;
    if (payment <= charge + 1e-9) return { paysOff: false, reason: 'interest', months: Infinity, interest: Infinity, totalPaid: Infinity, leftAtIntroEnd: leftAtIntroEnd ?? bal };
    interest += charge;
    bal += charge;
    const p = Math.min(payment, bal);
    paid += p; bal -= p; months++;
    if (months === introMonths) leftAtIntroEnd = Math.max(0, bal);
  }
  if (bal > 0.005) return { paysOff: false, reason: 'too-long', months: Infinity, interest: Infinity, totalPaid: Infinity, leftAtIntroEnd };
  return { paysOff: true, months, interest, totalPaid: paid, leftAtIntroEnd: leftAtIntroEnd ?? 0 };
}

export function balanceTransfer({ balance, currentRatePct, feePct = 0, introRatePct = 0, introMonths, revertRatePct, payment }) {
  const fee = balance * feePct / 100;
  const stay = cardPayoff({ balance, ratePct: currentRatePct, payment });
  const move = transferPayoff({ balance: balance + fee, introRatePct, introMonths, revertRatePct, payment });
  const stayCost = stay.paysOff ? stay.interest : Infinity;
  const moveCost = move.paysOff ? move.interest + fee : Infinity;
  // Monthly repayment that clears the transferred balance (fee included) by the end of the intro period.
  const clearInIntro = introMonths > 0 ? cardPaymentFor({ balance: balance + fee, ratePct: introRatePct, months: introMonths }).payment : null;
  return {
    fee,
    stay: { ...stay, cost: stayCost },
    move: { ...move, cost: moveCost },
    saving: Number.isFinite(stayCost) && Number.isFinite(moveCost) ? stayCost - moveCost : null,
    clearInIntro,
  };
}
