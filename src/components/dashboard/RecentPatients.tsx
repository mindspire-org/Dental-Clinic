import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: 'active' | 'scheduled' | 'overdue';
  treatments: string[];
}

const patients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    lastVisit: '2 days ago',
    status: 'active',
    treatments: ['Root Canal', 'Crown']
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '+1 (555) 234-5678',
    lastVisit: '1 week ago',
    status: 'scheduled',
    treatments: ['Cleaning']
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.d@email.com',
    phone: '+1 (555) 345-6789',
    lastVisit: '3 weeks ago',
    status: 'overdue',
    treatments: ['Checkup']
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'jwilson@email.com',
    phone: '+1 (555) 456-7890',
    lastVisit: '1 day ago',
    status: 'active',
    treatments: ['Implant', 'Whitening']
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-success/10 text-success' },
  scheduled: { label: 'Scheduled', color: 'bg-info/10 text-info' },
  overdue: { label: 'Overdue', color: 'bg-destructive/10 text-destructive' },
};

interface RecentPatientsProps {
  className?: string;
}

export function RecentPatients({ className }: RecentPatientsProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Patients</CardTitle>
            <CardDescription>Patients from the last 30 days</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {patients.map((patient, index) => (
            <div
              key={patient.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{patient.name}</p>
                  <Badge className={cn('text-xs', statusConfig[patient.status].color)}>
                    {statusConfig[patient.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {patient.treatments.join(' • ')}
                </p>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Last visit</p>
                <p className="text-sm font-medium text-foreground">{patient.lastVisit}</p>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
