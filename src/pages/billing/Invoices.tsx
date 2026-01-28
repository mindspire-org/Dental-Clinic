import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Plus, Edit, Trash2, DollarSign, Download, Send } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { billingApi } from '@/lib/api';

interface Invoice {
    _id: string;
    invoiceId: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    amount: number;
    balance: number;
    status: string;
    dueDate: string;
    createdAt: string;
}

export default function Invoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await billingApi.getAll();
            setInvoices(response.data.invoices || response.data.billing);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedInvoice) return;
        try {
            await billingApi.delete(selectedInvoice._id);
            setShowDeleteDialog(false);
            fetchInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || colors.draft;
    };

    const columns: ColumnDef<Invoice>[] = [
        {
            accessorKey: 'invoiceId',
            header: 'Invoice #',
            cell: ({ row }) => (
                <div className="font-mono font-medium">{row.original.invoiceId}</div>
            ),
        },
        {
            accessorKey: 'patient',
            header: 'Patient',
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.patient.firstName} {row.original.patient.lastName}
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <div className="font-medium">{formatCurrency(row.original.amount)}</div>
            ),
        },
        {
            accessorKey: 'balance',
            header: 'Balance',
            cell: ({ row }) => (
                <div className={row.original.balance > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                    {formatCurrency(row.original.balance)}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={getStatusColor(row.original.status)}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'dueDate',
            header: 'Due Date',
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.dueDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                        <Send className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(row.original)}
                    >
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <LoadingState type="table" rows={10} />;
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount - inv.balance), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">Manage billing and invoices</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Paid
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {invoices.length === 0 ? (
                        <EmptyState
                            title="No invoices found"
                            description="Get started by creating your first invoice"
                            action={{
                                label: 'Create Invoice',
                                onClick: () => setShowModal(true),
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={invoices}
                            searchKey="invoiceId"
                            searchPlaceholder="Search invoices..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Invoice"
                description={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceId}? This action cannot be undone.`}
            />
        </div>
    );
}
