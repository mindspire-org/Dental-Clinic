import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users, Calendar, DollarSign, Clock,
    TrendingUp, Activity, Bell, FileText
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
    totalPatients: number;
    appointmentsToday: number;
    monthlyRevenue: number;
    pendingPayments: number;
}

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, appointmentsResponse, activitiesResponse] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getUpcomingAppointments(),
                dashboardApi.getRecentActivities(),
            ]);
            setStats(statsResponse.data);
            setUpcomingAppointments(appointmentsResponse.data.appointments);
            setRecentActivities(activitiesResponse.data.activities || []);
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
        }).format(amount);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Patients
                        </CardTitle>
                        <Users className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            Active patients in system
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Appointments Today
                        </CardTitle>
                        <Calendar className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.appointmentsToday || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Scheduled for today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Monthly Revenue
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(stats?.monthlyRevenue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            This month's earnings
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Payments
                        </CardTitle>
                        <FileText className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(stats?.pendingPayments || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <Activity className="w-3 h-3 inline mr-1" />
                            Outstanding balance
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Upcoming Appointments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No upcoming appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment) => (
                                    <div
                                        key={appointment._id}
                                        className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => navigate('/appointments')}
                                    >
                                        <div className="space-y-1">
                                            <div className="font-medium">
                                                {appointment.patient.firstName} {appointment.patient.lastName}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Dr. {appointment.dentist.firstName} {appointment.dentist.lastName}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {appointment.patient.phone}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <Badge variant="outline" className="capitalize">
                                                {appointment.type.replace('_', ' ')}
                                            </Badge>
                                            <div className="text-sm font-medium">
                                                {formatTime(appointment.startTime)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <button
                                onClick={() => navigate('/patients/new')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium">New Patient</div>
                                    <div className="text-sm text-muted-foreground">Register a new patient</div>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/appointments')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="font-medium">Book Appointment</div>
                                    <div className="text-sm text-muted-foreground">Schedule a new appointment</div>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/billing')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <div className="font-medium">Create Invoice</div>
                                    <div className="text-sm text-muted-foreground">Generate a new invoice</div>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/appointments')}
                                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <div className="font-medium">Send Reminder</div>
                                    <div className="text-sm text-muted-foreground">Send appointment reminders</div>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentActivities.slice(0, 5).map((activity) => (
                                <div key={activity._id} className="flex items-center gap-3 p-3 rounded-lg border">
                                    <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                                    <div className="flex-1">
                                        <div className="font-medium">{activity.action}</div>
                                        <div className="text-sm text-muted-foreground">{activity.description}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatRelativeTime(activity.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
