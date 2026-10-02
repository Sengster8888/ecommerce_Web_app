import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async generateAndUploadInvoice(orderId: bigint): Promise<string | null> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          address: true,
          items: true,
          payments: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Generate PDF
      const pdfBuffer = await this.createInvoicePdf(order);

      // Upload to Cloudinary
      const invoiceUrl = await this.uploadToCloudinary(pdfBuffer, `invoice_${order.orderNumber}`);

      // Update Order with the new invoice URL
      await this.prisma.order.update({
        where: { id: orderId },
        data: { invoiceUrl },
      });

      this.logger.log(`Generated and saved invoice for order ${order.orderNumber}`);
      return invoiceUrl;
    } catch (error) {
      this.logger.error(`Failed to generate invoice for order ${orderId}:`, error);
      return null;
    }
  }

  private createInvoicePdf(order: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.fontSize(10).text('Cambodian E-Store', 50, 50);
        doc.text('Phnom Penh, Cambodia', 50, 65);
        doc.moveDown();

        // Order Details
        const customerName = order.address?.recipientName || order.user?.name || 'Customer';
        const dateStr = new Date(order.createdAt).toLocaleDateString();

        doc.fontSize(12).text(`Order Number: ${order.orderNumber}`, 50, 100);
        doc.fontSize(10).text(`Date: ${dateStr}`, 50, 115);
        
        doc.fontSize(12).text('Bill To:', 50, 140);
        doc.fontSize(10).text(customerName, 50, 155);
        doc.text(order.address?.phone || '', 50, 170);
        doc.text(`${order.address?.streetLine || ''}, ${order.address?.city || ''}`, 50, 185);

        // Line Items Table
        let y = 230;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', 50, y);
        doc.text('Qty', 350, y);
        doc.text('Price', 400, y);
        doc.text('Total', 480, y);
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        
        y += 25;
        doc.font('Helvetica');
        for (const item of order.items) {
          doc.text(item.productNameSnapshot, 50, y, { width: 280 });
          doc.text(item.quantity.toString(), 350, y);
          doc.text(`$${Number(item.unitPrice).toFixed(2)}`, 400, y);
          doc.text(`$${Number(item.lineTotal).toFixed(2)}`, 480, y);
          y += 20;
        }

        doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
        y += 15;

        // Totals
        doc.text('Subtotal:', 400, y);
        doc.text(`$${Number(order.subtotal).toFixed(2)}`, 480, y);
        y += 15;
        
        if (Number(order.discountAmount) > 0) {
          doc.text('Discount:', 400, y);
          doc.text(`-$${Number(order.discountAmount).toFixed(2)}`, 480, y);
          y += 15;
        }

        doc.text('Shipping:', 400, y);
        doc.text(`$${Number(order.shippingFee).toFixed(2)}`, 480, y);
        y += 15;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Total:', 400, y);
        doc.text(`$${Number(order.totalAmount).toFixed(2)}`, 480, y);

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, y);
        doc.text(`Status: ${order.status}`, 50, y + 15);

        doc.moveDown(3);
        doc.text('Thank you for your business!', { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ecommerce_invoices',
          public_id: filename,
          resource_type: 'image', // Use image to avoid Cloudinary PDF raw ACL restrictions
          format: 'png', // Cloudinary on free/strict tiers blocks PDF delivery, so rasterize it to PNG instead.
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result.secure_url);
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }
}
