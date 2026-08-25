import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, FileText, MessageSquare, AlertTriangle, X, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  IN_APP: { icon: Bell, color: 'text-polli-600 bg-polli-50' },
  APPLICATION: { icon: FileText, color: 'text-green-600 bg-green-50' },
  COMPLAINT: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  MESSAGE: { icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  SYSTEM: { icon: CheckCircle, color: 'text-purple-600 bg-purple-50' },
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

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      const data = res.data;
      const notifs = data.data?.notifications || data.notifications || (Array.isArray(data) ? data : []);
      setNotifications(notifs.slice(0, 20));
      setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
    } catch {
      // silently fail
    }
  }, [user]);

  // SSE connection for live updates
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();

    // Connect to SSE
    const token = localStorage.getItem('token');
    const es = new EventSource(
      `${api.defaults.baseURL}/notifications/stream${token ? `?token=${token}` : ''}`,
      { withCredentials: true }
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_notification') {
          setNotifications(prev => [data.notification, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        } else if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Fallback: poll every 15s
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchNotifications, 15000);
      }
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single notification as read
  const markRead = async (n: Notification) => {
    if (n.is_read) return;
    try {
      await api.put(`/notifications/${n.notification_id}/read`);
      setNotifications(prev =>
        prev.map(x => x.notification_id === n.notification_id ? { ...x, is_read: true } : x)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-earth-500 hover:text-earth-800 hover:bg-earth-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-earth-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-earth-100 bg-earth-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-earth-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-polli-100 text-polli-700 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-polli-600 hover:bg-polli-50 rounded-md transition-colors font-medium"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-earth-100 text-earth-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={32} className="mx-auto text-earth-300 mb-2" />
                <p className="text-sm text-earth-400 font-medium">No notifications yet</p>
                <p className="text-xs text-earth-300 mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.IN_APP;
                const Icon = config.icon;
                return (
                  <button
                    key={n.notification_id}
                    onClick={() => {
                      markRead(n);
                      setIsOpen(false);
                      if (n.type === 'APPLICATION') navigate('/dashboard/applications');
                      else if (n.type === 'COMPLAINT') navigate('/dashboard/complaints');
                      else if (n.type === 'MESSAGE') navigate('/dashboard/messages');
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-earth-50 transition-colors border-b border-earth-50 last:border-0 ${
                      !n.is_read ? 'bg-polli-50/30' : ''
                    }`}
                  >
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${config.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-earth-900' : 'font-medium text-earth-700'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-polli-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-earth-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-earth-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-earth-100 bg-earth-50/30">
              <button
                onClick={() => { setIsOpen(false); navigate('/dashboard/notifications'); }}
                className="w-full text-center text-xs font-medium text-polli-600 hover:text-polli-700 transition-colors"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
