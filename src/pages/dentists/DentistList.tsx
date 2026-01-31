import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/components/ui/use-toast';
import { dentistsApi } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit, Trash2, Mail, Phone, Users, UserCheck, UserX, UserPlus } from 'lucide-react';

interface Dentist {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
    experienceYears?: number;
    checkupFee?: number;
    address?: string;
    avatar?: string;
    role: 'dentist';
    isActive: boolean;
    createdAt: string;
}

export default function DentistList() {
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        specialization: '',
        licenseNumber: '',
        experienceYears: '',
        checkupFee: '',
        address: '',
        avatar: '',
        isActive: true,
    });

    useEffect(() => {
        fetchDentists();
    }, []);

    const fetchDentists = async () => {
        try {
            setLoading(true);
            const response = await dentistsApi.getAll();
            setDentists(response.data.dentists || []);
        } catch (error) {
            console.error('Error fetching dentists:', error);
            toast({
                title: 'Failed to load dentists',
                description: error instanceof Error ? error.message : 'Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedDentist(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phone: '',
            specialization: '',
            licenseNumber: '',
            experienceYears: '',
            checkupFee: '',
            address: '',
            avatar: '',
            isActive: true,
        });
        setShowModal(true);
    };

    const handleEdit = (dentist: Dentist) => {
        setSelectedDentist(dentist);
        setFormData({
            username: dentist.username,
            email: dentist.email,
            password: '',
            firstName: dentist.firstName,
            lastName: dentist.lastName,
            phone: dentist.phone || '',
            specialization: dentist.specialization || '',
            licenseNumber: dentist.licenseNumber || '',
            experienceYears: typeof dentist.experienceYears === 'number' ? String(dentist.experienceYears) : '',
            checkupFee: typeof dentist.checkupFee === 'number' ? String(dentist.checkupFee) : '',
            address: dentist.address || '',
            avatar: dentist.avatar || '',
            isActive: dentist.isActive,
        });
        setShowModal(true);
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) return 'First name is required.';
        if (!formData.lastName.trim()) return 'Last name is required.';
        if (!formData.username.trim()) return 'Username is required.';
        if (!formData.email.trim()) return 'Email is required.';
        if (!selectedDentist) {
            if (!formData.password) return 'Password is required.';
            if (formData.password.length < 6) return 'Password must be at least 6 characters.';
        }
        if (formData.experienceYears && Number.isNaN(Number(formData.experienceYears))) {
            return 'Experience years must be a number.';
        }
        if (formData.checkupFee && Number.isNaN(Number(formData.checkupFee))) {
            return 'Checkup fee must be a number.';
        }
        return null;
    };

    const handleDelete = (dentist: Dentist) => {
        setSelectedDentist(dentist);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        const validationError = validateForm();
        if (validationError) {
            toast({ title: 'Please check the form', description: validationError, variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);
            const payload: any = {
                username: formData.username,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                specialization: formData.specialization,
                licenseNumber: formData.licenseNumber,
                experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
                checkupFee: formData.checkupFee !== '' ? Number(formData.checkupFee) : undefined,
                address: formData.address,
                avatar: formData.avatar,
                isActive: formData.isActive,
            };
            if (formData.password) payload.password = formData.password;

            if (selectedDentist) {
                await dentistsApi.update(selectedDentist._id, payload);
                toast({ title: 'Dentist updated', description: 'Changes have been saved.' });
            } else {
                await dentistsApi.create(payload);
                toast({ title: 'Dentist created', description: 'New dentist has been added.' });
            }
            setShowModal(false);
            fetchDentists();
        } catch (error) {
            console.error('Error saving dentist:', error);
            toast({
                title: 'Save failed',
                description: error instanceof Error ? error.message : 'Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedDentist) return;
        try {
            await dentistsApi.delete(selectedDentist._id);
            setShowDeleteDialog(false);
            fetchDentists();
            toast({ title: 'Dentist deleted' });
        } catch (error) {
            console.error('Error deleting dentist:', error);
            toast({
                title: 'Delete failed',
                description: error instanceof Error ? error.message : 'Please try again.',
                variant: 'destructive',
            });
        }
    };

    const columns: ColumnDef<Dentist>[] = [
        {
            accessorKey: 'firstName',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.firstName} {row.original.lastName}</div>
                    <div className="text-sm text-muted-foreground">@{row.original.username}</div>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3" />
                        {row.original.email}
                    </div>
                    {row.original.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {row.original.phone}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(row.original)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    const now = new Date();
    const total = dentists.length;
    const active = dentists.filter((d) => d.isActive).length;
    const inactive = dentists.filter((d) => !d.isActive).length;
    const newThisMonth = dentists.filter((d) => {
        const created = new Date(d.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    const summaryCards = [
        {
            title: 'Total Dentists',
            value: total,
            icon: Users,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'Active',
            value: active,
            icon: UserCheck,
            className: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
            iconClassName: 'text-success',
        },
        {
            title: 'New This Month',
            value: newThisMonth,
            icon: UserPlus,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'Inactive',
            value: inactive,
            icon: UserX,
            className: 'bg-gradient-to-br from-destructive/15 to-destructive/5 border-destructive/20',
            iconClassName: 'text-destructive',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Dentists</h1>
                        <p className="text-muted-foreground">Manage dentist accounts and availability</p>
                    </div>
                    <Button onClick={handleCreate} className="gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Dentist
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
                                <div className="text-xs text-muted-foreground mt-2">{now.toLocaleDateString()}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="shadow-card">
                    <CardContent className="pt-6">
                        {dentists.length === 0 ? (
                            <EmptyState
                                title="No dentists found"
                                description="Get started by adding your first dentist"
                                action={{ label: 'Add Dentist', onClick: handleCreate }}
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={dentists}
                                searchKey="firstName"
                                searchPlaceholder="Search dentists..."
                            />
                        )}
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title={selectedDentist ? 'Edit Dentist' : 'New Dentist'}
                    description={selectedDentist ? 'Update dentist information' : 'Add a new dentist'}
                    onSubmit={handleSubmit}
                    isLoading={saving}
                    size="lg"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password {selectedDentist ? '(leave blank to keep)' : '*'}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                                id="specialization"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="licenseNumber">License Number</Label>
                            <Input
                                id="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experienceYears">Experience (Years)</Label>
                            <Input
                                id="experienceYears"
                                type="number"
                                min={0}
                                value={formData.experienceYears}
                                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="checkupFee">Dentist Checkup Fee</Label>
                            <Input
                                id="checkupFee"
                                type="number"
                                min={0}
                                value={formData.checkupFee}
                                onChange={(e) => setFormData({ ...formData, checkupFee: e.target.value })}
                                disabled={saving}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avatar">Avatar URL</Label>
                            <Input
                                id="avatar"
                                value={formData.avatar}
                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={saving}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                            <div>
                                <div className="text-sm font-medium">Active</div>
                                <div className="text-xs text-muted-foreground">Disable to mark dentist as inactive</div>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </FormModal>

                <DeleteDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleConfirmDelete}
                    title="Delete Dentist"
                    description={`Are you sure you want to delete ${selectedDentist?.firstName} ${selectedDentist?.lastName}? This action cannot be undone.`}
                />
            </div>
        </DashboardLayout>
    );
}
