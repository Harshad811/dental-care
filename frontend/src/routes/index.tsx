import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import AppLayout from "@/components/layout/app-layout";
import Login from "@/pages/auth/login";
import SuperAdminDashboard from "@/pages/dashboard/super-admin";
import GroupAdminDashboard from "@/pages/dashboard/group-admin";
import HospitalAdminDashboard from "@/pages/dashboard/hospital-admin";
import DoctorDashboard from "@/pages/dashboard/doctor";
import AdminGroups from "@/pages/admin/groups";
import AdminHospitals from "@/pages/admin/hospitals";
import PatientList from "@/pages/patients/list";
import PatientDetail from "@/pages/patients/detail";
import CaseList from "@/pages/cases/list";
import CaseDetail from "@/pages/cases/detail";
import AppointmentList from "@/pages/appointments/list";
import ConsultantList from "@/pages/consultants/list";
import TreatmentList from "@/pages/treatments/list";
import BillingList from "@/pages/billing/list";
import WhatsAppMessaging from "@/pages/whatsapp/messaging";
import Settings from "@/pages/settings/profile";

function DashboardRedirect() {
  const { user } = useAuthStore();
  if (!user) return null;
  const map: Record<string, string> = {
    SUPER_ADMIN: "/super-admin",
    GROUP_ADMIN: "/group-admin",
    HOSPITAL_ADMIN: "/hospital-admin",
    DOCTOR: "/doctor",
  };
  return <Navigate to={map[user.role] || "/doctor"} replace />;
}

function ProtectedLayout() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function PublicRoute() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  if (!_hasHydrated) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { element: <PublicRoute />, children: [
    { path: "/login", element: <Login /> },
  ]},
  { element: <ProtectedLayout />, children: [
    { index: true, element: <DashboardRedirect /> },
    { path: "/super-admin", element: <SuperAdminDashboard /> },
    { path: "/group-admin", element: <GroupAdminDashboard /> },
    { path: "/hospital-admin", element: <HospitalAdminDashboard /> },
    { path: "/doctor", element: <DoctorDashboard /> },
    { path: "/admin/groups", element: <AdminGroups /> },
    { path: "/admin/hospitals", element: <AdminHospitals /> },
    { path: "/patients", element: <PatientList /> },
    { path: "/patients/:id", element: <PatientDetail /> },
    { path: "/appointments", element: <AppointmentList /> },
    { path: "/consultants", element: <ConsultantList /> },
    { path: "/billing", element: <BillingList /> },
    { path: "/whatsapp", element: <WhatsAppMessaging /> },
    { path: "/cases", element: <CaseList /> },
    { path: "/cases/:id", element: <CaseDetail /> },
    { path: "/treatments", element: <TreatmentList /> },
    { path: "/settings", element: <Settings /> },
    { path: "*", element: <Navigate to="/" replace /> },
  ]},
]);
