import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmptyState } from '@/components/shared/EmptyState';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <EmptyState
        title="Access denied"
        description="You don't have permission to access this module. Please contact the administrator."
        action={{ label: 'Go Home', onClick: () => navigate('/') }}
      />
    </DashboardLayout>
  );
};

export default AccessDenied;
