
'use client';

import { useEffect, useState } from 'react';
import { getCustomerById, Customer } from '@/actions/customers';
import { User, Mail, Phone, Building, Globe, StickyNote, Euro, ShoppingCart, FileSpreadsheet, ArrowLeft, Loader2, MapPin, UserPlus, Lock, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { initializeApp, deleteApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';

export default function CustomerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
    const [initialPassword, setInitialPassword] = useState('');
    const [isAlreadyClient, setIsAlreadyClient] = useState(false);

    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
        if (isAuthenticated !== 'true') {
          router.push('/admin/login');
          return;
        }

        if (id) {
            fetchData();
        }
    }, [id, router]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getCustomerById(id!);
            setCustomer(data);
            
            // Check if a client account with this email already exists
            if (data?.email && db) {
                const clientRef = doc(db, 'clients', data.id); // Try by ID first
                const clientSnap = await getDoc(clientRef);
                if (clientSnap.exists()) {
                    setIsAlreadyClient(true);
                }
            }
        } catch (err) {
            console.error("Failed to fetch customer", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClientAccount = async () => {
        if (!customer || !initialPassword || initialPassword.length < 6) {
            toast({ variant: "destructive", title: "Erreur", description: "Le mot de passe doit faire au moins 6 caractères." });
            return;
        }

        setIsConverting(true);
        try {
            // Logic to create a user without signing out the current admin
            // We use a secondary Firebase app instance for this specific task
            const secondaryAppName = `secondary-${Date.now()}`;
            const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            const secondaryAuth = getAuth(secondaryApp);

            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, customer.email, initialPassword);
            const uid = userCredential.user.uid;

            if (db) {
                // Create the client document
                const clientDoc = {
                    id: uid,
                    firstName: customer.name.split(' ')[0] || '',
                    lastName: customer.name.split(' ').slice(1).join(' ') || '',
                    email: customer.email,
                    phone: customer.phone || '',
                    companyName: customer.company || '',
                    address: customer.address || '',
                    status: 'validated',
                    createdAt: new Date().toISOString(),
                    clientNumber: `CL-${Date.now().toString().slice(-4)}`,
                };

                await setDoc(doc(db, 'clients', uid), clientDoc);
                
                toast({ title: "Compte Client Créé", description: `Un accès a été créé pour ${customer.email}.` });
                setIsConvertDialogOpen(false);
                setIsAlreadyClient(true);
            }

            // Cleanup secondary app
            await deleteApp(secondaryApp);
        } catch (e: any) {
            console.error("Account creation error:", e);
            toast({ variant: "destructive", title: "Erreur de création", description: e.message });
        } finally {
            setIsConverting(false);
        }
    };

    const getStatusBadgeVariant = (status: any) => {
        switch (status) {
            case 'delivered': return 'default';
            case 'shipped': return 'secondary';
            case 'processing': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };
    
    const handleExport = () => {
        if (!customer) return;

        const customerInfoData = [
            { 'Field': 'Name', 'Value': customer.name },
            { 'Field': 'Email', 'Value': customer.email },
            { 'Field': 'Phone', 'Value': customer.phone || 'N/A' },
            { 'Field': 'Company', 'Value': customer.company || 'N/A' },
            { 'Field': 'Address', 'Value': customer.address || 'N/A' },
            { 'Field': 'Country', 'Value': customer.country || 'N/A' },
            { 'Field': 'Status', 'Value': customer.status || 'N/A' },
            { 'Field': 'Source', 'Value': customer.source || 'N/A' },
            { 'Field': 'Customer Since', 'Value': customer.createdAt ? formatInTimeZone(new Date(customer.createdAt), 'UTC', 'dd MMM yyyy') : 'N/A' },
            { 'Field': 'Total Revenue (CNY)', 'Value': (customer.totalRevenue || 0).toFixed(2) },
            { 'Field': 'Total Orders', 'Value': customer.orders?.length || 0 },
            { 'Field': 'Notes', 'Value': customer.notes || 'N/A' },
        ];
        const customerInfoWs = XLSX.utils.json_to_sheet(customerInfoData, { skipHeader: true });
        customerInfoWs['!cols'] = [{ wch: 20 }, { wch: 50 }];

        const orderHistoryData = (customer.orders || []).map(order => ({
            'Order #': order.orderNumber,
            'Date': formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy'),
            'Status': order.status,
            'Total (CNY)': order.totalAmount.toFixed(2)
        }));
        const orderHistoryWs = XLSX.utils.json_to_sheet(orderHistoryData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, customerInfoWs, "Customer Info");
        XLSX.utils.book_append_sheet(wb, orderHistoryWs, "Order History");

        XLSX.writeFile(wb, `${customer.name}_profile.xlsx`);
    };

    if (isLoading) {
        return (
             <div className="container py-8">
                <div className="flex h-screen items-center justify-center">
                   <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to CRM
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Prospect introuvable.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour au CRM
                    </Link>
                </Button>
                <div className="flex gap-2">
                    {!isAlreadyClient ? (
                        <Button onClick={() => setIsConvertDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Créer un accès Espace Client
                        </Button>
                    ) : (
                        <Badge className="bg-green-500 h-10 px-4 gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Déjà Client Enregistré
                        </Badge>
                    )}
                    <Button onClick={handleExport} variant="outline">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Exporter Excel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> {customer.name}</CardTitle>
                             <CardDescription>
                                Prospect depuis {formatInTimeZone(new Date(customer.createdAt), 'UTC', 'MMMM yyyy')}
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {customer.email || 'N/A'}</div>
                            {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {customer.phone}</div>}
                            {customer.company && <div className="flex items-center gap-2 text-muted-foreground font-bold text-zinc-900"><Building className="h-4 w-4" /> {customer.company}</div>}
                            {customer.country && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> {customer.country}</div>}
                            {customer.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.address}</p></div>}
                            {customer.notes && <div className="flex items-start gap-2 text-muted-foreground pt-4 border-t"><StickyNote className="h-4 w-4 mt-1 flex-shrink-0" /> <p className="whitespace-pre-wrap">{customer.notes}</p></div>}
                        </CardContent>
                    </Card>
                     <Card className="border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenu Total Estimé</CardTitle>
                            <Euro className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">¥{(customer.totalRevenue || 0).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Sur {customer.orders?.length || 0} commandes terminées
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Historique des Commandes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.orders && customer.orders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>N° Commande</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Total (CNY)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                                <TableCell>{formatInTimeZone(new Date(order.orderDate), 'UTC', 'dd MMM yyyy')}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                                <TableCell className="text-right">¥{order.totalAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    Aucune commande enregistrée pour ce prospect.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Promouvoir en Compte Client</DialogTitle>
                        <DialogDescription>
                            Cela va créer un accès sécurisé pour <strong>{customer.email}</strong>. Toutes les informations du CRM seront transférées vers son nouvel Espace Client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe initial pour le client</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input 
                                    id="password" 
                                    type="password" 
                                    className="pl-10" 
                                    placeholder="Min. 6 caractères"
                                    value={initialPassword}
                                    onChange={(e) => setInitialPassword(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">Vous devrez communiquer ce mot de passe au client par email ou WhatsApp.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleCreateClientAccount} disabled={isConverting || !initialPassword}>
                            {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Créer l'Espace Client
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
