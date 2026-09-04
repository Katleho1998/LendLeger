import React, { useMemo, useState } from 'react';
import { useStore } from '../services/storage';
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, RefreshCw, FileText, Wallet, Settings as SettingsIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { LoanStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { computePortfolioMetrics } from '../utils/analytics';

const StatCard = ({ title, value, badgeValue, badgeType }: any) => {
  const isPositive = badgeType === 'positive';
  const badgeColor = isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
  const badgeIcon = isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group min-w-0">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex items-center space-x-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${title.includes('Overdue') || title.includes('Written Off') ? 'bg-rose-500' : 'bg-brand-500'}`}></div>
            <h3 className="text-sm font-semibold text-slate-500 truncate">{title}</h3>
        </div>
        <MoreHorizontal size={20} className="text-slate-300 shrink-0" />
      </div>

      <div className="flex items-end flex-wrap gap-x-3 gap-y-1">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate">{value}</span>
        {badgeValue && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${badgeColor} mb-1.5 shrink-0`}>
                {badgeIcon}
                <span>{badgeValue}</span>
            </div>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">Vs last month</p>
    </div>
  );
};

export const Dashboard = () => {
  const { loans, searchTerm, startingCapital } = useStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const filteredLoans = loans.filter(l =>
     l.id.includes(searchTerm) ||
     l.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Capital pool: tracks actual cash movement against the manually-entered starting
  // capital (set on the Profile / Account Settings page), independent of the search
  // filter above -- it's a running total across every loan, not just the visible ones.
  const capital = useMemo(() => {
    const m = computePortfolioMetrics(loans);
    const availableToLend = startingCapital - m.totalPrincipal + m.totalCollected;
    // Total Value: what the business is actually worth right now -- the starting
    // capital plus every rand of profit banked so far (interest earned, net of any
    // bad debt written off). This is how the capital has grown, not just cash on hand.
    const totalValue = startingCapital + m.netProfit;
    const growthPercent = startingCapital > 0 ? (m.netProfit / startingCapital) * 100 : null;
    return { disbursed: m.totalPrincipal, collected: m.totalCollected, availableToLend, netProfit: m.netProfit, totalValue, growthPercent };
  }, [loans, startingCapital]);

  const metrics = useMemo(() => {
    const m = computePortfolioMetrics(filteredLoans);
    return {
      totalLent: m.totalPrincipal,
      totalCollected: m.totalCollected,
      outstanding: m.totalOutstanding,
      netProfit: m.netProfit,
      overdueCount: m.overdueCount,
      overdueAmount: m.overdueAmount,
      activeCount: m.activeCount,
      writtenOff: m.totalWrittenOff,
      defaultedCount: m.defaultedCount
    };
  }, [filteredLoans]);

  // Chart Data
  const chartData = [
    { name: 'Jan', lent: 4000, collected: 2400 },
    { name: 'Feb', lent: 3000, collected: 1398 },
    { name: 'Mar', lent: 2000, collected: 9800 },
    { name: 'Apr', lent: 2780, collected: 3908 },
    { name: 'May', lent: 1890, collected: 4800 },
    { name: 'Jun', lent: 2390, collected: 3800 },
    { name: 'Jul', lent: 3490, collected: 4300 },
  ];

  // Pie Data
  const pieData = [
    { name: 'Active', value: metrics.activeCount, color: '#3b82f6' }, // Brand Blue
    { name: 'Overdue', value: metrics.overdueCount, color: '#f43f5e' }, // Rose
    { name: 'Paid', value: filteredLoans.filter(l => l.status === LoanStatus.PAID).length, color: '#10b981' }, // Emerald
    { name: 'Written Off', value: metrics.defaultedCount, color: '#94a3b8' }, // Slate
  ];
  const totalLoans = filteredLoans.length || 1;
  const paidPercentage = Math.round((filteredLoans.filter(l => l.status === LoanStatus.PAID).length / totalLoans) * 100);

  return (
    <div className="space-y-8" onClick={() => setShowMenu(null)}>
        
      {/* Title Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
        <p className="text-slate-500 mt-1">Monitor your lending performance and cashflow.</p>
      </div>

      {/* Capital Pool */}
      <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-soft relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Available to Lend</p>
              <p className={`text-3xl font-bold tracking-tight ${capital.availableToLend < 0 ? 'text-rose-400' : 'text-white'}`}>
                R{capital.availableToLend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              {startingCapital === 0 && (
                <button onClick={() => navigate('/profile')} className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-1">
                  <SettingsIcon size={12} /> Set your starting capital in Settings
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 lg:border-l lg:border-slate-800 lg:pl-8">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Starting Capital</p>
              <p className="text-lg font-bold text-white mt-0.5">R{startingCapital.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disbursed</p>
              <p className="text-lg font-bold text-white mt-0.5">-R{capital.disbursed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected</p>
              <p className="text-lg font-bold text-white mt-0.5">+R{capital.collected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">R{capital.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              {capital.growthPercent !== null && (
                <p className={`text-[11px] font-semibold mt-0.5 ${capital.growthPercent >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                  {capital.growthPercent >= 0 ? '+' : ''}{capital.growthPercent.toFixed(1)}% since start
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Lent"
          value={`R${metrics.totalLent.toLocaleString()}`}
          badgeValue="20%"
          badgeType="positive"
        />
        <StatCard
          title="Active Loans"
          value={metrics.activeCount}
          badgeValue="5%"
          badgeType="positive"
        />
         <StatCard
          title="Net Profit"
          value={`R${metrics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          badgeValue="12%"
          badgeType="positive"
        />
        <StatCard
          title="Overdue Loans"
          value={metrics.overdueCount}
          badgeValue="2%"
          badgeType="negative"
        />
        <StatCard
          title="Written Off"
          value={`R${metrics.writtenOff.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          badgeValue={`${metrics.defaultedCount}`}
          badgeType="negative"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-2xl shadow-soft border border-slate-100 relative">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Cashflow Overview</h3>
                <p className="text-sm text-slate-500 mt-0.5">Money Lent vs Collected</p>
            </div>
            <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === 'chart1' ? null : 'chart1'); }}
                    className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
                >
                    <MoreHorizontal />
                </button>
                {showMenu === 'chart1' && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-10 py-1">
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2">
                            <RefreshCw size={14} /> Refresh Data
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2">
                            <FileText size={14} /> Export CSV
                        </button>
                    </div>
                )}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                        color: '#1e293b'
                    }} 
                />
                <Bar name="Lent" dataKey="lent" fill="#93c5fd" radius={[6, 6, 6, 6]} barSize={24} />
                <Bar name="Collected" dataKey="collected" fill="#2563eb" radius={[6, 6, 6, 6]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-soft border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Portfolio Health</h3>
            <button className="text-slate-400 hover:text-brand-600 transition-colors"><MoreHorizontal /></button>
          </div>
          
          <div className="h-64 relative flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                        cornerRadius={10}
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-slate-900 tracking-tight">{paidPercentage}%</span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Repaid</span>
             </div>
          </div>

          <div className="flex justify-center space-x-6">
              {pieData.map(item => (
                  <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                      <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Recent Activity List */}
         <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-soft border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Recent Loans</h3>
                <button onClick={() => navigate('/loans')} className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">View All</button>
            </div>
            <div className="space-y-4">
                {filteredLoans.slice(0, 4).map(loan => (
                    <div key={loan.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group border border-transparent hover:border-slate-200" onClick={() => navigate('/loans')}>
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-600 ring-1 ring-slate-100">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">Loan #{loan.id.substring(0,4)}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Due {new Date(loan.dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="block font-bold text-slate-900">R{loan.principal}</span>
                             <span className={`text-xs font-bold ${loan.status === 'OVERDUE' ? 'text-rose-500' : 'text-emerald-500'}`}>{loan.status}</span>
                        </div>
                    </div>
                ))}
                 {filteredLoans.length === 0 && <div className="text-slate-400 text-center py-4 text-sm">No loans found.</div>}
            </div>
         </div>

         {/* Quick Actions / Reminders */}
         <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-soft border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Reminders</h3>
                <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">High Priority</span>
            </div>
            <div className="space-y-3">
                {filteredLoans.filter(l => l.status === LoanStatus.OVERDUE).slice(0, 3).map(loan => (
                     <div key={loan.id} className="flex items-start space-x-3 p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg transition-colors">
                         <div className="mt-1.5">
                             <div className="w-2 h-2 bg-rose-500 rounded-full ring-2 ring-rose-100"></div>
                         </div>
                         <div>
                             <p className="text-sm font-semibold text-slate-800">Collect payment from loan #{loan.id.substring(0,6)}</p>
                             <p className="text-xs text-slate-500 mt-1 font-medium">R{loan.balance.toFixed(2)} overdue since {new Date(loan.dueDate).toLocaleDateString()}</p>
                         </div>
                     </div>
                ))}
                {filteredLoans.filter(l => l.status === LoanStatus.OVERDUE).length === 0 && (
                     <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                         <CheckCircle2 size={32} className="mb-2 text-emerald-300" />
                         <p className="font-medium text-sm">No overdue loans. Great job!</p>
                     </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};