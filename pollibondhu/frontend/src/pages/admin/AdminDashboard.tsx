import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users, Wrench, MessageSquare, TrendingUp, Building2,
  AlertTriangle, Briefcase, Heart, ShieldCheck, DollarSign, BarChart3
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
    { label: 'Total Users', value: stats.totalUsers || stats.total_users || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Services', value: stats.totalServices || stats.total_services || 0, icon: Wrench, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Open Complaints', value: stats.pendingComplaints || stats.open_complaints || 0, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
    { label: 'Active Projects', value: stats.activeProjects || stats.active_projects || 0, icon: Briefcase, color: 'bg-purple-50 text-purple-600' },
  ];

  const secondaryKpis = [
    { label: 'Departments', value: stats.departments || 0, icon: Building2 },
    { label: 'NGOs', value: stats.ngos || stats.ngo_count || 0, icon: Heart },
    { label: 'Villages', value: stats.villages || stats.village_count || 0, icon: ShieldCheck },
    { label: 'Budget (৳)', value: stats.totalBudget ? `${(stats.totalBudget / 1000000).toFixed(1)}M` : '—', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-earth-900">Dashboard</h1>
        <p className="text-sm text-earth-500">Platform overview and key metrics</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500 font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold text-earth-900 mt-1">{kpi.value.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryKpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-earth-100 text-earth-600">
                <kpi.icon size={16} />
              </div>
              <div>
                <p className="text-xs text-earth-500">{kpi.label}</p>
                <p className="text-lg font-bold text-earth-900">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity from API */}
      {stats.recentComplaints && stats.recentComplaints.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-bold text-earth-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Recent Complaints
            </h2>
            <div className="space-y-3">
              {stats.recentComplaints.map((complaint: any, i: number) => (
                <div key={complaint.complaint_id || i} className="flex items-center justify-between rounded-lg border border-earth-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-earth-800">{complaint.title || `Complaint #${complaint.complaint_id}`}</p>
                    <p className="text-xs text-earth-500">{complaint.category} • {complaint.status}</p>
                  </div>
                  <Badge variant={complaint.priority === 'HIGH' || complaint.priority === 'CRITICAL' ? 'danger' : 'default'}>
                    {complaint.priority || complaint.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-earth-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Manage Users', href: '/admin/users', icon: Users },
              { label: 'Services', href: '/admin/services', icon: Wrench },
              { label: 'Departments', href: '/admin/departments', icon: Building2 },
              { label: 'Complaints', href: '/admin/complaints', icon: MessageSquare },
            ].map(action => (
              <a key={action.label} href={action.href}
                className="flex items-center gap-3 rounded-xl border border-earth-200 p-4 hover:border-polli-400 hover:bg-polli-50 transition-colors">
                <action.icon size={18} className="text-polli-600" />
                <span className="text-sm font-medium text-earth-800">{action.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
