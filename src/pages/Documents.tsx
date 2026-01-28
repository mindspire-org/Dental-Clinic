import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Upload, Filter, FileText, Image, File, FolderOpen, Download, Trash2, Eye } from 'lucide-react';

const Documents = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const documents = [
        { id: 1, name: 'John Doe - Consent Form.pdf', type: 'pdf', category: 'Consent Forms', date: '2024-03-20', size: '245 KB' },
        { id: 2, name: 'Sarah Smith - X-Ray 12.jpg', type: 'image', category: 'X-Rays', date: '2024-03-19', size: '1.2 MB' },
        { id: 3, name: 'Treatment Plan - 10023.docx', type: 'doc', category: 'Treatment Plans', date: '2024-03-18', size: '45 KB' },
        { id: 4, name: 'Lab Report - RX009.pdf', type: 'pdf', category: 'Lab Reports', date: '2024-03-15', size: '890 KB' },
        { id: 5, name: 'Insurance Claim - #4521.pdf', type: 'pdf', category: 'Insurance', date: '2024-03-15', size: '320 KB' },
    ];

    const categories = ['All Files', 'Consent Forms', 'X-Rays', 'Treatment Plans', 'Lab Reports', 'Insurance'];

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="h-8 w-8 text-red-500" />;
            case 'image': return <Image className="h-8 w-8 text-blue-500" />;
            case 'doc': return <File className="h-8 w-8 text-blue-600" />;
            default: return <File className="h-8 w-8 text-gray-500" />;
        }
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
                        <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                        </Button>
                        <Button>
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
                                {categories.map((cat, i) => (
                                    <Button
                                        key={cat}
                                        variant={i === 0 ? 'secondary' : 'ghost'}
                                        className="justify-start rounded-none px-4"
                                    >
                                        <FolderOpen className="mr-2 h-4 w-4" />
                                        {cat}
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle>File Library</CardTitle>
                                <CardDescription>Browse and manage your documents.</CardDescription>
                            </div>
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
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="space-y-4">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    {getIcon(doc.type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{doc.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span>{doc.size}</span>
                                                        <span>•</span>
                                                        <span>{doc.date}</span>
                                                        <span>•</span>
                                                        <span>{doc.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Documents;
