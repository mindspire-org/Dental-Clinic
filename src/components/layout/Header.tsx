import { Bell, Search, Plus, MessageSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const notifications = [
  { id: 1, title: 'New appointment request', desc: 'John Doe requested an appointment for tomorrow', time: '2 min ago', unread: true },
  { id: 2, title: 'Lab results ready', desc: 'Crown fabrication completed for patient #1234', time: '1 hour ago', unread: true },
  { id: 3, title: 'Payment received', desc: '$450.00 payment from Sarah Smith', time: '3 hours ago', unread: false },
];

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" />
          
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, appointments..."
              className="w-80 pl-10 h-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 gap-2 gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem>New Patient</DropdownMenuItem>
              <DropdownMenuItem>New Appointment</DropdownMenuItem>
              <DropdownMenuItem>New Treatment</DropdownMenuItem>
              <DropdownMenuItem>New Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-ring">
                  2
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="text-xs">2 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    {notif.unread && <span className="w-2 h-2 rounded-full bg-primary" />}
                    <span className={cn('font-medium text-sm', notif.unread && 'text-foreground')}>
                      {notif.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{notif.desc}</p>
                  <span className="text-[10px] text-muted-foreground/70">{notif.time}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary font-medium">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
