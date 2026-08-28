import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Route pages are loaded on demand to keep the initial application bundle small.
const Home = lazy(() => import('@/pages/public/Home'));
const AgriculturePage = lazy(() => import('@/pages/public/Agriculture'));
const ServicesPage = lazy(() => import('@/pages/public/Services'));
const CommunityPage = lazy(() => import('@/pages/public/Community'));
const Marketplace = lazy(() => import('@/pages/public/Marketplace'));
const HealthcarePage = lazy(() => import('@/pages/public/Healthcare'));
const EducationPage = lazy(() => import('@/pages/public/Education'));
const EmergencyPage = lazy(() => import('@/pages/public/Emergency'));
const NewsPage = lazy(() => import('@/pages/public/News'));
const NGOsPage = lazy(() => import('@/pages/public/NGOs'));
const PrivacyPolicy = lazy(() => import('@/pages/public/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('@/pages/public/TermsOfUse'));
const AccessibilityPage = lazy(() => import('@/pages/public/Accessibility'));
const RTI = lazy(() => import('@/pages/public/RTI'));
const HelpCenter = lazy(() => import('@/pages/public/HelpCenter'));
const ContactUs = lazy(() => import('@/pages/public/ContactUs'));
const ReportIssue = lazy(() => import('@/pages/public/ReportIssue'));
const Feedback = lazy(() => import('@/pages/public/Feedback'));
const LandRecords = lazy(() => import('@/pages/public/LandRecords'));
const NIDServices = lazy(() => import('@/pages/public/NIDServices'));
const CommodityDetail = lazy(() => import('@/pages/public/CommodityDetail'));
const VillageMarket = lazy(() => import('@/pages/public/VillageMarket'));
const CropDetail = lazy(() => import('@/pages/public/CropDetail'));
const GovServiceDetail = lazy(() => import('@/pages/public/GovServiceDetail'));
const HealthcareDetail = lazy(() => import('@/pages/public/HealthcareDetail'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const UserDashboard = lazy(() => import('@/pages/user/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/user/Profile'));
const MyApplications = lazy(() => import('@/pages/user/MyApplications'));
const MyComplaints = lazy(() => import('@/pages/user/MyComplaints'));
const MyMessages = lazy(() => import('@/pages/user/MyMessages'));
const MyNotifications = lazy(() => import('@/pages/user/MyNotifications'));
const ProviderDashboard = lazy(() => import('@/pages/provider/ProviderDashboard'));
const ProviderProfile = lazy(() => import('@/pages/provider/ProviderProfile'));
const ProviderServices = lazy(() => import('@/pages/provider/ProviderServices'));
const ProviderMessages = lazy(() => import('@/pages/provider/ProviderMessages'));
const ProviderComplaints = lazy(() => import('@/pages/provider/ProviderComplaints'));
const ProviderApplications = lazy(() => import('@/pages/provider/ProviderApplications'));
const RoleBasedDashboard = lazy(() => import('@/components/layout/RoleBasedDashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ServiceManagement = lazy(() => import('@/pages/admin/ServiceManagement'));
const ComplaintResolution = lazy(() => import('@/pages/admin/ComplaintResolution'));
const DepartmentManagement = lazy(() => import('@/pages/admin/DepartmentManagement'));
const ProjectManagement = lazy(() => import('@/pages/admin/ProjectManagement'));
const BudgetManagement = lazy(() => import('@/pages/admin/BudgetManagement'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const EndpointViewer = lazy(() => import('@/pages/admin/EndpointViewer'));

/**
 * Protected route wrapper with permission-based access control.
 */
function Protected({
  children,
  roles,
  permission,
  anyPermission,
}: {
  children: JSX.Element;
  roles?: string[];
  permission?: Permission;
  anyPermission?: Permission[];
}) {
  const { user, isLoading, hasPermission, hasAnyPermission, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-polli-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  let allowed = false;
  let hasChecks = false;

  if (roles) {
    hasChecks = true;
    if (hasRole(...roles)) allowed = true;
  }
  if (permission) {
    hasChecks = true;
    if (hasPermission(permission)) allowed = true;
  }
  if (anyPermission) {
    hasChecks = true;
    if (hasAnyPermission(...anyPermission)) allowed = true;
  }

  if (hasChecks && !allowed) return <Navigate to="/" replace />;

  return children;
}

function RootRedirect() {
  const { user, isLoading, hasRole, hasAnyPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-polli-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  // Admin routing
  if (hasAnyPermission('dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view')) {
    return <Navigate to="/admin" replace />;
  }
  // Provider routing
  if (hasRole('PROVIDER', 'SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER')) {
    return <Navigate to="/provider" replace />;
  }
  
  // Default to citizen dashboard
  return <Navigate to="/dashboard" replace />;
}


export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-polli-500 border-t-transparent" /></div>}>
    <Routes>
      {/* ============================================ */}
      {/* PUBLIC ROUTES                                */}
      {/* ============================================ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/agriculture" element={<AgriculturePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/commodity/:name" element={<CommodityDetail />} />
        <Route path="/village-market" element={<VillageMarket />} />
        <Route path="/healthcare" element={<HealthcarePage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/ngos" element={<NGOsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/rti" element={<RTI />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/land-records" element={<LandRecords />} />
        <Route path="/nid-services" element={<NIDServices />} />
        <Route path="/crop/:name" element={<CropDetail />} />
        <Route path="/gov-service/:service" element={<GovServiceDetail />} />
        <Route path="/health/:service" element={<HealthcareDetail />} />
      </Route>

      {/* ============================================ */}
      {/* CITIZEN DASHBOARD                            */}
      {/* ============================================ */}
      <Route element={<Protected roles={['USER', 'FARMER', 'CITIZEN']} anyPermission={['dashboard.citizen.view', 'dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view', 'dashboard.officer.view']}><DashboardLayout /></Protected>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/applications" element={<MyApplications />} />
        <Route path="/dashboard/complaints" element={<MyComplaints />} />
        <Route path="/dashboard/messages" element={<MyMessages />} />
        <Route path="/dashboard/notifications" element={<MyNotifications />} />
      </Route>

      {/* ============================================ */}
      {/* PROVIDER DASHBOARD                           */}
      {/* ============================================ */}
      <Route path="/provider" element={<Protected roles={['PROVIDER', 'SERVICE_PROVIDER', 'GOV_SERVICE_PROVIDER', 'ADMIN']}><DashboardLayout /></Protected>}>
        <Route index element={<ProviderDashboard />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="applications" element={<ProviderApplications />} />
        <Route path="services" element={<ProviderServices />} />
        <Route path="messages" element={<ProviderMessages />} />
        <Route path="complaints" element={<ProviderComplaints />} />
      </Route>

      {/* ============================================ */}
      {/* ADMIN DASHBOARD                              */}
      {/* ============================================ */}
      <Route element={<Protected anyPermission={['dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view']}><AdminLayout /></Protected>}>
        <Route path="/admin" element={<RoleBasedDashboard />} />
        <Route path="/admin/users" element={<Protected permission="user.view"><UserManagement /></Protected>} />
        <Route path="/admin/services" element={<Protected permission="service.view"><ServiceManagement /></Protected>} />
        <Route path="/admin/departments" element={<Protected permission="department.view"><DepartmentManagement /></Protected>} />
        <Route path="/admin/projects" element={<Protected permission="project.view"><ProjectManagement /></Protected>} />
        <Route path="/admin/budgets" element={<Protected permission="budget.view"><BudgetManagement /></Protected>} />
        <Route path="/admin/audit" element={<Protected permission="audit.view"><AuditLogs /></Protected>} />
        <Route path="/admin/endpoints" element={<Protected permission="dashboard.super.view"><EndpointViewer /></Protected>} />
      </Route>
    </Routes>
    </Suspense>
  );
}
