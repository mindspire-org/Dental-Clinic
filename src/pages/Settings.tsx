import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/shared/LoadingState';
import { Save, Building2, Calendar as CalendarIcon, DollarSign, Bell } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'clinic' | 'appointment' | 'billing' | 'notification'>('clinic');
    const [clinicSettings, setClinicSettings] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
    });
    const [appointmentSettings, setAppointmentSettings] = useState({
        slotDuration: 30,
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        allowOnlineBooking: true,
    });
    const [billingSettings, setBillingSettings] = useState({
        currency: 'USD',
        taxRate: 0,
        paymentMethods: ['cash', 'card', 'insurance'],
    });
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        reminderHoursBefore: 24,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsApi.getAll();
            const settings = response.data.settings;

            const applySetting = (setting: any) => {
                if (!setting?.category || !setting?.key) return;
                if (setting.category === 'clinic') {
                    setClinicSettings((prev) => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'appointment') {
                    setAppointmentSettings((prev) => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'billing') {
                    setBillingSettings((prev) => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'notification') {
                    setNotificationSettings((prev) => ({ ...prev, [setting.key]: setting.value }));
                }
            };

            // Backend may return grouped-by-category object or a flat array.
            if (Array.isArray(settings)) {
                settings.forEach(applySetting);
            } else if (settings && typeof settings === 'object') {
                Object.values(settings).forEach((list: any) => {
                    if (Array.isArray(list)) list.forEach(applySetting);
                });
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            toast.error(error?.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            await settingsApi.updateClinic(clinicSettings);
            await settingsApi.updateAppointment(appointmentSettings);
            await settingsApi.updateBilling(billingSettings);
            await settingsApi.updateNotification(notificationSettings);
            toast.success('All settings saved');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveClinic = async () => {
        try {
            setSaving(true);
            await settingsApi.updateClinic(clinicSettings);
            toast.success('Clinic settings saved');
        } catch (error: any) {
            console.error('Error saving clinic settings:', error);
            toast.error(error?.message || 'Failed to save clinic settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAppointment = async () => {
        try {
            setSaving(true);
            await settingsApi.updateAppointment(appointmentSettings);
            toast.success('Appointment settings saved');
        } catch (error: any) {
            console.error('Error saving appointment settings:', error);
            toast.error(error?.message || 'Failed to save appointment settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBilling = async () => {
        try {
            setSaving(true);
            await settingsApi.updateBilling(billingSettings);
            toast.success('Billing settings saved');
        } catch (error: any) {
            console.error('Error saving billing settings:', error);
            toast.error(error?.message || 'Failed to save billing settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotification = async () => {
        try {
            setSaving(true);
            await settingsApi.updateNotification(notificationSettings);
            toast.success('Notification settings saved');
        } catch (error: any) {
            console.error('Error saving notification settings:', error);
            toast.error(error?.message || 'Failed to save notification settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingState type="form" rows={8} />;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage system settings and preferences</p>
                    </div>
                    <Button onClick={handleSaveAll} disabled={saving} className="gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save All
                    </Button>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Update clinic profile, scheduling, billing rules and notifications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                                <TabsTrigger value="clinic" className="gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Clinic
                                </TabsTrigger>
                                <TabsTrigger value="appointment" className="gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Appointments
                                </TabsTrigger>
                                <TabsTrigger value="billing" className="gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Billing
                                </TabsTrigger>
                                <TabsTrigger value="notification" className="gap-2">
                                    <Bell className="h-4 w-4" />
                                    Notifications
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="clinic" className="mt-6 space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicName">Clinic Name</Label>
                                        <Input
                                            id="clinicName"
                                            value={clinicSettings.name}
                                            onChange={(e) => setClinicSettings({ ...clinicSettings, name: e.target.value })}
                                            placeholder="DentalVerse Clinic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicPhone">Phone</Label>
                                        <Input
                                            id="clinicPhone"
                                            value={clinicSettings.phone}
                                            onChange={(e) => setClinicSettings({ ...clinicSettings, phone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicEmail">Email</Label>
                                        <Input
                                            id="clinicEmail"
                                            type="email"
                                            value={clinicSettings.email}
                                            onChange={(e) => setClinicSettings({ ...clinicSettings, email: e.target.value })}
                                            placeholder="info@dentalverse.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicWebsite">Website</Label>
                                        <Input
                                            id="clinicWebsite"
                                            value={clinicSettings.website}
                                            onChange={(e) => setClinicSettings({ ...clinicSettings, website: e.target.value })}
                                            placeholder="www.dentalverse.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinicAddress">Address</Label>
                                    <Textarea
                                        id="clinicAddress"
                                        value={clinicSettings.address}
                                        onChange={(e) => setClinicSettings({ ...clinicSettings, address: e.target.value })}
                                        placeholder="123 Main Street, City, State, ZIP"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveClinic} disabled={saving} className="gradient-primary">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Clinic Settings
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="appointment" className="mt-6 space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                                        <Input
                                            id="slotDuration"
                                            type="number"
                                            value={appointmentSettings.slotDuration}
                                            onChange={(e) =>
                                                setAppointmentSettings({
                                                    ...appointmentSettings,
                                                    slotDuration: Number.isFinite(parseInt(e.target.value)) ? parseInt(e.target.value) : 30,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="workStart">Working Hours Start</Label>
                                        <Input
                                            id="workStart"
                                            type="time"
                                            value={appointmentSettings.workingHoursStart}
                                            onChange={(e) => setAppointmentSettings({ ...appointmentSettings, workingHoursStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="workEnd">Working Hours End</Label>
                                        <Input
                                            id="workEnd"
                                            type="time"
                                            value={appointmentSettings.workingHoursEnd}
                                            onChange={(e) => setAppointmentSettings({ ...appointmentSettings, workingHoursEnd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <div className="font-medium">Allow Online Booking</div>
                                        <div className="text-sm text-muted-foreground">Enable patients to book appointments online</div>
                                    </div>
                                    <Switch
                                        checked={appointmentSettings.allowOnlineBooking}
                                        onCheckedChange={(checked) =>
                                            setAppointmentSettings({ ...appointmentSettings, allowOnlineBooking: checked })
                                        }
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveAppointment} disabled={saving} className="gradient-primary">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Appointment Settings
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="billing" className="mt-6 space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Input
                                            id="currency"
                                            value={billingSettings.currency}
                                            onChange={(e) => setBillingSettings({ ...billingSettings, currency: e.target.value })}
                                            placeholder="USD"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                        <Input
                                            id="taxRate"
                                            type="number"
                                            step="0.01"
                                            value={billingSettings.taxRate}
                                            onChange={(e) =>
                                                setBillingSettings({
                                                    ...billingSettings,
                                                    taxRate: Number.isFinite(parseFloat(e.target.value)) ? parseFloat(e.target.value) : 0,
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethods">Payment Methods</Label>
                                    <Input
                                        id="paymentMethods"
                                        value={(billingSettings.paymentMethods || []).join(', ')}
                                        onChange={(e) =>
                                            setBillingSettings({
                                                ...billingSettings,
                                                paymentMethods: e.target.value
                                                    .split(',')
                                                    .map((t) => t.trim())
                                                    .filter(Boolean),
                                            })
                                        }
                                        placeholder="cash, card, insurance"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveBilling} disabled={saving} className="gradient-primary">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Billing Settings
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="notification" className="mt-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <div className="font-medium">Email Notifications</div>
                                            <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.emailNotifications}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <div className="font-medium">SMS Notifications</div>
                                            <div className="text-sm text-muted-foreground">Receive notifications via SMS</div>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.smsNotifications}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <div className="font-medium">Appointment Reminders</div>
                                            <div className="text-sm text-muted-foreground">Send automatic appointment reminders</div>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.appointmentReminders}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({ ...notificationSettings, appointmentReminders: checked })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="reminderHours">Reminder Hours Before Appointment</Label>
                                        <Input
                                            id="reminderHours"
                                            type="number"
                                            value={notificationSettings.reminderHoursBefore}
                                            onChange={(e) =>
                                                setNotificationSettings({
                                                    ...notificationSettings,
                                                    reminderHoursBefore: Number.isFinite(parseInt(e.target.value))
                                                        ? parseInt(e.target.value)
                                                        : 24,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveNotification} disabled={saving} className="gradient-primary">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Notification Settings
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
