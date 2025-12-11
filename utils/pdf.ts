import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loan, Borrower } from '../types';

export const generateLoansPDF = (loans: Loan[], borrowers: Borrower[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Loan Report', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = loans.map(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    return [
      borrower?.name || 'Unknown',
      `R ${loan.principal.toFixed(2)}`,
      `R ${loan.balance.toFixed(2)}`,
      new Date(loan.dueDate).toLocaleDateString(),
      loan.status
    ];
  });

  autoTable(doc, {
    head: [['Borrower', 'Principal', 'Balance', 'Due Date', 'Status']],
    body: tableData,
    startY: 40,
  });

  doc.save('lendledger-report.pdf');
};