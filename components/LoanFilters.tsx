import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, SlidersHorizontal, X, Search } from 'lucide-react';
const options = [
 {value:'ALL',label:'All statuses',color:'#94a3b8'},
 {value:'ACTIVE',label:'Active',color:'#2563eb'},
 {value:'OVERDUE',label:'Overdue',color:'#f59e0b'},
 {value:'PAID',label:'Paid',color:'#10b981'},
 {value:'DEFAULTED',label:'Written off',color:'#f43f5e'},
];
interface Props { search:string; onSearch:(value:string)=>void; status:string; onStatus:(value:string)=>void; count:number; }
export const LoanFilters = ({search,onSearch,status,onStatus,count}:Props) => {
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const active=status!=='ALL';
 useEffect(()=>{
  const outside=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};
  document.addEventListener('mousedown',outside);
  return()=>document.removeEventListener('mousedown',outside);
 },[]);
 useEffect(()=>{if(open)ref.current?.querySelector<HTMLInputElement>('input:checked')?.focus();},[open]);
 const close=()=>{setOpen(false);trigger.current?.focus();};
 return <section className="loan-filter-area" aria-label="Search and filter loans"><div className="loan-filter-toolbar"><label className="loan-search-field"><Search size={18}/><input aria-label="Search loans" placeholder="Search by name, phone or loan ID…" value={search} onChange={e=>onSearch(e.target.value)}/>{search&&<button type="button" aria-label="Clear loan search" onClick={()=>onSearch('')}><X size={15}/></button>}</label><div className="loan-filter-controls"><div ref={ref} className="status-filter" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}><button type="button" ref={trigger} className={`status-filter-trigger ${active?'has-filter':''}`} aria-expanded={open} aria-controls="loan-status-options" onClick={()=>setOpen(!open)}><SlidersHorizontal size={16}/><span>Status</span>{active&&<span className="filter-number">1</span>}<ChevronDown size={14} className={open?'chevron-open':''}/></button>{open&&<div id="loan-status-options" className="status-popover"><div className="status-popover-heading">Filter by status<span>Choose one status</span></div><fieldset><legend className="sr-only">Loan status</legend>{options.map(option=><label key={option.value} className={`status-option ${status===option.value?'chosen':''}`}><input type="radio" name="loan-status" value={option.value} checked={status===option.value} onChange={()=>onStatus(option.value)}/><i style={{background:option.color}}/><span>{option.label}</span>{status===option.value&&<Check size={16}/>}</label>)}</fieldset><button type="button" className="filter-done" onClick={close}>Done</button></div>}</div>{(active||search)&&<button type="button" className="filter-reset" onClick={()=>{onSearch('');onStatus('ALL');}}>Reset <X size={13}/></button>}</div></div><div className="filter-summary"><span role="status" aria-live="polite"><strong>{count}</strong> {count===1?'loan':'loans'} found</span>{active&&<button type="button" className="active-filter-chip" onClick={()=>onStatus('ALL')} aria-label="Remove status filter"><i style={{background:options.find(o=>o.value===status)?.color}}/>{options.find(o=>o.value===status)?.label}<X size={12}/></button>}</div></section>;
};
