import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth();
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quotation = await prisma.quotation.findFirst({
    where: { id, deletedAt: null, companyId: user.companyId },
    include: {
      customer: { select: { id: true, name: true, customerCode: true, billingAddress: true, gstNumber: true, phone: true, email: true } },
      contact: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true, productCode: true } } } },
      company: { select: { id: true, name: true } },
    },
  });

  if (!quotation) return NextResponse.json({ success: false, message: "Quotation not found" }, { status: 404 });

  // Build printable HTML
  const companyName = quotation.company?.name || "SUKI CRM";
  const companyAddress = "";
  const companyGstin = "";

  const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const rowsHtml = quotation.items.map((item, idx) => {
    const lineTotal = item.lineTotal || item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
    return `<tr>
      <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${item.description}${item.product ? `<br/><span style="font-size:10px;color:#94a3b8;">${item.product.productCode}</span>` : ""}</td>
      <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${item.hsn || "-"}</td>
      <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">${item.quantity}</td>
      <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${item.unit || "Nos"}</td>
      <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">₹${item.unitPrice.toFixed(2)}</td>
      <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${item.discountPercent || 0}%</td>
      <td style="text-align:center;padding:6px 8px;border:1px solid #e2e8f0;">${item.taxPercent || 18}%</td>
      <td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;font-weight:600;">₹${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const discountAmount = quotation.subtotal * (quotation.discountPercent / 100);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quotation ${quotation.quotationCode}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #f8fafc; padding: 20px; }
  .quotation-doc { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 24px; }
  .company-name { font-size: 24px; font-weight: 800; color: #1e40af; }
  .company-info { font-size: 12px; color: #64748b; margin-top: 4px; }
  .quo-badge { background: #1e40af; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 700; }
  .revision-badge { display: inline-block; background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 8px; }
  .meta-row { display: flex; gap: 40px; margin-bottom: 24px; }
  .meta-col { flex: 1; }
  .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .meta-value { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
  thead th { background: #1e293b; color: white; padding: 8px; font-size: 11px; text-transform: uppercase; }
  .totals-section { margin-left: auto; width: 300px; margin-bottom: 24px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .grand-total { border-top: 2px solid #1e40af; padding-top: 8px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #1e40af; }
  .terms-section { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 6px; }
  .terms-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
  .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
  .term-item { }
  .term-label { font-weight: 600; color: #475569; }
  .tc-text { font-size: 11px; color: #64748b; margin-top: 8px; line-height: 1.5; }
  .signature { margin-top: 40px; display: flex; justify-content: flex-end; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #cbd5e1; width: 200px; margin-top: 40px; padding-top: 8px; font-size: 12px; font-weight: 600; }
  @media print { body { background: white; padding: 0; } .quotation-doc { box-shadow: none; } }
</style>
</head>
<body>
<div class="quotation-doc">
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="company-info">${companyAddress}</div>
      ${companyGstin ? `<div class="company-info">GSTIN: ${companyGstin}</div>` : ""}
    </div>
    <div style="text-align:right;">
      <div class="quo-badge">QUOTATION</div>
      <div style="margin-top:8px;font-size:14px;font-weight:700;">${quotation.quotationCode}</div>
      <div class="revision-badge">R${quotation.revisionNumber}</div>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-col">
      <div class="meta-label">Quotation Date</div>
      <div class="meta-value">${formatDate(quotation.createdAt)}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Valid Until</div>
      <div class="meta-value">${formatDate(quotation.validUntil)}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Status</div>
      <div class="meta-value">${quotation.status}</div>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-col">
      <div class="meta-label">Bill To</div>
      <div class="meta-value">${quotation.customer?.name || ""}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">${quotation.customer?.billingAddress || ""}</div>
      ${quotation.customer?.gstNumber ? `<div style="font-size:12px;color:#64748b;">GSTIN: ${quotation.customer.gstNumber}</div>` : ""}
    </div>
    <div class="meta-col">
      <div class="meta-label">Contact</div>
      <div class="meta-value">${quotation.contact?.name || "-"}</div>
      <div style="font-size:12px;color:#64748b;">${quotation.contact?.email || ""}</div>
      <div style="font-size:12px;color:#64748b;">${quotation.contact?.phone || ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px;">#</th>
        <th>Description</th>
        <th style="width:60px;">HSN</th>
        <th style="width:50px;">Qty</th>
        <th style="width:50px;">UOM</th>
        <th style="width:80px;">Unit Price</th>
        <th style="width:40px;">Disc%</th>
        <th style="width:40px;">Tax%</th>
        <th style="width:90px;">Line Total</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="totals-section">
    <div class="total-row"><span>Subtotal:</span><span>₹${quotation.subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>Discount (${quotation.discountPercent}%):</span><span>-₹${discountAmount.toFixed(2)}</span></div>
    <div class="total-row"><span>Tax (GST):</span><span>+₹${quotation.taxAmount.toFixed(2)}</span></div>
    <div class="total-row grand-total"><span>Grand Total:</span><span>₹${quotation.finalAmount.toFixed(2)}</span></div>
  </div>

  <div class="terms-section">
    <div class="terms-title">Commercial Terms</div>
    <div class="terms-grid">
      <div class="term-item"><span class="term-label">Payment Terms:</span> ${quotation.paymentTerms || "As per standard terms"}</div>
      <div class="term-item"><span class="term-label">Delivery Terms:</span> ${quotation.deliveryTerms || "As per standard terms"}</div>
      <div class="term-item"><span class="term-label">Freight Terms:</span> ${quotation.freightTerms || "Extra at actuals"}</div>
      <div class="term-item"><span class="term-label">Lead Time:</span> ${quotation.leadTimeDays ? quotation.leadTimeDays + " days" : "As per standard"}</div>
    </div>
    ${quotation.termsAndConditions ? `<div class="tc-text"><strong>Terms & Conditions:</strong><br/>${quotation.termsAndConditions}</div>` : ""}
  </div>

  <div class="signature">
    <div class="sig-block">
      <div class="sig-line">For ${companyName}</div>
    </div>
  </div>
</div>
<script>window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
