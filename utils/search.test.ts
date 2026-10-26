import { describe, expect, it } from 'vitest';
import { matchesLoanSearch, matchesBorrowerSearch } from './search';
import { Borrower, Loan } from '../types';
const borrower = { id:'b1', name:'Thabo Mokoena', phone:'0821234567', idNumber:'900101', riskLevel:'LOW' } as Borrower;
const loan = { id:'ABC-123', borrowerId:'b1', status:'DEFAULTED' } as Loan;
describe('record search', () => {
 it('matches names and phone numbers without case or surrounding whitespace sensitivity',()=>{
  expect(matchesLoanSearch(loan,[borrower],'  THABO  ')).toBe(true);
  expect(matchesLoanSearch(loan,[borrower],'082123')).toBe(true);
 });
 it('matches identifiers and written-off labels',()=>{
  expect(matchesLoanSearch(loan,[borrower],'abc-123')).toBe(true);
  expect(matchesLoanSearch(loan,[borrower],'written off')).toBe(true);
 });
 it('requires every search word and handles missing borrowers',()=>{
  expect(matchesLoanSearch(loan,[borrower],'Thabo active')).toBe(false);
  expect(matchesLoanSearch(loan,[],'abc')).toBe(true);
  expect(matchesLoanSearch(loan,[],'')).toBe(true);
 });
 it('searches borrower risk and identity details',()=>{
  expect(matchesBorrowerSearch(borrower,'mokoena low')).toBe(true);
  expect(matchesBorrowerSearch(borrower,'900101')).toBe(true);
  expect(matchesBorrowerSearch(borrower,'unknown')).toBe(false);
 });
});
