import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: ReactNode;
  iconBg?: string;
  description?: string;
}

export function StatCard({ title, value, change, icon, iconBg = 'bg-primary/10', description }: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  const TrendIcon = change?.trend === 'up' ? TrendingUp : change?.trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="bg-card rounded-xl p-5 shadow-card hover-lift border border-border/50 group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {change && (
              <div className={cn('flex items-center gap-1 text-sm font-medium', trendColors[change.trend])}>
                <TrendIcon className="w-4 h-4" />
                <span>{change.value}</span>
                <span className="text-muted-foreground font-normal">vs last month</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
          iconBg
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
