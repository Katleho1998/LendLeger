import { Loan, LoanStatus } from '../types';

export interface PortfolioMetrics {
  totalPrincipal: number;       // Total ever disbursed to borrowers (cash out)
  totalCollected: number;       // Real cash collected (excludes PENALTY entries, which are
                                 // just a debt marker, no cash actually changes hands for them)
  totalInterestEarned: number;  // Profit -- ONLY from loans that reached status PAID: cash
                                 // collected minus principal (so a genuine overpayment counts
                                 // as full profit too, not just the contracted interest). A loan
                                 // still ACTIVE/OVERDUE contributes 0 here regardless of partial
                                 // payments made -- profit is only recognized once a loan is
                                 // fully paid off, not progressively as payments come in.
  writeOffLoss: number;         // Net realized outcome of written-off loans: cash actually
                                 // recovered from them minus what was originally lent out.
                                 // Negative = a loss (the normal case); can be positive if a
                                 // loan had already recovered more than its principal before
                                 // the remaining (smaller, interest-only) balance was forgiven.
                                 // Deliberately kept OUT of netProfit -- see netProfit's comment.
  totalWrittenOff: number;      // The true capital lost to write-offs, portfolio-wide: for each
                                 // written-off loan, principal minus whatever cash actually came
                                 // back (floored at 0 per loan -- a loan that had already
                                 // recovered its full principal before the remaining, uncollected
                                 // interest was forgiven represents no capital loss at all). This
                                 // is deliberately NOT the full unpaid contractual balance -- that
                                 // figure blends in interest that was never actually collected,
                                 // so treating it as "lost" would overstate the real loss. (An
                                 // individual loan's own `writeOffAmount` field, shown on its
                                 // card and in the detailed Write-Offs report, is still the full
                                 // forgiven balance -- a legitimate, different, per-loan figure
                                 // for "how much of the contract did we let this borrower off
                                 // the hook for".)
  totalOutstanding: number;     // Sum of current balances still owed on open loans
  overdueAmount: number;        // Sum of balances specifically on OVERDUE loans
  netProfit: number;            // = totalInterestEarned only. Write-offs are deliberately NOT
                                 // netted in here -- Net Profit means "profit banked from deals
                                 // that were actually completed", and write-off losses are shown
                                 // as their own separate figure (writeOffLoss / totalWrittenOff)
                                 // rather than folded into this one. (This does mean the
                                 // Dashboard's "Total Value" tile, which is startingCapital +
                                 // netProfit, will not reflect capital lost to write-offs either
                                 // -- worth knowing if that ever needs to change.)
  activeCount: number;
  overdueCount: number;
  paidCount: number;
  defaultedCount: number;
}

// Single source of truth for portfolio-wide numbers, shared by the Dashboard,
// the Reports page, and the PDF report generators so they never drift apart.
export const computePortfolioMetrics = (loans: Loan[]): PortfolioMetrics => {
  let totalPrincipal = 0;
  let totalCollected = 0;
  let totalInterestEarned = 0;
  let writeOffLoss = 0;
  let totalWrittenOff = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;
  let activeCount = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let defaultedCount = 0;

  loans.forEach(loan => {
    totalPrincipal += loan.principal;
    totalOutstanding += loan.balance;

    // Real cash actually collected -- PENALTY entries are excluded because they're stored
    // as a negative "debt marker" amount (accruing what's owed), not an actual cash receipt.
    const cashPaid = loan.payments
      .filter(p => p.method !== 'PENALTY')
      .reduce((sum, p) => sum + p.amount, 0);
    totalCollected += cashPaid;

    if (loan.status === LoanStatus.PAID) {
      // Fully resolved, everything (and possibly more) collected -- the entire gap
      // between what was lent and what came back is realized profit, no ratio needed.
      totalInterestEarned += cashPaid - loan.principal;
      paidCount++;
    } else if (loan.status === LoanStatus.DEFAULTED) {
      // Fully resolved the other way -- nothing more will ever arrive, so the final
      // outcome is simply what came back minus what went out. Kept separate from
      // netProfit; see writeOffLoss's own doc comment for why.
      writeOffLoss += cashPaid - loan.principal;
      totalWrittenOff += Math.max(0, loan.principal - cashPaid);
      defaultedCount++;
    } else if (loan.status === LoanStatus.OVERDUE) {
      // Still open -- may yet be paid in full or eventually written off. No profit or
      // loss is recognized until it actually resolves one way or the other.
      overdueCount++;
      overdueAmount += loan.balance;
    } else if (loan.status === LoanStatus.ACTIVE) {
      activeCount++;
    }
  });

  return {
    totalPrincipal,
    totalCollected,
    totalInterestEarned,
    writeOffLoss,
    totalWrittenOff,
    totalOutstanding,
    overdueAmount,
    netProfit: totalInterestEarned,
    activeCount,
    overdueCount,
    paidCount,
    defaultedCount
  };
};
