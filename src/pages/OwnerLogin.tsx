import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useRole } from '@/contexts/RoleContext';

const OwnerLogin = () => {
    const navigate = useNavigate();
    const { setAuth } = useRole();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [licenseKey, setLicenseKey] = useState('');

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const res = await authApi.ownerLogin(identifier, password, licenseKey);
            const token = res?.data?.token;
            const user = res?.data?.user;
            const license = res?.data?.license;

            if (!token) {
                toast.error('Login failed');
                return;
            }

            if (user?.role !== 'superadmin') {
                toast.error('Unauthorized person');
                return;
            }

            localStorage.setItem('token', token);
            setAuth({
                role: 'superadmin',
                userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Owner',
                permissions: user?.permissions || [],
                license,
            });

            toast.success('Welcome, Owner');
            navigate('/license');
        } catch (e: any) {
            toast.error(e?.message || 'Unauthorized person');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4">
            <div className="w-full max-w-md">
                <div className="mb-4">
                    <Button variant="ghost" className="gap-2 text-slate-200 hover:text-white hover:bg-white/10" onClick={() => navigate('/login')}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin Login
                    </Button>
                </div>
                <Card className="border border-white/10 shadow-2xl bg-white/10 backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-white">Owner Access</CardTitle>
                        <CardDescription className="text-center text-slate-200">
                            Secure software company portal
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier" className="text-slate-200">Email or Username</Label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-300 group-focus-within:text-white transition-colors" />
                                <Input
                                    id="identifier"
                                    placeholder="owner@company.com"
                                    className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-400/60"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-300 group-focus-within:text-white transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="pl-9 pr-9 bg-white/10 border-white/15 text-white placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-400/60"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-300 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="licenseKey" className="text-slate-200">License Key</Label>
                            <div className="relative group">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-300 group-focus-within:text-white transition-colors" />
                                <Input
                                    id="licenseKey"
                                    placeholder="Enter license key"
                                    className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-sky-400/60"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-11 bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300"
                            onClick={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-white/10 py-4">
                        <p className="text-xs text-slate-300 text-center">
                            Press Ctrl + Shift + H to open this page
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default OwnerLogin;
