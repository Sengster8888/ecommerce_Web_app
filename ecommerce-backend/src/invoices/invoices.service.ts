import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async createInvoiceForOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoiceNumber = `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${orderId.toString().padStart(4, '0')}`;

    const invoice = await this.prisma.invoice.upsert({
      where: { orderId: BigInt(orderId) },
      update: {},
      create: {
        invoiceNumber,
        orderId: BigInt(orderId),
        status: 'PAID',
      }
    });

    return invoice;
  }

  async generateInvoicePdf(orderId: number): Promise<PDFKit.PDFDocument> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId: BigInt(orderId) },
      include: {
        order: {
          include: {
            user: true,
            address: true,
            items: true,
            discount: true,
            payments: true,
          }
        }
      }
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found for this order');
    }

    const { order } = invoice;
    const doc = new PDFDocument({ margin: 50 });

    // Company Header
    doc
      .fillColor('#4f46e5')
      .fontSize(24)
      .text('E-COMMERCE STORE', 50, 45)
      .fillColor('#475569')
      .fontSize(10)
      .text('123 Tech Avenue, Phnom Penh, Cambodia', 50, 75)
      .text('Phone: (+855) 12 345 678', 50, 90)
      .text('Email: support@ecommerce.com.kh', 50, 105);

    // Invoice Meta
    doc
      .fillColor('#0f172a')
      .fontSize(20)
      .text('INVOICE', 400, 45, { align: 'right' })
      .fontSize(10)
      .text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
      .text(`Date: ${invoice.issuedAt.toLocaleDateString()}`, 400, 90, { align: 'right' })
      .text(`Status: ${invoice.status}`, 400, 105, { align: 'right' });

    // Customer Details
    doc
      .fontSize(12)
      .fillColor('#0f172a')
      .text('Billed To:', 50, 150)
      .fontSize(10)
      .fillColor('#475569')
      .text(order.address.recipientName, 50, 170)
      .text(order.address.phone, 50, 185)
      .text(`${order.address.streetLine}, ${order.address.commune ? order.address.commune + ', ' : ''}${order.address.city}, ${order.address.province}`, 50, 200, { width: 250 });

    // Table Header
    const tableTop = 260;
    doc
      .fillColor('#1e293b')
      .fontSize(10)
      .text('Item Description', 50, tableTop)
      .text('Unit Price', 300, tableTop, { align: 'right' })
      .text('Qty', 400, tableTop, { align: 'right' })
      .text('Total', 500, tableTop, { align: 'right' });

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor('#cbd5e1')
      .stroke();

    // Table Rows
    let yPosition = tableTop + 25;
    order.items.forEach(item => {
      doc
        .fillColor('#475569')
        .fontSize(10)
        .text(item.productNameSnapshot, 50, yPosition, { width: 240 })
        .text(`$${Number(item.unitPrice).toFixed(2)}`, 300, yPosition, { align: 'right' })
        .text(item.quantity.toString(), 400, yPosition, { align: 'right' })
        .text(`$${Number(item.lineTotal).toFixed(2)}`, 500, yPosition, { align: 'right' });

      yPosition += 25;
    });

    doc
      .moveTo(50, yPosition + 10)
      .lineTo(550, yPosition + 10)
      .strokeColor('#cbd5e1')
      .stroke();

    // Summary
    yPosition += 25;
    doc
      .fillColor('#475569')
      .text('Subtotal:', 400, yPosition, { align: 'right' })
      .text(`$${Number(order.subtotal).toFixed(2)}`, 500, yPosition, { align: 'right' });

    yPosition += 20;
    doc
      .text('Discount:', 400, yPosition, { align: 'right' })
      .text(`-$${Number(order.discountAmount).toFixed(2)}`, 500, yPosition, { align: 'right' });

    yPosition += 20;
    doc
      .text('Shipping:', 400, yPosition, { align: 'right' })
      .text(`$${Number(order.shippingFee).toFixed(2)}`, 500, yPosition, { align: 'right' });

    yPosition += 20;
    doc
      .moveTo(350, yPosition - 5)
      .lineTo(550, yPosition - 5)
      .stroke();

    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .text('Grand Total:', 350, yPosition, { align: 'right' })
      .text(`$${Number(order.totalAmount).toFixed(2)}`, 500, yPosition, { align: 'right' });

    // Footer
    doc
      .fontSize(10)
      .fillColor('#94a3b8')
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

    doc.end();
    return doc;
  }
}
