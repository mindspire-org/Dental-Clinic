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
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { inventoryApi } from '@/lib/api';

interface InventoryItem {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    price: number;
    supplier?: string;
}

export default function InventoryStock() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        reorderLevel: '',
        price: '',
        supplier: '',
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getAll();
            setItems(response.data.inventory || response.data.items);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setFormData({
            name: '',
            category: '',
            quantity: '',
            unit: '',
            reorderLevel: '',
            price: '',
            supplier: '',
        });
        setShowModal(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity.toString(),
            unit: item.unit,
            reorderLevel: item.reorderLevel.toString(),
            price: item.price.toString(),
            supplier: item.supplier || '',
        });
        setShowModal(true);
    };

    const handleDelete = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        try {
            const data = {
                ...formData,
                quantity: parseInt(formData.quantity),
                reorderLevel: parseInt(formData.reorderLevel),
                price: parseFloat(formData.price),
            };

            if (selectedItem) {
                await inventoryApi.update(selectedItem._id, data);
            } else {
                await inventoryApi.create(data);
            }
            setShowModal(false);
            fetchItems();
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedItem) return;
        try {
            await inventoryApi.delete(selectedItem._id);
            setShowDeleteDialog(false);
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const columns: ColumnDef<InventoryItem>[] = [
        {
            accessorKey: 'name',
            header: 'Item Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                        {row.original.category}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Stock',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                        {row.original.quantity} {row.original.unit}
                    </span>
                    {row.original.quantity <= row.original.reorderLevel && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'reorderLevel',
            header: 'Reorder Level',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.reorderLevel} {row.original.unit}
                </span>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }) => (
                <span className="font-medium">${row.original.price.toFixed(2)}</span>
            ),
        },
        {
            accessorKey: 'supplier',
            header: 'Supplier',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.supplier || '-'}</span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const isLow = row.original.quantity <= row.original.reorderLevel;
                return (
                    <Badge variant={isLow ? 'destructive' : 'default'}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                    </Badge>
                );
            },
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

    const lowStockItems = items.filter(item => item.quantity <= item.reorderLevel).length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Inventory Stock</h1>
                    <p className="text-muted-foreground">Manage dental supplies and materials</p>
                </div>
                <Button onClick={handleCreate} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{items.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
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
                            {new Set(items.map(i => i.category)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {items.length === 0 ? (
                        <EmptyState
                            title="No inventory items found"
                            description="Get started by adding your first inventory item"
                            action={{
                                label: 'Add Item',
                                onClick: handleCreate,
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={items}
                            searchKey="name"
                            searchPlaceholder="Search inventory..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <FormModal
                open={showModal}
                onOpenChange={setShowModal}
                title={selectedItem ? 'Edit Item' : 'New Item'}
                description={selectedItem ? 'Update inventory item' : 'Add a new inventory item'}
                onSubmit={handleSubmit}
                size="lg"
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Item Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Dental Gloves"
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
                                    <SelectItem value="consumables">Consumables</SelectItem>
                                    <SelectItem value="instruments">Instruments</SelectItem>
                                    <SelectItem value="materials">Materials</SelectItem>
                                    <SelectItem value="equipment">Equipment</SelectItem>
                                    <SelectItem value="medications">Medications</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit *</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pcs">Pieces</SelectItem>
                                    <SelectItem value="box">Box</SelectItem>
                                    <SelectItem value="pack">Pack</SelectItem>
                                    <SelectItem value="bottle">Bottle</SelectItem>
                                    <SelectItem value="kg">Kilogram</SelectItem>
                                    <SelectItem value="liter">Liter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reorderLevel">Reorder Level *</Label>
                            <Input
                                id="reorderLevel"
                                type="number"
                                value={formData.reorderLevel}
                                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price per Unit ($) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Input
                                id="supplier"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                placeholder="Supplier name"
                            />
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Item"
                description={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
            />
        </div>
    );
}
