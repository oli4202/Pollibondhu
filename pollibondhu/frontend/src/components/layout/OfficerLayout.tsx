import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, LayoutDashboard, FileText, AlertTriangle, MessageSquare, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AiChatWidget from '@/components/chat/AiChatWidget';
import NotificationBell from '@/components/notifications/NotificationBell';
import { cn } from '@/utils/cn';
import { useState } from 'react';

const sidebarItems = [
  { to: '/officer', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/officer/applications', label: 'Applications', icon: FileText },
  { to: '/officer/complaints', label: 'Complaints', icon: AlertTriangle },
  { to: '/officer/messages', label: 'Messages', icon: MessageSquare },
  { to: '/officer/citizens', label: 'My Citizens', icon: Users },
];

const mobileNavItems = [
  { to: '/officer', label: 'Home', icon: LayoutDashboard },
  { to: '/officer/applications', label: 'Tasks', icon: FileText },
  { to: '/officer/complaints', label: 'Issues', icon: AlertTriangle },
  { to: '/officer/messages', label: 'Messages', icon: MessageSquare },
];

export default function OfficerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function isActive(to: string) {
    if (to === '/officer') return location.pathname === '/officer';
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen flex bg-earth-50">
      {/* Skip to content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="w-60 bg-white border-r border-earth-200 hidden md:flex flex-col shrink-0">
        <div className="p-4 border-b border-earth-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-polli-700">
            <Sprout size={20} /> PolliBondhu
          </Link>
          <div className="text-xs text-earth-500 mt-1">Officer Panel</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5" aria-label="Officer navigation">
          {sidebarItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(to)
                  ? 'bg-polli-50 text-polli-700'
                  : 'text-earth-600 hover:bg-earth-50 hover:text-earth-800'
              )}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-earth-100">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
              {user?.full_name?.charAt(0) || 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-earth-800 truncate">{user?.full_name}</p>
              <p className="text-xs text-earth-400 truncate">Officer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <NotificationBell />
            <Button size="sm" variant="outline" className="flex-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors" onClick={() => setShowLogoutConfirm(true)}>
              <LogOut size={14} /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-4 md:p-6 pb-20 md:pb-6 relative overflow-auto">
        <Outlet />
        <AiChatWidget />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-earth-200" aria-label="Officer mobile navigation">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-[10px] font-medium min-w-[56px] transition-colors',
                  active
                    ? 'text-polli-700'
                    : 'text-earth-400 hover:text-earth-600'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log out"
        message="Are you sure you want to log out? You will need to log in again to access your account."
        confirmLabel="Log Out"
        cancelLabel="Stay"
        variant="danger"
      />
    </div>
  );
}
