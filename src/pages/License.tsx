import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { licenseApi } from '@/lib/api';
import { useRole } from '@/contexts/RoleContext';

type AdminUser = {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    username: string;
    permissions?: string[];
    isActive?: boolean;
};

const License = () => {
    const navigate = useNavigate();
    const { role, setAuth, license } = useRole();

    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<string[]>([]);
    const [enabledModules, setEnabledModules] = useState<string[]>([]);
    const [licenseKey, setLicenseKey] = useState<string>('');

    const [admins, setAdmins] = useState<AdminUser[]>([]);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/owner-login');
            return;
        }
        if (role !== 'superadmin') {
            navigate('/');
            return;
        }
        const load = async () => {
            try {
                setLoading(true);
                const [modsRes, licRes, adminsRes] = await Promise.all([
                    licenseApi.getModules(),
                    licenseApi.getLicense(),
                    licenseApi.getAdmins(),
                ]);

                const mods = modsRes?.data?.modules || [];
                setModules(mods);

                const lic = licRes?.data?.license;
                setEnabledModules(Array.isArray(lic?.enabledModules) ? lic.enabledModules : mods);
                setLicenseKey(lic?.licenseKey || licRes?.data?.licenseKey || '');

                const ad = adminsRes?.data?.admins || [];
                setAdmins(ad);
            } catch (e: any) {
                toast.error(e?.message || 'Failed to load license data');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleEnabledModule = (key: string) => {
        setEnabledModules(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
    };

    const save = async () => {
        try {
            const res = await licenseApi.activate({ enabledModules });
            const lic = res?.data?.license;
            await licenseApi.setAllAdminPermissions({ permissions: enabledModules });
            setLicenseKey(lic?.licenseKey || '');
            setAuth({ license: { isActive: lic?.isActive, enabledModules: lic?.enabledModules || [], licenseKey: lic?.licenseKey } });
            toast.success('Saved');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to save');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingState type="table" rows={8} />
            </DashboardLayout>
        );
    }

    if (role !== 'superadmin') {
        return (
            <DashboardLayout>
                <EmptyState
                    title="Owner access only"
                    description="This page is available to the software owner (Super Admin)."
                    action={{ label: 'Go Home', onClick: () => navigate('/') }}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">License & Permissions</h1>
                        <p className="text-muted-foreground">Activate modules and assign access for Admin users</p>
                    </div>
                    <Button onClick={save} className="gradient-primary">Save</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>License Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input value={licenseKey} readOnly />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enabled Modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {modules.map((m) => (
                                <div key={m} className="flex items-center justify-between rounded-md border p-3">
                                    <div className="font-medium">{m}</div>
                                    <Switch checked={enabledModules.includes(m)} onCheckedChange={() => toggleEnabledModule(m)} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    );
};

export default License;
