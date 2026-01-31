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
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Receipt, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { expensesApi } from '@/lib/api';

interface Expense {
    _id: string;
    expenseId: string;
    category: string;
    description: string;
    amount: number;
    paidAmount: number;
    paymentStatus: string;
    approvalStatus: string;
    vendor?: string;
    expenseDate: string;
    paymentMethod?: string;
    notes?: string;
}

const CATEGORY_OPTIONS = [
    { value: 'supplies', label: 'Supplies' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'rent', label: 'Rent' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'lab_fees', label: 'Lab Fees' },
    { value: 'other', label: 'Other' },
];

const PAYMENT_METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' },
];

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalPaid: 0,
        totalPending: 0,
        count: 0,
    });

    const [formData, setFormData] = useState({
        category: '',
        description: '',
        amount: '',
        vendor: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        paidAmount: '',
        notes: '',
    });

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await expensesApi.getAll({ page: 1, limit: 100 });
            setExpenses(response?.data?.expenses || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await expensesApi.getStats();
            setStats(response?.data?.summary || {
                totalExpenses: 0,
                totalPaid: 0,
                totalPending: 0,
                count: 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreate = () => {
        setSelectedExpense(null);
        setFormData({
            category: '',
            description: '',
            amount: '',
            vendor: '',
            expenseDate: new Date().toISOString().slice(0, 10),
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            paidAmount: '',
            notes: '',
        });
        setShowModal(true);
    };

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setFormData({
            category: expense.category,
            description: expense.description,
            amount: String(expense.amount),
            vendor: expense.vendor || '',
            expenseDate: new Date(expense.expenseDate).toISOString().slice(0, 10),
            paymentMethod: expense.paymentMethod || 'cash',
            paymentStatus: expense.paymentStatus,
            paidAmount: String(expense.paidAmount || 0),
            notes: expense.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (expense: Expense) => {
        setSelectedExpense(expense);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedExpense) return;
        try {
            await expensesApi.delete(selectedExpense._id);
            setShowDeleteDialog(false);
            fetchExpenses();
            fetchStats();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const payload = {
                category: formData.category,
                description: formData.description,
                amount: Number(formData.amount),
                vendor: formData.vendor || undefined,
                expenseDate: formData.expenseDate,
                paymentMethod: formData.paymentMethod,
                paymentStatus: formData.paymentStatus,
                paidAmount: Number(formData.paidAmount || 0),
                notes: formData.notes || undefined,
            };

            if (selectedExpense) {
                await expensesApi.update(selectedExpense._id, payload);
            } else {
                await expensesApi.create(payload);
            }

            setShowModal(false);
            fetchExpenses();
            fetchStats();
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            supplies: 'bg-blue-100 text-blue-700',
            equipment: 'bg-purple-100 text-purple-700',
            utilities: 'bg-yellow-100 text-yellow-700',
            salaries: 'bg-green-100 text-green-700',
            rent: 'bg-red-100 text-red-700',
            maintenance: 'bg-orange-100 text-orange-700',
            marketing: 'bg-pink-100 text-pink-700',
            lab_fees: 'bg-indigo-100 text-indigo-700',
            other: 'bg-gray-100 text-gray-700',
        };
        return colors[category] || colors.other;
    };

    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-warning/10 text-warning',
            partial: 'bg-info/10 text-info',
            paid: 'bg-success/10 text-success',
        };
        return colors[status] || colors.pending;
    };

    const columns: ColumnDef<Expense>[] = [
        {
            accessorKey: 'expenseId',
            header: 'Expense ID',
            cell: ({ row }) => (
                <div className="font-mono font-medium">{row.original.expenseId}</div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge className={getCategoryColor(row.original.category)}>
                    {CATEGORY_OPTIONS.find(c => c.value === row.original.category)?.label || row.original.category}
                </Badge>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.description}</p>
                    {row.original.vendor && (
                        <p className="text-xs text-muted-foreground">Vendor: {row.original.vendor}</p>
                    )}
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
            accessorKey: 'paidAmount',
            header: 'Paid',
            cell: ({ row }) => (
                <div className="text-success">{formatCurrency(row.original.paidAmount)}</div>
            ),
        },
        {
            accessorKey: 'paymentStatus',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={getPaymentStatusColor(row.original.paymentStatus)}>
                    {row.original.paymentStatus}
                </Badge>
            ),
        },
        {
            accessorKey: 'expenseDate',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.expenseDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
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

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    const statsCards = [
        {
            label: 'Total Expenses',
            value: formatCurrency(stats.totalExpenses),
            icon: DollarSign,
            valueClass: 'text-foreground',
            bg: 'bg-primary/10',
            iconClass: 'text-primary',
        },
        {
            label: 'Total Paid',
            value: formatCurrency(stats.totalPaid),
            icon: CheckCircle,
            valueClass: 'text-success',
            bg: 'bg-success/10',
            iconClass: 'text-success',
        },
        {
            label: 'Pending',
            value: formatCurrency(stats.totalPending),
            icon: Clock,
            valueClass: 'text-warning',
            bg: 'bg-warning/10',
            iconClass: 'text-warning',
        },
        {
            label: 'Total Count',
            value: String(stats.count),
            icon: Receipt,
            valueClass: 'text-info',
            bg: 'bg-info/10',
            iconClass: 'text-info',
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
                            <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
                            <p className="text-muted-foreground">Track and manage clinic expenses</p>
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="gradient-primary shadow-glow">
                        <Plus className="w-4 h-4 mr-2" />
                        New Expense
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map((stat, index) => (
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
                                <CardTitle className="text-lg">All Expenses</CardTitle>
                                <div className="text-sm text-muted-foreground">Track all clinic operational costs</div>
                            </div>
                            <Badge variant="outline" className="w-fit">
                                {expenses.length} expenses
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {expenses.length === 0 ? (
                            <div className="rounded-xl border bg-muted/20">
                                <EmptyState
                                    icon="plus"
                                    title="No expenses found"
                                    description="Create an expense to start tracking clinic costs."
                                    action={{
                                        label: 'Create Expense',
                                        onClick: handleCreate,
                                    }}
                                />
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={expenses}
                                searchKey="description"
                                searchPlaceholder="Search expenses..."
                            />
                        )}
                    </CardContent>
                </Card>

                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Expense"
                    description={`Are you sure you want to delete expense ${selectedExpense?.expenseId}? This action cannot be undone.`}
                />

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedExpense ? 'Edit Expense' : 'New Expense'}
                    onSubmit={handleSubmit}
                    submitLabel={selectedExpense ? 'Update' : 'Create'}
                    isLoading={saving}
                    size="lg"
                >
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Expense Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.expenseDate}
                                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="e.g., Office supplies purchase"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Vendor/Supplier</Label>
                                <Input
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    placeholder="Vendor name"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHOD_OPTIONS.map(pm => (
                                            <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Status</Label>
                                <Select value={formData.paymentStatus} onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Paid Amount</Label>
                                <Input
                                    type="number"
                                    value={formData.paidAmount}
                                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
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
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
}
