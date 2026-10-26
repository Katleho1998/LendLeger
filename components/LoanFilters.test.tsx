import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanFilters } from './LoanFilters';
const Demo = () => {
 const [status,setStatus]=useState('ALL');
 const [search,setSearch]=useState('');
 return <><LoanFilters status={status} onStatus={setStatus} search={search} onSearch={setSearch} count={status==='PAID'?1:3}/><output data-testid="selected">{status}</output></>;
};
describe('loan filter interaction',()=>{
 it('selects a status by clicking the visible label, updates the count and resets',async()=>{
  cleanup(); const user=userEvent.setup();render(<Demo/>);
  await user.click(screen.getByRole('button',{name:'Status'}));
  await user.click(screen.getByText('Paid'));
  expect(screen.getByTestId('selected').textContent).toBe('PAID');
  expect(screen.getByRole('status').textContent).toContain('1 loan found');
  await user.click(screen.getByRole('button',{name:'Done'}));
  expect(screen.queryByRole('radio')).toBeNull();
  await user.click(screen.getByRole('button',{name:/Reset/}));
  expect(screen.getByTestId('selected').textContent).toBe('ALL');
  cleanup();
 });
 it('supports arrow-key selection and Escape',async()=>{
  const user=userEvent.setup();render(<Demo/>);
  await user.click(screen.getByRole('button',{name:'Status'}));
  await user.keyboard('{ArrowRight}');
  expect(screen.getByTestId('selected').textContent).toBe('ACTIVE');
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('radio')).toBeNull();cleanup();
 });
});
