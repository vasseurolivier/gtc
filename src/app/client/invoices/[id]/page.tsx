
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getInvoiceById, Invoice } from '@/actions/invoices';
import { useUser } from '@/firebase';
import { InvoiceClientPreview } from './invoice-client-preview';

export default function ClientInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const id = params.id as string;
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/client/login');
            return;
        }

        if (id && user) {
            getInvoiceById(id).then(data => {
                // Security check: ensure the invoice belongs to the current client
                if (data && data.customerId === user.uid) {
                    setInvoice(data);
                } else {
                    setInvoice(null);
                }
                setIsLoading(false);
            });
        }
    }, [id, user, isUserLoading, router]);

    if (isLoading || isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!invoice) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-xl font-bold">Document introuvable ou accès refusé.</h2>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl py-8">
            <InvoiceClientPreview invoice={invoice} />
        </div>
    );
}
