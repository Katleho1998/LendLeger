import { Loan, LoanStatus } from '../types';

export interface PortfolioMetrics {
  totalPrincipal: number;       // Total ever disbursed to borrowers (cash out)
  totalCollected: number;       // Real cash collected (excludes PENALTY entries, which are
                                 // just a debt marker, no cash actually changes hands for them)
  totalInterestEarned: number;  // Realized interest -- proportional to what's actually been paid
  totalWrittenOff: number;      // Bad debt recorded via "Close & Write Off"
  totalOutstanding: number;     // Sum of current balances still owed on open loans
  overdueAmount: number;        // Sum of balances specifically on OVERDUE loans
  netProfit: number;            // Interest earned minus bad debt written off
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

    const cashPaid = loan.payments
      .filter(p => p.method !== 'PENALTY')
      .reduce((sum, p) => sum + p.amount, 0);
    totalCollected += cashPaid;

    // Realized interest: what's been paid so far (including penalties, which do
    // add to what's owed), spread proportionally across principal vs. interest.
    const allPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalInterest = loan.totalRepayment - loan.principal;
    if (loan.totalRepayment > 0 && allPaid > 0) {
      const interestRatio = totalInterest / loan.totalRepayment;
      totalInterestEarned += allPaid * interestRatio;
    }

    switch (loan.status) {
      case LoanStatus.DEFAULTED:
        defaultedCount++;
        totalWrittenOff += loan.writeOffAmount || 0;
        break;
      case LoanStatus.OVERDUE:
        overdueCount++;
        overdueAmount += loan.balance;
        break;
      case LoanStatus.PAID:
        paidCount++;
        break;
      case LoanStatus.ACTIVE:
        activeCount++;
        break;
    }
  });

  return {
    totalPrincipal,
    totalCollected,
    totalInterestEarned,
    totalWrittenOff,
    totalOutstanding,
    overdueAmount,
    netProfit: totalInterestEarned - totalWrittenOff,
    activeCount,
    overdueCount,
    paidCount,
    defaultedCount
  };
};
