import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  appointments: {
    id: string;
    patientName: string;
    treatment: string;
    duration: number;
    dentist: string;
    status: 'confirmed' | 'pending' | 'in-progress' | 'completed';
    chair: number;
  }[];
}

const timeSlots: TimeSlot[] = [
  {
    time: '08:00',
    appointments: [
      { id: '1', patientName: 'Sarah Johnson', treatment: 'Root Canal', duration: 60, dentist: 'Dr. Wilson', status: 'completed', chair: 1 }
    ]
  },
  {
    time: '09:00',
    appointments: [
      { id: '2', patientName: 'Michael Chen', treatment: 'Checkup', duration: 30, dentist: 'Dr. Wilson', status: 'in-progress', chair: 1 },
      { id: '3', patientName: 'Emma Davis', treatment: 'Cleaning', duration: 45, dentist: 'Dr. Mitchell', status: 'confirmed', chair: 2 }
    ]
  },
  {
    time: '10:00',
    appointments: [
      { id: '4', patientName: 'James Wilson', treatment: 'Crown Fitting', duration: 45, dentist: 'Dr. Mitchell', status: 'confirmed', chair: 2 }
    ]
  },
  {
    time: '11:00',
    appointments: [
      { id: '5', patientName: 'Olivia Martinez', treatment: 'Consultation', duration: 30, dentist: 'Dr. Wilson', status: 'pending', chair: 1 },
      { id: '6', patientName: 'William Brown', treatment: 'Filling', duration: 45, dentist: 'Dr. Mitchell', status: 'confirmed', chair: 2 }
    ]
  },
  { time: '12:00', appointments: [] },
  {
    time: '13:00',
    appointments: [
      { id: '7', patientName: 'Sophia Garcia', treatment: 'Whitening', duration: 60, dentist: 'Dr. Wilson', status: 'confirmed', chair: 1 }
    ]
  },
  {
    time: '14:00',
    appointments: [
      { id: '8', patientName: 'Daniel Lee', treatment: 'Extraction', duration: 45, dentist: 'Dr. Mitchell', status: 'confirmed', chair: 2 }
    ]
  },
  {
    time: '15:00',
    appointments: [
      { id: '9', patientName: 'Ava Thompson', treatment: 'Orthodontics', duration: 30, dentist: 'Dr. Wilson', status: 'confirmed', chair: 1 }
    ]
  },
  {
    time: '16:00',
    appointments: []
  },
  {
    time: '17:00',
    appointments: [
      { id: '10', patientName: 'Ethan Harris', treatment: 'Checkup', duration: 30, dentist: 'Dr. Wilson', status: 'pending', chair: 1 }
    ]
  }
];

const statusColors = {
  confirmed: 'bg-primary border-primary/30',
  pending: 'bg-warning/20 border-warning/30',
  'in-progress': 'bg-info/20 border-info/30',
  completed: 'bg-muted border-muted',
};

const statusBadgeColors = {
  confirmed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  'in-progress': 'bg-info/10 text-info',
  completed: 'bg-muted text-muted-foreground',
};

function AppointmentsContent() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay() + i);
    return date;
  });

  const stats = [
    { label: 'Total Today', value: '12', color: 'text-foreground' },
    { label: 'Confirmed', value: '8', color: 'text-success' },
    { label: 'Pending', value: '3', color: 'text-warning' },
    { label: 'Completed', value: '1', color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage and schedule patient appointments</p>
        </div>
        <Button className="gradient-primary text-primary-foreground shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="shadow-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Navigation */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => {
                const prev = new Date(currentDate);
                prev.setDate(prev.getDate() - 7);
                setCurrentDate(prev);
              }}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => {
                const next = new Date(currentDate);
                next.setDate(next.getDate() + 7);
                setCurrentDate(next);
              }}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
              <Button variant="outline" size="sm">Day</Button>
              <Button variant="secondary" size="sm">Week</Button>
              <Button variant="outline" size="sm">Month</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Week Days */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <button
                  key={i}
                  className={cn(
                    'p-4 text-center border-r last:border-r-0 hover:bg-muted/50 transition-colors',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-1">{days[date.getDay()]}</p>
                  <p className={cn(
                    'text-lg font-semibold',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}>
                    {date.getDate()}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((slot, slotIndex) => (
              <div 
                key={slot.time} 
                className="flex border-b border-border last:border-b-0 animate-fade-in"
                style={{ animationDelay: `${slotIndex * 30}ms` }}
              >
                <div className="w-20 flex-shrink-0 p-3 text-sm font-medium text-muted-foreground border-r border-border bg-muted/30">
                  {slot.time}
                </div>
                <div className="flex-1 p-2 min-h-[80px]">
                  {slot.appointments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {slot.appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            'flex-1 min-w-[200px] max-w-[300px] p-3 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer group',
                            statusColors[apt.status]
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-background text-foreground text-xs">
                                  {apt.patientName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm text-foreground">{apt.patientName}</p>
                                <p className="text-xs text-muted-foreground">{apt.treatment}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Check In</DropdownMenuItem>
                                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {apt.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {apt.dentist}
                            </span>
                            <Badge className={cn('text-[10px] h-4', statusBadgeColors[apt.status])}>
                              Chair {apt.chair}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Appointments() {
  return (
    <DashboardLayout>
      <AppointmentsContent />
    </DashboardLayout>
  );
}
