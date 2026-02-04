import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormModal } from '@/components/shared/FormModal';
import { treatmentsApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, PieChart, Stethoscope, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type TreatmentStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

interface ApiTreatment {
  _id: string;
  patient?: { _id?: string; firstName?: string; lastName?: string };
  dentist?: { _id?: string; firstName?: string; lastName?: string };
  procedure?: { _id?: string; name?: string; price?: number };
  treatmentType?: string;
  teeth?: string[];
  status?: TreatmentStatus;
  startDate?: string;
  completionDate?: string;
  description?: string;
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  paidAmount?: number;
  advancePaid?: number;
  progressPercent?: number;
  plannedSessions?: number;
  sessions?: Array<{ date?: string; duration?: number; notes?: string }>
}

const statusConfig: Record<TreatmentStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-info/10 text-info' },
  'in-progress': { label: 'In Progress', color: 'bg-warning/10 text-warning' },
  completed: { label: 'Completed', color: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
};

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

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

const pct = (num: number, den: number) => {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return clampPct((num / den) * 100);
};

function TreatmentPlanDetailsContent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<ApiTreatment | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionForm, setSessionForm] = useState({ date: '', duration: '', notes: '' });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) {
        setLoading(false);
        setTreatment(null);
        return;
      }

      try {
        setLoading(true);
        const res = await treatmentsApi.getById(id);
        const t = (res?.data?.treatment || null) as ApiTreatment | null;
        if (!isMounted) return;
        setTreatment(t);
      } catch {
        if (!isMounted) return;
        setTreatment(null);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const reload = async () => {
    if (!id) return;
    const res = await treatmentsApi.getById(id);
    setTreatment((res?.data?.treatment || null) as ApiTreatment | null);
  };

  const handleCompleteSession = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await treatmentsApi.addSession(id, { date: new Date().toISOString() });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await treatmentsApi.update(id, { status: 'completed', completionDate: new Date().toISOString(), progressPercent: 100 });
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const openEditSession = (sessionId: string) => {
    const s = (treatment?.sessions || []).find((x: any) => String((x as any)?._id || '') === String(sessionId));
    if (!s) return;
    const date = s?.date ? new Date(s.date).toISOString().slice(0, 10) : '';
    setSelectedSessionId(sessionId);
    setSessionForm({
      date,
      duration: s?.duration !== undefined && s?.duration !== null ? String(s.duration) : '',
      notes: String(s?.notes || ''),
    });
    setShowSessionModal(true);
  };

  const submitSessionUpdate = async () => {
    if (!id || !selectedSessionId) return;
    try {
      setSaving(true);
      await treatmentsApi.updateSession(id, selectedSessionId, {
        date: sessionForm.date ? new Date(sessionForm.date).toISOString() : undefined,
        duration: sessionForm.duration !== '' ? Number(sessionForm.duration) : null,
        notes: sessionForm.notes !== '' ? sessionForm.notes : null,
      });
      setShowSessionModal(false);
      setSelectedSessionId('');
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const patientName = useMemo(() => {
    const p = treatment?.patient;
    return `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown Patient';
  }, [treatment]);

  const dentistName = useMemo(() => {
    const d = treatment?.dentist;
    const name = `${d?.firstName || ''} ${d?.lastName || ''}`.trim();
    return name ? `Dr. ${name}` : '-';
  }, [treatment]);

  if (loading) {
    return <LoadingState type="cards" />;
  }

  if (!treatment) {
    return (
      <EmptyState
        title="Treatment plan not found"
        description="The requested treatment plan does not exist or you do not have access."
        action={{
          label: 'Back to Treatment Plans',
          onClick: () => navigate('/treatments'),
        }}
      />
    );
  }

  const status = statusConfig[(treatment.status || 'planned') as TreatmentStatus];
  const totalCost = typeof treatment.actualCost === 'number'
    ? treatment.actualCost
    : (typeof treatment.estimatedCost === 'number' ? treatment.estimatedCost : 0);
  const paidAmount = (typeof treatment.paidAmount === 'number' ? treatment.paidAmount : 0)
    + (typeof treatment.advancePaid === 'number' ? treatment.advancePaid : 0);
  const balance = Math.max((totalCost || 0) - (paidAmount || 0), 0);

  const paymentPct = pct(paidAmount || 0, totalCost || 0);

  const sessionsTotal = typeof treatment.plannedSessions === 'number' && treatment.plannedSessions > 0
    ? Math.max(1, Math.round(treatment.plannedSessions))
    : 1;
  const sessionsDone = (treatment.sessions || []).length;

  const sessionsPct = sessionsTotal > 0 ? pct(sessionsDone, sessionsTotal) : 0;
  const statusPct = clampPct(
    treatment.status === 'completed'
      ? 100
      : treatment.status === 'in-progress'
        ? 55
        : treatment.status === 'planned'
          ? 15
          : 0
  );

  const manualPct = typeof treatment.progressPercent === 'number' ? clampPct(treatment.progressPercent) : null;
  const overallPct = manualPct !== null
    ? Math.round(manualPct)
    : (sessionsTotal > 0
      ? Math.round((sessionsPct * 0.6) + (statusPct * 0.4))
      : Math.round(statusPct));

  const remainingPct = clampPct(100 - overallPct);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/treatments')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-2">Treatment Plan Details</h1>
          <p className="text-muted-foreground">View complete treatment plan information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCompleteSession}
            disabled={saving || (treatment.status === 'completed')}
          >
            Complete Session
          </Button>
          <Button
            variant="default"
            onClick={handleMarkCompleted}
            disabled={saving || (treatment.status === 'completed')}
          >
            Mark Completed
          </Button>
          <Badge className={cn('font-medium', status.color)}>{status.label}</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PieChart className="w-4 h-4" />
              <span>Progress Overview</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="relative w-28 h-28">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${overallPct}%, hsl(var(--muted)) 0)`,
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-card flex flex-col items-center justify-center shadow-sm">
                  <div className="text-2xl font-bold text-foreground">{overallPct}%</div>
                  <div className="text-xs text-muted-foreground">{manualPct !== null ? 'Manual' : 'Completed'}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Treatment Progress</span>
                  <span className="font-medium text-foreground">{overallPct}% done, {remainingPct}% left</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${overallPct}%` }} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sessions</span>
                    <span className="text-sm font-semibold text-foreground">
                      {sessionsTotal > 0 ? `${sessionsDone}/${sessionsTotal}` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-info rounded-full" style={{ width: `${sessionsPct}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{sessionsTotal > 0 ? `${Math.round(sessionsPct)}% scheduled done` : 'No sessions added'}</div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment</span>
                    <span className="text-sm font-semibold text-foreground">{Math.round(paymentPct)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-success rounded-full" style={{ width: `${paymentPct}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Paid ${paidAmount.toLocaleString()} / ${totalCost.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Mark status as Completed when the whole plan is finished.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Quick Summary</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground">{status.label}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium text-foreground">{remainingPct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold text-foreground">${balance.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Plan Overview</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Patient</span>
                </div>
                <p className="font-semibold text-foreground">{patientName}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Stethoscope className="w-4 h-4" />
                  <span>Dentist</span>
                </div>
                <p className="font-semibold text-foreground">{dentistName}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Treatment Type</p>
                <p className="font-medium text-foreground">{formatTitle(treatment.treatmentType)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Procedure</p>
                <p className="font-medium text-foreground">
                  {treatment.procedure?.name
                    ? `${treatment.procedure.name}${typeof treatment.procedure.price === 'number' ? ` - $${treatment.procedure.price.toLocaleString()}` : ''}`
                    : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Teeth</p>
                <p className="font-medium text-foreground">{(treatment.teeth || []).length > 0 ? (treatment.teeth || []).join(', ') : '-'}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-foreground whitespace-pre-wrap">{treatment.description || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-foreground whitespace-pre-wrap">{treatment.notes || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>Timeline</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{formatDate(treatment.startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion Date</span>
                <span className="font-medium">{formatDate(treatment.completionDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Costs</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated</span>
                <span className="font-medium">${(treatment.estimatedCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actual</span>
                <span className="font-medium">${(treatment.actualCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid / Advance</span>
                <span className="font-medium">${(paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">${(totalCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-foreground">${(balance || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>Sessions</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(treatment.sessions || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No sessions recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {(treatment.sessions || []).map((s: any, idx: number) => {
                const sid = String(s?._id || idx);
                const dateLabel = s?.date ? new Date(s.date).toLocaleDateString() : '-';
                const durationLabel = s?.duration ? `${s.duration} min` : '-';
                return (
                  <div key={sid} className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">Session {idx + 1}</div>
                      <div className="text-xs text-muted-foreground">Date: {dateLabel} • Duration: {durationLabel}</div>
                      {s?.notes ? <div className="text-sm text-foreground whitespace-pre-wrap">{String(s.notes)}</div> : null}
                    </div>
                    {s?._id ? (
                      <Button variant="outline" size="sm" onClick={() => openEditSession(String(s._id))} disabled={saving}>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        open={showSessionModal}
        onOpenChange={(open) => {
          setShowSessionModal(open);
          if (!open) setSelectedSessionId('');
        }}
        title="Update Session"
        onSubmit={submitSessionUpdate}
        submitLabel="Update"
        isLoading={saving}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={4} />
          </div>
        </div>
      </FormModal>
    </div>
  );
}

export default function TreatmentPlanDetails() {
  return (
    <DashboardLayout>
      <TreatmentPlanDetailsContent />
    </DashboardLayout>
  );
}
