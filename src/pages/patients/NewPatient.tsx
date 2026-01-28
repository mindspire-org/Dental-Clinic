import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ArrowLeft, UserPlus, Sparkles, Phone, HeartPulse, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { patientsApi } from '@/lib/api';

export default function NewPatient() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalHistory: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth ||
            !formData.gender || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await patientsApi.create(formData);
            alert('Patient created successfully!');
            navigate('/patients');
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Failed to create patient. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            navigate('/patients');
        }
    };

    const getInitials = () => {
        const first = formData.firstName.charAt(0).toUpperCase();
        const last = formData.lastName.charAt(0).toUpperCase();
        return first && last ? `${first}${last}` : 'NP';
    };

    return (
        <DashboardLayout>
            <form onSubmit={handleSubmit}>
                <div className="max-w-5xl mx-auto pb-10">
                    {/* Page Header with Gradient */}
                    <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 shadow-xl mb-8 text-white">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                    <UserPlus className="h-7 w-7 text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-white">New Patient Registration</h1>
                                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        Create a comprehensive profile for better care
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/patients')}
                                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/40 backdrop-blur-sm transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to List
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Avatar */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="shadow-lg border-border/60 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200"></div>
                                <CardContent className="pt-12 flex flex-col items-center text-center relative z-10">
                                    <div className="relative mb-4">
                                        <Avatar className="h-32 w-32 border-[6px] border-white shadow-xl ring-4 ring-primary/10">
                                            <AvatarFallback className="text-3xl font-bold text-primary bg-slate-50">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <h3 className="font-bold text-xl text-slate-800 mb-1">
                                        {formData.firstName && formData.lastName
                                            ? `${formData.firstName} ${formData.lastName}`
                                            : 'New Patient'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-6">Patient Profile</p>
                                    <Separator className="my-4" />
                                    <div className="w-full space-y-3 text-left">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-600">
                                                {formData.phone || 'No phone'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <HeartPulse className="w-4 h-4 text-slate-400" />
                                            <span className="text-slate-600">
                                                {formData.gender || 'Not specified'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Form */}
                        <div className="lg:col-span-9">
                            <Card className="shadow-lg border-border/60">
                                <CardContent className="p-8">
                                    {/* Personal Information */}
                                    <section className="mb-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Info className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                                                <p className="text-sm text-slate-500">Basic patient details</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="firstName" className="group-focus-within:text-blue-600 transition-colors">
                                                    First Name *
                                                </Label>
                                                <Input
                                                    id="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                                    placeholder="John"
                                                    required
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="lastName" className="group-focus-within:text-blue-600 transition-colors">
                                                    Last Name *
                                                </Label>
                                                <Input
                                                    id="lastName"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                                    placeholder="Doe"
                                                    required
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="dateOfBirth" className="group-focus-within:text-blue-600 transition-colors">
                                                    Date of Birth *
                                                </Label>
                                                <Input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                                    required
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="gender" className="group-focus-within:text-blue-600 transition-colors">
                                                    Gender *
                                                </Label>
                                                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)} required>
                                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500/50 transition-all shadow-sm">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </section>

                                    <Separator className="my-8" />

                                    {/* Contact Information */}
                                    <section className="mb-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                                                <Phone className="h-5 w-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800">Contact Information</h2>
                                                <p className="text-sm text-slate-500">How to reach the patient</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="phone" className="group-focus-within:text-teal-600 transition-colors">
                                                    Phone Number *
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                    placeholder="(555) 123-4567"
                                                    required
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="email" className="group-focus-within:text-teal-600 transition-colors">
                                                    Email Address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    placeholder="john.doe@example.com"
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-2.5 group">
                                                <Label htmlFor="address" className="group-focus-within:text-teal-600 transition-colors">
                                                    Street Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    value={formData.address}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                    placeholder="123 Main Street"
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="city" className="group-focus-within:text-teal-600 transition-colors">
                                                    City
                                                </Label>
                                                <Input
                                                    id="city"
                                                    value={formData.city}
                                                    onChange={(e) => handleChange('city', e.target.value)}
                                                    placeholder="New York"
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2.5 group">
                                                    <Label htmlFor="state" className="group-focus-within:text-teal-600 transition-colors">
                                                        State
                                                    </Label>
                                                    <Input
                                                        id="state"
                                                        value={formData.state}
                                                        onChange={(e) => handleChange('state', e.target.value)}
                                                        placeholder="NY"
                                                        className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2.5 group">
                                                    <Label htmlFor="zipCode" className="group-focus-within:text-teal-600 transition-colors">
                                                        ZIP Code
                                                    </Label>
                                                    <Input
                                                        id="zipCode"
                                                        value={formData.zipCode}
                                                        onChange={(e) => handleChange('zipCode', e.target.value)}
                                                        placeholder="10001"
                                                        className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-teal-500/50 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <Separator className="my-8" />

                                    {/* Emergency & Medical */}
                                    <section className="mb-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                                                <HeartPulse className="h-5 w-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800">Emergency & Medical Information</h2>
                                                <p className="text-sm text-slate-500">Emergency contact and medical history</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="emergencyName" className="group-focus-within:text-rose-600 transition-colors">
                                                    Emergency Contact Name
                                                </Label>
                                                <Input
                                                    id="emergencyName"
                                                    value={formData.emergencyContactName}
                                                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                                                    placeholder="Full Name"
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-rose-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-2.5 group">
                                                <Label htmlFor="emergencyPhone" className="group-focus-within:text-rose-600 transition-colors">
                                                    Emergency Phone
                                                </Label>
                                                <Input
                                                    id="emergencyPhone"
                                                    type="tel"
                                                    value={formData.emergencyContactPhone}
                                                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                                                    placeholder="(555) 987-6543"
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-rose-500/50 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-2.5 group">
                                                <Label htmlFor="notes" className="group-focus-within:text-rose-600 transition-colors">
                                                    Medical Notes / Allergies
                                                </Label>
                                                <Textarea
                                                    id="notes"
                                                    value={formData.medicalHistory}
                                                    onChange={(e) => handleChange('medicalHistory', e.target.value)}
                                                    placeholder="List any allergies or medication..."
                                                    className="bg-slate-50/50 border-slate-200 focus:bg-white focus:border-rose-500/50 transition-all shadow-sm resize-none min-h-[100px]"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="mt-12 flex justify-end gap-4 sticky bottom-0 bg-white/80 p-4 backdrop-blur-md rounded-xl border border-slate-100 shadow-lg z-10">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="px-8 shadow-sm hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={loading}
                                            className="px-10 gradient-primary font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Save className="w-5 h-5 mr-2" />
                                            {loading ? 'Creating...' : 'Create Patient Record'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
