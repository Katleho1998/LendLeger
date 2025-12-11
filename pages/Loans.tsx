import React, { useState } from 'react';
import { useStore } from '../services/storage';
import { Plus, DollarSign, Calendar, ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, Trash2 } from 'lucide-react';
import { Loan, LoanStatus } from '../types';
import { generateCollectionMessage } from '../services/geminiService';
import { CreateLoanModal } from '../components/CreateLoanModal';

export const Loans = () => {
  const { borrowers, loans, addPayment, searchTerm, setSearchTerm, deleteLoan } = useStore();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'OTHER'>('CASH');

  // AI Message State
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [generatingMsg, setGeneratingMsg] = useState(false);

  const handlePayment = (loanId: string) => {
    if (!paymentAmount) return;
    addPayment(loanId, parseFloat(paymentAmount), paymentMethod);
    setPaymentAmount('');
  };

  const handleGenerateMessage = async (loan: Loan) => {
      setGeneratingMsg(true);
      setGeneratedMessage(null);
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      if (borrower) {
        const msg = await generateCollectionMessage(borrower, loan, loan.status === 'OVERDUE' ? 'FIRM' : 'FRIENDLY');
        setGeneratedMessage(msg);
      }
      setGeneratingMsg(false);
  };

  const filteredLoans = loans.filter(l => {
      const b = borrowers.find(bor => bor.id === l.borrowerId);
      const searchLower = searchTerm.toLowerCase();
      const borrowerName = b?.name?.toLowerCase() || '';
      return borrowerName.includes(searchLower) || l.status.toLowerCase().includes(searchLower) || l.id.includes(searchLower);
  });

  const handleDeleteLoan = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this loan? This cannot be undone.')) {
          deleteLoan(id);
      }
      setActiveMenu(null);
  }

  return (
    <div className="space-y-8" onClick={() => setActiveMenu(null)}>
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Loans Management</h2>
            <p className="text-slate-500 mt-1">Track and manage all active loans.</p>
        </div>
        <button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl hover:bg-brand-700 flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
            <Plus size={20} strokeWidth={2.5} />
            <span className="font-semibold">New Loan</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-full md:w-fit">
          <div className="bg-slate-50 p-2 rounded-xl text-slate-400"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Search loans..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 w-48 font-medium" 
          />
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <button className="flex items-center space-x-2 text-slate-500 text-sm px-2 hover:text-brand-600 font-medium transition-colors"><Filter size={16} /> <span>Filter</span></button>
      </div>

      <div className="space-y-4">
        {filteredLoans.length === 0 && <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 font-medium">No active loans found matching your criteria.</div>}
        
        {filteredLoans.map(loan => {
            const borrower = borrowers.find(b => b.id === loan.borrowerId);
            const isExpanded = expandedLoan === loan.id;
            
            return (
                <div key={loan.id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-visible ${isExpanded ? 'shadow-lg border-brand-200 ring-1 ring-brand-100' : 'shadow-soft border-slate-100 hover:border-slate-200'}`}>
                    <div 
                        className="p-6 flex items-center justify-between cursor-pointer relative"
                        onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                    >
                        <div className="flex items-center space-x-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                loan.status === LoanStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 
                                loan.status === LoanStatus.OVERDUE ? 'bg-rose-100 text-rose-600' : 
                                'bg-brand-100 text-brand-600'
                            }`}>
                                <DollarSign size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{borrower?.name || 'Unknown Borrower'}</h3>
                                <div className="flex items-center space-x-2 text-sm text-slate-500 mt-1 font-medium">
                                    <Calendar size={14} />
                                    <span>Due {new Date(loan.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-8">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance</p>
                                <p className="text-xl font-bold text-slate-900">R{loan.balance.toFixed(2)}</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                                loan.status === LoanStatus.OVERDUE ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                loan.status === LoanStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                'bg-brand-50 text-brand-600 border-brand-100'
                            }`}>
                                {loan.status}
                            </div>
                            <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-slate-100 text-slate-600' : 'text-slate-300'}`}>
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            
                            {/* Action Menu */}
                            <div className="relative">
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === loan.id ? null : loan.id); }}
                                    className="p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {activeMenu === loan.id && (
                                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1">
                                        <button type="button" onClick={(e) => handleDeleteLoan(e, loan.id)} className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2">
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="bg-slate-50 p-8 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-brand-500 rounded-full"></div>
                                        Loan Details
                                    </h4>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Principal Amount</span> 
                                            <span className="font-semibold text-slate-700">R{loan.principal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Interest ({loan.interestRate}%)</span> 
                                            <span className="font-semibold text-emerald-600">+R{(loan.totalRepayment - loan.principal).toFixed(2)}</span>
                                        </div>
                                        <div className="h-px bg-slate-100 my-2"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-medium">Total Repayable</span> 
                                            <span className="font-bold text-slate-900 text-lg">R{loan.totalRepayment.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Paid So Far</span> 
                                            <span className="font-semibold text-emerald-600">-R{(loan.totalRepayment - loan.balance).toFixed(2)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center mt-2 border border-slate-100">
                                            <span className="text-slate-600 font-bold">Remaining</span> 
                                            <span className="font-bold text-rose-600 text-lg">R{loan.balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <h4 className="font-bold text-slate-900 mb-4">Record Payment</h4>
                                        <div className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-sm">R</div>
                                                <input 
                                                    type="number" 
                                                    placeholder="0.00" 
                                                    className="w-full pl-8 border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 text-slate-900 placeholder-slate-400 transition-all"
                                                    value={paymentAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                />
                                            </div>
                                            <select 
                                                className="border border-slate-200 rounded-xl p-3 bg-white outline-none text-slate-900 focus:ring-2 focus:ring-emerald-100"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="TRANSFER">Transfer</option>
                                            </select>
                                            <button 
                                                onClick={() => handlePayment(loan.id)}
                                                disabled={loan.status === LoanStatus.PAID}
                                                className="bg-emerald-600 text-white px-6 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-emerald-500/20 transition-all"
                                            >
                                                Pay
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                                        Payment History
                                    </h4>
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                                        <div className="overflow-y-auto max-h-48">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                                    <tr>
                                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider">Amount</th>
                                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider">Method</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {loan.payments.length === 0 ? (
                                                        <tr><td colSpan={3} className="p-6 text-center text-slate-400 font-medium">No payments recorded yet</td></tr>
                                                    ) : (
                                                        loan.payments.map(p => (
                                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="p-4 text-slate-600 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                                                                <td className={`p-4 font-bold ${p.method === 'PENALTY' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                    {p.method === 'PENALTY' ? '-' : '+'}R{Math.abs(p.amount).toFixed(2)}
                                                                </td>
                                                                <td className="p-4 text-xs">
                                                                    <span className={`px-2 py-1 rounded font-medium border ${
                                                                        p.method === 'PENALTY' 
                                                                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                                                    }`}>
                                                                        {p.method}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-4">Smart Actions</h4>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleGenerateMessage(loan)}
                                                className="flex-1 border border-brand-200 text-brand-700 bg-brand-50 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                {generatingMsg ? 'Thinking...' : '⚡ Generate AI Reminder'}
                                            </button>
                                            <a href={`tel:${borrower?.phone}`} className="flex-1 border border-slate-200 text-slate-700 bg-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 text-center shadow-sm transition-colors">
                                                Call Borrower
                                            </a>
                                        </div>
                                        {generatedMessage && (
                                            <div className="mt-4 p-4 bg-white border border-brand-200 rounded-2xl shadow-sm relative">
                                                <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-brand-200 transform rotate-45"></div>
                                                <p className="font-bold text-brand-800 text-xs uppercase mb-2 tracking-wider">Generated Message</p>
                                                <p className="text-slate-700 italic leading-relaxed">"{generatedMessage}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      <CreateLoanModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};