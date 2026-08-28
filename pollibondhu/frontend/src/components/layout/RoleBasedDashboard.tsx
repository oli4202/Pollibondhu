import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SubAdminDashboard from '@/pages/admin/SubAdminDashboard';
import OfficerDashboard from '@/pages/admin/OfficerDashboard';
import { Loader2 } from 'lucide-react';

/**
 * Routes users to the correct dashboard based on their role/permissions.
 * Uses the RBAC context from AuthProvider.
 */
export default function RoleBasedDashboard() {
  const { user, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-polli-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check by role (with legacy compatibility)
  const roles = user.roles || [user.role];

  // ADMIN → full admin dashboard
  if (roles.includes('ADMIN') || hasPermission('dashboard.admin.view')) {
    return <AdminDashboard />;
  }

  // Officer → assigned tasks dashboard
  if (roles.includes('OFFICER') || hasPermission('dashboard.officer.view')) {
    return <OfficerDashboard />;
  }

  // Default: redirect to citizen dashboard
  return <Navigate to="/dashboard" replace />;
}
