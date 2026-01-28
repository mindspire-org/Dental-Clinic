import { UserPlus, CalendarPlus, FileText, CreditCard, Stethoscope, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const actions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'New Patient',
    description: 'Register patient',
    color: 'text-primary',
    bgColor: 'bg-primary/10 hover:bg-primary/20'
  },
  {
    icon: CalendarPlus,
    label: 'Appointment',
    description: 'Schedule visit',
    color: 'text-accent',
    bgColor: 'bg-accent/10 hover:bg-accent/20'
  },
  {
    icon: Stethoscope,
    label: 'Treatment',
    description: 'Start treatment',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10 hover:bg-chart-3/20'
  },
  {
    icon: FileText,
    label: 'Prescription',
    description: 'Write Rx',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10 hover:bg-chart-4/20'
  },
  {
    icon: FlaskConical,
    label: 'Lab Order',
    description: 'Request lab work',
    color: 'text-warning',
    bgColor: 'bg-warning/10 hover:bg-warning/20'
  },
  {
    icon: CreditCard,
    label: 'Invoice',
    description: 'Create bill',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10 hover:bg-chart-5/20'
  },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3', className)}>
      {actions.map((action, index) => (
        <button
          key={action.label}
          className={cn(
            'group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover-lift border border-transparent hover:border-border',
            action.bgColor,
            'animate-fade-in'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center bg-card shadow-sm transition-transform group-hover:scale-110',
          )}>
            <action.icon className={cn('w-5 h-5', action.color)} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
