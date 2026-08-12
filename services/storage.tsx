import React, { createContext, useContext, useEffect, useState } from 'react';
import { Borrower, Loan, Payment, AuditLog, LoanStatus, InterestType } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Settings } from 'lucide-react';

interface StoreContextType {
  borrowers: Borrower[];
  loans: Loan[];
  auditLogs: AuditLog[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  addBorrower: (b: Omit<Borrower, 'id' | 'createdAt'>) => void;
  updateBorrower: (id: string, data: Partial<Borrower>) => void;
  deleteBorrower: (id: string) => void;
  addLoan: (l: Omit<Loan, 'id' | 'status' | 'balance' | 'payments' | 'logs' | 'totalRepayment'>) => void;
  deleteLoan: (id: string) => void;
  addPayment: (loanId: string, amount: number, method: 'CASH' | 'TRANSFER' | 'OTHER') => void;
  recalculateLoans: () => void;
  updateLoanDueDate: (loanId: string, newDueDate: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const { user, userProfile } = useAuth();
  const myName = userProfile?.displayName || user?.email?.split('@')[0];
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check configuration on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
        setError("Supabase Environment Variables missing. Please set SUPABASE_URL and SUPABASE_KEY to continue.");
    }
  }, []);

  const fetchData = async () => {
    if (!isSupabaseConfigured) return;
    if (!user) return;
    
    try {
        // Shared read: fetch ALL records regardless of who created them (no user_id filter).
        // Write access remains owner-only, enforced by Supabase RLS policies.

        // Resolve creator user_id -> display name, so cards can show "Created by X".
        // Requires the profiles table to also have a shared-read RLS policy (see supabase/rls-shared-read.sql).
        const { data: pData, error: pError } = await supabase.from('profiles').select('id, display_name, email');
        if (pError) console.error("Error fetching profiles for creator names:", pError);
        const creatorNameOf = (userId: string | null | undefined): string | undefined => {
            if (!userId || !pData) return undefined;
            const p = pData.find((row: any) => row.id === userId);
            if (!p) return undefined;
            return p.display_name || p.email?.split('@')[0];
        };

        const { data: bData, error: bError } = await supabase.from('borrowers').select('*');
        if (bError) throw bError;
        setBorrowers(bData.map((d: any) => ({
             id: d.id,
             userId: d.user_id,
             creatorName: creatorNameOf(d.user_id),
             name: d.name,
             phone: d.phone,
             idNumber: d.id_number,
             notes: d.notes,
             riskLevel: d.risk_level,
             createdAt: d.created_at
        })));

        const { data: lData, error: lError } = await supabase.from('loans').select('*');
        if (lError) throw lError;
        setLoans(lData.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            creatorName: creatorNameOf(d.user_id),
            borrowerId: d.borrower_id,
            principal: d.principal,
            interestRate: d.interest_rate,
            interestType: d.interest_type,
            termValue: d.term_value,
            termUnit: d.term_unit,
            startDate: d.start_date,
            dueDate: d.due_date,
            status: d.status,
            balance: d.balance,
            totalRepayment: d.total_repayment,
            payments: d.payments || [],
            logs: [],
            signature: d.signature
        })));

        const { data: aData, error: aError } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        if (aError) throw aError;
        setAuditLogs(aData as AuditLog[]);
        
        setError(null);
    } catch (e: any) {
        console.error("Supabase Fetch Error:", e);
        if(e.code === '42501' || e.message?.includes("row-level security")) {
             setError("Access denied. Please check your Supabase Row Level Security (RLS) policies.");
        } else if (e.code === 'PGRST301') {
             setError("Database tables not found. Please run the SQL setup script.");
        } else {
             setError(e.message || "Failed to connect to Supabase.");
        }
    }
  };

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setBorrowers([]);
      setLoans([]);
      setAuditLogs([]);
      // Don't clear configuration errors here
      if (isSupabaseConfigured) setError(null);
      return;
    }

    fetchData();

    // No user_id filter here: everyone's changes should be reflected for everyone (shared read).
    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'borrowers' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loans' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, [user]);

  const logAction = async (action: string, details: string, entityId?: string) => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        details,
        timestamp: new Date().toISOString(),
        entity_id: entityId || null
      }).select();
      
      if (error) throw error;
      if (data) {
          setAuditLogs(prev => [data[0] as AuditLog, ...prev]);
      }
    } catch (e) {
      console.error("Error logging action", e);
    }
  };

  const addBorrower = async (data: Omit<Borrower, 'id' | 'createdAt'>) => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const { data: newBorrower, error } = await supabase.from('borrowers').insert({
        user_id: user.id,
        name: data.name,
        phone: data.phone,
        id_number: data.idNumber,
        notes: data.notes,
        risk_level: data.riskLevel
      }).select().single();

      if (error) throw error;

      // Optimistic update
      if (newBorrower) {
        setBorrowers(prev => [...prev, {
             id: newBorrower.id,
             userId: newBorrower.user_id,
             creatorName: myName,
             name: newBorrower.name,
             phone: newBorrower.phone,
             idNumber: newBorrower.id_number,
             notes: newBorrower.notes,
             riskLevel: newBorrower.risk_level,
             createdAt: newBorrower.created_at
        }]);
      }

      logAction('CREATE_BORROWER', `Added borrower ${data.name}`);
    } catch (e) {
      console.error("Error adding borrower", e);
      alert("Failed to add borrower.");
    }
  };

  const updateBorrower = async (id: string, data: Partial<Borrower>) => {
    try {
        const dbData: any = {};
        if (data.name) dbData.name = data.name;
        if (data.phone) dbData.phone = data.phone;
        if (data.idNumber) dbData.id_number = data.idNumber;
        if (data.notes) dbData.notes = data.notes;
        if (data.riskLevel) dbData.risk_level = data.riskLevel;

        // Writes are owner-only (RLS). A denied update returns 0 rows rather than an error,
        // so check the returned rows to detect that case instead of trusting it silently.
        const { data: updated, error } = await supabase.from('borrowers').update(dbData).eq('id', id).select();
        if (error) throw error;
        if (!updated || updated.length === 0) {
            alert("You can only edit borrowers you created.");
            return;
        }

        // Manual state update
        setBorrowers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

        logAction('UPDATE_BORROWER', `Updated borrower details`, id);
    } catch (e) {
      console.error("Error updating borrower", e);
    }
  };

  const deleteBorrower = async (id: string) => {
    try {
      const b = borrowers.find(x => x.id === id);

      if (b?.userId && user && b.userId !== user.id) {
          alert("You can only delete borrowers you created.");
          return;
      }

      // 1. Manually delete associated loans first to prevent FK constraint errors
      // (only loans this user owns will actually be removed; RLS blocks the rest)
      const { error: loanError } = await supabase.from('loans').delete().eq('borrower_id', id);
      if (loanError) {
          console.error("Error cleaning up borrower loans:", loanError);
      }

      // 2. Delete the borrower (owner-only per RLS)
      const { data: deleted, error } = await supabase.from('borrowers').delete().eq('id', id).select();
      if (error) throw error;
      if (!deleted || deleted.length === 0) {
          alert("You can only delete borrowers you created.");
          fetchData(); // Re-sync in case the loan cleanup above partially ran
          return;
      }

      // 3. Update state immediately
      setBorrowers(prev => prev.filter(item => item.id !== id));
      setLoans(prev => prev.filter(l => l.borrowerId !== id));

      logAction('DELETE_BORROWER', `Deleted borrower ${b?.name || 'Unknown'}`, id);
    } catch (e: any) {
      console.error("Error deleting borrower", e);
      alert(`Failed to delete borrower: ${e.message}`);
    }
  };

  const addLoan = async (data: Omit<Loan, 'id' | 'status' | 'balance' | 'payments' | 'logs' | 'totalRepayment'>) => {
    if (!user || !isSupabaseConfigured) return;
    
    const startDate = new Date(data.startDate);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(5); // Force to 5th
    const dueDate = nextMonth.toISOString();

    let totalRepayment = data.principal;
    
    if (data.interestType === InterestType.SIMPLE || data.interestType === InterestType.FLAT) {
      const interestAmount = data.principal * (data.interestRate / 100);
      totalRepayment = data.principal + interestAmount;
    } else {
      totalRepayment = data.principal * Math.pow((1 + data.interestRate / 100), data.termValue);
    }

    try {
      // Prepare the insert data
      const insertData: any = {
        user_id: user.id,
        borrower_id: data.borrowerId,
        principal: data.principal,
        interest_rate: data.interestRate,
        interest_type: data.interestType,
        term_value: data.termValue,
        term_unit: data.termUnit,
        start_date: data.startDate,
        due_date: dueDate,
        status: LoanStatus.ACTIVE,
        balance: totalRepayment,
        total_repayment: totalRepayment,
        payments: []
      };

      // Only add signature if it exists (to avoid schema errors)
      if (data.signature) {
        insertData.signature = data.signature;
      }

      const { data: newLoan, error } = await supabase.from('loans').insert(insertData).select().single();

      if (error) throw error;

      if (newLoan) {
          setLoans(prev => [...prev, {
            id: newLoan.id,
            userId: newLoan.user_id,
            creatorName: myName,
            borrowerId: newLoan.borrower_id,
            principal: newLoan.principal,
            interestRate: newLoan.interest_rate,
            interestType: newLoan.interest_type,
            termValue: newLoan.term_value,
            termUnit: newLoan.term_unit,
            startDate: newLoan.start_date,
            dueDate: newLoan.due_date,
            status: newLoan.status,
            balance: newLoan.balance,
            totalRepayment: newLoan.total_repayment,
            payments: newLoan.payments || [],
            logs: [],
            signature: newLoan.signature
          }]);
      }

      logAction('CREATE_LOAN', `Created loan of R${data.principal} due on ${nextMonth.toDateString()}`);
    } catch (e: any) {
      console.error("Error adding loan", e);

      // Provide more specific error messages
      let errorMessage = "Failed to create loan.";
      if (e.code === '23503') {
        errorMessage = "Invalid borrower selected. Please try again.";
      } else if (e.code === '23505') {
        errorMessage = "A loan with these details already exists.";
      } else if (e.message?.includes('signature')) {
        errorMessage = "Signature could not be saved. Loan created without signature.";
        // Try to create loan without signature
        try {
          const insertData: any = {
            user_id: user.id,
            borrower_id: data.borrowerId,
            principal: data.principal,
            interest_rate: data.interestRate,
            interest_type: data.interestType,
            term_value: data.termValue,
            term_unit: data.termUnit,
            start_date: data.startDate,
            due_date: dueDate,
            status: LoanStatus.ACTIVE,
            balance: totalRepayment,
            total_repayment: totalRepayment,
            payments: []
          };

          const { data: newLoan, error: retryError } = await supabase.from('loans').insert(insertData).select().single();
          if (!retryError && newLoan) {
            setLoans(prev => [...prev, {
              id: newLoan.id,
              userId: newLoan.user_id,
              creatorName: myName,
              borrowerId: newLoan.borrower_id,
              principal: newLoan.principal,
              interestRate: newLoan.interest_rate,
              interestType: newLoan.interest_type,
              termValue: newLoan.term_value,
              termUnit: newLoan.term_unit,
              startDate: newLoan.start_date,
              dueDate: newLoan.due_date,
              status: newLoan.status,
              balance: newLoan.balance,
              totalRepayment: newLoan.total_repayment,
              payments: newLoan.payments || [],
              logs: [],
              signature: data.signature // Keep signature in local state even if not saved to DB
            }]);
            logAction('CREATE_LOAN', `Created loan of R${data.principal} (signature saved locally)`);
            alert("Loan created successfully! Note: Signature saved locally but not in database.");
            return;
          }
        } catch (retryError) {
          console.error("Retry also failed", retryError);
        }
      }

      alert(errorMessage);
    }
  };

  const deleteLoan = async (id: string) => {
      try {
          const { data: deleted, error } = await supabase.from('loans').delete().eq('id', id).select();
          if (error) throw error;
          if (!deleted || deleted.length === 0) {
              alert("You can only delete loans you created.");
              return;
          }
          setLoans(prev => prev.filter(l => l.id !== id));
          logAction('DELETE_LOAN', `Deleted Loan ID ${id.substring(0,6)}`, id);
      } catch (e: any) {
          console.error("Error deleting loan", e);
          alert(`Failed to delete loan: ${e.message}`);
      }
  };

  const addPayment = async (loanId: string, amount: number, method: 'CASH' | 'TRANSFER' | 'OTHER') => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const payment: Payment = {
      id: crypto.randomUUID(),
      loanId,
      amount,
      date: new Date().toISOString(),
      method
    };

    const newBalance = Math.max(0, loan.balance - amount);
    const newStatus = newBalance <= 1 ? LoanStatus.PAID : loan.status;
    const newPayments = [...loan.payments, payment];

    try {
      const { data: updated, error } = await supabase.from('loans').update({
        balance: newBalance,
        status: newStatus,
        payments: newPayments
      }).eq('id', loanId).select();

      if (error) throw error;
      if (!updated || updated.length === 0) {
          alert("You can only record payments on loans you created.");
          return;
      }

      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, balance: newBalance, status: newStatus, payments: newPayments } : l));
      logAction('PAYMENT', `Received payment of R${amount}`, loanId);
    } catch (e) {
      console.error("Error adding payment", e);
      alert("Failed to record payment.");
    }
  };

  const recalculateLoans = async () => {
    const now = new Date();

    loans.forEach(async (l) => {
      if (l.status === LoanStatus.PAID || l.status === LoanStatus.DEFAULTED) return;
      // Writes are owner-only (RLS): skip loans this user doesn't own so we don't
      // attempt a write that will be silently rejected, or desync local state from the DB.
      if (l.userId && user && l.userId !== user.id) return;

      const dueDate = new Date(l.dueDate);
      
      if (now > dueDate) {
         let shouldApplyPenalty = true;
         const existingPenalty = l.payments.find(p => p.method === 'PENALTY' && new Date(p.date) > dueDate);
         
         if (existingPenalty) {
             shouldApplyPenalty = false;
         }

         if (shouldApplyPenalty) {
             const penaltyAmount = l.principal * (l.interestRate / 100);
             const newBalance = l.balance + penaltyAmount;
             const newTotalRepayment = l.totalRepayment + penaltyAmount;
             
             const penaltyRecord: Payment = {
                 id: crypto.randomUUID(),
                 loanId: l.id,
                 amount: -penaltyAmount,
                 date: new Date().toISOString(),
                 method: 'PENALTY',
                 notes: `Automatic penalty for missing due date: ${dueDate.toLocaleDateString()}`
             };

             try {
                const newPayments = [...l.payments, penaltyRecord];
                await supabase.from('loans').update({
                    status: LoanStatus.OVERDUE,
                    balance: newBalance,
                    total_repayment: newTotalRepayment,
                    payments: newPayments
                }).eq('id', l.id);
                
                setLoans(prev => prev.map(loan => loan.id === l.id ? { 
                    ...loan, 
                    status: LoanStatus.OVERDUE, 
                    balance: newBalance, 
                    totalRepayment: newTotalRepayment,
                    payments: newPayments 
                } : loan));

                logAction('SYSTEM_PENALTY', `Applied penalty of R${penaltyAmount} to Loan #${l.id.substring(0,4)}`, l.id);
             } catch(e) {
                 console.error("Failed to apply penalty", e);
             }
         } else if (l.status !== LoanStatus.OVERDUE) {
             try {
                 await supabase.from('loans').update({ status: LoanStatus.OVERDUE }).eq('id', l.id);
                 setLoans(prev => prev.map(loan => loan.id === l.id ? { ...loan, status: LoanStatus.OVERDUE } : loan));
             } catch(e) {}
         }
      }
    });
  };

  const updateLoanDueDate = async (loanId: string, newDueDate: string) => {
    try {
      // Write to DB (owner-only per RLS)
      const { data: updated, error } = await supabase.from('loans').update({ due_date: newDueDate }).eq('id', loanId).select();
      if (error) throw error;
      if (!updated || updated.length === 0) {
          alert("You can only edit the due date on loans you created.");
          return;
      }

      // Update local state
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, dueDate: newDueDate } : l));

      logAction('UPDATE_LOAN_DUEDATE', `Updated due date to ${new Date(newDueDate).toLocaleDateString()}`, loanId);
    } catch (e: any) {
      console.error('Error updating loan due date', e);
      alert('Failed to update due date.');
    }
  };

  useEffect(() => {
    const interval = setInterval(recalculateLoans, 60000);
    if (loans.length > 0) recalculateLoans();
    return () => clearInterval(interval);
  }, [loans.length]);

  if (error) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {error.includes("Environment Variables") ? (
                         <Settings className="text-brand-600" size={32} />
                    ) : (
                         <AlertTriangle className="text-rose-600" size={32} />
                    )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {error.includes("Environment Variables") ? "Configuration Required" : "Connection Error"}
                </h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">{error}</p>
                {error.includes("Environment Variables") ? (
                    <div className="text-left bg-slate-900 rounded-lg p-4 mb-6 overflow-x-auto">
                        <code className="text-xs text-slate-300 font-mono">
                            SUPABASE_URL=your_project_url<br/>
                            SUPABASE_KEY=your_anon_key
                        </code>
                    </div>
                ) : (
                    <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                        Retry Connection
                    </button>
                )}
            </div>
        </div>
    );
  }

  return (
    <StoreContext.Provider value={{
      borrowers,
      loans,
      auditLogs,
      searchTerm,
      setSearchTerm,
      addBorrower,
      updateBorrower,
      deleteBorrower,
      addLoan,
      deleteLoan,
      addPayment,
      recalculateLoans,
      updateLoanDueDate
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};