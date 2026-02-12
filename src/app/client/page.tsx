
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  PlusCircle, 
  Package, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Loader2,
  ShoppingBag,
  Sparkles,
  Receipt,
  CircleAlert
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function ClientDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  // Queries for notifications
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'quotes'), where('customerId', '==', user.uid), where('status', '==', 'sent'));
  }, [db, user]);
  const { data: pendingQuotes } = useCollection(quotesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Look into client subcollection for direct access
    return collection(db, 'clients', user.uid, 'invoices');
  }, [db, user]);
  const { data: clientInvoices } = useCollection(invoicesQuery);

  const unpaidInvoices = useMemo(() => {
    if (!clientInvoices) return [];
    return clientInvoices.filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled');
  }, [clientInvoices]);

  const sourcingProductsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collectionGroup(db, 'products'), where('clientId', '==', user.uid), where('status', '==', 'published'));
  }, [db, user]);
  const { data: publishedProducts } = useCollection(sourcingProductsQuery);

  const notificationCounts = {
    quotes: pendingQuotes?.length || 0,
    invoices: unpaidInvoices?.length || 0,
    sourcing: publishedProducts?.length || 0
  };

  const productListsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'productLists');
  }, [db, user]);

  const { data: lists, isLoading } = useCollection(productListsQuery);

  const recentLists = useMemo(() => {
    if (!lists) return [];
    return [...lists]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [lists]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Bienvenue dans votre espace</h1>
          <p className="text-zinc-500 mt-2">Gérez vos demandes de sourcing et suivez vos projets en temps réel.</p>
        </div>
      </div>

      {notificationCounts.invoices > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-center gap-4 text-red-700 animate-in fade-in slide-in-from-top-4 duration-500 ring-2 ring-red-500 ring-offset-2 animate-pulse">
          <div className="h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0">
            <CircleAlert className="h-6 w-6" />
          </div>
          <div className="flex-grow">
            <p className="font-black uppercase text-xs tracking-widest">Action requise !</p>
            <p className="text-sm font-bold">Vous avez {notificationCounts.invoices} facture(s) en attente de règlement. Veuillez régulariser pour débloquer vos expéditions.</p>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-black whitespace-nowrap" asChild>
            <Link href="/client/orders">VOIR LES FACTURES</Link>
          </Button>
        </div>
      )}

      {/* Quick Actions - Highly Visible with Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Button 
          asChild 
          className="h-32 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border-none shadow-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group relative"
        >
          <Link href="/client/catalog">
            {notificationCounts.quotes > 0 && (
              <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white animate-pulse">
                {notificationCounts.quotes}
              </span>
            )}
            <ShoppingBag className="h-8 w-8 text-primary group-hover:animate-bounce" />
            <span className="text-lg font-black uppercase tracking-tight text-white">Consulter mon Catalogue</span>
          </Link>
        </Button>

        <Button 
          asChild 
          variant="outline"
          className="h-32 rounded-2xl border-2 border-primary bg-white hover:bg-primary/5 text-primary shadow-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group relative"
        >
          <Link href="/client/product-lists">
            {notificationCounts.sourcing > 0 && (
              <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs font-black text-white animate-pulse">
                {notificationCounts.sourcing}
              </span>
            )}
            <Sparkles className="h-8 w-8 group-hover:rotate-12 transition-transform" />
            <span className="text-lg font-black uppercase tracking-tight">Lancer un nouveau sourcing</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Projets actifs</CardTitle>
            <ClipboardList className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lists?.length || 0}</div>
            <p className="text-xs text-zinc-400 mt-1">Dernière mise à jour aujourd'hui</p>
          </CardContent>
        </Card>
        
        <Card className={cn("border-none shadow-md bg-white", notificationCounts.invoices > 0 && "ring-2 ring-red-500 animate-pulse bg-red-50/30")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Factures à régler</CardTitle>
            <Receipt className={cn("h-5 w-5", notificationCounts.invoices > 0 ? "text-red-500" : "text-blue-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", notificationCounts.invoices > 0 && "text-red-600")}>
              {notificationCounts.invoices}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Actions de paiement requises</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">PI à valider</CardTitle>
            <Clock className={cn("h-5 w-5", notificationCounts.quotes > 0 ? "text-orange-500" : "text-zinc-300")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", notificationCounts.quotes > 0 && "text-orange-600")}>
              {notificationCounts.quotes}
            </div>
            <p className="text-xs text-zinc-400 mt-1">En attente de votre signature</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dernières listes de sourcing</CardTitle>
              <CardDescription>Suivi de vos projets récents</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/client/product-lists">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : recentLists && recentLists.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {recentLists.map((list) => (
                  <Link key={list.id} href={`/client/product-lists/${list.id}`} className="block p-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-800">{list.name}</div>
                      <ArrowRight className="h-4 w-4 text-zinc-300" />
                    </div>
                    <div className="text-sm text-zinc-500 mt-1 truncate">{list.description || "Aucune description"}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucune liste de produits active.</p>
                <Button className="mt-4" asChild>
                  <Link href="/client/product-lists">Créer ma première liste</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-32 w-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl">Expertise Terrain à votre service</CardTitle>
            <CardDescription className="text-white/80">Nos agents à Yiwu et Shenzhen analysent vos demandes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm leading-relaxed">
              Dès que vous créez une liste, nous lançons l'audit des fournisseurs et la négociation des tarifs pour vous garantir le meilleur rapport qualité/prix.
            </p>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center gap-2">✓ Devis détaillés sous 24-48h</li>
              <li className="flex items-center gap-2">✓ Photos et vidéos réelles des usines</li>
              <li className="flex items-center gap-2">✓ Protection de vos paiements</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full bg-white text-primary hover:bg-zinc-100 font-bold" asChild>
              <Link href="/client/product-lists">Lancer une recherche <PlusCircle className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
