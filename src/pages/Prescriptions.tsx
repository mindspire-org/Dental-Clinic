import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Pill, Printer, FileText, Calendar } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';

const Prescriptions = () => {
    const { role } = useRole();
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data
    const prescriptions = [
        {
            id: 'RX001',
            patient: 'Alice Johnson',
            dentist: 'Dr. Sarah Mitchell',
            date: '2024-03-20',
            medications: ['Amoxicillin 500mg', 'Ibuprofen 400mg'],
            status: 'Active',
        },
        {
            id: 'RX002',
            patient: 'Michael Smith',
            dentist: 'Dr. James Wilson',
            date: '2024-03-19',
            medications: ['Paracetamol 500mg'],
            status: 'Completed',
        },
        {
            id: 'RX003',
            patient: 'Emma Davis',
            dentist: 'Dr. Sarah Mitchell',
            date: '2024-03-18',
            medications: ['Chlorhexidine Mouthwash'],
            status: 'Active',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
                        <p className="text-muted-foreground mt-1">Manage patient prescriptions and medications</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Prescription
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,284</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
                            <Pill className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">342</div>
                            <p className="text-xs text-muted-foreground">Currently prescribed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Issued</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">Issued today</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Recent Prescriptions</CardTitle>
                                <CardDescription>A list of recently issued prescriptions.</CardDescription>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by patient or ID..."
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
                                    <TableHead>Prescription ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Dentist</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Medications</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {prescriptions.map((px) => (
                                    <TableRow key={px.id}>
                                        <TableCell className="font-medium">{px.id}</TableCell>
                                        <TableCell>{px.patient}</TableCell>
                                        <TableCell>{px.dentist}</TableCell>
                                        <TableCell>{px.date}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {px.medications.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={px.status === 'Active' ? 'default' : 'secondary'}>
                                                {px.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <FileText className="h-4 w-4" />
                                            </Button>
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

export default Prescriptions;
