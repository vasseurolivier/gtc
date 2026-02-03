
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ClipboardList, 
  PlusCircle, 
  Loader2, 
  Search, 
  ArrowRight,
  MoreVertical,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProductListsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'clients', user.uid, 'productLists'),
      orderBy('id', 'desc')
    );
  }, [db, user]);

  const { data: lists, isLoading } = useCollection(listsQuery);

  const handleCreateList = async () => {
    if (!newList.name) return;
    setIsSubmitting(true);
    try {
      const colRef = collection(db, 'clients', user!.uid, 'productLists');
      // Firebase Studio tool logic for ID generation (simplified for client code)
      const listId = `LST-${Date.now()}`;
      await addDoc(colRef, {
        id: listId,
        clientId: user!.uid,
        name: newList.name,
        description: newList.description,
        createdAt: new Date().toISOString(),
      });
      
      toast({ title: "Liste créée", description: "Vous pouvez maintenant y ajouter des produits." });
      setIsDialogOpen(false);
      setNewList({ name: '', description: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Mes Projets de Sourcing</h1>
          <p className="text-zinc-500 mt-1">Créez des listes de produits pour vos futures importations.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6">
              <PlusCircle className="mr-2 h-5 w-5" /> Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle liste</DialogTitle>
              <DialogDescription>Donnez un nom clair à votre projet (ex: Collection Été 2024)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom du projet</label>
                <Input 
                  placeholder="ex: Gamme Ustensiles Cuisine" 
                  value={newList.name}
                  onChange={(e) => setNewList({...newList, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optionnelle)</label>
                <Textarea 
                  placeholder="Détails sur le marché cible, les délais souhaités..." 
                  value={newList.description}
                  onChange={(e) => setNewList({...newList, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateList} disabled={isSubmitting || !newList.name}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Créer la liste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input className="pl-10 bg-white border-zinc-200" placeholder="Rechercher un projet..." />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card key={list.id} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white flex flex-col h-full group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-zinc-400">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="mt-4 text-xl group-hover:text-primary transition-colors">{list.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">{list.description || "Aucune description fournie"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-xs text-zinc-400 mt-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  {list.createdAt ? format(new Date(list.createdAt), 'dd MMMM yyyy', { locale: fr }) : "N/A"}
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto border-t border-zinc-50">
                <Button variant="link" className="p-0 h-auto text-primary font-bold hover:no-underline" asChild>
                  <Link href={`/client/product-lists/${list.id}`}>
                    Gérer les produits <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-zinc-200">
          <div className="max-w-sm mx-auto space-y-4">
            <ClipboardList className="h-16 w-16 mx-auto text-zinc-200" />
            <h3 className="text-xl font-bold text-zinc-900">Aucun projet trouvé</h3>
            <p className="text-zinc-500">Commencez par créer votre première liste pour que nous puissions vous aider dans votre sourcing.</p>
            <Button variant="outline" className="font-bold" onClick={() => setIsDialogOpen(true)}>
              Créer ma première liste
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
