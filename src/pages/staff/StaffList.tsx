import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Plus, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { staffApi } from '@/lib/api';

interface StaffMember {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    specialization?: string;
    isActive: boolean;
    createdAt: string;
}

export default function StaffList() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        specialization: '',
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await staffApi.getAll();
            setStaff(response.data.staff);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedStaff(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: '',
            specialization: '',
        });
        setShowModal(true);
    };

    const handleEdit = (member: StaffMember) => {
        setSelectedStaff(member);
        setFormData({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phone: member.phone,
            role: member.role,
            specialization: member.specialization || '',
        });
        setShowModal(true);
    };

    const handleDelete = (member: StaffMember) => {
        setSelectedStaff(member);
        setShowDeleteDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (selectedStaff) {
                await staffApi.update(selectedStaff._id, formData);
            } else {
                await staffApi.create(formData);
            }
            setShowModal(false);
            fetchStaff();
        } catch (error) {
            console.error('Error saving staff:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedStaff) return;
        try {
            await staffApi.delete(selectedStaff._id);
            setShowDeleteDialog(false);
            fetchStaff();
        } catch (error) {
            console.error('Error deleting staff:', error);
        }
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-800',
            dentist: 'bg-blue-100 text-blue-800',
            receptionist: 'bg-green-100 text-green-800',
            hygienist: 'bg-teal-100 text-teal-800',
            assistant: 'bg-orange-100 text-orange-800',
        };
        return colors[role] || colors.assistant;
    };

    const columns: ColumnDef<StaffMember>[] = [
        {
            accessorKey: 'firstName',
            header: 'Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-medium">
                        {row.original.firstName[0]}{row.original.lastName[0]}
                    </div>
                    <div>
                        <div className="font-medium">
                            {row.original.firstName} {row.original.lastName}
                        </div>
                        {row.original.specialization && (
                            <div className="text-sm text-muted-foreground">
                                {row.original.specialization}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge className={getRoleColor(row.original.role)}>
                    {row.original.role}
                </Badge>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {row.original.phone}
                    </div>
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
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(row.original)}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(row.original)}
                    >
                        <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <LoadingState type="table" rows={10} />;
    }

    const dentists = staff.filter(s => s.role === 'dentist').length;
    const activeStaff = staff.filter(s => s.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">Manage clinic staff and team members</p>
                </div>
                <Button onClick={handleCreate} className="gradient-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Staff
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staff.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Dentists
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{dentists}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeStaff}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Roles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(staff.map(s => s.role)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {staff.length === 0 ? (
                        <EmptyState
                            title="No staff members found"
                            description="Get started by adding your first staff member"
                            action={{
                                label: 'Add Staff',
                                onClick: handleCreate,
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={staff}
                            searchKey="firstName"
                            searchPlaceholder="Search staff..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <FormModal
                open={showModal}
                onOpenChange={setShowModal}
                title={selectedStaff ? 'Edit Staff Member' : 'New Staff Member'}
                description={selectedStaff ? 'Update staff information' : 'Add a new staff member'}
                onSubmit={handleSubmit}
                size="lg"
            >
                <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="dentist">Dentist</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                    <SelectItem value="hygienist">Hygienist</SelectItem>
                                    <SelectItem value="assistant">Assistant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                                id="specialization"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                placeholder="e.g., Orthodontics"
                            />
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Staff Member"
                description={`Are you sure you want to delete ${selectedStaff?.firstName} ${selectedStaff?.lastName}? This action cannot be undone.`}
            />
        </div>
    );
}
