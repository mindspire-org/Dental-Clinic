import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  FlaskConical,
  CreditCard,
  Package,
  UserCog,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Smile,
  ClipboardList,
  Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole, UserRole } from '@/contexts/RoleContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  roles: UserRole[];
  children?: { title: string; url: string }[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'dentist', 'receptionist']
  },
  {
    title: 'Patients',
    url: '/patients',
    icon: Users,
    badge: '2.4k',
    roles: ['admin', 'dentist', 'receptionist'],
    children: [
      { title: 'All Patients', url: '/patients' },
      { title: 'New Patient', url: '/patients/new' },
      { title: 'Patient Records', url: '/patients/records' }
    ]
  },
  {
    title: 'Appointments',
    url: '/appointments',
    icon: Calendar,
    badge: '12',
    roles: ['admin', 'dentist', 'receptionist'],
    children: [
      { title: 'Calendar View', url: '/appointments' },
      { title: 'Schedule', url: '/appointments/schedule' },
      { title: 'Waiting List', url: '/appointments/waiting' }
    ]
  },
  {
    title: 'Dental Chart',
    url: '/dental-chart',
    icon: Smile,
    roles: ['admin', 'dentist']
  },
  {
    title: 'Treatments',
    url: '/treatments',
    icon: Stethoscope,
    roles: ['admin', 'dentist'],
    children: [
      { title: 'Treatment Plans', url: '/treatments' },
      { title: 'Procedures', url: '/treatments/procedures' },
      { title: 'History', url: '/treatments/history' }
    ]
  },
  {
    title: 'Prescriptions',
    url: '/prescriptions',
    icon: Pill,
    roles: ['admin', 'dentist']
  },
  {
    title: 'Lab Work',
    url: '/lab-work',
    icon: FlaskConical,
    badge: '5',
    roles: ['admin', 'dentist']
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: CreditCard,
    roles: ['admin', 'receptionist'],
    children: [
      { title: 'Invoices', url: '/billing' },
      { title: 'Payments', url: '/billing/payments' },
      { title: 'Insurance', url: '/billing/insurance' }
    ]
  },
  {
    title: 'Inventory',
    url: '/inventory',
    icon: Package,
    roles: ['admin'],
    children: [
      { title: 'Stock Overview', url: '/inventory' },
      { title: 'Orders', url: '/inventory/orders' },
      { title: 'Suppliers', url: '/inventory/suppliers' }
    ]
  },
  {
    title: 'Staff',
    url: '/staff',
    icon: UserCog,
    roles: ['admin']
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['admin'],
    children: [
      { title: 'Financial', url: '/reports' },
      { title: 'Clinical', url: '/reports/clinical' },
      { title: 'Performance', url: '/reports/performance' }
    ]
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
    roles: ['admin', 'dentist', 'receptionist']
  },
  {
    title: 'Login',
    url: '/login',
    icon: LogOut,
    roles: ['admin', 'dentist', 'receptionist']
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    roles: ['admin']
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { role, setRole, userName } = useRole();

  // Initialize expanded items based on current active route
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const activeItem = navItems.find(item =>
      item.children?.some(child => location.pathname === child.url || location.pathname.startsWith(child.url + '/'))
    );
    return activeItem ? [activeItem.title] : [];
  });

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const isActive = (url: string) => location.pathname === url;
  const isParentActive = (item: NavItem) => {
    if (isActive(item.url)) return true;
    return item.children?.some(child => location.pathname === child.url);
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-primary/20 text-primary',
    dentist: 'bg-info/20 text-info',
    receptionist: 'bg-success/20 text-success'
  };

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    dentist: 'Dentist',
    receptionist: 'Receptionist'
  };

  return (
    <Sidebar className="border-r-0 gradient-sidebar">
      {/* Logo Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow overflow-hidden">
            <img src="/logo.png" alt="DentalVerse Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground">DentalVerse</h1>
              <p className="text-xs text-sidebar-foreground/60">Elite Dental Suite</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4 scrollbar-none">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            {!collapsed && 'Main Menu'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <div>
                      <SidebarMenuButton
                        onClick={() => toggleExpanded(item.title)}
                        className={cn(
                          'w-full justify-between group transition-all duration-200',
                          isParentActive(item) && 'bg-sidebar-accent text-sidebar-primary'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn(
                            'w-5 h-5 transition-colors',
                            isParentActive(item) ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'
                          )} />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && (
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-sidebar-primary/20 text-sidebar-primary border-0">
                                {item.badge}
                              </Badge>
                            )}
                            {expandedItems.includes(item.title) ? (
                              <ChevronDown className="w-4 h-4 text-sidebar-foreground/50" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-sidebar-foreground/50" />
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                      {!collapsed && expandedItems.includes(item.title) && (
                        <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4 animate-fade-in">
                          {item.children.map((child) => (
                            <Link
                              key={child.url}
                              to={child.url}
                              className={cn(
                                'block py-2 px-3 text-sm rounded-md transition-all duration-200',
                                isActive(child.url)
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                              )}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          'flex items-center gap-3 transition-all duration-200',
                          isActive(item.url)
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                            : 'hover:bg-sidebar-accent'
                        )}
                      >
                        <item.icon className={cn(
                          'w-5 h-5',
                          isActive(item.url) ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70'
                        )} />
                        {!collapsed && <span>{item.title}</span>}
                        {!collapsed && item.badge && (
                          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs bg-sidebar-primary/20 text-sidebar-primary border-0">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent',
              collapsed && 'justify-center'
            )}>
              <Avatar className="h-9 w-9 border-2 border-sidebar-primary/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                  <Badge className={cn('text-[10px] h-4 px-1.5 font-medium', roleColors[role])}>
                    {roleLabels[role]}
                  </Badge>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setRole('admin')} className={role === 'admin' ? 'bg-muted' : ''}>
              <UserCog className="mr-2 h-4 w-4" /> Administrator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRole('dentist')} className={role === 'dentist' ? 'bg-muted' : ''}>
              <Stethoscope className="mr-2 h-4 w-4" /> Dentist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRole('receptionist')} className={role === 'receptionist' ? 'bg-muted' : ''}>
              <ClipboardList className="mr-2 h-4 w-4" /> Receptionist
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
