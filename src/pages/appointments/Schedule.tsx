import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, Plus } from 'lucide-react';

const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const appointments = [
    { time: '09:00 AM', patient: 'Sarah Johnson', type: 'Check-up', doctor: 'Dr. Mitchell', status: 'Confirmed', duration: '1h' },
    { time: '11:00 AM', patient: 'Michael Chen', type: 'Root Canal', doctor: 'Dr. Mitchell', status: 'In Progress', duration: '1.5h' },
    { time: '02:00 PM', patient: 'James Wilson', type: 'Consultation', doctor: 'Dr. Mitchell', status: 'Confirmed', duration: '30m' },
];

export default function Schedule() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Daily Schedule</h1>
                        <p className="text-muted-foreground">Today's appointments and timeline</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Select Date
                        </Button>
                        <Button className="gradient-primary shadow-glow">
                            <Plus className="w-4 h-4 mr-2" />
                            New Appointment
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 shadow-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Permissions Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {timeSlots.map((slot) => {
                                    const apt = appointments.find(a => a.time === slot);
                                    return (
                                        <div key={slot} className="flex gap-4 group">
                                            <div className="w-20 text-sm font-medium text-muted-foreground pt-2">{slot}</div>
                                            <div className="flex-1 min-h-[80px] border-l-2 border-border pl-4 pb-4 relative">
                                                <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-border group-hover:bg-primary transition-colors"></div>
                                                {apt ? (
                                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h3 className="font-semibold text-primary">{apt.patient}</h3>
                                                            <Badge variant={apt.status === 'In Progress' ? 'default' : 'outline'} className={apt.status === 'In Progress' ? 'bg-primary text-primary-foreground' : ''}>{apt.status}</Badge>
                                                        </div>
                                                        <div className="text-sm text-foreground/80 flex gap-4">
                                                            <span>{apt.type}</span>
                                                            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.duration}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm hover:border-primary/30 hover:text-primary/70 transition-colors cursor-pointer">
                                                        Available Slot
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total Appointments</span>
                                    <span className="font-bold text-foreground">12</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                                    <span className="text-sm text-success">Completed</span>
                                    <span className="font-bold text-success">5</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                                    <span className="text-sm text-warning">Pending</span>
                                    <span className="font-bold text-warning">7</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="text-base">Doctors On Duty</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">SM</div>
                                    <div>
                                        <p className="text-sm font-medium">Dr. Sarah Mitchell</p>
                                        <p className="text-xs text-muted-foreground">Ortho • Available</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">JW</div>
                                    <div>
                                        <p className="text-sm font-medium">Dr. James Wilson</p>
                                        <p className="text-xs text-muted-foreground">General • In Surgery</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
