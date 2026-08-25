import { Briefcase, FileText, AlertTriangle, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { label: 'Assigned Tasks', value: 12, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
  { label: 'Pending Applications', value: 8, icon: FileText, color: 'bg-amber-50 text-amber-600' },
  { label: 'Open Complaints', value: 5, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { label: 'Unread Messages', value: 3, icon: MessageSquare, color: 'bg-violet-50 text-violet-600' },
];

const recentTasks = [
  { title: 'Process birth certificate application', status: 'IN_PROGRESS', due: 'Tomorrow' },
  { title: 'Review land records request', status: 'SUBMITTED', due: 'Jan 20' },
  { title: 'Investigate road damage complaint', status: 'ASSIGNED', due: 'Jan 22' },
];

export default function OfficerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Officer Dashboard' }]} />
      
      <div>
        <h1 className="text-2xl font-bold">Officer Dashboard</h1>
        <p className="text-sm text-earth-500">Welcome, {user?.full_name}. Here are your assigned tasks.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500 font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-earth-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${s.color}`}>
                <s.icon size={20} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={18} className="text-polli-600" /> Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((t) => (
              <div key={t.title} className="flex items-center justify-between py-2 border-b border-earth-100 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-earth-300" />
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-earth-400">Due: {t.due}</p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
