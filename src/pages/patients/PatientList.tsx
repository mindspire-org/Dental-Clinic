import { useState, useEffect } from 'react';
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
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Phone, Mail, Calendar, Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { patientsApi } from '@/lib/api';
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
        try {
            const res = await patientsApi.getById(patient._id);
            setViewPatient(res.data.patient);
        } catch (error) {
            setViewError(error instanceof Error ? error.message : 'Failed to load patient');
        } finally {
            setViewLoading(false);
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            <div className="flex items-center justify-between gap-4">
                                <span>Patient Details</span>
                                {viewPatient?.isActive !== undefined && (
                                    <Badge variant={viewPatient.isActive ? 'default' : 'secondary'}>
                                        {viewPatient.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                )}
                            </div>
                        </DialogTitle>
                        <DialogDescription>Patient profile and basic information</DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border bg-card/50">
                        <div className="p-4 border-b gradient-primary text-primary-foreground rounded-t-lg">
                            <div className="text-lg font-semibold">
                                {viewPatient ? `${viewPatient.firstName} ${viewPatient.lastName}` : 'Loading...'}
                            </div>
                            <div className="text-sm opacity-90">ID: {viewPatient?._id || '-'}</div>
                        </div>
                        <div className="p-4">
                            {viewLoading ? (
                                <LoadingState type="cards" rows={3} />
                            ) : viewError ? (
                                <div className="text-sm text-destructive">{viewError}</div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Phone</div>
                                        <div className="font-medium">{viewPatient?.phone || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Email</div>
                                        <div className="font-medium">{viewPatient?.email || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Gender</div>
                                        <div className="font-medium">{viewPatient?.gender || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Date of Birth</div>
                                        <div className="font-medium">
                                            {viewPatient?.dateOfBirth
                                                ? new Date(viewPatient.dateOfBirth).toLocaleDateString()
                                                : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Registered</div>
                                        <div className="font-medium">
                                            {viewPatient?.createdAt
                                                ? new Date(viewPatient.createdAt).toLocaleDateString()
                                                : '-'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
