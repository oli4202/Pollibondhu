import { useState, useEffect } from 'react';
import { Shield, User, Settings, CheckCircle, AlertTriangle, FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { SearchInput } from '@/components/ui/SearchInput';
import api from '@/utils/api';

interface AuditLog {
  log_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  created_at: string;
  admin?: { full_name: string };
}

const actionConfig: Record<string, { icon: any; color: string }> = {
  SERVICE_APPROVED: { icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  SERVICE_REJECTED: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  USER_DEACTIVATED: { icon: User, color: 'text-amber-600 bg-amber-50' },
  ROLE_CHANGED: { icon: Settings, color: 'text-blue-600 bg-blue-50' },
  USER_CREATED: { icon: User, color: 'text-green-600 bg-green-50' },
  COMPLAINT_ASSIGNED: { icon: AlertTriangle, color: 'text-purple-600 bg-purple-50' },
};

function getConfig(action: string) {
  if (actionConfig[action]) return actionConfig[action];
  if (action.includes('CREATE')) return { icon: FileText, color: 'text-green-600 bg-green-50' };
  if (action.includes('UPDATE') || action.includes('CHANGE')) return { icon: Settings, color: 'text-blue-600 bg-blue-50' };
  if (action.includes('DELETE') || action.includes('DEACTIVATE')) return { icon: AlertTriangle, color: 'text-red-600 bg-red-50' };
  return { icon: Eye, color: 'text-gray-600 bg-gray-50' };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then(res => {
        const data = res.data;
        setLogs(data.data || data.logs || (Array.isArray(data) ? data : []));
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    (log.admin?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Logs' }]} />
      
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-earth-500">Track all administrative actions for accountability.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search audit logs..." className="max-w-md" />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Shield size={48} />} title="No audit logs" description="Administrative actions will be recorded here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const config = getConfig(log.action);
            const Icon = config.icon;
            return (
              <Card key={log.log_id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${config.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge>{log.action}</Badge>
                      <span className="text-xs text-earth-400">by {log.admin?.full_name || 'System'}</span>
                    </div>
                    <p className="text-xs text-earth-500 mt-1">
                      {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''} · {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.details && <p className="text-xs text-earth-400 mt-0.5">{log.details}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
