import { useState } from 'react';
import { Layers, Activity, CalendarDays, PackageCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [stats] = useState({ totalMaterials: 142, totalWeight: 3450, todayEntries: 12, totalFinished: 45 });

  const barData = [
    { name: 'Mon', AL: 400, SS: 240 },
    { name: 'Tue', AL: 300, SS: 139 },
    { name: 'Wed', AL: 200, SS: 980 },
    { name: 'Thu', AL: 278, SS: 390 },
    { name: 'Fri', AL: 189, SS: 480 },
    { name: 'Sat', AL: 239, SS: 380 },
    { name: 'Sun', AL: 349, SS: 430 },
  ];

  const pieData = [
    { name: 'Aluminum', value: 400 },
    { name: 'Stainless Steel', value: 300 },
    { name: 'Copper', value: 300 },
    { name: 'Brass', value: 200 },
  ];
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  const kpis = [
    { label: 'Total Materials', value: stats.totalMaterials, icon: Layers, cls: 'indigo' },
    { label: 'Total Weight (Kg)', value: stats.totalWeight.toLocaleString(), icon: Activity, cls: 'emerald' },
    { label: "Today's Entries", value: stats.todayEntries, icon: CalendarDays, cls: 'amber' },
    { label: 'Finished Goods', value: stats.totalFinished, icon: PackageCheck, cls: 'pink' },
  ];

  const tooltipStyle = {
    contentStyle: {
      background: '#161b27', border: '1px solid #1e2635', borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#e2e8f0', fontSize: '0.8rem',
    },
    cursor: { fill: 'rgba(99,102,241,0.05)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Overview</h1>
          <p className="page-subtitle">Inventory performance summary</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        {kpis.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="kpi-card">
            <div className={`kpi-icon ${cls}`}><Icon size={19} /></div>
            <div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>

        {/* Bar Chart */}
        <div className="rm-card" style={{ padding: '1.5rem', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#cbd5e1' }}>Material Usage Trends</div>
            <div style={{ fontSize: '0.72rem', color: '#374151', marginTop: '0.2rem' }}>Weekly breakdown by material type</div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2035" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} dx={-4} />
                <RechartsTooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: '14px', fontSize: '0.78rem', color: '#64748b' }} iconType="circle" />
                <Bar dataKey="AL" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <Bar dataKey="SS" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rm-card" style={{ padding: '1.5rem', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#cbd5e1' }}>Material Distribution</div>
            <div style={{ fontSize: '0.72rem', color: '#374151', marginTop: '0.2rem' }}>Stock composition by type</div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={72} outerRadius={108} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip {...tooltipStyle} cursor={false} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '12px', fontSize: '0.78rem', color: '#64748b' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
