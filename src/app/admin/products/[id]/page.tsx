'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, updateProduct, Product } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { CurrencyContext } from '@/context/currency-context';
import { Separator } from '@/components/ui/separator';
import { uploadImage } from '@/actions/upload';

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  sku: z.string().min(1, { message: "Le SKU est requis." }),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().default(0),
  purchasePrice: z.coerce.number().nonnegative().optional().default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  category: z.string().optional(),
  weight: z.coerce.number().nonnegative().optional().default(0),
  width: z.coerce.number().nonnegative().optional().default(0),
  height: z.coerce.number().nonnegative().optional().default(0),
  length: z.coerce.number().nonnegative().optional().default(0),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  imageUrl: z.string().optional(),
});

export default function ProductProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const currencyContext = useContext(CurrencyContext);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            sku: "",
            description: "",
            price: 0,
            purchasePrice: 0,
            stock: 0,
            category: "",
            weight: 0,
            width: 0,
            height: 0,
            length: 0,
            hsCode: "",
            countryOfOrigin: "China",
            imageUrl: "",
        },
    });

    const watchImageUrl = form.watch("imageUrl");

    useEffect(() => {
        const auth = sessionStorage.getItem('isAdminAuthenticated');
        if (auth !== 'true') {
            router.push('/admin/login');
            return;
        }

        if (id) {
            getProductById(id).then(product => {
                if (product) {
                    form.reset({
                        ...product,
                        price: product.price || 0,
                        purchasePrice: product.purchasePrice || 0,
                        stock: product.stock || 0,
                        weight: product.weight || 0,
                        width: product.width || 0,
                        height: product.height || 0,
                        length: product.length || 0,
                        imageUrl: product.imageUrl || "",
                    });
                }
            }).finally(() => setIsLoading(false));
        }
    }, [id, router, form]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadImage(formData);
        if (result.success && result.url) {
            form.setValue("imageUrl", result.url);
            toast({ title: 'Image téléchargée' });
        } else {
            toast({ variant: 'destructive', title: 'Échec', description: result.message });
        }
        setIsUploading(false);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const result = await updateProduct(id!, values);
        if (result.success) {
            toast({ title: 'Succès', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Erreur', description: result.message });
        }
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="container py-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="flex justify-between items-center mb-8">
                        <Button variant="ghost" type="button" asChild>
                            <Link href="/admin/products">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour aux produits
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer les modifications
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Détails du Produit</CardTitle>
                                    <CardDescription>Informations de base et description commerciale.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nom du Produit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="sku" render={({ field }) => (
                                            <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Logistique & Douane</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <FormField control={form.control} name="weight" render={({ field }) => (
                                            <FormItem><FormLabel>Poids (kg)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="length" render={({ field }) => (
                                            <FormItem><FormLabel>L (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="width" render={({ field }) => (
                                            <FormItem><FormLabel>W (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="height" render={({ field }) => (
                                            <FormItem><FormLabel>H (cm)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="hsCode" render={({ field }) => (
                                            <FormItem><FormLabel>HS Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (
                                            <FormItem><FormLabel>Pays d'origine</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Visuel</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                    <div className="w-full aspect-square relative rounded-md border border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                        {isUploading ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> : watchImageUrl ? (
                                            <img src={watchImageUrl} alt="Produit" className="object-contain w-full h-full" />
                                        ) : (
                                            <UploadCloud className="h-16 w-16 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="w-full space-y-2">
                                        <Input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploading} className="cursor-pointer" />
                                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">URL Directe</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Prix & Stock</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Prix de vente (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                                        <FormItem><FormLabel>Prix d'achat (CNY)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                                    )} />
                                    <FormField control={form.control} name="stock" render={({ field }) => (
                                        <FormItem><FormLabel>Quantité en stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
