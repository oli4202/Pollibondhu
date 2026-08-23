import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Users, Wrench, MessageSquare, Clock, TrendingUp, Building2, MapPin,
  AlertTriangle, Briefcase, GraduationCap, Heart, ShieldCheck, ChevronRight,
  DollarSign, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const MOCK_KPI = {
  totalUsers: 25430, villages: 48, services: 132, govOrgs: 36,
  ngos: 27, businesses: 1850, openComplaints: 146, activeProjects: 72,
  pendingApplications: 318, emergencyCases: 4, totalBudget: 28500000, spent: 19200000,
};

const DEPT_STATS = [
  { name: 'Agriculture', users: 8420, color: '#14b8a6', icon: '🌾' },
  { name: 'Education', users: 6210, color: '#6366f1', icon: '🎓' },
  { name: 'Health', users: 4830, color: '#f43f5e', icon: '🏥' },
  { name: 'Land', users: 3120, color: '#f59e0b', icon: '🗺️' },
  { name: 'Social', users: 2850, color: '#8b5cf6', icon: '🤝' },
];

const PIE_DATA = [
  { name: 'Agriculture', value: 35, color: '#14b8a6' },
  { name: 'Education', value: 25, color: '#6366f1' },
  { name: 'Health', value: 20, color: '#f43f5e' },
  { name: 'Land', value: 12, color: '#f59e0b' },
  { name: 'Other', value: 8, color: '#94a3b8' },
];

const WEEKLY_MOCK = [
  { week: 'W1', users: 380, services: 45, complaints: 22 },
  { week: 'W2', users: 420, services: 52, complaints: 18 },
  { week: 'W3', users: 510, services: 68, complaints: 31 },
  { week: 'W4', users: 490, services: 61, complaints: 24 },
  { week: 'W5', users: 580, services: 74, complaints: 19 },
  { week: 'W6', users: 620, services: 82, complaints: 27 },
];

const EMERGENCIES = [
  { id: 1, title: 'Flood warning — Harinathpur Union', severity: 'Critical', time: '2 hours ago' },
  { id: 2, title: 'Dengue outbreak — Ward 3, 12 new cases', severity: 'High', time: '5 hours ago' },
  { id: 3, title: 'Road damage — Dakshinpara-Bazaar road', severity: 'Medium', time: '1 day ago' },
  { id: 4, title: 'Water supply contamination — Ward 7', severity: 'Critical', time: '3 hours ago' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drillLevel, setDrillLevel] = useState(0);
  const drillLabels = ['District', 'Upazila', 'Union', 'Village', 'Department', 'Service'];
  const drillValues = ['Rajshahi', 'Godagari', 'Rishikul', 'Harinathpur', 'Agriculture', 'Horticulture'];

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').then((r) => setStats(r.data.data)).catch(() => setStats(MOCK_KPI)),
      api.get('/admin/dashboard/weekly').then((r) => setWeekly(r.data.data || [])).catch(() => setWeekly(WEEKLY_MOCK)),
    ]).finally(() => setLoading(false));
  }, []);

  const s = stats || MOCK_KPI;
  const w = weekly.length ? weekly : WEEKLY_MOCK;
  const remaining = s.totalBudget - s.spent;
  const budgetPct = Math.round((s.spent / s.totalBudget) * 100);

  if (loading) return <div className="flex items-center justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>;

  const kpis = [
    { label: 'Total Citizens', value: s.totalUsers?.toLocaleString(), icon: Users, color: 'bg-teal-50 text-teal-600', change: '+12%', up: true },
    { label: 'Villages', value: s.villages, icon: MapPin, color: 'bg-sky-50 text-sky-600' },
    { label: 'Active Services', value: s.services, icon: Wrench, color: 'bg-indigo-50 text-indigo-600', change: '+8', up: true },
    { label: 'Gov. Organisations', value: s.govOrgs, icon: Building2, color: 'bg-violet-50 text-violet-600' },
    { label: 'NGOs', value: s.ngos, icon: Heart, color: 'bg-rose-50 text-rose-600' },
    { label: 'Businesses', value: s.businesses?.toLocaleString(), icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
    { label: 'Open Complaints', value: s.openComplaints, icon: MessageSquare, color: 'bg-orange-50 text-orange-600', change: '-5%', up: false },
    { label: 'Active Projects', value: s.activeProjects, icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Applications', value: s.pendingApplications, icon: Clock, color: 'bg-cyan-50 text-cyan-600', change: '+23', up: true },
    { label: 'Emergency Cases', value: s.emergencyCases, icon: AlertTriangle, color: 'bg-red-50 text-red-600', change: 'Active', up: false },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-earth-900">👑 Super Admin Command Center</h1>
          <p className="text-sm text-earth-500 mt-1">Full platform overview · Role: <span className="font-semibold text-teal-600">Super Admin</span></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-earth-500">System healthy · Last sync 2 min ago</span>
        </div>
      </div>

      {/* Emergency Alert Banner */}
      {s.emergencyCases > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <b className="text-sm text-red-800">⚠️ {s.emergencyCases} active emergency case{s.emergencyCases > 1 ? 's' : ''}</b>
            <div className="mt-2 space-y-1.5">
              {EMERGENCIES.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${e.severity === 'Critical' ? 'bg-red-500' : e.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <span className="text-red-800 font-medium">{e.title}</span>
                  <span className="text-red-400 ml-auto">{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${k.color}`}><k.icon size={18} /></div>
                {k.change && (
                  <span className={`flex items-center gap-0.5 text-[11px] font-bold ${k.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {k.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {k.change}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-earth-900">{k.value}</p>
              <p className="text-[11px] text-earth-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drill-Down Location Filter */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin size={18} className="text-teal-600" /> Location Drill-Down</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-earth-500 mb-4">Navigate the hierarchy: District → Upazila → Union → Village → Department → Service</p>
          <div className="flex flex-wrap gap-2 items-center">
            {drillLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <button
                  onClick={() => setDrillLevel(i)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    i <= drillLevel
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-earth-100 text-earth-400 cursor-not-allowed'
                  }`}
                  disabled={i > drillLevel + 1}
                >
                  {i <= drillLevel ? drillValues[i] : label}
                </button>
                {i < drillLabels.length - 1 && <ChevronRight size={14} className="text-earth-300" />}
              </div>
            ))}
          </div>
          {drillLevel < drillLabels.length - 1 && (
            <button
              onClick={() => setDrillLevel(d => Math.min(d + 1, drillLabels.length - 1))}
              className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              Drill into {drillLabels[drillLevel + 1]} →
            </button>
          )}
        </CardContent>
      </Card>

      {/* Budget Overview */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign size={18} className="text-teal-600" /> Budget Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-earth-500 uppercase tracking-wide">Total Budget</p>
              <p className="text-2xl font-bold text-earth-900 mt-1">৳{(s.totalBudget / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-earth-500 uppercase tracking-wide">Spent</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">৳{(s.spent / 1_000_000).toFixed(1)}M</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-earth-500 uppercase tracking-wide">Remaining</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">৳{(remaining / 1_000_000).toFixed(1)}M</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs text-earth-500 mb-1.5">
              <span>Utilization</span>
              <span className="font-bold">{budgetPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-earth-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Services by Department</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-earth-600">{d.name}</span>
                  <span className="ml-auto font-bold">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={w}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#14b8a6" strokeWidth={2.5} dot={{ fill: '#14b8a6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Services & Complaints</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={w}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="services" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="complaints" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Stats */}
      <Card>
        <CardHeader><CardTitle className="text-base">Department Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEPT_STATS.map(dept => (
              <div key={dept.name} className="flex items-center gap-4">
                <span className="text-2xl w-8 text-center">{dept.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-earth-800">{dept.name}</span>
                    <span className="text-earth-500">{dept.users.toLocaleString()} users</span>
                  </div>
                  <div className="h-2 rounded-full bg-earth-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(dept.users / 8420) * 100}%`, backgroundColor: dept.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RBAC Structure Visual */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck size={18} className="text-teal-600" /> Access Control Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4 text-center">
            {[
              { role: '👑 Super Admin', desc: 'Full system access', count: 1, accent: 'border-teal-200 bg-teal-50' },
              { role: '🏢 Sub-Admin', desc: 'Department-level', count: 12, accent: 'border-indigo-200 bg-indigo-50' },
              { role: '👨‍💼 Officer', desc: 'Service-assigned', count: 86, accent: 'border-amber-200 bg-amber-50' },
              { role: '👤 Citizen', desc: 'Personal data only', count: s.totalUsers?.toLocaleString() || '25,430', accent: 'border-slate-200 bg-slate-50' },
            ].map(r => (
              <div key={r.role} className={`rounded-xl border p-4 ${r.accent}`}>
                <p className="text-lg font-bold">{r.role}</p>
                <p className="text-xs text-earth-500 mt-1">{r.desc}</p>
                <p className="text-xl font-bold text-earth-800 mt-3">{r.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

