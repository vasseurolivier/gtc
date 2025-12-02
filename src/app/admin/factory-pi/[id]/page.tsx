'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import FactoryPiViewPageContent from './factory-pi-view-page-content';

export default function FactoryPiViewPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <FactoryPiViewPageContent />
        </Suspense>
    )
}
