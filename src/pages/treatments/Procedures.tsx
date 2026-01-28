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
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { treatmentsApi } from '@/lib/api';

interface Treatment {
    _id: string;
    name: string;
    category: string;
    description?: string;
    price: number;
    duration: number;
    isActive: boolean;
}

export default function TreatmentProcedures() {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        duration: '',
    });

    useEffect(() => {
        fetchTreatments();
    }, []);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const response = await treatmentsApi.getAll();
            setTreatments(response.data.treatments);
        } catch (error) {
            console.error('Error fetching treatments:', error);
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
        });
        setShowModal(true);
    };

    const handleDelete = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
            };

            if (selectedTreatment) {
                await treatmentsApi.update(selectedTreatment._id, data);
            } else {
                await treatmentsApi.create(data);
            }
            setShowModal(false);
            fetchTreatments();
        } catch (error) {
            console.error('Error saving treatment:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTreatment) return;
        try {
            await treatmentsApi.delete(selectedTreatment._id);
            setShowDeleteDialog(false);
            fetchTreatments();
        } catch (error) {
            console.error('Error deleting treatment:', error);
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
                    {row.original.category.replace('_', ' ')}
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
                    <h1 className="text-3xl font-bold">Treatment Procedures</h1>
                    <p className="text-muted-foreground">Manage treatment types and pricing</p>
                </div>
                <Button onClick={handleCreate} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Treatment
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Treatments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{treatments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {treatments.filter(t => t.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Price
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${(treatments.reduce((sum, t) => sum + t.price, 0) / treatments.length || 0).toFixed(0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(treatments.map(t => t.category)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {treatments.length === 0 ? (
                        <EmptyState
                            title="No treatments found"
                            description="Get started by adding your first treatment procedure"
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
                            searchPlaceholder="Search treatments..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <FormModal
                open={showModal}
                onOpenChange={setShowModal}
                title={selectedTreatment ? 'Edit Treatment' : 'New Treatment'}
                description={selectedTreatment ? 'Update treatment information' : 'Add a new treatment procedure'}
                onSubmit={handleSubmit}
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
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="preventive">Preventive</SelectItem>
                                    <SelectItem value="restorative">Restorative</SelectItem>
                                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                                    <SelectItem value="orthodontics">Orthodontics</SelectItem>
                                    <SelectItem value="surgery">Surgery</SelectItem>
                                    <SelectItem value="endodontics">Endodontics</SelectItem>
                                    <SelectItem value="periodontics">Periodontics</SelectItem>
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
                title="Delete Treatment"
                description={`Are you sure you want to delete ${selectedTreatment?.name}? This action cannot be undone.`}
            />
        </div>
    );
}
