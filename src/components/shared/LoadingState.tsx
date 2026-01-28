import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingStateProps {
    type?: 'table' | 'cards' | 'form';
    rows?: number;
}

export function LoadingState({ type = 'table', rows = 5 }: LoadingStateProps) {
    if (type === 'table') {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="rounded-lg border">
                    <div className="p-4 space-y-3">
                        {Array.from({ length: rows }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'cards') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (type === 'form') {
        return (
            <div className="space-y-6">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
