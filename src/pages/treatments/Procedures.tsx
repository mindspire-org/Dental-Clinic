import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, DollarSign, Stethoscope, Layers, CheckCircle2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { treatmentProceduresApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Treatment {
    _id: string;
    name: string;
    category: string;
    description?: string;
    price: number;
    duration: number;
    sessions?: number;
    isActive: boolean;
}

const formatTitle = (value?: string) => {
    const v = String(value || '').trim();
    if (!v) return '-';
    return v
        .split('-')
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

export default function TreatmentProcedures() {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        duration: '',
        sessions: '1',
        isActive: 'true',
    });

    useEffect(() => {
        fetchTreatments();
    }, []);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const response = await treatmentProceduresApi.getAll();
            setTreatments(response.data.procedures);
        } catch (error) {
            console.error('Error fetching treatments:', error);
            toast.error('Failed to load treatment procedures');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedTreatment(null);
        setFormData({
            name: '',
            category: '',
            description: '',
            price: '',
            duration: '',
            sessions: '1',
            isActive: 'true',
        });
        setShowModal(true);
    };

    const handleEdit = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setFormData({
            name: treatment.name,
            category: treatment.category,
            description: treatment.description || '',
            price: treatment.price.toString(),
            duration: treatment.duration.toString(),
            sessions: String(treatment.sessions || 1),
            isActive: treatment.isActive ? 'true' : 'false',
        });
        setShowModal(true);
    };

    const handleDelete = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category || !formData.price || !formData.duration) {
            toast.error('Please fill in all required fields');
            return;
        }

        const price = Number(formData.price);
        const duration = Number(formData.duration);
        const sessions = Number(formData.sessions);
        if (!Number.isFinite(price) || price < 0 || !Number.isFinite(duration) || duration <= 0) {
            toast.error('Please enter valid price and duration');
            return;
        }
        if (!Number.isFinite(sessions) || sessions <= 0) {
            toast.error('Please enter valid sessions');
            return;
        }

        try {
            setSaving(true);
            const data = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                price,
                duration,
                sessions: Math.max(1, Math.round(sessions)),
                isActive: formData.isActive === 'true',
            };

            if (selectedTreatment) {
                await treatmentProceduresApi.update(selectedTreatment._id, data);
                toast.success('Treatment updated');
            } else {
                await treatmentProceduresApi.create(data);
                toast.success('Treatment created');
            }
            setShowModal(false);
            setSelectedTreatment(null);
            fetchTreatments();
        } catch (error: any) {
            console.error('Error saving treatment:', error);
            toast.error(error?.message || 'Failed to save treatment');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTreatment) return;
        try {
            setDeleting(true);
            await treatmentProceduresApi.delete(selectedTreatment._id);
            toast.success('Treatment deleted');
            setShowDeleteDialog(false);
            setSelectedTreatment(null);
            fetchTreatments();
        } catch (error: any) {
            console.error('Error deleting treatment:', error);
            toast.error(error?.message || 'Failed to delete treatment');
        } finally {
            setDeleting(false);
        }
    };

    const columns: ColumnDef<Treatment>[] = [
        {
            accessorKey: 'name',
            header: 'Treatment Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    {row.original.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                            {row.original.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {formatTitle(row.original.category)}
                </Badge>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 font-medium">
                    <DollarSign className="w-4 h-4" />
                    {row.original.price.toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: 'duration',
            header: 'Duration',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.duration} min</span>
            ),
        },
        {
            accessorKey: 'sessions',
            header: 'Sessions',
            cell: ({ row }) => (
                <span className="text-sm">{Math.max(1, Math.round(Number(row.original.sessions || 1)))} day(s)</span>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <Badge className={cn('font-medium', row.original.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
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

    const totalTreatments = treatments.length;
    const activeCount = treatments.filter(t => t.isActive).length;
    const avgPrice = (treatments.reduce((sum, t) => sum + (t.price || 0), 0) / (treatments.length || 1)) || 0;
    const categoriesCount = new Set(treatments.map(t => t.category)).size;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Treatment Procedures</h1>
                                <p className="text-muted-foreground">Manage procedure catalog, categories and pricing</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="gradient-primary text-primary-foreground shadow-glow">
                        <Plus className="w-4 h-4 mr-2" />
                        New Treatment
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-card hover-lift gradient-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{totalTreatments}</div>
                            <p className="text-xs text-muted-foreground mt-1">All procedures in catalog</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card hover-lift gradient-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success" /> Active
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{activeCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Available to use in plans</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card hover-lift gradient-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-info" /> Avg Price
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">${Math.round(avgPrice).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across all procedures</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card hover-lift gradient-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Layers className="w-4 h-4 text-warning" /> Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{categoriesCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Procedure groups</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card className="shadow-card">
                    <CardContent className="pt-6">
                        {loading ? (
                            <LoadingState type="table" rows={10} />
                        ) : treatments.length === 0 ? (
                            <EmptyState
                                title="No procedures found"
                                description="Add your first treatment procedure to start building treatment plans."
                                action={{
                                    label: 'Add Treatment',
                                    onClick: handleCreate,
                                }}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={treatments}
                                searchKey="name"
                                searchPlaceholder="Search procedures..."
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Modal */}
                <FormModal
                    open={showModal}
                    onOpenChange={(open) => {
                        setShowModal(open);
                        if (!open) setSelectedTreatment(null);
                    }}
                    title={selectedTreatment ? 'Edit Treatment' : 'New Treatment'}
                    description={selectedTreatment ? 'Update procedure information' : 'Add a new treatment procedure'}
                    onSubmit={handleSubmit}
                    submitLabel={selectedTreatment ? 'Update' : 'Create'}
                    isLoading={saving}
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Treatment Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Teeth Cleaning"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="category">Treatment Type *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select treatment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="filling">Filling</SelectItem>
                                        <SelectItem value="root-canal">Root Canal</SelectItem>
                                        <SelectItem value="crown">Crown</SelectItem>
                                        <SelectItem value="bridge">Bridge</SelectItem>
                                        <SelectItem value="extraction">Extraction</SelectItem>
                                        <SelectItem value="implant">Implant</SelectItem>
                                        <SelectItem value="dentures">Dentures</SelectItem>
                                        <SelectItem value="whitening">Whitening</SelectItem>
                                        <SelectItem value="braces">Braces</SelectItem>
                                        <SelectItem value="cleaning">Cleaning</SelectItem>
                                        <SelectItem value="scaling">Scaling</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="30"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sessions">Sessions (days) *</Label>
                                <Input
                                    id="sessions"
                                    type="number"
                                    min={1}
                                    value={formData.sessions}
                                    onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
                                    placeholder="1"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="150.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the treatment..."
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
                    isLoading={deleting}
                    title="Delete Treatment"
                    description={`Are you sure you want to delete ${selectedTreatment?.name}? This action cannot be undone.`}
                />
            </div>
        </DashboardLayout>
    );
}
