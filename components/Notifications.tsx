import React, { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../services/storage';
import { useAuth } from '../context/AuthContext';
export const Notifications = () => {
 const { loans, borrowers, setSearchTerm } = useStore();
 const { user } = useAuth();
 const navigate = useNavigate();
 const [open,setOpen] = useState(false);
 const [read,setRead] = useState<string[]>([]);
 const [now,setNow] = useState(Date.now());
 const ref = useRef<HTMLDivElement>(null);
 const key = `lendledger:notifications:${user?.id || 'guest'}`;
 useEffect(()=>{ try { const saved=JSON.parse(localStorage.getItem(key) || '[]'); setRead(Array.isArray(saved) ? saved.filter(x=>typeof x==='string') : []); } catch { setRead([]); } },[key]);
 useEffect(()=>{ const timer=window.setInterval(()=>setNow(Date.now()),60000); return ()=>clearInterval(timer); },[]);
 useEffect(()=>{ const close=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);}; document.addEventListener('mousedown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',escape);}; },[]);
 const today = new Date(now); today.setHours(0,0,0,0);
 const alerts = loans.filter(l=>l.status==='ACTIVE'||l.status==='OVERDUE').map(l=>{
   const date=new Date(l.dueDate); date.setHours(0,0,0,0);
   const days=Math.round((date.getTime()-today.getTime())/86400000);
   const overdue=l.status==='OVERDUE'||days<0;
   return {loan:l,id:`${l.id}:${l.dueDate}:${overdue?'overdue':'due'}`,days,overdue};
 }).filter(a=>Number.isFinite(a.days) && (a.overdue || a.days<=7)).sort((a,b)=>a.days-b.days);
 const unread=alerts.filter(a=>!read.includes(a.id)).length;
 const mark=(ids:string[])=>{ const next=Array.from(new Set([...read,...ids]));setRead(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{} };
 return <div className="notifications" ref={ref}><button className="icon-button notification-toggle" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notifications-panel" onClick={()=>setOpen(!open)}><Bell size={21}/>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>{open&&<section id="notifications-panel" className="notification-panel" aria-label="Notifications"><div className="notification-heading"><strong>Notifications</strong><button className="icon-button" aria-label="Close notifications" onClick={()=>setOpen(false)}><X size={18}/></button></div>{alerts.length>0&&<button className="mark-read" onClick={()=>mark(alerts.map(a=>a.id))}>Mark all as read</button>}<div className="notification-list">{alerts.map(a=><button key={a.id} className={`notification-item ${!read.includes(a.id)?'unread':''}`} onClick={()=>{mark([a.id]);setSearchTerm(a.loan.id);navigate('/loans');setOpen(false);}}><strong>{a.overdue?'Payment overdue':a.days===0?'Payment due today':'Payment due soon'}</strong><span>{borrowers.find(b=>b.id===a.loan.borrowerId)?.name || 'Borrower'} · R {a.loan.balance.toLocaleString('en-ZA',{maximumFractionDigits:2})}</span><small>Due {new Date(a.loan.dueDate).toLocaleDateString('en-ZA')} · View loan</small></button>)}{!alerts.length&&<p className="notification-empty">You're all caught up. No overdue payments or loans due in the next 7 days.</p>}</div></section>}</div>;
};
