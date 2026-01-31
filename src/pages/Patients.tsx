import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PatientList from './patients/PatientList';

export default function Patients() {
    return (
        <DashboardLayout>
            <PatientList />
        </DashboardLayout>
    );
}
