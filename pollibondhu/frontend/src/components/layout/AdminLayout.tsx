import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, LayoutDashboard, Users, Wrench, MessageSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import AiChatWidget from '@/components/chat/AiChatWidget';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-earth-900 text-white hidden md:flex flex-col">
        <div className="p-5 border-b border-earth-700">
          <Link to="/" className="flex items-center gap-2 font-bold text-polli-400">
            <Sprout size={22} /> PolliBondhu
          </Link>
          <div className="text-xs text-earth-400 mt-1">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                location.pathname === to ? 'bg-polli-700 text-white' : 'text-earth-300 hover:bg-earth-800'
              )}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-earth-700">
          <div className="text-sm font-medium mb-1">{user?.full_name}</div>
          <div className="text-xs text-earth-400 mb-3">{user?.role}</div>
          <Button size="sm" variant="outline" className="w-full border-earth-600 text-earth-200 hover:bg-earth-800" onClick={handleLogout}>
            <LogOut size={14} className="mr-1" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 bg-earth-100 min-h-screen relative">
        <Outlet />
        <AiChatWidget />
      </main>
    </div>
  );
}
