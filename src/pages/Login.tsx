import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole, UserRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, User, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
    const navigate = useNavigate();
    const { setRole } = useRole();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (role: UserRole) => {
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setRole(role);
            toast.success(`Welcome back! Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`);
            navigate('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 p-4 z-10 items-center">

                {/* Left Side: Branding & Info (Visible on large screens) */}
                <div className="hidden lg:flex flex-col justify-center space-y-6 p-8 animate-fade-in">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden mb-4">
                        <img src="/logo.png" alt="DentalVerse Logo" className="w-full h-full object-cover p-0" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-4">DentalVerse</h1>
                        <p className="text-xl text-slate-600 font-light leading-relaxed">
                            Experience the future of dental practice management. Streamline your workflow with our elite suite of professional tools.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 rounded-full bg-green-100 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Smart Patient Management</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Advanced Clinical Analytics</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Seamless Billing & Insurance</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full max-w-md mx-auto animate-slide-in-right">
                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
                            <img src="/logo.png" alt="DentalVerse Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">DentalVerse</h1>
                    </div>

                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                        <CardHeader className="space-y-1 pb-2">
                            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                            <CardDescription className="text-center">
                                Select your role to access the dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Tabs defaultValue="admin" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-slate-100/80">
                                    <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin</TabsTrigger>
                                    <TabsTrigger value="dentist" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dentist</TabsTrigger>
                                    <TabsTrigger value="receptionist" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Front Desk</TabsTrigger>
                                </TabsList>

                                {['admin', 'dentist', 'receptionist'].map((role) => (
                                    <TabsContent key={role} value={role} className="mt-0">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`${role}-email`}>Email</Label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        id={`${role}-email`}
                                                        placeholder="name@dentalverse.com"
                                                        className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor={`${role}-password`}>Password</Label>
                                                    <Button variant="link" className="p-0 h-auto text-xs font-normal" tabIndex={-1}>
                                                        Forgot password?
                                                    </Button>
                                                </div>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        id={`${role}-password`}
                                                        type={showPassword ? "text" : "password"}
                                                        className="pl-9 pr-9 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-11 mt-4 gradient-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                                                onClick={() => handleLogin(role as UserRole)}
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
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t py-4">
                            <p className="text-xs text-slate-400 text-center">
                                &copy; {new Date().getFullYear()} DentalVerse Pro Suite
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;
