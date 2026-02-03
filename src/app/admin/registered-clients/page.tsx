
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getRegisteredClients, 
  updateRegisteredClientNumber, 
  RegisteredClient 
} from '@/actions/registered-clients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Search, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RegisteredClientsPage() {
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tempNumbers, setTempNumbers] = useState<Record<string, string>>({});
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAdminAuthenticated');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getRegisteredClients();
        setClients(data);
        // Initialize temp numbers
        const numbers: Record<string, string> = {};
        data.forEach(c => {
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
  }, [router]);

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
          <p className="text-muted-foreground">Gérez les utilisateurs inscrits et attribuez-leur des numéros client.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 max-w-md" 
          placeholder="Rechercher par nom, email ou numéro..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">Nom / Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead className="w-[250px]">Numéro Client</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold">
                    {client.firstName} {client.lastName}
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {client.createdAt ? format(new Date(client.createdAt), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Input 
                      placeholder="ex: CL-001" 
                      value={tempNumbers[client.id] || ''} 
                      onChange={(e) => setTempNumbers(prev => ({ ...prev, [client.id]: e.target.value }))}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant={client.clientNumber === tempNumbers[client.id] ? "ghost" : "default"}
                      disabled={savingId === client.id || client.clientNumber === tempNumbers[client.id]}
                      onClick={() => handleUpdateNumber(client.id)}
                    >
                      {savingId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
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
