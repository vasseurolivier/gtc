
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getInvoiceById, Invoice } from '@/actions/invoices';
import { useUser } from '@/firebase';
import { InvoiceClientPreview } from './invoice-client-preview';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ClientInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const id = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessError, setAccessError] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/client/login');
            return;
        }

        if (id && user) {
            getInvoiceById(id).then(data => {
                // Security check: ensure the invoice belongs to the current client AND is paid
                if (data && data.customerId === user.uid && data.status === 'paid') {
                    setInvoice(data);
                    setAccessError(false);
                } else {
                    setInvoice(null);
                    setAccessError(true);
                }
                setIsLoading(false);
            });
        }
    }, [id, user, isUserLoading, router]);

    if (isLoading || isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (accessError || !invoice) {
        return (
            <div className="container py-20 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-zinc-900">Document inaccessible</h2>
                    <p className="text-zinc-500 max-w-md mx-auto">
                        Cette facture n'est pas encore disponible ou vous n'avez pas l'autorisation de la consulter. 
                        Les factures ne sont visibles qu'une fois le paiement intégralement validé par nos services.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/client/orders">Retour à mes commandes</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl py-8">
            <InvoiceClientPreview invoice={invoice} />
        </div>
    );
}
