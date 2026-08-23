import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/utils/api';
import type { User, Permission, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (...roles: (Role | string)[]) => boolean;
  hasLocationAccess: (locationId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Default permissions per legacy role for backwards compatibility
const LEGACY_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'user.view', 'user.create', 'user.update', 'user.delete',
    'complaint.view', 'complaint.create', 'complaint.assign', 'complaint.update', 'complaint.resolve',
    'application.view', 'application.approve', 'application.reject', 'application.request_document',
    'budget.view', 'budget.create', 'budget.update', 'budget.approve',
    'dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view',
    'message.send', 'message.receive', 'message.group_create',
  ],
  SUPER_ADMIN: [
    'user.view', 'user.create', 'user.update', 'user.delete',
    'complaint.view', 'complaint.create', 'complaint.assign', 'complaint.update', 'complaint.resolve',
    'application.view', 'application.approve', 'application.reject', 'application.request_document',
    'budget.view', 'budget.create', 'budget.update', 'budget.approve',
    'dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view',
    'message.send', 'message.receive', 'message.group_create',
  ],
  SUB_ADMIN: [
    'user.view', 'complaint.view', 'complaint.assign', 'complaint.update', 'complaint.resolve',
    'application.view', 'application.approve', 'application.reject',
    'budget.view', 'dashboard.subadmin.view',
    'message.send', 'message.receive',
  ],
  OFFICER: [
    'user.view', 'complaint.view', 'complaint.update',
    'application.view', 'application.approve', 'application.reject',
    'message.send', 'message.receive',
  ],
  PROVIDER: [
    'complaint.view', 'complaint.update',
    'application.view',
    'message.send', 'message.receive',
  ],
  USER: [
    'complaint.create', 'complaint.view',
    'application.view',
    'message.send', 'message.receive',
  ],
  CITIZEN: [
    'complaint.create', 'complaint.view',
    'application.view',
    'message.send', 'message.receive',
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/users/profile')
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
  }

  async function register(data: { email: string; password: string; full_name: string; phone?: string; role?: string }) {
    const res = await api.post('/auth/register', data);
    const { user: u, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    // Check explicit permissions first
    if (user.permissions?.includes(permission)) return true;
    // Fallback to legacy role-based permissions
    const rolePerms = LEGACY_ROLE_PERMISSIONS[user.role] || [];
    return rolePerms.includes(permission);
  }, [user]);

  const hasRole = useCallback((...roles: (Role | string)[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const hasLocationAccess = useCallback((locationId: string): boolean => {
    if (!user) return false;
    // Super admin can access everything
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;
    // Check location assignments
    if (!user.assignments) return false;
    return user.assignments.some(a => {
      const loc = a.location;
      if (!loc) return false;
      return [loc.district, loc.upazila, loc.union, loc.village, loc.department, loc.service].includes(locationId);
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, hasPermission, hasRole, hasLocationAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * AI Helper hook — enforces the permission engine so AI never bypasses access control.
 * Usage: const { aiQuery } = useAIHelper();
 * aiQuery('Show me all people in the village') → checks permissions first.
 */
export function useAIHelper() {
  const { user, hasPermission, hasLocationAccess } = useAuth();

  const aiQuery = useCallback((query: string, targetLocation?: string): { allowed: boolean; message: string } => {
    if (!user) return { allowed: false, message: 'You must be logged in to use the AI assistant.' };

    // If querying user data
    if (query.toLowerCase().includes('all people') || query.toLowerCase().includes('all users') || query.toLowerCase().includes('all citizens')) {
      if (!hasPermission('user.view')) {
        return { allowed: false, message: `You have access to ${user.assignments?.[0]?.location?.department || 'your assigned'} services only. I can't provide unrelated citizen information.` };
      }
      if (targetLocation && !hasLocationAccess(targetLocation)) {
        return { allowed: false, message: `You don't have access to data from that location. Your access is limited to your assigned areas.` };
      }
    }

    // If querying budget data
    if (query.toLowerCase().includes('budget')) {
      if (!hasPermission('budget.view')) {
        return { allowed: false, message: 'Budget information is restricted. You need explicit budget.view permission.' };
      }
    }

    return { allowed: true, message: 'Query permitted.' };
  }, [user, hasPermission, hasLocationAccess]);

  return { aiQuery };
}
