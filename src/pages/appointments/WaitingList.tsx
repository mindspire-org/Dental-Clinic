import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, MoreHorizontal, UserPlus } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const waitingList = [
    { id: 1, name: 'Alice Freeman', contact: '555-0123', priority: 'High', reason: 'Severe Toothache', added: '2 hours ago', status: 'Waiting' },
    { id: 2, name: 'Bob Smith', contact: '555-0124', priority: 'Medium', reason: 'Routine Checkup', added: '1 day ago', status: 'Notified' },
    { id: 3, name: 'Charlie Brown', contact: '555-0125', priority: 'Low', reason: 'Cleaning', added: '3 days ago', status: 'Waiting' },
];

export default function WaitingList() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Waiting List</h1>
                        <p className="text-muted-foreground">Manage patients waiting for appointments</p>
                    </div>
                    <Button className="gradient-primary shadow-glow">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to List
                    </Button>
                </div>

                <Card className="shadow-card">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Added</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {waitingList.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {item.contact}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                item.priority === 'High' ? 'text-destructive border-destructive/50 bg-destructive/10' :
                                                    item.priority === 'Medium' ? 'text-warning border-warning/50 bg-warning/10' :
                                                        'text-success border-success/50 bg-success/10'
                                            }>
                                                {item.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {item.added}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{item.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Schedule Appointment</DropdownMenuItem>
                                                    <DropdownMenuItem>Notify Patient</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
