
import { getQuoteById, Quote } from '@/actions/quotes';
import { getCustomerById, Customer } from '@/actions/customers';
import { PrintButton } from './print-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { QuotePreview } from './quote-preview';


async function getQuoteData(id: string): Promise<{ quote: Quote | null, customer: Customer | null }> {
    try {
        const quote = await getQuoteById(id);
        if (!quote) {
            return { quote: null, customer: null };
        }
        const customer = await getCustomerById(quote.customerId);
        return { quote, customer };
    } catch (e) {
        console.error(e);
        return { quote: null, customer: null };
    }
}


export default async function QuotePreviewPage({ params }: { params: { id: string } }) {
    const { quote, customer } = await getQuoteData(params.id);

    if (!quote || !customer) {
        return (
            <div className="container py-8">
                 <div className="mb-8">
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
        <div className="container py-8 bg-background">
             <div className="flex justify-between items-center mb-8 print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/admin/quotes">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Proforma Invoices
                    </Link>
                </Button>
                <PrintButton />
            </div>
            
            <QuotePreview quote={quote} customer={customer} />
        </div>
    );
}
