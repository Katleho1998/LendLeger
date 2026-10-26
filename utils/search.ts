import { Borrower, Loan } from '../types';
export const matchesLoanSearch = (loan: Loan, borrowers: Borrower[], query: string) => {
 const borrower = borrowers.find(b => b.id === loan.borrowerId);
 const text = [loan.id, loan.status, loan.status === 'DEFAULTED' ? 'written off' : '', borrower?.name, borrower?.phone, loan.creatorName].filter(Boolean).join(' ').toLowerCase();
 return query.trim().toLowerCase().split(/\s+/).every(term => text.includes(term));
};
export const matchesBorrowerSearch = (borrower: Borrower, query: string) => {
 const text = [borrower.name, borrower.phone, borrower.idNumber, borrower.riskLevel, borrower.creatorName].filter(Boolean).join(' ').toLowerCase();
 return query.trim().toLowerCase().split(/\s+/).every(term => text.includes(term));
};
