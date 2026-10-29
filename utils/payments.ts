import { Loan, LoanStatus } from '../types';
export const correctPayment = (loan: Loan, paymentId: string, amount: number, now = new Date()) => {
 if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) throw new Error('Enter a positive amount with no more than two decimal places.');
 const original = loan.payments.find(p => p.id === paymentId);
 if (!original || original.method === 'PENALTY') throw new Error('This payment cannot be edited.');
 const payments = loan.payments.map(p => p.id === paymentId ? { ...p, amount } : p);
 const cash = payments.filter(p => p.method !== 'PENALTY').reduce((sum,p)=>sum+p.amount,0);
 const remaining = Math.max(0, Math.round((loan.totalRepayment - cash) * 100) / 100);
 const writtenOff = loan.status === LoanStatus.DEFAULTED;
 const status = writtenOff ? LoanStatus.DEFAULTED : remaining === 0 ? LoanStatus.PAID : new Date(loan.dueDate) < now ? LoanStatus.OVERDUE : LoanStatus.ACTIVE;
 return { payments, balance: writtenOff ? 0 : remaining, status, ...(writtenOff ? { writeOffAmount: remaining } : {}) };
};
