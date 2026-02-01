import { useRef, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { Plus, Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, AlertCircle, XCircle, Users } from 'lucide-react';
import { appointmentsApi, patientsApi, dentistsApi } from '@/lib/api';
import { useSearchParams } from 'react-router-dom';

interface Appointment {
    _id: string;
    patient: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
    dentist: {
        _id: string;
        firstName: string;
        lastName: string;
        checkupFee?: number;
    };
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    notes?: string;
}

interface DentistOption {
    _id: string;
    firstName?: string;
    lastName?: string;
    checkupFee?: number;
}

export default function AppointmentCalendar() {
    const [searchParams] = useSearchParams();
    const prefillHandledRef = useRef(false);
    const datePrefillHandledRef = useRef(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [dentists, setDentists] = useState<DentistOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        patient: '',
        dentist: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '09:30',
        type: 'checkup',
        status: 'scheduled',
        notes: '',
    });

    const selectedDentist = dentists.find((d) => d._id === formData.dentist);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    useEffect(() => {
        const date = searchParams.get('date');
        if (!date) return;
        if (datePrefillHandledRef.current) return;
        datePrefillHandledRef.current = true;
        setSelectedDate(date);
    }, [searchParams]);

    useEffect(() => {
        const patientId = searchParams.get('patientId');
        const openNew = searchParams.get('new') === '1';
        if (!patientId && !openNew) return;
        if (prefillHandledRef.current) return;
        prefillHandledRef.current = true;
        setSelectedAppointment(null);
        setFormData((prev) => ({
            ...prev,
            patient: patientId || '',
            appointmentDate: selectedDate,
        }));
        setShowModal(true);
    }, [searchParams, selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const appointmentsRes = await appointmentsApi.getAll({ date: selectedDate });
            setAppointments(appointmentsRes.data.appointments);

            const [patientsRes, staffRes] = await Promise.allSettled([
                patientsApi.getAll({ limit: 100 }),
                dentistsApi.getAll({ limit: 50 }),
            ]);

            setPatients(patientsRes.status === 'fulfilled' ? patientsRes.value.data.patients : []);
            setDentists(staffRes.status === 'fulfilled' ? staffRes.value.data.dentists : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedAppointment(null);
        setFormData({
            patient: '',
            dentist: '',
            appointmentDate: selectedDate,
            startTime: '09:00',
            endTime: '09:30',
            type: 'checkup',
            status: 'scheduled',
            notes: '',
        });
        setShowModal(true);
    };

    const handleEdit = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setFormData({
            patient: appointment.patient._id,
            dentist: appointment.dentist._id,
            appointmentDate: appointment.appointmentDate.split('T')[0],
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            type: appointment.type,
            status: appointment.status,
            notes: appointment.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (selectedAppointment) {
                await appointmentsApi.update(selectedAppointment._id, formData);
            } else {
                await appointmentsApi.create(formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving appointment:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedAppointment) return;
        try {
            await appointmentsApi.cancel(selectedAppointment._id, 'Cancelled by user');
            setShowDeleteDialog(false);
            fetchData();
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleStatusChange = async (appointmentId: string, action: 'confirm' | 'complete' | 'no-show') => {
        try {
            if (action === 'confirm') {
                await appointmentsApi.confirm(appointmentId);
            } else if (action === 'complete') {
                await appointmentsApi.complete(appointmentId);
            } else if (action === 'no-show') {
                await appointmentsApi.markNoShow(appointmentId);
            }
            fetchData();
        } catch (error) {
            console.error('Error updating appointment status:', error);
        }
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            no_show: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        };
        return colors[status] || colors.scheduled;
    };

    const timeSlots = Array.from({ length: 20 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = (i % 2) * 30;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    });

    const normalizeStatusKey = (status: string) => status.replace('-', '_');
    const statusCounts = appointments.reduce(
        (acc, a) => {
            const key = normalizeStatusKey(a.status);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    const summaryCards = [
        {
            title: 'Total',
            value: appointments.length,
            icon: Users,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'Confirmed',
            value: statusCounts.confirmed || 0,
            icon: CheckCircle2,
            className: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
            iconClassName: 'text-success',
        },
        {
            title: 'Scheduled',
            value: statusCounts.scheduled || 0,
            icon: AlertCircle,
            className: 'bg-gradient-to-br from-warning/15 to-warning/5 border-warning/20',
            iconClassName: 'text-warning',
        },
        {
            title: 'Completed',
            value: statusCounts.completed || 0,
            icon: CheckCircle2,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'Cancelled/No-show',
            value: (statusCounts.cancelled || 0) + (statusCounts.no_show || 0),
            icon: XCircle,
            className: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
            iconClassName: 'text-destructive',
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Appointment Calendar</h1>
                        <p className="text-muted-foreground">Manage and schedule appointments</p>
                    </div>
                    <Button onClick={handleCreate} className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        New Appointment
                    </Button>
                </div>

                {/* Summary Cards */}
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

                {/* Date Selector */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label htmlFor="date">Select Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{appointments.length} appointments</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments Grid */}
                <div className="grid gap-4">
                    {appointments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No appointments scheduled for this date</p>
                                <Button onClick={handleCreate} className="mt-4 gradient-primary">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Schedule Appointment
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        appointments.map((appointment) => (
                            <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Badge className={getStatusColor(appointment.status)}>
                                                    {appointment.status.replace('_', ' ')}
                                                </Badge>
                                                <Badge variant="outline" className="capitalize">
                                                    {appointment.type.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">
                                                            {appointment.patient.firstName} {appointment.patient.lastName}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {appointment.patient.phone}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">
                                                            Dr. {appointment.dentist.firstName} {appointment.dentist.lastName}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Dentist</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                                </span>
                                            </div>

                                            {appointment.notes && (
                                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                                    {appointment.notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            {appointment.status === 'scheduled' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusChange(appointment._id, 'confirm')}
                                                >
                                                    Confirm
                                                </Button>
                                            )}
                                            {appointment.status === 'confirmed' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleStatusChange(appointment._id, 'complete')}
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleStatusChange(appointment._id, 'no-show')}
                                                    >
                                                        No Show
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(appointment)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(appointment)}
                                                className="text-destructive"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedAppointment ? 'Edit Appointment' : 'New Appointment'}
                    description={selectedAppointment ? 'Update appointment details' : 'Schedule a new appointment'}
                    onSubmit={handleSubmit}
                    size="lg"
                >
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="patient">Patient *</Label>
                                <Select
                                    value={formData.patient}
                                    onValueChange={(value) => setFormData({ ...formData, patient: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((patient) => (
                                            <SelectItem key={patient._id} value={patient._id}>
                                                {patient.firstName} {patient.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dentist">Dentist *</Label>
                                <Select
                                    value={formData.dentist}
                                    onValueChange={(value) => setFormData({ ...formData, dentist: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select dentist" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dentists.map((dentist) => (
                                            <SelectItem key={dentist._id} value={dentist._id}>
                                                Dr. {dentist.firstName} {dentist.lastName}
                                                {typeof dentist.checkupFee === 'number' ? ` - $${dentist.checkupFee.toLocaleString()}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedDentist && typeof selectedDentist.checkupFee === 'number' && (
                                    <div className="text-xs text-muted-foreground">
                                        Dentist checkup fee: <span className="font-medium text-foreground">${selectedDentist.checkupFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="appointmentDate">Date *</Label>
                                <Input
                                    id="appointmentDate"
                                    type="date"
                                    value={formData.appointmentDate}
                                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time *</Label>
                                <Select
                                    value={formData.startTime}
                                    onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {formatTime(time)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time *</Label>
                                <Select
                                    value={formData.endTime}
                                    onValueChange={(value) => setFormData({ ...formData, endTime: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {formatTime(time)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">Appointment Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="checkup">Checkup</SelectItem>
                                        <SelectItem value="cleaning">Cleaning</SelectItem>
                                        <SelectItem value="filling">Filling</SelectItem>
                                        <SelectItem value="extraction">Extraction</SelectItem>
                                        <SelectItem value="root_canal">Root Canal</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="no_show">No Show</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes or instructions..."
                                rows={3}
                            />
                        </div>
                    </div>
                </FormModal>

                {/* Delete Dialog */}
                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Cancel Appointment"
                    description={`Are you sure you want to cancel this appointment with ${selectedAppointment?.patient.firstName} ${selectedAppointment?.patient.lastName}?`}
                />
            </div>
        </DashboardLayout>
    );
}
