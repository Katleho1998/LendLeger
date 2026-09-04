import { Loan, LoanStatus } from '../types';

export interface PortfolioMetrics {
  totalPrincipal: number;       // Total ever disbursed to borrowers (cash out)
  totalCollected: number;       // Real cash collected (excludes PENALTY entries, which are
                                 // just a debt marker, no cash actually changes hands for them)
  totalInterestEarned: number;  // Interest recognized on cash collected from loans that are
                                 // still open or were fully paid (i.e. NOT written off -- a
                                 // written-off loan's outcome is captured in writeOffLoss instead,
                                 // so the two figures add up to netProfit without double-counting)
  writeOffLoss: number;         // True realized loss on written-off loans: cash actually
                                 // recovered from them minus what was originally lent out.
                                 // Negative = a loss (the normal case); can be positive if a
                                 // loan had already recovered more than its principal before
                                 // the remaining (smaller) balance was written off.
  totalWrittenOff: number;      // Full unpaid balance recorded via "Close & Write Off" -- for
                                 // display (the Written-Off stat/report) only. This blends
                                 // unrecovered principal with unrecovered interest that was
                                 // never counted as profit, so it is NOT what feeds netProfit
                                 // (that's writeOffLoss) -- using this figure for both would
                                 // double-count the loss.
  totalOutstanding: number;     // Sum of current balances still owed on open loans
  overdueAmount: number;        // Sum of balances specifically on OVERDUE loans
  netProfit: number;            // The true bottom line: totalInterestEarned + writeOffLoss
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

    if (loan.status === LoanStatus.DEFAULTED) {
      // Nothing more will ever arrive on a written-off loan, so its final outcome is
      // simply what came back minus what went out. (A ratio-based split like the one
      // used below would double-count the loss here: the unpaid balance being written
      // off is itself a blend of unrecovered principal AND unrecovered interest, and
      // that interest portion was never recognized as profit to begin with, so it
      // doesn't need subtracting again on top of the principal.)
      writeOffLoss += cashPaid - loan.principal;
      totalWrittenOff += loan.writeOffAmount || 0;
      defaultedCount++;
    } else {
      // Interest recognized so far: cash collected, split proportionally between
      // principal and interest using the CURRENT totalRepayment (which already has
      // any penalties folded in, so a penalty correctly makes a larger share of what's
      // collected count as profit). Deliberately cash-basis -- a loan sitting open
      // with nothing paid yet contributes 0 here, even though it carries embedded
      // future interest; see totalOutstanding for what's still owed but not realized.
      //
      // A borrower can pay MORE than totalRepayment (a rounded-up or "extra" payment) --
      // the payment record keeps the full amount even though balance floors at 0. Only
      // the portion up to totalRepayment gets the proportional split; principal and the
      // contracted interest are already fully recovered by that point, so every rand
      // beyond it is pure profit, not a blend -- splitting the whole amount by ratio
      // would silently discount a genuine overpayment as if part of it were still
      // "recovering principal".
      if (cashPaid > 0 && loan.totalRepayment > 0) {
        const totalInterest = loan.totalRepayment - loan.principal;
        const interestRatio = totalInterest / loan.totalRepayment;
        const recognizedCash = Math.min(cashPaid, loan.totalRepayment);
        const overpayment = cashPaid - recognizedCash;
        totalInterestEarned += recognizedCash * interestRatio + overpayment;
      }

      if (loan.status === LoanStatus.OVERDUE) {
        overdueCount++;
        overdueAmount += loan.balance;
      } else if (loan.status === LoanStatus.PAID) {
        paidCount++;
      } else if (loan.status === LoanStatus.ACTIVE) {
        activeCount++;
      }
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
    netProfit: totalInterestEarned + writeOffLoss,
    activeCount,
    overdueCount,
    paidCount,
    defaultedCount
  };
};
