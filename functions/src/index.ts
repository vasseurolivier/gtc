
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import puppeteer from "puppeteer";
import { format } from "date-fns";
import cors from "cors";

admin.initializeApp();

const corsHandler = cors({ origin: true });

const PDF_OPTIONS = {
  HEADER_HEIGHT: "80px",
  FOOTER_HEIGHT: "50px",
  SIDE_MARGIN: "20px",
};

const generateProformaHTML = (data: any) => {
  const { document, customer, products, companyInfo, currency, exchangeRate } = data;
  const subTotal = document.subTotal;
  const commissionAmount = subTotal * ((document.commissionRate || 0) / 100);
  const downPayment = document.totalAmount * 0.3;
  const remainingBalance = document.totalAmount - downPayment;
  const productsBySku = new Map(products.map((p: any) => [p.sku, p]));

  let itemsHtml = '';
  document.items.forEach((item: any) => {
    const product = item.sku ? productsBySku.get(item.sku) : undefined;
    const imageUrl = product?.imageUrl ? `<img src="${product.imageUrl}" alt="${item.description}" style="width: 64px; height: 64px; object-fit: contain;" />` : '';
    itemsHtml += `
      <tr class="border-b" style="page-break-inside: avoid;">
        <td class="p-2 align-top">${imageUrl}</td>
        <td class="p-2 align-top">
          <p class="font-medium">${item.description}</p>
          ${product?.description ? `<p class="text-xs text-muted-foreground">${product.description}</p>` : ''}
        </td>
        <td class="p-2 align-top text-right">${item.quantity}</td>
        <td class="p-2 align-top text-right">
          <div>¥${item.unitPrice.toFixed(2)}</div>
          <div class="text-xs text-muted-foreground">${currency.symbol}${(item.unitPrice * exchangeRate).toFixed(2)}</div>
        </td>
        <td class="p-2 align-top text-right font-medium">
          <div>¥${(item.quantity * item.unitPrice).toFixed(2)}</div>
          <div class="text-xs text-muted-foreground">${currency.symbol}${((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
        </td>
      </tr>`;
  });
  
  const page1Content = `
    <table class="w-full" style="border-spacing: 0;">
      <thead>
        <tr class="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
          <th class="p-2 font-semibold">Image</th>
          <th class="w-1/2 p-2 font-semibold">Description</th>
          <th class="text-right p-2 font-semibold">Quantité</th>
          <th class="text-right p-2 font-semibold">Prix Unitaire</th>
          <th class="text-right p-2 font-semibold">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="flex justify-end pt-8">
      <div class="w-full md:w-2/3 lg:w-1/2 space-y-2">
        <div class="flex justify-between">
          <span class="text-muted-foreground">Sous-total :</span>
          <span class="font-medium text-right">
            <div>¥${subTotal.toFixed(2)}</div>
            <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(subTotal * exchangeRate).toFixed(2)}</div>
          </span>
        </div>
        ${(document.commissionRate || 0) > 0 ? `
        <div class="flex justify-between">
          <span class="text-muted-foreground">Commission (${document.commissionRate}%) :</span>
          <span class="font-medium text-right">
            <div>¥${commissionAmount.toFixed(2)}</div>
            <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(commissionAmount * exchangeRate).toFixed(2)}</div>
          </span>
        </div>` : ''}
        <div class="flex justify-between">
          <span class="text-muted-foreground">Frais de port :</span>
          <span class="font-medium text-right">
            <div>¥${(document.transportCost || 0).toFixed(2)}</div>
            <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${((document.transportCost || 0) * exchangeRate).toFixed(2)}</div>
          </span>
        </div>
        <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>TOTAL :</span>
          <span class="text-right">
            <div>¥${document.totalAmount.toFixed(2)}</div>
            <div class="text-sm font-normal text-muted-foreground">${currency.symbol}${(document.totalAmount * exchangeRate).toFixed(2)}</div>
          </span>
        </div>
        <div class="flex justify-between mt-4">
          <span class="text-muted-foreground">Acompte à payer :</span>
          <span class="font-medium text-right">
            <div>¥${downPayment.toFixed(2)}</div>
            <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(downPayment * exchangeRate).toFixed(2)}</div>
          </span>
        </div>
        <div class="flex justify-between font-bold">
          <span>Solde restant :</span>
          <span class="text-right">
            <div>¥${remainingBalance.toFixed(2)}</div>
            <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(remainingBalance * exchangeRate).toFixed(2)}</div>
          </span>
        </div>
      </div>
    </div>`;

  const page2Content = `
    <div style="page-break-before: always;">
      <div class="mt-12 text-left border-t pt-4">
        <h3 class="font-semibold mb-2">Coordonnées Bancaires :</h3>
        <div class="text-sm text-muted-foreground space-y-1">
          <p><span class="font-medium">Bank Name:</span> Banking Circle S.A. - German Branch</p>
          <p><span class="font-medium">Account Name:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
          <p><span class="font-medium">Bank Address:</span> Maximilianstraße 54,80538 München, Germany</p>
          <p><span class="font-medium">Payment method:</span> SEPA Inst /SEPA SCT.</p>
          <p><span class="font-medium">IBAN:</span> DE24202208000056168461</p>
          <p><span class="font-medium">SWIFT Code:</span> SXPYDEHH (XXX* If 11 characters are required)</p>
          <p class="mt-2"><span class="font-medium">Payment Message:</span> Please include the following memo/message to receiver when making a payment: [Buyer Name] [Invoice/Contract Number] [Product]</p>
        </div>
      </div>
      <div style="position: absolute; bottom: 80px; left: 20px; right: 20px;">
        <p>Date: ${format(new Date(), 'dd/MM/yyyy')}</p>
        <p>Signature:</p>
        <p style="margin-top: 60px;">Vasseur Olivier</p>
      </div>
    </div>`;
  
  const header = `
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">ÉMIS PAR</h3>
          <p class="font-bold">${companyInfo?.name}</p>
          <p class="whitespace-pre-wrap text-sm">${companyInfo?.address}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">FACTURÉ À</h3>
          <p class="font-bold">${customer?.name}</p>
          ${customer?.company ? `<p>${customer.company}</p>` : ''}
          <p class="whitespace-pre-wrap text-sm">${document.shippingAddress || customer?.address}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">DATE DE LA PROFORMA</h3>
          <p>${format(new Date(document.issueDate), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
          <p>${document.quoteNumber}</p>
        </div>
      </div>`;
  
  return generateDocumentHTML({
    title: 'PROFORMA',
    logoUrl: data.logoUrl,
    docNumber: document.quoteNumber,
    companyInfo: data.companyInfo,
    headerContent: header,
    bodyContent: page1Content + page2Content
  });
};

const generateInvoiceHTML = (data: any) => {
    const { document, customer, order, companyInfo, currency, exchangeRate } = data;
    const balanceDue = document.totalAmount - (document.amountPaid || 0);
    const subTotal = document.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const commissionRate = order?.commissionRate || 0;
    const commissionAmount = subTotal * (commissionRate / 100);
    const transportCost = order?.transportCost || 0;

    let itemsHtml = '';
    document.items.forEach((item: any) => {
        itemsHtml += `
            <tr class="border-b" style="page-break-inside: avoid;">
                <td class="p-2 align-top">
                    <p class="font-medium">${item.description}</p>
                </td>
                <td class="p-2 align-top text-right">${item.quantity}</td>
                <td class="p-2 align-top text-right">
                    <div>¥${item.unitPrice.toFixed(2)}</div>
                    <div class="text-xs text-muted-foreground">${currency.symbol}${(item.unitPrice * exchangeRate).toFixed(2)}</div>
                </td>
                <td class="p-2 align-top text-right font-medium">
                    <div>¥${(item.quantity * item.unitPrice).toFixed(2)}</div>
                    <div class="text-xs text-muted-foreground">${currency.symbol}${((item.quantity * item.unitPrice) * exchangeRate).toFixed(2)}</div>
                </td>
            </tr>`;
    });

    const page1Content = `
        <table class="w-full" style="border-spacing: 0;">
            <thead>
                <tr class="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
                    <th class="w-1/2 p-2 font-semibold">Description</th>
                    <th class="text-right p-2 font-semibold">Quantité</th>
                    <th class="text-right p-2 font-semibold">Prix Unitaire</th>
                    <th class="text-right p-2 font-semibold">Total</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="flex justify-end pt-8">
            <div class="w-full md:w-2/3 lg:w-1/2 space-y-2">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Sous-total :</span>
                    <span class="font-medium text-right">
                        <div>¥${subTotal.toFixed(2)}</div>
                        <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(subTotal * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>
                ${commissionRate > 0 ? `
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Commission (${commissionRate}%) :</span>
                    <span class="font-medium text-right">
                        <div>¥${commissionAmount.toFixed(2)}</div>
                        <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(commissionAmount * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>` : ''}
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Frais de port :</span>
                    <span class="font-medium text-right">
                        <div>¥${transportCost.toFixed(2)}</div>
                        <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(transportCost * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>
                <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>TOTAL :</span>
                    <span class="text-right">
                        <div>¥${document.totalAmount.toFixed(2)}</div>
                        <div class="text-sm font-normal text-muted-foreground">${currency.symbol}${(document.totalAmount * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>
                <div class="flex justify-between mt-4">
                    <span class="text-muted-foreground">Montant Payé :</span>
                    <span class="font-medium text-right">
                        <div>¥${(document.amountPaid || 0).toFixed(2)}</div>
                        <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${((document.amountPaid || 0) * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>
                <div class="flex justify-between font-bold">
                    <span>Solde restant :</span>
                    <span class="text-right">
                        <div>¥${balanceDue.toFixed(2)}</div>
                        <div class="text-xs font-normal text-muted-foreground">${currency.symbol}${(balanceDue * exchangeRate).toFixed(2)}</div>
                    </span>
                </div>
            </div>
        </div>`;
    
    const page2Content = `
    <div style="page-break-before: always;">
      <div class="mt-12 text-left border-t pt-4">
        <h3 class="font-semibold mb-2">Coordonnées Bancaires :</h3>
        <div class="text-sm text-muted-foreground space-y-1">
          <p><span class="font-medium">Bank Name:</span> Banking Circle S.A. - German Branch</p>
          <p><span class="font-medium">Account Name:</span> Yiwu Huanqiu Trading Co., Ltd.</p>
          <p><span class="font-medium">Bank Address:</span> Maximilianstraße 54,80538 München, Germany</p>
          <p><span class="font-medium">Payment method:</span> SEPA Inst /SEPA SCT.</p>
          <p><span class="font-medium">IBAN:</span> DE24202208000056168461</p>
          <p><span class="font-medium">SWIFT Code:</span> SXPYDEHH (XXX* If 11 characters are required)</p>
          <p class="mt-2"><span class="font-medium">Payment Message:</span> Please include the following memo/message to receiver when making a payment: [Buyer Name] [Invoice/Contract Number] [Product]</p>
        </div>
      </div>
      <div style="position: absolute; bottom: 80px; left: 20px; right: 20px;">
        <p>Date: ${format(new Date(), 'dd/MM/yyyy')}</p>
        <p>Signature:</p>
        <p style="margin-top: 60px;">Vasseur Olivier</p>
      </div>
    </div>`;

    const header = `
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">ÉMIS PAR</h3>
          <p class="font-bold">${companyInfo?.name}</p>
          <p class="whitespace-pre-wrap text-sm">${companyInfo?.address}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">FACTURÉ À</h3>
          <p class="font-bold">${customer?.name}</p>
          ${customer?.company ? `<p>${customer.company}</p>` : ''}
          <p class="whitespace-pre-wrap text-sm">${customer?.address}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">DATE DE LA FACTURE</h3>
          <p>${format(new Date(document.issueDate), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
          <p>${document.invoiceNumber}</p>
        </div>
      </div>`;

    return generateDocumentHTML({
        title: 'INVOICE',
        logoUrl: data.logoUrl,
        docNumber: document.invoiceNumber,
        companyInfo: data.companyInfo,
        headerContent: header,
        bodyContent: page1Content + page2Content
    });
};


const generatePackingListHTML = (data: any) => {
    const { document, companyInfo } = data;

    let itemsHtml = '';
    document.items.forEach((item: any) => {
        itemsHtml += `
            <tr class="border-b" style="page-break-inside: avoid;">
                <td class="p-2 align-top">${item.photo ? `<img src="${item.photo}" alt="${item.description}" style="width: 64px; height: 64px; object-fit: contain;" />` : ''}</td>
                <td class="p-2 align-top font-medium">${item.description}</td>
                <td class="p-2 align-top text-right">${item.sku || ''}</td>
                <td class="p-2 align-top text-right">${item.quantity}</td>
                <td class="p-2 align-top text-right">¥${item.unitPriceCny.toFixed(2)}</td>
                <td class="p-2 align-top text-right font-semibold">¥${(item.quantity * item.unitPriceCny).toFixed(2)}</td>
                <td class="p-2 align-top">${item.remarks || ''}</td>
            </tr>`;
    });

    const bodyContent = `
        <table class="w-full" style="border-spacing: 0;">
            <thead>
                <tr class="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
                    <th class="p-2 font-semibold">Image</th>
                    <th class="w-1/2 p-2 font-semibold">Description</th>
                    <th class="p-2 text-right font-semibold">SKU</th>
                    <th class="p-2 text-right font-semibold">Quantity</th>
                    <th class="p-2 text-right font-semibold">Unit Price (CNY)</th>
                    <th class="p-2 text-right font-semibold">Total (CNY)</th>
                    <th class="p-2 font-semibold">Remarks</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>`;

    const header = `
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">ÉMIS PAR</h3>
          <p class="font-bold">${companyInfo?.name}</p>
          <p class="whitespace-pre-wrap text-sm">${companyInfo?.address}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">DATE</h3>
          <p>${format(new Date(document.date), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
          <p>${document.listId}</p>
        </div>
      </div>`;

    return generateDocumentHTML({
        title: 'PACKING LIST',
        logoUrl: data.logoUrl,
        docNumber: document.listId,
        companyInfo,
        headerContent: header,
        bodyContent,
    });
};

const generateFactoryPiHTML = (data: any) => {
    const { document, companyInfo } = data;

    let itemsHtml = '';
    document.items.forEach((item: any) => {
        itemsHtml += `
            <tr class="border-b" style="page-break-inside: avoid;">
                <td class="p-2 align-top">${item.photo ? `<img src="${item.photo}" alt="${item.description}" style="width: 64px; height: 64px; object-fit: contain;" />` : ''}</td>
                <td class="p-2 align-top font-medium">${item.description}</td>
                <td class="p-2 align-top text-right">${item.sku || ''}</td>
                <td class="p-2 align-top text-right">${item.quantity}</td>
                <td class="p-2 align-top text-right">¥${item.unitPriceCny.toFixed(2)}</td>
                <td class="p-2 align-top text-right font-semibold">¥${(item.quantity * item.unitPriceCny).toFixed(2)}</td>
            </tr>`;
    });

    const bodyContent = `
        <table class="w-full" style="border-spacing: 0;">
            <thead>
                <tr class="text-left text-muted-foreground border-b-2 border-t-2 text-sm">
                    <th class="p-2 font-semibold">Image</th>
                    <th class="w-1/2 p-2 font-semibold">Description</th>
                    <th class="p-2 text-right font-semibold">SKU</th>
                    <th class="p-2 text-right font-semibold">Quantity</th>
                    <th class="p-2 text-right font-semibold">Unit Price (CNY)</th>
                    <th class="p-2 text-right font-semibold">Total (CNY)</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
         <div class="mt-8 border-t pt-4">
            <h4 class="font-semibold mb-2">Notes:</h4>
            <p class="text-sm text-muted-foreground whitespace-pre-wrap">${document.notes || ''}</p>
        </div>`;

    const header = `
      <div class="grid grid-cols-2 gap-8 my-8">
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">DATE</h3>
          <p>${format(new Date(document.date), 'dd/MM/yyyy')}</p>
        </div>
        <div>
          <h3 class="font-semibold text-muted-foreground mb-2 text-sm">NUMÉRO DE RÉFÉRENCE</h3>
          <p>${document.piNumber}</p>
        </div>
      </div>`;

    return generateDocumentHTML({
        title: 'PROFORMA INVOICE',
        logoUrl: data.logoUrl,
        docNumber: document.piNumber,
        companyInfo,
        headerContent: header,
        bodyContent,
    });
};


/**
 * Generates the master HTML structure for any PDF document.
 * This function creates a template with placeholders for dynamic content.
 * @param {object} data - The dynamic data to inject into the template.
 * @return {string} - The complete HTML string.
 */
const generateDocumentHTML = (data: {
  title: string;
  docNumber: string;
  logoUrl: string;
  headerContent: string;
  bodyContent: string;
  companyInfo: any;
}): string => {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.title} ${data.docNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            font-family: 'PT Sans', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .font-headline {
             font-family: 'Poppins', sans-serif;
          }
          @page {
            size: A4;
            margin: ${PDF_OPTIONS.HEADER_HEIGHT} 0 ${PDF_OPTIONS.FOOTER_HEIGHT} 0;
          }
          @media print {
            header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: ${PDF_OPTIONS.HEADER_HEIGHT};
              padding: 0 ${PDF_OPTIONS.SIDE_MARGIN};
              /* Background and border for visual separation */
              background-color: #ffffff; 
              border-bottom: 1px solid #e0e0e0;
            }
            footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: ${PDF_OPTIONS.FOOTER_HEIGHT};
              padding: 0 ${PDF_OPTIONS.SIDE_MARGIN};
              /* Background and border */
              background-color: #ffffff;
              border-top: 1px solid #e0e0e0;
            }
            main {
              padding: 20px ${PDF_OPTIONS.SIDE_MARGIN};
            }
            .page-number::after {
                counter-increment: page;
                content: "Page " counter(page);
            }
            .page-break {
              page-break-after: always;
            }
          }
          .text-muted-foreground { color: #64748b; }
          .font-bold { font-weight: 700; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-lg { font-size: 1.125rem; }
          .text-right { text-align: right; }
          .w-full { width: 100%; }
          .p-2 { padding: 0.5rem; }
        </style>
      </head>
      <body>
        <header>
          <div class="flex justify-between items-center h-full">
            <img src="${data.logoUrl}" alt="Logo" style="height: 50px; object-fit: contain;" />
            <div class="text-center">
                <h1 class="text-2xl font-headline font-bold">${data.title}</h1>
                <p class="text-sm text-muted-foreground">#${data.docNumber}</p>
            </div>
            <div class="text-right text-sm text-muted-foreground">${currentDate}</div>
          </div>
        </header>

        <footer>
          <div class="flex justify-between items-center h-full text-xs text-muted-foreground">
             <div>© ${new Date().getFullYear()} ${data.companyInfo.name}</div>
             <div class="page-number"></div>
             <div>Confidential</div>
          </div>
        </footer>

        <main>
          <div class="print-body-content" style="padding-top: 20px; padding-bottom: 20px;">
            ${data.headerContent}
            ${data.bodyContent}
          </div>
        </main>
      </body>
    </html>
  `;
};

/**
 * Firebase Function triggered by an HTTP request to generate a PDF.
 */
export const generatePdf = functions
  .runWith({ timeoutSeconds: 120, memory: "1GB" })
  .https.onRequest(async (request, response) => {
    corsHandler(request, response, async () => {
      try {
        const data = request.body;
        let htmlContent = '';

        switch (data.documentType) {
          case 'PROFORMA':
            htmlContent = generateProformaHTML(data);
            break;
          case 'INVOICE':
            htmlContent = generateInvoiceHTML(data);
            break;
          case 'PACKING_LIST':
              htmlContent = generatePackingListHTML(data);
              break;
          case 'FACTORY_PI':
              htmlContent = generateFactoryPiHTML(data);
              break;
          default:
            throw new Error('Invalid document type');
        }

        const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          headerTemplate: `<div/>`, // Let CSS handle fixed header
          footerTemplate: `<div/>`, // Let CSS handle fixed footer
          displayHeaderFooter: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        await browser.close();

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename=${data.documentType}_${data.document.id}.pdf`
        );
        response.status(200).send(pdfBuffer);

      } catch (error) {
        functions.logger.error("PDF generation failed", error);
        if (error instanceof Error) {
          response.status(500).send(`Error generating PDF: ${error.message}`);
        } else {
          response.status(500).send("Error generating PDF.");
        }
      }
    });
  });
