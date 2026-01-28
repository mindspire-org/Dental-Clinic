import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/shared/LoadingState';
import { Save, Building2, Calendar as CalendarIcon, DollarSign, Bell } from 'lucide-react';
import { settingsApi } from '@/lib/api';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

            // Parse settings by category
            settings.forEach((setting: any) => {
                if (setting.category === 'clinic') {
                    setClinicSettings(prev => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'appointment') {
                    setAppointmentSettings(prev => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'billing') {
                    setBillingSettings(prev => ({ ...prev, [setting.key]: setting.value }));
                } else if (setting.category === 'notification') {
                    setNotificationSettings(prev => ({ ...prev, [setting.key]: setting.value }));
                }
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClinic = async () => {
        try {
            setSaving(true);
            await settingsApi.updateClinic(clinicSettings);
            alert('Clinic settings saved successfully!');
        } catch (error) {
            console.error('Error saving clinic settings:', error);
            alert('Failed to save clinic settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAppointment = async () => {
        try {
            setSaving(true);
            await settingsApi.updateAppointment(appointmentSettings);
            alert('Appointment settings saved successfully!');
        } catch (error) {
            console.error('Error saving appointment settings:', error);
            alert('Failed to save appointment settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBilling = async () => {
        try {
            setSaving(true);
            await settingsApi.updateBilling(billingSettings);
            alert('Billing settings saved successfully!');
        } catch (error) {
            console.error('Error saving billing settings:', error);
            alert('Failed to save billing settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotification = async () => {
        try {
            setSaving(true);
            await settingsApi.updateNotification(notificationSettings);
            alert('Notification settings saved successfully!');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            alert('Failed to save notification settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingState type="form" rows={8} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage system settings and preferences</p>
            </div>

            {/* Clinic Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Clinic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            rows={2}
                        />
                    </div>

                    <Button onClick={handleSaveClinic} disabled={saving} className="gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save Clinic Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Appointment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Appointment Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                            <Input
                                id="slotDuration"
                                type="number"
                                value={appointmentSettings.slotDuration}
                                onChange={(e) => setAppointmentSettings({ ...appointmentSettings, slotDuration: parseInt(e.target.value) })}
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

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <div className="font-medium">Allow Online Booking</div>
                            <div className="text-sm text-muted-foreground">Enable patients to book appointments online</div>
                        </div>
                        <Switch
                            checked={appointmentSettings.allowOnlineBooking}
                            onCheckedChange={(checked) => setAppointmentSettings({ ...appointmentSettings, allowOnlineBooking: checked })}
                        />
                    </div>

                    <Button onClick={handleSaveAppointment} disabled={saving} className="gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save Appointment Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Billing Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Billing Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                onChange={(e) => setBillingSettings({ ...billingSettings, taxRate: parseFloat(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <Button onClick={handleSaveBilling} disabled={saving} className="gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save Billing Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notification Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium">Email Notifications</div>
                                <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                            </div>
                            <Switch
                                checked={notificationSettings.emailNotifications}
                                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium">SMS Notifications</div>
                                <div className="text-sm text-muted-foreground">Receive notifications via SMS</div>
                            </div>
                            <Switch
                                checked={notificationSettings.smsNotifications}
                                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="font-medium">Appointment Reminders</div>
                                <div className="text-sm text-muted-foreground">Send automatic appointment reminders</div>
                            </div>
                            <Switch
                                checked={notificationSettings.appointmentReminders}
                                onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, appointmentReminders: checked })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reminderHours">Reminder Hours Before Appointment</Label>
                        <Input
                            id="reminderHours"
                            type="number"
                            value={notificationSettings.reminderHoursBefore}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, reminderHoursBefore: parseInt(e.target.value) })}
                        />
                    </div>

                    <Button onClick={handleSaveNotification} disabled={saving} className="gradient-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save Notification Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
