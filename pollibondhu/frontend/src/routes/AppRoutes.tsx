import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { Permission } from '@/types';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import OfficerLayout from '@/components/layout/OfficerLayout';

// Public Pages
import Home from '@/pages/public/Home';
import AgriculturePage from '@/pages/public/Agriculture';
import ServicesPage from '@/pages/public/Services';
import CommunityPage from '@/pages/public/Community';
import Marketplace from '@/pages/public/Marketplace';
import HealthcarePage from '@/pages/public/Healthcare';
import EducationPage from '@/pages/public/Education';
import EmergencyPage from '@/pages/public/Emergency';
import NewsPage from '@/pages/public/News';
import NGOsPage from '@/pages/public/NGOs';
import PrivacyPolicy from '@/pages/public/PrivacyPolicy';
import TermsOfUse from '@/pages/public/TermsOfUse';
import AccessibilityPage from '@/pages/public/Accessibility';
import RTI from '@/pages/public/RTI';
import HelpCenter from '@/pages/public/HelpCenter';
import ContactUs from '@/pages/public/ContactUs';
import ReportIssue from '@/pages/public/ReportIssue';
import Feedback from '@/pages/public/Feedback';
import LandRecords from '@/pages/public/LandRecords';
import NIDServices from '@/pages/public/NIDServices';
import CommodityDetail from '@/pages/public/CommodityDetail';
import VillageMarket from '@/pages/public/VillageMarket';
import CropDetail from '@/pages/public/CropDetail';
import GovServiceDetail from '@/pages/public/GovServiceDetail';
import HealthcareDetail from '@/pages/public/HealthcareDetail';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// Citizen Pages
import UserDashboard from '@/pages/user/Dashboard';
import ProfilePage from '@/pages/user/Profile';
import MyApplications from '@/pages/user/MyApplications';
import MyComplaints from '@/pages/user/MyComplaints';
import MyMessages from '@/pages/user/MyMessages';
import MyNotifications from '@/pages/user/MyNotifications';

// Provider Pages
import ProviderDashboard from '@/pages/provider/ProviderDashboard';
import ProviderServices from '@/pages/provider/ProviderServices';

// Officer Pages
import OfficerDashboardPage from '@/pages/officer/OfficerDashboard';
import OfficerApplications from '@/pages/officer/OfficerApplications';
import OfficerComplaints from '@/pages/officer/OfficerComplaints';
import OfficerMessages from '@/pages/officer/OfficerMessages';

// Admin Pages
import RoleBasedDashboard from '@/components/layout/RoleBasedDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import ServiceManagement from '@/pages/admin/ServiceManagement';
import ComplaintResolution from '@/pages/admin/ComplaintResolution';
import DepartmentManagement from '@/pages/admin/DepartmentManagement';
import ProjectManagement from '@/pages/admin/ProjectManagement';
import BudgetManagement from '@/pages/admin/BudgetManagement';
import AuditLogs from '@/pages/admin/AuditLogs';
import EndpointViewer from '@/pages/admin/EndpointViewer';

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
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/" replace />;
  if (anyPermission && !hasAnyPermission(...anyPermission)) return <Navigate to="/" replace />;

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ============================================ */}
      {/* PUBLIC ROUTES                                */}
      {/* ============================================ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
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
      <Route element={<Protected anyPermission={['dashboard.citizen.view', 'dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view', 'dashboard.officer.view']}><DashboardLayout /></Protected>}>
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
      <Route path="/provider" element={<Protected anyPermission={['service.create', 'dashboard.citizen.view']}><DashboardLayout /></Protected>}>
        <Route index element={<ProviderDashboard />} />
        <Route path="services" element={<ProviderServices />} />
      </Route>

      {/* ============================================ */}
      {/* OFFICER DASHBOARD                            */}
      {/* ============================================ */}
      <Route element={<Protected anyPermission={['dashboard.officer.view']}><OfficerLayout /></Protected>}>
        <Route path="/officer" element={<OfficerDashboardPage />} />
        <Route path="/officer/applications" element={<OfficerApplications />} />
        <Route path="/officer/complaints" element={<OfficerComplaints />} />
        <Route path="/officer/messages" element={<OfficerMessages />} />
      </Route>

      {/* ============================================ */}
      {/* ADMIN DASHBOARD                              */}
      {/* ============================================ */}
      <Route element={<Protected anyPermission={['dashboard.admin.view', 'dashboard.super.view', 'dashboard.subadmin.view']}><AdminLayout /></Protected>}>
        <Route path="/admin" element={<RoleBasedDashboard />} />
        <Route path="/admin/users" element={<Protected permission="user.view"><UserManagement /></Protected>} />
        <Route path="/admin/services" element={<Protected permission="service.view"><ServiceManagement /></Protected>} />
        <Route path="/admin/complaints" element={<Protected permission="complaint.view"><ComplaintResolution /></Protected>} />
        <Route path="/admin/departments" element={<Protected permission="department.view"><DepartmentManagement /></Protected>} />
        <Route path="/admin/projects" element={<Protected permission="project.view"><ProjectManagement /></Protected>} />
        <Route path="/admin/budgets" element={<Protected permission="budget.view"><BudgetManagement /></Protected>} />
        <Route path="/admin/audit" element={<Protected permission="audit.view"><AuditLogs /></Protected>} />
        <Route path="/admin/endpoints" element={<Protected permission="dashboard.super.view"><EndpointViewer /></Protected>} />
      </Route>
    </Routes>
  );
}
