// Salary needed for a target take-home pay. Inverts takeHome() from calc.js by binary search,
// so every figure agrees exactly with the Take-Home Pay calculator (same rates, same rounding).
// Rates are whatever calc.js uses (from js/rates.js: ATO 2026-27 resident rates, Medicare levy, HELP marginal system).
import { takeHome } from './calc.js';

// targetNet: annual take-home pay wanted. opts: { includesSuper, help, standardDeduction } as for takeHome().
// Returns the takeHome() result for the smallest gross (to the cent) whose take-home pay is at
// least the target, plus `gross` (the amount you'd enter in the Take-Home Pay tool) and
// `package` (salary plus employer super).
export function grossUp(targetNet, opts = {}) {
  if (!Number.isFinite(targetNet) || targetNet <= 0) {
    const r = takeHome(0, opts);
    return { ...r, gross: 0, package: r.salary + r.super };
  }
  const net = (g) => takeHome(g, opts).net;
  // Take-home pay is never less than 40% of gross at 2026-27 rates, so this upper bound usually
  // holds; keep doubling just in case.
  let lo = 0, hi = targetNet * 2.5 + 1000;
  while (net(hi) < targetNet) hi *= 2;
  // HELP's top band (10% of all income) creates a jump of under 40c at $186,050, so net pay is
  // not strictly increasing there. Bisection still lands within a dollar or two of the answer,
  // which the search below pins down.
  for (let i = 0; i < 200 && hi - lo > 1e-7; i++) {
    const mid = (lo + hi) / 2;
    if (net(mid) >= targetNet) hi = mid; else lo = mid;
  }
  // Taxable income is whole dollars (cents are dropped, as on a tax return), so take-home pay rises cent by cent
  // within each dollar of taxable income, then steps back a little at the next dollar. A salary up to a dollar or
  // so below the bisection's answer can therefore give the same take-home pay. Check every cent from $6 below
  // (well past where the target can still be reached) to $2 above, and take the smallest that reaches it.
  const top = Math.round(hi * 100) + 200;
  let gross = null;
  for (let c = Math.max(0, Math.round(hi * 100) - 600); c <= top && gross === null; c++) if (net(c / 100) >= targetNet - 1e-9) gross = c / 100; // allow for floating-point noise
  if (gross === null) { gross = top / 100; while (net(gross) < targetNet) gross = Math.round((gross + 0.01) * 100) / 100; }
  const r = takeHome(gross, opts);
  return { ...r, gross, package: r.salary + r.super };
}
