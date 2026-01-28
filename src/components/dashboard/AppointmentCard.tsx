import { Clock, User, MoreVertical, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Appointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  time: string;
  duration: string;
  treatment: string;
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dentist: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: 'compact' | 'full';
}

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/20', icon: AlertCircle },
  'in-progress': { label: 'In Progress', color: 'bg-info/10 text-info border-info/20', icon: Clock },
  completed: { label: 'Completed', color: 'bg-muted text-muted-foreground border-muted', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export function AppointmentCard({ appointment, variant = 'full' }: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
        <div className="w-1 h-12 rounded-full bg-primary" />
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {appointment.patientName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{appointment.patientName}</p>
          <p className="text-xs text-muted-foreground">{appointment.treatment}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{appointment.time}</p>
          <p className="text-xs text-muted-foreground">{appointment.duration}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {appointment.patientName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{appointment.patientName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> {appointment.dentist}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Reschedule</DropdownMenuItem>
            <DropdownMenuItem>Check In</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className={cn('font-medium', status.color)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {status.label}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {appointment.treatment}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-medium text-foreground">{appointment.time}</span>
          <span>• {appointment.duration}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-primary hover:text-primary hover:bg-primary/10">
          Start Session
        </Button>
      </div>
    </div>
  );
}
