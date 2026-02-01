import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { RoleProvider } from "./contexts/RoleContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import NewPatient from "./pages/patients/NewPatient";
import PatientRecords from "./pages/patients/PatientRecords";
import AppointmentCalendar from "./pages/appointments/AppointmentCalendar";
import Schedule from "./pages/appointments/Schedule";
import WaitingList from "./pages/appointments/WaitingList";
import DentalChart from "./pages/DentalChart";
import Treatments from "./pages/Treatments";
import Procedures from "./pages/treatments/Procedures";
import History from "./pages/treatments/History";
import TreatmentPlanDetails from "./pages/treatments/TreatmentPlanDetails";
import Payments from "./pages/billing/Payments";
import Insurance from "./pages/billing/Insurance";
import CheckupBilling from "./pages/billing/CheckupBilling";
import ProcedureBilling from "./pages/billing/ProcedureBilling";
import LabBilling from "./pages/billing/LabBilling";
import PrescriptionBilling from "./pages/billing/PrescriptionBilling";
import Expenses from "./pages/billing/Expenses";
import PrescriptionList from "./pages/prescriptions/PrescriptionList";
import LabWorkList from "./pages/labwork/LabWorkList";
import Inventory from "./pages/Inventory";
import Stock from "./pages/inventory/Stock";
import Orders from "./pages/inventory/Orders";
import Suppliers from "./pages/inventory/Suppliers";
import StaffList from "./pages/staff/StaffList";
import RoleManagement from "./pages/staff/RoleManagement";
import DentistList from "./pages/dentists/DentistList";
import Reports from "./pages/Reports";
import ClinicalReports from "./pages/reports/ClinicalReports";
import PerformanceReports from "./pages/reports/PerformanceReports";
import Documents from "./pages/Documents";
import DocumentList from "./pages/documents/DocumentList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import OwnerLogin from "./pages/OwnerLogin";
import License from "./pages/License";
import AccessDenied from "./pages/AccessDenied";
import { useRole } from "./contexts/RoleContext";
import { authApi } from "./lib/api";

const queryClient = new QueryClient();

const GlobalHotkeys = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        navigate('/owner-login');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  return null;
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { authRole, license, resetAuth } = useRole();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;

  if (authRole !== 'superadmin' && !license?.isActive) {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    resetAuth();
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RequireModule = ({ moduleKey, children }: { moduleKey: string; children: JSX.Element }) => {
  const { authRole, license, permissions, setAuth, resetAuth } = useRole();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const me = await authApi.getMe();
        const u = me?.data?.user;
        const lic = me?.data?.license;

        if (u?.role) {
          setAuth({
            role: u.role,
            userName: `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || undefined,
            permissions: u?.permissions || [],
            license: lic,
          });
        }
      } catch {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        resetAuth();
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resetAuth, setAuth, token]);

  if (!token) return <Navigate to="/login" replace />;
  if (checking) return null;

  if (authRole !== 'superadmin' && !license?.isActive) {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    resetAuth();
    return <Navigate to="/login" replace />;
  }

  if (authRole !== 'superadmin' && Array.isArray(license?.enabledModules) && license.enabledModules.length && !license.enabledModules.includes(moduleKey)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (authRole !== 'superadmin' && !permissions.includes(moduleKey)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

const RequireSuperadmin = ({ children }: { children: JSX.Element }) => {
  const { authRole, setAuth, resetAuth } = useRole();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const me = await authApi.getMe();
        const u = me?.data?.user;
        const lic = me?.data?.license;
        if (u?.role) {
          setAuth({
            role: u.role,
            userName: `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || undefined,
            permissions: u?.permissions || [],
            license: lic,
          });
        }
      } catch {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        resetAuth();
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resetAuth, setAuth, token]);

  if (!token) return <Navigate to="/owner-login" replace />;
  if (checking) return null;
  if (authRole !== 'superadmin') return <Navigate to="/" replace />;
  return children;
};

const Router = typeof window !== 'undefined' && window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <GlobalHotkeys />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/owner-login" element={<OwnerLogin />} />
            <Route path="/access-denied" element={<RequireAuth><AccessDenied /></RequireAuth>} />
            <Route path="/license" element={<RequireSuperadmin><License /></RequireSuperadmin>} />
            <Route path="/" element={<RequireModule moduleKey="dashboard"><Index /></RequireModule>} />

            {/* Patients */}
            <Route path="/patients" element={<RequireModule moduleKey="patients"><Patients /></RequireModule>} />
            <Route path="/patients/new" element={<RequireModule moduleKey="patients"><NewPatient /></RequireModule>} />
            <Route path="/patients/records" element={<RequireModule moduleKey="patients"><PatientRecords /></RequireModule>} />

            {/* Appointments */}
            <Route path="/appointments" element={<RequireModule moduleKey="appointments"><AppointmentCalendar /></RequireModule>} />
            <Route path="/appointments/schedule" element={<RequireModule moduleKey="appointments"><Schedule /></RequireModule>} />
            <Route path="/appointments/waiting" element={<RequireModule moduleKey="appointments"><WaitingList /></RequireModule>} />

            <Route path="/dental-chart" element={<RequireModule moduleKey="dental-chart"><DentalChart /></RequireModule>} />

            {/* Treatments */}
            <Route path="/treatments" element={<RequireModule moduleKey="treatments"><Treatments /></RequireModule>} />
            <Route path="/treatments/procedures" element={<RequireModule moduleKey="treatments"><Procedures /></RequireModule>} />
            <Route path="/treatments/history" element={<RequireModule moduleKey="treatments"><History /></RequireModule>} />
            <Route path="/treatments/:id" element={<RequireModule moduleKey="treatments"><TreatmentPlanDetails /></RequireModule>} />

            {/* Billing */}
            <Route path="/billing" element={<RequireModule moduleKey="billing"><CheckupBilling /></RequireModule>} />
            <Route path="/billing/checkup" element={<RequireModule moduleKey="billing"><CheckupBilling /></RequireModule>} />
            <Route path="/billing/payments" element={<RequireModule moduleKey="billing"><Payments /></RequireModule>} />
            <Route path="/billing/insurance" element={<RequireModule moduleKey="billing"><Insurance /></RequireModule>} />
            <Route path="/billing/checkup" element={<RequireModule moduleKey="billing"><CheckupBilling /></RequireModule>} />
            <Route path="/billing/procedure" element={<RequireModule moduleKey="billing"><ProcedureBilling /></RequireModule>} />
            <Route path="/billing/lab" element={<RequireModule moduleKey="billing"><LabBilling /></RequireModule>} />
            <Route path="/billing/prescription" element={<RequireModule moduleKey="billing"><PrescriptionBilling /></RequireModule>} />
            <Route path="/billing/expenses" element={<RequireModule moduleKey="billing"><Expenses /></RequireModule>} />

            <Route path="/prescriptions" element={<RequireModule moduleKey="prescriptions"><PrescriptionList /></RequireModule>} />
            <Route path="/prescriptions/list" element={<RequireModule moduleKey="prescriptions"><PrescriptionList /></RequireModule>} />
            <Route path="/lab-work" element={<RequireModule moduleKey="lab-work"><LabWorkList /></RequireModule>} />
            <Route path="/lab-work/list" element={<RequireModule moduleKey="lab-work"><LabWorkList /></RequireModule>} />

            {/* Inventory */}
            <Route path="/inventory" element={<RequireModule moduleKey="inventory"><Inventory /></RequireModule>} />
            <Route path="/inventory/stock" element={<RequireModule moduleKey="inventory"><Stock /></RequireModule>} />
            <Route path="/inventory/orders" element={<RequireModule moduleKey="inventory"><Orders /></RequireModule>} />
            <Route path="/inventory/suppliers" element={<RequireModule moduleKey="inventory"><Suppliers /></RequireModule>} />

            <Route path="/staff" element={<RequireModule moduleKey="staff"><StaffList /></RequireModule>} />
            <Route path="/staff/list" element={<RequireModule moduleKey="staff"><StaffList /></RequireModule>} />
            <Route path="/staff/role-management" element={<RequireModule moduleKey="staff"><RoleManagement /></RequireModule>} />

            <Route path="/dentists" element={<RequireModule moduleKey="dentists"><DentistList /></RequireModule>} />

            {/* Reports */}
            <Route path="/reports" element={<RequireModule moduleKey="reports"><Reports /></RequireModule>} />
            <Route path="/reports/clinical" element={<RequireModule moduleKey="reports"><ClinicalReports /></RequireModule>} />
            <Route path="/reports/performance" element={<RequireModule moduleKey="reports"><PerformanceReports /></RequireModule>} />

            <Route path="/documents" element={<RequireModule moduleKey="documents"><Documents /></RequireModule>} />
            <Route path="/documents/list" element={<RequireModule moduleKey="documents"><Documents /></RequireModule>} />

            <Route path="/settings" element={<RequireModule moduleKey="settings"><Settings /></RequireModule>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
