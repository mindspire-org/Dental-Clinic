import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RoleProvider } from "./contexts/RoleContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import NewPatient from "./pages/patients/NewPatient";
import PatientRecords from "./pages/patients/PatientRecords";
import Appointments from "./pages/Appointments";
import Schedule from "./pages/appointments/Schedule";
import WaitingList from "./pages/appointments/WaitingList";
import DentalChart from "./pages/DentalChart";
import Treatments from "./pages/Treatments";
import Procedures from "./pages/treatments/Procedures";
import History from "./pages/treatments/History";
import Billing from "./pages/Billing";
import Payments from "./pages/billing/Payments";
import Insurance from "./pages/billing/Insurance";
import Prescriptions from "./pages/Prescriptions";
import PrescriptionList from "./pages/prescriptions/PrescriptionList";
import LabWork from "./pages/LabWork";
import LabWorkList from "./pages/labwork/LabWorkList";
import Inventory from "./pages/Inventory";
import Stock from "./pages/inventory/Stock";
import Orders from "./pages/inventory/Orders";
import Suppliers from "./pages/inventory/Suppliers";
import Staff from "./pages/Staff";
import StaffList from "./pages/staff/StaffList";
import Reports from "./pages/Reports";
import ClinicalReports from "./pages/reports/ClinicalReports";
import PerformanceReports from "./pages/reports/PerformanceReports";
import Documents from "./pages/Documents";
import DocumentList from "./pages/documents/DocumentList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />

            {/* Patients */}
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<NewPatient />} />
            <Route path="/patients/records" element={<PatientRecords />} />

            {/* Appointments */}
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/schedule" element={<Schedule />} />
            <Route path="/appointments/waiting" element={<WaitingList />} />

            <Route path="/dental-chart" element={<DentalChart />} />

            {/* Treatments */}
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/treatments/procedures" element={<Procedures />} />
            <Route path="/treatments/history" element={<History />} />

            {/* Billing */}
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/payments" element={<Payments />} />
            <Route path="/billing/insurance" element={<Insurance />} />

            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/prescriptions/list" element={<PrescriptionList />} />
            <Route path="/lab-work" element={<LabWork />} />
            <Route path="/lab-work/list" element={<LabWorkList />} />

            {/* Inventory */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/stock" element={<Stock />} />
            <Route path="/inventory/orders" element={<Orders />} />
            <Route path="/inventory/suppliers" element={<Suppliers />} />

            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/list" element={<StaffList />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/clinical" element={<ClinicalReports />} />
            <Route path="/reports/performance" element={<PerformanceReports />} />

            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/list" element={<DocumentList />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
