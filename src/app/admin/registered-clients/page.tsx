'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getRegisteredClients, 
  updateRegisteredClientNumber, 
  updateRegisteredClientStatus,
  deleteRegisteredClient,
  RegisteredClient 
} from '@/actions/registered-clients';
import { getOrders, Order } from '@/actions/orders';
import { getCustomers, Customer } from '@/actions/customers';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Search, Eye, Euro, UserPlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';

export default function RegisteredClientsPage() {
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [leads, setLeads] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingSourcingIds, setPendingSourcingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const [isLeadsDialogOpen, setIsLeadsDialogOpen] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const currencyContext = useContext(CurrencyContext);
  const [localRate, setLocalRate] = useState('');

  useEffect(() => {
    if (currencyContext) {
      setLocalRate(currencyContext.exchangeRate.toString());
    }
  }, [currencyContext]);

  const fetchData = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const [clientList, leadList, ords] = await Promise.all([
        getRegisteredClients(),
        getCustomers(),
        getOrders()
      ]);
      
      const sourcingIds = new Set<string>();
      try {
        const q = query(collectionGroup(db, 'products'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        snap.forEach(doc => {
          const data = doc.data();
          if (data && data.clientId && typeof data.clientId === 'string') {
            sourcingIds.add(data.clientId);
          }
        });
      } catch (e) {
        console.warn("Sourcing notifications disabled until index creation");
      }

      const registeredEmails = new Set(clientList.map(c => (c.email || '').toLowerCase()));
      const availableLeads = leadList.filter(l => {
        if (!l.email) return true;
        return !registeredEmails.has(l.email.toLowerCase());
      });

      setClients(clientList || []);
      setLeads(availableLeads || []);
      setOrders(ords || []);
      setPendingSourcingIds(sourcingIds);
      
      const numbers: Record<string, string> = {};
      (clientList || []).forEach(c => {
        numbers[c.id] = c.clientNumber || '';
      });
      setTempNumbers(numbers);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router, db]);

  const handleUpdateNumber = async (id: string) => {
    const newNumber = tempNumbers[id];
    setSavingId(id);
    const result = await updateRegisteredClientNumber(id, newNumber);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      setClients(prev => prev.map(c => c.id === id ? { ...c, clientNumber: newNumber } : c));
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
    setSavingId(null);
  };

  const handleToggleStatus = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'validated' ? 'pending' : 'validated';
    setValidatingId(id);
    const result = await updateRegisteredClientStatus(id, newStatus);
    if (result.success) {
      toast({ title: "Succès", description: result.message });
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
    setValidatingId(null);
  };

  const handleDeleteClient = async (id: string) => {
    const result = await deleteRegisteredClient(id);
    if (result.success) {
      toast({ title: "Supprimé", description: result.message });
      setClients(prev => prev.filter(c => c.id !== id));
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const handleSaveGlobalRate = () => {
    const rateValue = parseFloat(localRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Taux invalide.' });
      return;
    }
    currencyContext?.setExchangeRate(rateValue);
    toast({ title: 'Taux mis à jour' });
  };

  const getPendingOrdersCount = (clientId: string) => {
    return (orders || []).filter(o => o.customerId === clientId && o.status === 'processing').length;
  };

  const hasPendingSourcing = (clientId: string) => {
    return pendingSourcingIds.has(clientId);
  };

  const filteredClients = clients.filter(c => {
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const clientNumber = (c.clientNumber || '').toLowerCase();
    const s = (search || '').toLowerCase();
    return fullName.includes(s) || email.includes(s) || clientNumber.includes(s);
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comptes Clients</h1>
          <p className="text-muted-foreground">Validez les comptes et gérez les dossiers clients.</p>
        </div>
        <Button onClick={() => setIsLeadsDialogOpen(true)} className="bg-primary hover:bg-primary/90 font-bold">
          <UserPlus className="mr-2 h-4 w-4" /> Enregistrer un Prospect (Lead)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" /> TAUX DE CHANGE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                type="number" 
                step="0.0001" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={localRate} 
                onChange={(e) => setLocalRate(e.target.value)}
              />
              <Button onClick={handleSaveGlobalRate}>FIXER</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-400" /> RECHERCHE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="Rechercher par nom, email ou numéro..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Nom / Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Notifications</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const pendingOrdersCount = getPendingOrdersCount(client.id);
                const isPendingSourcing = hasPendingSourcing(client.id);
                const hasAlert = pendingOrdersCount > 0 || client.status === 'pending' || isPendingSourcing;

                return (
                  <TableRow key={client.id} className={cn("hover:bg-muted/30", hasAlert && "bg-red-50/20")}>
                    <TableCell className="font-semibold pl-6">
                      <Link href={`/admin/registered-clients/${client.id}`} className="hover:text-primary">
                        {client.firstName || ''} {client.lastName || ''}
                      </Link>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {pendingOrdersCount > 0 && <Badge className="bg-red-600 text-[10px] w-fit">{pendingOrdersCount} COMMANDE(S)</Badge>}
                        {isPendingSourcing && <Badge className="bg-orange-600 text-[10px] w-fit">SOURCING</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.status === 'validated' ? <Badge className="bg-green-500">Validé</Badge> : <Badge variant="outline">En attente</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={tempNumbers[client.id] || ''} 
                          onChange={(e) => setTempNumbers(prev => ({ ...prev, [client.id]: e.target.value }))}
                          className="h-8 w-24 text-xs"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateNumber(client.id)} disabled={savingId === client.id}>
                          {savingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" asChild><Link href={`/admin/registered-clients/${client.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      <Button size="sm" variant={client.status === 'validated' ? "outline" : "default"} onClick={() => handleToggleStatus(client.id, client.status)} disabled={validatingId === client.id}>
                        {client.status === 'validated' ? 'Suspendre' : 'Valider'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClient(client.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isLeadsDialogOpen} onOpenChange={setIsLeadsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Sélectionner un Prospect</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-bold">{lead.name}</TableCell>
                    <TableCell>{lead.email || "Email manquant"}</TableCell>
                    <TableCell className="text-right"><Button size="sm" asChild><Link href={`/admin/customers/${lead.id}`}>Gérer</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
