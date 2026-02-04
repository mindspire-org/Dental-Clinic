import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, ClipboardList, CreditCard, Edit, Eye, FileText, FlaskConical, Mail, Phone, Pill, Plus, Receipt, Stethoscope, TestTube, Trash2, UserCheck, UserPlus, Users, UserX, X } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { billingApi, documentsApi, labWorkApi, patientsApi, prescriptionsApi } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Patient {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email?: string;
    isActive: boolean;
    createdAt: string;
}

export default function PatientList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [viewPatient, setViewPatient] = useState<Patient | null>(null);
    const [viewHistoryLoading, setViewHistoryLoading] = useState(false);
    const [viewHistoryError, setViewHistoryError] = useState<string | null>(null);
    const [viewAppointments, setViewAppointments] = useState<any[]>([]);
    const [viewTreatments, setViewTreatments] = useState<any[]>([]);
    const [viewBills, setViewBills] = useState<any[]>([]);
    const [viewPayments, setViewPayments] = useState<any[]>([]);
    const [viewDocuments, setViewDocuments] = useState<any[]>([]);
    const [viewLabWorks, setViewLabWorks] = useState<any[]>([]);
    const [viewPrescriptions, setViewPrescriptions] = useState<any[]>([]);
    const [externalQuery, setExternalQuery] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        const q = (searchParams.get('q') || '').trim();
        setExternalQuery(q);
    }, [searchParams]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await patientsApi.getAll();
            setPatients(response.data.patients);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const historyItems = useMemo(() => {
        const items: Array<{ key: string; date: string; type: string; title: string; meta?: string }> = [];

        (viewAppointments || []).forEach((a: any) => {
            const dentist = a?.dentist ? `${a.dentist.firstName || ''} ${a.dentist.lastName || ''}`.trim() : '';
            const date = a?.appointmentDate || a?.createdAt;
            items.push({
                key: `appt_${a._id}`,
                date,
                type: 'Visit',
                title: `${String(a?.type || 'appointment').replace('_', ' ')} • ${String(a?.status || '').replace('_', ' ')}`,
                meta: `${new Date(a?.appointmentDate).toLocaleDateString()}${a?.startTime ? ` • ${a.startTime}` : ''}${dentist ? ` • Dr. ${dentist}` : ''}`,
            });
        });

        (viewTreatments || []).forEach((t: any) => {
            const dentist = t?.dentist ? `${t.dentist.firstName || ''} ${t.dentist.lastName || ''}`.trim() : '';
            const date = t?.startDate || t?.createdAt;
            const teeth = Array.isArray(t?.teeth) && t.teeth.length ? ` • Teeth: ${t.teeth.join(', ')}` : '';
            items.push({
                key: `tr_${t._id}`,
                date,
                type: 'Treatment',
                title: `${t?.procedure?.name || t?.description || t?.treatmentType || 'Treatment'} • ${String(t?.status || '').replace('_', ' ')}`,
                meta: `${date ? new Date(date).toLocaleDateString() : '-'}${dentist ? ` • Dr. ${dentist}` : ''}${teeth}`,
            });
        });

        (viewBills || []).forEach((b: any) => {
            const date = b?.createdAt || b?.issueDate;
            items.push({
                key: `inv_${b._id}`,
                date,
                type: 'Invoice',
                title: `${b?.invoiceNumber || 'Invoice'} • ${String(b?.status || '').replace('_', ' ')}`,
                meta: `${date ? new Date(date).toLocaleDateString() : '-'} • Total: ${Number(b?.total || 0)}`,
            });
        });

        (viewPayments || []).forEach((p: any) => {
            const date = p?.paymentDate || p?.createdAt;
            items.push({
                key: `pay_${p._id}`,
                date,
                type: 'Payment',
                title: `${Number(p?.amount || 0)} • ${p?.paymentMethod || ''}`.trim(),
                meta: `${date ? new Date(date).toLocaleDateString() : '-'}${p?.invoice?.invoiceNumber ? ` • ${p.invoice.invoiceNumber}` : ''}`,
            });
        });

        (viewLabWorks || []).forEach((l: any) => {
            const date = l?.requestDate || l?.createdAt;
            const dentist = l?.dentist ? `${l.dentist.firstName || ''} ${l.dentist.lastName || ''}`.trim() : '';
            const cost = typeof l?.cost === 'number' ? ` • Cost: ${Number(l.cost)}` : '';
            items.push({
                key: `lab_${l._id}`,
                date,
                type: 'Lab',
                title: `${l?.workType || 'Lab Work'} • ${l?.status || ''}`.trim(),
                meta: `${date ? new Date(date).toLocaleDateString() : '-'}${l?.labName ? ` • ${l.labName}` : ''}${dentist ? ` • Dr. ${dentist}` : ''}${cost}`,
            });
        });

        (viewPrescriptions || []).forEach((r: any) => {
            const date = r?.prescriptionDate || r?.createdAt;
            const dentist = r?.dentist ? `${r.dentist.firstName || ''} ${r.dentist.lastName || ''}`.trim() : '';
            items.push({
                key: `rx_${r._id}`,
                date,
                type: 'Rx',
                title: `${r?.prescriptionNumber || 'Prescription'} • ${r?.status || ''}`.trim(),
                meta: `${date ? new Date(date).toLocaleDateString() : '-'}${dentist ? ` • Dr. ${dentist}` : ''}`,
            });
        });

        (viewDocuments || []).forEach((d: any) => {
            const date = d?.uploadDate || d?.createdAt;
            const uploader = d?.uploadedBy ? `${d.uploadedBy.firstName || ''} ${d.uploadedBy.lastName || ''}`.trim() : '';
            items.push({
                key: `doc_${d._id}`,
                date,
                type: 'Document',
                title: d?.title || 'Document',
                meta: `${date ? new Date(date).toLocaleDateString() : '-'}${d?.category ? ` • ${d.category}` : ''}${uploader ? ` • By ${uploader}` : ''}`,
            });
        });

        return items
            .filter((x) => x.date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [viewAppointments, viewTreatments, viewBills, viewPayments, viewDocuments, viewLabWorks, viewPrescriptions]);

    const lastVisitDate = useMemo(() => {
        const apptDates = (viewAppointments || []).map((a: any) => a?.appointmentDate).filter(Boolean);
        if (apptDates.length === 0) return null;
        const latest = apptDates
            .map((d: string) => new Date(d).getTime())
            .sort((a, b) => b - a)[0];
        return Number.isFinite(latest) ? new Date(latest).toISOString() : null;
    }, [viewAppointments]);

    const patientAge = useMemo(() => {
        const dob = viewPatient?.dateOfBirth;
        if (!dob) return null;
        const d = new Date(dob);
        if (Number.isNaN(d.getTime())) return null;
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
        return age >= 0 ? age : null;
    }, [viewPatient?.dateOfBirth]);

    const getInitials = (p?: Patient | null) => {
        const f = String(p?.firstName || '').trim();
        const l = String(p?.lastName || '').trim();
        const s = `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();
        return s || 'P';
    };

    const historyTypeMeta = (type: string) => {
        const t = String(type || '').toLowerCase();
        if (t === 'visit') return { icon: Calendar, badge: 'secondary' as const };
        if (t === 'treatment') return { icon: Stethoscope, badge: 'default' as const };
        if (t === 'lab') return { icon: TestTube, badge: 'outline' as const };
        if (t === 'rx') return { icon: Pill, badge: 'outline' as const };
        if (t === 'invoice') return { icon: Receipt, badge: 'secondary' as const };
        if (t === 'payment') return { icon: CreditCard, badge: 'secondary' as const };
        if (t === 'document') return { icon: FileText, badge: 'secondary' as const };
        return { icon: ClipboardList, badge: 'secondary' as const };
    };

    const handleCreate = () => {
        setSelectedPatient(null);
        setFormData({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: '',
            phone: '',
            email: '',
        });
        setShowModal(true);
    };

    const handleEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setFormData({
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth.split('T')[0],
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email || '',
        });
        setShowModal(true);
    };

    const handleDelete = (patient: Patient) => {
        setSelectedPatient(patient);
        setShowDeleteDialog(true);
    };

    const handleView = async (patient: Patient) => {
        setShowViewDialog(true);
        setViewLoading(true);
        setViewError(null);
        setViewPatient(null);
        setViewHistoryLoading(true);
        setViewHistoryError(null);
        setViewAppointments([]);
        setViewTreatments([]);
        setViewBills([]);
        setViewPayments([]);
        setViewDocuments([]);
        setViewLabWorks([]);
        setViewPrescriptions([]);
        try {
            const res = await patientsApi.getById(patient._id);
            setViewPatient(res.data.patient);

            const [apptsRes, trRes, billsRes, paysRes, docsRes, labRes, rxRes] = await Promise.all([
                patientsApi.getAppointments(patient._id),
                patientsApi.getTreatments(patient._id),
                patientsApi.getBilling(patient._id),
                billingApi.getPayments({ patientId: patient._id }),
                documentsApi.getAll({ patientId: patient._id }),
                labWorkApi.getAll({ patientId: patient._id, limit: 100 }),
                prescriptionsApi.getAll({ patientId: patient._id, limit: 100 }),
            ]);

            setViewAppointments(apptsRes?.data?.appointments || []);
            setViewTreatments(trRes?.data?.treatments || []);
            setViewBills(billsRes?.data?.bills || []);
            setViewPayments(paysRes?.data?.payments || []);
            setViewDocuments(docsRes?.data?.documents || []);
            setViewLabWorks(labRes?.data?.labWorks || []);
            setViewPrescriptions(rxRes?.data?.prescriptions || []);
        } catch (error) {
            setViewError(error instanceof Error ? error.message : 'Failed to load patient');
            setViewHistoryError(error instanceof Error ? error.message : 'Failed to load patient history');
        } finally {
            setViewLoading(false);
            setViewHistoryLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (selectedPatient) {
                await patientsApi.update(selectedPatient._id, formData);
            } else {
                await patientsApi.create(formData);
            }
            setShowModal(false);
            fetchPatients();
        } catch (error) {
            console.error('Error saving patient:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedPatient) return;
        try {
            await patientsApi.delete(selectedPatient._id);
            setShowDeleteDialog(false);
            fetchPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const columns: ColumnDef<Patient>[] = [
        {
            accessorKey: 'firstName',
            header: 'Patient Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">
                        {row.original.firstName} {row.original.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {calculateAge(row.original.dateOfBirth)} years old
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'gender',
            header: 'Gender',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.gender}
                </Badge>
            ),
        },
        {
            accessorKey: 'phone',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Registered',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            handleView(row.original);
                        }}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row.original);
                        }}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row.original);
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <LoadingState type="table" rows={10} />;
    }

    const now = new Date();
    const totalPatients = patients.length;
    const activePatients = patients.filter((p) => p.isActive).length;
    const inactivePatients = patients.filter((p) => !p.isActive).length;
    const newThisMonth = patients.filter((p) => {
        const created = new Date(p.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    const summaryCards = [
        {
            title: 'Total Patients',
            value: totalPatients,
            icon: Users,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'Active',
            value: activePatients,
            icon: UserCheck,
            className: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
            iconClassName: 'text-success',
        },
        {
            title: 'New This Month',
            value: newThisMonth,
            icon: UserPlus,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'Inactive',
            value: inactivePatients,
            icon: UserX,
            className: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
            iconClassName: 'text-destructive',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Patients</h1>
                    <p className="text-muted-foreground">Manage patient records and information</p>
                </div>
                <Button onClick={() => navigate('/patients/new')} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Patient
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                            <div className="text-xs text-muted-foreground mt-2">{now.toLocaleDateString()}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {patients.length === 0 ? (
                        <EmptyState
                            title="No patients found"
                            description="Get started by adding your first patient"
                            action={{
                                label: 'Add Patient',
                                onClick: handleCreate,
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={patients}
                            searchKey="firstName"
                            searchPlaceholder="Search patients..."
                            globalFilterValue={externalQuery}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <FormModal
                open={showModal}
                onOpenChange={setShowModal}
                title={selectedPatient ? 'Edit Patient' : 'New Patient'}
                description={selectedPatient ? 'Update patient information' : 'Add a new patient to the system'}
                onSubmit={handleSubmit}
                size="lg"
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="John"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john.doe@example.com"
                        />
                    </div>
                </div>
            </FormModal>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Patient"
                description={`Are you sure you want to delete ${selectedPatient?.firstName} ${selectedPatient?.lastName}? This action cannot be undone.`}
            />

            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-5xl" showClose={false}>
                    <DialogHeader>
                        <DialogTitle>
                            <div className="flex items-center justify-between gap-4">
                                <span>Patient Details</span>
                                <div className="flex items-center gap-2">
                                    {viewPatient?.isActive !== undefined && (
                                        <Badge variant={viewPatient.isActive ? 'default' : 'secondary'}>
                                            {viewPatient.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    )}
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </DialogClose>
                                </div>
                            </div>
                        </DialogTitle>
                        <DialogDescription>Patient profile and basic information</DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border bg-card/50 overflow-hidden">
                        <div className="p-4 sm:p-5 gradient-primary text-primary-foreground">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border border-white/20">
                                        <AvatarFallback className="bg-white/15 text-primary-foreground font-semibold">
                                            {getInitials(viewPatient)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-lg sm:text-xl font-semibold leading-tight">
                                            {viewPatient ? `${viewPatient.firstName} ${viewPatient.lastName}` : 'Loading...'}
                                        </div>
                                        <div className="text-xs sm:text-sm opacity-90">Patient ID: {viewPatient?._id || '-'}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {viewPatient?.phone ? (
                                        <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-white/20">
                                            <Phone className="w-3.5 h-3.5" />
                                            {viewPatient.phone}
                                        </Badge>
                                    ) : null}
                                    {viewPatient?.email ? (
                                        <Badge variant="secondary" className="bg-white/15 text-primary-foreground border-white/20">
                                            <Mail className="w-3.5 h-3.5" />
                                            {viewPatient.email}
                                        </Badge>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5">
                            {viewLoading ? (
                                <LoadingState type="cards" rows={3} />
                            ) : viewError ? (
                                <div className="text-sm text-destructive">{viewError}</div>
                            ) : (
                                <div className="grid gap-3 sm:gap-4">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Date of Birth</div>
                                            <div className="font-medium">
                                                {viewPatient?.dateOfBirth ? new Date(viewPatient.dateOfBirth).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Age</div>
                                            <div className="font-medium">{patientAge !== null ? `${patientAge} years` : '-'}</div>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Gender</div>
                                            <div className="font-medium">{viewPatient?.gender || '-'}</div>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Registered</div>
                                            <div className="font-medium">
                                                {viewPatient?.createdAt ? new Date(viewPatient.createdAt).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Total Visits</div>
                                            <div className="text-lg font-semibold">{viewAppointments.length}</div>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Procedures</div>
                                            <div className="text-lg font-semibold">{viewTreatments.length}</div>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <div className="text-xs text-muted-foreground">Last Visit</div>
                                            <div className="font-medium">
                                                {lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="pt-4">
                        {viewHistoryLoading ? (
                            <LoadingState type="table" rows={6} />
                        ) : viewHistoryError ? (
                            <div className="text-sm text-destructive">{viewHistoryError}</div>
                        ) : (
                            <Tabs defaultValue="appointments" className="w-full">
                                <div className="w-full overflow-x-auto">
                                    <TabsList className="w-max justify-start">
                                        <TabsTrigger value="history">History ({historyItems.length})</TabsTrigger>
                                        <TabsTrigger value="appointments">Visits ({viewAppointments.length})</TabsTrigger>
                                        <TabsTrigger value="treatments">Procedures ({viewTreatments.length})</TabsTrigger>
                                        <TabsTrigger value="lab">Lab ({viewLabWorks.length})</TabsTrigger>
                                        <TabsTrigger value="prescriptions">Rx ({viewPrescriptions.length})</TabsTrigger>
                                        <TabsTrigger value="documents">Documents ({viewDocuments.length})</TabsTrigger>
                                        <TabsTrigger value="billing">Invoices ({viewBills.length})</TabsTrigger>
                                        <TabsTrigger value="payments">Payments ({viewPayments.length})</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="history">
                                    {historyItems.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No history found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-3">
                                                {historyItems.map((h) => {
                                                    const meta = historyTypeMeta(h.type);
                                                    const Icon = meta.icon;
                                                    return (
                                                        <div key={h.key} className="rounded-xl border bg-background">
                                                            <div className="p-3 sm:p-4">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-0.5 h-9 w-9 rounded-full border bg-muted flex items-center justify-center">
                                                                        <Icon className="h-4 w-4 text-foreground/80" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <Badge variant={meta.badge}>{h.type}</Badge>
                                                                                    <div className="text-sm font-semibold truncate">{h.title}</div>
                                                                                </div>
                                                                                {h.meta ? (
                                                                                    <div className="text-xs text-muted-foreground mt-1 break-words">{h.meta}</div>
                                                                                ) : null}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                                                {h.date ? new Date(h.date).toLocaleDateString() : '-'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="appointments">
                                    {viewAppointments.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No appointments found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewAppointments.map((a: any) => (
                                                <div key={a._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                                {new Date(a.appointmentDate).toLocaleDateString()} {a.startTime ? `• ${a.startTime}` : ''}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Type: {a.type} • Status: {a.status}
                                                                {a?.dentist ? ` • Dr. ${(a.dentist.firstName || '')} ${(a.dentist.lastName || '')}` : ''}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">Visit</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="treatments">
                                    {viewTreatments.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No treatments found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewTreatments.map((t: any) => (
                                                <div key={t._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <Stethoscope className="w-4 h-4 text-muted-foreground" />
                                                                {t.procedure?.name || t.description || t.treatmentType}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Status: {t.status}
                                                                {t.startDate ? ` • Date: ${new Date(t.startDate).toLocaleDateString()}` : ''}
                                                                {t?.dentist ? ` • Dr. ${(t.dentist.firstName || '')} ${(t.dentist.lastName || '')}` : ''}
                                                                {Array.isArray(t?.teeth) && t.teeth.length ? ` • Teeth: ${t.teeth.join(', ')}` : ''}
                                                            </div>
                                                        </div>
                                                        <Badge>Procedure</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="billing">
                                    {viewBills.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No invoices found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewBills.map((b: any) => (
                                                <div key={b._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <Receipt className="w-4 h-4 text-muted-foreground" />
                                                                {b.invoiceNumber || 'Invoice'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Type: {String(b.invoiceType || '').toUpperCase()} • Status: {b.status} • Total: {Number(b.total || 0)}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">Invoice</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="payments">
                                    {viewPayments.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No payments found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewPayments.map((p: any) => (
                                                <div key={p._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                                                {Number(p.amount || 0)} • {p.paymentMethod}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Date: {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                                                                {p.invoice?.invoiceNumber ? ` • Invoice: ${p.invoice.invoiceNumber}` : ''}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">Payment</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="documents">
                                    {viewDocuments.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No documents found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewDocuments.map((d: any) => (
                                                <div key={d._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                                {d.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Category: {d.category || '-'}
                                                                {d.uploadDate ? ` • ${new Date(d.uploadDate).toLocaleDateString()}` : ''}
                                                            </div>
                                                        </div>
                                                        {d.fileUrl ? (
                                                            <Button type="button" variant="outline" size="sm" onClick={() => window.open(d.fileUrl, '_blank')}>
                                                                View
                                                            </Button>
                                                        ) : (
                                                            <Badge variant="secondary">No file</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="lab">
                                    {viewLabWorks.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No lab work found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewLabWorks.map((l: any) => (
                                                <div key={l._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <FlaskConical className="w-4 h-4 text-muted-foreground" />
                                                                {l.workType || 'Lab Work'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Status: {l.status}
                                                                {l.requestDate ? ` • Date: ${new Date(l.requestDate).toLocaleDateString()}` : ''}
                                                                {l?.labName ? ` • Lab: ${l.labName}` : ''}
                                                                {l?.dentist ? ` • Dr. ${(l.dentist.firstName || '')} ${(l.dentist.lastName || '')}` : ''}
                                                                {typeof l?.cost === 'number' ? ` • Cost: ${Number(l.cost)}` : ''}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">Lab</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>

                                <TabsContent value="prescriptions">
                                    {viewPrescriptions.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No prescriptions found.</div>
                                    ) : (
                                        <ScrollArea className="h-[42vh] pr-3">
                                            <div className="space-y-2">
                                            {viewPrescriptions.map((r: any) => (
                                                <div key={r._id} className="p-3 rounded-xl border bg-background">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-semibold flex items-center gap-2">
                                                                <Pill className="w-4 h-4 text-muted-foreground" />
                                                                {r.prescriptionNumber || 'Prescription'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Date: {r.prescriptionDate ? new Date(r.prescriptionDate).toLocaleDateString() : '-'} • Status: {r.status}
                                                                {r?.dentist ? ` • Dr. ${(r.dentist.firstName || '')} ${(r.dentist.lastName || '')}` : ''}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline">Rx</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
