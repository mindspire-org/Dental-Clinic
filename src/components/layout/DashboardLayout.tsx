import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { RoleProvider } from '@/contexts/RoleContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <RoleProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-6 overflow-auto scrollbar-none">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </RoleProvider>
  );
}
