
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getQuoteById, Quote } from '@/actions/quotes';
import { useUser } from '@/firebase';
import { QuoteClientPreview } from './quote-client-preview';

export default function ClientQuotePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const id = params.id as string;
    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/client/login');
            return;
        }

        if (id && user) {
            getQuoteById(id).then(data => {
                // Security check: ensure the quote belongs to the current client
                if (data && data.customerId === user.uid) {
                    setQuote(data);
                } else {
                    setQuote(null);
                }
                setIsLoading(false);
            });
        }
    }, [id, user, isUserLoading, router]);

    if (isLoading || isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!quote) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-xl font-bold">Proforma introuvable ou accès refusé.</h2>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl py-8">
            <QuoteClientPreview quote={quote} />
        </div>
    );
}
