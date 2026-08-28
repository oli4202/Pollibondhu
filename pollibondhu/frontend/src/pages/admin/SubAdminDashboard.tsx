import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2, Users, FileText, CheckSquare, Briefcase, Activity } from 'lucide-react';

export default function SubAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/admin/sub-dashboard-stats')
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

  if (error || !stats || stats.error) {
    return (
      <EmptyState
        icon={<Activity size={40} />}
        title="Dashboard unavailable"
        description={stats?.error || "Could not load dashboard data. Please try refreshing."}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-black text-earth-900 tracking-tight">Sub-Admin Dashboard</h1>
        <p className="text-earth-500 mt-1">
          Managing: <span className="font-bold text-earth-700">{stats.departments}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md shadow-earth-200/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-earth-500 uppercase tracking-wider">Officers</p>
                <p className="text-3xl font-black text-earth-900 mt-2">{stats.officers}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-earth-200/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-earth-500 uppercase tracking-wider">Total Complaints</p>
                <p className="text-3xl font-black text-earth-900 mt-2">{stats.complaints?.total || 0}</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">{stats.complaints?.resolved || 0} resolved</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <CheckSquare size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-earth-200/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-earth-500 uppercase tracking-wider">Applications</p>
                <p className="text-3xl font-black text-earth-900 mt-2">{stats.applications?.total || 0}</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">{stats.applications?.approved || 0} approved</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-earth-200/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-earth-500 uppercase tracking-wider">Active Projects</p>
                <p className="text-3xl font-black text-earth-900 mt-2">{stats.recentProjects?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Briefcase size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card className="border-none shadow-lg shadow-earth-200/40">
          <div className="px-6 py-5 border-b border-earth-100">
            <h2 className="text-lg font-black text-earth-900 flex items-center gap-2">
              <Briefcase size={20} className="text-polli-600" /> Recent Projects
            </h2>
          </div>
          <CardContent className="p-0">
            <ul className="divide-y divide-earth-100">
              {stats.recentProjects?.map((project: any) => (
                <li key={project.project_id} className="p-4 flex items-center justify-between hover:bg-polli-50/30 transition">
                  <div>
                    <p className="font-bold text-earth-900">{project.title}</p>
                    <p className="text-xs text-earth-500 mt-1">Budget: ৳{Number(project.budget).toLocaleString()}</p>
                  </div>
                  <Badge variant={project.status === 'COMPLETED' ? 'success' : 'default'}>{project.status}</Badge>
                </li>
              ))}
              {!stats.recentProjects?.length && (
                <li className="p-8 text-center text-earth-400 font-medium">No projects found.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions / Info */}
        <Card className="border-none shadow-lg shadow-earth-200/40 bg-gradient-to-br from-earth-900 to-earth-800 text-white">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <h3 className="text-2xl font-black mb-2">Department Hub</h3>
            <p className="text-earth-300 text-sm mb-6">
              You are viewing data restricted to your assigned departments. Ensure tasks are being delegated to officers promptly.
            </p>
            <div className="space-y-3">
              <button className="w-full py-3 bg-white text-earth-900 rounded-xl font-bold hover:bg-polli-50 transition">
                Assign Complaints
              </button>
              <button className="w-full py-3 bg-earth-800 border border-earth-700 text-white rounded-xl font-bold hover:bg-earth-700 transition">
                Review Applications
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
