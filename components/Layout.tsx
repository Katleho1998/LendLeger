import React, { useState } from 'react';
import { LayoutDashboard, Users, Banknote, FileText, Menu, X, Activity, Search, Bell, CheckSquare, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CreateLoanModal } from './CreateLoanModal';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../services/storage';

interface LayoutProps {
  children?: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, onClick, active, badge }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-6 py-3.5 mx-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center space-x-3">
      <Icon size={20} className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
        {badge}
      </span>
    )}
  </Link>
);

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoanModalOpen, setLoanModalOpen] = useState(false);
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useStore();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-600">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative z-50 w-72 h-full bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center px-8 h-24 border-b border-transparent">
          <div className="flex items-center space-x-2.5 text-slate-900">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
              <CheckSquare className="text-white" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight">LendLedger.</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-1 py-6 overflow-y-auto h-[calc(100vh-6rem)] no-scrollbar">
          <div className="px-8 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Main Menu</div>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <NavItem to="/loans" icon={Banknote} label="Loans" active={location.pathname === '/loans'} />
          <NavItem to="/borrowers" icon={Users} label="Borrowers" active={location.pathname === '/borrowers'} />
          
          <div className="px-8 mt-8 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics</div>
          <NavItem to="/reports" icon={FileText} label="Reports" active={location.pathname === '/reports'} />
          <NavItem to="/audit" icon={Activity} label="Audit Logs" active={location.pathname === '/audit'} />
          <NavItem to="/profile" icon={User} label="Profile" active={location.pathname === '/profile'} />
          
          <div className="mt-10 px-6">
            <div className="bg-brand-50 rounded-2xl p-6 relative overflow-hidden border border-brand-100">
                <div className="relative z-10">
                    <h4 className="font-bold text-brand-900 mb-1">Upgrade Plan</h4>
                    <p className="text-xs text-brand-700 mb-3 opacity-90">Get AI access and unlimited records.</p>
                    <button className="bg-white text-brand-600 text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                        Upgrade Now
                    </button>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-100 rounded-full opacity-50" />
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-brand-200 rounded-full opacity-50" />
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center lg:hidden">
            <button 
                onClick={() => setSidebarOpen(true)}
                className="text-slate-500 p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
                <Menu size={24} />
            </button>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {location.pathname === '/' && `Welcome back, ${userProfile?.displayName || user?.email?.split('@')[0]} 👋`}
                {location.pathname === '/borrowers' && 'Borrower Management'}
                {location.pathname === '/loans' && 'Loan Portfolio'}
                {location.pathname === '/reports' && 'Analytics & Reports'}
                {location.pathname === '/audit' && 'System Audit'}
                {location.pathname === '/profile' && 'User Profile'}
            </h1>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
             {/* Global Search and Add Loan */}
             <div className="relative hidden md:block w-64">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Anything..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all shadow-sm"
                />
             </div>

             <button 
                onClick={() => setLoanModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-500/20 hidden sm:block active:scale-95"
             >
                + Add Loan
             </button>

             <button className="relative p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>

             <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 ml-2">
                <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 p-0.5 shadow-sm hover:ring-2 hover:ring-brand-100 transition-all">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`}
                        alt="User" 
                        className="w-full h-full rounded-full bg-white border-2 border-white"
                    />
                </Link>
                <div className="hidden lg:block text-sm">
                  <Link to="/profile" className="block font-bold text-slate-900 line-clamp-1 hover:text-brand-600 transition-colors">
                      {userProfile?.displayName || user?.email?.split('@')[0]}
                  </Link>
                  <button onClick={logout} className="text-xs text-slate-500 hover:text-rose-500 font-medium flex items-center gap-1 transition-colors">
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
             </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <CreateLoanModal isOpen={isLoanModalOpen} onClose={() => setLoanModalOpen(false)} />
    </div>
  );
};