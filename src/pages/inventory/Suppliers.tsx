import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, MapPin, Truck, ExternalLink } from 'lucide-react';

const suppliers = [
    { id: 1, name: 'Dental Supply Co.', contact: 'John Doe', phone: '(555) 123-4567', email: 'orders@dentalsupply.com', address: '123 Supply Drive, NY' },
    { id: 2, name: 'MedTech Solutions', contact: 'Jane Smith', phone: '(555) 987-6543', email: 'sales@medtech.com', address: '456 Tech Park, CA' },
    { id: 3, name: 'PharmaDirect', contact: 'Mike Johnson', phone: '(555) 555-0199', email: 'support@pharmadirect.com', address: '789 Pharma Way, TX' },
];

export default function Suppliers() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
                        <p className="text-muted-foreground">Manage your vendor relationships</p>
                    </div>
                    <Button className="gradient-primary shadow-glow">
                        <Truck className="w-4 h-4 mr-2" />
                        Add Supplier
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map((supplier) => (
                        <Card key={supplier.id} className="shadow-card hover-lift group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-primary/20 bg-primary/5">
                                            <AvatarFallback className="text-primary font-bold">{supplier.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{supplier.name}</CardTitle>
                                            <CardDescription>{supplier.contact}</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Phone className="w-4 h-4" />
                                    {supplier.phone}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <Mail className="w-4 h-4" />
                                    {supplier.email}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                                    <MapPin className="w-4 h-4" />
                                    {supplier.address}
                                </div>
                                <div className="pt-3 flex gap-2">
                                    <Button variant="outline" size="sm" className="w-full">Catalog</Button>
                                    <Button variant="outline" size="sm" className="w-full">History</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
