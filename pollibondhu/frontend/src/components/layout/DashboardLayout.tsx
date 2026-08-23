import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sprout, LayoutDashboard, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AiChatWidget from '@/components/chat/AiChatWidget';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-earth-200 hidden md:flex flex-col">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2 font-bold text-polli-700">
            <Sprout size={22} /> PolliBondhu
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-earth-700 hover:bg-polli-50">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link to="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-earth-700 hover:bg-polli-50">
            <User size={16} /> Profile
          </Link>
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm font-medium text-earth-800 mb-1">{user?.full_name}</div>
          <div className="text-xs text-earth-400 mb-3">{user?.email}</div>
          <Button size="sm" variant="outline" className="w-full" onClick={handleLogout}>
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
