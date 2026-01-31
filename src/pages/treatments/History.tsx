import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Stethoscope, CheckCircle2 } from 'lucide-react';
import { treatmentsApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

type TreatmentStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

interface ApiTreatment {
    _id: string;
    patient?: { firstName?: string; lastName?: string };
    dentist?: { firstName?: string; lastName?: string };
    treatmentType?: string;
    teeth?: string[];
    status?: TreatmentStatus;
    completionDate?: string;
    startDate?: string;
    notes?: string;
    description?: string;
    updatedAt?: string;
}

interface HistoryItem {
    id: string;
    date: string;
    patient: string;
    treatment: string;
    doctor: string;
    notes: string;
    outcome: string;
}

const formatTitle = (value?: string) => {
    const v = String(value || '').trim();
    if (!v) return 'Treatment';
    return v
        .split('-')
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
};

export default function History() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<HistoryItem[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await treatmentsApi.getAll({ status: 'completed' });
                const treatments = (res?.data?.treatments || []) as ApiTreatment[];

                const mapped: HistoryItem[] = treatments.map((t) => {
                    const patientName = `${t.patient?.firstName || ''} ${t.patient?.lastName || ''}`.trim() || 'Unknown Patient';
                    const dentistName = `${t.dentist?.firstName || ''} ${t.dentist?.lastName || ''}`.trim();
                    const proc = formatTitle(t.treatmentType);
                    const teethLabel = (t.teeth && t.teeth.length > 0) ? `(#${t.teeth.join(', ')})` : '';
                    const date = formatDate(t.completionDate || t.updatedAt || t.startDate);
                    const notes = String(t.notes || t.description || '').trim();

                    return {
                        id: t._id,
                        date,
                        patient: patientName,
                        treatment: teethLabel ? `${proc} ${teethLabel}` : proc,
                        doctor: dentistName ? `Dr. ${dentistName}` : '-',
                        notes: notes || '-',
                        outcome: 'Completed',
                    };
                });

                if (!isMounted) return;
                setItems(mapped);
            } catch (e) {
                if (!isMounted) return;
                console.error('Error fetching history:', e);
                setItems([]);
            } finally {
                if (!isMounted) return;
                setLoading(false);
            }
        };

        fetchHistory();
        return () => {
            isMounted = false;
        };
    }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => {
            return (
                item.patient.toLowerCase().includes(q) ||
                item.treatment.toLowerCase().includes(q) ||
                item.doctor.toLowerCase().includes(q) ||
                item.notes.toLowerCase().includes(q)
            );
        });
    }, [items, searchTerm]);

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="cards" rows={6} />
            </DashboardLayout>
        );
    }

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
                            <Input
                                placeholder="Search history..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filtered.length === 0 ? (
                            <EmptyState
                                title="No completed treatments"
                                description={searchTerm ? 'Try adjusting your search' : 'Completed treatments will appear here'}
                            />
                        ) : (
                            <div className="space-y-8">
                                {filtered.map((item) => (
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
