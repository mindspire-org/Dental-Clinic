import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormModal } from '@/components/shared/FormModal';
import { inventoryApi } from '@/lib/api';
import { Plus } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Supplier = {
    _id: string;
    name: string;
};

type InventoryItem = {
    _id: string;
    name: string;
    price: number;
    quantity?: number;
    reorderLevel?: number;
};

type OrderItem = {
    inventoryItem: string;
    name: string;
    quantity: number;
    unitCost: number;
    total: number;
};

type InventoryOrder = {
    _id: string;
    orderNumber: string;
    supplier: Supplier | string;
    status: string;
    orderDate: string;
    expectedDate?: string;
    notes?: string;
    items: OrderItem[];
    subtotal: number;
};

export default function Orders() {
    const [orders, setOrders] = useState<InventoryOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        supplierId: '',
        itemId: '',
        quantity: '1',
        expectedDate: '',
        status: 'ordered',
        notes: '',
    });

    const fetchData = async () => {
        try {
            const [ordersRes, suppliersRes, itemsRes] = await Promise.all([
                inventoryApi.orders.getAll(),
                inventoryApi.suppliers.getAll(),
                inventoryApi.getAll(),
            ]);

            setOrders(ordersRes.data.orders || []);
            setSuppliers(suppliersRes.data.suppliers || []);
            setInventoryItems(itemsRes.data.items || []);
        } catch (e) {
            console.error('Error fetching orders:', e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const lowStockCount = useMemo(() => {
        return inventoryItems
            .filter((i) => i.quantity !== undefined && i.reorderLevel !== undefined)
            .filter((i) => Number(i.quantity) <= Number(i.reorderLevel)).length;
    }, [inventoryItems]);

    const pendingCount = useMemo(() => {
        return orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
    }, [orders]);

    const monthSpending = useMemo(() => {
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

    const getSupplierName = (supplier: Supplier | string) => {
        if (!supplier) return '-';
        if (typeof supplier === 'string') {
            const s = suppliers.find((x) => x._id === supplier);
            return s?.name || '-';
        }
        return supplier.name || '-';
    };

    const mapStatusBadge = (status: string) => {
        const s = String(status || '').toLowerCase();
        if (s === 'delivered') return 'text-success bg-success/10 border-success/20';
        if (s === 'shipped') return 'text-info bg-info/10 border-info/20';
        if (s === 'cancelled') return 'text-destructive bg-destructive/10 border-destructive/20';
        return 'text-warning bg-warning/10 border-warning/20';
    };

    const handleCreate = () => {
        setFormData({ supplierId: '', itemId: '', quantity: '1', expectedDate: '', status: 'ordered', notes: '' });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            const supplierId = formData.supplierId;
            const itemId = formData.itemId;
            const qty = parseInt(formData.quantity, 10);
            const item = inventoryItems.find((i) => i._id === itemId);

            if (!supplierId || !itemId || !item || !Number.isFinite(qty) || qty <= 0) return;

            await inventoryApi.orders.create({
                supplier: supplierId,
                status: formData.status,
                expectedDate: formData.expectedDate || undefined,
                notes: formData.notes || undefined,
                items: [
                    {
                        inventoryItem: itemId,
                        name: item.name,
                        quantity: qty,
                        unitCost: Number(item.price || 0),
                    },
                ],
            });

            setShowModal(false);
            fetchData();
        } catch (e) {
            console.error('Error creating order:', e);
        }
    };

    const handleReceive = async (id: string) => {
        try {
            await inventoryApi.orders.receive(id);
            fetchData();
        } catch (e) {
            console.error('Error receiving order:', e);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
                        <p className="text-muted-foreground">Track inventory orders and deliveries</p>
                    </div>
                    <Button className="gradient-primary shadow-glow" onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Order
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">{pendingCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Month Spending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">${monthSpending.toFixed(0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">{lowStockCount}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Expected</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                                        <TableCell className="font-medium">{getSupplierName(order.supplier)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {(order.items || []).map((it) => it.name).filter(Boolean).join(', ') || '-'}
                                        </TableCell>
                                        <TableCell>{new Date(order.orderDate).toISOString().slice(0, 10)}</TableCell>
                                        <TableCell>{order.expectedDate ? String(order.expectedDate).slice(0, 10) : '-'}</TableCell>
                                        <TableCell className="font-semibold">${Number(order.subtotal || 0).toFixed(0)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={mapStatusBadge(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {String(order.status).toLowerCase() === 'delivered' ? (
                                                <Button variant="ghost" size="sm" disabled>
                                                    Received
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => handleReceive(order._id)}>
                                                    Receive
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title="New Order"
                    description="Create a new purchase order"
                    onSubmit={handleSubmit}
                    size="lg"
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplierId">Supplier *</Label>
                            <select
                                id="supplierId"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={formData.supplierId}
                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                            >
                                <option value="">Select supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="itemId">Item *</Label>
                            <select
                                id="itemId"
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={formData.itemId}
                                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                            >
                                <option value="">Select item</option>
                                {inventoryItems.map((i) => (
                                    <option key={i._id} value={i._id}>
                                        {i.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
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
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ordered">Ordered</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes (shipping details, invoice #, etc.)"
                            />
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
}
