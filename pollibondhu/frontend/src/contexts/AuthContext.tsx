import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/utils/api';
import type { User, Permission } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<User>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
  hasRole: (...roles: (string)[]) => boolean;
  hasLocationAccess: (locationId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile with RBAC context on mount
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
    return u;
  }

  async function register(data: { email: string; password: string; full_name: string; phone?: string; role?: string }) {
    const res = await api.post('/auth/register', data);
    const { user: u, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  /**
   * Check if user has a specific permission.
   * Uses the permissions array from the backend RBAC context.
   * ADMIN role bypasses all permission checks.
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;

    // ADMIN has all permissions
    if (user.roles?.includes('ADMIN') || user.role === 'ADMIN') return true;

    // Check explicit permissions from backend RBAC
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    // Check roles array from backend
    if (user.roles && user.roles.length > 0) {
      return false; // No legacy fallback — use database RBAC
    }

    return false;
  }, [user]);

  /**
   * Check if user has ANY of the specified permissions.
   */
  const hasAnyPermission = useCallback((...permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  /**
   * Check if user has any of the specified roles.
   */
  const hasRole = useCallback((...roles: string[]): boolean => {
    if (!user) return false;
    // Check roles array from backend
    if (user.roles && user.roles.length > 0) {
      return roles.some((r) => user!.roles!.includes(r));
    }
    // Fallback to single role
    return roles.includes(user.role);
  }, [user]);

  /**
   * Check if user has access to a specific location.
   */
  const hasLocationAccess = useCallback((locationId: string): boolean => {
    if (!user) return false;
    // Admin can access everything
    if (user.roles?.includes('ADMIN') || user.role === 'ADMIN') return true;
    // Check location assignments
    if (!user.assignments) return false;
    return user.assignments.some(a => {
      const loc = a.location;
      if (!loc) return false;
      return [loc.district, loc.upazila, loc.union, loc.village, loc.department, loc.service].includes(locationId);
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, hasPermission, hasAnyPermission, hasRole, hasLocationAccess }}>
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
 */
export function useAIHelper() {
  const { user, hasPermission, hasLocationAccess } = useAuth();

  const aiQuery = useCallback((query: string, targetLocation?: string): { allowed: boolean; message: string } => {
    if (!user) return { allowed: false, message: 'You must be logged in to use the AI assistant.' };

    if (query.toLowerCase().includes('all people') || query.toLowerCase().includes('all users') || query.toLowerCase().includes('all citizens')) {
      if (!hasPermission('user.view')) {
        return { allowed: false, message: `You have access to ${user.assignments?.[0]?.location?.department || 'your assigned'} services only.` };
      }
      if (targetLocation && !hasLocationAccess(targetLocation)) {
        return { allowed: false, message: `You don't have access to data from that location.` };
      }
    }

    if (query.toLowerCase().includes('budget')) {
      if (!hasPermission('budget.view')) {
        return { allowed: false, message: 'Budget information is restricted. You need budget.view permission.' };
      }
    }

    return { allowed: true, message: 'Query permitted.' };
  }, [user, hasPermission, hasLocationAccess]);

  return { aiQuery } as const;
}
