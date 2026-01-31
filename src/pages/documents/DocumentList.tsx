import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Upload, Download, Trash2, FileText, Calendar, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { documentsApi } from '@/lib/api';
import { toast } from 'sonner';

interface Document {
    _id: string;
    title: string;
    category: string;
    patient?: {
        firstName: string;
        lastName: string;
    };
    fileUrl: string;
    fileSize: number;
    isFolder?: boolean;
    mimeType?: string;
    uploadedBy: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export default function DocumentList() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentsApi.getAll();
            setDocuments(response.data.documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (document: Document) => {
        if (!document.fileUrl) return;
        window.open(document.fileUrl, '_blank');
    };

    const handleDownload = (document: Document) => {
        if (!document.fileUrl) return;
        const a = window.document.createElement('a');
        a.href = document.fileUrl;
        a.target = '_blank';
        a.rel = 'noreferrer';
        a.download = document.title || 'download';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('category', 'other');

            await documentsApi.upload(formData);
            toast.success('Uploaded');
            fetchDocuments();
        } catch (error: any) {
            console.error('Error uploading document:', error);
            toast.error(error?.message || 'Upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleDelete = (document: Document) => {
        setSelectedDocument(document);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedDocument) return;
        try {
            await documentsApi.delete(selectedDocument._id);
            setShowDeleteDialog(false);
            toast.success('Deleted');
            fetchDocuments();
        } catch (error: any) {
            console.error('Error deleting document:', error);
            toast.error(error?.message || 'Delete failed');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getCategoryColor = (category: string) => {
        const c = String(category || '').toLowerCase();
        const colors: Record<string, string> = {
            'x-ray': 'bg-blue-100 text-blue-800',
            report: 'bg-green-100 text-green-800',
            'consent-form': 'bg-purple-100 text-purple-800',
            prescription: 'bg-orange-100 text-orange-800',
            insurance: 'bg-yellow-100 text-yellow-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[c] || colors.other;
    };

    const columns: ColumnDef<Document>[] = [
        {
            accessorKey: 'title',
            header: 'Document',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        <div className="text-sm text-muted-foreground">
                            {formatFileSize(row.original.fileSize)}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }) => (
                <Badge className={getCategoryColor(row.original.category)}>
                    {row.original.category}
                </Badge>
            ),
        },
        {
            accessorKey: 'patient',
            header: 'Patient',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.patient
                        ? `${row.original.patient.firstName} ${row.original.patient.lastName}`
                        : '-'}
                </span>
            ),
        },
        {
            accessorKey: 'uploadedBy',
            header: 'Uploaded By',
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.uploadedBy.firstName} {row.original.uploadedBy.lastName}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
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
                        onClick={() => handleView(row.original)}
                        disabled={!row.original.fileUrl}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(row.original)}
                        disabled={!row.original.fileUrl}
                    >
                        <Download className="w-4 h-4" />
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

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Documents</h1>
                    <p className="text-muted-foreground">Manage patient documents and files</p>
                </div>
                <div>
                    <Input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="gradient-primary"
                        disabled={uploading}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Size
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {documents.filter(d => {
                                const created = new Date(d.createdAt);
                                const now = new Date();
                                return created.getMonth() === now.getMonth() &&
                                    created.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(documents.map(d => d.category)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card>
                <CardContent className="pt-6">
                    {documents.length === 0 ? (
                        <EmptyState
                            title="No documents found"
                            description="Get started by uploading your first document"
                            action={{
                                label: 'Upload Document',
                                onClick: () => document.getElementById('file-upload')?.click(),
                            }}
                        />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={documents}
                            searchKey="title"
                            searchPlaceholder="Search documents..."
                        />
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <DeleteDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                title="Delete Document"
                description={`Are you sure you want to delete ${selectedDocument?.title}? This action cannot be undone.`}
            />
        </div>
    );
}
