import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import PDFDocument from 'pdfkit';
import { User } from '../schemas/user.schema';
import { Company } from '../schemas/company.schema';
import { AiUsageService } from '../modules/billing/ai-usage.service';
import { JwtUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AiUsageReportService {
  private readonly logger = new Logger(AiUsageReportService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly aiUsageService: AiUsageService,
  ) {}

  async generateAiUsagePdf(
    user: JwtUser,
    options?: { period?: 'current' | 'previous'; startDate?: string; endDate?: string },
  ): Promise<Buffer> {
    const userDoc = await this.userModel.findById(user.sub);
    if (!userDoc) throw new NotFoundException('User profile not found.');

    const status = await this.aiUsageService.getQuotaStatus(user);

    let start = options?.startDate ? new Date(options.startDate) : undefined;
    let end = options?.endDate ? new Date(options.endDate) : undefined;

    if (!start && options?.period === 'previous') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    }

    const history = await this.aiUsageService.getUsageHistory(user, {
      startDate: start,
      endDate: end,
      limit: 200,
    });

    const totalInputTokens = history.reduce((sum, h) => sum + (h.inputTokens || 0), 0);
    const totalOutputTokens = history.reduce((sum, h) => sum + (h.outputTokens || 0), 0);
    const totalTokens = totalInputTokens + totalOutputTokens;

    const reportDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Clean White/Navy Professional Background matching template
      doc.rect(0, 0, pageWidth, doc.page.height).fill('#FFFFFF');

      // 1. Header Section: Devotopia Brand Logo Box (Left) & Corporate Contact Info (Right)
      // Logo Square Badge
      doc.roundedRect(margin, 35, 42, 42, 6).fill('#080B12');
      doc.fillColor('#8E1616').fontSize(24).font('Helvetica-Bold').text('D.', margin + 9, 43);

      // Devotopia Brand Name next to Logo
      doc.fillColor('#080B12').fontSize(16).font('Helvetica-Bold').text('DEVOTOPIA', margin + 50, 42);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('CAREER INTELLIGENCE PLATFORM', margin + 50, 60);

      // Contact Metadata Right Aligned
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica')
         .text('Cairo, Egypt  |  support@devotopia.dev', margin, 42, { align: 'right', width: contentWidth })
         .text('WWW.DEVOTOPIA.DEV  |  +20 100 000 0000', margin, 56, { align: 'right', width: contentWidth });

      // Dark Solid Divider Line under Header
      doc.moveTo(margin, 90).lineTo(pageWidth - margin, 90).strokeColor('#080B12').lineWidth(3).stroke();

      // 2. Main Title (Centered)
      doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold')
         .text('Detailed AI Usage & Billing Statement', margin, 120, { align: 'center', width: contentWidth });

      // 3. Platform & Company Name Section
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('DEVOTOPIA GLOBAL TECHNOLOGIES', margin, 160);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('SmartRoadmap AI Metering & Entitlement Engine', margin, 174);

      doc.moveTo(margin, 192).lineTo(pageWidth - margin, 192).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      // 4. Bill To & Account Verification Metadata
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`Bill To: ${userDoc.name},  ${userDoc.email}`, margin, 206);
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Statement Date: ${reportDate}`, margin, 222);
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Subscription Tier: ${(userDoc.plan || 'Learner Pro').toUpperCase()} (Allocated: ${status.allocatedCredits} Credits)`, margin, 236);

      // Verified Pro Account Badge Box
      doc.roundedRect(pageWidth - margin - 170, 202, 170, 38, 6).fill('#F0FDF4').strokeColor('#BBF7D0').lineWidth(1).stroke();
      doc.fillColor('#15803D').fontSize(9).font('Helvetica-Bold').text('V VERIFIED PRO CANDIDATE', pageWidth - margin - 160, 210);
      doc.fillColor('#166534').fontSize(7.5).font('Helvetica').text('V DEVOTOPIA VERIFIED TALENT SEAL', pageWidth - margin - 160, 224);

      doc.moveTo(margin, 255).lineTo(pageWidth - margin, 255).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      // 5. Summary of Charges / AI Usage Table
      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Summary of AI Quota & Charges', margin, 275);

      let tableY = 295;
      const col1 = margin;
      const col2 = margin + 80;
      const col3 = margin + 270;
      const col4 = margin + 340;
      const col5 = margin + 420;

      // Table Header Row
      doc.rect(margin, tableY, contentWidth, 22).fill('#F8FAFC').strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Date', col1 + 8, tableY + 6);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Feature Description', col2 + 8, tableY + 6);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Model / Provider', col3 + 4, tableY + 6);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Unit Cost', col4 + 4, tableY + 6);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Total Credits', col5 + 4, tableY + 6);

      tableY += 22;

      // Render Execution Rows
      const logs = history.length > 0 ? history : [];
      if (logs.length === 0) {
        doc.rect(margin, tableY, contentWidth, 22).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
        doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('No AI feature execution logs recorded for this period.', col1 + 8, tableY + 6);
        tableY += 22;
      } else {
        logs.forEach((item, index) => {
          if (tableY > doc.page.height - 150) {
            doc.addPage();
            doc.rect(0, 0, pageWidth, doc.page.height).fill('#FFFFFF');
            tableY = 40;
          }

          doc.rect(margin, tableY, contentWidth, 20).strokeColor('#E2E8F0').lineWidth(0.6).stroke();
          doc.fillColor('#334155').fontSize(8).font('Helvetica').text(new Date(item.timestamp).toLocaleDateString(), col1 + 8, tableY + 5);
          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(item.featureKey, col2 + 8, tableY + 5);
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`${item.provider} (${item.aiModel})`, col3 + 4, tableY + 5);
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`${item.creditsConsumed} cr`, col4 + 4, tableY + 5);
          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(`${item.creditsConsumed}.00`, col5 + 4, tableY + 5);

          tableY += 20;
        });
      }

      // Total Consumed Credits Highlight Row
      doc.rect(margin, tableY, contentWidth, 24).fill('#F8FAFC').strokeColor('#CBD5E1').lineWidth(1).stroke();
      doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text('Total Consumed Credits', col1 + 8, tableY + 7);
      doc.fillColor('#8E1616').fontSize(11).font('Helvetica-Bold').text(`${status.consumedCredits}.00 Credits`, col5 - 40, tableY + 6);

      tableY += 35;
      doc.moveTo(margin, tableY).lineTo(pageWidth - margin, tableY).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      // 6. Devotopia Official Stamp (ختم معتمد) & Executive Admin Signature Block
      const footerY = Math.max(tableY + 20, doc.page.height - 110);

      // Official Stamp (ختم معتمد) - Left Side
      doc.save();
      doc.circle(90, footerY + 25, 26).lineWidth(1.8).strokeColor('#8E1616').stroke();
      doc.circle(90, footerY + 25, 22).lineWidth(1).strokeColor('#8E1616').stroke();
      doc.fillColor('#8E1616').fontSize(6).font('Helvetica-Bold').text('DEVOTOPIA', 70, footerY + 14, { width: 40, align: 'center' });
      doc.fillColor('#8E1616').fontSize(7.5).font('Helvetica-Bold').text('ختم معتمد', 70, footerY + 23, { width: 40, align: 'center' });
      doc.fillColor('#8E1616').fontSize(5).font('Helvetica-Bold').text('OFFICIAL SEAL', 68, footerY + 33, { width: 44, align: 'center' });
      doc.restore();

      // Executive Admin Signature Block - Right Side
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold').text('Payment Instructions & Authorization', 200, footerY);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('Server-Verified Entitlement Ledger • All AI features unlocked & metered.', 200, footerY + 12);

      // Executive Signature Text & Emblem
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Ali Maher', 380, footerY + 24);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Executive Director & Platform Administrator', 380, footerY + 36);

      // Signature Cursive Emblem
      doc.path(`M 430 ${footerY + 18} C 445 ${footerY + 5}, 455 ${footerY + 35}, 475 ${footerY + 15} S 495 ${footerY + 30}, 510 ${footerY + 18}`)
         .lineWidth(1.5).strokeColor('#8E1616').stroke();

      doc.end();
    });
  }

  async generateAiUsageHtml(
    user: JwtUser,
    options?: { period?: 'current' | 'previous'; startDate?: string; endDate?: string },
  ): Promise<string> {
    const userDoc = await this.userModel.findById(user.sub);
    if (!userDoc) throw new NotFoundException('User profile not found.');

    const status = await this.aiUsageService.getQuotaStatus(user);

    let start = options?.startDate ? new Date(options.startDate) : undefined;
    let end = options?.endDate ? new Date(options.endDate) : undefined;

    if (!start && options?.period === 'previous') {
      start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    }

    const history = await this.aiUsageService.getUsageHistory(user, {
      startDate: start,
      endDate: end,
      limit: 200,
    });

    const recentLogs = history
      .map(
        (h) => `
      <tr>
        <td style="padding: 10px 14px; font-size: 13px; color: #475569;">${new Date(h.timestamp).toLocaleDateString()}</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a;">${h.featureKey}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #475569;">${h.provider} (${h.model})</td>
        <td style="padding: 10px 14px; font-size: 13px; text-align: center; color: #8e1616;">${h.creditsConsumed}</td>
        <td style="padding: 10px 14px; font-size: 13px; text-align: right; color: #0f172a; font-weight: bold;">${h.creditsConsumed}.00</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Devotopia AI Usage Statement – ${userDoc.name}</title>
</head>
<body style="background: #ffffff; color: #0f172a; font-family: sans-serif; padding: 40px;">
  <div style="border-bottom: 3px solid #080b12; padding-bottom: 20px;">
    <h2>DEVOTOPIA CAREER INTELLIGENCE PLATFORM</h2>
    <p>Detailed AI Usage & Billing Statement</p>
  </div>
  <p><strong>Bill To:</strong> ${userDoc.name} (${userDoc.email})</p>
  <p><strong>Status:</strong> V VERIFIED PRO CANDIDATE</p>
  <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
    <thead>
      <tr><th>Date</th><th>Feature</th><th>Model</th><th>Unit Cost</th><th>Total Credits</th></tr>
    </thead>
    <tbody>${recentLogs}</tbody>
  </table>
  <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
    <p><strong>Official Seal:</strong> ختم معتمد — DEVOTOPIA OFFICIAL SEAL</p>
    <p><strong>Authorized Signature:</strong> Ali Maher — Executive Director & Platform Administrator</p>
  </div>
</body>
</html>`;
  }
}
