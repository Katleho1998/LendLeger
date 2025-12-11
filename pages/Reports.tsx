import React from 'react';
import { useStore } from '../services/storage';
import { Download, FileText } from 'lucide-react';
import { generateLoansPDF } from '../utils/pdf';

export const Reports = () => {
  const { loans, borrowers } = useStore();

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Reports Center</h2>
            <p className="text-slate-500 mt-1">Generate and download performance summaries and audit trails.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Loan Portfolio Summary</h3>
                        <p className="text-sm text-slate-500 font-medium">Complete list of active and closed loans.</p>
                    </div>
                </div>
                <button 
                    onClick={() => generateLoansPDF(loans, borrowers)}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-900/10"
                >
                    <Download size={18} />
                    <span>Download PDF</span>
                </button>
            </div>

             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm opacity-60 cursor-not-allowed">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Profit & Loss</h3>
                        <p className="text-sm text-slate-500 font-medium">Interest earned vs bad debt.</p>
                    </div>
                </div>
                <button disabled className="w-full flex items-center justify-center space-x-2 bg-slate-100 text-slate-400 py-2.5 rounded-lg cursor-not-allowed font-medium">
                    <Download size={18} />
                    <span>Coming Soon</span>
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900">Recent Audit Logs</h3>
            </div>
            <AuditLogTable />
        </div>
    </div>
  );
};

const AuditLogTable = () => {
    const { auditLogs } = useStore();
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {auditLogs.slice(0, 10).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-slate-500 whitespace-nowrap font-medium">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-3 font-medium text-slate-700">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 font-semibold">{log.action}</span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                                {log.details}
                            </td>
                        </tr>
                    ))}
                    {auditLogs.length === 0 && (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-medium">No logs available</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}