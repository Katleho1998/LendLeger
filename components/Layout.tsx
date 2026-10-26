import { Notifications } from './Notifications';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Banknote, FileText, Menu, X, Activity, Search, CheckSquare, LogOut, User, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { CreateLoanModal } from './CreateLoanModal';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../services/storage';
const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/loans', label: 'Loans', icon: Banknote },
  { to: '/borrowers', label: 'Borrowers', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/audit', label: 'Audit Logs', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
];
export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const menuToggle = React.useRef<HTMLButtonElement>(null);
  const sidebar = React.useRef<HTMLElement>(null);
  const menuOpen = isMobile ? mobileOpen : !collapsed;
  const toggleMenu = () => isMobile ? setMobileOpen(value => !value) : setCollapsed(value => !value);
  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => { setIsMobile(media.matches); setMobileOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  React.useEffect(() => {
    if (isMobile && mobileOpen) sidebar.current?.querySelector<HTMLAnchorElement>('a')?.focus();
  }, [isMobile, mobileOpen]);
  const [loanOpen, setLoanOpen] = useState(false);
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useStore();
  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  React.useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileOpen(false); menuToggle.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <div className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
    {mobileOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside ref={sidebar} inert={isMobile && !mobileOpen} id="main-navigation" aria-label="Main navigation" className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <nav className="sidebar-links">{links.map(({to, label, icon: Icon}) => <Link key={to} to={to} aria-label={label} aria-current={location.pathname === to ? 'page' : undefined} className={`sidebar-link ${location.pathname === to ? 'selected' : ''}`}><Icon size={21}/><span className="nav-label">{label}</span><span className="nav-tooltip" role="tooltip">{label}</span></Link>)}</nav>
      <div className="sidebar-footer"><button className="sidebar-link" onClick={logout} aria-label="Sign out"><LogOut size={21}/><span className="nav-label">Sign out</span><span className="nav-tooltip" role="tooltip">Sign out</span></button></div>
    </aside>
    <div className="app-body"><header className="app-header"><div className="flex items-center gap-3 min-w-0"><div className="header-brand"><Link to="/" className="brand-name" aria-label="LendLedger dashboard">LendLedger<span>.</span></Link><button ref={menuToggle} className="icon-button menu-toggle" aria-label={menuOpen ? 'Collapse menu' : 'Expand menu'} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={toggleMenu}>{menuOpen ? <PanelLeftClose size={22}/> : <PanelLeftOpen size={22}/>}</button></div><div className="header-page-title min-w-0"><h1 className="font-bold text-slate-900 truncate">{links.find(link => link.to === location.pathname)?.label || 'LendLedger'}</h1></div></div><div className="header-actions"><Notifications/><label className="header-search"><Search size={17}/><input aria-label="Search records" placeholder="Search records…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></label><button className="primary-button" onClick={() => setLoanOpen(true)}><Plus size={18}/><span>Add loan</span></button><Link className="user-avatar" to="/profile" aria-label="Your profile">{(userProfile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}</Link></div></header><div className="mobile-search"><Search size={17}/><input aria-label="Search records on mobile" placeholder="Search records…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>{searchTerm && <button aria-label="Clear search" onClick={()=>setSearchTerm('' )}><X size={16}/></button>}</div><main className="app-main"><div className="page-container">{children}</div></main></div>
    <CreateLoanModal isOpen={loanOpen} onClose={() => setLoanOpen(false)}/>
  </div>;
};
