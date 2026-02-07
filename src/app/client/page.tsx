
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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

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
    return query(collection(db, 'clients', user.uid, 'invoices'), where('status', '==', 'unpaid'));
  }, [db, user]);
  const { data: unpaidInvoices } = useCollection(invoicesQuery);

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

      {/* Quick Actions - Highly Visible with Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Button 
          asChild 
          className="h-32 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border-none shadow-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group relative"
        >
          <Link href="/client/orders">
            {(notificationCounts.quotes > 0 || notificationCounts.invoices > 0) && (
              <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white animate-pulse">
                {notificationCounts.quotes + notificationCounts.invoices}
              </span>
            )}
            <ShoppingBag className="h-8 w-8 text-primary group-hover:animate-bounce" />
            <span className="text-lg font-black uppercase tracking-tight text-white">Passer une nouvelle commande</span>
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
            <span className="text-lg font-black uppercase tracking-tight">Sourcer un nouveau produit</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Listes actives</CardTitle>
            <ClipboardList className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lists?.length || 0}</div>
            <p className="text-xs text-zinc-400 mt-1">Dernière mise à jour aujourd'hui</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Factures en attente</CardTitle>
            <Receipt className={cn("h-5 w-5", notificationCounts.invoices > 0 ? "text-red-500" : "text-blue-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", notificationCounts.invoices > 0 && "text-red-600")}>
              {notificationCounts.invoices}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Documents à régler</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Proformas à valider</CardTitle>
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
              <CardTitle className="text-lg">Vos dernières listes</CardTitle>
              <CardDescription>Consultez et modifiez vos projets récents</CardDescription>
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
                <p>Vous n'avez pas encore de liste de produits.</p>
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
            <CardTitle className="text-xl">Besoin d'aide pour votre sourcing ?</CardTitle>
            <CardDescription className="text-white/80">Nos experts en Chine sont là pour vous accompagner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-sm leading-relaxed">
              Dès que vous créez une liste, notre équipe reçoit une notification pour commencer à analyser la faisabilité et rechercher les meilleurs fournisseurs pour vous.
            </p>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center gap-2">✓ Analyse de prix sous 48h</li>
              <li className="flex items-center gap-2">✓ Audit usine sur demande</li>
              <li className="flex items-center gap-2">✓ Consolidation d'échantillons</li>
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
