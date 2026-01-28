import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { labWorkApi } from '@/lib/api';

interface LabWork {
    _id: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    workType: string;
    laboratory: string;
    status: string;
    sentDate: string;
    expectedDate: string;
    receivedDate?: string;
    cost: number;
    notes?: string;
}

export default function LabWorkList() {
    const [labWorks, setLabWorks] = useState<LabWork[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedLabWork, setSelectedLabWork] = useState<LabWork | null>(null);
    const [formData, setFormData] = useState({
        patient: '',
        workType: '',
        laboratory: '',
        sentDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        cost: '',
        notes: '',
    });

    useEffect(() => {
        fetchLabWorks();
    }, []);

    const fetchLabWorks = async () => {
        try {
            setLoading(true);
            const response = await labWorkApi.getAll();
            setLabWorks(response.data.labWorks || response.data.labWork);
        } catch (error) {
            console.error('Error fetching lab works:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedLabWork(null);
        setFormData({
            patient: '',
            workType: '',
            laboratory: '',
            sentDate: new Date().toISOString().split('T')[0],
            expectedDate: '',
            cost: '',
            notes: '',
        });
        setShowModal(true);
    };

    const handleEdit = (labWork: LabWork) => {
        setSelectedLabWork(labWork);
        setFormData({
            patient: labWork.patient.firstName,
            workType: labWork.workType,
            laboratory: labWork.laboratory,
            sentDate: labWork.sentDate.split('T')[0],
            expectedDate: labWork.expectedDate.split('T')[0],
            cost: labWork.cost.toString(),
            notes: labWork.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = (labWork: LabWork) => {
        setSelectedLabWork(labWork);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        try {
            const data = {
                ...formData,
                cost: parseFloat(formData.cost),
            };

            if (selectedLabWork) {
                await labWorkApi.update(selectedLabWork._id, data);
            } else {
                await labWorkApi.create(data);
            }
            setShowModal(false);
            fetchLabWorks();
        } catch (error) {
            console.error('Error saving lab work:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedLabWork) return;
        try {
            await labWorkApi.delete(selectedLabWork._id);
            setShowDeleteDialog(false);
            fetchLabWorks();
        } catch (error) {
            console.error('Error deleting lab work:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            delivered: 'bg-teal-100 text-teal-800',
        };
        return colors[status] || colors.pending;
    };

    const columns: ColumnDef<LabWork>[] = [
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
            accessorKey: 'workType',
            header: 'Work Type',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.workType.replace('_', ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'laboratory',
            header: 'Laboratory',
            cell: ({ row }) => <span className="text-sm">{row.original.laboratory}</span>,
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
                    {new Date(row.original.expectedDate).toLocaleDateString()}
                </div>
            ),
        },
        {
            accessorKey: 'cost',
            header: 'Cost',
            cell: ({ row }) => (
                <span className="font-medium">${row.original.cost.toFixed(2)}</span>
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

    const totalCost = labWorks.reduce((sum, lw) => sum + lw.cost, 0);
    const pendingCount = labWorks.filter(lw => lw.status === 'pending').length;
    const completedCount = labWorks.filter(lw => lw.status === 'completed' || lw.status === 'delivered').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Lab Work</h1>
                    <p className="text-muted-foreground">Manage laboratory work orders</p>
                </div>
                <Button onClick={handleCreate} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Lab Work
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{labWorks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Cost
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {labWorks.length === 0 ? (
                        <EmptyState
                            title="No lab work found"
                            description="Get started by creating your first lab work order"
                            action={{
                                label: 'Create Lab Work',
                                onClick: handleCreate,
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={labWorks}
                            searchKey="workType"
                            searchPlaceholder="Search lab work..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <FormModal
                open={showModal}
                onOpenChange={setShowModal}
                title={selectedLabWork ? 'Edit Lab Work' : 'New Lab Work'}
                description={selectedLabWork ? 'Update lab work details' : 'Create a new lab work order'}
                onSubmit={handleSubmit}
                size="lg"
            >
                <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="workType">Work Type *</Label>
                            <Select
                                value={formData.workType}
                                onValueChange={(value) => setFormData({ ...formData, workType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="crown">Crown</SelectItem>
                                    <SelectItem value="bridge">Bridge</SelectItem>
                                    <SelectItem value="denture">Denture</SelectItem>
                                    <SelectItem value="implant">Implant</SelectItem>
                                    <SelectItem value="veneer">Veneer</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="laboratory">Laboratory *</Label>
                            <Input
                                id="laboratory"
                                value={formData.laboratory}
                                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                                placeholder="Lab name"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sentDate">Sent Date *</Label>
                            <Input
                                id="sentDate"
                                type="date"
                                value={formData.sentDate}
                                onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedDate">Expected Date *</Label>
                            <Input
                                id="expectedDate"
                                type="date"
                                value={formData.expectedDate}
                                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost ($) *</Label>
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

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Lab Work"
                description="Are you sure you want to delete this lab work order? This action cannot be undone."
            />
        </div>
    );
}
