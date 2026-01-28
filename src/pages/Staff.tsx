import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Mail, Phone, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Staff = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const staffMembers = [
        {
            id: 1,
            name: 'Dr. Sarah Mitchell',
            role: 'Lead Dentist',
            department: 'General Dentistry',
            email: 'sarah.mitchell@dentalux.com',
            phone: '+1 (555) 123-4567',
            status: 'Active',
            initials: 'SM'
        },
        {
            id: 2,
            name: 'Dr. James Wilson',
            role: 'Orthodontist',
            department: 'Orthodontics',
            email: 'james.wilson@dentalux.com',
            phone: '+1 (555) 234-5678',
            status: 'Active',
            initials: 'JW'
        },
        {
            id: 3,
            name: 'Emily Rodriguez',
            role: 'Receptionist',
            department: 'Administration',
            email: 'emily.r@dentalux.com',
            phone: '+1 (555) 345-6789',
            status: 'Active',
            initials: 'ER'
        },
        {
            id: 4,
            name: 'Michael Chen',
            role: 'Dental Hygienist',
            department: 'Hygiene',
            email: 'michael.c@dentalux.com',
            phone: '+1 (555) 456-7890',
            status: 'On Leave',
            initials: 'MC'
        }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
                        <p className="text-muted-foreground mt-1">Manage employees, roles and schedules</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Staff
                        </Button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Find team member..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {staffMembers.map((member) => (
                        <Card key={member.id} className="overflow-hidden transition-all hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Badge variant={member.status === 'Active' ? 'secondary' : 'outline'} className={member.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}>
                                    {member.status}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center text-center pt-4">
                                <Avatar className="h-20 w-20 mb-4 border-2 border-border">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xl bg-primary/10 text-primary">{member.initials}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">{member.name}</h3>
                                    <p className="text-sm font-medium text-primary">{member.role}</p>
                                    <p className="text-sm text-muted-foreground">{member.department}</p>
                                </div>

                                <div className="w-full mt-6 space-y-2">
                                    <Button variant="outline" className="w-full justify-start text-xs h-9" size="sm">
                                        <Mail className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                        <span className="truncate">{member.email}</span>
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-xs h-9" size="sm">
                                        <Phone className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                        <span>{member.phone}</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Staff;
