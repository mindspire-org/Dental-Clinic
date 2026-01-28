import { FileQuestion, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon?: 'search' | 'file' | 'plus';
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const icons = {
    search: Search,
    file: FileQuestion,
    plus: Plus,
};

export function EmptyState({
    icon = 'file',
    title,
    description,
    action,
}: EmptyStateProps) {
    const Icon = icons[icon];

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    {action.label}
                </Button>
            )}
        </div>
    );
}
