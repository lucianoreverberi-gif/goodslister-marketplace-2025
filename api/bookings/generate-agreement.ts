import { sql } from '@vercel/postgres';
import { put, head } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import PDFDocument from 'pdfkit';

const BRAND_COLOR = '#0891b2'; // cyan-600
const GRAY_TEXT = '#4b5563'; // gray-600
const DARK_TEXT = '#111827'; // gray-900

function formatDate(dateStr: string | Date): string {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount: number | string | null | undefined): string {
    const n = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `$${n.toFixed(2)}`;
}

async function generatePdfBuffer(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== HEADER ==========
        doc.fillColor(BRAND_COLOR).fontSize(24).font('Helvetica-Bold').text('GOODSLISTER', { align: 'center' });
        doc.fillColor(GRAY_TEXT).fontSize(10).font('Helvetica').text('Rental Agreement', { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor(BRAND_COLOR).lineWidth(2).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(1);

        // ========== AGREEMENT META ==========
        doc.fillColor(DARK_TEXT).fontSize(11).font('Helvetica-Bold').text(`Agreement ID: ${data.booking.id}`);
        doc.font('Helvetica').text(`Effective Date: ${formatDate(new Date())}`);
        doc.moveDown(1);

        // ========== SECTION 1: PARTIES ==========
        const section = (num: number, title: string) => {
            doc.moveDown(0.8);
            doc.fillColor(BRAND_COLOR).fontSize(13).font('Helvetica-Bold').text(`${num}. ${title}`);
            doc.fillColor(DARK_TEXT).fontSize(10).font('Helvetica').moveDown(0.3);
        };
        const field = (label: string, value: string) => {
            doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
        };

        section(1, 'Parties');
        doc.font('Helvetica-Bold').text('HOST');
        field('Name', data.host.name || 'N/A');
        field('Email', data.host.email || 'N/A');
        field('Identity Verified', data.host.identity_verified ? 'Yes' : 'No');
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('RENTER');
        field('Name', data.renter.name || 'N/A');
        field('Email', data.renter.email || 'N/A');
        field('Identity Verified', data.renter.identity_verified ? 'Yes' : 'No');

        section(2, 'Item Rented');
        field('Title', data.listing.title);
        field('Category', `${data.listing.category}${data.listing.subcategory ? ` / ${data.listing.subcategory}` : ''}`);
        field('Location', `${data.listing.location_city || 'N/A'}, ${data.listing.location_state || 'N/A'}`);

        section(3, 'Rental Period');
        field('Start Date', formatDate(data.booking.start_date));
        field('End Date', formatDate(data.booking.end_date));
        const startDate = new Date(data.booking.start_date);
        const endDate = new Date(data.booking.end_date);
        const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        field('Duration', `${durationDays} day(s)`);

        section(4, 'Financial Terms');
        field('Total Rental Amount', formatCurrency(data.booking.total_price));
        field('Amount Paid Online', formatCurrency(data.booking.amount_paid_online));
        field('Balance Due On Site', formatCurrency(data.booking.balance_due_on_site));
        field('Payment Method', data.booking.payment_method || 'N/A');
        field('Security Deposit (Held on Card)', formatCurrency(data.booking.security_deposit));
        field('Platform Fee', '6% of total (included in Goodslister service)');

        section(5, 'Security Deposit Policy');
        doc.font('Helvetica').fontSize(10).fillColor(GRAY_TEXT).text(
            'The security deposit is authorized (held) on the Renter\'s payment method at booking. It is NOT charged unless damage is reported. The hold is automatically released 72 hours (3 days) after checkout if no damage claim is filed. Bank processing may take an additional 5-10 business days to reflect on the Renter\'s statement.',
            { align: 'justify' }
        );

        section(6, 'Handoff Protocol');
        doc.fillColor(GRAY_TEXT).text(
            'Both Host and Renter must complete the handoff protocol at pickup AND return. This includes: (a) Upload 4-10 photos of the item\'s condition, (b) Confirm receipt/return with a digital signature (checkbox + timestamp + IP address). Failure to complete the handoff protocol may forfeit deposit protection and dispute rights.',
            { align: 'justify' }
        );

        section(7, 'Damage Claims');
        doc.fillColor(GRAY_TEXT).text(
            'The Host must report any damage within 48 hours of checkout via the Goodslister platform, including photos, description, and claim amount (not exceeding the security deposit hold). The Renter is notified via email and has 48 hours to accept or dispute the claim. If accepted (or no response), funds are captured a la Host. If disputed, Goodslister admin reviews all evidence (photos from both parties, signatures, condition notes) and issues a fair, final decision.',
            { align: 'justify' }
        );

        section(8, 'Cancellation');
        doc.fillColor(GRAY_TEXT).text(
            'Cancellation policies are set by the Host and displayed on the listing prior to booking. Eligible refunds are processed automatically via Stripe within 5-10 business days depending on the Renter\'s bank. If the Host cancels a confirmed booking, the Renter receives a full refund automatically.',
            { align: 'justify' }
        );

        section(9, 'Insurance & Liability');
        doc.fillColor(GRAY_TEXT).text(
            'The Host is responsible for maintaining valid insurance on the rental item, particularly for high-value equipment (vehicles, boats, jet skis, RVs, ATVs). The Renter is responsible for damages beyond normal wear and tear. Personal insurance of the Renter may apply. Goodslister LLC is NOT an insurance provider and does not guarantee coverage.',
            { align: 'justify' }
        );

        section(10, 'Governing Law');
        doc.fillColor(GRAY_TEXT).text(
            'This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, USA. Any disputes not resolved through Goodslister\'s admin resolution process shall be subject to the exclusive jurisdiccion of the courts located in Miami-Dade County, Florida.',
            { align: 'justify' }
        );

        section(11, 'Digital Signatures');
        doc.fillColor(DARK_TEXT).font('Helvetica').text('Signatures below confirm acceptance of the terms in this agreement:');
        doc.moveDown(0.8);
        const sigY = doc.y;
        doc.strokeColor(DARK_TEXT).lineWidth(0.5)
            .moveTo(50, sigY + 30).lineTo(270, sigY + 30).stroke()
            .moveTo(310, sigY + 30).lineTo(530, sigY + 30).stroke();
        doc.fontSize(9).fillColor(GRAY_TEXT)
            .text('Host Signature', 50, sigY + 33, { width: 220 })
            .text('Renter Signature', 310, sigY + 33, { width: 220 });
        doc.text(`Name: ${data.host.name || ''}`, 50, sigY + 48, { width: 220 })
           .text(`Name: ${data.renter.name || ''}`, 310, sigY + 48, { width: 220 });
        doc.text('Date: _______________', 50, sigY + 63, { width: 220 })
           .text('Date: _______________', 310, sigY + 63, { width: 220 });

        // ========== DISCLAIMER (bottom) ==========
        doc.moveDown(3);
        doc.strokeColor(GRAY_TEXT).lineWidth(0.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fillColor(GRAY_TEXT).fontSize(8).font('Helvetica-Oblique').text(
            'DISCLAIMER: This is a template rental agreement provided by Goodslister LLC as a convenience for its users. It does not constitute legal advice. For legal counsel specific to your situation, consult a licensed attorney. Goodslister LLC is not a party to this agreement and makes no warranties regarding its enforceability. This agreement was generated automatically based on booking data as of the effective date.',
            { align: 'justify' }
        );
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica').text(
            `Generated by Goodslister on ${formatDate(new Date())} | goodslister.com | support@goodslister.com`,
            { align: 'center' }
        );

        doc.end();
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const bookingId = (req.method === 'POST' ? req.body?.bookingId : req.query?.bookingId) as string;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    try {
        // ========== Fetch booking + listing + host + renter ==========
        const bookingQuery = await sql`
            SELECT * FROM bookings WHERE id = ${bookingId} LIMIT 1
        `;
        if (bookingQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const booking = bookingQuery.rows[0];

        const listingQuery = await sql`
            SELECT * FROM listings WHERE id = ${booking.listing_id} LIMIT 1
        `;
        const listing = listingQuery.rows[0] || {};

        const hostQuery = await sql`
            SELECT id, name, email, identity_verified FROM users WHERE id = ${listing.owner_id} LIMIT 1
        `;
        const host = hostQuery.rows[0] || {};

        const renterQuery = await sql`
            SELECT id, name, email, identity_verified FROM users WHERE id = ${booking.renter_id} LIMIT 1
        `;
        const renter = renterQuery.rows[0] || {};

        // ========== Check Vercel Blob for cached PDF (idempotent) ==========
        const blobPath = `agreements/${bookingId}.pdf`;
        let blobUrl: string | null = null;
        try {
            const existing = await head(blobPath);
            if (existing?.url) blobUrl = existing.url;
        } catch (e) {
            // Not found in Blob â generate below
            blobUrl = null;
        }

        if (!blobUrl) {
            const pdfBuffer = await generatePdfBuffer({ booking, listing, host, renter });
            const uploaded = await put(blobPath, pdfBuffer, {
                access: 'public',
                contentType: 'application/pdf',
                addRandomSuffix: false,
                allowOverwrite: true,
            });
            blobUrl = uploaded.url;
        }

        return res.status(200).json({
            success: true,
            url: blobUrl,
            filename: `Goodslister-Agreement-${bookingId}.pdf`,
        });
    } catch (error: any) {
        console.error('generate-agreement error:', error?.message, error?.stack);
        return res.status(500).json({
            error: 'Failed to generate agreement',
            details: error?.message || 'Unknown error',
        });
    }
}

