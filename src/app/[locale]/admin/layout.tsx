
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
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

export default function AdminLayout({
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
  
  // A bit of a hack to get the base path for active link checking
  const getBasePath = (path: string) => {
    const parts = path.split('/');
    if (parts.length > 3) {
      return `/${parts[1]}/${parts[2]}`;
    }
    return path;
  }
  
  const activePath = getBasePath(pathname);

  return (
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
                  <SidebarMenuButton asChild isActive={activePath.endsWith(item.href)}>
                    {item.icon}
                    <span>{item.label}</span>
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
  );
}
