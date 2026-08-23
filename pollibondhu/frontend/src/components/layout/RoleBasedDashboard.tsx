import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SubAdminDashboard from '@/pages/admin/SubAdminDashboard';
import OfficerDashboard from '@/pages/admin/OfficerDashboard';
import { Loader2 } from 'lucide-react';

export default function RoleBasedDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-polli-600" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SUB_ADMIN':
      return <SubAdminDashboard />;
    case 'OFFICER':
      return <OfficerDashboard />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}
