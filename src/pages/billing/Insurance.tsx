import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus } from 'lucide-react';
import { FormModal } from '@/components/shared/FormModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { billingApi } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type ClaimRow = {
    _id: string;
    claimId: string;
    provider: string;
    patient?: { firstName?: string; lastName?: string };
    patientName?: string;
    submittedDate?: string;
    claimAmount: number;
    status: string;
};

export default function Insurance() {
    const [claims, setClaims] = useState<ClaimRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        patientName: '',
        provider: '',
        policyNumber: '',
        claimAmount: '',
        status: 'pending',
    });

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await billingApi.getInsuranceClaims();
                setClaims(res?.data?.claims || []);
            } catch (e) {
                console.error('Error fetching claims:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const openCreate = () => {
        setFormData({ patientName: '', provider: '', policyNumber: '', claimAmount: '', status: 'pending' });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const patientName = String(formData.patientName || '').trim();
        const provider = String(formData.provider || '').trim();
        const policyNumber = String(formData.policyNumber || '').trim();
        const claimAmount = Number(formData.claimAmount);
        if (!patientName || !provider || !policyNumber) return;
        if (!Number.isFinite(claimAmount) || claimAmount <= 0) return;

        try {
            setSaving(true);
            await billingApi.createInsuranceClaim({
                patientName,
                provider,
                policyNumber,
                claimAmount,
                status: formData.status,
            });
            const res = await billingApi.getInsuranceClaims();
            setClaims(res?.data?.claims || []);
            setShowModal(false);
        } catch (e) {
            console.error('Error creating claim:', e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Insurance Claims</h1>
                        <p className="text-muted-foreground">Manage provider claims and status</p>
                    </div>
                    <Button className="gradient-primary shadow-glow" onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" /> New Claim
                    </Button>
                </div>

                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle>Recent Claims</CardTitle>
                        <CardDescription>Track the status of insurance reimbursements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim ID</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(loading ? [] : claims).map((claim) => {
                                    const patientName = claim.patient
                                        ? `${claim.patient.firstName || ''} ${claim.patient.lastName || ''}`.trim()
                                        : (claim.patientName || '-');
                                    const statusText = String(claim.status || '').toLowerCase();
                                    const display = statusText === 'approved' ? 'Approved'
                                        : statusText === 'rejected' ? 'Denied'
                                            : statusText === 'paid' ? 'Paid'
                                                : 'Processing';
                                    const cls = display === 'Approved'
                                        ? 'text-success bg-success/10 border-success/20'
                                        : display === 'Denied'
                                            ? 'text-destructive bg-destructive/10 border-destructive/20'
                                            : 'text-info bg-info/10 border-info/20';
                                    return (
                                    <TableRow key={claim._id}>
                                        <TableCell className="font-mono text-xs">{claim.claimId || claim._id}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            {claim.provider}
                                        </TableCell>
                                        <TableCell>{patientName}</TableCell>
                                        <TableCell>{claim.submittedDate ? new Date(claim.submittedDate).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>${Number(claim.claimAmount || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cls}>
                                                {display}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <FormModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    title="New Insurance Claim"
                    description="Create and track an insurance claim"
                    onSubmit={handleSubmit}
                    submitLabel="Save"
                    isLoading={saving}
                    size="lg"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Patient Name *</Label>
                            <Input value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Provider *</Label>
                            <Input value={formData.provider} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Policy Number *</Label>
                            <Input value={formData.policyNumber} onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Claim Amount *</Label>
                            <Input type="number" value={formData.claimAmount} onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormModal>
            </div>
        </DashboardLayout>
    );
}
