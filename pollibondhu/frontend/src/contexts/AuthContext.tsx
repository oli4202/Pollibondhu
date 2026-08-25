import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/utils/api';
import type { User, Permission } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<void>;
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
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  /**
   * Check if user has a specific permission.
   * Uses the permissions array from the backend RBAC context.
   * Falls back to legacy role-based permissions if no permissions array exists.
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;

    // Check explicit permissions from backend RBAC
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }

    // Check roles array from backend
    if (user.roles && user.roles.length > 0) {
      // SUPER_ADMIN has all permissions
      if (user.roles.includes('SUPER_ADMIN')) return true;
    }

    // Legacy fallback: check role string
    const LEGACY_ROLE_PERMISSIONS: Record<string, Permission[]> = {
      ADMIN: [
        'user.view', 'user.create', 'user.update', 'user.delete',
        'complaint.view', 'complaint.create', 'complaint.assign', 'complaint.update', 'complaint.resolve',
        'application.view', 'application.process', 'application.approve', 'application.reject',
        'budget.view', 'budget.create', 'budget.update', 'budget.approve',
        'dashboard.admin.view', 'dashboard.super.view',
        'message.send', 'message.receive', 'message.group_create',
        'service.view', 'service.create', 'service.update', 'service.delete', 'service.approve',
        'project.view', 'project.create', 'project.update',
        'department.view', 'department.manage_officers',
        'notification.broadcast', 'audit.view',
      ],
      SUPER_ADMIN: [
        'user.view', 'user.create', 'user.update', 'user.delete',
        'role.view', 'role.create', 'role.update', 'role.delete',
        'complaint.view', 'complaint.create', 'complaint.assign', 'complaint.update', 'complaint.resolve',
        'application.view', 'application.process', 'application.approve', 'application.reject',
        'budget.view', 'budget.create', 'budget.update', 'budget.approve',
        'dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view',
        'message.send', 'message.receive', 'message.group_create',
        'service.view', 'service.create', 'service.update', 'service.delete', 'service.approve',
        'project.view', 'project.create', 'project.update',
        'department.view', 'department.create', 'department.update', 'department.manage_officers',
        'notification.broadcast', 'audit.view', 'audit.export', 'settings.view', 'settings.update',
        'agriculture.view', 'agriculture.create', 'agriculture.update',
        'education.view', 'institution.create', 'institution.manage',
        'ngo.view', 'ngo.create', 'ngo.manage',
        'event.view', 'event.create', 'news.view', 'news.create', 'news.publish',
        'waste.view', 'waste.manage', 'waste.zone.manage',
        'emergency.view', 'emergency.manage', 'emergency.contact.manage',
      ],
      SUB_ADMIN: [
        'user.view', 'complaint.view', 'complaint.assign', 'complaint.update', 'complaint.resolve',
        'application.view', 'application.process', 'application.approve', 'application.reject',
        'budget.view', 'budget.create', 'budget.update',
        'dashboard.subadmin.view',
        'message.send', 'message.receive', 'message.group_create',
        'service.view', 'service.create', 'service.update', 'service.approve',
        'project.view', 'project.create', 'project.update',
        'department.view', 'department.update', 'department.manage_officers',
        'notification.broadcast',
        'agriculture.view', 'agriculture.create', 'agriculture.update',
        'education.view', 'institution.manage',
        'ngo.view', 'event.view', 'event.create', 'news.view', 'news.create', 'news.publish',
        'waste.view', 'waste.manage', 'waste.zone.manage',
        'emergency.view', 'emergency.manage',
      ],
      OFFICER: [
        'user.view', 'complaint.view', 'complaint.update',
        'application.view', 'application.process', 'application.approve', 'application.reject',
        'dashboard.officer.view',
        'message.send', 'message.receive', 'message.department_chat',
        'service.view', 'project.view', 'project.update', 'department.view',
        'agriculture.view', 'agriculture.create', 'agriculture.update',
        'education.view', 'event.view', 'event.create', 'news.view',
        'waste.view', 'waste.manage', 'emergency.view', 'emergency.manage',
      ],
      SERVICE_PROVIDER: [
        'service.view', 'service.create', 'service.update', 'service.delete',
        'message.send', 'message.receive', 'dashboard.citizen.view',
      ],
      GOV_SERVICE_PROVIDER: [
        'service.view', 'service.create', 'service.update', 'service.delete',
        'application.view', 'application.process', 'application.approve', 'application.reject',
        'message.send', 'message.receive', 'message.group_create',
        'dashboard.citizen.view', 'notification.broadcast',
      ],
      PROVIDER: [
        'service.view', 'service.create', 'service.update', 'service.delete',
        'message.send', 'message.receive', 'dashboard.citizen.view',
      ],
      NGO_ADMIN: [
        'ngo.view', 'ngo.manage', 'programme.view', 'programme.create', 'programme.enroll',
        'donation.manage', 'message.send', 'message.receive', 'message.group_create',
        'dashboard.citizen.view', 'event.view', 'event.create', 'education.view',
      ],
      INSTITUTION_ADMIN: [
        'institution.view', 'institution.manage', 'course.view', 'course.create', 'course.manage',
        'student.view', 'student.enroll', 'message.send', 'message.receive', 'message.group_create',
        'dashboard.citizen.view', 'education.view',
      ],
      TEACHER: [
        'course.view', 'course.manage', 'student.view',
        'message.send', 'message.receive', 'dashboard.citizen.view', 'education.view',
      ],
      CITIZEN: [
        'complaint.create', 'complaint.view', 'complaint.verify', 'complaint.close',
        'application.view', 'application.create', 'project.view', 'project.feedback',
        'message.send', 'message.receive', 'dashboard.citizen.view',
        'agriculture.view', 'education.view', 'ngo.view', 'programme.enroll',
        'event.view', 'event.attend', 'news.view', 'emergency.view',
        'waste.report', 'ai.chat',
      ],
      USER: [
        'complaint.create', 'complaint.view',
        'application.view', 'message.send', 'message.receive', 'dashboard.citizen.view',
      ],
    };

    const rolePerms = LEGACY_ROLE_PERMISSIONS[user.role] || [];
    return rolePerms.includes(permission);
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
    // Super admin can access everything
    if (user.roles?.includes('SUPER_ADMIN') || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
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
