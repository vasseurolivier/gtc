
'use client';

import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  ClipboardList, 
  User, 
  LogOut, 
  Package, 
  Settings,
  HelpCircle,
  Home,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/client/login') {
      router.push('/client/login');
    }
  }, [user, isUserLoading, router, pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/client/login');
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && pathname !== '/client/login') {
    return null;
  }

  if (pathname === '/client/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/client', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de bord' },
    { href: '/client/product-lists', icon: <ClipboardList className="h-5 w-5" />, label: 'Mes listes de produits' },
    { href: '/client/orders', icon: <Receipt className="h-5 w-5" />, label: 'Commandes & Factures' },
    { href: '/client/profile', icon: <User className="h-5 w-5" />, label: 'Mon Profil' },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="bg-zinc-950 text-white border-r border-zinc-800">
        <SidebarHeader className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-xl">G</div>
            <span className="font-headline font-bold text-lg tracking-tight">Client Hub</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href} className="mb-1">
                <SidebarMenuButton asChild isActive={pathname === item.href} className="hover:bg-zinc-900 h-11">
                  <Link href={item.href}>
                    {item.icon}
                    <span className="text-base">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-zinc-800 space-y-2">
          <SidebarMenuButton asChild className="hover:bg-zinc-900 h-11">
            <Link href="/">
              <Home className="h-5 w-5" />
              <span>Retour au site</span>
            </Link>
          </SidebarMenuButton>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-zinc-400 hover:text-white hover:bg-red-500/10 h-11">
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-zinc-50">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="font-bold text-zinc-800">Espace Client Sécurisé</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 hidden md:inline">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
