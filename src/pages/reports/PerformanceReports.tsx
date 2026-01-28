import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Star, DollarSign } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function PerformanceReports() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Performance Analytics</h1>
                    <p className="text-muted-foreground">Staff productivity and clinic efficiency</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>Top Performing Doctors</CardTitle>
                            <CardDescription>Based on revenue generated</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Dr. Sarah Mitchell</span>
                                    <span className="text-success font-bold">$45,200</span>
                                </div>
                                <Progress value={92} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Dr. James Wilson</span>
                                    <span className="text-success font-bold">$38,500</span>
                                </div>
                                <Progress value={78} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Dr. Emily Chen</span>
                                    <span className="text-success font-bold">$32,100</span>
                                </div>
                                <Progress value={65} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>Appointment Efficiency</CardTitle>
                            <CardDescription>Average wait times and session duration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Wait Time</p>
                                    <h3 className="text-xl font-bold">12 mins</h3>
                                </div>
                                <Badge variant="outline" className="ml-auto text-success border-success/30 bg-success/5">-2m vs last month</Badge>
                            </div>
                            <div className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                <div className="p-3 bg-info/10 rounded-lg text-info">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Chair Time</p>
                                    <h3 className="text-xl font-bold">45 mins</h3>
                                </div>
                                <Badge variant="outline" className="ml-auto text-muted-foreground">Stable</Badge>
                            </div>
                            <div className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                                <div className="p-3 bg-warning/10 rounded-lg text-warning">
                                    <Star className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Patient Satisfaction</p>
                                    <h3 className="text-xl font-bold">4.8/5.0</h3>
                                </div>
                                <Badge variant="outline" className="ml-auto text-success border-success/30 bg-success/5">+0.1</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
