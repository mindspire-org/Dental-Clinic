import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search,
  Download,
  MoreVertical,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  patientName: string;
  date: string;
  dueDate: string;
  amount: number;
  paid: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  treatments: string[];
}

const invoices: Invoice[] = [
  { id: 'INV-001', patientName: 'Sarah Johnson', date: 'Dec 18, 2024', dueDate: 'Jan 18, 2025', amount: 850, paid: 850, status: 'paid', treatments: ['Root Canal'] },
  { id: 'INV-002', patientName: 'Michael Chen', date: 'Dec 20, 2024', dueDate: 'Jan 20, 2025', amount: 1200, paid: 600, status: 'partial', treatments: ['Crown', 'Cleaning'] },
  { id: 'INV-003', patientName: 'Emma Davis', date: 'Dec 15, 2024', dueDate: 'Jan 15, 2025', amount: 450, paid: 0, status: 'overdue', treatments: ['Checkup', 'X-Ray'] },
  { id: 'INV-004', patientName: 'James Wilson', date: 'Dec 22, 2024', dueDate: 'Jan 22, 2025', amount: 2100, paid: 0, status: 'pending', treatments: ['Implant Consultation'] },
  { id: 'INV-005', patientName: 'Olivia Martinez', date: 'Dec 23, 2024', dueDate: 'Jan 23, 2025', amount: 650, paid: 650, status: 'paid', treatments: ['Whitening'] },
];

const statusConfig = {
  paid: { label: 'Paid', color: 'bg-success/10 text-success' },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning' },
  overdue: { label: 'Overdue', color: 'bg-destructive/10 text-destructive' },
  partial: { label: 'Partial', color: 'bg-info/10 text-info' },
};

function BillingContent() {
  const stats = [
    { label: 'Total Revenue', value: '$67,420', icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Pending', value: '$12,350', icon: Calendar, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Overdue', value: '$2,450', icon: Receipt, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'This Month', value: '$18,920', icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and financial records</p>
        </div>
        <Button className="gradient-primary text-primary-foreground shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="shadow-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search invoices..." className="pl-10 w-60 bg-muted/50 border-transparent" />
              </div>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Invoice</TableHead>
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, index) => (
                <TableRow 
                  key={invoice.id} 
                  className="group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-medium text-primary">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.patientName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.treatments.join(', ')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className={cn(
                    invoice.status === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'
                  )}>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                      {invoice.status === 'partial' && (
                        <p className="text-xs text-success">Paid: ${invoice.paid.toLocaleString()}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-medium', statusConfig[invoice.status].color)}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem>View Invoice</DropdownMenuItem>
                        <DropdownMenuItem>Record Payment</DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Billing() {
  return (
    <DashboardLayout>
      <BillingContent />
    </DashboardLayout>
  );
}
