import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users, Building2, Briefcase, BarChart3, Star, ShieldAlert, Ban, CheckCircle, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setStats(r.data.data || r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        icon={<BarChart3 size={40} />}
        title="Dashboard unavailable"
        description="Could not load dashboard data. Please try refreshing."
      />
    );
  }

  const kpis = [
    { label: 'Total Citizens', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Providers', value: stats.activeProviders || 0, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Escalations', value: stats.pendingEscalations || 0, icon: ShieldAlert, color: 'bg-rose-50 text-rose-600' },
    { label: 'Active Projects', value: stats.activeProjects || 0, icon: Briefcase, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-black text-earth-900 tracking-tight">Super Admin Dashboard</h1>
        <p className="text-earth-500 mt-1">Platform governance, provider management, and escalations.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-lg shadow-earth-200/40">
            <CardContent className="p-6 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <kpi.icon size={64} className={kpi.color.split(' ')[1]} />
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-3xl font-black text-earth-900">{kpi.value.toLocaleString()}</p>
                <p className="text-sm font-bold text-earth-500 uppercase tracking-wider mt-1">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Health */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-earth-900 flex items-center gap-2">
          <Building2 size={24} className="text-polli-600" /> Department Health
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.departmentStats?.map((dept: any) => (
            <Card key={dept.department_id} className="border-none shadow-md shadow-earth-200/30 overflow-hidden">
              <div className="bg-earth-900 text-white px-4 py-2 flex items-center justify-between">
                <h3 className="font-bold text-sm truncate">{dept.name}</h3>
                <Badge className="bg-white/20 hover:bg-white/30 border-none text-[10px]">Active</Badge>
              </div>
              <CardContent className="p-4 grid grid-cols-2 gap-2 text-center divide-x divide-earth-100">
                <div>
                  <p className="text-xl font-black text-earth-900">{dept._count.applications}</p>
                  <p className="text-[10px] font-bold text-earth-500 uppercase mt-1">Apps</p>
                </div>
                <div>
                  <p className="text-xl font-black text-polli-700">{dept._count.projects}</p>
                  <p className="text-[10px] font-bold text-earth-500 uppercase mt-1">Projects</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Budget Overview */}
        <Card className="border-none shadow-xl shadow-earth-200/40">
          <div className="px-6 py-5 border-b border-earth-100">
            <h2 className="text-lg font-black text-earth-900 flex items-center gap-2">
              <Activity size={20} className="text-polli-600" /> Platform Budget Overview
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-earth-500">Total Allocated</span>
                <span className="font-black text-lg text-earth-900">৳{stats.budgetOverview?.totalAllocated?.toLocaleString() || 0}</span>
              </div>
              <div className="w-full bg-earth-100 rounded-full h-3">
                <div 
                  className="bg-polli-600 h-3 rounded-full" 
                  style={{ width: `${(stats.budgetOverview?.totalSpent / (stats.budgetOverview?.totalAllocated || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-earth-500">Spent: ৳{stats.budgetOverview?.totalSpent?.toLocaleString() || 0}</span>
                <span className="font-bold text-emerald-600">Remaining: ৳{stats.budgetOverview?.totalRemaining?.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Drill-down */}
        <Card className="border-none shadow-xl shadow-earth-200/40">
          <div className="px-6 py-5 border-b border-earth-100">
            <h2 className="text-lg font-black text-earth-900 flex items-center gap-2">
              <Activity size={20} className="text-polli-600" /> Location Activity
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-earth-50 rounded-lg">
                <span className="font-bold text-earth-700">Dhaka Division</span>
                <Badge>450 Users</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-earth-50 rounded-lg ml-4">
                <span className="font-bold text-earth-700">Gazipur District</span>
                <Badge variant="success">120 Projects</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-earth-50 rounded-lg ml-8 border-l-2 border-polli-300">
                <span className="font-bold text-earth-700">Sreepur Upazila</span>
                <Badge variant="warning">15 Complaints</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 mt-6">
        {/* Provider Management Grid */}
        <div>
          <Card className="border-none shadow-xl shadow-earth-200/40 h-full flex flex-col">
            <div className="px-6 py-5 border-b border-earth-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-earth-900 flex items-center gap-2">
                  <Building2 size={20} className="text-polli-600" /> Provider Management
                </h2>
                <p className="text-sm text-earth-500">Monitor performance and enforce platform rules</p>
              </div>
              <button className="px-4 py-2 bg-earth-900 text-white rounded-full text-xs font-bold hover:bg-black transition flex items-center gap-2">
                <Activity size={14} /> View Analytics
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-earth-50 text-earth-500 text-xs uppercase tracking-wider border-b border-earth-100">
                    <th className="px-6 py-4 font-bold">Provider</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-center">Completed Apps</th>
                    <th className="px-6 py-4 font-bold text-center">Rating</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-100">
                  {stats.providerPerformance?.map((provider: any) => (
                    <tr key={provider.id} className="hover:bg-polli-50/30 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-earth-900">{provider.name}</p>
                        <p className="text-[10px] uppercase font-bold text-earth-400 mt-1">{provider.role.replace(/_/g, ' ')}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={provider.status === 'Active' ? 'success' : 'danger'}>{provider.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-earth-700">{provider.completedApplications}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-amber-600 bg-amber-50 py-1 px-2 rounded-full w-fit mx-auto">
                          <Star size={12} className="fill-amber-400" /> {provider.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 border border-earth-200 rounded-lg text-xs font-bold hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition flex items-center gap-1 ml-auto">
                          <Ban size={12} /> Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!stats.providerPerformance || stats.providerPerformance.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-earth-400">
                        No providers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
