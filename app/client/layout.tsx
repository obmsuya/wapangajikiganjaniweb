'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building, Users, Settings, DollarSign, HelpCircle, LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/app/components/theme-provider';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { futura } from '@/lib/fonts';

/**
 * Theme Toggle Component
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/**
 * Sidebar navigation items - updated with correct client routes
 */
const navItems = [
  { name: 'Dashboard', href: '/client', icon: Home },
  { name: 'Properties', href: '/client/properties', icon: Building },
  { name: 'Tenants', href: '/client/tenants', icon: Users },
  { name: 'Payments', href: '/client/payments', icon: DollarSign },
  { name: 'Settings', href: '/client/settings', icon: Settings },
  { name: 'Help', href: '/client/help', icon: HelpCircle },
];

/**
 * Client Layout Component
 * 
 * Provides the main layout structure for the client portal including
 * navigation, header, and content area.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={cn("flex min-h-screen bg-background text-foreground", futura.className)}>
        {/* Sidebar Navigation */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 transform shadow-lg bg-card border-r border-border lg:relative lg:translate-x-0 transition duration-200">
          {/* Logo & Brand */}
          <div className="p-4 border-b border-border">
            <Link href="/client" className="flex items-center space-x-2">
              <Building className="h-6 w-6 text-brand-primary" />
              <span className="text-lg font-bold">WaPangajiKiganjani</span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/client' 
                ? pathname === '/client' 
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div>
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-muted-foreground">Property Manager</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button className="flex items-center gap-2 rounded-md px-3 py-2 w-full text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>

        {/* Toast Notifications */}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
