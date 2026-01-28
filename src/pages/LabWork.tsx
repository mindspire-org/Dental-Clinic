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
import { Search, Plus, Filter, FlaskConical, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

const LabWork = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const mockLabWork = [
        {
            id: 'LW-2024-001',
            patient: 'John Doe',
            lab: 'Elite Dental Lab',
            workType: 'Ceramic Crown',
            requestDate: '2024-03-20',
            expectedDate: '2024-03-27',
            status: 'In Progress',
            cost: '$450',
        },
        {
            id: 'LW-2024-002',
            patient: 'Sarah Williams',
            lab: 'SmilePro Diagnostics',
            workType: 'Full Denture',
            requestDate: '2024-03-15',
            expectedDate: '2024-03-22',
            status: 'Shipped',
            cost: '$1,200',
        },
        {
            id: 'LW-2024-003',
            patient: 'Robert Brown',
            lab: 'Elite Dental Lab',
            workType: 'Zirconia Bridge',
            requestDate: '2024-03-10',
            expectedDate: '2024-03-17',
            status: 'Completed',
            cost: '$2,100',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success'; // Assuming theme handles success variant or just default
            case 'shipped': return 'secondary'; // Using secondary for now
            case 'in progress': return 'default';
            default: return 'outline';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Lab Work</h1>
                        <p className="text-muted-foreground mt-1">Track and manage dental laboratory requests</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <FlaskConical className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">8</div>
                            <p className="text-xs text-muted-foreground">Awaiting lab confirmation</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                            <Loader2 className="h-4 w-4 text-accent" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">14</div>
                            <p className="text-xs text-muted-foreground">Currently at lab</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                            <Truck className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-muted-foreground">Expected within 2 days</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">126</div>
                            <p className="text-xs text-muted-foreground">This month</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Lab Requests</CardTitle>
                                <CardDescription>Monitor status of all external lab work.</CardDescription>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search request or patient..."
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
                                    <TableHead>Request ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Lab Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Expected</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockLabWork.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.id}</TableCell>
                                        <TableCell>{item.patient}</TableCell>
                                        <TableCell>{item.lab}</TableCell>
                                        <TableCell>{item.workType}</TableCell>
                                        <TableCell>{item.expectedDate}</TableCell>
                                        <TableCell>{item.cost}</TableCell>
                                        <TableCell>
                                            <Badge variant={'secondary'}>
                                                {item.status}
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
};

// I need to import Loader2 locally as I used it in JSX but didn't import it
import { Loader2 } from 'lucide-react';

export default LabWork;
