import React, { useState, useEffect } from 'react';
import { useStore } from '../services/storage';
import { X, Info, Calendar } from 'lucide-react';
import { InterestType } from '../types';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLoanModal: React.FC<CreateLoanModalProps> = ({ isOpen, onClose }) => {
  const { borrowers, addLoan } = useStore();
  const [formData, setFormData] = useState({
    borrowerId: '',
    principal: '',
    interestRate: '40',
    interestType: InterestType.FLAT,
    termValue: '1',
    termUnit: 'MONTHS' as 'DAYS' | 'WEEKS' | 'MONTHS',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [dueDateDisplay, setDueDateDisplay] = useState('');

  useEffect(() => {
    if (formData.startDate) {
      const d = new Date(formData.startDate);
      d.setMonth(d.getMonth() + 1);
      d.setDate(5); // Strict 5th of next month rule
      setDueDateDisplay(d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }
  }, [formData.startDate]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.principal || !formData.borrowerId) return;

    addLoan({
      borrowerId: formData.borrowerId,
      principal: parseFloat(formData.principal),
      interestRate: 40, // Fixed at 40
      interestType: formData.interestType,
      startDate: formData.startDate,
      termValue: 1, // Forced 1 month
      termUnit: 'MONTHS',
      // Due date is handled in storage service strictly
      dueDate: '', // Placeholder
    });

    // Reset form
    setFormData({
        borrowerId: '',
        principal: '',
        interestRate: '40',
        interestType: InterestType.FLAT,
        termValue: '1',
        termUnit: 'MONTHS',
        startDate: new Date().toISOString().split('T')[0]
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
        <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-2 text-slate-900">Create New Loan</h2>
            <p className="text-slate-500 mb-8">Enter the loan details.</p>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Borrower</label>
                <select 
                    required 
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-brand-100 transition-all outline-none" 
                    value={formData.borrowerId} 
                    onChange={e => setFormData({...formData, borrowerId: e.target.value})}
                >
                    <option value="">-- Select --</option>
                    {borrowers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Principal Amount</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold text-sm">R</div>
                        <input 
                            required 
                            type="number" 
                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-brand-100 placeholder-slate-400 transition-all" 
                            value={formData.principal} 
                            onChange={e => setFormData({...formData, principal: e.target.value})} 
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Interest Rate (%)</label>
                    <input 
                        readOnly
                        disabled
                        type="number" 
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed outline-none" 
                        value="40" 
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                <input 
                    type="date" 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-brand-100 transition-all" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
              </div>

              <div className="bg-brand-50 p-5 rounded-xl border border-brand-100 space-y-3">
                 <div className="flex items-start gap-4">
                    <Info className="text-brand-600 mt-1 flex-shrink-0" size={20} />
                    <div className="text-sm text-brand-900">
                        <p className="font-bold mb-1">Loan Summary</p>
                        <ul className="list-disc list-inside space-y-1 opacity-80">
                            <li>Principal: R{formData.principal || 0}</li>
                            <li>Interest: 40% (FLAT)</li>
                            <li>Total Repayable: <strong>R{ formData.principal ? (parseFloat(formData.principal) * 1.40).toFixed(2) : 0 }</strong></li>
                        </ul>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-brand-100">
                     <Calendar className="text-brand-600" size={18} />
                     <span className="text-sm font-bold text-brand-800">Due Date: {dueDateDisplay}</span>
                 </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0">Create Loan</button>
              </div>
            </form>
        </div>
    </div>
  );
};