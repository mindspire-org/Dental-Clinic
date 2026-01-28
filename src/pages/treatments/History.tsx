import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, CheckCircle2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const history = [
    { id: 1, date: '2024-03-20', patient: 'Sarah Johnson', treatment: 'Root Canal (Molar)', doctor: 'Dr. Mitchell', notes: 'Patient reported sensitivity subsided.', outcome: 'Successful' },
    { id: 2, date: '2024-03-19', patient: 'Michael Chen', treatment: 'Extraction', doctor: 'Dr. Wilson', notes: 'Surgical extraction of 38.', outcome: 'Successful' },
    { id: 3, date: '2024-03-18', patient: 'Emma Davis', treatment: 'Standard Cleaning', doctor: 'Dr. Mitchell', notes: 'Routine hygiene check.', outcome: 'Completed' },
];

export default function History() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Treatment History</h1>
                    <p className="text-muted-foreground">Log of all completed procedures</p>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search history..." className="pl-10" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {history.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Stethoscope className="w-5 h-5" />
                                        </div>
                                        <div className="h-full w-px bg-border my-2"></div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{item.treatment}</h3>
                                                <p className="text-sm text-muted-foreground">Patient: <span className="text-foreground font-medium">{item.patient}</span> • {item.date}</p>
                                            </div>
                                            <Badge variant="outline" className="w-fit border-success/50 text-success bg-success/5 flex gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> {item.outcome}
                                            </Badge>
                                        </div>
                                        <div className="bg-muted/40 p-3 rounded-md text-sm">
                                            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1">Doctor's Notes</span>
                                            {item.notes} — with <span className="font-medium">{item.doctor}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
