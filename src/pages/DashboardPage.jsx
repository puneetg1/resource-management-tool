

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
const KpiCard = ({ title, value, icon, color }) => (
  <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
  </div>
);

// This is the robust ChartCard using CSS Grid for a stable layout
const ChartCard = ({ title, data, children }) => (
  <div className="grid grid-rows-[auto_1fr] bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-sm min-h-[500px]">
    {/* The title takes up the first row (auto height) */}
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">{title}</h4>
    
    {/* This container takes up the second row (all remaining space) */}
    <div className="relative w-full">
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p>No data available.</p>
        </div>
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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 max-w-lg mx-auto text-center">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-xl font-semibold">Failed to Load Dashboard</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6'];
  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time overview as of {new Date().toLocaleDateString()}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Total Headcount" value={dashboardData?.kpis?.totalHeadcount ?? 0} icon={<Users size={24} className="text-blue-600 dark:text-blue-400" />} color="bg-blue-100 dark:bg-blue-900/30" />
          <KpiCard title="At-Risk Contracts" value={dashboardData?.kpis?.atRiskContracts ?? 0} icon={<AlertTriangle size={24} className="text-red-600 dark:text-red-400" />} color="bg-red-100 dark:bg-red-900/30" />
          <KpiCard title="Partially Allocated" value={dashboardData?.kpis?.partiallyAllocated ?? 0} icon={<FileText size={24} className="text-amber-600 dark:text-amber-400" />} color="bg-amber-100 dark:bg-amber-900/30" />
          <KpiCard title="Active Projects" value={dashboardData?.kpis?.activeProjects ?? 0} icon={<Briefcase size={24} className="text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-100 dark:bg-emerald-900/30" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="lg:col-span-2">
            <ChartCard title="Project Stream Distribution" data={dashboardData?.charts?.projectStreamDistribution ?? []}>
              <BarChart
                data={dashboardData?.charts?.projectStreamDistribution}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="project" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg"
                />
                <Legend />
                <Bar dataKey="Backend" name="Backend" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Frontend" name="Frontend" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="QA" name="QA" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <ChartCard title="Headcount by Stream" data={dashboardData?.charts?.headcountByStream ?? []}>
            <PieChart>
              <Pie
                data={dashboardData?.charts?.headcountByStream ?? []}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={false}
                label={<CustomPieLabel />}
                onClick={(data) => navigate(`/records?Stream=${encodeURIComponent(data.name)}`)}
              >
                {(dashboardData?.charts?.headcountByStream ?? []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    className="focus:outline-none"
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg" />
              <Legend />
            </PieChart>
          </ChartCard>

          <ChartCard title="Contracts Expiring Soon" data={dashboardData?.charts?.expiringContractsBreakdown ?? []}>
            <BarChart data={dashboardData?.charts?.expiringContractsBreakdown ?? []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} wrapperClassName="!border-gray-300 dark:!border-gray-600 !bg-white/80 dark:!bg-gray-800/80 !backdrop-blur-sm !rounded-lg" />
              <Bar dataKey="value" name="Contracts" radius={[4, 4, 0, 0]}>
                {(dashboardData?.charts?.expiringContractsBreakdown ?? []).map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.name === '0-30 Days' ? '#ef4444' : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col min-h-[400px]">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">At-Risk Employees (Top 5)</h4>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
              {(dashboardData?.atRiskEmployees ?? []).length > 0 ? (
                dashboardData.atRiskEmployees.map((emp) => (
                  <div key={emp.id} className="text-sm p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{emp.name}</span>
                      <span className="font-bold text-red-500">{emp.daysLeft} days</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{emp.project || 'N/A'}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p>No at-risk employees.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}