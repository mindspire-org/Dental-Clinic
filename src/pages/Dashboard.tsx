import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    Users, Calendar, DollarSign, TrendingUp, Activity,
    UserPlus, Stethoscope, Pill, FlaskConical, Receipt,
    Clock, Phone, Mail, ArrowRight, Bell, FileText
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';

interface DashboardStats {
    totalPatients: number;
    appointmentsToday: number;
    monthlyRevenue: number;
    pendingPayments: number;

    newPatientsThisMonth?: number;
    newPatientsLastMonth?: number;
    patientsChangeCount?: number;
    pendingConfirmationsToday?: number;

    appointmentsThisMonth?: number;
    appointmentsLastMonth?: number;
    appointmentsChangeCount?: number;

    lastMonthRevenue?: number;
    revenueChangePercent?: number | null;
    avgDailyRevenue?: number;

    treatmentSuccessRate?: number | null;
    treatmentSuccessDelta?: number | null;
}

type RevenuePoint = {
    key: string;
    label: string;
    revenue: number;
    appointments: number;
};

type PatientFlowPoint = {
    key: string;
    label: string;
    checkIns: number;
    completions: number;
};

interface Appointment {
    _id: string;
    patient: {
        firstName: string;
        lastName: string;
        phone: string;
    };
    dentist: {
        firstName: string;
        lastName: string;
    };
    appointmentDate: string;
    startTime: string;
    type: string;
    status: string;
}

interface RecentActivity {
    _id: string;
    action: string;
    description: string;
    timestamp: string;
    type: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
    const [patientFlowSeries, setPatientFlowSeries] = useState<PatientFlowPoint[]>([]);
    const [loading, setLoading] = useState(true);

    const [revenuePeriod, setRevenuePeriod] = useState<'week' | 'month' | 'half-year' | 'year'>('year');
    const [flowPeriod, setFlowPeriod] = useState<'week' | 'month'>('week');

    useEffect(() => {
        fetchDashboardData();
    }, [flowPeriod, revenuePeriod]);

    const activitySeries = useMemo(() => {
        const days = 7;
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));

        const buckets = Array.from({ length: days }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return {
                key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                count: 0,
            };
        });

        for (const a of recentActivities) {
            const dt = new Date(a.timestamp);
            if (Number.isNaN(dt.getTime())) continue;
            if (dt < start) continue;

            const idx = Math.floor((dt.getTime() - start.getTime()) / 86400000);
            if (idx < 0 || idx >= buckets.length) continue;
            buckets[idx].count += 1;
        }
        return buckets;
    }, [recentActivities]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, appointmentsResponse, activitiesResponse, revenueChartResponse, patientFlowResponse] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getUpcomingAppointments(),
                dashboardApi.getRecentActivities(),
                dashboardApi.getRevenueChart(revenuePeriod),
                dashboardApi.getPatientFlow(flowPeriod),
            ]);
            setStats(statsResponse.data);
            setUpcomingAppointments(appointmentsResponse.data.appointments || []);
            setRecentActivities(activitiesResponse.data.activities || []);
            setRevenueSeries(revenueChartResponse.data.series || []);
            setPatientFlowSeries(patientFlowResponse.data.series || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingState type="cards" rows={6} />;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (value?: number | null) => {
        if (value == null || !Number.isFinite(value)) return '0%';
        const v = Math.round(value * 10) / 10;
        return `${v > 0 ? '+' : ''}${v}%`;
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatRelativeTime = (timestamp: string) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now.getTime() - activityTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            CREATE: 'bg-green-500',
            UPDATE: 'bg-blue-500',
            DELETE: 'bg-red-500',
            PAYMENT: 'bg-teal-500',
        };
        return colors[type] || 'bg-gray-500';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            confirmed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const quickActions = [
        {
            icon: UserPlus,
            title: 'New Patient',
            subtitle: 'Register patient',
            bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
            iconColor: 'text-blue-600',
            hoverColor: 'hover:from-blue-100 hover:to-blue-200',
            path: '/patients/new'
        },
        {
            icon: Calendar,
            title: 'Appointment',
            subtitle: 'Schedule visit',
            bgColor: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
            iconColor: 'text-cyan-600',
            hoverColor: 'hover:from-cyan-100 hover:to-cyan-200',
            path: '/appointments'
        },
        {
            icon: Stethoscope,
            title: 'Treatment',
            subtitle: 'Start treatment',
            bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100',
            iconColor: 'text-teal-600',
            hoverColor: 'hover:from-teal-100 hover:to-teal-200',
            path: '/treatments'
        },
        {
            icon: Pill,
            title: 'Prescription',
            subtitle: 'Write Rx',
            bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
            iconColor: 'text-purple-600',
            hoverColor: 'hover:from-purple-100 hover:to-purple-200',
            path: '/prescriptions'
        },
        {
            icon: FlaskConical,
            title: 'Lab Order',
            subtitle: 'Request lab work',
            bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100',
            iconColor: 'text-amber-600',
            hoverColor: 'hover:from-amber-100 hover:to-amber-200',
            path: '/lab-work'
        },
        {
            icon: Receipt,
            title: 'Invoice',
            subtitle: 'Create bill',
            bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
            iconColor: 'text-pink-600',
            hoverColor: 'hover:from-pink-100 hover:to-pink-200',
            path: '/billing'
        }
    ];

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Good afternoon, Dr.! 👋</h1>
                    <p className="text-sm text-gray-500 mt-1">Here's what's happening at your clinic today</p>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    📅 {currentDate}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action, index) => (
                    <Card
                        key={index}
                        className={`cursor-pointer border border-gray-200/70 hover:shadow-lg transition-all duration-300 border-l-4 ${action.iconColor.replace('text-', 'border-')} hover:scale-[1.03] ${action.bgColor} ${action.hoverColor}`}
                        onClick={() => navigate(action.path)}
                    >
                        <CardContent className="p-4 text-center">
                            <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm`}> 
                                <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                            </div>
                            <h3 className="font-semibold text-sm text-gray-800 mb-1">{action.title}</h3>
                            <p className="text-xs text-gray-500">{action.subtitle}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Today's Appointments */}
                <Card className="border border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 via-white to-cyan-100/40 border-l-4 border-l-cyan-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Today's Appointments
                            </CardTitle>
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl flex items-center justify-center shadow-sm">
                                <Calendar className="w-5 h-5 text-cyan-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">{stats?.appointmentsToday ?? 0}</div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stats?.appointmentsChangeCount != null ? `${stats.appointmentsChangeCount >= 0 ? '+' : ''}${stats.appointmentsChangeCount} vs last month` : '0 vs last month'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{stats?.pendingConfirmationsToday ?? 0} pending confirmations</p>
                    </CardContent>
                </Card>

                {/* Total Patients */}
                <Card className="border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-white to-blue-100/40 border-l-4 border-l-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Patients
                            </CardTitle>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">
                            {(stats?.totalPatients ?? 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stats?.patientsChangeCount != null ? `${stats.patientsChangeCount >= 0 ? '+' : ''}${stats.patientsChangeCount} vs last month` : '0 vs last month'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{stats?.newPatientsThisMonth ?? 0} new this month</p>
                    </CardContent>
                </Card>

                {/* Monthly Revenue */}
                <Card className="border border-teal-200/70 bg-gradient-to-br from-teal-50/80 via-white to-teal-100/40 border-l-4 border-l-teal-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Monthly Revenue
                            </CardTitle>
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center shadow-sm">
                                <DollarSign className="w-5 h-5 text-teal-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">
                            {formatCurrency(stats?.monthlyRevenue ?? 0)}
                        </div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {formatPercent(stats?.revenueChangePercent)} vs last month
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats?.avgDailyRevenue ?? 0)} avg per day</p>
                    </CardContent>
                </Card>

                {/* Treatment Success */}
                <Card className="border border-purple-200/70 bg-gradient-to-br from-purple-50/80 via-white to-purple-100/40 border-l-4 border-l-purple-500 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Treatment Success
                            </CardTitle>
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-800">
                            {stats?.treatmentSuccessRate == null ? '0%' : `${(Math.round(stats.treatmentSuccessRate * 10) / 10).toFixed(1)}%`}
                        </div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stats?.treatmentSuccessDelta == null ? '0% vs last month' : `${stats.treatmentSuccessDelta >= 0 ? '+' : ''}${(Math.round(stats.treatmentSuccessDelta * 10) / 10).toFixed(1)}% vs last month`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Based on completed vs cancelled treatments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Charts Column - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Overview */}
                    <Card className="border border-cyan-200/60 bg-gradient-to-br from-white via-white to-cyan-50/40 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-gray-800">Revenue Overview</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Monthly revenue and appointment trends</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${revenuePeriod === 'week' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setRevenuePeriod('week')}
                                    >
                                        7D
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${revenuePeriod === 'month' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setRevenuePeriod('month')}
                                    >
                                        1M
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${revenuePeriod === 'half-year' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setRevenuePeriod('half-year')}
                                    >
                                        6M
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${revenuePeriod === 'year' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setRevenuePeriod('year')}
                                    >
                                        1Y
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {revenueSeries.length === 0 ? (
                                <div className="h-64 rounded-xl border border-cyan-200/40 bg-white/60 p-3 flex items-center justify-center text-sm text-gray-400">
                                    No revenue data yet
                                </div>
                            ) : (
                                <div className="h-64 rounded-xl border border-cyan-200/40 bg-white/60 p-3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="dashRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="dashAppts" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                                    borderRadius: 12,
                                                    boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)',
                                                }}
                                                formatter={(value: any, name: any) => {
                                                    if (name === 'revenue') return [formatCurrency(Number(value || 0)), 'Revenue'];
                                                    if (name === 'appointments') return [Number(value || 0), 'Appointments'];
                                                    return [value, name];
                                                }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#dashRevenue)" />
                                            <Area type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} fill="url(#dashAppts)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Patient Flow */}
                    <Card className="border border-teal-200/60 bg-gradient-to-br from-white via-white to-teal-50/40 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold text-gray-800">Patient Flow</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Daily patient check-ins and completions</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${flowPeriod === 'week' ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setFlowPeriod('week')}
                                    >
                                        7D
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${flowPeriod === 'month' ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => setFlowPeriod('month')}
                                    >
                                        1M
                                    </button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/reports')}
                                        className="text-xs"
                                    >
                                        View Report
                                        <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {patientFlowSeries.length === 0 ? (
                                <div className="h-64 rounded-xl border border-teal-200/40 bg-white/60 p-3 flex items-center justify-center text-sm text-gray-400">
                                    No patient flow data yet
                                </div>
                            ) : (
                                <div className="h-64 rounded-xl border border-teal-200/40 bg-white/60 p-3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={patientFlowSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                                    borderRadius: 12,
                                                    boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)',
                                                }}
                                                formatter={(value: any, name: any) => {
                                                    if (name === 'checkIns') return [Number(value || 0), 'Check-ins'];
                                                    if (name === 'completions') return [Number(value || 0), 'Completions'];
                                                    return [value, name];
                                                }}
                                            />
                                            <Bar dataKey="checkIns" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Check-ins" />
                                            <Bar dataKey="completions" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Completions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 bg-gradient-to-br from-teal-500 to-teal-400 rounded-sm"></span>
                                    Check-ins
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-400 rounded-sm"></span>
                                    Completions
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar - Takes 1 column */}
                <div className="space-y-6">
                    {/* Upcoming Appointments */}
                    <Card className="border border-cyan-200/60 bg-gradient-to-br from-white via-white to-cyan-50/40 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-600" />
                                    Upcoming
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/appointments')}
                                    className="text-xs text-cyan-600 hover:text-cyan-700"
                                >
                                    View All
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No upcoming appointments</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingAppointments.slice(0, 4).map((appointment) => (
                                        <div
                                            key={appointment._id}
                                            className="p-3 rounded-lg border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all cursor-pointer group"
                                            onClick={() => navigate('/appointments')}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="font-medium text-sm text-gray-800">
                                                    {appointment.patient.firstName} {appointment.patient.lastName}
                                                </div>
                                                <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Stethoscope className="w-3 h-3" />
                                                    Dr. {appointment.dentist.firstName} {appointment.dentist.lastName}
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(appointment.startTime)}
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {appointment.patient.phone}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="border border-purple-200/60 bg-gradient-to-br from-white via-white to-purple-50/40 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                    Recent Activity
                                </CardTitle>
                                <Bell className="w-4 h-4 text-gray-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-24 rounded-xl border border-purple-200/40 bg-white/60 p-2 mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activitySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="dashActivity" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                                borderRadius: 12,
                                                boxShadow: '0 10px 30px rgba(2, 6, 23, 0.08)',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#dashActivity)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {recentActivities.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentActivities.slice(0, 5).map((activity) => (
                                        <div key={activity._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${getActivityColor(activity.type)}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-800 truncate">{activity.action}</div>
                                                <div className="text-xs text-gray-500 truncate">{activity.description}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {formatRelativeTime(activity.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
