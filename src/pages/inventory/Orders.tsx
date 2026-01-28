import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Package } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const orders = [
    { id: 'ORD-001', supplier: 'Dental Supply Co.', items: 'Nitrile Gloves, Masks', total: 450, date: '2024-03-20', status: 'Delivered' },
    { id: 'ORD-002', supplier: 'MedTech Solutions', items: 'Composite Resin Kit', total: 1200, date: '2024-03-18', status: 'Shipped' },
    { id: 'ORD-003', supplier: 'PharmaDirect', items: 'Lidocaine', total: 300, date: '2024-03-15', status: 'Processing' },
];

export default function Orders() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
                        <p className="text-muted-foreground">Track inventory orders and deliveries</p>
                    </div>
                    <Button className="gradient-primary shadow-glow">
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
                            <div className="text-3xl font-bold text-primary">3</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Month Spending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">$4,250</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Low Stock Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">5</div>
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
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                        <TableCell className="font-medium">{order.supplier}</TableCell>
                                        <TableCell className="text-muted-foreground">{order.items}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                        <TableCell className="font-semibold">${order.total}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                order.status === 'Delivered' ? 'text-success bg-success/10 border-success/20' :
                                                    order.status === 'Shipped' ? 'text-info bg-info/10 border-info/20' :
                                                        'text-warning bg-warning/10 border-warning/20'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Track</Button>
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
}
