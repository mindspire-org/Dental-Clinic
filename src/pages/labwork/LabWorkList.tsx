import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { dentistsApi, labTestTemplatesApi, labWorkApi, patientsApi } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface LabWork {
    _id: string;
    patient: {
        _id?: string;
        firstName: string;
        lastName: string;
    };
    dentist?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
    };
    labName: string;
    workType: string;
    description: string;
    requestDate: string;
    expectedDate?: string;
    completedDate?: string;
    status: 'requested' | 'in-progress' | 'completed' | 'delivered' | 'cancelled';
    cost?: number;
    trackingNumber?: string;
    notes?: string;
    createdAt?: string;
}

interface OptionItem {
    _id: string;
    firstName?: string;
    lastName?: string;
}

type LabTestTemplate = {
    _id: string;
    name: string;
    labName?: string;
    workType: string;
    description?: string;
    defaultCost?: number;
    isActive?: boolean;
};

type LabWorkRow = {
    _id: string;
    patientName: string;
    dentistName: string;
    workType: string;
    labName: string;
    status: string;
    expectedDate?: string;
    cost: number;
    raw: LabWork;
};

export default function LabWorkList() {
    const navigate = useNavigate();
    const [labWorks, setLabWorks] = useState<LabWork[]>([]);
    const [patients, setPatients] = useState<OptionItem[]>([]);
    const [dentists, setDentists] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [authMissing, setAuthMissing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [selectedLabWork, setSelectedLabWork] = useState<LabWork | null>(null);
    const [templates, setTemplates] = useState<LabTestTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSaving, setTemplateSaving] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        labName: '',
        workType: 'other',
        description: '',
        defaultCost: '',
        isActive: true,
    });
    const [formData, setFormData] = useState({
        patientId: '',
        dentistId: 'auto',
        templateId: 'none',
        labName: '',
        workType: '',
        description: '',
        requestDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        completedDate: '',
        status: 'requested' as LabWork['status'],
        cost: '',
        trackingNumber: '',
        notes: '',
    });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setAuthMissing(true);
                setLoading(false);
                return;
            }

            setAuthMissing(false);

            try {
                setLoading(true);
                const results = await Promise.allSettled([
                    labWorkApi.getAll({ limit: 200 }),
                    patientsApi.getAll({ limit: 200 }),
                    dentistsApi.getAll({ isActive: true }),
                    labTestTemplatesApi.getAll({ isActive: true }),
                ]);

                if (!mounted) return;
                const lwRes = results[0].status === 'fulfilled' ? results[0].value : null;
                const patientsRes = results[1].status === 'fulfilled' ? results[1].value : null;
                const dentistsRes = results[2].status === 'fulfilled' ? results[2].value : null;
                const templatesRes = results[3].status === 'fulfilled' ? results[3].value : null;

                const lwList = (((lwRes as any)?.data?.labWorks || (lwRes as any)?.data?.labWork || []) as LabWork[]);
                setLabWorks(lwList);
                setPatients(((patientsRes as any)?.data?.patients || []) as OptionItem[]);
                setDentists(((dentistsRes as any)?.data?.dentists || []) as OptionItem[]);
                setTemplates((((templatesRes as any)?.data?.templates || []) as LabTestTemplate[]));

                if (results[0].status === 'rejected') toast.error((results[0] as any).reason?.message || 'Failed to load lab work');
                if (results[1].status === 'rejected') toast.error((results[1] as any).reason?.message || 'Failed to load patients');
                if (results[2].status === 'rejected') toast.error((results[2] as any).reason?.message || 'Failed to load dentists');
                if (results[3].status === 'rejected') toast.error((results[3] as any).reason?.message || 'Failed to load lab templates');
            } catch (e: any) {
                if (!mounted) return;
                console.error('Error fetching lab works:', e);
                toast.error(e?.message || 'Failed to load lab work');
                setLabWorks([]);
                setPatients([]);
                setDentists([]);
                setTemplates([]);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await labTestTemplatesApi.getAll({ isActive: true });
            setTemplates(res?.data?.templates || []);
        } catch (e: any) {
            console.error('Failed to load templates', e);
            setTemplates([]);
        }
    };

    const openNewTemplate = () => {
        setTemplateForm({
            name: '',
            labName: formData.labName || '',
            workType: (formData.workType || 'other') as any,
            description: formData.description || '',
            defaultCost: formData.cost || '',
            isActive: true,
        });
        setShowTemplateModal(true);
    };

    const handleSaveTemplate = async () => {
        const name = String(templateForm.name || '').trim();
        if (!name) {
            toast.error('Template name is required');
            return;
        }
        if (!templateForm.workType) {
            toast.error('Work type is required');
            return;
        }

        try {
            setTemplateSaving(true);
            await labTestTemplatesApi.create({
                name,
                labName: templateForm.labName,
                workType: templateForm.workType,
                description: templateForm.description,
                defaultCost: templateForm.defaultCost !== '' ? Number(templateForm.defaultCost) : 0,
                isActive: templateForm.isActive,
            });
            toast.success('Template saved');
            setShowTemplateModal(false);
            await fetchTemplates();
        } catch (e: any) {
            console.error('Failed to save template', e);
            toast.error(e?.message || 'Failed to save template');
        } finally {
            setTemplateSaving(false);
        }
    };

    const fetchLabWorks = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setAuthMissing(true);
            return;
        }
        const lwRes = await labWorkApi.getAll({ limit: 200 });
        const lwList = (lwRes?.data?.labWorks || lwRes?.data?.labWork || []) as LabWork[];
        setLabWorks(lwList);
    };

    const openCreate = () => {
        setSelectedLabWork(null);
        setEditId(null);
        setFormData({
            patientId: '',
            dentistId: 'auto',
            templateId: 'none',
            labName: '',
            workType: '',
            description: '',
            requestDate: new Date().toISOString().split('T')[0],
            expectedDate: '',
            completedDate: '',
            status: 'requested',
            cost: '',
            trackingNumber: '',
            notes: '',
        });
        setShowModal(true);
    };

    const openEdit = (labWork: LabWork) => {
        setSelectedLabWork(labWork);
        setEditId(labWork._id);
        setFormData({
            patientId: labWork.patient?._id || '',
            dentistId: labWork.dentist?._id || 'auto',
            templateId: 'none',
            labName: labWork.labName || '',
            workType: labWork.workType || '',
            description: labWork.description || '',
            requestDate: labWork.requestDate ? labWork.requestDate.split('T')[0] : new Date().toISOString().split('T')[0],
            expectedDate: labWork.expectedDate ? labWork.expectedDate.split('T')[0] : '',
            completedDate: labWork.completedDate ? labWork.completedDate.split('T')[0] : '',
            status: labWork.status || 'requested',
            cost: (labWork.cost ?? '').toString(),
            trackingNumber: labWork.trackingNumber || '',
            notes: labWork.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (labWork: LabWork) => {
        setSelectedLabWork(labWork);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.patientId) {
            toast.error('Please select patient');
            return;
        }
        if (!formData.labName.trim()) {
            toast.error('Lab name is required');
            return;
        }
        if (!formData.workType) {
            toast.error('Work type is required');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Description is required');
            return;
        }

        const payload: any = {
            patient: formData.patientId,
            labName: formData.labName.trim(),
            workType: formData.workType,
            description: formData.description.trim(),
            status: formData.status,
            requestDate: formData.requestDate ? new Date(formData.requestDate).toISOString() : undefined,
            expectedDate: formData.expectedDate ? new Date(formData.expectedDate).toISOString() : undefined,
            completedDate: formData.completedDate ? new Date(formData.completedDate).toISOString() : undefined,
            cost: formData.cost !== '' ? parseFloat(formData.cost) : undefined,
            trackingNumber: formData.trackingNumber.trim() || undefined,
            notes: formData.notes.trim() || undefined,
        };
        if (formData.dentistId && formData.dentistId !== 'auto') payload.dentist = formData.dentistId;

        try {
            setSaving(true);
            if (editId) {
                await labWorkApi.update(editId, payload);
                toast.success('Lab work updated');
            } else {
                await labWorkApi.create(payload);
                toast.success('Lab work created');
            }
            setShowModal(false);
            setEditId(null);
            await fetchLabWorks();
        } catch (e: any) {
            console.error('Error saving lab work:', e);
            toast.error(e?.message || 'Failed to save lab work');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedLabWork?._id) return;
        try {
            setDeleting(true);
            await labWorkApi.delete(selectedLabWork._id);
            toast.success('Lab work deleted');
            setShowDeleteDialog(false);
            setSelectedLabWork(null);
            await fetchLabWorks();
        } catch (e: any) {
            console.error('Error deleting lab work:', e);
            toast.error(e?.message || 'Failed to delete lab work');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            requested: 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            delivered: 'bg-teal-100 text-teal-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || colors.requested;
    };

    const rows: LabWorkRow[] = useMemo(() => {
        return (labWorks || []).map((lw) => {
            const patientName = `${lw.patient?.firstName || ''} ${lw.patient?.lastName || ''}`.trim() || 'Unknown Patient';
            const dentistName = `${lw.dentist?.firstName || ''} ${lw.dentist?.lastName || ''}`.trim();
            return {
                _id: lw._id,
                patientName,
                dentistName: dentistName ? `Dr. ${dentistName}` : '-',
                workType: lw.workType,
                labName: lw.labName,
                status: lw.status,
                expectedDate: lw.expectedDate,
                cost: lw.cost ?? 0,
                raw: lw,
            };
        });
    }, [labWorks]);

    const columns: ColumnDef<LabWorkRow>[] = [
        {
            accessorKey: 'patientName',
            header: 'Patient',
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.patientName}
                </div>
            ),
        },
        {
            accessorKey: 'workType',
            header: 'Work Type',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.workType.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'labName',
            header: 'Lab',
            cell: ({ row }) => <span className="text-sm">{row.original.labName}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={getStatusColor(row.original.status)}>
                    {row.original.status.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'expectedDate',
            header: 'Expected',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3" />
                    {row.original.expectedDate ? new Date(row.original.expectedDate).toLocaleDateString() : '-'}
                </div>
            ),
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            cell: ({ row }) => (
                <span className="font-medium">${(row.original.cost || 0).toFixed(2)}</span>
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
                        onClick={() => openEdit(row.original.raw)}
                    >
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
                    description="Please login to view lab work, patients, and dentists."
                    action={{
                        label: 'Go to Login',
                        onClick: () => navigate('/login'),
                    }}
                />
            </DashboardLayout>
        );
    }

    const totalCost = labWorks.reduce((sum, lw) => sum + (lw.cost || 0), 0);
    const requestedCount = labWorks.filter(lw => lw.status === 'requested').length;
    const completedCount = labWorks.filter(lw => lw.status === 'completed' || lw.status === 'delivered').length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Lab Work</h1>
                        <p className="text-muted-foreground">Manage laboratory work orders</p>
                    </div>
                    <Button onClick={openCreate} className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        New Lab Work
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{labWorks.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Requested</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{requestedCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {rows.length === 0 ? (
                            <EmptyState
                                title="No lab work found"
                                description="Get started by creating your first lab work order"
                                action={{ label: 'Create Lab Work', onClick: openCreate }}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={rows}
                                searchKey="patientName"
                                searchPlaceholder="Search lab work..."
                            />
                        )}
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={editId ? 'Edit Lab Work' : 'New Lab Work'}
                    description={editId ? 'Update lab work details' : 'Create a new lab work order'}
                    onSubmit={handleSubmit}
                    isLoading={saving}
                    size="xl"
                >
                    <div className="grid gap-4">
                        {!editId ? (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Lab Test Template (optional)</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={openNewTemplate}>
                                        New Template
                                    </Button>
                                </div>
                                <Select
                                    value={formData.templateId}
                                    onValueChange={(value) => {
                                        if (value === 'none') {
                                            setFormData((prev) => ({ ...prev, templateId: 'none' }));
                                            return;
                                        }
                                        const tpl = (templates || []).find((t) => t._id === value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            templateId: value,
                                            labName: tpl?.labName || prev.labName,
                                            workType: tpl?.workType || prev.workType,
                                            description: tpl?.description || prev.description,
                                            cost: typeof tpl?.defaultCost === 'number' ? String(tpl.defaultCost) : prev.cost,
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No template</SelectItem>
                                        {templates.map((t) => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

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
                                <Label htmlFor="labName">Lab Name *</Label>
                                <Input
                                    id="labName"
                                    value={formData.labName}
                                    onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                                    placeholder="e.g., Smile Lab"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Work Type *</Label>
                                <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="crown">Crown</SelectItem>
                                        <SelectItem value="bridge">Bridge</SelectItem>
                                        <SelectItem value="denture">Denture</SelectItem>
                                        <SelectItem value="implant">Implant</SelectItem>
                                        <SelectItem value="veneer">Veneer</SelectItem>
                                        <SelectItem value="retainer">Retainer</SelectItem>
                                        <SelectItem value="mouthguard">Mouthguard</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Work description..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="requestDate">Request Date</Label>
                                <Input
                                    id="requestDate"
                                    type="date"
                                    value={formData.requestDate}
                                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expectedDate">Expected Date</Label>
                                <Input
                                    id="expectedDate"
                                    type="date"
                                    value={formData.expectedDate}
                                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="completedDate">Completed Date</Label>
                                <Input
                                    id="completedDate"
                                    type="date"
                                    value={formData.completedDate}
                                    onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="requested">Requested</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cost">Cost</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="trackingNumber">Tracking Number</Label>
                                <Input
                                    id="trackingNumber"
                                    value={formData.trackingNumber}
                                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </div>
                    </div>
                </FormModal>

                <FormModal
                    open={showTemplateModal}
                    onOpenChange={setShowTemplateModal}
                    title="New Lab Test Template"
                    description="Create a template once, then assign it to any patient"
                    onSubmit={handleSaveTemplate}
                    isLoading={templateSaving}
                    size="lg"
                >
                    <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Template Name *</Label>
                                <Input
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    placeholder="e.g., Veneer standard"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lab Name</Label>
                                <Input
                                    value={templateForm.labName}
                                    onChange={(e) => setTemplateForm({ ...templateForm, labName: e.target.value })}
                                    placeholder="e.g., Smile Lab"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Work Type *</Label>
                                <Select value={templateForm.workType} onValueChange={(v) => setTemplateForm({ ...templateForm, workType: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="crown">Crown</SelectItem>
                                        <SelectItem value="bridge">Bridge</SelectItem>
                                        <SelectItem value="denture">Denture</SelectItem>
                                        <SelectItem value="implant">Implant</SelectItem>
                                        <SelectItem value="veneer">Veneer</SelectItem>
                                        <SelectItem value="retainer">Retainer</SelectItem>
                                        <SelectItem value="mouthguard">Mouthguard</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Cost</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={templateForm.defaultCost}
                                    onChange={(e) => setTemplateForm({ ...templateForm, defaultCost: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={templateForm.description}
                                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                placeholder="Template description..."
                                rows={3}
                            />
                        </div>
                    </div>
                </FormModal>

                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Lab Work"
                    description="Are you sure you want to delete this lab work order? This action cannot be undone."
                    isLoading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
