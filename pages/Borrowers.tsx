import React, { useState } from 'react';
import { useStore } from '../services/storage';
import { Plus, Search, Phone, CreditCard, AlertTriangle, MessageSquare, User, MoreHorizontal, FileText, X, Trash2, Edit } from 'lucide-react';
import { Borrower, RiskLevel } from '../types';
import { analyzeBorrowerRisk } from '../services/geminiService';

export const Borrowers = () => {
  const { borrowers, addBorrower, deleteBorrower, updateBorrower, loans, searchTerm, setSearchTerm } = useStore();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Borrower>>({
    name: '',
    phone: '',
    idNumber: '',
    notes: '',
    riskLevel: RiskLevel.LOW
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      if (editingId) {
        updateBorrower(editingId, formData);
      } else {
        addBorrower(formData as any);
      }
      setModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
      setFormData({ name: '', phone: '', idNumber: '', notes: '', riskLevel: RiskLevel.LOW });
      setEditingId(null);
  }

  const handleEdit = (b: Borrower) => {
      setFormData({
          name: b.name,
          phone: b.phone,
          idNumber: b.idNumber,
          notes: b.notes,
          riskLevel: b.riskLevel
      });
      setEditingId(b.id);
      setModalOpen(true);
      setActiveMenu(null);
  }

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this borrower? This action cannot be undone.")) {
          deleteBorrower(id);
      }
      setActiveMenu(null);
  }

  const handleDeleteFromModal = (id: string) => {
      if(window.confirm("Are you sure you want to delete this borrower? This action cannot be undone.")) {
          deleteBorrower(id);
          setSelectedBorrower(null);
      }
  }

  const handleAiAnalysis = async (borrower: Borrower) => {
    setLoadingAi(true);
    setAiAnalysis('');
    const borrowerLoans = loans.filter(l => l.borrowerId === borrower.id);
    const history = borrowerLoans.length > 0 
        ? `${borrowerLoans.length} loans, ${borrowerLoans.filter(l => l.status === 'OVERDUE').length} overdue.` 
        : "No loan history.";
    
    const result = await analyzeBorrowerRisk(borrower, history);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const filteredBorrowers = borrowers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8" onClick={() => setActiveMenu(null)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Borrowers</h2>
            <p className="text-slate-500 mt-1">Manage client profiles and history.</p>
        </div>
        <div className="flex w-full sm:w-auto space-x-3">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search name or phone..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 placeholder-slate-400 shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => { resetForm(); setModalOpen(true); }}
                className="bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 flex items-center space-x-2 transition-all shadow-lg shadow-brand-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
            >
                <Plus size={20} />
                <span className="font-semibold">Add New</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBorrowers.map(borrower => (
          <div key={borrower.id} className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 relative">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg shadow-sm">
                        {borrower.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{borrower.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">{borrower.phone}</p>
                    </div>
                </div>
                <div className="relative">
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === borrower.id ? null : borrower.id); }}
                        className="text-slate-300 hover:text-slate-600 transition-colors p-1"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {activeMenu === borrower.id && (
                        <div className="absolute right-0 top-8 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1">
                            <button type="button" onClick={() => handleEdit(borrower)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                <Edit size={14} /> Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(borrower.id)} className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 flex items-center gap-2">
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                 <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <CreditCard size={16} className="mr-3 text-slate-400" />
                    <span className="font-medium text-slate-700">{borrower.idNumber || 'No ID Provided'}</span>
                 </div>
                 <div className="flex items-start text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <AlertTriangle size={16} className="mr-3 mt-0.5 text-slate-400" />
                    <p className="line-clamp-2 text-slate-700">{borrower.notes || 'No notes available.'}</p>
                 </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    borrower.riskLevel === 'HIGH' || borrower.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    borrower.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                    {borrower.riskLevel} Risk
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</span>
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-2">
                 <button 
                    type="button"
                    className="flex-1 bg-brand-50 text-brand-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                    onClick={() => { setSelectedBorrower(borrower); handleAiAnalysis(borrower); }}
                 >
                    <MessageSquare size={16} /> Analysis
                 </button>
                 <a href={`tel:${borrower.phone}`} className="p-2.5 rounded-lg hover:bg-slate-50 text-slate-500 border border-slate-200 transition-colors">
                    <Phone size={18} />
                 </a>
              </div>
            </div>
          </div>
        ))}
        {filteredBorrowers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <User size={48} className="mx-auto mb-4 text-slate-200" />
                <p>No borrowers found matching your search.</p>
            </div>
        )}
      </div>

      {/* Add/Edit Borrower Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <h3 className="text-2xl font-bold mb-6 text-slate-900">{editingId ? 'Edit Borrower' : 'New Borrower'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 placeholder-slate-400 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <input required type="tel" className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 placeholder-slate-400 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">ID / Passport Number</label>
                    <input type="text" className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 placeholder-slate-400 transition-all" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Initial Risk Level</label>
                    <select className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 transition-all" value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value as RiskLevel})}>
                        <option value={RiskLevel.LOW}>Low</option>
                        <option value={RiskLevel.MEDIUM}>Medium</option>
                        <option value={RiskLevel.HIGH}>High</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                    <textarea className="w-full border border-slate-200 rounded-xl p-3 bg-white outline-none focus:ring-2 focus:ring-brand-100 text-slate-900 placeholder-slate-400 transition-all" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold shadow-lg shadow-brand-500/20 transition-all">Save Borrower</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {selectedBorrower && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-lg relative shadow-2xl">
                  <button onClick={() => setSelectedBorrower(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-full transition-colors"><X size={20} /></button>
                  
                  <div className="flex items-center space-x-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                          <User size={28} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">{selectedBorrower.name}</h3>
                          <p className="text-slate-500 text-sm font-medium">Risk Assessment Profile</p>
                      </div>
                  </div>
                  
                  <div className="mb-8">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                        <MessageSquare size={18} className="text-brand-500" /> 
                        Gemini AI Analysis
                      </h4>
                      <div className="bg-slate-50 p-5 rounded-2xl text-slate-600 border border-slate-200 leading-relaxed">
                          {loadingAi ? (
                              <div className="flex items-center space-x-3 py-4">
                                  <div className="animate-spin h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                                  <span className="font-medium text-slate-500">Analyzing borrower behavior...</span>
                              </div>
                          ) : (
                              <p>{aiAnalysis}</p>
                          )}
                      </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <button onClick={() => handleDeleteFromModal(selectedBorrower.id)} className="text-rose-500 text-sm font-semibold hover:text-rose-700 px-2 transition-colors">Delete Profile</button>
                      <button onClick={() => setSelectedBorrower(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium shadow-lg shadow-slate-900/20 transition-all">Close</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};