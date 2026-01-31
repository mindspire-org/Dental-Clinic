import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, DollarSign, Download, Send, Receipt, CheckCircle2, Clock, AlertTriangle, Minus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { billingApi, patientsApi } from '@/lib/api';

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

type InvoiceItem = {
    description: string;
    quantity: string;
    unitPrice: string;
};

type PatientOption = {
    _id: string;
    firstName?: string;
    lastName?: string;
};

type TreatmentRow = {
    _id: string;
    description?: string;
    treatmentType?: string;
    actualCost?: number;
    estimatedCost?: number;
    dentist?: { firstName?: string; lastName?: string; checkupFee?: number };
    procedure?: { name?: string; price?: number };
};

export default function Invoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [saving, setSaving] = useState(false);

    const [patients, setPatients] = useState<PatientOption[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatientDentist, setSelectedPatientDentist] = useState<{ name: string; fee: number } | null>(null);

    const [formData, setFormData] = useState({
        patientName: '',
        dueDate: '',
        status: 'pending',
        tax: '',
        discount: '',
        notes: '',
        items: [{ description: '', quantity: '1', unitPrice: '' }] as InvoiceItem[],
    });

    useEffect(() => {
        fetchInvoices();
        fetchPatients();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await billingApi.getAll();
            setInvoices(response?.data?.invoices || response?.data?.billing || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            setPatientsLoading(true);
            const res = await patientsApi.getAll({ page: 1, limit: 1000 });
            setPatients(res?.data?.patients || []);
        } catch (e) {
            console.error('Error fetching patients:', e);
        } finally {
            setPatientsLoading(false);
        }
    };

    const getPatientFullName = (p?: PatientOption | null) => {
        const first = String(p?.firstName || '').trim();
        const last = String(p?.lastName || '').trim();
        return `${first} ${last}`.trim();
    };

    const handleSelectPatient = async (patientId: string) => {
        setSelectedPatientId(patientId);
        const patient = patients.find((p) => p._id === patientId);
        const patientName = getPatientFullName(patient);
        setFormData((prev) => ({ ...prev, patientName }));

        if (!patientId) {
            setSelectedPatientDentist(null);
            return;
        }

        try {
            const res = await patientsApi.getTreatments(patientId);
            const treatments = (res?.data?.treatments || []) as TreatmentRow[];

            const firstWithDentist = treatments.find((t) => t?.dentist);
            const dentistName = firstWithDentist?.dentist
                ? `${firstWithDentist.dentist.firstName || ''} ${firstWithDentist.dentist.lastName || ''}`.trim()
                : '';
            const dentistFee = Number(firstWithDentist?.dentist?.checkupFee || 0);
            if (dentistName || dentistFee) {
                setSelectedPatientDentist({ name: dentistName || '-', fee: dentistFee });
            } else {
                setSelectedPatientDentist(null);
            }

            const procedureItems: InvoiceItem[] = treatments
                .map((t) => {
                    const description = String(t?.procedure?.name || t?.description || t?.treatmentType || '').trim();
                    const unitPrice = Number(
                        t?.procedure?.price ?? t?.actualCost ?? t?.estimatedCost ?? 0
                    );
                    return {
                        description,
                        quantity: '1',
                        unitPrice: Number.isFinite(unitPrice) ? String(unitPrice) : '0',
                    };
                })
                .filter((it) => it.description);

            const items: InvoiceItem[] = [];
            if (Number.isFinite(dentistFee) && dentistFee > 0) {
                items.push({
                    description: dentistName ? `Dentist Fee (Dr. ${dentistName})` : 'Dentist Fee',
                    quantity: '1',
                    unitPrice: String(dentistFee),
                });
            }
            items.push(...procedureItems);

            setFormData((prev) => ({
                ...prev,
                items: items.length ? items : prev.items,
            }));
        } catch (e) {
            console.error('Error fetching patient treatments:', e);
        }
    };

    const handleCreate = () => {
        setSelectedInvoice(null);
        setSelectedPatientId('');
        setSelectedPatientDentist(null);
        setFormData({
            patientName: '',
            dueDate: '',
            status: 'pending',
            tax: '',
            discount: '',
            notes: '',
            items: [{ description: '', quantity: '1', unitPrice: '' }],
        });
        setShowModal(true);
    };

    const handleEdit = async (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        try {
            const res = await billingApi.getById(invoice._id);
            const bill = (res as any)?.data?.bill;
            const itemsFromBill = Array.isArray(bill?.items) ? bill.items : [];
            const patientNameFromBill = String(bill?.patientName || '').trim();
            const fallbackName = `${invoice.patient?.firstName || ''} ${invoice.patient?.lastName || ''}`.trim();

            const patientIdFromBill = String(bill?.patient?._id || '').trim();
            setSelectedPatientId(patientIdFromBill);
            if (patientIdFromBill) {
                const patient = patients.find((p) => p._id === patientIdFromBill);
                if (patient) {
                    setFormData((prev) => ({ ...prev, patientName: getPatientFullName(patient) }));
                }
            }

            setFormData({
                patientName: patientNameFromBill || fallbackName,
                dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : (invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : ''),
                status: String(bill?.status || invoice.status || 'pending'),
                tax: bill?.tax !== undefined ? String(bill.tax) : '',
                discount: bill?.discount !== undefined ? String(bill.discount) : '',
                notes: bill?.notes ? String(bill.notes) : '',
                items: (itemsFromBill.length > 0)
                    ? itemsFromBill.map((it: any) => ({
                        description: String(it?.description || ''),
                        quantity: String(it?.quantity ?? '1'),
                        unitPrice: String(it?.unitPrice ?? ''),
                    }))
                    : [{ description: '', quantity: '1', unitPrice: '' }],
            });
        } catch (e) {
            console.error('Error loading invoice details:', e);
        }
        setShowModal(true);
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
            pending: 'bg-warning/10 text-warning',
            'partially-paid': 'bg-info/10 text-info',
            paid: 'bg-success/10 text-success',
            overdue: 'bg-destructive/10 text-destructive',
            cancelled: 'bg-muted text-muted-foreground',
        };
        return colors[status] || colors.pending;
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
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
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

    const handleSubmit = async () => {
        const patientName = String(formData.patientName || '').trim();
        const dueDate = formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined;

        const items = (Array.isArray(formData.items) ? formData.items : [])
            .map((it) => ({
                description: String(it.description || '').trim(),
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
            }))
            .filter((it) => it.description && Number.isFinite(it.quantity) && it.quantity > 0 && Number.isFinite(it.unitPrice) && it.unitPrice >= 0);

        const tax = formData.tax === '' ? 0 : Number(formData.tax);
        const discount = formData.discount === '' ? 0 : Number(formData.discount);

        if (!patientName) {
            console.error('patientName is required');
            return;
        }
        if (items.length === 0) {
            console.error('Please add at least one line item');
            return;
        }
        if (!Number.isFinite(tax) || tax < 0 || !Number.isFinite(discount) || discount < 0) {
            console.error('tax/discount must be valid numbers');
            return;
        }

        try {
            setSaving(true);
            const payload: any = {
                patient: selectedPatientId || undefined,
                patientName,
                dueDate,
                status: formData.status,
                tax,
                discount,
                notes: String(formData.notes || '').trim() || undefined,
                items,
            };
            if (selectedInvoice) {
                await billingApi.update(selectedInvoice._id, payload);
            } else {
                await billingApi.create(payload);
            }
            setShowModal(false);
            setSelectedInvoice(null);
            await fetchInvoices();
        } catch (e) {
            console.error('Error saving invoice:', e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount - inv.balance), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

    const stats = [
        {
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            valueClass: 'text-foreground',
            bg: 'bg-primary/10',
            iconClass: 'text-primary',
        },
        {
            label: 'Paid',
            value: formatCurrency(totalPaid),
            icon: CheckCircle2,
            valueClass: 'text-success',
            bg: 'bg-success/10',
            iconClass: 'text-success',
        },
        {
            label: 'Pending',
            value: formatCurrency(totalPending),
            icon: Clock,
            valueClass: 'text-warning',
            bg: 'bg-warning/10',
            iconClass: 'text-warning',
        },
        {
            label: 'Overdue',
            value: String(overdueCount),
            icon: AlertTriangle,
            valueClass: 'text-destructive',
            bg: 'bg-destructive/10',
            iconClass: 'text-destructive',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
                            <p className="text-muted-foreground">Manage billing and invoices</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleCreate} className="gradient-primary shadow-glow">
                            <Plus className="w-4 h-4 mr-2" />
                            New Invoice
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <Card
                            key={stat.label}
                            className="shadow-card hover-lift gradient-card animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                                        <div className={cn('text-2xl font-bold mt-1', stat.valueClass)}>{stat.value}</div>
                                    </div>
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                                        <stat.icon className={cn('w-5 h-5', stat.iconClass)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="shadow-card">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">All Invoices</CardTitle>
                                <div className="text-sm text-muted-foreground">Create, track balances, and manage status</div>
                            </div>
                            <Badge variant="outline" className="w-fit">
                                {invoices.length} invoices
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {invoices.length === 0 ? (
                            <div className="rounded-xl border bg-muted/20">
                                <EmptyState
                                    icon="plus"
                                    title="No invoices found"
                                    description="Create an invoice to start tracking payments and balances."
                                    action={{
                                        label: 'Create Invoice',
                                        onClick: handleCreate,
                                    }}
                                />
                            </div>
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

                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Invoice"
                    description={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceId}? This action cannot be undone.`}
                />

                <FormModal
                    open={showModal}
                    onOpenChange={(open) => {
                        setShowModal(open);
                        if (!open) {
                            setSelectedInvoice(null);
                            setSelectedPatientId('');
                            setSelectedPatientDentist(null);
                        }
                    }}
                    title={selectedInvoice ? 'Edit Invoice' : 'New Invoice'}
                    onSubmit={handleSubmit}
                    submitLabel={selectedInvoice ? 'Update' : 'Create'}
                    isLoading={saving}
                    size="lg"
                >
                    <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="grid gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Patient Name *</Label>
                                <Select
                                    value={selectedPatientId}
                                    onValueChange={(value) => handleSelectPatient(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={patientsLoading ? 'Loading patients...' : 'Select patient'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {getPatientFullName(p) || p._id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedPatientDentist && (
                                <div className="rounded-lg border bg-background p-3">
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="text-sm">
                                            <div className="text-muted-foreground">Dentist</div>
                                            <div className="font-medium">{selectedPatientDentist.name}</div>
                                        </div>
                                        <div className="text-sm md:text-right">
                                            <div className="text-muted-foreground">Dentist Fee</div>
                                            <div className="font-medium">{formatCurrency(Number(selectedPatientDentist.fee || 0))}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="partially-paid">Partially Paid</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Line Items *</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData({
                                            ...formData,
                                            items: [...formData.items, { description: '', quantity: '1', unitPrice: '' }],
                                        })}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Item
                                    </Button>
                                </div>

                                <div className="rounded-lg border bg-background overflow-hidden">
                                    <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">
                                        <div className="md:col-span-6">Service / Procedure</div>
                                        <div className="md:col-span-2">Qty</div>
                                        <div className="md:col-span-3">Unit Price</div>
                                        <div className="md:col-span-1 text-right">Remove</div>
                                    </div>

                                    <div className="space-y-3 p-3">
                                        {formData.items.map((it, idx) => (
                                            <div key={idx} className="grid gap-3 md:grid-cols-12">
                                                <div className="md:col-span-6">
                                                    <Input
                                                        value={it.description}
                                                        onChange={(e) => {
                                                            const next = [...formData.items];
                                                            next[idx] = { ...next[idx], description: e.target.value };
                                                            setFormData({ ...formData, items: next });
                                                        }}
                                                        placeholder="e.g., Teeth Cleaning"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Input
                                                        type="number"
                                                        value={it.quantity}
                                                        onChange={(e) => {
                                                            const next = [...formData.items];
                                                            next[idx] = { ...next[idx], quantity: e.target.value };
                                                            setFormData({ ...formData, items: next });
                                                        }}
                                                        placeholder="1"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={it.unitPrice}
                                                        onChange={(e) => {
                                                            const next = [...formData.items];
                                                            next[idx] = { ...next[idx], unitPrice: e.target.value };
                                                            setFormData({ ...formData, items: next });
                                                        }}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="md:col-span-1 flex items-center justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={formData.items.length === 1}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            items: formData.items.filter((_, i) => i !== idx),
                                                        })}
                                                    >
                                                        <Minus className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-12">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Tax</Label>
                                    <Input
                                        type="number"
                                        value={formData.tax}
                                        onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Discount</Label>
                                    <Input
                                        type="number"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-3">
                                    <Label>Summary</Label>
                                    <div className="rounded-lg border bg-background p-3 text-sm">
                                        {(() => {
                                            const sub = (formData.items || []).reduce((sum, x) => {
                                                const q = Number(x.quantity);
                                                const u = Number(x.unitPrice);
                                                return sum + ((Number.isFinite(q) ? q : 0) * (Number.isFinite(u) ? u : 0));
                                            }, 0);
                                            const tx = formData.tax === '' ? 0 : Number(formData.tax);
                                            const disc = formData.discount === '' ? 0 : Number(formData.discount);
                                            const tot = Math.max(0, sub + (Number.isFinite(tx) ? tx : 0) - (Number.isFinite(disc) ? disc : 0));
                                            return (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(sub)}</span></div>
                                                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">{formatCurrency(Number.isFinite(tx) ? tx : 0)}</span></div>
                                                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium">-{formatCurrency(Number.isFinite(disc) ? disc : 0)}</span></div>
                                                    <div className="border-t pt-1 flex items-center justify-between"><span className="font-medium">Total</span><span className="font-bold">{formatCurrency(tot)}</span></div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
}
