
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Mail,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppProviders } from '@/components/app-providers';
import '../globals.css';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages' },
    { href: '/admin/customers', icon: <Users />, label: 'Customers' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Quotes' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders' },
    { href: '/admin/products', icon: <Package />, label: 'Products' },
  ];
  
  const activePath = pathname;

  // Login page should not have the sidebar
  if (activePath.startsWith('/admin/login')) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body bg-background text-foreground antialiased">
                <AppProviders>
                    {children}
                </AppProviders>
            </body>
        </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
        <head>
            <title>Admin Dashboard</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body bg-background text-foreground antialiased">
            <AppProviders>
                <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                    <SidebarHeader>
                        <h2 className="text-lg font-semibold">TradeBridge Admin</h2>
                    </SidebarHeader>
                    <SidebarMenu>
                        {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                            <SidebarMenuButton asChild isActive={activePath === item.href || activePath.startsWith(`${item.href}/`)}>
                                <span>
                                {item.icon}
                                <span>{item.label}</span>
                                </span>
                            </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    <SidebarFooter>
                        <Button variant="ghost" onClick={handleLogout} className="justify-start w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                        </Button>
                    </SidebarFooter>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
                </SidebarProvider>
            </AppProviders>
        </body>
    </html>
  );
}
