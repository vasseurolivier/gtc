
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getRegisteredClients, 
  updateRegisteredClientNumber, 
  updateRegisteredClientStatus,
  RegisteredClient 
} from '@/actions/registered-clients';
import { getOrders, Order } from '@/actions/orders';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Search, Eye, ShoppingCart, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function RegisteredClientsPage() {
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingSourcingIds, setPendingSourcingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const [clientList, ords] = await Promise.all([
          getRegisteredClients(),
          getOrders()
        ]);
        
        const sourcingIds = new Set<string>();
        try {
          const q = query(collectionGroup(db, 'products'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          snap.forEach(doc => {
            const data = doc.data();
            if (data.clientId) sourcingIds.add(data.clientId);
          });
        } catch (e) {
          console.error("Sourcing notification error:", e);
        }

        setClients(clientList);
        setOrders(ords);
        setPendingSourcingIds(sourcingIds);
        
        const numbers: Record<string, string> = {};
        clientList.forEach(c => {
          numbers[c.id] = c.clientNumber || '';
        });
        setTempNumbers(numbers);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
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

  const getPendingOrdersCount = (clientId: string) => {
    return orders.filter(o => o.customerId === clientId && o.status === 'processing').length;
  };

  const hasPendingSourcing = (clientId: string) => {
    return pendingSourcingIds.has(clientId);
  };

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.clientNumber?.toLowerCase().includes(search.toLowerCase())
  );

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
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 max-w-md bg-white" 
          placeholder="Rechercher par nom, email ou numéro..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] pl-6">Nom / Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Notifications</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[200px]">Numéro Client</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? filteredClients.map((client) => {
                const pendingOrders = getPendingOrdersCount(client.id);
                const isPendingSourcing = hasPendingSourcing(client.id);
                const hasAlert = pendingOrders > 0 || client.status === 'pending' || isPendingSourcing;

                return (
                  <TableRow key={client.id} className={cn("hover:bg-muted/30", hasAlert && "bg-red-50/20")}>
                    <TableCell className="font-semibold pl-6">
                      <Link href={`/admin/registered-clients/${client.id}`} className="hover:text-primary transition-colors flex flex-col">
                        <span className="flex items-center gap-2">
                          {client.firstName} {client.lastName}
                          {hasAlert && <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Inscrit le {client.createdAt ? format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {pendingOrders > 0 && (
                          <Badge className="bg-red-600 animate-pulse flex gap-1 text-[10px] w-fit">
                            <ShoppingCart className="h-3 w-3" />
                            {pendingOrders} COMMANDE(S)
                          </Badge>
                        )}
                        {isPendingSourcing && (
                          <Badge className="bg-orange-600 animate-pulse flex gap-1 text-[10px] w-fit">
                            <ClipboardList className="h-3 w-3" />
                            SOURCING EN ATTENTE
                          </Badge>
                        )}
                        {client.status === 'pending' && (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px] w-fit uppercase font-black">
                            Nouveau Compte
                          </Badge>
                        )}
                        {!hasAlert && <span className="text-xs text-zinc-300 italic">Aucune</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.status === 'validated' ? (
                        <Badge className="bg-green-500">Validé</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="ex: CL-001" 
                          value={tempNumbers[client.id] || ''} 
                          onChange={(e) => setTempNumbers(prev => ({ ...prev, [client.id]: e.target.value }))}
                          className="h-8 text-xs"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={savingId === client.id || client.clientNumber === tempNumbers[client.id]}
                          onClick={() => handleUpdateNumber(client.id)}
                        >
                          {savingId === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" asChild title="Voir dossier">
                        <Link href={`/admin/registered-clients/${client.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant={client.status === 'validated' ? "outline" : "default"}
                        disabled={validatingId === client.id}
                        onClick={() => handleToggleStatus(client.id, client.status)}
                        className="min-w-[100px]"
                      >
                        {validatingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : client.status === 'validated' ? (
                          <>Suspendre</>
                        ) : (
                          <>Valider</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Aucun compte client trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
