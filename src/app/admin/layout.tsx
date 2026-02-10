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
  SidebarMenuBadge,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Mail,
  LogOut,
  Cog,
  Receipt,
  UploadCloud,
  Landmark,
  FileSignature,
  ClipboardList,
  UserCheck,
  Settings,
  Factory,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CurrencyContext } from '@/context/currency-context';
import { CompanyInfoContext } from '@/context/company-info-context';
import { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSubmissions } from '@/actions/submissions';
import { getOrders } from '@/actions/orders';
import { getRegisteredClients } from '@/actions/registered-clients';
import { uploadFile } from '@/actions/upload';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';

function AdminSettings({ trigger }: { trigger?: React.ReactNode }) {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [localRate, setLocalRate] = useState('');
    
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [logoAdmin, setLogoAdmin] = useState('');
    const [logoDocument, setLogoDocument] = useState('');
    const [logoCommercial, setLogoCommercial] = useState('');
    const [brochureUrl, setBrochureUrl] = useState('');
    
    const [uploadingType, setUploadingType] = useState<'admin' | 'doc' | 'comm' | 'brochure' | null>(null);

    useEffect(() => {
        if (isDialogOpen && companyInfoContext && currencyContext) {
            setSelectedCurrency(currencyContext.currency.code);
            setLocalRate(currencyContext.exchangeRate.toString());
            
            const info = companyInfoContext.companyInfo;
            setCompanyName(info.name);
            setCompanyAddress(info.address);
            setCompanyEmail(info.email);
            setCompanyPhone(info.phone);
            setLogoAdmin(info.logoAdmin || '');
            setLogoDocument(info.logoDocument || '');
            setLogoCommercial(info.logoCommercial || '');
            setBrochureUrl(info.brochureUrl || '');
        }
    }, [isDialogOpen, companyInfoContext, currencyContext]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'admin' | 'doc' | 'comm' | 'brochure') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingType(type);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'branding');

        try {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                if (type === 'admin') setLogoAdmin(result.url);
                if (type === 'doc') setLogoDocument(result.url);
                if (type === 'comm') setLogoCommercial(result.url);
                if (type === 'brochure') setBrochureUrl(result.url);
                toast({ title: 'Fichier téléchargé' });
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: result.message });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur système' });
        } finally {
            setUploadingType(null);
            e.target.value = '';
        }
    };

    if (!currencyContext || !companyInfoContext) return null;

    const { setCurrency, setExchangeRate } = currencyContext;
    const { setCompanyInfo } = companyInfoContext;
    
    const handleSave = () => {
        const newRate = parseFloat(localRate);
        if (isNaN(newRate) || newRate <= 0) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Taux invalide.'});
            return;
        }

        if (selectedCurrency === 'EUR') setCurrency({ symbol: '€', code: 'EUR' });
        else if (selectedCurrency === 'USD') setCurrency({ symbol: '$', code: 'USD' });
        
        setExchangeRate(newRate);
        setCompanyInfo({
            name: companyName,
            address: companyAddress,
            email: companyEmail,
            phone: companyPhone,
            logoAdmin,
            logoDocument,
            logoCommercial,
            brochureUrl,
        });

        toast({ title: 'Configuration mise à jour' });
        setIsDialogOpen(false);
    };
    
    return (
        <>
            {trigger ? (
              <div onClick={() => setIsDialogOpen(true)}>{trigger}</div>
            ) : (
              <Button variant="ghost" onClick={() => setIsDialogOpen(true)} className="justify-start w-full">
                  <Cog className="mr-2 h-4 w-4" /> Paramètres
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Paramètres Globaux</DialogTitle>
                        <DialogDescription>Gérez l'identié visuelle et les informations de l'entreprise.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div>
                            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Logos & Identité</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2 font-bold text-blue-600">Logo Site (Commercial)</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {uploadingType === 'comm' ? <Loader2 className="h-4 w-4 animate-spin" /> : logoCommercial ? (
                                                    <img src={logoCommercial} alt="Commercial" className="object-contain h-full w-full" />
                                                ) : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'comm')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL..." value={logoCommercial} onChange={(e) => setLogoCommercial(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Logo affiché sur le site public (Header/Footer).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2 font-bold text-primary">Logo Documents (PI/Inv)</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {uploadingType === 'doc' ? <Loader2 className="h-4 w-4 animate-spin" /> : logoDocument ? (
                                                    <img src={logoDocument} alt="Document" className="object-contain h-full w-full" />
                                                ) : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'doc')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL..." value={logoDocument} onChange={(e) => setLogoDocument(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Logo affiché sur les Proformas et Factures.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2 font-bold text-zinc-600">Logo Admin (Espace)</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {uploadingType === 'admin' ? <Loader2 className="h-4 w-4 animate-spin" /> : logoAdmin ? (
                                                    <img src={logoAdmin} alt="Admin" className="object-contain h-full w-full" />
                                                ) : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'admin')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL..." value={logoAdmin} onChange={(e) => setLogoAdmin(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Logo affiché dans la barre latérale de l'administration.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Informations Entreprise</h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-name" className="text-right">Raison Sociale</Label>
                                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="company-address" className="text-right pt-2">Adresse</Label>
                                    <Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="col-span-3" rows={3} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-email" className="text-right">Email Contact</Label>
                                    <Input id="company-email" type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-phone" className="text-right">Téléphone</Label>
                                    <Input id="company-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Paramètres Financiers</h3>
                            <div className="grid gap-4">
                               <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="currency-select" className="text-right">Devise</Label>
                                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                        <SelectTrigger className="col-span-3" id="currency-select"><SelectValue placeholder="Select a currency" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EUR">Euro (€)</SelectItem>
                                            <SelectItem value="USD">US Dollar ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="exchange-rate" className="text-right">Taux (vs CNY)</Label>
                                    <Input id="exchange-rate" type="number" value={localRate} onChange={(e) => setLocalRate(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Annuler</Button></DialogClose>
                        <Button onClick={handleSave}>Enregistrer tout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function MobileBottomNav({ unreadMessages, pendingCount }: { unreadMessages: number, pendingCount: number }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Stats' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages', badge: unreadMessages },
    { href: '/admin/registered-clients', icon: <UserCheck />, label: 'Clients', badge: pendingCount },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 h-16 flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className={cn(
          "flex flex-col items-center justify-center gap-1 min-w-[60px] relative transition-all duration-300",
          pathname.startsWith(item.href) ? "text-primary scale-110" : "text-zinc-500"
        )}>
          <div className="relative">
            {item.icon}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </Link>
      ))}
      <AdminSettings trigger={
        <div className="flex flex-col items-center justify-center gap-1 min-w-[60px] text-zinc-500">
          <Settings className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Réglages</span>
        </div>
      } />
    </div>
  );
}

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const db = useFirestore();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingClients, setPendingClients] = useState(0);
  const [pendingSourcing, setPendingSourcing] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const companyInfoContext = useContext(CompanyInfoContext);
  
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [router, pathname]);

  useEffect(() => {
    if (isAuthenticated !== true || !db) return;
    async function fetchCounts() {
        try {
            const [subs, ords, cls] = await Promise.all([
              getSubmissions(),
              getOrders(),
              getRegisteredClients()
            ]);
            
            let sourcingCount = 0;
            try {
              const q = query(collectionGroup(db, 'products'), where('status', '==', 'pending'));
              const snap = await getDocs(q);
              sourcingCount = snap.size;
            } catch (e) {}

            setUnreadMessages(subs.filter(s => !s.read).length);
            setPendingOrders(ords.filter(o => o.status === 'processing').length);
            setPendingClients(cls.filter(c => c.status === 'pending').length);
            setPendingSourcing(sourcingCount);
        } catch (error) {}
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [pathname, isAuthenticated, db]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/admin/financial-report', icon: <Landmark />, label: 'Financial Report' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages', badge: unreadMessages },
    { href: '/admin/registered-clients', icon: <UserCheck />, label: 'Comptes Clients', badge: (pendingOrders + pendingClients + pendingSourcing) },
    { href: '/admin/customers', icon: <Users />, label: 'Leads CRM' },
    { href: '/admin/suppliers', icon: <Factory />, label: 'Suppliers' },
    { href: '/admin/packing-list', icon: <ClipboardList />, label: 'Packing List' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Proforma Invoices' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders', badge: pendingOrders },
    { href: '/admin/invoices', icon: <Receipt />, label: 'Invoices' },
    { href: '/admin/products', icon: <Package />, label: 'Products' },
    { href: '/admin/supplier-contract', icon: <FileSignature />, label: 'Supplier Contract' },
  ];
  
  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) return null;

  const displayLogo = companyInfoContext?.companyInfo.logoAdmin || companyInfoContext?.companyInfo.logoDocument;

  return (
    <SidebarProvider>
      <Sidebar className="no-print bg-muted/20">
        <SidebarContent>
          <SidebarHeader className="p-4">
             <div className="flex items-center justify-center py-4">
                {displayLogo ? <img src={displayLogo} alt="Logo Admin" className="max-h-8 w-auto object-contain" /> : <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-bold text-white">G</div>}
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}>
                  <Link href={item.href} className="flex items-center w-full">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <SidebarMenuBadge className={cn(
                        "bg-primary text-white",
                        (item.href === '/admin/orders' || item.href === '/admin/registered-clients') && "bg-red-600 animate-pulse"
                      )}>
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarFooter>
            <AdminSettings />
            <Button variant="ghost" onClick={handleLogout} className="justify-start w-full text-zinc-400">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="pb-20 lg:pb-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-white z-30 lg:h-16">
          <SidebarTrigger className="-ml-1 lg:hidden" />
          <Separator orientation="vertical" className="mr-2 h-4 lg:hidden" />
          <span className="font-bold text-sm text-zinc-800 uppercase tracking-widest">GTC Admin Portal</span>
        </header>
        <div className="flex-grow">
          {children}
        </div>
        <MobileBottomNav 
          unreadMessages={unreadMessages} 
          pendingCount={(pendingOrders + pendingClients + pendingSourcing)} 
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (pathname.endsWith('/admin/login')) {
    return <>{children}</>;
  }

  return (
    <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
  )
}
