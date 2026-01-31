import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Phone, MoreHorizontal, UserPlus, Users, BellRing, AlertCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormModal } from '@/components/shared/FormModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { patientsApi, waitingListApi } from '@/lib/api';

type WaitingItem = {
    id: string;
    patientId: string;
    name: string;
    contact: string;
    priority: 'High' | 'Medium' | 'Low';
    reason: string;
    createdAt: string;
    status: 'Waiting' | 'Notified';
};

type ApiWaitingItem = {
    _id: string;
    patient: {
        _id: string;
        firstName: string;
        lastName: string;
        phone?: string;
    };
    contact?: string;
    priority: 'High' | 'Medium' | 'Low';
    reason?: string;
    status: 'Waiting' | 'Notified';
    createdAt: string;
};

export default function WaitingList() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<any[]>([]);
    const [waitingList, setWaitingList] = useState<WaitingItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
        priority: 'Medium' as WaitingItem['priority'],
        reason: '',
        contact: '',
    });

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const res = await patientsApi.getAll({ limit: 200 });
                setPatients(res.data.patients || []);
            } catch {
                setPatients([]);
            }
        };

        const loadWaitingList = async () => {
            try {
                const res = await waitingListApi.getAll();
                const items: ApiWaitingItem[] = res.data.waitingList || [];
                setWaitingList(
                    items.map((item) => ({
                        id: item._id,
                        patientId: item.patient._id,
                        name: `${item.patient.firstName} ${item.patient.lastName}`,
                        contact: item.contact || item.patient.phone || '-',
                        priority: item.priority,
                        reason: item.reason || '-',
                        createdAt: item.createdAt,
                        status: item.status,
                    }))
                );
            } catch (e) {
                console.error('Failed to load waiting list', e);
                setWaitingList([]);
            }
        };

        loadPatients();
        loadWaitingList();
    }, []);

    const handleAdd = () => {
        setFormData({ patientId: '', priority: 'Medium', reason: '', contact: '' });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const p = patients.find((x) => x._id === formData.patientId);
        if (!p) return;

        try {
            const res = await waitingListApi.create({
                patientId: formData.patientId,
                priority: formData.priority,
                reason: formData.reason,
                contact: formData.contact,
            });

            const item: ApiWaitingItem | undefined = res.data.item;
            if (!item) return;

            setWaitingList((prev) => [
                {
                    id: item._id,
                    patientId: item.patient._id,
                    name: `${item.patient.firstName} ${item.patient.lastName}`,
                    contact: item.contact || item.patient.phone || '-',
                    priority: item.priority,
                    reason: item.reason || '-',
                    createdAt: item.createdAt,
                    status: item.status,
                },
                ...prev,
            ]);
            setShowModal(false);
        } catch (e) {
            console.error('Failed to add waiting list item', e);
        }
    };

    const handleScheduleAppointment = (item: WaitingItem) => {
        navigate(`/appointments?patientId=${encodeURIComponent(item.patientId)}`);
    };

    const handleNotify = async (itemId: string) => {
        try {
            const res = await waitingListApi.update(itemId, { status: 'Notified' });
            const item: ApiWaitingItem | undefined = res.data.item;
            if (!item) return;

            setWaitingList((prev) =>
                prev.map((x) =>
                    x.id === itemId
                        ? {
                              ...x,
                              status: item.status,
                          }
                        : x
                )
            );
        } catch (e) {
            console.error('Failed to notify patient', e);
        }
    };

    const handleRemove = async (itemId: string) => {
        try {
            await waitingListApi.delete(itemId);
            setWaitingList((prev) => prev.filter((x) => x.id !== itemId));
        } catch (e) {
            console.error('Failed to remove waiting list item', e);
        }
    };

    const counts = waitingList.reduce(
        (acc, item) => {
            acc.total += 1;
            if (item.status === 'Waiting') acc.waiting += 1;
            if (item.status === 'Notified') acc.notified += 1;
            if (item.priority === 'High') acc.high += 1;
            return acc;
        },
        { total: 0, waiting: 0, notified: 0, high: 0 }
    );

    const summaryCards = [
        {
            title: 'Total',
            value: counts.total,
            icon: Users,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'Waiting',
            value: counts.waiting,
            icon: Clock,
            className: 'bg-gradient-to-br from-warning/15 to-warning/5 border-warning/20',
            iconClassName: 'text-warning',
        },
        {
            title: 'Notified',
            value: counts.notified,
            icon: BellRing,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'High Priority',
            value: counts.high,
            icon: AlertCircle,
            className: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
            iconClassName: 'text-destructive',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Waiting List</h1>
                        <p className="text-muted-foreground">Manage patients waiting for appointments</p>
                    </div>
                    <Button className="gradient-primary shadow-glow" onClick={handleAdd}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to List
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryCards.map((c) => (
                        <Card key={c.title} className={`shadow-card border ${c.className}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">{c.title}</div>
                                        <div className="text-2xl font-bold text-foreground mt-1">{c.value}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-background/60 border flex items-center justify-center">
                                        <c.icon className={`w-5 h-5 ${c.iconClassName}`} />
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">Today</div>
                            </CardContent>
                        </Card>
                    ))}
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
                                {waitingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No patients in waiting list.
                                        </TableCell>
                                    </TableRow>
                                ) : waitingList.map((item) => (
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
                                                {new Date(item.createdAt).toLocaleString()}
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
                                                    <DropdownMenuItem onClick={() => handleScheduleAppointment(item)}>Schedule Appointment</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleNotify(item.id)}>Notify Patient</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(item.id)}>Remove</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                    title="Add to Waiting List"
                    description="Select a patient and reason to add to the waiting list"
                    onSubmit={handleSubmit}
                    submitLabel="Add"
                    size="md"
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Patient *</Label>
                            <Select
                                value={formData.patientId}
                                onValueChange={(value) => {
                                    const p = patients.find((x) => x._id === value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        patientId: value,
                                        contact: p?.phone || prev.contact,
                                    }));
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>
                                            {p.firstName} {p.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as WaitingItem['priority'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Contact</Label>
                                <Input
                                    value={formData.contact}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input
                                value={formData.reason}
                                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g. Toothache, Checkup"
                            />
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
}
