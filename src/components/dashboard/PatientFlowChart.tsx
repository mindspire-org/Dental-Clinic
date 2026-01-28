import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const data = [
  { day: 'Mon', checkedIn: 28, pending: 5, completed: 24 },
  { day: 'Tue', checkedIn: 32, pending: 8, completed: 29 },
  { day: 'Wed', checkedIn: 25, pending: 3, completed: 23 },
  { day: 'Thu', checkedIn: 35, pending: 6, completed: 31 },
  { day: 'Fri', checkedIn: 30, pending: 4, completed: 27 },
  { day: 'Sat', checkedIn: 18, pending: 2, completed: 16 },
];

interface PatientFlowChartProps {
  className?: string;
}

export function PatientFlowChart({ className }: PatientFlowChartProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Patient Flow</CardTitle>
        <CardDescription>Daily patient check-ins and completions</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Completed"
              />
              <Bar 
                dataKey="pending" 
                fill="hsl(var(--chart-5))" 
                radius={[4, 4, 0, 0]}
                name="Pending"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-5" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
