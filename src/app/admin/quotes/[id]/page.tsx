'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import QuotePreviewPageContent from './quote-preview-page-content';

export default function QuotePreviewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <QuotePreviewPageContent />
        </Suspense>
    );
}
