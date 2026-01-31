import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Pill, Calendar, Minus, PlusCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { dentistsApi, inventoryApi, patientsApi, prescriptionsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Prescription {
    _id: string;
    patient: {
        _id?: string;
        firstName: string;
        lastName: string;
    };
    dentist: {
        _id?: string;
        firstName: string;
        lastName: string;
    };
    prescriptionNumber?: string;
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;
    instructions?: string;
    status?: 'active' | 'completed' | 'cancelled';
    createdAt: string;
}

type InventoryItem = {
    _id: string;
    name: string;
    category: string;
    itemName?: string;
};

interface OptionItem {
    _id: string;
    firstName?: string;
    lastName?: string;
}

type PrescriptionRow = {
    _id: string;
    prescriptionNumber?: string;
    patientName: string;
    dentistName: string;
    medicationsCount: number;
    medicationsPreview: string;
    status: string;
    createdAt: string;
    raw: Prescription;
};

export default function PrescriptionList() {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [patients, setPatients] = useState<OptionItem[]>([]);
    const [dentists, setDentists] = useState<OptionItem[]>([]);
    const [inventoryMedications, setInventoryMedications] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [authMissing, setAuthMissing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [formData, setFormData] = useState({
        patientId: '',
        dentistId: 'auto',
        status: 'active' as 'active' | 'completed' | 'cancelled',
        instructions: '',
        medications: [
            { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
        ],
    });

    const extractDosageFromInventoryName = (itemName: string) => {
        const raw = String(itemName || '');
        const m = raw.match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g)\b/i);
        if (!m) return '';

        const value = Number(m[1]);
        const unit = String(m[2] || '').toLowerCase();

        if (!Number.isFinite(value) || value <= 0) return '';
        if (unit === 'mg') return `${value}mg`;
        if (unit === 'g') return `${Math.round(value * 1000)}mg`;
        if (unit === 'mcg') return `${Math.round(value / 1000)}mg`;
        return '';
    };

    const findInventoryMedicationByName = (name: string) => {
        const key = String(name || '').trim().toLowerCase();
        if (!key) return null;
        return inventoryMedications.find((it) => String(it.name || '').trim().toLowerCase() === key) || null;
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setAuthMissing(true);
                setLoading(false);
                return;
            }

            setAuthMissing(false);

            try {
                setLoading(true);
                const results = await Promise.allSettled([
                    prescriptionsApi.getAll({ limit: 200 }),
                    patientsApi.getAll({ limit: 200 }),
                    dentistsApi.getAll({ isActive: true }),
                    inventoryApi.getAll(),
                ]);
                if (!mounted) return;

                const rxRes = results[0].status === 'fulfilled' ? results[0].value : null;
                const patientsRes = results[1].status === 'fulfilled' ? results[1].value : null;
                const dentistsRes = results[2].status === 'fulfilled' ? results[2].value : null;
                const inventoryRes = results[3].status === 'fulfilled' ? results[3].value : null;

                setPrescriptions(((rxRes as any)?.data?.prescriptions || []) as Prescription[]);
                setPatients(((patientsRes as any)?.data?.patients || []) as OptionItem[]);
                setDentists(((dentistsRes as any)?.data?.dentists || []) as OptionItem[]);

                const rawInvItems = (((inventoryRes as any)?.data?.items || []) as any[]);
                const invItems: InventoryItem[] = rawInvItems
                    .map((it) => ({
                        _id: String(it?._id || ''),
                        name: String(it?.name || it?.itemName || '').trim(),
                        itemName: it?.itemName,
                        category: String(it?.category || '').trim(),
                    }))
                    .filter((it) => {
                        const c = String(it?.category || '').toLowerCase();
                        if (!it.name) return false;
                        return c === 'medications' || c === 'medicine' || c === 'medicines';
                    })
                    .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
                setInventoryMedications(invItems);

                if (results[0].status === 'rejected') toast.error((results[0] as any).reason?.message || 'Failed to load prescriptions');
                if (results[1].status === 'rejected') toast.error((results[1] as any).reason?.message || 'Failed to load patients');
                if (results[2].status === 'rejected') toast.error((results[2] as any).reason?.message || 'Failed to load dentists');
                if (results[3].status === 'rejected') toast.error((results[3] as any).reason?.message || 'Failed to load inventory');
            } catch (e: any) {
                if (!mounted) return;
                console.error('Error fetching prescriptions:', e);
                toast.error(e?.message || 'Failed to load prescriptions');
                setPrescriptions([]);
                setPatients([]);
                setDentists([]);
                setInventoryMedications([]);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const fetchPrescriptions = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setAuthMissing(true);
            return;
        }
        const rxRes = await prescriptionsApi.getAll({ limit: 200 });
        setPrescriptions((rxRes?.data?.prescriptions || []) as Prescription[]);
    };

    const openCreate = () => {
        setEditId(null);
        setSelectedPrescription(null);
        setFormData({
            patientId: '',
            dentistId: 'auto',
            status: 'active',
            instructions: '',
            medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        });
        setShowModal(true);
    };

    const openEdit = (rx: Prescription) => {
        setEditId(rx._id);
        setSelectedPrescription(rx);
        setFormData({
            patientId: rx.patient?._id || '',
            dentistId: rx.dentist?._id || 'auto',
            status: (rx.status || 'active') as 'active' | 'completed' | 'cancelled',
            instructions: rx.instructions || '',
            medications: (rx.medications && rx.medications.length > 0)
                ? rx.medications.map((m) => ({
                    name: m.name || '',
                    dosage: m.dosage || '',
                    frequency: m.frequency || '',
                    duration: m.duration || '',
                    instructions: m.instructions || '',
                }))
                : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        });
        setShowModal(true);
    };

    const handleDelete = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPrescription?._id) return;
        try {
            setDeleting(true);
            await prescriptionsApi.delete(selectedPrescription._id);
            toast.success('Prescription deleted');
            setShowDeleteDialog(false);
            setSelectedPrescription(null);
            await fetchPrescriptions();
        } catch (e: any) {
            console.error('Error deleting prescription:', e);
            toast.error(e?.message || 'Failed to delete prescription');
        } finally {
            setDeleting(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.patientId) {
            toast.error('Please select patient');
            return;
        }

        const cleanedMeds = formData.medications
            .map((m) => ({
                name: String(m.name || '').trim(),
                dosage: String(m.dosage || '').trim(),
                frequency: String(m.frequency || '').trim(),
                duration: String(m.duration || '').trim(),
                instructions: String(m.instructions || '').trim() || undefined,
            }))
            .filter((m) => m.name && m.dosage && m.frequency && m.duration);

        if (cleanedMeds.length === 0) {
            toast.error('Please add at least one medication (name, dosage, frequency, duration)');
            return;
        }

        const payload: any = {
            patient: formData.patientId,
            status: formData.status,
            instructions: formData.instructions || undefined,
            medications: cleanedMeds,
        };
        if (formData.dentistId && formData.dentistId !== 'auto') payload.dentist = formData.dentistId;

        try {
            setSaving(true);
            if (editId) {
                await prescriptionsApi.update(editId, payload);
                toast.success('Prescription updated');
            } else {
                await prescriptionsApi.create(payload);
                toast.success('Prescription created');
            }
            setShowModal(false);
            setEditId(null);
            await fetchPrescriptions();
        } catch (e: any) {
            console.error('Error saving prescription:', e);
            toast.error(e?.message || 'Failed to save prescription');
        } finally {
            setSaving(false);
        }
    };

    const rows: PrescriptionRow[] = useMemo(() => {
        return (prescriptions || []).map((rx) => {
            const patientName = `${rx.patient?.firstName || ''} ${rx.patient?.lastName || ''}`.trim() || 'Unknown Patient';
            const dentistName = `${rx.dentist?.firstName || ''} ${rx.dentist?.lastName || ''}`.trim();
            const medsPreview = (rx.medications || []).slice(0, 2).map((m) => m.name).filter(Boolean).join(', ');
            const status = rx.status || 'active';
            return {
                _id: rx._id,
                prescriptionNumber: rx.prescriptionNumber,
                patientName,
                dentistName: dentistName ? `Dr. ${dentistName}` : '-',
                medicationsCount: (rx.medications || []).length,
                medicationsPreview: medsPreview,
                status,
                createdAt: rx.createdAt,
                raw: rx,
            };
        });
    }, [prescriptions]);

    const columns: ColumnDef<PrescriptionRow>[] = [
        {
            accessorKey: 'patientName',
            header: 'Patient',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <div className="font-medium">{row.original.patientName}</div>
                    {row.original.prescriptionNumber && (
                        <div className="text-xs text-muted-foreground">{row.original.prescriptionNumber}</div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'dentistName',
            header: 'Prescribed By',
            cell: ({ row }) => <div className="text-sm">{row.original.dentistName}</div>,
        },
        {
            accessorKey: 'medicationsPreview',
            header: 'Medications',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Pill className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{row.original.medicationsPreview || '-'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{row.original.medicationsCount} items</span>
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
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
                    {String(row.original.status).replace('_', ' ')}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row.original.raw)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(row.original.raw)}
                    >
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    if (authMissing) {
        return (
            <DashboardLayout>
                <EmptyState
                    title="Login required"
                    description="Please login to view prescriptions, patients, and dentists."
                    action={{
                        label: 'Go to Login',
                        onClick: () => navigate('/login'),
                    }}
                />
            </DashboardLayout>
        );
    }

    const totalMeds = prescriptions.reduce((sum, p) => sum + (p.medications || []).length, 0);
    const now = new Date();
    const thisMonth = prescriptions.filter((p) => {
        const created = new Date(p.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Prescriptions</h1>
                        <p className="text-muted-foreground">Manage patient prescriptions</p>
                    </div>
                    <Button onClick={openCreate} className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        New Prescription
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prescriptions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{prescriptions.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{thisMonth}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Medications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalMeds}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Prescription</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {prescriptions.length > 0 ? (totalMeds / prescriptions.length).toFixed(1) : '0'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {rows.length === 0 ? (
                            <EmptyState
                                title="No prescriptions found"
                                description="Get started by creating your first prescription"
                                action={{ label: 'Create Prescription', onClick: openCreate }}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={rows}
                                searchKey="patientName"
                                searchPlaceholder="Search prescriptions..."
                            />
                        )}
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={editId ? 'Edit Prescription' : 'New Prescription'}
                    description={editId ? 'Update prescription details' : 'Create a new prescription'}
                    onSubmit={handleSubmit}
                    isLoading={saving}
                    size="xl"
                >
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Patient *</Label>
                                <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {`${p.firstName || ''} ${p.lastName || ''}`.trim() || p._id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Dentist</Label>
                                <Select value={formData.dentistId} onValueChange={(value) => setFormData({ ...formData, dentistId: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Auto assign" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto (logged-in dentist)</SelectItem>
                                        {dentists.map((d) => (
                                            <SelectItem key={d._id} value={d._id}>
                                                {`${d.firstName || ''} ${d.lastName || ''}`.trim() || d._id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>General Instructions</Label>
                            <Textarea
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                rows={3}
                                placeholder="Optional instructions..."
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Medications *</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFormData({
                                        ...formData,
                                        medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                                    })}
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" /> Add
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.medications.map((m, idx) => (
                                    <div key={idx} className="rounded-lg border p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium">Medication {idx + 1}</div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={formData.medications.length === 1}
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    medications: formData.medications.filter((_, i) => i !== idx),
                                                })}
                                            >
                                                <Minus className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Name *</Label>
                                                <Input
                                                    value={m.name}
                                                    onChange={(e) => {
                                                        const next = [...formData.medications];
                                                        const nextName = e.target.value;
                                                        const inv = findInventoryMedicationByName(nextName);
                                                        const dosageFromInv = inv ? extractDosageFromInventoryName(inv.name) : '';
                                                        next[idx] = {
                                                            ...next[idx],
                                                            name: nextName,
                                                            dosage: (next[idx].dosage ? next[idx].dosage : (dosageFromInv || next[idx].dosage)),
                                                        };
                                                        setFormData({ ...formData, medications: next });
                                                    }}
                                                    placeholder="e.g., Amoxicillin"
                                                    list="inventory-medications"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Dosage *</Label>
                                                <Input
                                                    value={m.dosage}
                                                    onChange={(e) => {
                                                        const next = [...formData.medications];
                                                        next[idx] = { ...next[idx], dosage: e.target.value };
                                                        setFormData({ ...formData, medications: next });
                                                    }}
                                                    placeholder="e.g., 500mg"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Frequency *</Label>
                                                <Input
                                                    value={m.frequency}
                                                    onChange={(e) => {
                                                        const next = [...formData.medications];
                                                        next[idx] = { ...next[idx], frequency: e.target.value };
                                                        setFormData({ ...formData, medications: next });
                                                    }}
                                                    placeholder="e.g., 2 times/day"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Duration *</Label>
                                                <Input
                                                    value={m.duration}
                                                    onChange={(e) => {
                                                        const next = [...formData.medications];
                                                        next[idx] = { ...next[idx], duration: e.target.value };
                                                        setFormData({ ...formData, medications: next });
                                                    }}
                                                    placeholder="e.g., 5 days"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Medication Instructions</Label>
                                            <Input
                                                value={m.instructions}
                                                onChange={(e) => {
                                                    const next = [...formData.medications];
                                                    next[idx] = { ...next[idx], instructions: e.target.value };
                                                    setFormData({ ...formData, medications: next });
                                                }}
                                                placeholder="Optional instructions..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FormModal>

                <datalist id="inventory-medications">
                    {inventoryMedications.map((it) => (
                        <option key={it._id} value={it.name} />
                    ))}
                </datalist>

                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Prescription"
                    description="Are you sure you want to delete this prescription? This action cannot be undone."
                    isLoading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
