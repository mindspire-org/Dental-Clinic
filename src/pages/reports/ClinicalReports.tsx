import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, FileBarChart, Brain } from 'lucide-react';

export default function ClinicalReports() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Clinical Reports</h1>
                    <p className="text-muted-foreground">Patient outcomes and treatment statistics</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Patients Treated</CardTitle>
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,204</div>
                            <p className="text-xs text-muted-foreground">+12% from last month</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Treatment Success Rate</CardTitle>
                            <Activity className="w-4 h-4 text-success" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-success">98.5%</div>
                            <p className="text-xs text-muted-foreground">+0.2% from last month</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Procedures Performed</CardTitle>
                            <FileBarChart className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">845</div>
                            <p className="text-xs text-muted-foreground">Most common: Cleaning</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Specialist Referrals</CardTitle>
                            <Brain className="w-4 h-4 text-warning" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24</div>
                            <p className="text-xs text-muted-foreground">-5% from last month</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="treatments">By Treatment</TabsTrigger>
                        <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                        <Card className="min-h-[300px] flex items-center justify-center border-dashed text-muted-foreground">
                            Chart Placeholder - Clinical Trends
                        </Card>
                    </TabsContent>
                    <TabsContent value="treatments" className="space-y-4">
                        <Card className="min-h-[300px] flex items-center justify-center border-dashed text-muted-foreground">
                            Chart Placeholder - Treatment Distribution
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
