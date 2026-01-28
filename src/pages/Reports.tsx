import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, DollarSign, Users, Activity, TrendingUp } from 'lucide-react';
import { DateRangePicker } from '../components/ui/date-range-picker'; // Assuming this component exists or we'll standard inputs

const Reports = () => {
    const [reportPeriod, setReportPeriod] = useState('month');

    // Mock Data
    const revenueData = [
        { name: 'Jan', revenue: 45000, expenses: 32000 },
        { name: 'Feb', revenue: 52000, expenses: 34000 },
        { name: 'Mar', revenue: 48000, expenses: 31000 },
        { name: 'Apr', revenue: 61000, expenses: 35000 },
        { name: 'May', revenue: 55000, expenses: 33000 },
        { name: 'Jun', revenue: 67000, expenses: 38000 },
    ];

    const treatmentMix = [
        { name: 'General', value: 35 },
        { name: 'Cosmetic', value: 25 },
        { name: 'Orthodontics', value: 20 },
        { name: 'Surgery', value: 15 },
        { name: 'Implants', value: 5 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                        <p className="text-muted-foreground mt-1">Financial, clinical, and operational insights</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline">
                            <Calendar className="w-4 h-4 mr-2" />
                            This Month
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="financial" className="w-full">
                    <TabsList>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="clinical">Clinical</TabsTrigger>
                        <TabsTrigger value="operational">Operational</TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">$328,000</div>
                                    <p className="text-xs text-muted-foreground">+15% from last year</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">$125,000</div>
                                    <p className="text-xs text-muted-foreground">38% margin</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                                    <Activity className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">$12,450</div>
                                    <p className="text-xs text-muted-foreground">Pending payments</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue vs Expenses</CardTitle>
                                <CardDescription>Monthly financial performance overview.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="clinical" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Treatment Mix</CardTitle>
                                    <CardDescription>Distribution of procedures performed.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={treatmentMix}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {treatmentMix.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Patient Visits</CardTitle>
                                    <CardDescription>Monthly patient traffic.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Visits" /> {/* Mocking visits using revenue data for shape */}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="operational" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Staff Performance</CardTitle>
                                <CardDescription>Appointments handled per provider.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-10 text-muted-foreground">
                                    Operational metrics loading...
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Reports;
