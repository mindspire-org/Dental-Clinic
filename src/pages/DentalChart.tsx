import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCcw, 
  ZoomIn,
  ZoomOut,
  Save,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tooth status types
type ToothStatus = 'healthy' | 'cavity' | 'filling' | 'crown' | 'missing' | 'root-canal' | 'implant' | 'extraction-needed';

interface Tooth {
  id: number;
  name: string;
  status: ToothStatus;
  notes?: string;
}

// FDI Notation teeth
const upperTeeth: Tooth[] = [
  { id: 18, name: 'Upper Right 3rd Molar', status: 'healthy' },
  { id: 17, name: 'Upper Right 2nd Molar', status: 'filling' },
  { id: 16, name: 'Upper Right 1st Molar', status: 'crown' },
  { id: 15, name: 'Upper Right 2nd Premolar', status: 'healthy' },
  { id: 14, name: 'Upper Right 1st Premolar', status: 'healthy' },
  { id: 13, name: 'Upper Right Canine', status: 'healthy' },
  { id: 12, name: 'Upper Right Lateral Incisor', status: 'healthy' },
  { id: 11, name: 'Upper Right Central Incisor', status: 'healthy' },
  { id: 21, name: 'Upper Left Central Incisor', status: 'healthy' },
  { id: 22, name: 'Upper Left Lateral Incisor', status: 'cavity' },
  { id: 23, name: 'Upper Left Canine', status: 'healthy' },
  { id: 24, name: 'Upper Left 1st Premolar', status: 'healthy' },
  { id: 25, name: 'Upper Left 2nd Premolar', status: 'filling' },
  { id: 26, name: 'Upper Left 1st Molar', status: 'root-canal' },
  { id: 27, name: 'Upper Left 2nd Molar', status: 'healthy' },
  { id: 28, name: 'Upper Left 3rd Molar', status: 'missing' },
];

const lowerTeeth: Tooth[] = [
  { id: 48, name: 'Lower Right 3rd Molar', status: 'extraction-needed', notes: 'Impacted, needs extraction' },
  { id: 47, name: 'Lower Right 2nd Molar', status: 'healthy' },
  { id: 46, name: 'Lower Right 1st Molar', status: 'filling' },
  { id: 45, name: 'Lower Right 2nd Premolar', status: 'healthy' },
  { id: 44, name: 'Lower Right 1st Premolar', status: 'healthy' },
  { id: 43, name: 'Lower Right Canine', status: 'healthy' },
  { id: 42, name: 'Lower Right Lateral Incisor', status: 'healthy' },
  { id: 41, name: 'Lower Right Central Incisor', status: 'healthy' },
  { id: 31, name: 'Lower Left Central Incisor', status: 'healthy' },
  { id: 32, name: 'Lower Left Lateral Incisor', status: 'healthy' },
  { id: 33, name: 'Lower Left Canine', status: 'healthy' },
  { id: 34, name: 'Lower Left 1st Premolar', status: 'cavity' },
  { id: 35, name: 'Lower Left 2nd Premolar', status: 'healthy' },
  { id: 36, name: 'Lower Left 1st Molar', status: 'implant' },
  { id: 37, name: 'Lower Left 2nd Molar', status: 'healthy' },
  { id: 38, name: 'Lower Left 3rd Molar', status: 'missing' },
];

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
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null);
  const [zoom, setZoom] = useState(1);

  const selectedConfig = selectedTooth ? statusConfig[selectedTooth.status] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dental Chart</h1>
          <p className="text-muted-foreground">Interactive tooth chart for patient: <span className="font-medium text-foreground">Sarah Johnson</span></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Treatment History
          </Button>
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

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
                <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setSelectedTooth(null); }}>
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
                      onClick={() => setSelectedTooth(tooth)}
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
                      onClick={() => setSelectedTooth(tooth)}
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
                <span className="font-medium text-success">22</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Restorations</span>
                <span className="font-medium text-info">6</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Missing</span>
                <span className="font-medium text-muted-foreground">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Needs Attention</span>
                <span className="font-medium text-destructive">2</span>
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
