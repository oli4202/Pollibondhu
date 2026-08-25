import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle, FileText, MessageSquare, AlertTriangle, Shield, Wrench, Users, Clock, CheckCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/utils/api';

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  IN_APP: { icon: Bell, color: 'text-polli-600 bg-polli-50', label: 'General' },
  APPLICATION: { icon: FileText, color: 'text-green-600 bg-green-50', label: 'Application' },
  COMPLAINT: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', label: 'Complaint' },
  MESSAGE: { icon: MessageSquare, color: 'text-blue-600 bg-blue-50', label: 'Message' },
  SYSTEM: { icon: Shield, color: 'text-purple-600 bg-purple-50', label: 'System' },
  SERVICE: { icon: Wrench, color: 'text-indigo-600 bg-indigo-50', label: 'Service' },
  USER: { icon: Users, color: 'text-cyan-600 bg-cyan-50', label: 'User' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MyNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data;
      const notifs = data.data?.notifications || data.notifications || (Array.isArray(data) ? data : []);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
    } catch { setNotifications([]); }
  }, []);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));

    // SSE connection for live updates
    const token = localStorage.getItem('token');
    const es = new EventSource(
      `${api.defaults.baseURL}/notifications/stream${token ? `?token=${token}` : ''}`,
      { withCredentials: true }
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_notification') {
          setNotifications(prev => [data.notification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        } else if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        }
      } catch {}
    };

    es.onerror = () => { es.close(); };
    eventSourceRef.current = es;

    return () => { es.close(); };
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function markRead(n: Notification) {
    if (n.is_read) return;
    try {
      await api.put(`/notifications/${n.notification_id}/read`);
      setNotifications(prev => prev.map(x => x.notification_id === n.notification_id ? { ...x, is_read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }

  const types = ['all', ...Array.from(new Set(notifications.map(n => n.type)))];
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  return (
    <div className="max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-earth-500 mt-1">
            Live updates on all your actions — applications, complaints, messages, services
            {unreadCount > 0 && <Badge variant="info" className="ml-2">{unreadCount} new</Badge>}
          </p>
        </div>
        {notifications.length > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</Button>
        )}
      </div>

      {/* Type Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              filter === t ? 'bg-polli-700 text-white' : 'border border-earth-200 text-earth-600 hover:bg-polli-50'
            }`}>
            {t === 'all' ? 'All' : typeConfig[t]?.label || t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = typeConfig[n.type] || typeConfig.IN_APP;
            const Icon = config.icon;
            return (
              <Card key={n.notification_id}
                className={`cursor-pointer transition-colors ${!n.is_read ? 'border-polli-200 bg-polli-50/30 hover:bg-polli-50/50' : 'hover:bg-earth-50'}`}
                onClick={() => markRead(n)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${config.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</h3>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-polli-500 shrink-0" />}
                      <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                    </div>
                    <p className="text-xs text-earth-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-earth-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(n.created_at)}
                    </p>
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
