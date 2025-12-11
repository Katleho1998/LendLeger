import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './services/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Borrowers } from './pages/Borrowers';
import { Loans } from './pages/Loans';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

const AuditPage = () => {
    const { auditLogs } = useStore();
    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h2>
                <p className="text-slate-500 mt-1">Complete immutable history of all system actions.</p>
             </div>
             
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Action Type</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Entity ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                            log.action.includes('DELETE') ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            log.action.includes('CREATE') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            log.action.includes('UPDATE') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {log.entityId || '-'}
                                    </td>
                                </tr>
                            ))}
                            {auditLogs.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No activity recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
        </div>
    )
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/borrowers" element={<Borrowers />} />
                    <Route path="/loans" element={<Loans />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/audit" element={<AuditPage />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </HashRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;