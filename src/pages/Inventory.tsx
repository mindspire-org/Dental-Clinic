import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormModal } from '@/components/shared/FormModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { inventoryApi } from '@/lib/api';
import { Search, Plus, Filter, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

type InventoryItem = {
    _id: string;
    name: string;
    sku?: string;
    category: string;
    quantity: number;
    reorderLevel: number;
    unit: string;
    supplier?: string;
    supplierContact?: string;
    supplierEmail?: string;
    supplierPhone?: string;
    location?: string;
    expiryDate?: string;
    lastRestocked?: string;
    notes?: string;
    price: number;
};

type InventoryOrder = {
    _id: string;
    orderDate: string;
    subtotal: number;
    status: string;
};

type SupplierRecord = {
    _id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
};

const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [orders, setOrders] = useState<InventoryOrder[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        quantity: '',
        reorderLevel: '',
        unit: '',
        supplier: '',
        supplierContact: '',
        supplierEmail: '',
        supplierPhone: '',
        location: '',
        expiryDate: '',
        notes: '',
        price: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, lowRes, ordersRes, suppliersRes] = await Promise.all([
                inventoryApi.getAll(),
                inventoryApi.getLowStock(),
                inventoryApi.orders.getAll(),
                inventoryApi.suppliers.getAll(),
            ]);

            setItems(itemsRes.data.items || []);
            setLowStockCount((lowRes.data.items || []).length);
            setOrders(ordersRes.data.orders || []);
            setSuppliers(suppliersRes.data.suppliers || []);
        } catch (e) {
            console.error('Error fetching inventory management data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedItem(null);
        setSelectedSupplierId('');
        setFormData({
            name: '',
            sku: '',
            category: '',
            quantity: '',
            reorderLevel: '',
            unit: '',
            supplier: '',
            supplierContact: '',
            supplierEmail: '',
            supplierPhone: '',
            location: '',
            expiryDate: '',
            notes: '',
            price: '',
        });
        setShowModal(true);
    };

    const handleSupplierSelect = (supplierId: string) => {
        setSelectedSupplierId(supplierId);
        if (!supplierId) return;
        const s = suppliers.find((x) => x._id === supplierId);
        if (!s) return;
        setFormData((prev) => ({
            ...prev,
            supplier: s.name || prev.supplier,
            supplierContact: s.contactPerson || prev.supplierContact,
            supplierEmail: s.email || prev.supplierEmail,
            supplierPhone: s.phone || prev.supplierPhone,
        }));
    };

    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        const match = suppliers.find((s) => String(s.name || '').trim().toLowerCase() === String(item.supplier || '').trim().toLowerCase());
        setSelectedSupplierId(match?._id || '');
        setFormData({
            name: item.name,
            sku: item.sku || '',
            category: item.category,
            quantity: String(item.quantity),
            reorderLevel: String(item.reorderLevel),
            unit: item.unit,
            supplier: item.supplier || '',
            supplierContact: item.supplierContact || '',
            supplierEmail: item.supplierEmail || '',
            supplierPhone: item.supplierPhone || '',
            location: item.location || '',
            expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : '',
            notes: item.notes || '',
            price: String(item.price),
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                name: formData.name,
                sku: formData.sku,
                category: formData.category,
                quantity: parseInt(formData.quantity, 10),
                reorderLevel: parseInt(formData.reorderLevel, 10),
                unit: formData.unit,
                supplier: formData.supplier,
                supplierContact: formData.supplierContact,
                supplierEmail: formData.supplierEmail,
                supplierPhone: formData.supplierPhone,
                location: formData.location,
                expiryDate: formData.expiryDate,
                notes: formData.notes,
                price: parseFloat(formData.price),
            };

            if (selectedItem) {
                await inventoryApi.update(selectedItem._id, payload);
            } else {
                await inventoryApi.create(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (e) {
            console.error('Error saving inventory item:', e);
        }
    };

    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const base = lowStockOnly
            ? items.filter((i) => Number(i.quantity) <= Number(i.reorderLevel))
            : items;

        if (!term) return base;
        return base.filter((i) => {
            const sku = String(i.sku || '').toLowerCase();
            const name = String(i.name || '').toLowerCase();
            const category = String(i.category || '').toLowerCase();
            return sku.includes(term) || name.includes(term) || category.includes(term);
        });
    }, [items, lowStockOnly, searchTerm]);

    const categoriesCount = useMemo(() => new Set(items.map((i) => i.category)).size, [items]);

    const monthSpend = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        return orders
            .filter((o) => {
                const d = new Date(o.orderDate);
                return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
    }, [orders]);

    const lastMonthSpend = useMemo(() => {
        const now = new Date();
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const y = prev.getFullYear();
        const m = prev.getMonth();
        return orders
            .filter((o) => {
                const d = new Date(o.orderDate);
                return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
    }, [orders]);

    const spendDeltaPct = useMemo(() => {
        if (lastMonthSpend <= 0) return 0;
        return ((monthSpend - lastMonthSpend) / lastMonthSpend) * 100;
    }, [lastMonthSpend, monthSpend]);

    const isSpendUp = spendDeltaPct >= 0;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-muted-foreground mt-1">Manage clinic supplies, orders, and stock levels</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={lowStockOnly ? 'default' : 'outline'}
                            onClick={() => setLowStockOnly((v) => !v)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            {lowStockOnly ? 'Low Stock Only' : 'Filter'}
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{items.length}</div>
                            <p className="text-xs text-muted-foreground">Across {categoriesCount} categories</p>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Low Stock Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{lowStockCount}</div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Items below minimum level</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                            {isSpendUp ? (
                                <ArrowUp className="h-4 w-4 text-red-500" />
                            ) : (
                                <ArrowDown className="h-4 w-4 text-green-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${monthSpend.toFixed(0)}</div>
                            <p className="text-xs text-muted-foreground">{(isSpendUp ? '+' : '') + spendDeltaPct.toFixed(0)}% vs last month</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Stock List</CardTitle>
                                <CardDescription>Current inventory levels and detailed information.</CardDescription>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search item, SKU or category..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU / Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Min Level</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => {
                                    const isLow = item.quantity <= item.reorderLevel;
                                    const status = isLow ? 'Low Stock' : 'In Stock';
                                    return (
                                    <TableRow key={item._id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.sku || item._id}</div>
                                        </TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {item.quantity} {item.unit}
                                                {isLow && (
                                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.reorderLevel}</TableCell>
                                        <TableCell>{item.location || '-'}</TableCell>
                                        <TableCell>{item.supplier || '-'}</TableCell>
                                        <TableCell>{item.expiryDate ? String(item.expiryDate).slice(0, 10) : '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={status === 'Low Stock' ? 'destructive' : 'secondary'} className={status === 'Low Stock' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' : ''}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedItem ? 'Edit Item' : 'Add Item'}
                    description={selectedItem ? 'Update inventory item' : 'Create a new inventory item'}
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
                                placeholder="e.g., Latex Gloves"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="e.g., INV-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Storage Room A"
                                />
                            </div>
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
                                        <SelectItem value="supplies">Supplies</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
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
                                <Label htmlFor="reorderLevel">Min Level *</Label>
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
                                <Label htmlFor="price">Unit Price ($) *</Label>
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
                                <Label htmlFor="supplierId">Supplier</Label>
                                <select
                                    id="supplierId"
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={selectedSupplierId}
                                    onChange={(e) => handleSupplierSelect(e.target.value)}
                                >
                                    <option value="">Custom / None</option>
                                    {suppliers.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                {!selectedSupplierId ? (
                                    <Input
                                        id="supplier"
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder="Supplier name"
                                    />
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="supplierPhone">Supplier Phone</Label>
                                <Input
                                    id="supplierPhone"
                                    value={formData.supplierPhone}
                                    onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplierEmail">Supplier Email</Label>
                                <Input
                                    id="supplierEmail"
                                    value={formData.supplierEmail}
                                    onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplierContact">Contact Person</Label>
                                <Input
                                    id="supplierContact"
                                    value={formData.supplierContact}
                                    onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="expiryDate">Expiry Date</Label>
                                <Input
                                    id="expiryDate"
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes about this item"
                                />
                            </div>
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
};

export default Inventory;
