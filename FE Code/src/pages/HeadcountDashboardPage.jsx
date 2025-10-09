import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, Cell, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users } from 'lucide-react';
import Layout from '../components/Layout';
import { getSkillDistribution } from '../utils/api';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#14b8a6'];

const KpiCard = ({ title, value, icon, color, onClick }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-start justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
  </div>
);

const ChartCard = ({ title, data, children }) => (
  <div className="grid grid-rows-[auto_1fr] bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm min-h-[500px]">
    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex-shrink-0">{title}</h4>
    <div className="relative w-full">
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500"><p>No data available.</p></div>
      )}
    </div>
  </div>
);

const SkillChart = ({ streamData }) => {
  if (!streamData) return null;

  const chartData = streamData.skills.sort((a, b) => b.count - a.count);

  const formatXAxisTick = (tick) => {
    if (tick && tick.length > 15) return `${tick.substring(0, 15)}...`;
    return tick;
  };

  return (
    <ChartCard title={`${streamData.stream} Skills Breakdown`} data={chartData}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="name" stroke="#94a3b8" tickFormatter={formatXAxisTick} />
        <YAxis allowDecimals={false} stroke="#94a3b8" />
        <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} wrapperClassName="!border-gray-300 !bg-white/80 !backdrop-blur-sm !rounded-lg" />
        <Bar dataKey="count" name="Headcount">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartCard>
  );
};

export default function HeadcountDashboardPage() {
  const [skillsData, setSkillsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getSkillDistribution();
        const dataByStream = data.reduce((acc, stream) => {
          acc[stream.stream] = stream;
          return acc;
        }, {});
        setSkillsData(dataByStream);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalHeadcounts = useMemo(() => {
    const totals = { Frontend: 0, Backend: 0, QA: 0 };
    for (const streamName in skillsData) {
      if (skillsData[streamName]?.skills) {
        totals[streamName] = skillsData[streamName].skills.reduce((sum, skill) => sum + skill.count, 0);
      }
    }
    return totals;
  }, [skillsData]);
  
  const navigateToStream = (streamName) => {
    window.open(`/records?Stream=${encodeURIComponent(streamName)}`, '_blank');
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Headcount per Skill</h2>
          <p className="text-sm text-gray-500 mt-1">Breakdown of technical skills across major streams.</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>Error: {error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <KpiCard title="Total Frontend" value={totalHeadcounts.Frontend} icon={<Users size={24} className="text-blue-600" />} color="bg-blue-100" onClick={() => navigateToStream('Frontend')}/>
              <KpiCard title="Total Backend" value={totalHeadcounts.Backend} icon={<Users size={24} className="text-emerald-600" />} color="bg-emerald-100" onClick={() => navigateToStream('Backend')}/>
              <KpiCard title="Total QA" value={totalHeadcounts.QA} icon={<Users size={24} className="text-amber-600" />} color="bg-amber-100" onClick={() => navigateToStream('QA')}/>
            </div>
            
            <div className="flex flex-col gap-8">
              <SkillChart streamData={skillsData.Frontend} />
              <SkillChart streamData={skillsData.Backend} />
              <SkillChart streamData={skillsData.QA} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}