'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Loader2, 
  Package, 
  ShoppingCart, 
  MapPin, 
  Plus, 
  Minus, 
  Hash,
  Building2,
  Trash2,
  CheckCircle2,
  Search,
  SortAsc
} from 'lucide-react';
import { useState, useMemo, useEffect, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyContext } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WAREHOUSE_3PL_ADDRESS = "Entrepot GTC china";

export default function ClientCatalogPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const currencyContext = useContext(CurrencyContext);
  const rate = currencyContext?.exchangeRate || 0.13;
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [is3PLSelected, setIs3PLSelected] = useState(false);
  const [orderSuffix, setOrderSuffix] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const [cart, setCart] = useState<any[]>([]);
  const [sourcedProducts, setSourcedProducts] = useState<any[]>([]);
  const [isSourcedLoading, setIsSourcedLoading] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const currencyPreference = profile?.currencyPreference || 'EUR';

  useEffect(() => {
    if (profile?.address && !shippingAddress && !is3PLSelected) {
      setShippingAddress(profile.address);
    }
  }, [profile, shippingAddress, is3PLSelected]);

  const listsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'clients', user.uid, 'productLists');
  }, [db, user]);
  const { data: clientLists } = useCollection(listsQuery);

  useEffect(() => {
    if (!db || !user || !clientLists || clientLists.length === 0) {
      setSourcedProducts([]);
      return;
    }
    async function fetchAllSourced() {
      setIsSourcedLoading(true);
      try {
        const allProducts: any[] = [];
        for (const list of clientLists!) {
          const prodCol = collection(db!, 'clients', user!.uid, 'productLists', list.id, 'products');
          const q = query(prodCol, where('status', '==', 'published'));
          const snap = await getDocs(q);
          snap.forEach(doc => allProducts.push({ ...doc.data(), id: doc.id }));
        }
        setSourcedProducts(allProducts);
      } catch (e) {
        console.error("Catalog fetch error:", e);
      } finally {
        setIsSourcedLoading(false);
      }
    }
    fetchAllSourced();
  }, [db, user, clientLists]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...sourcedProducts];
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.sku?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sku':
          return (a.sku || '').localeCompare(b.sku || '');
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [sourcedProducts, searchTerm, sortBy]);

  const cartTotals = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemTotalCny = item.quantity * item.unitPrice;
      const itemTotalEur = (item.unitPriceEur && item.unitPriceEur > 0)
        ? item.quantity * item.unitPriceEur 
        : itemTotalCny * rate;
      
      acc.cny += itemTotalCny;
      acc.eur += itemTotalEur;
      return acc;
    }, { cny: 0, eur: 0 });
  }, [cart, rate]);

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    const initialPersonalized = product.availability === 'personalized_only';
    setIsPersonalized(initialPersonalized);
    const moq = Number(product.moq || 1);
    setProductQuantity(initialPersonalized ? moq : 1);
    setSelectedSize(null);
    setCurrentImageIdx(0);
    setIsProductDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const moq = Number(selectedProduct.moq || 1);
    if (isPersonalized && productQuantity < moq) {
      toast({ variant: "destructive", title: "Quantité insuffisante", description: `La personnalisation nécessite un minimum de ${moq} unités.` });
      return;
    }
    if (selectedProduct.hasSizeSelection && (selectedProduct.availableSizes?.length > 0) && !selectedSize) {
      toast({ variant: "destructive", title: "Taille requise", description: "Veuillez sélectionner une taille." });
      return;
    }

    const itemKey = `${selectedProduct.id}-${selectedSize || 'no-size'}-${isPersonalized ? 'personalized' : 'standard'}`;
    const existingIdx = cart.findIndex(item => item.key === itemKey);
    
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += productQuantity;
      newCart[existingIdx].total = newCart[existingIdx].quantity * newCart[existingIdx].unitPrice;
      setCart(newCart);
    } else {
      const manualPriceEur = Number(selectedProduct.priceEur || 0);
      const manualPriceCny = Number(selectedProduct.price || 0);
      
      setCart([...cart, {
        key: itemKey,
        id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku || '',
        quantity: productQuantity,
        unitPrice: manualPriceCny,
        unitPriceEur: manualPriceEur,
        total: productQuantity * manualPriceCny,
        photo: selectedProduct.images?.[0] || '',
        size: selectedSize,
        moq: isPersonalized ? moq : 1,
        isPersonalized,
        weight: Number(selectedProduct.weight || 0)
      }]);
    }
    toast({ title: "Produit ajouté au panier" });
    setIsProductDialogOpen(false);
  };

  const updateCartItemQuantity = (key: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.key === key) {
        const minQty = item.isPersonalized ? Number(item.moq || 1) : 1;
        const newQty = Math.max(minQty, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (key: string) => {
    setCart(cart.filter(item => item.key !== key));
  };

  const toggle3PLService = (checked: boolean) => {
    setIs3PLSelected(checked);
    if (checked) {
      setShippingAddress(WAREHOUSE_3PL_ADDRESS);
    } else {
      setShippingAddress(profile?.address || '');
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || cart.length === 0 || !db) return;
    if (!orderSuffix) {
      toast({ variant: "destructive", title: "Champ requis", description: "Veuillez choisir un numéro de commande." });
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const prefix = profile?.orderPrefix || 'ORD';
      const orderNumber = `${prefix}${orderSuffix.toUpperCase()}`;
      
      const orderData = {
        orderNumber,
        customerId: user.uid,
        customerName: `${profile?.firstName} ${profile?.lastName}`,
        items: cart.map(item => ({
          description: item.name + (item.isPersonalized ? " (Personnalisé)" : "") + (item.size ? ` (Taille: ${item.size})` : ''),
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitPriceEur: item.unitPriceEur || 0,
          purchasePrice: 0, 
          total: item.total,
          photo: item.photo,
          size: item.size || null,
          isPersonalized: item.isPersonalized || false,
          weight: item.weight || 0
        })),
        totalAmount: cartTotals.cny,
        status: 'processing' as const,
        shippingAddress,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp() as any,
        paymentStatus: 'unpaid' as any,
      };

      await addDoc(collection(db, 'orders'), orderData);
      toast({ title: "Commande transmise !", description: `Votre commande ${orderNumber} a été envoyée.` });
      setCart([]);
      setOrderSuffix('');
      setIsCartDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de valider la commande." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const renderPrice = (item: any, quantity = 1, mainClass = "text-primary font-black") => {
    const manualEur = Number(item.priceEur || item.unitPriceEur || 0);
    const manualCny = Number(item.price || item.unitPrice || 0);
    
    const finalEur = manualEur > 0 ? manualEur * quantity : (manualCny * quantity * rate);
    const finalCny = manualCny * quantity;

    return (
      <div className="flex flex-col">
        {currencyPreference !== 'CNY' && <div className={mainClass}>€{finalEur.toFixed(2)}</div>}
        {currencyPreference !== 'EUR' && <div className={cn(mainClass, currencyPreference === 'BOTH' && "text-[10px] text-zinc-400 font-bold")}>¥{finalCny.toFixed(2)}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-zinc-900">Mon Catalogue Privé</h1>
          <p className="text-zinc-500 mt-2">Retrouvez ici les produits que nous avons sourcés et validés pour vous.</p>
        </div>
        {cart.length > 0 && (
          <Button className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg" onClick={() => setIsCartDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-5 w-5" /> 
            Panier ({currencyPreference === 'CNY' ? `¥${cartTotals.cny.toFixed(2)}` : `€${cartTotals.eur.toFixed(2)}`})
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Rechercher un produit..." 
            className="pl-11 h-12 shadow-sm bg-white rounded-xl border-zinc-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SortAsc className="h-5 w-5 text-zinc-400 shrink-0" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-12 w-[180px] bg-white rounded-xl border-zinc-200 font-bold text-zinc-700">
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name" className="font-bold">Nom (A-Z)</SelectItem>
              <SelectItem value="price_asc" className="font-bold">Prix croissant</SelectItem>
              <SelectItem value="price_desc" className="font-bold">Prix décroissant</SelectItem>
              <SelectItem value="sku" className="font-bold">SKU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSourcedLoading ? [1,2,3,4].map(i => <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />) : filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((p) => (
            <Card key={p.id} className="border-none shadow-md overflow-hidden bg-white hover:ring-2 hover:ring-primary/50 cursor-pointer relative" onClick={() => handleOpenProduct(p)}>
              {Number(p.moq || 1) > 1 && (p.availability !== 'standard_only') && (
                <Badge className="absolute top-2 right-2 z-10 bg-primary/90 text-[10px] font-black">MOQ PERSO: {p.moq}</Badge>
              )}
              <div className="relative aspect-square bg-zinc-50">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="object-contain p-4 w-full h-full" /> : <Package className="h-12 w-12 mx-auto mt-20 text-zinc-200" />}
              </div>
              <div className="p-4">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">{p.sku}</div>
                <CardTitle className="text-base mt-1 line-clamp-1">{p.name}</CardTitle>
                <div className="mt-2">{renderPrice(p, 1, "text-xl font-black text-primary")}</div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-20 text-center bg-white rounded-2xl border-2 border-dashed">
            <Search className="h-12 w-12 mx-auto text-zinc-200 mb-4 opacity-20" />
            <p className="text-zinc-500">Aucun produit ne correspond à votre recherche.</p>
            <Button variant="link" onClick={() => setSearchTerm('')}>Afficher tout le catalogue</Button>
          </div>
        )}
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails Produit</DialogTitle>
            <DialogDescription>Consultez les spécifications et ajoutez au panier.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="space-y-4">
                <div className="relative aspect-square rounded-2xl border bg-zinc-50 overflow-hidden shadow-inner">
                  {selectedProduct.images?.[currentImageIdx] && <img src={selectedProduct.images[currentImageIdx]} alt="Product" className="object-contain p-4 w-full h-full" />}
                </div>
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProduct.images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setCurrentImageIdx(idx)} className={cn("relative w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all", currentImageIdx === idx ? "border-primary" : "border-transparent opacity-60")}>
                        <img src={img} alt="thumb" className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary/30">REF: {selectedProduct.sku}</Badge>
                    {isPersonalized && Number(selectedProduct.moq || 1) > 1 && (
                      <Badge className="bg-orange-600 text-white font-black text-[10px] animate-pulse">MOQ PERSO: {selectedProduct.moq}</Badge>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-zinc-900">{selectedProduct.name}</h3>
                  <div>
                    {renderPrice(selectedProduct, 1, "text-3xl font-black text-primary")}
                    <span className="text-xs text-zinc-400 font-normal">/ Unité</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {selectedProduct.availability !== 'standard_only' && (
                    <div className="space-y-3">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Type de commande</Label>
                      <RadioGroup 
                        defaultValue={isPersonalized ? "personalized" : "standard"} 
                        onValueChange={(val) => {
                          const isPerso = val === "personalized";
                          setIsPersonalized(isPerso);
                          if (isPerso) setProductQuantity(Math.max(productQuantity, Number(selectedProduct.moq || 1)));
                        }}
                        className="flex gap-4"
                      >
                        <div className={cn("flex-1 p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all", !isPersonalized ? "border-primary bg-primary/5" : "hover:bg-zinc-50")}>
                          <RadioGroupItem value="standard" id="std" className="sr-only" />
                          <Label htmlFor="std" className="flex-grow cursor-pointer font-bold text-sm">Standard</Label>
                          {!isPersonalized && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className={cn("flex-1 p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all", isPersonalized ? "border-primary bg-primary/5" : "hover:bg-zinc-50")}>
                          <RadioGroupItem value="personalized" id="perso" className="sr-only" />
                          <Label htmlFor="perso" className="flex-grow cursor-pointer font-bold text-sm">Personnalisé</Label>
                          {isPersonalized && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {selectedProduct.hasSizeSelection && selectedProduct.availableSizes?.length > 0 && (
                    <div className="space-y-3">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Sélectionner la taille</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.availableSizes.map((size: string) => (
                          <Button 
                            key={size} 
                            variant="outline" 
                            className={cn("h-10 w-12 font-bold", selectedSize === size ? "bg-primary text-white border-primary" : "hover:border-primary")}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose prose-sm text-zinc-600 max-h-40 overflow-y-auto border-y py-4 leading-relaxed">
                  {selectedProduct.description || "Aucune description technique."}
                </div>

                <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-xs uppercase tracking-widest text-zinc-400">Quantité souhaitée</Label>
                    {isPersonalized && <span className="text-[9px] font-bold text-orange-600 uppercase">Min: {selectedProduct.moq}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 w-12 rounded-xl bg-white" onClick={() => setProductQuantity(Math.max(isPersonalized ? Number(selectedProduct.moq || 1) : 1, productQuantity - 1))}><Minus className="h-4 w-4" /></Button>
                    <Input type="number" className="h-12 text-center font-black text-xl bg-white rounded-xl" value={productQuantity} onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)} />
                    <Button variant="outline" className="h-12 w-12 rounded-xl bg-white" onClick={() => setProductQuantity(productQuantity + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
                    <span className="font-bold text-zinc-500 uppercase text-[10px]">Sous-total estimé :</span>
                    {renderPrice(selectedProduct, productQuantity, "text-2xl font-black text-zinc-900")}
                  </div>
                  <Button className="w-full h-14 bg-zinc-950 text-white font-black hover:bg-primary transition-all rounded-xl" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> AJOUTER AU PANIER
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-primary" /> Mon Panier
            </DialogTitle>
            <DialogDescription>Validez votre commande pour lancer la préparation.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="w-20 pl-6">Aperçu</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.key} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="w-12 h-12 rounded-lg border bg-white flex items-center justify-center overflow-hidden shadow-inner">
                          {item.photo ? (
                            <img src={item.photo} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="h-4 w-4 text-zinc-200" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-zinc-900">{item.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.size && <Badge variant="secondary" className="text-[8px] h-4">Taille: {item.size}</Badge>}
                            {item.isPersonalized && <Badge className="bg-orange-100 text-orange-700 text-[8px] h-4 uppercase font-black">PERSO</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCartItemQuantity(item.key, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="font-black min-w-[20px]">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => updateCartItemQuantity(item.key, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderPrice(item, item.quantity, "font-black text-zinc-900")}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.key)} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2 text-zinc-700">
                    <Hash className="h-4 w-4 text-primary" /> Référence de commande (Suffixe)
                  </Label>
                  <div className="flex items-center">
                    <div className="h-10 px-3 bg-zinc-100 border border-r-0 rounded-l-md flex items-center justify-center font-black text-zinc-500">
                      {profile?.orderPrefix || 'ORD'}
                    </div>
                    <Input className="rounded-l-none font-bold uppercase" placeholder="ex: 2024-001" value={orderSuffix} onChange={(e) => setOrderSuffix(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2 text-zinc-700">
                    <MapPin className="h-4 w-4 text-primary" /> Destination
                  </Label>
                  <div 
                    className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all", is3PLSelected ? "border-primary bg-primary/5" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200")}
                    onClick={() => toggle3PLService(!is3PLSelected)}
                  >
                    <Label className="font-black text-xs cursor-pointer flex items-center gap-2"><Building2 className="h-3 w-3" /> Service 3PL (Entrepôt GTC)</Label>
                  </div>
                  <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="h-20 bg-white" placeholder="Adresse complète..." />
                </div>
              </div>

              <Card className="bg-zinc-950 text-white p-6 h-fit rounded-3xl border-none shadow-2xl">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total Articles</span>
                <div className="mt-1">
                  {currencyPreference === 'EUR' ? (
                    <div className="text-3xl font-black text-primary">€{cartTotals.eur.toFixed(2)}</div>
                  ) : currencyPreference === 'CNY' ? (
                    <div className="text-3xl font-black text-primary">¥{cartTotals.cny.toFixed(2)}</div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="text-3xl font-black text-primary">€{cartTotals.eur.toFixed(2)}</div>
                      <div className="text-xs text-zinc-400 font-bold">¥{cartTotals.cny.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-[10px] text-zinc-400 italic">Note : Les frais de transport seront calculés par nos agents après validation du poids total.</p>
                </div>
                <Button className="w-full mt-6 h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={handleConfirmOrder} disabled={isSubmittingOrder || !shippingAddress || cart.length === 0 || !orderSuffix}>
                  {isSubmittingOrder ? <Loader2 className="animate-spin" /> : "VALIDER LA COMMANDE"}
                </Button>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
