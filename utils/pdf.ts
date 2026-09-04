import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loan, Borrower, LoanStatus } from '../types';
import { computePortfolioMetrics } from './analytics';

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  doc.setTextColor(0);
};

// jspdf-autotable attaches `lastAutoTable` to the doc instance at runtime but the
// type isn't part of the jsPDF typings, hence the cast wherever we read it back.
const lastTableEndY = (doc: jsPDF, fallback: number) =>
  (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : fallback;

export const generateLoansPDF = (loans: Loan[], borrowers: Borrower[]) => {
  const doc = new jsPDF();
  addHeader(doc, 'Loan Portfolio Summary');

  const tableData = loans.map(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    return [
      borrower?.name || 'Unknown',
      `R ${loan.principal.toFixed(2)}`,
      `R ${loan.balance.toFixed(2)}`,
      new Date(loan.dueDate).toLocaleDateString(),
      loan.status === LoanStatus.DEFAULTED ? 'WRITTEN OFF' : loan.status
    ];
  });

  autoTable(doc, {
    head: [['Borrower', 'Principal', 'Balance', 'Due Date', 'Status']],
    body: tableData,
    startY: 40,
  });

  doc.save('lendledger-loan-portfolio.pdf');
};

export const generateProfitLossPDF = (loans: Loan[]) => {
  const doc = new jsPDF();
  addHeader(doc, 'Profit & Loss Statement');

  const m = computePortfolioMetrics(loans);

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Amount']],
    body: [
      ['Total Principal Disbursed', `R ${m.totalPrincipal.toFixed(2)}`],
      ['Total Cash Collected', `R ${m.totalCollected.toFixed(2)}`],
      ['Interest Earned (Realized)', `R ${m.totalInterestEarned.toFixed(2)}`],
      ['Bad Debt Written Off', `-R ${m.totalWrittenOff.toFixed(2)}`],
      ['Net Profit', `R ${m.netProfit.toFixed(2)}`],
    ],
  });

  const finalY = lastTableEndY(doc, 50);
  doc.setFontSize(11);
  doc.text(
    `Active: ${m.activeCount}   Overdue: ${m.overdueCount}   Paid: ${m.paidCount}   Written Off: ${m.defaultedCount}`,
    14,
    finalY
  );

  doc.save('lendledger-profit-loss.pdf');
};

export const generateWriteOffsPDF = (loans: Loan[], borrowers: Borrower[]) => {
  const doc = new jsPDF();
  addHeader(doc, 'Write-Offs / Bad Debt Report');

  const writtenOffLoans = loans.filter(l => l.status === LoanStatus.DEFAULTED);
  const tableData = writtenOffLoans.map(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    return [
      borrower?.name || 'Unknown',
      `R ${loan.principal.toFixed(2)}`,
      `R ${(loan.writeOffAmount || 0).toFixed(2)}`,
      loan.writeOffDate ? new Date(loan.writeOffDate).toLocaleDateString() : '-',
      loan.writeOffReason || '-'
    ];
  });

  autoTable(doc, {
    head: [['Borrower', 'Principal', 'Amount Lost', 'Date', 'Reason']],
    body: tableData.length ? tableData : [['-', '-', '-', '-', 'No loans have been written off']],
    startY: 40,
  });

  const total = writtenOffLoans.reduce((s, l) => s + (l.writeOffAmount || 0), 0);
  const finalY = lastTableEndY(doc, 50);
  doc.setFontSize(12);
  doc.text(`Total Written Off: R ${total.toFixed(2)}`, 14, finalY);

  doc.save('lendledger-write-offs.pdf');
};

export const generateOutstandingPDF = (loans: Loan[], borrowers: Borrower[]) => {
  const doc = new jsPDF();
  addHeader(doc, 'Outstanding & Overdue Report');

  const now = new Date();
  const openLoans = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE);
  const tableData = openLoans.map(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    const due = new Date(loan.dueDate);
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
    return [
      borrower?.name || 'Unknown',
      `R ${loan.balance.toFixed(2)}`,
      due.toLocaleDateString(),
      loan.status === LoanStatus.OVERDUE ? `${daysOverdue}d overdue` : 'On track'
    ];
  });

  autoTable(doc, {
    head: [['Borrower', 'Balance Due', 'Due Date', 'Status']],
    body: tableData.length ? tableData : [['-', '-', '-', 'No open loans']],
    startY: 40,
  });

  const total = openLoans.reduce((s, l) => s + l.balance, 0);
  const finalY = lastTableEndY(doc, 50);
  doc.setFontSize(12);
  doc.text(`Total Outstanding: R ${total.toFixed(2)}`, 14, finalY);

  doc.save('lendledger-outstanding.pdf');
};

export const generateCapitalPDF = (loans: Loan[], startingCapital: number) => {
  const doc = new jsPDF();
  addHeader(doc, 'Capital & Cashflow Summary');

  const m = computePortfolioMetrics(loans);
  const availableToLend = startingCapital - m.totalPrincipal + m.totalCollected;

  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Amount']],
    body: [
      ['Starting Capital', `R ${startingCapital.toFixed(2)}`],
      ['Total Disbursed (Out)', `-R ${m.totalPrincipal.toFixed(2)}`],
      ['Total Collected (In)', `+R ${m.totalCollected.toFixed(2)}`],
      ['Available to Lend', `R ${availableToLend.toFixed(2)}`],
    ],
  });

  doc.save('lendledger-capital-summary.pdf');
};