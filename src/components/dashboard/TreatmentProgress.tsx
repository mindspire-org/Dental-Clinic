import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  name: string;
  count: number;
  total: number;
  color: string;
}

const treatments: Treatment[] = [
  { id: '1', name: 'Root Canal', count: 45, total: 60, color: 'bg-primary' },
  { id: '2', name: 'Dental Implants', count: 32, total: 50, color: 'bg-accent' },
  { id: '3', name: 'Teeth Whitening', count: 78, total: 100, color: 'bg-chart-3' },
  { id: '4', name: 'Orthodontics', count: 23, total: 40, color: 'bg-chart-4' },
  { id: '5', name: 'Crowns & Bridges', count: 56, total: 80, color: 'bg-chart-5' },
];

interface TreatmentProgressProps {
  className?: string;
}

export function TreatmentProgress({ className }: TreatmentProgressProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Treatment Progress</CardTitle>
        <CardDescription>Monthly treatment completions by category</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {treatments.map((treatment) => {
          const percentage = Math.round((treatment.count / treatment.total) * 100);
          return (
            <div key={treatment.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{treatment.name}</span>
                <span className="text-muted-foreground">
                  {treatment.count}/{treatment.total} <span className="text-xs">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn('h-full rounded-full transition-all duration-500', treatment.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
