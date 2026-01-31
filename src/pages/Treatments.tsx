import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dentistsApi, patientsApi, treatmentProceduresApi, treatmentsApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormModal } from '@/components/shared/FormModal';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

type TreatmentStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

interface TreatmentPlan {
  id: string;
  patientName: string;
  procedures: string[];
  status: TreatmentStatus;
  totalCost: number;
  paid: number;
  plannedSessions: number;
  startDate: string;
  nextSession?: string;
  dentist: string;
}

interface ApiTreatment {
  _id: string;
  patient?: { _id?: string; firstName?: string; lastName?: string };
  dentist?: { _id?: string; firstName?: string; lastName?: string };
  procedure?: { _id?: string; name?: string };
  treatmentType?: string;
  description?: string;
  notes?: string;
  teeth?: string[];
  status?: TreatmentStatus;
  startDate?: string;
  completionDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  paidAmount?: number;
  advancePaid?: number;
  progressPercent?: number;
  plannedSessions?: number;
  sessions?: Array<{ date?: string | Date }>;
}

interface OptionItem {
  _id: string;
  firstName?: string;
  lastName?: string;
}

interface ProcedureOption {
  _id: string;
  name?: string;
  price?: number;
  sessions?: number;
}

const statusConfig = {
  planned: { label: 'Planned', color: 'bg-info/10 text-info', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'bg-warning/10 text-warning', icon: Clock },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
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

const getNextSession = (sessions?: Array<{ date?: string | Date }>) => {
  const now = Date.now();
  const upcoming = (sessions || [])
    .map((s) => (s?.date ? new Date(s.date).getTime() : NaN))
    .filter((t) => Number.isFinite(t) && t > now)
    .sort((a, b) => a - b);

  if (upcoming.length === 0) return undefined;
  return new Date(upcoming[0]).toLocaleDateString();
};

function TreatmentsContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const quickAddHandledRef = useRef(false);
  const [treatments, setTreatments] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [patients, setPatients] = useState<OptionItem[]>([]);
  const [dentists, setDentists] = useState<OptionItem[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<ProcedureOption[]>([]);

  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    treatmentType: '',
    procedureId: 'none',
    description: '',
    teeth: '',
    status: 'planned' as TreatmentStatus,
    progressPercent: 0,
    startDate: '',
    completionDate: '',
    estimatedCost: '',
    actualCost: '',
    paidAmount: '',
    plannedSessions: '1',
    notes: '',
  });

  useEffect(() => {
    if (formData.procedureId === 'none') return;
    const selected = procedureOptions.find((p) => p._id === formData.procedureId);
    if (!selected) return;

    const price = typeof selected.price === 'number' ? selected.price : undefined;
    if (typeof price !== 'number') return;

    const priceStr = String(price);
    setFormData((prev) => {
      if (prev.procedureId !== formData.procedureId) return prev;

      const next: typeof prev = { ...prev };
      if (!next.actualCost || next.actualCost === '0') next.actualCost = priceStr;
      if (!next.estimatedCost || next.estimatedCost === '0') next.estimatedCost = priceStr;
      if (typeof selected.sessions === 'number') {
        const s = Math.max(1, Math.round(selected.sessions));
        if (!next.plannedSessions || next.plannedSessions === '1') next.plannedSessions = String(s);
      }
      return next;
    });
  }, [formData.procedureId, procedureOptions]);

  const fetchTreatments = async () => {
    const res = await treatmentsApi.getAll();
    const apiTreatments = (res?.data?.treatments || []) as ApiTreatment[];

    const mapped: TreatmentPlan[] = apiTreatments.map((t) => {
      const patientName = `${t.patient?.firstName || ''} ${t.patient?.lastName || ''}`.trim() || 'Unknown Patient';
      const dentistName = `${t.dentist?.firstName || ''} ${t.dentist?.lastName || ''}`.trim();
      const proc = (t.procedure?.name || '').trim() || formatTitle(t.treatmentType);
      const teethLabel = (t.teeth && t.teeth.length > 0) ? `#${t.teeth.join(', ')}` : '';
      const totalCost = (typeof t.actualCost === 'number' ? t.actualCost : (typeof t.estimatedCost === 'number' ? t.estimatedCost : 0));
      const nextSession = getNextSession(t.sessions);
      const paid = (typeof t.paidAmount === 'number' ? t.paidAmount : 0) + (typeof t.advancePaid === 'number' ? t.advancePaid : 0);
      const plannedSessions = typeof t.plannedSessions === 'number' && t.plannedSessions > 0
        ? Math.max(1, Math.round(t.plannedSessions))
        : 1;

      return {
        id: t._id,
        patientName,
        procedures: [teethLabel ? `${proc} ${teethLabel}` : proc],
        status: (t.status || 'planned') as TreatmentStatus,
        totalCost,
        paid,
        plannedSessions,
        startDate: formatDate(t.startDate),
        nextSession,
        dentist: dentistName ? `Dr. ${dentistName}` : '-',
      };
    });

    setTreatments(mapped);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        await fetchTreatments();

        const [patientsRes, dentistsRes] = await Promise.all([
          patientsApi.getAll({ limit: 200 }),
          dentistsApi.getAll({ isActive: true }),
        ]);

        const proceduresRes = await treatmentProceduresApi.getAll({ isActive: true });

        if (!isMounted) return;
        setPatients((patientsRes?.data?.patients || []) as OptionItem[]);
        setDentists((dentistsRes?.data?.dentists || []) as OptionItem[]);
        setProcedureOptions((proceduresRes?.data?.procedures || []) as ProcedureOption[]);
      } catch (e) {
        if (!isMounted) return;
        console.error('Error fetching treatments:', e);
        setTreatments([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreate = () => {
    setEditId(null);
    setFormData({
      patientId: '',
      dentistId: '',
      treatmentType: '',
      procedureId: 'none',
      description: '',
      teeth: '',
      status: 'planned',
      progressPercent: 0,
      startDate: '',
      completionDate: '',
      estimatedCost: '',
      actualCost: '',
      paidAmount: '',
      plannedSessions: '1',
      notes: '',
    });
    setShowModal(true);
  };

  useEffect(() => {
    const openNew = searchParams.get('new') === '1';
    if (!openNew) return;
    if (quickAddHandledRef.current) return;
    quickAddHandledRef.current = true;
    openCreate();

    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [openCreate, searchParams, setSearchParams]);

  const openEdit = async (id: string) => {
    try {
      setSaving(true);
      const res = await treatmentsApi.getById(id);
      const t = (res?.data?.treatment || null) as ApiTreatment | null;
      if (!t) {
        toast.error('Treatment plan not found');
        return;
      }

      setEditId(id);
      setFormData({
        patientId: t.patient?._id || '',
        dentistId: t.dentist?._id || '',
        treatmentType: t.treatmentType || '',
        procedureId: t.procedure?._id || 'none',
        description: t.description || '',
        teeth: (t.teeth || []).join(', '),
        status: (t.status || 'planned') as TreatmentStatus,
        progressPercent: typeof t.progressPercent === 'number' ? t.progressPercent : 0,
        startDate: t.startDate ? String(t.startDate).slice(0, 10) : '',
        completionDate: t.completionDate ? String(t.completionDate).slice(0, 10) : '',
        estimatedCost: typeof t.estimatedCost === 'number' ? String(t.estimatedCost) : '',
        actualCost: typeof t.actualCost === 'number' ? String(t.actualCost) : '',
        paidAmount: typeof t.paidAmount === 'number' ? String(t.paidAmount) : '',
        plannedSessions: typeof t.plannedSessions === 'number' ? String(t.plannedSessions) : '1',
        notes: t.notes || '',
      });
      setShowModal(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load treatment plan');
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    if (!formData.patientId || !formData.dentistId || !formData.treatmentType || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        patient: formData.patientId,
        dentist: formData.dentistId,
        treatmentType: formData.treatmentType,
        description: formData.description,
        status: formData.status,
      };

      const teeth = formData.teeth
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (teeth.length > 0) payload.teeth = teeth;
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.completionDate) payload.completionDate = formData.completionDate;
      if (formData.estimatedCost !== '') {
        const v = Number(formData.estimatedCost);
        if (Number.isFinite(v)) payload.estimatedCost = v;
      }
      if (formData.actualCost !== '') {
        const v = Number(formData.actualCost);
        if (Number.isFinite(v)) payload.actualCost = v;
      }
      if (formData.paidAmount !== '') {
        const v = Number(formData.paidAmount);
        if (Number.isFinite(v)) payload.paidAmount = v;
      }
      if (formData.plannedSessions !== '') {
        const v = Number(formData.plannedSessions);
        if (Number.isFinite(v) && v > 0) payload.plannedSessions = Math.max(1, Math.round(v));
      }
      if (formData.notes) payload.notes = formData.notes;
      if (formData.procedureId && formData.procedureId !== 'none') payload.procedure = formData.procedureId;
      if (Number.isFinite(formData.progressPercent)) {
        payload.progressPercent = Math.max(0, Math.min(100, Math.round(formData.progressPercent)));
      }

      if (editId) {
        await treatmentsApi.update(editId, payload);
        toast.success('Treatment plan updated');
      } else {
        await treatmentsApi.create(payload);
        toast.success('Treatment plan created');
      }
      setShowModal(false);
      setEditId(null);
      await fetchTreatments();
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${editId ? 'update' : 'create'} treatment plan`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await treatmentsApi.delete(deleteId);
      toast.success('Treatment plan deleted');
      setShowDeleteDialog(false);
      setDeleteId(null);
      await fetchTreatments();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete treatment plan');
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const activePlans = treatments.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    const completed = treatments.filter(t => t.status === 'completed').length;
    const revenuePending = treatments
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .reduce((sum, t) => sum + Math.max((t.totalCost || 0) - (t.paid || 0), 0), 0);
    const avgPlanValue = treatments.length > 0
      ? treatments.reduce((sum, t) => sum + (t.totalCost || 0), 0) / treatments.length
      : 0;

    return [
      { label: 'Active Plans', value: String(activePlans), change: `${activePlans} in progress`, trend: 'up' },
      { label: 'Completed', value: String(completed), change: `${completed} completed`, trend: 'up' },
      { label: 'Revenue Pending', value: `$${revenuePending.toLocaleString()}`, change: `From ${activePlans} plans`, trend: 'neutral' },
      { label: 'Avg. Plan Value', value: `$${Math.round(avgPlanValue).toLocaleString()}`, change: 'Based on listed plans', trend: 'up' },
    ];
  }, [treatments]);

  if (loading) {
    return <LoadingState type="table" rows={10} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treatment Plans</h1>
          <p className="text-muted-foreground">Manage patient treatment plans and procedures</p>
        </div>
        <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Treatment Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="shadow-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className={cn(
                'text-xs mt-1',
                stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'
              )}>{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Treatment Plans List */}
      <div className="grid gap-4">
        {treatments.length === 0 ? (
          <EmptyState
            title="No treatment plans found"
            description="Create a treatment plan to get started"
          />
        ) : treatments.map((treatment, index) => {
          const status = statusConfig[treatment.status];
          const StatusIcon = status.icon;
          const paymentProgress = treatment.totalCost > 0 ? (treatment.paid / treatment.totalCost) * 100 : 0;

          return (
            <Card 
              key={treatment.id} 
              className="shadow-card hover:shadow-lg transition-all cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/treatments/${treatment.id}`)}
            >

              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Patient & Treatment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{treatment.patientName}</h3>
                      <Badge className={cn('font-medium', status.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{treatment.id}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {treatment.procedures.map((proc, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {proc}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Started: {treatment.startDate}</span>
                      {treatment.nextSession && (
                        <span className="text-primary font-medium">Next: {treatment.nextSession}</span>
                      )}
                      <span>Sessions: {treatment.plannedSessions} day(s)</span>
                      <span>{treatment.dentist}</span>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="lg:w-64">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Payment Progress</span>
                      <span className="text-sm font-medium">
                        ${treatment.paid.toLocaleString()} / ${treatment.totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          paymentProgress === 100 ? 'bg-success' : 'bg-primary'
                        )}
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentProgress === 100 ? 'Fully paid' : `${Math.round(paymentProgress)}% paid`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/treatments/${treatment.id}`);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" /> Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(treatment.id);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDelete(treatment.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/treatments/${treatment.id}`);
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FormModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editId ? 'Edit Treatment Plan' : 'New Treatment Plan'}
        description={editId ? 'Update the patient treatment plan' : 'Create a new patient treatment plan'}
        onSubmit={handleSave}
        submitLabel={editId ? 'Update' : 'Create'}
        isLoading={saving}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {`${p.firstName || ''} ${p.lastName || ''}`.trim() || p._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dentist *</Label>
              <Select
                value={formData.dentistId}
                onValueChange={(value) => setFormData({ ...formData, dentistId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dentist" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {`${d.firstName || ''} ${d.lastName || ''}`.trim() || d._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Progress (%)</Label>
                <span className="text-sm font-medium text-foreground">{Math.round(formData.progressPercent)}%</span>
              </div>
              <Slider
                value={[formData.progressPercent]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setFormData({ ...formData, progressPercent: v[0] ?? 0 })}
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.progressPercent}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const next = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 0;
                  setFormData({ ...formData, progressPercent: next });
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Treatment Type *</Label>
              <Select
                value={formData.treatmentType}
                onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filling">Filling</SelectItem>
                  <SelectItem value="root-canal">Root Canal</SelectItem>
                  <SelectItem value="crown">Crown</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="extraction">Extraction</SelectItem>
                  <SelectItem value="implant">Implant</SelectItem>
                  <SelectItem value="dentures">Dentures</SelectItem>
                  <SelectItem value="whitening">Whitening</SelectItem>
                  <SelectItem value="braces">Braces</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="scaling">Scaling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Procedure Name (optional)</Label>
              <Select
                value={formData.procedureId}
                onValueChange={(value) => setFormData({ ...formData, procedureId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {procedureOptions.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {(p.name || p._id)}{typeof p.price === 'number' ? ` - $${p.price.toLocaleString()}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TreatmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Planned Sessions (days)</Label>
              <Input
                type="number"
                min={1}
                value={formData.plannedSessions}
                onChange={(e) => setFormData({ ...formData, plannedSessions: e.target.value })}
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the plan..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Teeth (comma separated)</Label>
              <Input
                value={formData.teeth}
                onChange={(e) => setFormData({ ...formData, teeth: e.target.value })}
                placeholder="e.g., 12, 13"
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Cost</Label>
              <Input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Paid / Advance</Label>
              <Input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                placeholder="0"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const base = Number(formData.actualCost || formData.estimatedCost || 0);
                    const next = base > 0 ? Math.round(base * 0.25) : 0;
                    setFormData({ ...formData, paidAmount: String(next) });
                  }}
                >
                  Advance 25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const base = Number(formData.actualCost || formData.estimatedCost || 0);
                    const next = base > 0 ? Math.round(base * 0.5) : 0;
                    setFormData({ ...formData, paidAmount: String(next) });
                  }}
                >
                  Half 50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const base = Number(formData.actualCost || formData.estimatedCost || 0);
                    const next = base > 0 ? Math.round(base) : 0;
                    setFormData({ ...formData, paidAmount: String(next) });
                  }}
                >
                  Full 100%
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual Cost</Label>
              <Input
                type="number"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Completion Date</Label>
              <Input
                type="date"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
        </div>
      </FormModal>

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
        title="Delete Treatment Plan"
        description="Are you sure you want to delete this treatment plan? This action cannot be undone."
      />
    </div>
  );
}

export default function Treatments() {
  return (
    <DashboardLayout>
      <TreatmentsContent />
    </DashboardLayout>
  );
}
