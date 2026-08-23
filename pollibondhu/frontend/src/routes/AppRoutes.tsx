import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import Home from '@/pages/public/Home';
import AgriculturePage from '@/pages/public/Agriculture';
import ServicesPage from '@/pages/public/Services';
import CommunityPage from '@/pages/public/Community';
import Marketplace from '@/pages/public/Marketplace';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import UserDashboard from '@/pages/user/Dashboard';
import ProfilePage from '@/pages/user/Profile';
import ProviderDashboard from '@/pages/provider/ProviderDashboard';
import RoleBasedDashboard from '@/components/layout/RoleBasedDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import ServiceManagement from '@/pages/admin/ServiceManagement';
import ComplaintResolution from '@/pages/admin/ComplaintResolution';

function Protected({ children, roles, permission }: { children: JSX.Element; roles?: string[]; permission?: Permission }) {
  const { user, isLoading, hasPermission } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/agriculture" element={<AgriculturePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Protected><UserDashboard /></Protected>} />
        <Route path="/dashboard/profile" element={<Protected><ProfilePage /></Protected>} />
      </Route>
      <Route path="/provider" element={<Protected roles={['PROVIDER']}><DashboardLayout /></Protected>}>
        <Route index element={<ProviderDashboard />} />
      </Route>
      <Route element={<Protected roles={['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN', 'OFFICER']} permission="dashboard.admin.view"><AdminLayout /></Protected>}>
        <Route path="/admin" element={<RoleBasedDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/complaints" element={<ComplaintResolution />} />
      </Route>
    </Routes>
  );
}
