
'use client';

import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode, useState, useMemo } from 'react';
import { doc, collection, query, where, collectionGroup } from 'firebase/firestore';
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  ClipboardList, 
  User, 
  LogOut, 
  Home,
  Receipt,
  Clock,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function ClientMobileNav({ counts }: { counts: any }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/client', icon: <Home className="h-6 w-6" />, label: 'Accueil' },
    { href: '/client/product-lists', icon: <ClipboardList className="h-6 w-6" />, label: 'Sourcing', badge: counts.sourcing },
    { href: '/client/orders', icon: <ShoppingBag className="h-6 w-6" />, label: 'Commandes', badge: counts.orders + counts.quotes + counts.invoices },
    { href: '/client/profile', icon: <User className="h-6 w-6" />, label: 'Profil' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-zinc-100 h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={cn(
          "flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-300 relative",
          pathname === item.href ? "text-primary scale-110" : "text-zinc-400"
        )}>
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute top-0 right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white ring-2 ring-white">
              {item.badge}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch client profile to check status
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // --- Notification Logic ---
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', user.uid), where('status', '==', 'sent'));
  }, [db, user]);
  const { data: pendingQuotes } = useCollection(quotesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'clients', user.uid, 'invoices'), where('status', '==', 'unpaid'));
  }, [db, user]);
  const { data: unpaidInvoices } = useCollection(invoicesQuery);

  const sourcingProductsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collectionGroup(db, 'products'), where('clientId', '==', user.uid), where('status', '==', 'published'));
  }, [db, user]);
  const { data: publishedProducts } = useCollection(sourcingProductsQuery);

  const counts = useMemo(() => ({
    quotes: pendingQuotes?.length || 0,
    invoices: unpaidInvoices?.length || 0,
    orders: 0, // Could be status updates
    sourcing: publishedProducts?.length || 0
  }), [pendingQuotes, unpaidInvoices, publishedProducts]);

  useEffect(() => {
    if (mounted && !isUserLoading && !user && pathname !== '/client/login') {
      router.push('/client/login');
    }
  }, [user, isUserLoading, router, pathname, mounted]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/client/login');
  };

  if (!mounted || isUserLoading || (user && isProfileLoading)) {
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

  // --- Account Validation Screen (Strict Security) ---
  if (profile && profile.status !== 'validated') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-headline font-bold text-zinc-900">Compte en attente</h1>
              <p className="text-zinc-500">
                Bonjour <strong>{profile.firstName}</strong>, votre compte doit être validé par un administrateur avant de pouvoir accéder à votre catalogue et vos commandes.
              </p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-600 flex items-start gap-3 text-left">
              <ShieldAlert className="h-5 w-5 text-orange-500 shrink-0" />
              <p>Cette mesure de sécurité protège la confidentialité de vos transactions et de vos tarifs négociés.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="w-full h-12 font-bold" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/">Retour au site</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { href: '/client', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Tableau de bord' },
    { href: '/client/product-lists', icon: <ClipboardList className="h-5 w-5" />, label: 'Mes listes de produits', badge: counts.sourcing },
    { href: '/client/orders', icon: <Receipt className="h-5 w-5" />, label: 'Commandes & Factures', badge: counts.quotes + counts.invoices },
    { href: '/client/profile', icon: <User className="h-5 w-5" />, label: 'Mon Profil' },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="bg-zinc-950 text-white border-r border-zinc-800">
        <SidebarHeader className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-xl text-white">G</div>
            <span className="font-headline font-bold text-lg tracking-tight">Client Hub</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href} className="mb-1">
                <SidebarMenuButton asChild isActive={pathname === item.href} className="hover:bg-zinc-900 h-11 relative">
                  <Link href={item.href}>
                    {item.icon}
                    <span className="text-base">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
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
      <SidebarInset className="bg-zinc-50 pb-20 lg:pb-0">
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 lg:hidden" />
            <Badge variant="outline" className="hidden sm:flex text-green-600 border-green-200 bg-green-50">Accès Sécurisé</Badge>
            <h2 className="font-bold text-zinc-800">Espace Client</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 hidden md:inline">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">
          {children}
        </main>
        <ClientMobileNav counts={counts} />
      </SidebarInset>
    </SidebarProvider>
  );
}
