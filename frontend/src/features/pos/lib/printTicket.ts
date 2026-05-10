import { formatCurrency } from "../../../lib/currency";
import type { TicketPrintPayload } from "../types/pos";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatQuantity(value: string): string {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function printSaleTicket({ sale, general, cashierName }: TicketPrintPayload) {
  const companyName = general.companyName.trim() || "Ticket de venta";

  const itemsHtml = sale.details
    .map((detail) => {
      const quantity = formatQuantity(detail.quantity);
      const unitPrice = formatCurrency(Number(detail.unit_price));
      const lineTotal = formatCurrency(Number(detail.line_total));
      return `
        <div class="item">
          <div class="item-name">${escapeHtml(detail.product.name)}</div>
          <div class="item-row">
            <span>${escapeHtml(quantity)} x ${escapeHtml(unitPrice)}</span>
            <strong>${escapeHtml(lineTotal)}</strong>
          </div>
        </div>
      `;
    })
    .join("");

  const paymentsHtml = sale.payments
    .map((payment) => {
      const reference = payment.reference ? `<div class="small">Ref: ${escapeHtml(payment.reference)}</div>` : "";
      return `
        <div class="payment-row">
          <div>
            <div>${escapeHtml(payment.payment_method.name)}</div>
            ${reference}
          </div>
          <strong>${escapeHtml(formatCurrency(Number(payment.amount)))}</strong>
        </div>
      `;
    })
    .join("");

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ticket ${escapeHtml(sale.sale_number)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            margin: 0;
            font-family: "Courier New", Courier, monospace;
            color: #000;
            background: #fff;
          }
          .ticket {
            width: 80mm;
            padding: 4mm;
            box-sizing: border-box;
            font-size: 12px;
            line-height: 1.35;
          }
          .center { text-align: center; }
          .strong { font-weight: 700; }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .meta, .totals, .payments, .footer {
            display: grid;
            gap: 4px;
          }
          .item {
            margin-bottom: 8px;
          }
          .item-name {
            font-weight: 700;
            word-break: break-word;
          }
          .item-row, .payment-row, .total-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }
          .small {
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center">
            <div class="strong">${escapeHtml(companyName)}</div>
            ${general.companyTaxId ? `<div>RUT: ${escapeHtml(general.companyTaxId)}</div>` : ""}
            ${general.companyAddress ? `<div>${escapeHtml(general.companyAddress)}</div>` : ""}
            ${general.companyPhone ? `<div>Tel: ${escapeHtml(general.companyPhone)}</div>` : ""}
            ${general.companyEmail ? `<div>${escapeHtml(general.companyEmail)}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div class="center strong">TICKET DE VENTA</div>

          <div class="divider"></div>

          <div class="meta">
            <div>Folio: ${escapeHtml(sale.sale_number)}</div>
            <div>Fecha: ${escapeHtml(formatDateTime(sale.created_at))}</div>
            ${cashierName ? `<div>Cajero: ${escapeHtml(cashierName)}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div class="items">${itemsHtml}</div>

          <div class="divider"></div>

          <div class="totals">
            <div class="total-row"><span>Subtotal</span><strong>${escapeHtml(formatCurrency(Number(sale.subtotal)))}</strong></div>
            <div class="total-row"><span>IVA</span><strong>${escapeHtml(formatCurrency(Number(sale.tax_amount)))}</strong></div>
            <div class="total-row"><span>Total</span><strong>${escapeHtml(formatCurrency(Number(sale.total)))}</strong></div>
          </div>

          <div class="divider"></div>

          <div class="payments">
            <div class="strong">Pago</div>
            ${paymentsHtml}
          </div>

          ${
            sale.notes
              ? `
                <div class="divider"></div>
                <div class="small">Nota: ${escapeHtml(sale.notes)}</div>
              `
              : ""
          }

          ${
            general.ticketFooterMessage
              ? `
                <div class="divider"></div>
                <div class="footer center">${escapeHtml(general.ticketFooterMessage)}</div>
              `
              : ""
          }
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const frameDocument = iframe.contentWindow?.document;
  if (!frameDocument) {
    document.body.removeChild(iframe);
    throw new Error("No fue posible preparar la impresion del ticket");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const onLoad = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  iframe.onload = onLoad;
}
