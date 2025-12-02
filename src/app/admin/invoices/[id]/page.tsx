'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InvoicePreviewPageContent from './invoice-preview-page-content';

export default function InvoicePreviewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <InvoicePreviewPageContent />
        </Suspense>
    );
}
