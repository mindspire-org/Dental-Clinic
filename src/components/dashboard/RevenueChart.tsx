import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const data = [
  { month: 'Jan', revenue: 42000, appointments: 180 },
  { month: 'Feb', revenue: 38000, appointments: 165 },
  { month: 'Mar', revenue: 52000, appointments: 210 },
  { month: 'Apr', revenue: 48000, appointments: 195 },
  { month: 'May', revenue: 61000, appointments: 240 },
  { month: 'Jun', revenue: 55000, appointments: 220 },
  { month: 'Jul', revenue: 67000, appointments: 265 },
];

interface RevenueChartProps {
  className?: string;
}

export function RevenueChart({ className }: RevenueChartProps) {
  return (
    <Card className={cn('shadow-card', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue and appointment trends</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 text-xs">7D</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs">1M</Button>
            <Button variant="secondary" size="sm" className="h-8 text-xs">6M</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs">1Y</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)'
                }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Appointments'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
