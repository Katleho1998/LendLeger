import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { User, Building, Phone, Save, Mail, Shield } from 'lucide-react';
import { UserProfile } from '../types';

export const Profile = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
    businessName: '',
    phoneNumber: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        businessName: userProfile.businessName || '',
        phoneNumber: userProfile.phoneNumber || '',
      });
    } else if (user) {
      setFormData({
        displayName: user.user_metadata?.full_name || '',
        businessName: '',
        phoneNumber: ''
      });
    }
  }, [userProfile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const updates = {
        id: user.id,
        email: user.email,
        display_name: formData.displayName,
        business_name: formData.businessName,
        phone_number: formData.phoneNumber,
        // Removed updated_at as it is not in the schema
      };

      const { error: profileError } = await supabase.from('profiles').upsert(updates);
      if (profileError) throw profileError;

      // Also update Auth metadata if name changed
      if (formData.displayName && user.user_metadata?.full_name !== formData.displayName) {
          const { error: authError } = await supabase.auth.updateUser({
              data: { full_name: formData.displayName }
          });
          if (authError) {
             console.warn("Auth metadata update failed:", authError);
             // We don't throw here to allow the profile save to succeed even if auth meta fails
          }
      }

      await refreshProfile();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error?.message || 'An unexpected error occurred.';
      setMessage(`Error updating profile: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h2>
        <p className="text-slate-500 mt-1">Manage your personal profile and business details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 p-1 mb-4 shadow-lg shadow-brand-500/20">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                        alt="Avatar" 
                        className="w-full h-full rounded-full bg-white border-2 border-white"
                    />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{formData.displayName || user?.email?.split('@')[0]}</h3>
                <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100">
                    <Shield size={12} className="mr-1.5" />
                    Admin Account
                </div>
            </div>

            <div className="bg-brand-600 p-6 rounded-2xl text-white shadow-lg shadow-brand-500/30">
                <h4 className="font-bold text-lg mb-2">Upgrade to Pro</h4>
                <p className="text-brand-100 text-sm mb-4">Get unlimited loans, AI collection agents, and custom branding.</p>
                <button className="w-full py-2 bg-white text-brand-600 rounded-lg font-bold text-sm hover:bg-brand-50 transition-colors">View Plans</button>
            </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-brand-600" />
                    Personal Information
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="email" 
                                    disabled
                                    className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
                                    value={user?.email || ''}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                         <div className="relative">
                            <Phone size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="tel" 
                                className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                                placeholder="+1 234 567 890"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-8"></div>

                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Building size={20} className="text-brand-600" />
                    Business Details
                </h3>

                <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Business / Organization Name</label>
                     <div className="relative">
                        <Building size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                            placeholder="e.g. Acme Lending"
                            value={formData.businessName}
                            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">This will appear on reports and generated messages.</p>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    {message ? (
                        <span className={`text-sm font-medium ${message.includes('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {message}
                        </span>
                    ) : (
                        <span></span>
                    )}
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                        {!saving && <Save size={18} />}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};