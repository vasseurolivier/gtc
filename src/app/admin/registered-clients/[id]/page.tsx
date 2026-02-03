
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getRegisteredClientById, 
  updateRegisteredClientStatus, 
  updateRegisteredClientNumber,
  RegisteredClient 
} from '@/actions/registered-clients';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  ShieldCheck, 
  ClipboardList, 
  Receipt, 
  ShoppingCart,
  Eye,
  PlusCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [client, setClient] = useState<RegisteredClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientNumber, setClientNumber] = useState('');

  // Fetch client and their data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getRegisteredClientById(clientId);
      if (data) {
        setClient(data);
        setClientNumber(data.clientNumber || '');
      }
      setIsLoading(false);
    }
    fetchData();
  }, [clientId]);

  // Sourcing Lists Query
  const listsQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return collection(db, 'clients', clientId, 'productLists');
  }, [db, clientId]);
  const { data: productLists } = useCollection(listsQuery);

  // Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'orders'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: orders } = useCollection(ordersQuery);

  // Invoices Query
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !clientId) return null;
    return query(collection(db, 'invoices'), where('customerId', '==', clientId));
  }, [db, clientId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const handleToggleStatus = async () => {
    if (!client) return;
    const newStatus = client.status === 'validated' ? 'pending' : 'validated';
    const result = await updateRegisteredClientStatus(clientId, newStatus);
    if (result.success) {
      setClient({ ...client, status: newStatus });
      toast({ title: result.message });
    }
  };

  const handleUpdateNumber = async () => {
    setIsSaving(true);
    const result = await updateRegisteredClientNumber(clientId, clientNumber);
    if (result.success) {
      toast({ title: "Succès", description: "Numéro client mis à jour." });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!client) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Client introuvable</h2>
        <Button variant="link" asChild><Link href="/admin/registered-clients">Retour à la liste</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/registered-clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux comptes
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {client.status === 'validated' ? (
            <Badge className="bg-green-500">Compte Validé</Badge>
          ) : (
            <Badge variant="outline" className="text-orange-500 border-orange-200">En attente de validation</Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleToggleStatus}>
            {client.status === 'validated' ? 'Suspendre' : 'Valider maintenant'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Client Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Profil Client
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Nom Complet</div>
                <div className="font-semibold text-lg">{client.firstName} {client.lastName}</div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.companyName && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.companyName}</span>
                </div>
              )}
              <div className="pt-4 border-t space-y-3">
                <div className="text-xs text-muted-foreground uppercase font-bold">Numéro Client Officiel</div>
                <div className="flex gap-2">
                  <Input 
                    value={clientNumber} 
                    onChange={(e) => setClientNumber(e.target.value)}
                    placeholder="ex: CL-2024-001"
                    className="h-9"
                  />
                  <Button size="sm" onClick={handleUpdateNumber} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-zinc-400">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-2xl font-bold">{productLists?.length || 0}</div>
                <div className="text-[10px] text-zinc-400">Listes Sourcing</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-2xl font-bold">{orders?.length || 0}</div>
                <div className="text-[10px] text-zinc-400">Commandes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs for Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="lists" className="w-full">
            <TabsList className="bg-white border shadow-sm p-1 h-12 rounded-xl mb-6">
              <TabsTrigger value="lists" className="rounded-lg h-full"><ClipboardList className="h-4 w-4 mr-2" /> Catalogue Sourcing</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg h-full"><ShoppingCart className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg h-full"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
            </TabsList>

            <TabsContent value="lists">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productLists && productLists.length > 0 ? productLists.map((list) => (
                  <Card key={list.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{list.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-1">{list.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground italic">Créé le {format(new Date(list.createdAt), 'dd/MM/yy')}</span>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/client/product-lists/${list.id}`} className="text-primary hover:text-primary/80 font-bold text-xs">
                          Voir les produits <Eye className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full p-12 text-center bg-white rounded-2xl border-2 border-dashed text-muted-foreground">
                    Aucune liste de produits pour ce client.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-6 font-bold">{order.orderNumber}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{order.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Aucune commande.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card className="border-none shadow-md overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="pl-6">N° Facture</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right pr-6">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices && invoices.length > 0 ? invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 font-bold">{inv.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(inv.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={inv.status === 'paid' ? 'bg-green-500' : ''}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-semibold">¥{inv.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Aucune facture.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
