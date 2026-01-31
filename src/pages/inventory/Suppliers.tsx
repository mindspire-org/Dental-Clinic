import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormModal } from '@/components/shared/FormModal';
import { inventoryApi } from '@/lib/api';
import { Phone, Mail, MapPin, Truck, ExternalLink } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    rating?: number;
    paymentTerms?: string;
    notes?: string;
    isActive?: boolean;
};

type InventoryItem = {
    _id: string;
    name: string;
    sku?: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    price: number;
    supplier?: string;
};

type InventoryOrder = {
    _id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    subtotal: number;
    items?: Array<{ name?: string }>
};

type SupplierPayload = {
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    rating?: number;
    paymentTerms?: string;
    notes?: string;
    isActive?: boolean;
};

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
    const [catalogItems, setCatalogItems] = useState<InventoryItem[]>([]);
    const [historyOrders, setHistoryOrders] = useState<InventoryOrder[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        paymentTerms: '',
        rating: '0',
        isActive: true,
        notes: '',
    });

    const fetchSuppliers = async () => {
        try {
            const response = await inventoryApi.suppliers.getAll();
            setSuppliers(response.data.suppliers || []);
        } catch (e) {
            console.error('Error fetching suppliers:', e);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleCreate = () => {
        setSelectedSupplier(null);
        setFormData({
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            paymentTerms: '',
            rating: '0',
            isActive: true,
            notes: '',
        });
        setShowModal(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name || '',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            street: supplier.address?.street || '',
            city: supplier.address?.city || '',
            state: supplier.address?.state || '',
            zipCode: supplier.address?.zipCode || '',
            country: supplier.address?.country || '',
            paymentTerms: supplier.paymentTerms || '',
            rating: String(supplier.rating ?? 0),
            isActive: supplier.isActive ?? true,
            notes: supplier.notes || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            const payload: SupplierPayload = {
                name: formData.name,
                contactPerson: formData.contactPerson,
                phone: formData.phone,
                email: formData.email,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                },
                paymentTerms: formData.paymentTerms,
                rating: Number(formData.rating),
                isActive: formData.isActive,
                notes: formData.notes,
            };

            if (selectedSupplier) {
                await inventoryApi.suppliers.update(selectedSupplier._id, payload);
            } else {
                await inventoryApi.suppliers.create(payload);
            }

            setShowModal(false);
            fetchSuppliers();
        } catch (e) {
            console.error('Error saving supplier:', e);
        }
    };

    const handleOpenCatalog = async (supplier: Supplier) => {
        try {
            setActiveSupplier(supplier);
            setCatalogOpen(true);
            setCatalogLoading(true);

            const itemsRes = await inventoryApi.getAll();
            const allItems: InventoryItem[] = itemsRes.data.items || [];
            const supplierName = String(supplier.name || '').trim().toLowerCase();

            const items = allItems.filter((it) => String(it.supplier || '').trim().toLowerCase() === supplierName);
            setCatalogItems(items);
        } catch (e) {
            console.error('Error fetching supplier catalog:', e);
            setCatalogItems([]);
        } finally {
            setCatalogLoading(false);
        }
    };

    const handleOpenHistory = async (supplier: Supplier) => {
        try {
            setActiveSupplier(supplier);
            setHistoryOpen(true);
            setHistoryLoading(true);

            const ordersRes = await inventoryApi.orders.getAll({ supplierId: supplier._id });
            setHistoryOrders(ordersRes.data.orders || []);
        } catch (e) {
            console.error('Error fetching supplier history:', e);
            setHistoryOrders([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const formatAddress = useMemo(() => {
        return (s: Supplier) => {
            const parts = [s.address?.street, s.address?.city, s.address?.state, s.address?.zipCode, s.address?.country]
                .map((p) => (p ? String(p).trim() : ''))
                .filter(Boolean);
            return parts.join(', ');
        };
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
                        <p className="text-muted-foreground">Manage your vendor relationships</p>
                    </div>
                    <Button className="gradient-primary shadow-glow" onClick={handleCreate}>
                        <Truck className="w-4 h-4 mr-2" />
                        Add Supplier
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                        <Card key={supplier._id} className="shadow-card hover-lift group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-primary/20 bg-primary/5">
                                            <AvatarFallback className="text-primary font-bold">{supplier.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{supplier.name}</CardTitle>
                                            <CardDescription>{supplier.contactPerson || '-'}</CardDescription>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge variant={supplier.isActive === false ? 'destructive' : 'secondary'}>
                                                    {supplier.isActive === false ? 'Inactive' : 'Active'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">Rating: {Number(supplier.rating ?? 0).toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleEdit(supplier)}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Phone className="w-4 h-4" />
                                    {supplier.phone || '-'}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Mail className="w-4 h-4" />
                                    {supplier.email || '-'}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <MapPin className="w-4 h-4" />
                                    {formatAddress(supplier) || '-'}
                                </div>
                                {supplier.paymentTerms ? (
                                    <div className="text-xs text-muted-foreground">Terms: {supplier.paymentTerms}</div>
                                ) : null}
                                <div className="pt-3 flex gap-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenCatalog(supplier)}>
                                        Catalog
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenHistory(supplier)}>
                                        History
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedSupplier ? 'Edit Supplier' : 'Add Supplier'}
                    description={selectedSupplier ? 'Update supplier information' : 'Create a new supplier'}
                    onSubmit={handleSubmit}
                    size="lg"
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Supplier Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Dental Supply Co."
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="e.g., John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g., +1 555 123 4567"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="e.g., orders@supplier.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="street">Address</Label>
                                <Input
                                    id="street"
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    placeholder="e.g., 123 Main St"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zipCode">Zip</Label>
                                <Input
                                    id="zipCode"
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="paymentTerms">Payment Terms</Label>
                                <Input
                                    id="paymentTerms"
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    placeholder="e.g., Net 30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rating">Rating (0-5)</Label>
                                <Input
                                    id="rating"
                                    type="number"
                                    min={0}
                                    max={5}
                                    step="0.1"
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isActive">Active</Label>
                                <div className="h-10 flex items-center">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes about this supplier"
                            />
                        </div>
                    </div>
                </FormModal>

                <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Catalog{activeSupplier?.name ? ` - ${activeSupplier.name}` : ''}</DialogTitle>
                            <DialogDescription>Inventory items supplied by this vendor.</DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-auto">
                            {catalogLoading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {catalogItems.length ? (
                                            catalogItems.map((it) => (
                                                <TableRow key={it._id}>
                                                    <TableCell className="font-medium">{it.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{it.sku || '-'}</TableCell>
                                                    <TableCell className="capitalize">{it.category}</TableCell>
                                                    <TableCell>
                                                        {Number(it.quantity || 0)} {it.unit}
                                                    </TableCell>
                                                    <TableCell className="text-right">${Number(it.price || 0).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                    No catalog items found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCatalogOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>History{activeSupplier?.name ? ` - ${activeSupplier.name}` : ''}</DialogTitle>
                            <DialogDescription>Purchase orders placed with this supplier.</DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-auto">
                            {historyLoading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyOrders.length ? (
                                            historyOrders.map((o) => (
                                                <TableRow key={o._id}>
                                                    <TableCell className="font-mono text-xs">{o.orderNumber || o._id}</TableCell>
                                                    <TableCell>{o.orderDate ? new Date(o.orderDate).toISOString().slice(0, 10) : '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {(o.items || []).map((it) => it.name).filter(Boolean).join(', ') || '-'}
                                                    </TableCell>
                                                    <TableCell className="capitalize">{o.status || '-'}</TableCell>
                                                    <TableCell className="text-right">${Number(o.subtotal || 0).toFixed(0)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                    No history found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
