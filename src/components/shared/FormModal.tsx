import { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    onSubmit: () => void;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    onSubmit,
    onCancel,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    isLoading = false,
    size = 'md',
}: FormModalProps) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={sizeClasses[size]}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {children}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="gradient-primary"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
