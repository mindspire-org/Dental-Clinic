import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormModal } from '@/components/shared/FormModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { documentsApi, patientsApi } from '@/lib/api';
import { Search, Plus, Upload, FileText, Image, File, FolderOpen, Download, Trash2, Eye, ArrowLeft } from 'lucide-react';

const Documents = () => {
    const [searchTerm, setSearchTerm] = useState('');

    type DocumentItem = {
        _id: string;
        title: string;
        category: string;
        fileUrl?: string;
        fileSize?: number;
        uploadDate?: string;
        createdAt?: string;
        isFolder?: boolean;
        parent?: string | null;
        patient?: string | { _id: string; firstName: string; lastName: string } | null;
        mimeType?: string;
    };

    type PatientOption = {
        _id: string;
        firstName: string;
        lastName: string;
    };

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DocumentItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [parentId, setParentId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [patients, setPatients] = useState<PatientOption[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('all');

    const categories = useMemo(() => {
        return [
            { label: 'All Files', value: 'all' },
            { label: 'Consent Forms', value: 'consent-form' },
            { label: 'X-Rays', value: 'x-ray' },
            { label: 'Treatment Plans', value: 'treatment-plan' },
            { label: 'Lab Reports', value: 'lab-report' },
            { label: 'Insurance', value: 'insurance' },
            { label: 'Other', value: 'other' },
        ];
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const params: any = { parentId: parentId ?? 'null' };
            if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
            if (selectedPatientId && selectedPatientId !== 'all') params.patientId = selectedPatientId;
            if (searchTerm.trim()) params.search = searchTerm.trim();
            const res = await documentsApi.getAll(params);
            setItems(res.data.documents || []);
        } catch (e: any) {
            console.error('Error fetching documents:', e);
            toast.error(e?.message || 'Failed to load documents');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, parentId, selectedPatientId]);

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const res = await patientsApi.getAll();
                const list = (res?.data?.patients || []) as any[];
                setPatients(
                    list
                        .filter((p) => p && p._id)
                        .map((p) => ({ _id: p._id, firstName: p.firstName, lastName: p.lastName }))
                );
            } catch (e) {
                setPatients([]);
            }
        };
        loadPatients();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            fetchItems();
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const formatFileSize = (bytes?: number) => {
        const b = Number(bytes || 0);
        if (!Number.isFinite(b) || b <= 0) return '-';
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getType = (doc: DocumentItem) => {
        if (doc.isFolder) return 'folder';
        const mime = String(doc.mimeType || '').toLowerCase();
        if (mime.includes('pdf')) return 'pdf';
        if (mime.includes('image')) return 'image';
        if (mime.includes('word') || mime.includes('doc')) return 'doc';
        return 'file';
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
            case 'image': return <Image className="h-8 w-8 text-blue-500" />;
            case 'doc': return <File className="h-8 w-8 text-blue-600" />;
            case 'folder': return <FolderOpen className="h-8 w-8 text-primary" />;
            default: return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    const handleUploadClick = () => {
        (document.getElementById('documents-upload') as HTMLInputElement | null)?.click();
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('category', selectedCategory === 'all' ? 'other' : selectedCategory);
            if (selectedPatientId && selectedPatientId !== 'all') formData.append('patientId', selectedPatientId);
            if (parentId) formData.append('parentId', parentId);
            await documentsApi.upload(formData);
            toast.success('Uploaded');
            fetchItems();
        } catch (e: any) {
            console.error('Upload failed:', e);
            toast.error(e?.message || 'Upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleCreateFolder = () => {
        setFolderName('');
        setShowFolderModal(true);
    };

    const submitCreateFolder = async () => {
        try {
            const title = folderName.trim();
            if (!title) return;
            await documentsApi.createFolder({
                title,
                category: selectedCategory === 'all' ? 'other' : selectedCategory,
                patientId: selectedPatientId && selectedPatientId !== 'all' ? selectedPatientId : null,
                parentId: parentId || null,
            });
            setShowFolderModal(false);
            toast.success('Folder created');
            fetchItems();
        } catch (e: any) {
            console.error('Create folder failed:', e);
            toast.error(e?.message || 'Failed to create folder');
        }
    };

    const handleOpen = (doc: DocumentItem) => {
        if (doc.isFolder) {
            setParentId(doc._id);
            return;
        }
        if (doc.fileUrl) window.open(doc.fileUrl, '_blank');
    };

    const handleDownload = (doc: DocumentItem) => {
        if (!doc.fileUrl) return;
        const a = document.createElement('a');
        a.href = doc.fileUrl;
        a.target = '_blank';
        a.rel = 'noreferrer';
        a.download = doc.title || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = async (doc: DocumentItem) => {
        try {
            await documentsApi.delete(doc._id);
            toast.success('Deleted');
            fetchItems();
        } catch (e: any) {
            console.error('Delete failed:', e);
            toast.error(e?.message || 'Delete failed');
        }
    };

    const currentCategoryLabel = categories.find((c) => c.value === selectedCategory)?.label || 'All Files';
    const folderAndFiles = items;

    const formatPatientName = (doc: DocumentItem) => {
        if (!doc?.patient) return 'General';
        if (typeof doc.patient === 'string') return 'General';
        const fn = String(doc.patient.firstName || '').trim();
        const ln = String(doc.patient.lastName || '').trim();
        const name = `${fn} ${ln}`.trim();
        return name || 'General';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                        <p className="text-muted-foreground mt-1">Manage patient files, reports, and digital assets</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            id="documents-upload"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <Button variant="outline" onClick={handleUploadClick} disabled={uploading}>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </Button>
                        <Button onClick={handleCreateFolder}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Folder
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="md:col-span-1 border-border/50 h-fit">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <nav className="flex flex-col space-y-1">
                                {categories.map((cat) => (
                                    <Button
                                        key={cat.value}
                                        variant={selectedCategory === cat.value ? 'secondary' : 'ghost'}
                                        className="justify-start rounded-none px-4"
                                        onClick={() => {
                                            setSelectedCategory(cat.value);
                                            setParentId(null);
                                        }}
                                    >
                                        <FolderOpen className="mr-2 h-4 w-4" />
                                        {cat.label}
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle>File Library</CardTitle>
                                <CardDescription>{currentCategoryLabel}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 w-full max-w-xl justify-end">
                                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Patients</SelectItem>
                                        {patients.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {p.firstName} {p.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search files..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {parentId ? (
                                <div className="mb-4">
                                    <Button variant="outline" size="sm" onClick={() => setParentId(null)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                </div>
                            ) : null}
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="text-sm text-muted-foreground">Loading...</div>
                                    ) : null}
                                    {!loading && folderAndFiles.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No files found.</div>
                                    ) : null}

                                    {folderAndFiles.map((doc) => {
                                        const type = getType(doc);
                                        const date = doc.uploadDate || doc.createdAt;
                                        return (
                                        <div
                                            key={doc._id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleOpen(doc)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleOpen(doc);
                                                }
                                            }}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    {getIcon(type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{doc.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        {doc.isFolder ? (
                                                            <span>Folder</span>
                                                        ) : (
                                                            <span>{formatFileSize(doc.fileSize)}</span>
                                                        )}
                                                        <span>•</span>
                                                        <span>{formatPatientName(doc)}</span>
                                                        {date ? (
                                                            <>
                                                                <span>•</span>
                                                                <span>{new Date(date).toISOString().slice(0, 10)}</span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpen(doc);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    disabled={Boolean(doc.isFolder) || !doc.fileUrl}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(doc);
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(doc);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                <FormModal
                    open={showFolderModal}
                    onOpenChange={setShowFolderModal}
                    title="New Folder"
                    description="Create a folder to organize your documents"
                    onSubmit={submitCreateFolder}
                    size="sm"
                >
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="folderName">Folder Name</Label>
                            <Input
                                id="folderName"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="e.g., Patient Files"
                            />
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
};

export default Documents;
