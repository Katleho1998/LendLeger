-- Re-run this entire script to enable penalty deletion and prevent automatic reapplication.
alter table public.loans add column if not exists penalty_waived_due_date timestamptz;
-- Apply in Supabase SQL editor before using payment edit/delete.
create or replace function public.change_recorded_payment(p_loan_id uuid,p_payment_id text,p_amount numeric default null,p_delete boolean default false,p_expected_amount numeric default null)
returns void language plpgsql security invoker set search_path=public as $$
declare
 v_loan public.loans%rowtype;
 old_payment jsonb;
 new_payments jsonb;
 cash_total numeric;
 remaining numeric;
 actor text;
 repayment numeric;
begin
 if auth.uid() is null then raise exception 'Please sign in.'; end if;
 select * into v_loan from public.loans where id=p_loan_id for update;
 if not found or v_loan.user_id is distinct from auth.uid() then raise exception 'You can only change your own loans.'; end if;
 select item into old_payment from jsonb_array_elements(coalesce(v_loan.payments::jsonb,'[]')) item where item->>'id'=p_payment_id;
 if old_payment is null or (old_payment->>'method'='PENALTY' and not p_delete) then raise exception 'This payment cannot be changed.'; end if;
 if p_expected_amount is null or (old_payment->>'amount')::numeric<>p_expected_amount then raise exception 'Payment changed. Refresh and try again.'; end if;
 if not p_delete and (p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<=0 or round(p_amount,2)<>p_amount) then raise exception 'Enter a positive amount with at most two decimal places.'; end if;
 select coalesce(jsonb_agg(case when item->>'id'=p_payment_id then jsonb_set(item,'{amount}',to_jsonb(p_amount)) else item end order by n),'[]') into new_payments
 from jsonb_array_elements(coalesce(v_loan.payments::jsonb,'[]')) with ordinality as entries(item,n) where not p_delete or item->>'id'<>p_payment_id;
 select coalesce(sum((item->>'amount')::numeric),0) into cash_total from jsonb_array_elements(new_payments) item where item->>'method'<>'PENALTY';
 repayment:=v_loan.total_repayment;
 if p_delete and old_payment->>'method'='PENALTY' then repayment:=greatest(0,repayment-abs((old_payment->>'amount')::numeric)); end if;
 remaining:=greatest(0,round(repayment-cash_total,2));
 update public.loans set payments=new_payments,total_repayment=repayment,
 penalty_waived_due_date=case when p_delete and old_payment->>'method'='PENALTY' then v_loan.due_date::timestamptz else v_loan.penalty_waived_due_date end,
 balance=case when v_loan.status='DEFAULTED' then 0 else remaining end,
 status=case when v_loan.status='DEFAULTED' then 'DEFAULTED' when remaining=0 then 'PAID' when v_loan.due_date::timestamptz<now() then 'OVERDUE' else 'ACTIVE' end,
 write_off_amount=case when v_loan.status='DEFAULTED' then remaining else v_loan.write_off_amount end where id=p_loan_id;
 if not found then raise exception 'Payment update denied.'; end if;
 actor:=coalesce(nullif(auth.jwt()->>'email',''),auth.uid()::text);
 insert into public.audit_logs(user_id,action,details,timestamp,entity_id) values(auth.uid(),case when p_delete and old_payment->>'method'='PENALTY' then 'DELETE_PENALTY' when p_delete then 'DELETE_PAYMENT' else 'UPDATE_PAYMENT' end,
 format('%s (user %s) %s payment %s on loan %s; original R%s; %s; method %s; payment date %s',actor,auth.uid(),case when p_delete then 'deleted' else 'edited' end,p_payment_id,p_loan_id,old_payment->>'amount',case when p_delete and old_payment->>'method'='PENALTY' then 'penalty removed and waived for due date '||v_loan.due_date::text when p_delete then 'payment removed' else 'corrected amount R'||p_amount::text end,old_payment->>'method',old_payment->>'date'),now(),p_loan_id);
end;
$$;
revoke all on function public.change_recorded_payment(uuid,text,numeric,boolean,numeric) from public,anon;
grant execute on function public.change_recorded_payment(uuid,text,numeric,boolean,numeric) to authenticated;
