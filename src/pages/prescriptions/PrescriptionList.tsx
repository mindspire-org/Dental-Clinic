import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Plus, Edit, Trash2, Pill, Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { prescriptionsApi } from '@/lib/api';

interface Prescription {
    _id: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    dentist: {
        firstName: string;
        lastName: string;
    };
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
    }>;
    notes?: string;
    createdAt: string;
}

export default function PrescriptionList() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await prescriptionsApi.getAll();
            setPrescriptions(response.data.prescriptions);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPrescription) return;
        try {
            await prescriptionsApi.delete(selectedPrescription._id);
            setShowDeleteDialog(false);
            fetchPrescriptions();
        } catch (error) {
            console.error('Error deleting prescription:', error);
        }
    };

    const columns: ColumnDef<Prescription>[] = [
        {
            accessorKey: 'patient',
            header: 'Patient',
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.patient.firstName} {row.original.patient.lastName}
                </div>
            ),
        },
        {
            accessorKey: 'dentist',
            header: 'Prescribed By',
            cell: ({ row }) => (
                <div className="text-sm">
                    Dr. {row.original.dentist.firstName} {row.original.dentist.lastName}
                </div>
            ),
        },
        {
            accessorKey: 'medications',
            header: 'Medications',
            cell: ({ row }) => (
                <div className="space-y-1">
                    {row.original.medications.slice(0, 2).map((med, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <Pill className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{med.name}</span>
                            <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                        </div>
                    ))}
                    {row.original.medications.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                            +{row.original.medications.length - 2} more
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
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
                    <h1 className="text-3xl font-bold">Prescriptions</h1>
                    <p className="text-muted-foreground">Manage patient prescriptions</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Prescription
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Prescriptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{prescriptions.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {prescriptions.filter(p => {
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
                            Total Medications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {prescriptions.reduce((sum, p) => sum + p.medications.length, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg per Prescription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {prescriptions.length > 0
                                ? (prescriptions.reduce((sum, p) => sum + p.medications.length, 0) / prescriptions.length).toFixed(1)
                                : 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {prescriptions.length === 0 ? (
                        <EmptyState
                            title="No prescriptions found"
                            description="Get started by creating your first prescription"
                            action={{
                                label: 'Create Prescription',
                                onClick: () => setShowModal(true),
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={prescriptions}
                            searchKey="patient"
                            searchPlaceholder="Search prescriptions..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Prescription"
                description="Are you sure you want to delete this prescription? This action cannot be undone."
            />
        </div>
    );
}
