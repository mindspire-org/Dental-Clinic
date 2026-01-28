import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Plus, Filter, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const mockInventory = [
        {
            id: 'INV-001',
            name: 'Latex Gloves (Medium)',
            category: 'Consumables',
            quantity: 15, // Low stock example
            minLevel: 20,
            unit: 'Boxes',
            supplier: 'MediSupply Co.',
            status: 'Low Stock',
        },
        {
            id: 'INV-002',
            name: 'Dental Anesthetic (Lidocaine)',
            category: 'Pharmaceuticals',
            quantity: 45,
            minLevel: 10,
            unit: 'Vials',
            supplier: 'PharmaDirect',
            status: 'In Stock',
        },
        {
            id: 'INV-003',
            name: 'Composite Resin (A2)',
            category: 'Restorative',
            quantity: 8,
            minLevel: 5,
            unit: 'Syringes',
            supplier: 'DentalDepot',
            status: 'In Stock',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-muted-foreground mt-1">Manage clinic supplies, orders, and stock levels</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button>
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
                            <div className="text-2xl font-bold">1,420</div>
                            <p className="text-xs text-muted-foreground">Across 12 categories</p>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Low Stock Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">8</div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Items below minimum level</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                            <ArrowUp className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">$4,250</div>
                            <p className="text-xs text-muted-foreground">+5% vs last month</p>
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
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockInventory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.id}</div>
                                        </TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {item.quantity} {item.unit}
                                                {item.quantity <= item.minLevel && (
                                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.minLevel}</TableCell>
                                        <TableCell>{item.supplier}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === 'Low Stock' ? 'destructive' : 'secondary'} className={item.status === 'Low Stock' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' : ''}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Inventory;
