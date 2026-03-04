'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addOrder, getOrders, deleteOrder, updateOrderStatus, updateOrderPaymentStatus, updateOrderTransportCost, Order, PaymentStatus } from '@/actions/orders';
import { getQuotes, Quote } from '@/actions/quotes';
import { getCustomers, Customer } from '@/actions/customers';
import { getRegisteredClients, RegisteredClient } from '@/actions/registered-clients';
import { Loader2, PlusCircle, Trash2, Eye, Check, Sparkles, Calculator, Package, MapPin, CreditCard, ArrowRight, ShieldCheck, FileText, Coins } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Badge } from '@/components/ui/badge';
import { CurrencyContext } from '@/context/currency-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  quoteId: z.string().min(1, "Please select a proforma invoice."),
});

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOrderOpen, setAddOrderOpen] = useState(false);
  
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<Order | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  const [isUpdatingTransport, setIsUpdatingTransport] = useState<string | null>(null);
  const [transportInputs, setTransportInputs] = useState<Record<string, string>>({});
  
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState(0);
  const [calcRate, setCalcRate] = useState(0);
  const [calcFixed, setCalcFixed] = useState(0);
  const [calcTargetId, setCalcTargetId] = useState<string | null>(null);

  const currencyContext = useContext(CurrencyContext);
  if (!currencyContext) {
    throw new Error("CurrencyContext must be used within a CurrencyProvider");
  }
  const { currency, exchangeRate } = currencyContext;

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quoteId: "",
    },
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }
    async function fetchData() {
      setIsLoading(true);
      try {
        const [fetchedOrders, fetchedQuotes, fetchedCustomers, fetchedRegistered] = await Promise.all([
            getOrders(),
            getQuotes(),
            getCustomers(),
            getRegisteredClients()
        ]);
        setOrders(fetchedOrders);
        setQuotes(fetchedQuotes);
        setCustomers(fetchedCustomers);
        setRegisteredClients(fetchedRegistered);
        
        const inputs: Record<string, string> = {};
        fetchedOrders.forEach(o => {
          inputs[o.id] = (o.transportCost || 0).toString();
        });
        setTransportInputs(inputs);
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data.' });
      } finally { setIsLoading(false); }
    }
    fetchData();
  }, [router, toast]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const selectedQuote = quotes.find(q => q.id === values.quoteId);
    if (!selectedQuote) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected proforma not found.' });
        setIsSubmitting(false);
        return;
    }

    const result = await addOrder(selectedQuote);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      const newOrders = await getOrders();
      setOrders(newOrders);
      setAddOrderOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteOrder = async (id: string) => {
    const result = await deleteOrder(id);
    if (result.success) {
        toast({ title: 'Success', description: result.message });
        setOrders(orders.filter(o => o.id !== id));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };
  
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast({ title: 'Success', description: 'Order status updated.' });
    }
  }

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    const result = await updateOrderPaymentStatus(orderId, newStatus);
    if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o));
        toast({ title: "Succès", description: `Statut de paiement mis à jour.` });
        if (newStatus === 'paid') {
            toast({ title: "Facture générée", description: "La facture finale a été créée." });
        }
    }
  };

  const handleUpdateTransportCost = async (orderId: string) => {
    const rawValue = transportInputs[orderId];
    const cost = rawValue === "" ? 0 : parseFloat(rawValue || '0');
    if (isNaN(cost)) return;

    setIsUpdatingTransport(orderId);
    const result = await updateOrderTransportCost(orderId, cost);
    setIsUpdatingTransport(null);

    if (result.success) {
      toast({ title: "Succès", description: "Frais de transport mis à jour." });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, transportCost: cost, totalAmount: (result.newTotal || o.totalAmount) as number } : o));
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.message });
    }
  };

  const openCalculator = (order: Order) => {
    const totalWeight = order.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
    setCalcWeight(totalWeight);
    setCalcTargetId(order.id);
    
    const client = registeredClients.find(c => c.id === order.customerId);
    if (client) {
      setCalcRate(client.shippingRatePerKg || 0);
      setCalcFixed(client.shippingFixedFee || 0);
    } else {
      setCalcRate(0);
      setCalcFixed(0);
    }
    
    setIsCalcOpen(true);
  };

  const applyCalculatedCost = () => {
    if (!calcTargetId) return;
    const total = (calcWeight * calcRate) + calcFixed;
    setTransportInputs(prev => ({ ...prev, [calcTargetId]: total.toFixed(2) }));
    setIsCalcOpen(false);
    toast({ title: "Calcul appliqué", description: "Cliquez sur l'icône de validation (V) pour enregistrer." });
  };

  const handleNavigateToQuote = (orderId: string) => {
    router.push(`/admin/quotes?fromOrder=${orderId}`);
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
        case 'delivered': return 'default';
        case 'shipped': return 'secondary';
        case 'validated': return 'default'; 
        case 'processing': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'outline';
    }
  }

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
        case 'paid': return <Badge className="bg-green-500 text-[10px] h-5">SOLDE PAYÉ</Badge>;
        case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] h-5">ACOMPTE OK</Badge>;
        case 'unpaid': return <Badge variant="outline" className="text-zinc-400 text-[10px] h-5">NON PAYÉ</Badge>;
        default: return null;
    }
  };

  const renderPrice = (priceCny: number, mainClass = "text-primary font-black", sourceItem?: any, forceSimple = false) => {
    const itemRate = sourceItem?.exchangeRate || exchangeRate;
    
    let priceEur = priceCny * itemRate;
    
    if (!forceSimple && sourceItem?.items) {
      const itemsSubTotalEur = sourceItem.items.reduce((sum: number, item: any) => {
        const manualEur = Number(item.unitPriceEur || 0);
        const lineEur = manualEur > 0 ? manualEur * item.quantity : (item.unitPrice * item.quantity * itemRate);
        return sum + lineEur;
      }, 0);
      
      const transportEur = (sourceItem.transportCost || 0) * itemRate;
      const commissionRateValue = Number(sourceItem.commissionRate || 0);
      
      let commissionEur = 0;
      if (sourceItem.commissionBasis === 'total') {
        commissionEur = (itemsSubTotalEur + transportEur) * (commissionRateValue / 100);
      } else {
        commissionEur = itemsSubTotalEur * (commissionRateValue / 100);
      }
      
      priceEur = itemsSubTotalEur + transportEur + commissionEur;
    } else if (sourceItem?.unitPriceEur !== undefined) {
      const manualEur = Number(sourceItem.unitPriceEur || 0);
      priceEur = manualEur > 0 ? manualEur * (sourceItem.quantity || 1) : (priceCny * itemRate);
    }

    return (
      <div className="flex flex-col items-end leading-none">
        <div className={mainClass}>€{priceEur.toFixed(2)}</div>
        <div className="text-[10px] text-zinc-400 font-bold">¥{priceCny.toFixed(2)}</div>
      </div>
    );
  };

  const ongoingOrders = orders.filter(o => o.status === 'processing' || o.status === 'validated' || o.status === 'shipped');
  const archivedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
  
  const archivedOrdersByCustomer = archivedOrders.reduce((acc, order) => {
    const customerId = order.customerId;
    if (!acc[customerId]) {
      acc[customerId] = [];
    }
    acc[customerId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);


  const renderTable = (orderList: Order[], isArchived = false) => (
    <Table>
      {!isArchived && (
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-center">Frais Port</TableHead>
            <TableHead className="text-center">Paiement</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {orderList.map((order) => {
          const orderCreatedDate = parseSafeDate(order.createdAt);
          const isVeryRecent = (Date.now() - orderCreatedDate.getTime()) < 3600000;
          const isNewNotification = isVeryRecent && !isArchived && order.status === 'processing';
          const isTransportDirty = (transportInputs[order.id] || "0") !== (order.transportCost || 0).toString();
          const linkedQuote = quotes.find(q => q.orderId === order.id);
          const isLocked = linkedQuote && (linkedQuote.status === 'accepted' || linkedQuote.status === 'paid');

          return (
            <TableRow key={order.id} className={cn(isNewNotification && "bg-primary/5")}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">{order.orderNumber}{isNewNotification && <Badge className="bg-red-500 text-[8px] h-4 px-1">NEW</Badge>}{isLocked && <ShieldCheck className="h-3 w-3 text-green-600" />}</div>
              </TableCell>
              <TableCell>
                <Link href={`/admin/registered-clients/${order.customerId}`} className="hover:underline font-semibold">
                  {order.customerName}
                </Link>
              </TableCell>
              <TableCell>{formatInTimeZone(parseSafeDate(order.orderDate), 'UTC', 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Select 
                  onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)} 
                  defaultValue={order.status}
                  disabled={isLocked && order.status !== 'processing'}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <Badge variant={getStatusBadgeVariant(order.status) === 'default' ? 'default' : getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="processing">En cours</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="shipped">Expédié</SelectItem>
                      <SelectItem value="delivered">Livré</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-center">
                {!isArchived && !isLocked ? (
                  <div className="flex items-center justify-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-zinc-400 hover:text-primary"
                      onClick={() => openCalculator(order)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col items-center">
                      <Input 
                        type="number" 
                        className={cn("w-20 h-8 text-xs text-center font-bold", isTransportDirty && "border-primary ring-1 ring-primary")}
                        value={transportInputs[order.id] || ''}
                        onChange={(e) => setTransportInputs({ ...transportInputs, [order.id]: e.target.value })}
                      />
                      {renderPrice(parseFloat(transportInputs[order.id] || '0'), "text-[9px] font-bold text-blue-600", { exchangeRate: order.exchangeRate }, true)}
                    </div>
                    <Button 
                      size="icon" 
                      variant={isTransportDirty ? "default" : "ghost"}
                      className={cn("h-8 w-8 transition-all", isTransportDirty && "bg-primary text-white hover:bg-primary/90")}
                      disabled={isUpdatingTransport === order.id}
                      onClick={() => handleUpdateTransportCost(order.id)}
                    >
                      {isUpdatingTransport === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                  </div>
                ) : (
                  renderPrice(order.transportCost || 0, "text-xs font-bold text-blue-600", { exchangeRate: order.exchangeRate }, true)
                )}
              </TableCell>
              <TableCell className="text-center">
                <Select 
                  defaultValue={order.paymentStatus} 
                  onValueChange={(value: PaymentStatus) => handlePaymentStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-36 h-8 text-[10px] font-bold">
                    {getPaymentBadge(order.paymentStatus)}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Non payé</SelectItem>
                    <SelectItem value="deposit_paid">Acompte payé</SelectItem>
                    <SelectItem value="paid">Total payé</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                  {renderPrice(order.totalAmount, "font-black text-zinc-900", order)}
              </TableCell>
              <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setSelectedOrderPreview(order); setIsOrderPreviewOpen(true); }}
                      title="Aperçu rapide"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status !== 'cancelled' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className={cn("font-bold h-8", !isLocked ? "bg-primary hover:bg-primary/90 text-white" : "bg-zinc-100 text-zinc-400")}
                        onClick={() => handleNavigateToQuote(order.id)}
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        {linkedQuote ? "Gérer PI" : "Générer PI"}
                      </Button>
                    )}
                    {!isLocked && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>
                                  Cette action supprimera définitivement la commande.
                              </AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Dialog open={isAddOrderOpen} onOpenChange={setAddOrderOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Order</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Order from Proforma Invoice</DialogTitle>
                <DialogDescription>
                    Select an accepted proforma invoice to create a new order.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
                 <FormField control={form.control} name="quoteId" render={({ field }) => (
                      <FormItem>
                      <FormLabel>Accepted Proforma Invoice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger>
                            <SelectValue placeholder="Select an accepted proforma" />
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {quotes.filter(q => q.status === 'accepted' || q.status === 'paid').length > 0 ? quotes.filter(q => q.status === 'accepted' || q.status === 'paid').map(q => <SelectItem key={q.id} value={q.id}>
                                {q.quoteNumber} - {q.customerName} - ¥{q.totalAmount.toFixed(2)}
                            </SelectItem>) : <p className="p-4 text-sm text-muted-foreground">No accepted proformas found.</p>}
                          </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Order</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Calculateur de Frais d'Envoi</DialogTitle>
            <DialogDescription>
              Calculez le coût basé sur le poids total de la commande.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Poids Total (kg)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcWeight} 
                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)} 
              />
              <p className="text-[10px] text-muted-foreground italic">* Somme des poids unitaires × quantités</p>
            </div>
            <div className="space-y-2">
              <Label>Tarif fixe par kg (CNY)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcRate} 
                onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Frais fixes de dossier/palette (CNY)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={calcFixed} 
                onChange={(e) => setCalcFixed(parseFloat(e.target.value) || 0)} 
              />
            </div>
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Total calculé :</span>
                <span className="text-xl text-primary">¥{((calcWeight * calcRate) + calcFixed).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalcOpen(false)}>Annuler</Button>
            <Button onClick={applyCalculatedCost}>Appliquer le montant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderPreviewOpen} onOpenChange={setIsOrderPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Détails Commande {selectedOrderPreview?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrderPreview && (
            <div className="space-y-8 py-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Statut</span>
                  <div><Badge variant={getStatusBadgeVariant(selectedOrderPreview.status) === 'default' ? 'default' : getStatusBadgeVariant(selectedOrderPreview.status)}>{selectedOrderPreview.status}</Badge></div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Total</span>
                  <div>{renderPrice(selectedOrderPreview.totalAmount, "text-2xl font-black text-primary", selectedOrderPreview)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Package className="h-4 w-4 text-zinc-400" /> Articles</h4>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="w-16">Photo</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrderPreview.items?.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="py-2">
                            <div className="w-10 h-10 rounded border bg-zinc-50 flex items-center justify-center overflow-hidden">
                              {item.photo ? (
                                <img src={item.photo} alt="Produit" className="w-full h-full object-contain" />
                              ) : (
                                <Package className="h-4 w-4 text-zinc-300" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="font-medium text-sm">{item.description}</div>
                            {item.sku && <div className="text-[10px] text-zinc-400 font-mono">{item.sku}</div>}
                          </TableCell>
                          <TableCell className="py-2 text-center font-bold">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right">{renderPrice(item.total, "font-bold text-zinc-900", { ...item, exchangeRate: selectedOrderPreview.exchangeRate })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><h4 className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-400" /> Livraison</h4><div className="p-4 bg-white border rounded-xl text-sm min-h-[80px] whitespace-pre-wrap">{selectedOrderPreview.shippingAddress}</div></div>
                <div className="space-y-2"><h4 className="font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-zinc-400" /> Paiement</h4><div className="p-4 bg-white border rounded-xl flex items-center gap-3">{getPaymentBadge(selectedOrderPreview.paymentStatus)}</div></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" className="w-full font-bold h-12" onClick={() => setIsOrderPreviewOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

       <Tabs defaultValue="ongoing">
        <TabsList className="mb-4">
            <TabsTrigger value="ongoing">En cours</TabsTrigger>
            <TabsTrigger value="archived">Archivés</TabsTrigger>
        </TabsList>
        <Card>
            <CardContent className="p-0">
            <TabsContent value="ongoing">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                ) : ongoingOrders.length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune commande en cours.</p>
                    </div>
                ) : (
                    renderTable(ongoingOrders)
                )}
            </TabsContent>
            <TabsContent value="archived">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
                ) : Object.keys(archivedOrdersByCustomer).length === 0 ? (
                    <div className="text-center p-16 text-muted-foreground">
                        <p>Aucune commande archivée.</p>
                    </div>
                ) : (
                   <Accordion type="multiple" className="w-full">
                      {Object.entries(archivedOrdersByCustomer).map(([customerId, customerOrders]) => {
                        const regClient = registeredClients.find(c => c.id === customerId);
                        const lead = customers.find(c => c.id === customerId);
                        
                        const displayName = regClient 
                          ? `${regClient.firstName} ${regClient.lastName} ${regClient.clientNumber ? `(${regClient.clientNumber})` : ''}`
                          : (lead?.name || 'Client inconnu');

                        return (
                          <AccordionItem value={customerId} key={customerId}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                              <div className='flex justify-between w-full pr-4'>
                                <span>{displayName}</span>
                                <span className='text-muted-foreground'>{customerOrders.length} document(s)</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderTable(customerOrders, true)}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                )}
            </TabsContent>
            </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}