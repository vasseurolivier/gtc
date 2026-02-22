'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getTodos, 
  addTodo, 
  deleteTodo, 
  updateTodoStatus, 
  Todo, 
  TodoFormValues 
} from '@/actions/todos';
import { getOrders, Order } from '@/actions/orders';
import { getRegisteredClients, RegisteredClient } from '@/actions/registered-clients';
import { getCustomers, Customer } from '@/actions/customers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  User, 
  AlertCircle, 
  Loader2, 
  ShoppingCart,
  ArrowRight,
  ListTodo,
  Calendar as CalendarIcon,
  Filter,
  Eye,
  Info,
  CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [leads, setLeads] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string>('all');

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskPreviewOpen, setIsTaskPreviewOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const [newTodo, setNewTodo] = useState<TodoFormValues>({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    dueDate: '',
    status: 'pending',
    type: 'manual'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [todoList, orderList, clientList, leadList] = await Promise.all([
        getTodos(),
        getOrders(),
        getRegisteredClients(),
        getCustomers()
      ]);
      setTodos(todoList);
      setOrders(orderList);
      setClients(clientList);
      setLeads(leadList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem('isAdminAuthenticated');
    if (auth !== 'true') router.push('/admin/login');
    else fetchData();
  }, [router]);

  // Combine manual todos and automatic order tasks
  const allTasks = useMemo(() => {
    const manualTasks = todos.map(t => ({ ...t, isAuto: false }));
    
    const autoTasks = orders
      .filter(o => o.status === 'processing')
      .map(o => ({
        id: `auto-${o.id}`,
        title: `Commande en attente : ${o.orderNumber}`,
        description: `La commande nécessite une validation ou l'envoi d'une Proforma Invoice (PI) pour démarrer la production.`,
        clientId: o.customerId,
        clientName: o.customerName,
        status: 'pending' as const,
        type: 'auto_order' as const,
        orderId: o.id,
        createdAt: o.createdAt,
        isAuto: true
      }));

    const combined = [...manualTasks, ...autoTasks];
    
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [todos, orders]);

  // Group tasks by client
  const groupedTasks = useMemo(() => {
    const filtered = filterClientId === 'all' 
      ? allTasks 
      : allTasks.filter(t => t.clientId === filterClientId);

    const groups: Record<string, typeof allTasks> = {};
    
    filtered.forEach(task => {
      const key = task.clientId || 'no-client';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [allTasks, filterClientId]);

  const handleCreateTodo = async () => {
    if (!newTodo.title) return;
    setIsAdding(true);
    
    const selectedClient = clients.find(c => c.id === newTodo.clientId) || leads.find(l => l.id === newTodo.clientId);
    const clientName = selectedClient ? ('firstName' in selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : (selectedClient as any).name) : '';

    const res = await addTodo({ ...newTodo, clientName });
    if (res.success) {
      toast({ title: "Tâche ajoutée" });
      setIsDialogOpen(false);
      setNewTodo({ title: '', description: '', clientId: '', clientName: '', dueDate: '', status: 'pending', type: 'manual' });
      fetchData();
    }
    setIsAdding(false);
  };

  const handleToggleStatus = async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    if (task.isAuto) {
      router.push(`/admin/registered-clients/${task.clientId}`);
      return;
    }
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const res = await updateTodoStatus(task.id, newStatus);
    if (res.success) {
      setTodos(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      if (selectedTask?.id === task.id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await deleteTodo(id);
    if (res.success) {
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "Tâche supprimée" });
      if (selectedTask?.id === id) {
        setIsTaskPreviewOpen(false);
      }
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsTaskPreviewOpen(true);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-primary" /> To-Do List
          </h1>
          <p className="text-muted-foreground">Gérez vos tâches manuelles et suivez les urgences opérationnelles.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 h-11">
            <Filter className="h-4 w-4 text-zinc-400" />
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger className="border-none shadow-none w-48 font-bold text-xs h-8">
                <SelectValue placeholder="Filtrer par client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} (Lead)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="h-11 px-6 bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-widest">
            <Plus className="h-4 w-4 mr-2" /> Nouvelle Tâche
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.keys(groupedTasks).length === 0 ? (
          <Card className="border-2 border-dashed p-20 text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Tout est à jour !</p>
          </Card>
        ) : (
          Object.entries(groupedTasks).map(([clientId, tasks]) => {
            const clientName = tasks[0].clientName || 'Tâches Diverses';
            const isLead = leads.some(l => l.id === clientId);
            
            return (
              <div key={clientId} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-zinc-900">
                    {clientName} {isLead && <Badge variant="outline" className="ml-2 text-[8px] font-bold text-orange-500 border-orange-200">LEAD</Badge>}
                  </h3>
                  <div className="h-px bg-zinc-100 flex-grow ml-2"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task: any) => (
                    <Card 
                      key={task.id} 
                      className={cn(
                        "group border-none shadow-sm transition-all hover:shadow-md cursor-pointer",
                        task.isAuto ? "bg-primary/5 border-l-4 border-l-primary" : "bg-white",
                        task.status === 'completed' && "opacity-50 grayscale"
                      )}
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow space-y-2">
                            <div className="flex items-center gap-2">
                              {task.isAuto ? <ShoppingCart className="h-3 w-3 text-primary shrink-0" /> : <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />}
                              <h4 className={cn("font-bold text-sm leading-tight", task.status === 'completed' && "line-through")}>{task.title}</h4>
                            </div>
                            {task.description && <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>}
                            
                            <div className="flex items-center gap-4 pt-2">
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                  <CalendarIcon className="h-3 w-3" />
                                  {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: fr })}
                                </div>
                              )}
                              <div className="text-[10px] text-zinc-300">
                                Ajouté le {format(new Date(task.createdAt), 'dd/MM')}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={(e) => handleToggleStatus(e, task)}
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                task.status === 'completed' 
                                  ? "bg-green-500 text-white" 
                                  : "bg-zinc-100 text-zinc-300 hover:bg-primary/10 hover:text-primary"
                              )}
                            >
                              {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : task.isAuto ? <ArrowRight className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </button>
                            {!task.isAuto && (
                              <button 
                                onClick={(e) => handleDelete(e, task.id)}
                                className="h-8 w-8 rounded-full bg-red-50 text-red-300 hover:text-red-600 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Preview Dialog */}
      <Dialog open={isTaskPreviewOpen} onOpenChange={setIsTaskPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", selectedTask?.isAuto ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-600")}>
                  {selectedTask?.isAuto ? <ShoppingCart className="h-6 w-6" /> : <ListTodo className="h-6 w-6" />}
                </div>
                <DialogTitle className="text-xl font-black">{selectedTask?.title}</DialogTitle>
              </div>
              <Badge variant={selectedTask?.status === 'completed' ? 'default' : 'outline'} className={cn(selectedTask?.status === 'completed' ? "bg-green-500" : "text-zinc-400")}>
                {selectedTask?.status === 'completed' ? "Terminée" : "En cours"}
              </Badge>
            </div>
            <DialogDescription className="pt-2">Détails complets de la mission opérationnelle.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {selectedTask?.clientName && (
              <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border">
                <User className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Client associé</p>
                  <p className="font-bold text-zinc-900">{selectedTask.clientName}</p>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto text-primary font-black text-[10px]" asChild>
                  <Link href={`/admin/${leads.some(l => l.id === selectedTask.clientId) ? 'customers' : 'registered-clients'}/${selectedTask.clientId}`}>
                    VOIR DOSSIER <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Échéance</p>
                  <p className="font-bold text-zinc-900">{selectedTask?.dueDate ? format(new Date(selectedTask.dueDate), 'dd MMMM yyyy', { locale: fr }) : "Aucune"}</p>
                </div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Créée le</p>
                  <p className="font-bold text-zinc-900">{selectedTask?.createdAt ? format(new Date(selectedTask.createdAt), 'dd/MM/yyyy HH:mm') : "-"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2"><Info className="h-3 w-3" /> Description & Notes</Label>
              <div className="p-5 bg-white border rounded-2xl min-h-[120px] text-sm leading-relaxed text-zinc-600 whitespace-pre-wrap">
                {selectedTask?.description || "Aucun détail supplémentaire."}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-zinc-50 -mx-6 -mb-6 p-6 border-t mt-4 flex gap-3">
            {!selectedTask?.isAuto && (
              <Button variant="outline" className="text-red-500 border-red-100 hover:bg-red-50 font-bold" onClick={(e) => handleDelete(e, selectedTask?.id)}>
                Supprimer
              </Button>
            )}
            <DialogClose asChild><Button variant="secondary" className="font-bold">Fermer</Button></DialogClose>
            <Button className={cn("font-bold flex-grow", selectedTask?.status === 'completed' ? "bg-zinc-200 text-zinc-500" : "bg-green-600 hover:bg-green-700")} onClick={(e) => handleToggleStatus(e, selectedTask)}>
              {selectedTask?.status === 'completed' ? "Rétablir" : "Marquer comme terminée"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Nouvelle Tâche
            </DialogTitle>
            <DialogDescription>Ajoutez un rappel pour vous ou liez-le à un client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Titre de la mission</Label>
              <Input 
                placeholder="ex: Vérifier échantillons mug" 
                value={newTodo.title}
                onChange={e => setNewTodo({...newTodo, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Client lié</Label>
              <Select 
                value={newTodo.clientId} 
                onValueChange={val => setNewTodo({...newTodo, clientId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50">COMPTES CLIENTS</div>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  <div className="p-2 text-[10px] font-bold text-zinc-400 uppercase bg-zinc-50 mt-2">PROSPECTS CRM</div>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Date d'échéance</Label>
              <Input 
                type="date"
                value={newTodo.dueDate}
                onChange={e => setNewTodo({...newTodo, dueDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Notes / Détails</Label>
              <Textarea 
                placeholder="Précisions sur la tâche..." 
                value={newTodo.description}
                onChange={e => setNewTodo({...newTodo, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
            <Button onClick={handleCreateTodo} disabled={isAdding || !newTodo.title} className="bg-primary hover:bg-primary/90 font-bold">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer la tâche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
