
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import puppeteer from "puppeteer";
import { format } from "date-fns";

admin.initializeApp();

// Configuration for the PDF layout
const PDF_OPTIONS = {
  HEADER_HEIGHT: "80px",
  FOOTER_HEIGHT: "50px",
  SIDE_MARGIN: "20px",
};

/**
 * Generates the HTML structure for the PDF document.
 * This function creates a template with placeholders for dynamic content.
 * @param {object} data - The dynamic data to inject into the template.
 * @return {string} - The complete HTML string.
 */
const generateHTML = (data: {
  title: string;
  logoUrl: string;
  bodyContent: string;
  copyright: string;
  confidentiality: string;
}): string => {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.title}</title>
        <style>
          /* Global styles for the document */
          body {
            margin: 0;
            padding: 0;
            font-family: sans-serif;
            font-size: 12px;
            color: #333;
          }

          /* Styles applied only when printing */
          @media print {
            /* Ensures the layout is respected in print preview and PDF generation */
            @page {
              /* Define the size of the page */
              size: A4;
              /* Set margins to create space for the fixed header and footer */
              margin: ${PDF_OPTIONS.HEADER_HEIGHT} 0 ${PDF_OPTIONS.FOOTER_HEIGHT} 0;
            }

            header {
              /* Fixed position to make it appear on every page */
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: ${PDF_OPTIONS.HEADER_HEIGHT};
              background-color: #f8f8f8;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 ${PDF_OPTIONS.SIDE_MARGIN};
              box-sizing: border-box;
            }

            footer {
              /* Fixed position for the footer on every page */
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: ${PDF_OPTIONS.FOOTER_HEIGHT};
              background-color: #f8f8f8;
              border-top: 1px solid #e0e0e0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 ${PDF_OPTIONS.SIDE_MARGIN};
              box-sizing: border-box;
            }

            main {
              /* The main content area */
              /* Paddings ensure the content never overlaps with the fixed header/footer */
              padding: 20px ${PDF_OPTIONS.SIDE_MARGIN};
              box-sizing: border-box;
            }
            
            /* Counter for page numbers */
            .page-number::after {
                counter-increment: page;
                content: counter(page);
            }
          }

          /* Specific styles for header elements */
          .header-logo {
            height: 50px;
            object-fit: contain;
          }
          .header-title {
            font-size: 20px;
            font-weight: bold;
          }
          .header-date {
            font-size: 12px;
            color: #666;
          }
          
          /* Specific styles for footer elements */
          .footer-copyright, .footer-confidentiality {
            font-size: 9px;
            color: #777;
          }
          .page-number {
             font-size: 10px;
          }
        </style>
      </head>
      <body>
        <!-- Header: This will be repeated on each page by the print styles -->
        <header>
          <img src="${data.logoUrl}" alt="Logo" class="header-logo" />
          <div class="header-title">${data.title}</div>
          <div class="header-date">${currentDate}</div>
        </header>

        <!-- Footer: This will also be repeated on each page -->
        <footer>
          <div class="footer-copyright">${data.copyright}</div>
          <div class="page-number">Page </div>
          <div class="footer-confidentiality">${data.confidentiality}</div>
        </footer>

        <!-- Main Content: This is the dynamic part of the document -->
        <main>
          ${data.bodyContent}
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
    try {
      // --- 1. Launch Puppeteer ---
      // We launch a headless browser instance.
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();

      // --- 2. Generate HTML Content ---
      // Here, you would typically fetch dynamic data from Firestore or another source.
      // For this example, we use static data.
      const dynamicData = {
        title: "Invoice #12345",
        logoUrl: "https://via.placeholder.com/150x50.png?text=YourLogo",
        // This is a long string of HTML to simulate multi-page content
        bodyContent: `
          <h1>Invoice Details</h1>
          <p>This is the main body of the PDF. It can contain tables, lists, and other HTML elements.</p>
          `.concat("<p>More content... </p>".repeat(100)) + `
          <p>End of content.</p>
        `,
        copyright: "© 2024 Your Company",
        confidentiality: "Confidential",
      };
      const htmlContent = generateHTML(dynamicData);

      // --- 3. Set Content and Generate PDF ---
      // We load our generated HTML into the Puppeteer page.
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // Generate the PDF from the page content.
      // The `printBackground: true` is crucial for styles to apply.
      // The `format: 'A4'` sets the page size.
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        // We don't need to specify margins here as they are handled by `@page` in CSS
      });

      // --- 4. Close the browser ---
      await browser.close();

      // --- 5. Send the PDF as a response ---
      // Set headers to tell the client they are receiving a PDF file.
      response.setHeader("Content-Type", "application/pdf");
      response.setHeader(
        "Content-Disposition",
        "attachment; filename=document.pdf"
      );
      response.status(200).send(pdfBuffer);
    } catch (error) {
      functions.logger.error("PDF generation failed", error);
      response.status(500).send("Error generating PDF.");
    }
  });
