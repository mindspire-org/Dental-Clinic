import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Download, Filter, Eye, Edit, Printer } from 'lucide-react';
import { FormModal } from '@/components/shared/FormModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { billingApi } from '@/lib/api';
import InvoiceReceipt from '../../components/billing/InvoiceReceipt';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type PaymentRow = {
    _id: string;
    paymentId: string;
    invoice?: { _id?: string; invoiceNumber?: string };
    patient?: { firstName?: string; lastName?: string };
    amount: number;
    paymentDate?: string;
    createdAt?: string;
    paymentMethod: string;
    status: string;
    transactionId?: string;
    notes?: string;
};

type InvoiceOption = {
    _id: string;
    label: string;
    balance: number;
};

export default function Payments() {
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [receiptAutoPrint, setReceiptAutoPrint] = useState(false);
    const [showInvoiceEditModal, setShowInvoiceEditModal] = useState(false);
    const [savingInvoice, setSavingInvoice] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [invoiceEditForm, setInvoiceEditForm] = useState({
        dueDate: '',
        status: 'pending',
        notes: '',
    });
    const [formData, setFormData] = useState({
        invoiceId: '',
        amount: '',
        paymentMethod: 'cash',
        paymentDate: '',
        transactionId: '',
        notes: '',
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [pRes, iRes] = await Promise.all([
                    billingApi.getPayments(),
                    billingApi.getAll(),
                ]);
                setPayments(pRes?.data?.payments || []);

                const bills = (iRes?.data?.bills || iRes?.data?.invoices || []) as any[];
                const options: InvoiceOption[] = bills.map((b) => {
                    const patientName = `${b?.patient?.firstName || ''} ${b?.patient?.lastName || ''}`.trim();
                    const invoiceNo = String(b?.invoiceNumber || b?.invoiceId || '').trim();
                    const type = String(b?.invoiceType || '').trim();
                    const createdAt = b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : '';
                    const total = Number(b?.total || b?.amount || 0);
                    const paid = Number(b?.paidAmount || 0);
                    const balance = Math.max(0, total - paid);
                    const labelParts = [
                        patientName || 'Unknown patient',
                        type ? type.toUpperCase() : 'INVOICE',
                        invoiceNo ? `#${invoiceNo}` : '',
                        createdAt ? createdAt : '',
                    ].filter(Boolean);

                    return {
                        _id: b._id,
                        label: labelParts.join(' • '),
                        balance,
                    };
                });

                setInvoices(options);

                if (options.length && !formData.invoiceId) {
                    setFormData((prev) => ({
                        ...prev,
                        invoiceId: options[0]._id,
                        amount: options[0].balance ? String(options[0].balance) : prev.amount,
                    }));
                }
            } catch (e) {
                console.error('Error loading payments:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        const first = invoices[0];
        setFormData({
            invoiceId: first?._id || '',
            amount: first?.balance ? String(first.balance) : '',
            paymentMethod: 'cash',
            paymentDate: new Date().toISOString().slice(0, 10),
            transactionId: '',
            notes: '',
        });
        setShowModal(true);
    };

    const handleInvoiceChange = (value: string) => {
        const selected = invoices.find((i) => i._id === value);
        setFormData((prev) => ({
            ...prev,
            invoiceId: value,
            amount: selected?.balance ? String(selected.balance) : prev.amount,
        }));
    };

    const loadReceiptForInvoice = async (invoiceId: string, opts?: { autoPrint?: boolean }) => {
        const detail = await billingApi.getById(invoiceId);
        const bill = detail?.data?.bill;
        const invoiceType = String(bill?.invoiceType || '').toLowerCase();

        const fallbackReceipt = () => {
            const items = Array.isArray(bill?.items) ? bill.items : [];
            const subtotal = Number(bill?.subtotal || items.reduce((s: number, it: any) => s + (Number(it.total) || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0));
            const tax = Number(bill?.tax || 0);
            const discount = Number(bill?.discount || 0);
            const total = Number(bill?.total || Math.max(0, subtotal + tax - discount));
            const paidAmount = Number(bill?.paidAmount || 0);
            const balance = Math.max(0, total - paidAmount);
            return {
                clinic: { name: 'DentalVerse Elite' },
                patient: bill?.patient,
                invoice: {
                    _id: bill?._id,
                    invoiceNumber: bill?.invoiceNumber,
                    invoiceType: bill?.invoiceType,
                    status: bill?.status,
                    createdAt: bill?.createdAt,
                    dueDate: bill?.dueDate,
                    notes: bill?.notes,
                },
                items: items.map((it: any) => ({
                    description: it.description,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    total: it.total,
                })),
                financial: { subtotal, tax, discount, total, paidAmount, balance },
            };
        };

        let receiptResp: any = null;
        if (invoiceType === 'checkup') receiptResp = await billingApi.getCheckupReceipt(invoiceId);
        else if (invoiceType === 'procedure') receiptResp = await billingApi.getProcedureReceipt(invoiceId);
        else if (invoiceType === 'lab') receiptResp = await billingApi.getLabReceipt(invoiceId);
        else if (invoiceType === 'prescription') receiptResp = await billingApi.getPrescriptionReceipt(invoiceId);

        setReceiptData(receiptResp?.data?.receipt || fallbackReceipt());
        setReceiptAutoPrint(Boolean(opts?.autoPrint));
        setShowReceipt(true);
    };

    const handleViewInvoice = async (payment: PaymentRow) => {
        const invoiceId = String(payment?.invoice?._id || '');
        if (!invoiceId) return;
        try {
            await loadReceiptForInvoice(invoiceId, { autoPrint: false });
        } catch (e) {
            console.error('Error loading invoice receipt:', e);
        }
    };

    const handleQuickPrintInvoice = async (payment: PaymentRow) => {
        const invoiceId = String(payment?.invoice?._id || '');
        if (!invoiceId) return;
        try {
            await loadReceiptForInvoice(invoiceId, { autoPrint: true });
        } catch (e) {
            console.error('Error loading invoice receipt:', e);
        }
    };

    const handlePrintReceipt = async () => {
        if (!receiptData?.invoice?._id) return;
        try {
            await billingApi.markPrinted(receiptData.invoice._id);
        } catch (e) {
            console.error('Error marking invoice as printed:', e);
        }
    };

    const handleEditInvoice = async (payment: PaymentRow) => {
        const invoiceId = String(payment?.invoice?._id || '');
        if (!invoiceId) return;
        try {
            const resp = await billingApi.getById(invoiceId);
            const bill = resp?.data?.bill;
            if (!bill) return;

            setSelectedInvoiceId(invoiceId);
            setInvoiceEditForm({
                dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : '',
                status: String(bill?.status || 'pending'),
                notes: String(bill?.notes || ''),
            });
            setShowInvoiceEditModal(true);
        } catch (e) {
            console.error('Error loading invoice details:', e);
        }
    };

    const submitInvoiceUpdate = async () => {
        if (!selectedInvoiceId) return;
        try {
            setSavingInvoice(true);
            await billingApi.update(selectedInvoiceId, {
                dueDate: invoiceEditForm.dueDate || undefined,
                status: invoiceEditForm.status,
                notes: invoiceEditForm.notes,
            });

            const [pRes, iRes] = await Promise.all([
                billingApi.getPayments(),
                billingApi.getAll(),
            ]);
            setPayments(pRes?.data?.payments || []);

            const bills = (iRes?.data?.bills || iRes?.data?.invoices || []) as any[];
            const options: InvoiceOption[] = bills.map((b) => {
                const patientName = `${b?.patient?.firstName || ''} ${b?.patient?.lastName || ''}`.trim();
                const invoiceNo = String(b?.invoiceNumber || b?.invoiceId || '').trim();
                const type = String(b?.invoiceType || '').trim();
                const createdAt = b?.createdAt ? new Date(b.createdAt).toLocaleDateString() : '';
                const total = Number(b?.total || b?.amount || 0);
                const paid = Number(b?.paidAmount || 0);
                const balance = Math.max(0, total - paid);
                const labelParts = [
                    patientName || 'Unknown patient',
                    type ? type.toUpperCase() : 'INVOICE',
                    invoiceNo ? `#${invoiceNo}` : '',
                    createdAt ? createdAt : '',
                ].filter(Boolean);
                return { _id: b._id, label: labelParts.join(' • '), balance };
            });
            setInvoices(options);

            setShowInvoiceEditModal(false);
        } catch (e) {
            console.error('Error updating invoice:', e);
        } finally {
            setSavingInvoice(false);
        }
    };

    const handleSubmit = async () => {
        const invoiceId = formData.invoiceId;
        const amount = Number(formData.amount);
        if (!invoiceId) return;
        if (!Number.isFinite(amount) || amount <= 0) return;

        try {
            setSaving(true);
            await billingApi.recordPayment({
                invoiceId,
                amount,
                paymentMethod: formData.paymentMethod,
                paymentDate: formData.paymentDate ? new Date(formData.paymentDate).toISOString() : undefined,
                transactionId: String(formData.transactionId || '').trim() || undefined,
                notes: String(formData.notes || '').trim() || undefined,
            });
            const pRes = await billingApi.getPayments();
            setPayments(pRes?.data?.payments || []);
            setShowModal(false);
        } catch (e) {
            console.error('Error recording payment:', e);
        } finally {
            setSaving(false);
        }
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalMonthlyRevenue = payments
        .filter((p) => {
            const d = p.paymentDate || p.createdAt;
            return d ? new Date(d) >= monthStart : false;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalRevenueAllTime = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completedCount = payments.filter((p) => p.status === 'completed').length;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                        <p className="text-muted-foreground">Recent transactions and financial records</p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="gradient-primary" onClick={openCreate}>Record Payment</Button>
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary text-primary-foreground shadow-glow border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium opacity-90">Revenue (This Month)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatCurrency(totalMonthlyRevenue)}</div>
                            <p className="text-sm opacity-75 mt-1">Transactions since {monthStart.toLocaleDateString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-success">{formatCurrency(totalRevenueAllTime)}</div>
                            <p className="text-sm text-muted-foreground mt-1">All recorded payments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground">Completed Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-info">{completedCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Marked as completed</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(loading ? [] : payments).map((payment) => {
                                    const invNo = payment.invoice?.invoiceNumber || '-';
                                    const patientName = `${payment.patient?.firstName || ''} ${payment.patient?.lastName || ''}`.trim() || '-';
                                    const date = payment.paymentDate || payment.createdAt;
                                    const statusLabel = payment.status === 'completed' ? 'Paid' : (payment.status || 'Pending');
                                    const statusClass = statusLabel === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning';
                                    return (
                                        <TableRow key={payment._id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{invNo}</TableCell>
                                            <TableCell>{date ? new Date(date).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell className="font-medium">{patientName}</TableCell>
                                            <TableCell className="flex items-center gap-2">
                                                <CreditCard className="w-3 h-3 text-muted-foreground" /> {payment.paymentMethod}
                                            </TableCell>
                                            <TableCell className="font-bold">${Number(payment.amount || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusLabel === 'Paid' ? 'default' : 'secondary'} className={statusClass}>
                                                    {statusLabel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleViewInvoice(payment)}
                                                        disabled={!payment?.invoice?._id}
                                                        title="View / Print Invoice"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleQuickPrintInvoice(payment)}
                                                        disabled={!payment?.invoice?._id}
                                                        title="Print Invoice"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditInvoice(payment)}
                                                        disabled={!payment?.invoice?._id}
                                                        title="Edit / Update Invoice"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title="Record Payment"
                    description="Add a payment against an invoice"
                    onSubmit={handleSubmit}
                    submitLabel="Save"
                    isLoading={saving}
                    size="lg"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Invoice</Label>
                            <Select value={formData.invoiceId} onValueChange={handleInvoiceChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select invoice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoices.map((inv) => (
                                        <SelectItem key={inv._id} value={inv._id}>{inv.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit_card">Debit Card</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Date</Label>
                            <Input
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Transaction ID</Label>
                            <Input
                                value={formData.transactionId}
                                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes..."
                                rows={3}
                            />
                        </div>
                    </div>
                </FormModal>

                <FormModal
                    open={showInvoiceEditModal}
                    onOpenChange={setShowInvoiceEditModal}
                    title="Update Invoice"
                    description="Edit invoice details"
                    onSubmit={submitInvoiceUpdate}
                    submitLabel="Update"
                    isLoading={savingInvoice}
                    size="lg"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={invoiceEditForm.dueDate}
                                onChange={(e) => setInvoiceEditForm({ ...invoiceEditForm, dueDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={invoiceEditForm.status}
                                onValueChange={(value) => setInvoiceEditForm({ ...invoiceEditForm, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="partially-paid">Partially Paid</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={invoiceEditForm.notes}
                                onChange={(e) => setInvoiceEditForm({ ...invoiceEditForm, notes: e.target.value })}
                                placeholder="Optional notes..."
                                rows={4}
                            />
                        </div>
                    </div>
                </FormModal>

                {showReceipt && receiptData && (
                    <InvoiceReceipt
                        receipt={receiptData}
                        onClose={() => {
                            setShowReceipt(false);
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
