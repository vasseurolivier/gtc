
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function PrintButton({ invoiceId }: { invoiceId: string }) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async () => {
        setIsPrinting(true);
        const input = document.getElementById('invoice-preview');

        if (input) {
            try {
                const canvas = await html2canvas(input, {
                    scale: 2, // Augmente la résolution de l'image
                    useCORS: true,
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / pdfWidth;
                const totalPages = Math.ceil(imgHeight / (pdfHeight * ratio));

                for (let i = 0; i < totalPages; i++) {
                    const y = -i * pdfHeight * ratio;
                    pdf.addImage(imgData, 'PNG', 0, y / ratio * pdf.internal.scaleFactor, pdfWidth, imgHeight/ratio);
                    if (i < totalPages - 1) {
                        pdf.addPage();
                    }
                }
                
                pdf.save(`invoice-${invoiceId}.pdf`);

            } catch (error) {
                console.error("Error generating PDF", error);
            }
        }
        
        setIsPrinting(false);
    };

    return (
        <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Printer className="mr-2 h-4 w-4" />
            )}
            Export to PDF
        </Button>
    );
}
