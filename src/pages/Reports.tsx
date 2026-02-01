import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, DollarSign, Activity, TrendingUp, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DateRange } from 'react-day-picker';

const Reports = () => {
    const [reportPeriod, setReportPeriod] = useState('month');

    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        outstanding: 0,
        profitMarginPct: 0,
        revenueChangePct: 0,
        paymentsCount: 0,
        expensesCount: 0,
        avgPayment: 0,
    });
    const [revenueData, setRevenueData] = useState<Array<{ name: string; revenue: number; expenses: number }>>([]);

    const [breakdown, setBreakdown] = useState<{
        revenueByMethod: Array<{ method: string; total: number; count: number }>;
        expensesByCategory: Array<{ category: string; total: number; count: number }>;
        invoicesByStatus: Array<{ status: string; count: number; billed: number; paid: number; outstanding: number }>;
        topOutstandingInvoices: Array<{ invoiceNumber: string; patientName?: string; status: string; invoiceDate?: string; total: number; paidAmount: number; balance: number }>;
    }>({
        revenueByMethod: [],
        expensesByCategory: [],
        invoicesByStatus: [],
        topOutstandingInvoices: [],
    });

    const [recent, setRecent] = useState<{
        payments: any[];
        expenses: any[];
    }>({ payments: [], expenses: [] });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const params: any = { period: reportPeriod };
                if (reportPeriod === 'custom') {
                    if (customStartDate) params.startDate = customStartDate;
                    if (customEndDate) params.endDate = customEndDate;
                }
                const res = await reportsApi.getFinancial(params);
                if (!mounted) return;

                const s = res?.data?.summary;
                const chart = res?.data?.chart?.revenueVsExpenses;
                setSummary({
                    totalRevenue: Number(s?.totalRevenue || 0),
                    totalExpenses: Number(s?.totalExpenses || 0),
                    netProfit: Number(s?.netProfit || 0),
                    outstanding: Number(s?.outstanding || 0),
                    profitMarginPct: Number(s?.profitMarginPct || 0),
                    revenueChangePct: Number(s?.revenueChangePct || 0),
                    paymentsCount: Number(s?.paymentsCount || 0),
                    expensesCount: Number(s?.expensesCount || 0),
                    avgPayment: Number(s?.avgPayment || 0),
                });
                setRevenueData(Array.isArray(chart) ? chart : []);

                const b = res?.data?.breakdown;
                setBreakdown({
                    revenueByMethod: Array.isArray(b?.revenueByMethod) ? b.revenueByMethod : [],
                    expensesByCategory: Array.isArray(b?.expensesByCategory) ? b.expensesByCategory : [],
                    invoicesByStatus: Array.isArray(b?.invoicesByStatus) ? b.invoicesByStatus : [],
                    topOutstandingInvoices: Array.isArray(b?.topOutstandingInvoices) ? b.topOutstandingInvoices : [],
                });

                const r = res?.data?.recent;
                setRecent({
                    payments: Array.isArray(r?.payments) ? r.payments : [],
                    expenses: Array.isArray(r?.expenses) ? r.expenses : [],
                });
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load financial report');
                setRevenueData([]);
                setBreakdown({ revenueByMethod: [], expensesByCategory: [], invoicesByStatus: [], topOutstandingInvoices: [] });
                setRecent({ payments: [], expenses: [] });
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [customEndDate, customStartDate, reportPeriod]);

    const periodLabel = useMemo(() => {
        if (reportPeriod === 'week') return 'This Week';
        if (reportPeriod === 'year') return 'This Year';
        if (reportPeriod === 'custom') return 'Custom Range';
        return 'This Month';
    }, [reportPeriod]);

    const fmtCurrency = (value: number) => {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
        } catch {
            return `$${Number(value || 0).toFixed(0)}`;
        }
    };

    const fmtDate = (value?: string) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString();
    };

    const profitBadge = summary.netProfit >= 0
        ? { label: 'Profit', className: 'bg-success/10 text-success border-success/20', Icon: ArrowUpRight }
        : { label: 'Loss', className: 'bg-destructive/10 text-destructive border-destructive/20', Icon: ArrowDownRight };

    const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#64748b'];

    const paymentMethodLabel: Record<string, string> = {
        cash: 'Cash',
        credit_card: 'Credit Card',
        debit_card: 'Debit Card',
        insurance: 'Insurance',
        check: 'Check',
        bank_transfer: 'Bank Transfer',
    };

    const expenseCategoryLabel: Record<string, string> = {
        supplies: 'Supplies',
        equipment: 'Equipment',
        utilities: 'Utilities',
        salaries: 'Salaries',
        rent: 'Rent',
        maintenance: 'Maintenance',
        marketing: 'Marketing',
        lab_fees: 'Lab Fees',
        other: 'Other',
    };

    const invoiceStatusBadge = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s === 'paid') return 'bg-success/10 text-success border-success/20';
        if (s === 'overdue') return 'bg-destructive/10 text-destructive border-destructive/20';
        if (s === 'partially-paid') return 'bg-warning/10 text-warning border-warning/20';
        if (s === 'cancelled') return 'bg-muted text-muted-foreground border-border';
        return 'bg-primary/10 text-primary border-primary/20';
    };

    const dateRangeValue = useMemo<DateRange | undefined>(() => {
        const from = customStartDate ? new Date(customStartDate) : undefined;
        const to = customEndDate ? new Date(customEndDate) : undefined;
        if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return undefined;
        if (!from && !to) return undefined;
        return { from, to };
    }, [customEndDate, customStartDate]);

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                        <p className="text-muted-foreground mt-1">Financial, clinical, and operational insights</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={reportPeriod} onValueChange={setReportPeriod}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" disabled>
                            <Calendar className="w-4 h-4 mr-2" />
                            {periodLabel}
                        </Button>
                        <Button variant="outline" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {reportPeriod === 'custom' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Date Range</CardTitle>
                            <CardDescription>Use a custom date range for the financial report.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 md:grid-cols-3 items-center">
                            <DateRangePicker
                                value={dateRangeValue}
                                onChange={(next) => {
                                    const from = next?.from ? new Date(next.from) : undefined;
                                    const to = next?.to ? new Date(next.to) : undefined;
                                    setCustomStartDate(from && !Number.isNaN(from.getTime()) ? from.toISOString().slice(0, 10) : '');
                                    setCustomEndDate(to && !Number.isNaN(to.getTime()) ? to.toISOString().slice(0, 10) : '');
                                }}
                            />
                            <div className="grid gap-2">
                                <div className="text-sm text-muted-foreground">Start Date</div>
                                <input
                                    type="date"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="text-sm text-muted-foreground">End Date</div>
                                <input
                                    type="date"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {error ? (
                    <Card>
                        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '—' : fmtCurrency(summary.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">
                                {loading ? 'Loading...' : `${summary.revenueChangePct >= 0 ? '+' : ''}${summary.revenueChangePct.toFixed(0)}% vs previous period`}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '—' : fmtCurrency(summary.netProfit)}</div>
                            <p className="text-xs text-muted-foreground">
                                {loading ? 'Loading...' : `${summary.profitMarginPct.toFixed(0)}% margin`}
                            </p>
                            <div className="mt-2">
                                <Badge variant="outline" className={profitBadge.className}>
                                    <profitBadge.Icon className="w-3.5 h-3.5 mr-1" />
                                    {profitBadge.label}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            <Activity className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '—' : fmtCurrency(summary.outstanding)}</div>
                            <p className="text-xs text-muted-foreground">Pending payments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Payment</CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '—' : fmtCurrency(summary.avgPayment)}</div>
                            <p className="text-xs text-muted-foreground">
                                {loading ? 'Loading...' : `${summary.paymentsCount} payment(s) • ${summary.expensesCount} expense(s)`}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Revenue vs Expenses</CardTitle>
                            <CardDescription>Financial performance trend for the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[360px]">
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Payment Method</CardTitle>
                            <CardDescription>How patients are paying.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[360px]">
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : breakdown.revenueByMethod.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip />
                                        <Pie data={breakdown.revenueByMethod} dataKey="total" nameKey="method" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                            {breakdown.revenueByMethod.map((_, idx) => (
                                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-sm text-muted-foreground">No revenue data.</div>
                            )}
                            {!loading && breakdown.revenueByMethod.length ? (
                                <div className="mt-3 space-y-1 text-sm">
                                    {breakdown.revenueByMethod.slice(0, 5).map((r, idx) => (
                                        <div key={r.method} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                <span className="text-muted-foreground">{paymentMethodLabel[r.method] || r.method}</span>
                                            </div>
                                            <span className="font-medium">{fmtCurrency(r.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expenses by Category</CardTitle>
                            <CardDescription>Where money is being spent.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[320px]">
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : breakdown.expensesByCategory.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={breakdown.expensesByCategory.slice(0, 10)} layout="vertical" margin={{ left: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="category" width={110} tickFormatter={(v) => expenseCategoryLabel[String(v)] || String(v)} />
                                        <Tooltip formatter={(v: any) => fmtCurrency(Number(v || 0))} />
                                        <Bar dataKey="total" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-sm text-muted-foreground">No expenses data.</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Invoices by Status</CardTitle>
                            <CardDescription>Billing pipeline overview.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Count</TableHead>
                                                <TableHead className="text-right">Billed</TableHead>
                                                <TableHead className="text-right">Paid</TableHead>
                                                <TableHead className="text-right">Outstanding</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {breakdown.invoicesByStatus.length ? breakdown.invoicesByStatus.map((row) => (
                                                <TableRow key={row.status}>
                                                    <TableCell>
                                                        <Badge variant="outline" className={invoiceStatusBadge(row.status)}>
                                                            {row.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{row.count}</TableCell>
                                                    <TableCell className="text-right">{fmtCurrency(row.billed)}</TableCell>
                                                    <TableCell className="text-right">{fmtCurrency(row.paid)}</TableCell>
                                                    <TableCell className="text-right">{fmtCurrency(row.outstanding)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        No invoices found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Outstanding Invoices</CardTitle>
                            <CardDescription>Invoices with the highest remaining balances.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                                            </TableRow>
                                        ) : breakdown.topOutstandingInvoices.length ? breakdown.topOutstandingInvoices.map((inv) => (
                                            <TableRow key={inv.invoiceNumber}>
                                                <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                                <TableCell>{inv.patientName || '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={invoiceStatusBadge(inv.status)}>
                                                        {inv.status}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground mt-1">{fmtDate(inv.invoiceDate)}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{fmtCurrency(inv.balance)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No outstanding invoices.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest payments and expenses recorded.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium mb-2">Recent Payments</div>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">Loading...</TableCell>
                                                </TableRow>
                                            ) : recent.payments.length ? recent.payments.map((p) => (
                                                <TableRow key={p.paymentId || p._id}>
                                                    <TableCell>
                                                        <div className="font-medium">{p.paymentId || '—'}</div>
                                                        <div className="text-xs text-muted-foreground">{fmtDate(p.paymentDate)}</div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{paymentMethodLabel[p.paymentMethod] || p.paymentMethod}</TableCell>
                                                    <TableCell className="text-right font-medium">{fmtCurrency(Number(p.amount || 0))}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">No payments.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium mb-2">Recent Expenses</div>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Expense</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">Loading...</TableCell>
                                                </TableRow>
                                            ) : recent.expenses.length ? recent.expenses.map((e) => (
                                                <TableRow key={e.expenseId || e._id}>
                                                    <TableCell>
                                                        <div className="font-medium">{e.expenseId || '—'}</div>
                                                        <div className="text-xs text-muted-foreground">{fmtDate(e.expenseDate)}</div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{expenseCategoryLabel[e.category] || e.category}</TableCell>
                                                    <TableCell className="text-right font-medium">{fmtCurrency(Number(e.amount || 0))}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">No expenses.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
