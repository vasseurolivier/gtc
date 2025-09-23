
import { getProductById, Product } from '@/actions/products';
import { ArrowLeft, Package, Tag, Layers, DollarSign, Warehouse, Weight, Ruler, Anchor, Globe, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export default async function ProductProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
        return (
            <div className="container py-8">
                <div className="mb-8">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/products">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Product not found.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardContent className="p-0">
                           <div className="relative w-full h-80 bg-muted flex items-center justify-center">
                                {product.imageUrl ? (
                                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                ) : (
                                    <Package className="h-24 w-24 text-muted-foreground" />
                                )}
                           </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign /> Pricing & Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Selling Price</span>
                                <span className="font-semibold">¥{product.price.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Purchase Price</span>
                                <span className="font-semibold">{product.purchasePrice ? `¥${product.purchasePrice.toFixed(2)}` : 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stock Quantity</span>
                                <span className="font-semibold">{product.stock} units</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package /> {product.name}</CardTitle>
                             <CardDescription className="flex items-center gap-2 pt-2">
                                <Tag className="h-4 w-4" /> SKU: {product.sku} 
                                {product.category && <> <Separator orientation="vertical" className="h-4 mx-2"/> <Layers className="h-4 w-4"/> Category: {product.category}</>}
                             </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{product.description || "No description provided."}</p>
                            <Separator className="my-6"/>
                             <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Added on {format(new Date(product.createdAt), 'MMMM dd, yyyy')}
                             </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Warehouse /> Logistics & Customs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Weight className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-muted-foreground">Weight</div>
                                    <div className="font-semibold">{product.weight ? `${product.weight} kg` : 'N/A'}</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Ruler className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-muted-foreground">Dimensions (L×W×H)</div>
                                    <div className="font-semibold">{product.length && product.width && product.height ? `${product.length}×${product.width}×${product.height} cm` : 'N/A'}</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Anchor className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-muted-foreground">HS Code</div>
                                    <div className="font-semibold">{product.hsCode || 'N/A'}</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <div className="text-muted-foreground">Country of Origin</div>
                                    <div className="font-semibold">{product.countryOfOrigin || 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    