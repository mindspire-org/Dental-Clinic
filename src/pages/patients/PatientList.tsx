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
import { Plus, Edit, Trash2, Eye, Phone, Mail, Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { patientsApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

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
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
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
                        onClick={() => navigate(`/patients/${row.original._id}`)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(row.original)}
                    >
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
        return <LoadingState type="table" rows={10} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Patients</h1>
                    <p className="text-muted-foreground">Manage patient records and information</p>
                </div>
                <Button onClick={handleCreate} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Patient
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Patients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Patients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {patients.filter(p => p.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            New This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {patients.filter(p => {
                                const created = new Date(p.createdAt);
                                const now = new Date();
                                return created.getMonth() === now.getMonth() &&
                                    created.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Inactive
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {patients.filter(p => !p.isActive).length}
                        </div>
                    </CardContent>
                </Card>
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
        </div>
    );
}
