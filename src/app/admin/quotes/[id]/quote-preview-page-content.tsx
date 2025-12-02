'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';

import type { Quote } from '@/actions/quotes';
import { getQuoteById } from '@/actions/quotes';
import type { Customer } from '@/actions/customers';
import { getCustomerById } from '@/actions/customers';
import type { Product } from '@/actions/products';
import { getProducts } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { QuotePreview } from './quote-preview';
import { CompanyInfoContext } from '@/context/company-info-context';


export default function QuotePreviewPageContent() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [data, setData] = useState<{ quote: Quote | null, customer: Customer | null, products: Product[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const companyInfoContext = useContext(CompanyInfoContext);

    useEffect(() => {
        if (!id) return;

        async function getQuoteData(id: string) {
            setIsLoading(true);
            try {
                const quote = await getQuoteById(id);
                if (!quote) {
                    setData({ quote: null, customer: null, products: [] });
                    return;
                }
                const [customer, products] = await Promise.all([
                    getCustomerById(quote.customerId),
                    getProducts()
                ]);
                setData({ quote, customer, products });
            } catch (e) {
                console.error(e);
                setData({ quote: null, customer: null, products: [] });
            } finally {
                setIsLoading(false);
            }
        }

        getQuoteData(id);
    }, [id]);

    if (isLoading || !companyInfoContext?.isCompanyInfoLoaded) {
        return (
            <div className="container py-8">
                <div className="flex h-screen items-center justify-center">
                   <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </div>
        );
    }
    
    if (!data?.quote || !data?.customer) {
        return (
            <div className="container py-8">
                 <div className="mb-8 no-print">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/quotes">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Proforma Invoices
                        </Link>
                    </Button>
                </div>
                <div className="text-center text-muted-foreground py-12">
                    Proforma Invoice not found or customer data is missing.
                </div>
            </div>
        );
    }
    
    const { quote, customer, products } = data;

    return (
      <div className="container py-8 printable-area">
          <div className="flex justify-between items-center mb-8 no-print">
              <Button variant="ghost" asChild>
                  <Link href="/admin/quotes">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Proforma Invoices
                  </Link>
              </Button>
          </div>
          
          <div className="print-header-container">
            <QuotePreview quote={quote} customer={customer} products={products} />
          </div>
      </div>
    );
}
