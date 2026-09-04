import React, { useMemo } from 'react';
import { useStore } from '../services/storage';
import { Download, FileText, TrendingUp, Ban, Clock3, Wallet } from 'lucide-react';
import {
  generateLoansPDF,
  generateProfitLossPDF,
  generateWriteOffsPDF,
  generateOutstandingPDF,
  generateCapitalPDF
} from '../utils/pdf';
import { computePortfolioMetrics } from '../utils/analytics';

const SummaryTile = ({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'positive' | 'negative' }) => {
  const toneClass = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-rose-600' : 'text-slate-900';
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
};

const ReportCard = ({ icon, iconBg, title, description, onDownload, disabled }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onDownload?: () => void;
  disabled?: boolean;
}) => (
  <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all ${disabled ? 'opacity-60' : 'hover:shadow-md'}`}>
    <div className="flex items-center space-x-3 mb-4">
      <div className={`${iconBg} p-3 rounded-lg`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 font-medium">{description}</p>
      </div>
    </div>
    <button
      onClick={onDownload}
      disabled={disabled}
      className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-lg shadow-slate-900/10 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
    >
      <Download size={18} />
      <span>{disabled ? 'Coming Soon' : 'Download PDF'}</span>
    </button>
  </div>
);

export const Reports = () => {
  const { loans, borrowers, startingCapital } = useStore();

  const metrics = useMemo(() => computePortfolioMetrics(loans), [loans]);
  const availableToLend = startingCapital - metrics.totalPrincipal + metrics.totalCollected;

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Analytics &amp; Reports</h2>
            <p className="text-slate-500 mt-1">Live performance numbers and downloadable summaries.</p>
        </div>

        {/* At-a-glance analytics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryTile label="Net Profit" value={`R${metrics.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone={metrics.netProfit >= 0 ? 'positive' : 'negative'} />
            <SummaryTile label="Outstanding" value={`R${metrics.totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="neutral" />
            <SummaryTile label="Written Off" value={`R${metrics.totalWrittenOff.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone={metrics.totalWrittenOff > 0 ? 'negative' : 'neutral'} />
            <SummaryTile label="Available to Lend" value={`R${availableToLend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone={availableToLend >= 0 ? 'positive' : 'negative'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
                icon={<FileText size={24} className="text-blue-600" />}
                iconBg="bg-blue-100"
                title="Loan Portfolio Summary"
                description="Complete list of active and closed loans."
                onDownload={() => generateLoansPDF(loans, borrowers)}
            />

            <ReportCard
                icon={<TrendingUp size={24} className="text-emerald-600" />}
                iconBg="bg-emerald-100"
                title="Profit & Loss"
                description="Interest earned vs. bad debt written off."
                onDownload={() => generateProfitLossPDF(loans)}
            />

            <ReportCard
                icon={<Ban size={24} className="text-rose-600" />}
                iconBg="bg-rose-100"
                title="Write-Offs / Bad Debt"
                description="Every loan closed as a loss, and why."
                onDownload={() => generateWriteOffsPDF(loans, borrowers)}
            />

            <ReportCard
                icon={<Clock3 size={24} className="text-amber-600" />}
                iconBg="bg-amber-100"
                title="Outstanding & Overdue"
                description="Who still owes what, and how overdue it is."
                onDownload={() => generateOutstandingPDF(loans, borrowers)}
            />

            <ReportCard
                icon={<Wallet size={24} className="text-indigo-600" />}
                iconBg="bg-indigo-100"
                title="Capital & Cashflow"
                description="Starting capital vs. disbursed, collected, and left to lend."
                onDownload={() => generateCapitalPDF(loans, startingCapital)}
            />
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
