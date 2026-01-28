import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentCard, Appointment } from './AppointmentCard';
import { ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const appointments: Appointment[] = [
  {
    id: '1',
    patientName: 'Sarah Johnson',
    time: '09:00 AM',
    duration: '45 min',
    treatment: 'Root Canal',
    status: 'confirmed',
    dentist: 'Dr. Wilson'
  },
  {
    id: '2',
    patientName: 'Michael Chen',
    time: '10:00 AM',
    duration: '30 min',
    treatment: 'Checkup',
    status: 'in-progress',
    dentist: 'Dr. Wilson'
  },
  {
    id: '3',
    patientName: 'Emma Davis',
    time: '11:00 AM',
    duration: '60 min',
    treatment: 'Dental Implant',
    status: 'pending',
    dentist: 'Dr. Mitchell'
  },
  {
    id: '4',
    patientName: 'James Wilson',
    time: '02:00 PM',
    duration: '45 min',
    treatment: 'Crown Fitting',
    status: 'confirmed',
    dentist: 'Dr. Mitchell'
  },
];

interface UpcomingAppointmentsProps {
  className?: string;
}

export function UpcomingAppointments({ className }: UpcomingAppointmentsProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>You have 12 appointments today</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.map((appointment, index) => (
          <div 
            key={appointment.id} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <AppointmentCard appointment={appointment} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
