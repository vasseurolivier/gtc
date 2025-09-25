
import { getQuoteById, Quote } from '@/actions/quotes';
import { getCustomerById, Customer } from '@/actions/customers';
import { getProducts, Product } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { QuotePreview } from './quote-preview';
import { CompanyInfoProvider } from '@/context/company-info-context';
import { CurrencyProvider } from '@/context/currency-context';

async function getQuoteData(id: string): Promise<{ quote: Quote | null, customer: Customer | null, products: Product[] }> {
    try {
        const quote = await getQuoteById(id);
        if (!quote) {
            return { quote: null, customer: null, products: [] };
        }
        const [customer, products] = await Promise.all([
            getCustomerById(quote.customerId),
            getProducts()
        ]);
        return { quote, customer, products };
    } catch (e) {
        console.error(e);
        return { quote: null, customer: null, products: [] };
    }
}


export default async function QuotePreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { quote, customer, products } = await getQuoteData(id);

    if (!quote || !customer) {
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

    return (
      <CompanyInfoProvider>
        <CurrencyProvider>
          <div className="container py-8 bg-background printable-area">
              <div className="flex justify-between items-center mb-8 no-print">
                  <Button variant="ghost" asChild>
                      <Link href="/admin/quotes">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Proforma Invoices
                      </Link>
                  </Button>
                  {/* The PrintButton is client-side and was causing issues here. It is now part of the preview component. */}
              </div>
              
              <QuotePreview quote={quote} customer={customer} products={products} />
          </div>
        </CurrencyProvider>
      </CompanyInfoProvider>
    );
}
