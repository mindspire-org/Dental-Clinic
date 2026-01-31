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
import { Plus, Edit, Trash2, Eye, Pill, FileText, X, Printer } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { billingApi, inventoryApi } from '@/lib/api';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    unitPrice?: number;
    quantity?: number;
}

type InventoryItem = {
    _id: string;
    name: string;
    category: string;
    price: number;
};

interface Prescription {
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
    prescriptionNumber: string;
    prescriptionDate: string;
    medications: Medication[];
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

export default function PrescriptionBilling() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [inventoryMedications, setInventoryMedications] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'prescriptions' | 'invoices'>('prescriptions');
    const [receiptAutoPrint, setReceiptAutoPrint] = useState(false);

    const [medications, setMedications] = useState<Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: string;
        unitPrice: string;
    }>>([]);

    const [formData, setFormData] = useState({
        notes: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        paidAmount: '',
    });

    useEffect(() => {
        fetchPrescriptions();
        fetchInvoices();
        fetchInventoryMedications();
    }, []);

    const fetchInventoryMedications = async () => {
        try {
            const res = await inventoryApi.getAll();
            const items = ((res as any)?.data?.items || []) as InventoryItem[];
            const meds = items
                .filter((it) => String(it?.category || '').toLowerCase() === 'medications')
                .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
            setInventoryMedications(meds);
        } catch (error) {
            console.error('Error fetching inventory medications:', error);
            setInventoryMedications([]);
        }
    };

    const resolveInventoryPrice = (name: string) => {
        const key = String(name || '').trim().toLowerCase();
        if (!key) return 0;
        const inv = inventoryMedications.find((it) => String(it.name || '').trim().toLowerCase() === key);
        return inv ? Number(inv.price ?? 0) : 0;
    };

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await billingApi.getPrescriptionsForBilling({ status: 'active' });
            const allPrescriptions = response?.data?.prescriptions || [];
            // Filter out prescriptions that already have invoices
            setPrescriptions(allPrescriptions.filter((p: Prescription) => !p.invoice));
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await billingApi.getAll({ invoiceType: 'prescription' });
            const bills = response?.data?.bills || response?.data?.invoices || [];
            setInvoices(bills.filter((b: any) => b.invoiceType === 'prescription'));
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const handleCreateBill = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setSelectedInvoice(null);

        // Initialize medications with pricing
        const meds = prescription.medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            quantity: String(m.quantity || 1),
            unitPrice: String((Number(m.unitPrice) || 0) > 0 ? m.unitPrice : resolveInventoryPrice(m.name)),
        }));

        setMedications(meds);
        setFormData({
            notes: `Prescription medicines - ${prescription.prescriptionNumber}`,
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
            setSelectedPrescription(null);

            const ctxMeds = Array.isArray(bill?.billingContext?.medications) ? bill.billingContext.medications : null;
            const meds = (ctxMeds || bill?.items || []).map((item: any) => {
                if (ctxMeds) {
                    return {
                        name: String(item?.name || ''),
                        dosage: String(item?.dosage || ''),
                        frequency: String(item?.frequency || ''),
                        duration: String(item?.duration || ''),
                        quantity: String(item?.quantity || 1),
                        unitPrice: String((Number(item?.unitPrice) || 0) > 0 ? item?.unitPrice : resolveInventoryPrice(String(item?.name || ''))),
                    };
                }

                const parts = String(item?.description || '').split(' - ');
                return {
                    name: String(parts[0] || ''),
                    dosage: '',
                    frequency: '',
                    duration: '',
                    quantity: String(item?.quantity || 1),
                    unitPrice: String((Number(item?.unitPrice) || 0) > 0 ? item?.unitPrice : resolveInventoryPrice(String(parts[0] || ''))),
                };
            });

            setMedications(meds);
            setFormData({
                notes: String(bill?.notes || ''),
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
            await billingApi.deletePrescriptionInvoice(selectedInvoice._id);
            setShowDeleteDialog(false);
            setActiveTab('invoices');
            fetchPrescriptions();
            fetchInvoices();
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);

            // Format medications for API
            const formattedMeds = medications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                quantity: Number(m.quantity) || 1,
                unitPrice: Number(m.unitPrice) || 0,
            }));

            if (selectedInvoice) {
                // Update existing invoice
                await billingApi.updatePrescriptionInvoice(selectedInvoice._id, {
                    medications: formattedMeds,
                    notes: formData.notes,
                    dueDate: formData.dueDate,
                    paidAmount: formData.paidAmount ? Number(formData.paidAmount) : undefined,
                });
            } else if (selectedPrescription) {
                // Create new invoice
                await billingApi.createPrescriptionInvoice({
                    prescriptionId: selectedPrescription._id,
                    medications: formattedMeds,
                    notes: formData.notes,
                    dueDate: formData.dueDate,
                    paidAmount: formData.paidAmount ? Number(formData.paidAmount) : 0,
                });
            }

            setShowModal(false);
            setActiveTab('invoices');
            fetchPrescriptions();
            fetchInvoices();
        } catch (error) {
            console.error('Error saving invoice:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleViewReceipt = async (invoice: Invoice, opts?: { autoPrint?: boolean }) => {
        try {
            const response = await billingApi.getPrescriptionReceipt(invoice._id);
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

    const addMedication = () => {
        setMedications([...medications, {
            name: '',
            dosage: '',
            frequency: '',
            duration: '',
            quantity: '1',
            unitPrice: '0',
        }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const updated = [...medications];
        if (field === 'name') {
            const nextName = value;
            const current = updated[index];
            const invPrice = resolveInventoryPrice(nextName);
            updated[index] = {
                ...current,
                name: nextName,
                unitPrice: (Number(current?.unitPrice) || 0) > 0 ? current.unitPrice : String(invPrice || 0),
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setMedications(updated);
    };

    const calculateTotal = () => {
        return medications.reduce((sum, med) => {
            const qty = Number(med.quantity) || 0;
            const price = Number(med.unitPrice) || 0;
            return sum + (qty * price);
        }, 0);
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

    const prescriptionColumns: ColumnDef<Prescription>[] = [
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
            accessorKey: 'prescriptionNumber',
            header: 'Prescription #',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.prescriptionNumber}</span>
            ),
        },
        {
            accessorKey: 'medications',
            header: 'Medications',
            cell: ({ row }) => (
                <div className="max-w-xs">
                    <p className="font-medium">{row.original.medications.length} medication(s)</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {row.original.medications.map(m => m.name).join(', ')}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'dentist',
            header: 'Dentist',
            cell: ({ row }) => (
                <div className="font-medium">
                    Dr. {row.original.dentist.firstName} {row.original.dentist.lastName}
                </div>
            ),
        },
        {
            accessorKey: 'prescriptionDate',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.prescriptionDate).toLocaleDateString()}
                </span>
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
                        <Pill className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Prescription Billing</h1>
                        <p className="text-muted-foreground">Create invoices for prescriptions</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('prescriptions')}
                            className={cn(
                                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === 'prescriptions'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            )}
                        >
                            <Pill className="w-4 h-4 inline mr-2" />
                            Unbilled Prescriptions ({prescriptions.length})
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
                            {activeTab === 'prescriptions' ? 'Active Prescriptions' : 'Prescription Invoices'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {activeTab === 'prescriptions' ? (
                            prescriptions.length === 0 ? (
                                <div className="rounded-xl border bg-muted/20">
                                    <EmptyState
                                        icon="file"
                                        title="No prescriptions ready"
                                        description="Active prescriptions will appear here for billing."
                                    />
                                </div>
                            ) : (
                                <DataTable
                                    columns={prescriptionColumns}
                                    data={prescriptions}
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
                                        description="Create bills from prescriptions."
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
                    title={selectedInvoice ? 'Edit Prescription Invoice' : 'Create Prescription Invoice'}
                    onSubmit={handleSubmit}
                    submitLabel={selectedInvoice ? 'Update Invoice' : 'Create Invoice'}
                    isLoading={saving}
                >
                    <div className="space-y-4">
                        {selectedPrescription && (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Patient:</span>
                                    <span className="font-medium">
                                        {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Prescription #:</span>
                                    <span className="font-mono text-sm">{selectedPrescription.prescriptionNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Dentist:</span>
                                    <span className="font-medium">
                                        Dr. {selectedPrescription.dentist.firstName} {selectedPrescription.dentist.lastName}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Medications */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Medications</Label>
                                <Button type="button" size="sm" variant="outline" onClick={addMedication}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Medication
                                </Button>
                            </div>

                            {medications.map((med, index) => (
                                <Card key={index} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-medium text-sm">Medication {index + 1}</h4>
                                            {medications.length > 1 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeMedication(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <Label className="text-xs">Name *</Label>
                                                <Input
                                                    value={med.name}
                                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                    placeholder="Medicine name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Dosage</Label>
                                                <Input
                                                    value={med.dosage}
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                    placeholder="e.g., 500mg"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Frequency</Label>
                                                <Input
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                    placeholder="e.g., 2x daily"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Quantity *</Label>
                                                <Input
                                                    type="number"
                                                    value={med.quantity}
                                                    onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Unit Price *</Label>
                                                <Input
                                                    type="number"
                                                    value={med.unitPrice}
                                                    onChange={(e) => updateMedication(index, 'unitPrice', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-semibold">
                                                {formatCurrency((Number(med.quantity) || 0) * (Number(med.unitPrice) || 0))}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
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
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Total Amount:</span>
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(calculateTotal())}
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
                                            {formatCurrency(calculateTotal() - Number(formData.paidAmount))}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </FormModal>

                {/* Delete Dialog */}
                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Prescription Invoice"
                    description="Are you sure you want to delete this invoice? This will clear the billing status from the prescription."
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
