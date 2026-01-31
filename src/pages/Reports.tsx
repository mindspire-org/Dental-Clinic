import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { reportsApi } from '@/lib/api';

const Reports = () => {
    const [reportPeriod, setReportPeriod] = useState('month');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        outstanding: 0,
        profitMarginPct: 0,
        revenueChangePct: 0,
    });
    const [revenueData, setRevenueData] = useState<Array<{ name: string; revenue: number; expenses: number }>>([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await reportsApi.getFinancial({ period: reportPeriod });
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
                });
                setRevenueData(Array.isArray(chart) ? chart : []);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load financial report');
                setRevenueData([]);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [reportPeriod]);

    const periodLabel = useMemo(() => {
        if (reportPeriod === 'week') return 'This Week';
        if (reportPeriod === 'year') return 'This Year';
        return 'This Month';
    }, [reportPeriod]);

    const fmtCurrency = (value: number) => {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
        } catch {
            return `$${Number(value || 0).toFixed(0)}`;
        }
    };

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

                {error ? (
                    <Card>
                        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
                    </Card>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
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
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Revenue vs Expenses</CardTitle>
                        <CardDescription>Monthly financial performance overview.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
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
            </div>
        </DashboardLayout>
    );
};

export default Reports;
