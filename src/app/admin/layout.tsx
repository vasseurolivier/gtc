
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
import '../[locale]/globals.css';

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
    { href: '/admin/customers', icon: <Users />, label: 'Clients' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Devis' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Commandes' },
    { href: '/admin/products', icon: <Package />, label: 'Produits' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages' },
  ];
  
  const getBasePath = (path: string) => {
    const parts = path.split('/');
    if (parts.length > 2 && (parts[1] === 'en' || parts[1] === 'fr')) {
        // Path is like /en/admin/dashboard, we want /admin/dashboard for comparison
        return `/${parts.slice(2).join('/')}`;
    }
    return path;
  }
  
  const activePath = getBasePath(pathname);

  // Login page should not have the sidebar
  if (activePath.endsWith('/login')) {
    return (
        <html lang="fr" suppressHydrationWarning>
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
    <html lang="fr" suppressHydrationWarning>
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
                        <h2 className="text-lg font-semibold">TradeBridge</h2>
                    </SidebarHeader>
                    <SidebarMenu>
                        {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <Link href={item.href} passHref>
                            <SidebarMenuButton asChild isActive={activePath === item.href || activePath.startsWith(`${item.href}/`)}>
                                <>
                                {item.icon}
                                <span>{item.label}</span>
                                </>
                            </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    <SidebarFooter>
                        <Button variant="ghost" onClick={handleLogout} className="justify-start w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                        </Button>
                    </SidebarFooter>
                    </SidebarContent>
                </Sidebar>
                <SidebarInset>
                    <div className="p-4 md:p-6">
                    {children}
                    </div>
                </SidebarInset>
                </SidebarProvider>
            </AppProviders>
        </body>
    </html>
  );
}
