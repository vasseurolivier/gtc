
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Package, 
  Receipt, 
  Eye, 
  MapPin, 
  FileText,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  ListChecks,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CurrencyContext } from '@/context/currency-context';
import { updateQuoteStatus } from '@/actions/quotes';

export default function ClientOrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const currencyContext = useContext(CurrencyContext);
  const rate = currencyContext?.exchangeRate || 0.13;
  
  const [selectedOrderPreview, setSelectedOrderPreview] = useState<any | null>(null);
  const [isOrderPreviewOpen, setIsOrderPreviewOpen] = useState(false);

  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [isBulkValidating, setIsBulkValidating] = useState(false);
  const [isQuickValidating, setIsQuickValidating] = useState<string | null>(null);

  const parseSafeDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const currencyPreference = profile?.currencyPreference || 'EUR';

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('customerId', '==', user.uid));
  }, [db, user]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'invoices');
  }, [db, user]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const linkedQuotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', user.uid));
  }, [db, user]);
  const { data: linkedQuotes, isLoading: isQuotesLoading } = useCollection(linkedQuotesQuery);

  const unpaidInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled');
  }, [invoices]);

  const validatedQuotes = useMemo(() => {
    if (!linkedQuotes) return [];
    return linkedQuotes.filter((q: any) => q.status === 'accepted');
  }, [linkedQuotes]);

  const totalToPay = useMemo(() => {
    return validatedQuotes.reduce((acc, q) => {
      const qRate = q.exchangeRate || rate;
      
      const qItemsEur = q.items.reduce((sum: number, i: any) => {
        const mEur = Number(i.unitPriceEur || 0);
        return sum + (mEur > 0 ? mEur * i.quantity : (i.unitPrice * i.quantity * qRate));
      }, 0);
      
      const transportEur = (q.transportCost || 0) * qRate;
      const commRate = Number(q.commissionRate || 0);
      
      let commEur = 0;
      if (q.commissionBasis === 'total') {
        commEur = (qItemsEur + transportEur) * (commRate / 100);
      } else {
        commEur = qItemsEur * (commRate / 100);
      }
      
      const qEur = qItemsEur + transportEur + commEur;
      const qCny = qEur / qRate; // On reboucle sur le CNY total contractuel pour la PI
      
      acc.cny += qCny;
      acc.eur += qEur;
      return acc;
    }, { cny: 0, eur: 0 });
  }, [validatedQuotes, rate]);

  const notificationCounts = useMemo(() => ({
    invoices: unpaidInvoices.length,
    quotes: linkedQuotes?.filter((q: any) => q.status === 'sent').length || 0,
  }), [unpaidInvoices, linkedQuotes]);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt ? parseSafeDate(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? parseSafeDate(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders]);

  const sortedQuotes = useMemo(() => {
    if (!linkedQuotes) return [];
    return [...linkedQuotes].sort((a, b) => {
      const isPendingA = (a.status === 'sent') ? 0 : 1;
      const isPendingB = (b.status === 'sent') ? 0 : 1;
      if (isPendingA !== isPendingB) return isPendingA - isPendingB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [linkedQuotes]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      const isPendingA = a.status !== 'paid' ? 0 : 1;
      const isPendingB = a.status !== 'paid' ? 0 : 1;
      if (isPendingA !== isPendingB) return isPendingA - isPendingB;
      return parseSafeDate(b.createdAt).getTime() - parseSafeDate(a.createdAt).getTime();
    });
  }, [invoices]);

  const handleQuickValidate = async (id: string) => {
    setIsQuickValidating(id);
    try {
      const res = await updateQuoteStatus(id, 'accepted');
      if (res.success) {
        toast({ title: "Proforma Validée", description: "La commande est désormais validée." });
      }
    } finally {
      setIsQuickValidating(null);
    }
  };

  const handleBulkValidate = async () => {
    if (selectedQuoteIds.length === 0) return;
    setIsBulkValidating(true);
    try {
      const promises = selectedQuoteIds.map(id => updateQuoteStatus(id, 'accepted'));
      await Promise.all(promises);
      toast({ title: `${selectedQuoteIds.length} devis validés avec succès !` });
      setSelectedQuoteIds([]);
    } finally {
      setIsBulkValidating(false);
    }
  };

  const toggleQuoteSelection = (id: string) => {
    setSelectedQuoteIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-500">Livré</Badge>;
      case 'shipped': return <Badge className="bg-blue-500">Expédié</Badge>;
      case 'validated': return <Badge className="bg-green-600 font-black">VALIDÉ</Badge>;
      case 'processing': return <Badge variant="outline">En cours</Badge>;
      case 'cancelled': return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
        case 'paid': return <Badge className="bg-green-100 text-green-700">PAYÉ</Badge>;
        case 'deposit_paid': return <Badge variant="outline" className="text-blue-600 border-blue-200">ACOMPTE RÉGLÉ</Badge>;
        case 'unpaid': return <Badge variant="outline" className="text-red-500">EN ATTENTE</Badge>;
        default: return <Badge variant="outline">EN ATTENTE</Badge>;
    }
  };

  const renderPrice = (priceCny: number, mainClass = "text-primary font-black", sourceItem?: any, forceSimple = false) => {
    const itemRate = sourceItem?.exchangeRate || rate;
    
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

    if (currencyPreference === 'EUR') return <div className={mainClass}>€{priceEur.toFixed(2)}</div>;
    if (currencyPreference === 'CNY') return <div className={mainClass}>¥{priceCny.toFixed(2)}</div>;
    return (
      <div className="flex flex-col items-end leading-none">
        <div className={mainClass}>€{priceEur.toFixed(2)}</div>
        <div className="text-[10px] text-zinc-400 font-bold">¥{priceCny.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Mes Commandes & Documents</h1>
          <p className="text-zinc-500 mt-2">Gérez vos ordres d'importation et consultez vos pièces comptables.</p>
        </div>
      </div>

      {notificationCounts.invoices > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 text-red-700 animate-in fade-in slide-in-from-top-4 duration-500 ring-2 ring-red-500 ring-offset-2 animate-pulse">
          <div className="h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <p className="font-black uppercase text-xs tracking-widest">Action requise !</p>
            <p className="text-sm font-bold">Vous avez {notificationCounts.invoices} facture(s) en attente de règlement. Veuillez régulariser pour débloquer vos expéditions.</p>
          </div>
          <Button size="sm" variant="destructive" className="font-black" onClick={() => {
            const el = document.querySelector('[data-value="invoices"]');
            if (el instanceof HTMLElement) el.click();
          }}>VOIR LES FACTURES</Button>
        </div>
      )}

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border p-1 rounded-xl h-auto">
          <TabsTrigger value="orders" className="py-2"><Package className="h-4 w-4 mr-2" /> Commandes</TabsTrigger>
          <TabsTrigger value="quotes" className="py-2" data-value="quotes"><FileText className="h-4 w-4 mr-2" /> Proformas</TabsTrigger>
          <TabsTrigger value="invoices" className="py-2" data-value="invoices"><Receipt className="h-4 w-4 mr-2" /> Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isOrdersLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="pl-6">N° Commande</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">Frais Port</TableHead>
                      <TableHead className="text-center">Paiement</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => {
                      const linkedQuote = sortedQuotes.find(q => q.orderId === order.id && q.status === 'sent');
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="pl-6 py-4 font-bold">{order.orderNumber}</TableCell>
                          <TableCell className="text-xs">{order.orderDate ? format(parseSafeDate(order.orderDate), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-center">
                            {order.transportCost >= 0 ? (
                              <div className="inline-flex">
                                {renderPrice(order.transportCost, "font-bold text-blue-600", { exchangeRate: order.exchangeRate }, true)}
                              </div>
                            ) : (
                              <span className="text-zinc-300 italic">En attente</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                          <TableCell className="text-right">{renderPrice(order.totalAmount, "font-black text-zinc-900", order)}</TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              {linkedQuote && (
                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-black h-8 text-[10px] animate-pulse" asChild>
                                  <Link href={`/client/quotes/${linkedQuote.id}`}>VALIDER PI <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedOrderPreview(order); setIsOrderPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune commande.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-4 border-primary bg-zinc-900 text-white overflow-hidden shadow-2xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transfert Global Attendu</p>
                  <p className="text-[8px] text-zinc-500 uppercase mt-1">Cumul de toutes les Proformas validées</p>
                  <div className="mt-2">
                    {currencyPreference === 'EUR' ? (
                      <p className="text-4xl font-black text-white">€{totalToPay.eur.toFixed(2)}</p>
                    ) : currencyPreference === 'CNY' ? (
                      <p className="text-4xl font-black text-white">¥{totalToPay.cny.toFixed(2)}</p>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-white">€{totalToPay.eur.toFixed(2)}</span>
                        <span className="text-sm font-bold text-zinc-400">¥{totalToPay.cny.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                  <Coins className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2 self-end">
              <h3 className="font-bold text-zinc-500 uppercase text-xs tracking-widest flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Sélection multiple pour validation
              </h3>
              {selectedQuoteIds.length > 0 && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                  <span className="text-xs font-black text-primary">{selectedQuoteIds.length} sélectionné(s)</span>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-white font-black h-10 px-8 rounded-xl shadow-lg"
                    onClick={handleBulkValidate}
                    disabled={isBulkValidating}
                  >
                    {isBulkValidating ? <Loader2 className="animate-spin h-4 w-4" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> TOUT VALIDER</>}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isQuotesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedQuotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50">
                      <TableHead className="w-12 pl-6"></TableHead>
                      <TableHead>N° Proforma</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedQuotes.map((q) => (
                      <TableRow key={q.id} className={cn(selectedQuoteIds.includes(q.id) && "bg-primary/5")}>
                        <TableCell className="pl-6">
                          {q.status === 'sent' && (
                            <Checkbox 
                              checked={selectedQuoteIds.includes(q.id)} 
                              onCheckedChange={() => toggleQuoteSelection(q.id)} 
                              className="h-5 w-5 rounded-md border-primary"
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-4 font-bold">{q.quoteNumber}</TableCell>
                        <TableCell className="text-xs">{q.issueDate ? format(parseSafeDate(q.issueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell><Badge variant={q.status === 'accepted' || q.status === 'paid' ? 'default' : q.status === 'rejected' ? 'destructive' : 'outline'}>{q.status}</Badge></TableCell>
                        <TableCell className="text-right">{renderPrice(q.totalAmount, "font-black text-primary", q)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            {q.status === 'sent' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-primary text-primary font-bold h-8 text-[10px] hover:bg-primary hover:text-white"
                                onClick={() => handleQuickValidate(q.id)}
                                disabled={isQuickValidating === q.id}
                              >
                                {isQuickValidating === q.id ? <Loader2 className="animate-spin h-3 w-3" /> : "VALIDATION RAPIDE"}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" asChild><Link href={`/client/quotes/${q.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune proforma.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              {isInvoicesLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : sortedInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50/50"><TableHead className="pl-6">N° Facture</TableHead><TableHead>Émise le</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-6 py-4 font-bold">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">{inv.issueDate ? format(parseSafeDate(inv.issueDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="text-center"><Badge className={inv.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>{inv.status === 'paid' ? 'Acquittée' : 'À régler'}</Badge></TableCell>
                        <TableCell className="text-right">{renderPrice(inv.totalAmount, "font-black text-primary", inv)}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" asChild disabled={inv.status !== 'paid'}>
                            <Link href={`/client/invoices/${inv.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <div className="p-20 text-center text-zinc-400">Aucune facture.</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                <div className="space-y-1"><span className="text-[10px] uppercase font-bold text-zinc-400">Statut</span><div>{getOrderStatusBadge(selectedOrderPreview.status)}</div></div>
                <div className="text-right space-y-1"><span className="text-[10px] uppercase font-bold text-zinc-400">Total</span><div>{renderPrice(selectedOrderPreview.totalAmount, "text-2xl font-black text-primary", selectedOrderPreview)}</div></div>
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
                <div className="space-y-2"><h4 className="font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-zinc-400" /> Paiement</h4><div className="p-4 bg-white border rounded-xl flex items-center gap-3">{getPaymentStatusBadge(selectedOrderPreview.paymentStatus)}</div></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" className="w-full font-bold h-12" onClick={() => setIsOrderPreviewOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
