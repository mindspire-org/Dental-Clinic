import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle2, AlertCircle, XCircle, Users } from 'lucide-react';
import { appointmentsApi, dentistsApi } from '@/lib/api';

type Appointment = {
    _id: string;
    patient: { firstName: string; lastName: string; phone?: string };
    dentist: { _id?: string; firstName: string; lastName: string };
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
};

type Dentist = {
    _id: string;
    firstName?: string;
    lastName?: string;
    specialization?: string;
    isActive?: boolean;
};

export default function Schedule() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [loading, setLoading] = useState(true);

    const timeSlots = useMemo(() => {
        return Array.from({ length: 18 }, (_, i) => {
            const minutes = (8 * 60) + i * 30;
            const h = String(Math.floor(minutes / 60)).padStart(2, '0');
            const m = String(minutes % 60).padStart(2, '0');
            return `${h}:${m}`;
        });
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [apptsRes, dentistsRes] = await Promise.allSettled([
                    appointmentsApi.getAll({ date: selectedDate, limit: 200 }),
                    dentistsApi.getAll({ isActive: true, limit: 200 }),
                ]);

                setAppointments(apptsRes.status === 'fulfilled' ? (apptsRes.value.data.appointments || []) : []);
                setDentists(dentistsRes.status === 'fulfilled' ? (dentistsRes.value.data.dentists || []) : []);
            } catch {
                setAppointments([]);
                setDentists([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedDate]);

    const normalizeStatus = (status: string) => status.replace('-', '_');
    const normalizeType = (type: string) => type.replace('-', '_');

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status: string) => {
        const s = normalizeStatus(status);
        if (s === 'confirmed') return { variant: 'default' as const, className: 'bg-primary text-primary-foreground' };
        if (s === 'in_progress') return { variant: 'default' as const, className: 'bg-warning text-warning-foreground' };
        if (s === 'scheduled') return { variant: 'outline' as const, className: '' };
        if (s === 'completed') return { variant: 'secondary' as const, className: '' };
        return { variant: 'secondary' as const, className: '' };
    };

    const findAppointmentForSlot = (slot: string) => {
        return appointments.find((a) => a.startTime === slot);
    };

    const statusCounts = appointments.reduce((acc, a) => {
        const key = normalizeStatus(a.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const onDutyDentists = useMemo(() => {
        const dentistBusy = new Map<string, boolean>();
        appointments.forEach((a) => {
            const id = a.dentist?._id;
            if (!id) return;
            const s = normalizeStatus(a.status);
            if (['scheduled', 'confirmed', 'in_progress'].includes(s)) {
                dentistBusy.set(id, true);
            }
        });

        const list = (dentists || [])
            .filter((d) => d.isActive !== false)
            .map((d) => ({
                ...d,
                busy: Boolean(dentistBusy.get(d._id)),
            }))
            .sort((a: any, b: any) => Number(b.busy) - Number(a.busy));

        return list.slice(0, 4);
    }, [appointments, dentists]);

    const getInitials = (d: Dentist) => {
        const f = (d.firstName || '').trim();
        const l = (d.lastName || '').trim();
        return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'DR';
    };

    const summaryCards = [
        {
            title: 'Total',
            value: loading ? '-' : String(appointments.length),
            icon: Users,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'Confirmed',
            value: loading ? '-' : String(statusCounts.confirmed || 0),
            icon: CheckCircle2,
            className: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
            iconClassName: 'text-success',
        },
        {
            title: 'Scheduled',
            value: loading ? '-' : String(statusCounts.scheduled || 0),
            icon: AlertCircle,
            className: 'bg-gradient-to-br from-warning/15 to-warning/5 border-warning/20',
            iconClassName: 'text-warning',
        },
        {
            title: 'Completed',
            value: loading ? '-' : String(statusCounts.completed || 0),
            icon: CheckCircle2,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'Cancelled/No-show',
            value: loading ? '-' : String((statusCounts.cancelled || 0) + (statusCounts.no_show || 0)),
            icon: XCircle,
            className: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
            iconClassName: 'text-destructive',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Daily Schedule</h1>
                        <p className="text-muted-foreground">Today's appointments and timeline</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="h-8 w-[140px] bg-transparent border-0 p-0 focus-visible:ring-0"
                            />
                        </Button>
                        <Button
                            className="gradient-primary shadow-glow"
                            onClick={() => navigate(`/appointments?new=1&date=${encodeURIComponent(selectedDate)}`)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Appointment
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {summaryCards.map((c) => (
                        <Card key={c.title} className={`shadow-card border ${c.className}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">{c.title}</div>
                                        <div className="text-2xl font-bold text-foreground mt-1">{c.value}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-background/60 border flex items-center justify-center">
                                        <c.icon className={`w-5 h-5 ${c.iconClassName}`} />
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    {selectedDate}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Appointments Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {timeSlots.map((slot) => {
                                    const apt = findAppointmentForSlot(slot);
                                    return (
                                        <div key={slot} className="flex gap-4 group">
                                            <div className="w-20 text-sm font-medium text-muted-foreground pt-2">{formatTime(slot)}</div>
                                            <div className="flex-1 min-h-[80px] border-l-2 border-border pl-4 pb-4 relative">
                                                <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-border group-hover:bg-primary transition-colors"></div>
                                                {apt ? (
                                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h3 className="font-semibold text-primary">{apt.patient.firstName} {apt.patient.lastName}</h3>
                                                            <Badge {...getStatusBadge(apt.status)}>{normalizeStatus(apt.status).replace('_', ' ')}</Badge>
                                                        </div>
                                                        <div className="text-sm text-foreground/80 flex gap-4">
                                                            <span className="capitalize">{normalizeType(apt.type).replace('_', ' ')}</span>
                                                            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="h-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm hover:border-primary/30 hover:text-primary/70 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/appointments?new=1&date=${encodeURIComponent(selectedDate)}`)}
                                                    >
                                                        Available Slot
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total Appointments</span>
                                    <span className="font-bold text-foreground">{loading ? '-' : appointments.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                                    <span className="text-sm text-success">Completed</span>
                                    <span className="font-bold text-success">
                                        {loading ? '-' : appointments.filter(a => normalizeStatus(a.status) === 'completed').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                                    <span className="text-sm text-warning">Pending</span>
                                    <span className="font-bold text-warning">
                                        {loading ? '-' : appointments.filter(a => ['scheduled', 'confirmed', 'in_progress'].includes(normalizeStatus(a.status))).length}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="text-base">Doctors On Duty</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {loading ? (
                                    <div className="text-sm text-muted-foreground">Loading...</div>
                                ) : onDutyDentists.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No doctors found.</div>
                                ) : (
                                    onDutyDentists.map((d: any) => (
                                        <div key={d._id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                {getInitials(d)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Dr. {`${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Dentist'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(d.specialization || 'General')} • {d.busy ? 'Busy' : 'Available'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
