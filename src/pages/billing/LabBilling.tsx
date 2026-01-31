import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import InvoiceReceipt from '../../components/billing/InvoiceReceipt';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, Eye, FlaskConical, FileText, Printer } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { billingApi } from '@/lib/api';

interface LabWork {
    _id: string;
    patient: {
        firstName: string;
        lastName: string;
        phone?: string;
    };
    dentist: {
        firstName: string;
        lastName: string;
    };
    labName: string;
    workType: string;
    description: string;
    requestDate: string;
    completedDate?: string;
    trackingNumber?: string;
    cost?: number;
    status: string;
    invoice?: any;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    total: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    items: any[];
}

export default function LabBilling() {
    const [labWork, setLabWork] = useState<LabWork[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedLabWork, setSelectedLabWork] = useState<LabWork | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'labwork' | 'invoices'>('labwork');
    const [receiptAutoPrint, setReceiptAutoPrint] = useState(false);

    const [formData, setFormData] = useState({
        labCost: '',
        notes: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        paidAmount: '',
    });

    useEffect(() => {
        fetchLabWork();
        fetchInvoices();
    }, []);

    const fetchLabWork = async () => {
        try {
            setLoading(true);
            const response = await billingApi.getLabWorkForBilling();
            const allLabWork = response?.data?.labWork || [];
            // Filter out lab work that already has invoices
            setLabWork(allLabWork.filter((l: LabWork) => !l.invoice));
        } catch (error) {
            console.error('Error fetching lab work:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await billingApi.getAll({ invoiceType: 'lab' });
            const bills = response?.data?.bills || response?.data?.invoices || [];
            setInvoices(bills.filter((b: any) => b.invoiceType === 'lab'));
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleCreateBill = (labwork: LabWork) => {
        setSelectedLabWork(labwork);
        setSelectedInvoice(null);

        setFormData({
            labCost: String(labwork.cost || 0),
            notes: `${labwork.workType} - ${labwork.labName} - ${labwork.description}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            paidAmount: '',
        });
        setShowModal(true);
    };

    const handleEditInvoice = async (invoice: Invoice) => {
        try {
            const resp = await billingApi.getById(invoice._id);
            const bill = resp?.data?.bill || invoice;

            setSelectedInvoice(invoice);
            setSelectedLabWork(null);
            setFormData({
                labCost: String(bill?.items?.[0]?.unitPrice ?? bill?.total ?? ''),
                notes: String(bill?.notes || bill?.items?.[0]?.description || ''),
                dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : '',
                paidAmount: String(bill?.paidAmount || ''),
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading invoice details:', error);
        }
    };

    const handleDelete = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedInvoice) return;
        try {
            await billingApi.deleteLabInvoice(selectedInvoice._id);
            setShowDeleteDialog(false);
            setActiveTab('invoices');
            fetchLabWork();
            fetchInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);

            if (selectedInvoice) {
                // Update existing invoice
                await billingApi.updateLabInvoice(selectedInvoice._id, {
                    labCost: Number(formData.labCost),
                    notes: formData.notes,
                    dueDate: formData.dueDate,
                    paidAmount: formData.paidAmount ? Number(formData.paidAmount) : undefined,
                });
            } else if (selectedLabWork) {
                // Create new invoice
                await billingApi.createLabInvoice({
                    labWorkId: selectedLabWork._id,
                    labCost: Number(formData.labCost),
                    notes: formData.notes,
                    dueDate: formData.dueDate,
                    paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
                });
            }

            setShowModal(false);
            setActiveTab('invoices');
            fetchLabWork();
            fetchInvoices();
        } catch (error) {
            console.error('Error saving invoice:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleViewReceipt = async (invoice: Invoice, opts?: { autoPrint?: boolean }) => {
        try {
            const response = await billingApi.getLabReceipt(invoice._id);
            setReceiptData(response?.data?.receipt);
            setReceiptAutoPrint(Boolean(opts?.autoPrint));
            setShowReceipt(true);
        } catch (error) {
            console.error('Error loading receipt:', error);
        }
    };

    const handleQuickPrintInvoice = async (invoice: Invoice) => {
        await handleViewReceipt(invoice, { autoPrint: true });
    };

    const handlePrintReceipt = async () => {
        if (!receiptData) return;
        try {
            await billingApi.markPrinted(receiptData.invoice._id);
        } catch (error) {
            console.error('Error marking invoice as printed:', error);
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
            pending: 'bg-yellow-100 text-yellow-800',
            'partially-paid': 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const labWorkColumns: ColumnDef<LabWork>[] = [
        {
            accessorKey: 'patient',
            header: 'Patient',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">
                        {row.original.patient.firstName} {row.original.patient.lastName}
                    </p>
                    {row.original.patient.phone && (
                        <p className="text-xs text-muted-foreground">{row.original.patient.phone}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'workType',
            header: 'Work Type',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.workType}</p>
                    <p className="text-xs text-muted-foreground">{row.original.labName}</p>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <div className="max-w-xs truncate" title={row.original.description}>
                    {row.original.description}
                </div>
            ),
        },
        {
            accessorKey: 'trackingNumber',
            header: 'Tracking #',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.trackingNumber || 'N/A'}</span>
            ),
        },
        {
            accessorKey: 'completedDate',
            header: 'Completed',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.completedDate
                        ? new Date(row.original.completedDate).toLocaleDateString()
                        : 'Pending'}
                </span>
            ),
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            cell: ({ row }) => (
                <div className="font-medium">{formatCurrency(row.original.cost || 0)}</div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button size="sm" onClick={() => handleCreateBill(row.original)} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Bill
                </Button>
            ),
        },
    ];

    const invoiceColumns: ColumnDef<Invoice>[] = [
        {
            accessorKey: 'invoiceNumber',
            header: 'Invoice #',
            cell: ({ row }) => (
                <div className="font-mono font-medium">{row.original.invoiceNumber}</div>
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
            accessorKey: 'total',
            header: 'Amount',
            cell: ({ row }) => (
                <div className="font-medium">{formatCurrency(row.original.total)}</div>
            ),
        },
        {
            accessorKey: 'paidAmount',
            header: 'Paid',
            cell: ({ row }) => (
                <div className="text-green-600">{formatCurrency(row.original.paidAmount)}</div>
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
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewReceipt(row.original)}
                        title="View Receipt"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleQuickPrintInvoice(row.original)}
                        title="Print Invoice"
                    >
                        <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditInvoice(row.original)}
                    >
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
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Lab Billing</h1>
                        <p className="text-muted-foreground">Create invoices for completed lab work</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('labwork')}
                            className={cn(
                                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'labwork'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            )}
                        >
                            <FlaskConical className="w-4 h-4 inline mr-2" />
                            Unbilled Lab Work ({labWork.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={cn(
                                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'invoices'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            )}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Invoices ({invoices.length})
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <Card className="shadow-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            {activeTab === 'labwork' ? 'Completed Lab Work' : 'Lab Invoices'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {activeTab === 'labwork' ? (
                            labWork.length === 0 ? (
                                <div className="rounded-xl border bg-muted/20">
                                    <EmptyState
                                        icon="file"
                                        title="No lab work ready"
                                        description="Completed lab work will appear here for billing."
                                    />
                                </div>
                            ) : (
                                <DataTable
                                    columns={labWorkColumns}
                                    data={labWork}
                                    searchKey="patient.firstName"
                                    searchPlaceholder="Search patients..."
                                />
                            )
                        ) : (
                            invoices.length === 0 ? (
                                <div className="rounded-xl border bg-muted/20">
                                    <EmptyState
                                        icon="file"
                                        title="No invoices yet"
                                        description="Create bills from completed lab work."
                                    />
                                </div>
                            ) : (
                                <DataTable
                                    columns={invoiceColumns}
                                    data={invoices}
                                    searchKey="invoiceNumber"
                                    searchPlaceholder="Search invoices..."
                                />
                            )
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Modal */}
                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedInvoice ? 'Edit Lab Invoice' : 'Create Lab Invoice'}
                    onSubmit={handleSubmit}
                    submitLabel={selectedInvoice ? 'Update Invoice' : 'Create Invoice'}
                    isLoading={saving}
                >
                    <div className="space-y-4">
                        {selectedLabWork && (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Patient:</span>
                                    <span className="font-medium">
                                        {selectedLabWork.patient.firstName} {selectedLabWork.patient.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Lab:</span>
                                    <span className="font-medium">{selectedLabWork.labName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Work Type:</span>
                                    <span className="font-medium">{selectedLabWork.workType}</span>
                                </div>
                                {selectedLabWork.trackingNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Tracking #:</span>
                                        <span className="font-mono text-sm">{selectedLabWork.trackingNumber}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Lab Cost *</Label>
                            <Input
                                type="number"
                                value={formData.labCost}
                                onChange={(e) => setFormData({ ...formData, labCost: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {selectedInvoice && (
                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <Input
                                    type="number"
                                    value={formData.paidAmount}
                                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </div>

                        {/* Total Preview */}
                        {formData.labCost && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Amount:</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(Number(formData.labCost))}
                                    </span>
                                </div>
                                {formData.paidAmount && (
                                    <>
                                        <div className="flex justify-between items-center mt-2 text-sm">
                                            <span className="text-muted-foreground">Paid:</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(Number(formData.paidAmount))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-2 border-t">
                                            <span className="font-semibold">Balance:</span>
                                            <span className="text-lg font-bold text-destructive">
                                                {formatCurrency(Number(formData.labCost) - Number(formData.paidAmount))}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </FormModal>

                {/* Delete Dialog */}
                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Lab Invoice"
                    description="Are you sure you want to delete this invoice? This will clear the billing status from the lab work."
                />

                {/* Receipt Modal */}
                {showReceipt && receiptData && (
                    <InvoiceReceipt
                        receipt={receiptData}
                        onClose={() => {
                            setShowReceipt(false);
                            setReceiptData(null);
                            setReceiptAutoPrint(false);
                        }}
                        onPrint={handlePrintReceipt}
                        autoPrint={receiptAutoPrint}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
