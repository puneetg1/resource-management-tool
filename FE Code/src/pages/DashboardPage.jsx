import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Briefcase, Users, AlertTriangle, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { getDashboardSummary } from '../utils/api';
import { Auth } from '../utils/auth';

// --- Reusable UI Components ---
const KpiCard = ({ title, value, icon, color, onClick }) => (
  <div 
    className={`bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
  </div>
);

const ChartCard = ({ title, data, children }) => (
  <div className="grid grid-rows-[auto_1fr] bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-sm min-h-[500px]">
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">{title}</h4>
    <div className="relative w-full">
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p>No data available.</p></div>
      )}
    </div>
  </div>
);

const SmallChartCard = ({ title, data, children }) => (
  <div className="grid grid-rows-[auto_1fr] bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-sm min-h-[400px]">
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">{title}</h4>
    <div className="relative w-full">
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p>No data available.</p></div>
      )}
    </div>
  </div>
);

// --- Main Dashboard Component ---
export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardSummary();
        setDashboardData(data);
      } catch (err) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (isLoading) { return <Layout><div className="p-8 text-center text-gray-500">Loading dashboard...</div></Layout>; }
  if (error) { return <Layout><div className="p-8 max-w-lg mx-auto text-center"><div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-lg"><AlertTriangle className="mx-auto h-12 w-12 text-red-500" /><h3 className="mt-2 text-xl font-semibold">Failed to Load Dashboard</h3><p className="mt-1 text-sm">{error}</p></div></div></Layout>; }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6'];
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text>);
  };

  const handleBarClick = (data, stream, event) => {
    event.stopPropagation();
    if (data && data.project && stream) {
      window.open(`/records?Project=${encodeURIComponent(data.project)}&Stream=${encodeURIComponent(stream)}`, '_blank');
    }
  };

  const handleChartAreaClick = (data) => {
    if (data && data.activeLabel) {
      const project = data.activeLabel;
      window.open(`/records?Project=${encodeURIComponent(project)}`, '_blank');
    }
  };
  
  // --- FIX 1: UPDATED CLICK HANDLER ---
  const handleExpiringCellClick = (entry) => {
    const name = entry.name;
    let status = '';
    // This now correctly maps the new label to the 'at-risk' filter
    if (name === 'Expired / 0-30 Days') status = 'at-risk';
    if (name === '31-60 Days') status = '31-60';
    if (name === '61-90 Days') status = '61-90';
    if (status) {
      window.open(`/records?expiringStatus=${status}`, '_blank');
    }
  };
  
  // --- FIX 2: NEW FUNCTION FOR BAR COLORS ---
  const getExpiringBarColor = (name) => {
    switch (name) {
      case 'Expired / 0-30 Days':
        return '#ef4444'; // Red for most urgent
      case '31-60 Days':
        return '#f97316'; // Orange for medium urgency
      case '61-90 Days':
        return '#f59e0b'; // Amber for lower urgency
      default:
        return '#6b7280'; // Gray fallback
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time overview as of {new Date().toLocaleDateString()}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Total Headcount" value={dashboardData?.kpis?.totalHeadcount ?? 0} icon={<Users size={24} className="text-blue-600 dark:text-blue-400" />} color="bg-blue-100 dark:bg-blue-900/30" />
          <KpiCard title="Contracts for Review" value={dashboardData?.kpis?.atRiskContracts ?? 0} icon={<AlertTriangle size={24} className="text-red-600 dark:text-red-400" />} color="bg-red-100 dark:bg-red-900/30" onClick={() => window.open('/records?expiringStatus=at-risk', '_blank')} />
          <KpiCard title="Partially Allocated" value={dashboardData?.kpis?.partiallyAllocated ?? 0} icon={<FileText size={24} className="text-amber-600 dark:text-amber-400" />} color="bg-amber-100 dark:bg-amber-900/30" onClick={() => window.open('/records?allocationStatus=partial', '_blank')} />
          <KpiCard title="Active Projects" value={dashboardData?.kpis?.activeProjects ?? 0} icon={<Briefcase size={24} className="text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-100 dark:bg-emerald-900/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 overflow-x-auto">
            <div className="min-w-[1200px]">
              <ChartCard title="Project Stream Distribution" data={dashboardData?.charts?.projectStreamDistribution ?? []}>
                <BarChart data={dashboardData?.charts?.projectStreamDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={25} onClick={handleChartAreaClick} style={{ cursor: 'pointer' }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="project" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg" />
                  <Legend />
                  <Bar dataKey="Backend" name="Backend" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} onClick={(data, index, event) => handleBarClick(data, 'Backend', event)} />
                  <Bar dataKey="Frontend" name="Frontend" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} onClick={(data, index, event) => handleBarClick(data, 'Frontend', event)} />
                  <Bar dataKey="QA" name="QA" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} onClick={(data, index, event) => handleBarClick(data, 'QA', event)} />
                </BarChart>
              </ChartCard>
            </div>
          </div>

          <SmallChartCard title="Headcount by Stream" data={dashboardData?.charts?.headcountByStream ?? []}>
            <PieChart>
              <Pie data={dashboardData?.charts?.headcountByStream ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={<CustomPieLabel />} onClick={(data) => window.open(`/records?Stream=${encodeURIComponent(data.name)}`, '_blank')}>
                {(dashboardData?.charts?.headcountByStream ?? []).map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="focus:outline-none" style={{ cursor: 'pointer' }} />))}
              </Pie>
              <Tooltip wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg" />
              <Legend />
            </PieChart>
          </SmallChartCard>

          <SmallChartCard title="Contracts Expiring Soon" data={dashboardData?.charts?.expiringContractsBreakdown ?? []}>
            <BarChart data={dashboardData?.charts?.expiringContractsBreakdown ?? []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg" />
              <Bar dataKey="value" name="Contracts" radius={[4, 4, 0, 0]}>
                {(dashboardData?.charts?.expiringContractsBreakdown ?? []).map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    // --- FIX 3: USE THE NEW COLOR FUNCTION ---
                    fill={getExpiringBarColor(entry.name)} 
                    onClick={() => handleExpiringCellClick(entry)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </SmallChartCard>

          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col min-h-[400px]">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">Upcoming Renewals (Top 5)</h4>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
              {(dashboardData?.atRiskEmployees ?? []).length > 0 ? (
                dashboardData.atRiskEmployees.map((emp) => (
                  <div key={emp.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{emp.name}</span>
                      <span className={`font-bold ${emp.daysLeft < 0 ? 'text-red-600' : 'text-red-500'}`}>{emp.daysLeft} days</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{emp.project || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"><p>No employees found.</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
