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
  Factory,
  UserCheck,
  FileDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CurrencyProvider, CurrencyContext } from '@/context/currency-context';
import { CompanyInfoProvider, CompanyInfoContext, CompanyInfo } from '@/context/company-info-context';
import { useContext, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSubmissions, Submission } from '@/actions/submissions';
import { AppProviders } from '@/components/app-providers';
import { Loader2 } from 'lucide-react';
import { uploadFile } from '@/actions/upload';

function AdminSettings() {
    const currencyContext = useContext(CurrencyContext);
    const companyInfoContext = useContext(CompanyInfoContext);
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Currency state
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [localRate, setLocalRate] = useState('');
    
    // Company Info state
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyLogo, setCompanyLogo] = useState('');
    const [publicLogo, setPublicLogo] = useState('');
    const [brochureUrl, setBrochureUrl] = useState('');
    
    // Upload state
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingPublicLogo, setIsUploadingPublicLogo] = useState(false);
    const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);

    useEffect(() => {
        if (isDialogOpen) {
            if (currencyContext) {
                setSelectedCurrency(currencyContext.currency.code);
                setLocalRate(currencyContext.exchangeRate.toString());
            }
            if (companyInfoContext) {
                setCompanyName(companyInfoContext.companyInfo.name);
                setCompanyAddress(companyInfoContext.companyInfo.address);
                setCompanyEmail(companyInfoContext.companyInfo.email);
                setCompanyPhone(companyInfoContext.companyInfo.phone);
                setCompanyLogo(companyInfoContext.companyInfo.logo);
                setPublicLogo(companyInfoContext.companyInfo.publicLogo || '');
                setBrochureUrl(companyInfoContext.companyInfo.brochureUrl || '');
            }
        }
    }, [isDialogOpen, currencyContext, companyInfoContext]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'publicLogo' | 'brochure') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'logo') setIsUploadingLogo(true);
        if (type === 'publicLogo') setIsUploadingPublicLogo(true);
        if (type === 'brochure') setIsUploadingBrochure(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'branding');

        try {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                if (type === 'logo') setCompanyLogo(result.url);
                if (type === 'publicLogo') setPublicLogo(result.url);
                if (type === 'brochure') setBrochureUrl(result.url);
                toast({ title: 'Fichier téléchargé avec succès' });
            } else {
                toast({ variant: 'destructive', title: 'Erreur', description: result.message });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erreur système', description: "Le service d'upload est indisponible." });
        } finally {
            if (type === 'logo') setIsUploadingLogo(false);
            if (type === 'publicLogo') setIsUploadingPublicLogo(false);
            if (type === 'brochure') setIsUploadingBrochure(false);
            e.target.value = '';
        }
    };

    if (!currencyContext || !companyInfoContext) return null;

    const { setCurrency, setExchangeRate } = currencyContext;
    const { setCompanyInfo } = companyInfoContext;
    
    const handleSave = () => {
        const newRate = parseFloat(localRate);
        if (isNaN(newRate) || newRate <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid exchange rate.'});
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
            logo: companyLogo,
            publicLogo: publicLogo,
            brochureUrl: brochureUrl,
        });

        toast({ title: 'Configuration mise à jour' });
        setIsDialogOpen(false);
    };
    
    return (
        <>
            <Button variant="ghost" onClick={() => setIsDialogOpen(true)} className="justify-start w-full">
                <Cog className="mr-2 h-4 w-4" /> Paramètres
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Paramètres Globaux</DialogTitle>
                        <DialogDescription>Gérez les informations de l'entreprise et les documents officiels.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div>
                            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Informations Entreprise</h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="company-name" className="text-right">Raison Sociale</Label>
                                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">Logo Admin</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : companyLogo ? (
                                                    <img src={companyLogo} alt="Logo" className="object-contain h-full w-full" />
                                                ) : (
                                                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL directe..." value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">Logo Public</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                                {isUploadingPublicLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : publicLogo ? (
                                                    <img src={publicLogo} alt="Public Logo" className="object-contain h-full w-full" />
                                                ) : (
                                                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'publicLogo')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL directe..." value={publicLogo} onChange={(e) => setPublicLogo(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right pt-2">Brochure PDF</Label>
                                    <div className="col-span-3 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                                {isUploadingBrochure ? <Loader2 className="h-4 w-4 animate-spin" /> : brochureUrl ? <FileDown className="h-6 w-6 text-primary" /> : <FileDown className="h-6 w-6 text-muted-foreground" />}
                                            </div>
                                            <div className="flex-grow space-y-1">
                                                <Input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'brochure')} className="h-8 text-xs cursor-pointer" />
                                                <Input placeholder="URL brochure..." value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    </div>
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

function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
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
    if (isAuthenticated !== true) return;
    async function fetchUnreadCount() {
        try {
            const submissions = await getSubmissions();
            setUnreadMessages(submissions.filter(s => !s.read).length);
        } catch (error) {}
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [pathname, isAuthenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/admin/financial-report', icon: <Landmark />, label: 'Financial Report' },
    { href: '/admin/submissions', icon: <Mail />, label: 'Messages', badge: unreadMessages },
    { href: '/admin/registered-clients', icon: <UserCheck />, label: 'Comptes Clients' },
    { href: '/admin/customers', icon: <Users />, label: 'Leads CRM' },
    { href: '/admin/suppliers', icon: <Factory />, label: 'Suppliers' },
    { href: '/admin/packing-list', icon: <ClipboardList />, label: 'Packing List' },
    { href: '/admin/quotes', icon: <FileText />, label: 'Proforma Invoices' },
    { href: '/admin/orders', icon: <ShoppingCart />, label: 'Orders' },
    { href: '/admin/invoices', icon: <Receipt />, label: 'Invoices' },
    { href: '/admin/products', icon: <Package />, label: 'Products' },
    { href: '/admin/supplier-contract', icon: <FileSignature />, label: 'Supplier Contract' },
  ];
  
  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <Sidebar className="no-print bg-muted/20">
        <SidebarContent>
          <SidebarHeader>
             <Link href="/" className="flex items-center gap-2">
                {companyInfoContext?.companyInfo.logo && <Image src={companyInfoContext.companyInfo.logo} alt="Company Logo" width={120} height={120} className="object-contain" />}
            </Link>
          </SidebarHeader>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}>
                    <span>
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarFooter>
            <AdminSettings />
            <Button variant="ghost" onClick={handleLogout} className="justify-start w-full">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
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
    return <AppProviders>{children}</AppProviders>;
  }

  return (
    <AppProviders>
      <CompanyInfoProvider>
          <CurrencyProvider>
              <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
          </CurrencyProvider>
      </CompanyInfoProvider>
    </AppProviders>
  )
}
