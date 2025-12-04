'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductProfilePage() {
    return (
        <div className="container py-8">
            <div className="mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux produits
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Page en Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        La page de détail du produit est actuellement en cours de maintenance pour corriger un problème technique.
                        Veuillez nous excuser pour la gêne occasionnée.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}