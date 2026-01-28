import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const claims = [
    { id: 'CLM-001', provider: 'BlueCross', patient: 'Michael Chen', date: '2024-03-19', amount: 950, status: 'Processing' },
    { id: 'CLM-002', provider: 'Aetna', patient: 'Sarah Johnson', date: '2024-03-15', amount: 120, status: 'Approved' },
    { id: 'CLM-003', provider: 'Delta Dental', patient: 'Robert Fox', date: '2024-03-10', amount: 2500, status: 'Denied' },
];

export default function Insurance() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Insurance Claims</h1>
                        <p className="text-muted-foreground">Manage provider claims and status</p>
                    </div>
                    <Button className="gradient-primary shadow-glow">
                        <Plus className="w-4 h-4 mr-2" /> New Claim
                    </Button>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>Recent Claims</CardTitle>
                        <CardDescription>Track the status of insurance reimbursements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim ID</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-mono text-xs">{claim.id}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            {claim.provider}
                                        </TableCell>
                                        <TableCell>{claim.patient}</TableCell>
                                        <TableCell>{claim.date}</TableCell>
                                        <TableCell>${claim.amount}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                claim.status === 'Approved' ? 'text-success bg-success/10 border-success/20' :
                                                    claim.status === 'Denied' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                                                        'text-info bg-info/10 border-info/20'
                                            }>
                                                {claim.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
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
