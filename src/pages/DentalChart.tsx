import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  RotateCcw, 
  ZoomIn,
  ZoomOut,
  Save,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dentalChartApi, patientsApi } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/components/ui/use-toast';

// Tooth status types
type ToothStatus = 'healthy' | 'cavity' | 'filling' | 'crown' | 'missing' | 'root-canal' | 'implant' | 'extraction-needed';

interface Tooth {
  id: number;
  name: string;
  status: ToothStatus;
  notes?: string;
}

type ToothDef = { id: number; name: string };

const upperToothDefs: ToothDef[] = [
  { id: 18, name: 'Upper Right 3rd Molar' },
  { id: 17, name: 'Upper Right 2nd Molar' },
  { id: 16, name: 'Upper Right 1st Molar' },
  { id: 15, name: 'Upper Right 2nd Premolar' },
  { id: 14, name: 'Upper Right 1st Premolar' },
  { id: 13, name: 'Upper Right Canine' },
  { id: 12, name: 'Upper Right Lateral Incisor' },
  { id: 11, name: 'Upper Right Central Incisor' },
  { id: 21, name: 'Upper Left Central Incisor' },
  { id: 22, name: 'Upper Left Lateral Incisor' },
  { id: 23, name: 'Upper Left Canine' },
  { id: 24, name: 'Upper Left 1st Premolar' },
  { id: 25, name: 'Upper Left 2nd Premolar' },
  { id: 26, name: 'Upper Left 1st Molar' },
  { id: 27, name: 'Upper Left 2nd Molar' },
  { id: 28, name: 'Upper Left 3rd Molar' },
];

const lowerToothDefs: ToothDef[] = [
  { id: 48, name: 'Lower Right 3rd Molar' },
  { id: 47, name: 'Lower Right 2nd Molar' },
  { id: 46, name: 'Lower Right 1st Molar' },
  { id: 45, name: 'Lower Right 2nd Premolar' },
  { id: 44, name: 'Lower Right 1st Premolar' },
  { id: 43, name: 'Lower Right Canine' },
  { id: 42, name: 'Lower Right Lateral Incisor' },
  { id: 41, name: 'Lower Right Central Incisor' },
  { id: 31, name: 'Lower Left Central Incisor' },
  { id: 32, name: 'Lower Left Lateral Incisor' },
  { id: 33, name: 'Lower Left Canine' },
  { id: 34, name: 'Lower Left 1st Premolar' },
  { id: 35, name: 'Lower Left 2nd Premolar' },
  { id: 36, name: 'Lower Left 1st Molar' },
  { id: 37, name: 'Lower Left 2nd Molar' },
  { id: 38, name: 'Lower Left 3rd Molar' },
];

type ApiTooth = {
  toothNumber: number;
  condition: string;
  notes?: string;
  treatments?: Array<{
    _id: string;
    treatment?: { _id: string; name?: string; category?: string };
    treatmentType?: string;
    description?: string;
    date: string;
    dentist?: { _id: string; firstName?: string; lastName?: string };
    notes?: string;
    status: string;
  }>;
};

type ApiChart = {
  _id: string;
  patient: string;
  teeth: ApiTooth[];
  lastUpdated?: string;
  updatedBy?: { _id: string; firstName?: string; lastName?: string };
};

const toUiStatus = (condition: string | undefined): ToothStatus => {
  const c = String(condition || 'healthy').replaceAll('_', '-').toLowerCase();
  if (c === 'filled') return 'filling';
  if (c === 'root-canal') return 'root-canal';
  if (c === 'extraction-needed') return 'extraction-needed';
  if (c === 'filling') return 'filling';
  if (c === 'crown') return 'crown';
  if (c === 'missing') return 'missing';
  if (c === 'implant') return 'implant';
  if (c === 'cavity') return 'cavity';
  return 'healthy';
};

const toApiCondition = (status: ToothStatus): string => {
  if (status === 'root-canal') return 'root_canal';
  if (status === 'extraction-needed') return 'extraction_needed';
  if (status === 'filling') return 'filled';
  return status;
};

const statusConfig: Record<ToothStatus, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-success', bgColor: 'bg-success' },
  cavity: { label: 'Cavity', color: 'text-destructive', bgColor: 'bg-destructive' },
  filling: { label: 'Filling', color: 'text-info', bgColor: 'bg-info' },
  crown: { label: 'Crown', color: 'text-chart-4', bgColor: 'bg-chart-4' },
  missing: { label: 'Missing', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  'root-canal': { label: 'Root Canal', color: 'text-warning', bgColor: 'bg-warning' },
  implant: { label: 'Implant', color: 'text-accent', bgColor: 'bg-accent' },
  'extraction-needed': { label: 'Needs Extraction', color: 'text-destructive', bgColor: 'bg-destructive' },
};

interface ToothComponentProps {
  tooth: Tooth;
  isSelected: boolean;
  onClick: () => void;
  isUpper: boolean;
}

function ToothComponent({ tooth, isSelected, onClick, isUpper }: ToothComponentProps) {
  const config = statusConfig[tooth.status];
  const isMolar = tooth.id % 10 >= 6;
  const isPremolar = tooth.id % 10 >= 4 && tooth.id % 10 <= 5;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 p-1 rounded-lg transition-all duration-200',
        isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50',
        tooth.status === 'missing' && 'opacity-40'
      )}
    >
      {/* Tooth visual */}
      <div className={cn(
        'relative transition-transform duration-200',
        isSelected && 'scale-110'
      )}>
        <svg
          width={isMolar ? 36 : isPremolar ? 32 : 28}
          height={50}
          viewBox="0 0 40 60"
          className={cn(
            'transition-colors',
            tooth.status === 'missing' ? 'fill-muted' : 'fill-card stroke-border stroke-2'
          )}
        >
          {isUpper ? (
            // Upper tooth shape
            <path d={isMolar 
              ? "M8 5 Q5 15, 5 30 Q5 50, 15 55 Q20 58, 25 55 Q35 50, 35 30 Q35 15, 32 5 Q25 0, 20 0 Q15 0, 8 5"
              : "M12 5 Q8 15, 8 30 Q8 50, 18 55 Q20 56, 22 55 Q32 50, 32 30 Q32 15, 28 5 Q24 0, 20 0 Q16 0, 12 5"
            } />
          ) : (
            // Lower tooth shape
            <path d={isMolar
              ? "M8 55 Q5 45, 5 30 Q5 10, 15 5 Q20 2, 25 5 Q35 10, 35 30 Q35 45, 32 55 Q25 60, 20 60 Q15 60, 8 55"
              : "M12 55 Q8 45, 8 30 Q8 10, 18 5 Q20 4, 22 5 Q32 10, 32 30 Q32 45, 28 55 Q24 60, 20 60 Q16 60, 12 55"
            } />
          )}
        </svg>
        
        {/* Status indicator */}
        {tooth.status !== 'healthy' && tooth.status !== 'missing' && (
          <div className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full',
            config.bgColor
          )} />
        )}
        
        {/* Alert for extraction needed */}
        {tooth.status === 'extraction-needed' && (
          <AlertCircle className="absolute -top-1 -right-1 w-4 h-4 text-destructive" />
        )}
      </div>
      
      {/* Tooth number */}
      <span className={cn(
        'text-xs font-medium',
        isSelected ? 'text-primary' : 'text-muted-foreground'
      )}>
        {tooth.id}
      </span>
    </button>
  );
}

function DentalChartContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [chart, setChart] = useState<ApiChart | null>(null);
  const [toothState, setToothState] = useState<Record<number, { status: ToothStatus; notes: string }>>({});
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [patientTreatments, setPatientTreatments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const res = await patientsApi.getAll({ limit: 200 });
        const list = res.data?.patients || [];
        setPatients(list);
        const fromQuery = searchParams.get('patientId') || '';
        const initial = fromQuery || list?.[0]?._id || '';
        setPatientId(initial);
      } catch (e) {
        console.error('Failed to load patients', e);
        toast({ title: 'Failed to load patients', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [searchParams]);

  useEffect(() => {
    const loadChart = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const res = await dentalChartApi.getPatientChart(patientId);
        const c: ApiChart = res.data.chart;
        setChart(c);
        const state: Record<number, { status: ToothStatus; notes: string }> = {};
        (c.teeth || []).forEach((t) => {
          state[t.toothNumber] = {
            status: toUiStatus(t.condition),
            notes: t.notes || '',
          };
        });
        setToothState(state);
      } catch (e) {
        console.error('Failed to load dental chart', e);
        toast({ title: 'Failed to load dental chart', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [patientId]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!showHistory || !patientId) return;
      try {
        setHistoryLoading(true);
        const res = await patientsApi.getTreatments(patientId);
        setPatientTreatments(res?.data?.treatments || []);
      } catch (e) {
        console.error('Failed to load patient treatments', e);
        setPatientTreatments([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [showHistory, patientId]);

  const upperTeeth = useMemo<Tooth[]>(() => {
    return upperToothDefs.map((t) => ({
      id: t.id,
      name: t.name,
      status: toothState[t.id]?.status || 'healthy',
      notes: toothState[t.id]?.notes || '',
    }));
  }, [toothState]);

  const lowerTeeth = useMemo<Tooth[]>(() => {
    return lowerToothDefs.map((t) => ({
      id: t.id,
      name: t.name,
      status: toothState[t.id]?.status || 'healthy',
      notes: toothState[t.id]?.notes || '',
    }));
  }, [toothState]);

  const selectedTooth = useMemo<Tooth | null>(() => {
    if (!selectedToothNumber) return null;
    const all = [...upperTeeth, ...lowerTeeth];
    return all.find((t) => t.id === selectedToothNumber) || null;
  }, [selectedToothNumber, upperTeeth, lowerTeeth]);

  const selectedConfig = selectedTooth ? statusConfig[selectedTooth.status] : null;

  const patientName = useMemo(() => {
    const p = patients.find((x) => x._id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : '—';
  }, [patients, patientId]);

  const handlePatientChange = (id: string) => {
    setPatientId(id);
    setSelectedToothNumber(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('patientId', id);
      else next.delete('patientId');
      return next;
    });
  };

  const handleUpdateToothStatus = (status: ToothStatus) => {
    if (!selectedTooth) return;
    setToothState((prev) => ({
      ...prev,
      [selectedTooth.id]: {
        status,
        notes: prev[selectedTooth.id]?.notes || '',
      },
    }));
  };

  const handleUpdateToothNotes = (notes: string) => {
    if (!selectedTooth) return;
    setToothState((prev) => ({
      ...prev,
      [selectedTooth.id]: {
        status: prev[selectedTooth.id]?.status || 'healthy',
        notes,
      },
    }));
  };

  const handleSave = async () => {
    if (!patientId) return;
    try {
      setSaving(true);
      const teeth = [...upperToothDefs, ...lowerToothDefs].map((t) => ({
        toothNumber: t.id,
        condition: toApiCondition(toothState[t.id]?.status || 'healthy'),
        notes: toothState[t.id]?.notes || '',
      }));
      const res = await dentalChartApi.updateChart(patientId, { teeth });
      setChart(res.data.chart);
      toast({ title: 'Dental chart saved' });
    } catch (e) {
      console.error('Failed to save dental chart', e);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const treatments = useMemo(() => {
    if (!chart?.teeth) return [] as Array<{ toothNumber: number; date: string; title: string; status: string; dentist: string }>;
    const items: Array<{ toothNumber: number; date: string; title: string; status: string; dentist: string }> = [];
    chart.teeth.forEach((t) => {
      (t.treatments || []).forEach((tr) => {
        const dentist = tr.dentist ? `${tr.dentist.firstName || ''} ${tr.dentist.lastName || ''}`.trim() : '';
        const title = tr.treatment?.name || tr.description || tr.treatmentType || 'Treatment';
        items.push({ toothNumber: t.toothNumber, date: tr.date, title, status: tr.status, dentist });
      });
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [chart]);

  const treatmentHistoryItems = useMemo(() => {
    if (treatments.length) return treatments;
    const items: Array<{ toothNumber: number; date: string; title: string; status: string; dentist: string }> = [];
    (patientTreatments || []).forEach((t: any) => {
      const toothNumber = t?.teeth?.length ? Number(t.teeth[0]) : 0;
      const dentist = t?.dentist ? `${t.dentist.firstName || ''} ${t.dentist.lastName || ''}`.trim() : '';
      const title = t?.procedure?.name || t?.description || t?.treatmentType || 'Treatment';
      const date = t?.startDate || t?.createdAt;
      items.push({ toothNumber: Number.isFinite(toothNumber) ? toothNumber : 0, date, title, status: t?.status || 'planned', dentist });
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [treatments, patientTreatments]);

  const summary = useMemo(() => {
    const all = [...upperTeeth, ...lowerTeeth];
    const healthy = all.filter((t) => t.status === 'healthy').length;
    const restorations = all.filter((t) => ['filling', 'crown', 'root-canal', 'implant'].includes(t.status)).length;
    const missing = all.filter((t) => t.status === 'missing').length;
    const needsAttention = all.filter((t) => ['cavity', 'extraction-needed'].includes(t.status)).length;
    return { healthy, restorations, missing, needsAttention };
  }, [upperTeeth, lowerTeeth]);

  if (loading) {
    return <LoadingState type="table" rows={8} />;
  }

  return (
    <div className="space-y-6">
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Treatment History</DialogTitle>
            <DialogDescription>
              Historical treatments recorded in the dental chart.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {historyLoading ? (
              <div className="text-sm text-muted-foreground">Loading treatment history...</div>
            ) : treatmentHistoryItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No treatment history found for this patient.</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border">
                  <div className="col-span-2">Tooth</div>
                  <div className="col-span-4">Treatment</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Dentist</div>
                  <div className="col-span-2">Date</div>
                </div>
                {treatmentHistoryItems.map((t, idx) => (
                  <div key={`${t.toothNumber}-${t.date}-${idx}`} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-border last:border-b-0">
                    <div className="col-span-2 font-medium">{t.toothNumber ? `#${t.toothNumber}` : 'N/A'}</div>
                    <div className="col-span-4">{t.title}</div>
                    <div className="col-span-2">
                      <Badge variant="secondary">{t.status}</Badge>
                    </div>
                    <div className="col-span-2">{t.dentist || '-'}</div>
                    <div className="col-span-2 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dental Chart</h1>
          <p className="text-muted-foreground">Interactive tooth chart for patient: <span className="font-medium text-foreground">{patientName}</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Treatment History
          </Button>
          <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={handleSave} disabled={saving || !patientId}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={patientId} onValueChange={handlePatientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input value={chart?.lastUpdated ? new Date(chart.lastUpdated).toLocaleString() : '-'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Updated By</Label>
              <Input value={chart?.updatedBy ? `${chart.updatedBy.firstName || ''} ${chart.updatedBy.lastName || ''}`.trim() : '-'} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Adult Dentition (FDI Notation)</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.8, z - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setSelectedToothNumber(null); }}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Upper Jaw */}
              <div className="mb-2">
                <p className="text-xs text-center text-muted-foreground mb-2">Upper Jaw</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {upperTeeth.map((tooth) => (
                    <ToothComponent
                      key={tooth.id}
                      tooth={tooth}
                      isSelected={selectedTooth?.id === tooth.id}
                      onClick={() => setSelectedToothNumber(tooth.id)}
                      isUpper={true}
                    />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Lower Jaw */}
              <div>
                <div className="flex justify-center gap-1 flex-wrap">
                  {lowerTeeth.map((tooth) => (
                    <ToothComponent
                      key={tooth.id}
                      tooth={tooth}
                      isSelected={selectedTooth?.id === tooth.id}
                      onClick={() => setSelectedToothNumber(tooth.id)}
                      isUpper={false}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">Lower Jaw</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-8 pt-6 border-t border-border">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', config.bgColor)} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <div className="space-y-4">
          {/* Selected Tooth Details */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tooth Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTooth ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-primary">#{selectedTooth.id}</span>
                    <Badge className={cn('font-medium', selectedConfig?.color, 'bg-opacity-10')}>
                      {selectedConfig?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedTooth.name}</p>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={selectedTooth.notes || ''}
                      onChange={(e) => handleUpdateToothNotes(e.target.value)}
                      placeholder="Clinical notes..."
                      rows={3}
                    />
                  </div>
                  
                  {selectedTooth.notes && (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {selectedTooth.notes}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <p className="text-sm font-medium">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className={cn(
                            'justify-start',
                            selectedTooth.status === key && 'border-primary bg-primary/5'
                          )}
                          onClick={() => handleUpdateToothStatus(key as ToothStatus)}
                        >
                          <div className={cn('w-2 h-2 rounded-full mr-2', config.bgColor)} />
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Click on a tooth to view details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Chart Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Healthy Teeth</span>
                <span className="font-medium text-success">{summary.healthy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Restorations</span>
                <span className="font-medium text-info">{summary.restorations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Missing</span>
                <span className="font-medium text-muted-foreground">{summary.missing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Needs Attention</span>
                <span className="font-medium text-destructive">{summary.needsAttention}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DentalChart() {
  return (
    <DashboardLayout>
      <DentalChartContent />
    </DashboardLayout>
  );
}
