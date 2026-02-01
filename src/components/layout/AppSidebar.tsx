import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
import { authApi, dashboardApi, labWorkApi } from '@/lib/api';
import { toast } from 'sonner';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  roles: UserRole[];
  children?: { title: string; url: string }[];
}

const moduleKeyByTitle: Record<string, string> = {
  Dashboard: 'dashboard',
  Patients: 'patients',
  Appointments: 'appointments',
  'Dental Chart': 'dental-chart',
  Treatments: 'treatments',
  Prescriptions: 'prescriptions',
  'Lab Work': 'lab-work',
  Billing: 'billing',
  Inventory: 'inventory',
  Staff: 'staff',
  Dentists: 'dentists',
  Reports: 'reports',
  Documents: 'documents',
  Settings: 'settings',
};

const navItems: NavItem[] = [
  {
    title: 'License',
    url: '/license',
    icon: Settings,
    roles: ['superadmin']
  },
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
      { title: 'Checkup', url: '/billing/checkup' },
      { title: 'Procedure', url: '/billing/procedure' },
      { title: 'Lab', url: '/billing/lab' },
      { title: 'Prescription', url: '/billing/prescription' },
      { title: 'Expenses', url: '/billing/expenses' },
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
    roles: ['admin'],
    children: [
      { title: 'Staff List', url: '/staff' },
      { title: 'Role Management', url: '/staff/role-management' }
    ]
  },
  {
    title: 'Dentists',
    url: '/dentists',
    icon: Stethoscope,
    roles: ['admin']
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['admin'],
    children: [
      { title: 'Financial', url: '/reports' },
    ]
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
    roles: ['admin', 'dentist', 'receptionist']
  },
  {
    title: 'Logout',
    url: '/logout',
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
  const navigate = useNavigate();
  const { role, authRole, canSwitchRole, setRole, userName, permissions, license, resetAuth } = useRole();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    toast.success('Logged out');
    resetAuth();
    navigate('/login');
  };

  const [counts, setCounts] = useState<{ patients?: number; appointmentsToday?: number; labWorkOpen?: number } | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        if (authRole === 'admin' && !permissions.includes('dashboard')) {
          setCounts(null);
          return;
        }
        if (authRole !== 'superadmin' && license?.isActive && Array.isArray(license?.enabledModules) && !license.enabledModules.includes('dashboard')) {
          setCounts(null);
          return;
        }
        const [statsRes, labRes] = await Promise.all([
          dashboardApi.getStats(),
          labWorkApi.getSummary?.() ?? Promise.resolve(null as any),
        ]);
        if (!isMounted) return;
        setCounts({
          patients: statsRes?.data?.totalPatients,
          appointmentsToday: statsRes?.data?.appointmentsToday,
          labWorkOpen: labRes?.data?.openCount,
        });
      } catch {
        if (!isMounted) return;
        setCounts(null);
      }
    };

    loadCounts();
    return () => {
      isMounted = false;
    };
  }, [authRole, license?.isActive, license?.enabledModules, permissions, role]);

  // Initialize expanded items based on current active route
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const activeItem = navItems.find(item =>
      item.children?.some(child => location.pathname === child.url || location.pathname.startsWith(child.url + '/'))
    );
    return activeItem ? [activeItem.title] : [];
  });

  const filteredItems = navItems
    .filter((item) => {
      const key = moduleKeyByTitle[item.title];
      if (key) return true;
      return item.roles.includes(role);
    })
    .filter((item) => {
      if (role === 'superadmin') return true;
      if (!license?.isActive) return item.title === 'Logout';
      const key = moduleKeyByTitle[item.title];
      if (key && Array.isArray(license?.enabledModules) && !license.enabledModules.includes(key)) return false;
      if (!key) return true;
      return permissions.includes(key);
    });

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

  const getBadgeText = (item: NavItem) => {
    if (item.title === 'Patients') {
      if (counts?.patients !== undefined) return String(counts.patients);
      return counts === null ? undefined : '...';
    }
    if (item.title === 'Appointments') {
      if (counts?.appointmentsToday !== undefined) return String(counts.appointmentsToday);
      return counts === null ? undefined : '...';
    }
    if (item.title === 'Lab Work') {
      if (counts?.labWorkOpen !== undefined) return String(counts.labWorkOpen);
      return counts === null ? undefined : '...';
    }
    return item.badge;
  };

  const roleColors: Record<UserRole, string> = {
    superadmin: 'bg-warning/20 text-warning',
    admin: 'bg-primary/20 text-primary',
    dentist: 'bg-info/20 text-info',
    receptionist: 'bg-success/20 text-success'
  };

  const roleLabels: Record<UserRole, string> = {
    superadmin: 'Super Admin',
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
            <img src="/Dental.jpg" alt="Dental Care Logo" className="w-full h-full object-contain p-1" />
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
                            {getBadgeText(item) && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-sidebar-primary/20 text-sidebar-primary border-0">
                                {getBadgeText(item)}
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
                      {item.title === 'Logout' ? (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={cn(
                            'flex w-full items-center gap-3 transition-all duration-200',
                            'hover:bg-sidebar-accent',
                            isActive(item.url) && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                          )}
                        >
                          <item.icon className={cn(
                            'w-5 h-5',
                            isActive(item.url) ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70'
                          )} />
                          {!collapsed && <span>{item.title}</span>}
                        </button>
                      ) : (
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
                          {!collapsed && getBadgeText(item) && (
                            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs bg-sidebar-primary/20 text-sidebar-primary border-0">
                              {getBadgeText(item)}
                            </Badge>
                          )}
                        </Link>
                      )}
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
            {canSwitchRole ? (
              <>
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
              </>
            ) : (
              <>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
