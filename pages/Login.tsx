import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowRight, Lock, Mail, AlertCircle, User as UserIcon } from 'lucide-react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        // Sign Up Flow
        if (!fullName.trim()) throw new Error("Please enter your full name.");

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName } // Stored in user_metadata
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            // Check if we have a valid session. If not, email confirmation is likely enabled.
            if (authData.session) {
                // Use upsert to handle cases where a database trigger might have already created the profile
                // This prevents "duplicate key value" errors and ensures we just update if it exists
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email,
                    display_name: fullName,
                    // Removed updated_at
                });
                
                if (profileError) {
                    // Log the actual message instead of the object
                    console.error("Profile creation warning:", profileError.message);
                }
                navigate('/');
            } else {
                // Session is null, meaning email confirmation is required by the Supabase project settings
                setError("Account created! Please check your email to confirm registration before logging in.");
                setLoading(false);
                return;
            }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "Please enter your full name.") {
          setError(err.message);
      } else if (err.message.includes("Invalid login credentials")) {
        setError('Invalid email or password.');
      } else if (err.message.includes("User already registered")) {
        setError('Email is already registered. Please sign in.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 mx-auto mb-6 transform rotate-3">
              <CheckSquare className="text-white" size={32} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LendLedger.</h1>
            <p className="text-slate-500 mt-2">Professional Informal Lending Management</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
           <div className="flex items-center justify-center mb-8 bg-slate-50 p-1 rounded-xl">
             <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Sign In
             </button>
             <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Create Account
             </button>
           </div>

           {error && (
             <div className={`mb-6 p-3 rounded-xl text-sm flex items-center gap-2 ${error.includes('Account created') ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-rose-50 border border-rose-100 text-rose-600'}`}>
               <AlertCircle size={16} />
               {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
             {!isLogin && (
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
                   <div className="relative">
                     <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                        type="text" 
                        required 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                     />
                   </div>
                 </div>
             )}

             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                    type="email" 
                    required 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                 />
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                    type="password" 
                    required 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                 />
               </div>
             </div>

             <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? 'Please wait...' : (isLogin ? 'Access Dashboard' : 'Create Account')}
                {!loading && <ArrowRight size={18} />}
             </button>
           </form>
           
           <div className="mt-8 text-center">
             <p className="text-xs text-slate-400">
               By continuing, you agree to our Terms of Service and Privacy Policy.
               <br/>Secure connection powered by Supabase.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};