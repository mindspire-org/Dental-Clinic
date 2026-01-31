import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
    FileText,
    Search,
    Filter,
    Download,
    Eye,
    Calendar,
    Users,
    Image as ImageIcon,
    ClipboardList
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { documentsApi } from '@/lib/api';

interface Document {
    _id: string;
    title: string;
    category: string;
    patient?: {
        firstName: string;
        lastName: string;
    };
    uploadedBy: {
        firstName: string;
        lastName: string;
    };
    fileUrl: string;
    createdAt: string;
}

export default function PatientRecords() {
    const [records, setRecords] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await documentsApi.getAll();
            setRecords(response.data.documents);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (record: Document) => {
        if (record.fileUrl) {
            window.open(record.fileUrl, '_blank');
        }
    };

    const handleExport = () => {
        // Export functionality
        alert('Export functionality coming soon!');
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            xray: 'bg-blue-100 text-blue-800',
            report: 'bg-green-100 text-green-800',
            consent: 'bg-purple-100 text-purple-800',
            prescription: 'bg-orange-100 text-orange-800',
            general: 'bg-gray-100 text-gray-800',
        };
        return colors[category] || colors.general;
    };

    const filteredRecords = records.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        return (
            record.title.toLowerCase().includes(searchLower) ||
            record.category.toLowerCase().includes(searchLower) ||
            (record.patient &&
                `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase().includes(searchLower))
        );
    });

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={10} />
            </DashboardLayout>
        );
    }

    const now = new Date();
    const totalRecords = records.length;
    const byCategory = records.reduce((acc, r) => {
        const key = (r.category || 'general').toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const thisMonth = records.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const uniquePatients = new Set(
        records
            .map((r) => (r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : null))
            .filter(Boolean) as string[]
    ).size;

    const summaryCards = [
        {
            title: 'Total Records',
            value: totalRecords,
            icon: FileText,
            className: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
            iconClassName: 'text-primary',
        },
        {
            title: 'X-Rays',
            value: byCategory.xray || 0,
            icon: ImageIcon,
            className: 'bg-gradient-to-br from-info/15 to-info/5 border-info/20',
            iconClassName: 'text-info',
        },
        {
            title: 'Reports',
            value: byCategory.report || 0,
            icon: ClipboardList,
            className: 'bg-gradient-to-br from-success/15 to-success/5 border-success/20',
            iconClassName: 'text-success',
        },
        {
            title: 'Patients',
            value: uniquePatients,
            icon: Users,
            className: 'bg-gradient-to-br from-warning/15 to-warning/5 border-warning/20',
            iconClassName: 'text-warning',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Patient Records</h1>
                        <p className="text-muted-foreground">View and manage medical records and documents</p>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All
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
                                <div className="text-xs text-muted-foreground mt-2">
                                    {thisMonth} uploaded this month
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="shadow-card">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search records..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon">
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredRecords.length === 0 ? (
                            <EmptyState
                                title="No records found"
                                description={searchTerm ? "Try adjusting your search" : "No patient records available"}
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Patient Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Uploaded By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.map((record) => (
                                        <TableRow key={record._id} className="group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    {record.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {record.patient
                                                    ? `${record.patient.firstName} ${record.patient.lastName}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(record.category)}>
                                                    {record.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(record.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                Dr. {record.uploadedBy.firstName} {record.uploadedBy.lastName}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleView(record)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Eye className="w-4 h-4 mr-1" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
