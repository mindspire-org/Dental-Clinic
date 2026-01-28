import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  patientName: string;
  procedures: string[];
  status: 'planned' | 'in-progress' | 'completed';
  totalCost: number;
  paid: number;
  startDate: string;
  nextSession?: string;
  dentist: string;
}

const treatments: Treatment[] = [
  {
    id: 'TP-001',
    patientName: 'Sarah Johnson',
    procedures: ['Root Canal #26', 'Crown Fitting #26', 'Filling #22'],
    status: 'in-progress',
    totalCost: 2850,
    paid: 1500,
    startDate: 'Dec 15, 2024',
    nextSession: 'Jan 28, 2025',
    dentist: 'Dr. Wilson'
  },
  {
    id: 'TP-002',
    patientName: 'Michael Chen',
    procedures: ['Teeth Whitening', 'Cleaning'],
    status: 'planned',
    totalCost: 650,
    paid: 0,
    startDate: 'Feb 05, 2025',
    dentist: 'Dr. Mitchell'
  },
  {
    id: 'TP-003',
    patientName: 'Emma Davis',
    procedures: ['Dental Implant #36', 'Bone Grafting'],
    status: 'in-progress',
    totalCost: 4200,
    paid: 2100,
    startDate: 'Nov 20, 2024',
    nextSession: 'Feb 15, 2025',
    dentist: 'Dr. Wilson'
  },
  {
    id: 'TP-004',
    patientName: 'James Wilson',
    procedures: ['Orthodontic Braces', 'Regular Adjustments'],
    status: 'in-progress',
    totalCost: 5500,
    paid: 3000,
    startDate: 'Oct 10, 2024',
    nextSession: 'Jan 30, 2025',
    dentist: 'Dr. Mitchell'
  },
  {
    id: 'TP-005',
    patientName: 'William Brown',
    procedures: ['Wisdom Tooth Extraction #48'],
    status: 'completed',
    totalCost: 450,
    paid: 450,
    startDate: 'Dec 18, 2024',
    dentist: 'Dr. Wilson'
  },
];

const statusConfig = {
  planned: { label: 'Planned', color: 'bg-info/10 text-info', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-warning/10 text-warning', icon: Clock },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle2 },
};

function TreatmentsContent() {
  const stats = [
    { label: 'Active Plans', value: '24', change: '+3 this week', trend: 'up' },
    { label: 'Completed', value: '156', change: '+12 this month', trend: 'up' },
    { label: 'Revenue Pending', value: '$18,450', change: 'From 24 plans', trend: 'neutral' },
    { label: 'Avg. Plan Value', value: '$1,890', change: '+5.2%', trend: 'up' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treatment Plans</h1>
          <p className="text-muted-foreground">Manage patient treatment plans and procedures</p>
        </div>
        <Button className="gradient-primary text-primary-foreground shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          New Treatment Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="shadow-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className={cn(
                'text-xs mt-1',
                stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'
              )}>{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Treatment Plans List */}
      <div className="grid gap-4">
        {treatments.map((treatment, index) => {
          const status = statusConfig[treatment.status];
          const StatusIcon = status.icon;
          const paymentProgress = (treatment.paid / treatment.totalCost) * 100;

          return (
            <Card 
              key={treatment.id} 
              className="shadow-card hover:shadow-lg transition-all cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Patient & Treatment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{treatment.patientName}</h3>
                      <Badge className={cn('font-medium', status.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{treatment.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {treatment.procedures.map((proc, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {proc}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Started: {treatment.startDate}</span>
                      {treatment.nextSession && (
                        <span className="text-primary font-medium">Next: {treatment.nextSession}</span>
                      )}
                      <span>{treatment.dentist}</span>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="lg:w-64">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Payment Progress</span>
                      <span className="text-sm font-medium">
                        ${treatment.paid.toLocaleString()} / ${treatment.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          paymentProgress === 100 ? 'bg-success' : 'bg-primary'
                        )}
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentProgress === 100 ? 'Fully paid' : `${Math.round(paymentProgress)}% paid`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4 mr-1" /> Details
                    </Button>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Treatments() {
  return (
    <DashboardLayout>
      <TreatmentsContent />
    </DashboardLayout>
  );
}
