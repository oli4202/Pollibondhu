import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Briefcase, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import api from '@/utils/api';
import InternalMessaging from '@/components/chat/InternalMessaging';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats specific to this Officer's assignments
    api.get('/admin/officer-dashboard-stats')
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-polli-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Officer Dashboard</h1>
        <p className="text-gray-500">Welcome, {user?.full_name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <Briefcase className="h-4 w-4 text-polli-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Applications</CardTitle>
            <FileText className="h-4 w-4 text-polli-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.applications || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complaints to Resolve</CardTitle>
            <CheckSquare className="h-4 w-4 text-polli-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.complaints || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-polli-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.messages || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-1">
          <InternalMessaging />
        </div>
        <div className="md:col-span-1 bg-white p-4 border border-earth-200 rounded-lg shadow-sm">
           <h3 className="font-semibold mb-4 text-earth-800">Recent Tasks</h3>
           <p className="text-sm text-earth-500">No new tasks assigned yet.</p>
        </div>
      </div>
    </div>
  );
}
