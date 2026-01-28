import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Download, Filter } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const payments = [
    { id: 'INV-001', date: '2024-03-20', patient: 'Sarah Johnson', method: 'Credit Card', amount: 120, status: 'Paid' },
    { id: 'INV-002', date: '2024-03-19', patient: 'Michael Chen', method: 'Insurance', amount: 950, status: 'Pending' },
    { id: 'INV-003', date: '2024-03-18', patient: 'Emma Davis', method: 'Cash', amount: 200, status: 'Paid' },
    { id: 'INV-004', date: '2024-03-18', patient: 'James Wilson', method: 'Credit Card', amount: 1200, status: 'Paid' },
];

export default function Payments() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                        <p className="text-muted-foreground">Recent transactions and financial records</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary text-primary-foreground shadow-glow border-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium opacity-90">Total Revenue (Monthly)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">$24,500</div>
                            <p className="text-sm opacity-75 mt-1">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground">Pending Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-warning">$3,200</div>
                            <p className="text-sm text-muted-foreground mt-1">12 Invoices pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground">Insurance Claims</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-info">$8,450</div>
                            <p className="text-sm text-muted-foreground mt-1">5 Claims processing</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{payment.id}</TableCell>
                                        <TableCell>{payment.date}</TableCell>
                                        <TableCell className="font-medium">{payment.patient}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3 text-muted-foreground" /> {payment.method}
                                        </TableCell>
                                        <TableCell className="font-bold">${payment.amount}</TableCell>
                                        <TableCell>
                                            <Badge variant={payment.status === 'Paid' ? 'default' : 'secondary'} className={payment.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
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
