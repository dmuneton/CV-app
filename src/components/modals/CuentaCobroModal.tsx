import React, { useState } from 'react';
import { ClientProfile, OrderItem } from '../../types';
import { numeroALetras } from '../../utils/numeroALetras';

interface CuentaCobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItem | null;
  client?: ClientProfile | null;
}

export const CuentaCobroModal: React.FC<CuentaCobroModalProps> = ({
  isOpen,
  onClose,
  order,
  client
}) => {
  const [clientDoc, setClientDoc] = useState<string>(client?.identification || '');

  if (!isOpen || !order) return null;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const fechaExpedicion = `${day}/${month}/${year}`;

  const itemsCount = order.itemsCount || 1;
  const unitPrice = Math.round(order.value / itemsCount);
  const totalValue = order.value;
  const valorEnLetras = numeroALetras(totalValue);
  const clientName = client?.name || order.client;
  const identification = clientDoc || client?.identification || 'No registrada';

  // Multi-product orders (added via "Añadir Producto" en Órdenes) get their own line
  // per product instead of the combined productSpec string — otherwise different
  // products end up mixed into a single row with a meaningless average unit price.
  const lineItems =
    order.products && order.products.length > 0
      ? order.products.map((p) => {
          const qty = p.itemsCount || 1;
          return {
            name: p.productName,
            qty,
            unitPrice: p.salePrice,
            total: Math.round(p.salePrice * qty)
          };
        })
      : [{ name: order.productSpec, qty: itemsCount, unitPrice, total: totalValue }];

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Cuenta_de_Cobro_${order.orderId}_${clientName.replace(/\s+/g, '_')}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 15mm 20mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 12.5px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111827;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .brand-title {
              font-size: 20px;
              font-weight: 800;
              color: #111827;
              letter-spacing: -0.5px;
            }
            .doc-title {
              text-align: right;
            }
            .doc-title h1 {
              font-size: 18px;
              font-weight: 800;
              color: #111827;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .doc-title p {
              margin: 2px 0 0 0;
              font-size: 13px;
              color: #374151;
              font-weight: 700;
            }
            .client-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 14px;
            }
            .client-box p {
              margin: 2px 0;
            }
            .label {
              font-size: 10px;
              font-weight: 700;
              color: #4b5563;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .debe-a-section {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px 14px;
              margin-bottom: 14px;
            }
            .debe-a-section p {
              margin: 2px 0;
              font-size: 12.5px;
              color: #1f2937;
            }
            .suma-box {
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 12px 14px;
              margin-bottom: 16px;
            }
            .suma-valor {
              font-size: 17px;
              font-weight: 800;
              color: #000000;
            }
            .suma-letras {
              font-size: 11px;
              color: #374151;
              font-weight: 700;
              text-transform: uppercase;
              margin-top: 3px;
              letter-spacing: 0.2px;
            }
            .concept-title {
              font-size: 10.5px;
              font-weight: 700;
              color: #374151;
              text-transform: uppercase;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 18px;
            }
            th {
              background: #1f2937;
              color: #ffffff;
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 8px 12px;
              text-align: left;
            }
            td {
              padding: 9px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
              color: #1f2937;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row td {
              font-weight: 800;
              font-size: 12.5px;
              border-top: 2px solid #111827;
              border-bottom: 2px solid #111827;
              background: #f9fafb;
              color: #000000;
            }
            .payment-info {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 11px 14px;
              margin-top: 12px;
              font-size: 12px;
              color: #1f2937;
            }
            .payment-info p {
              margin: 3px 0;
            }
            .signature {
              margin-top: 80px;
              padding-top: 8px;
              border-top: 1px solid #4b5563;
              width: 250px;
            }
            .signature-name {
              font-weight: 700;
              color: #111827;
              font-size: 12.5px;
            }
            .signature-id {
              font-size: 11px;
              color: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-title">CREATIVIDAD VERDE</div>
            </div>
            <div class="doc-title">
              <h1>CUENTA DE COBRO</h1>
              <p># ${order.orderId}</p>
            </div>
          </div>

          <div class="client-box">
            <div class="label">CLIENTE / DEUDOR:</div>
            <p><strong>${clientName}</strong></p>
            <p><span class="label">IDENTIFICACIÓN / NIT / CC:</span> ${identification}</p>
          </div>

          <div class="debe-a-section">
            <div class="label">DEBE A:</div>
            <p><strong>Daniel Muñetón</strong></p>
            <p><strong>CC:</strong> 1.152.196.879 de Medellín</p>
            <p><strong>CEL:</strong> 319 726 4077</p>
            <p><strong>E-MAIL:</strong> info@creatividadverde.com</p>
          </div>

          <div class="suma-box">
            <div class="label" style="color: #374151;">LA SUMA:</div>
            <div class="suma-valor">$ ${totalValue.toLocaleString('es-CO')} COP</div>
            <div class="suma-letras">${valorEnLetras}</div>
          </div>

          <div class="concept-title">POR CONCEPTO DE:</div>

          <table>
            <thead>
              <tr>
                <th>Ítem / Descripción del Producto</th>
                <th class="text-center">Cantidad</th>
                <th class="text-right">Valor Unitario</th>
                <th class="text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems
                .map(
                  (item) => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right">$ ${item.unitPrice.toLocaleString('es-CO')}</td>
                <td class="text-right">$ ${item.total.toLocaleString('es-CO')}</td>
              </tr>`
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3" class="text-right">TOTAL A PAGAR:</td>
                <td class="text-right">$ ${totalValue.toLocaleString('es-CO')} COP</td>
              </tr>
            </tbody>
          </table>

          <div class="payment-info">
            <p><strong>Fecha de expedición:</strong> ${fechaExpedicion}</p>
            <p><strong>Forma de pago:</strong> Transferencia Bancaria</p>
            <p><strong>Información de pago:</strong> Cuenta de ahorros Bancolombia # 316-554281-46</p>
          </div>

          <div class="signature">
            <div class="signature-name">Daniel Muñetón</div>
            <div class="signature-id">CC: 1.152.196.879 de Medellín</div>
            <div class="signature-id">Creatividad Verde</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1f2937] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">receipt</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold">
                Cuenta de Cobro #{order.orderId}
              </h3>
              <p className="text-xs text-gray-300">
                Generador de documento oficial para cobro al cliente (Escala de Grises)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body / Document Preview */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-[#111827]">
          {/* Document Header Preview */}
          <div className="border-b-2 border-[#111827] pb-3 flex justify-between items-start">
            <div>
              <h2 className="font-headline font-bold text-xl text-[#111827]">
                CREATIVIDAD VERDE
              </h2>
            </div>
            <div className="text-right">
              <span className="font-headline font-bold text-base text-[#111827] uppercase block">
                CUENTA DE COBRO
              </span>
              <span className="font-numeric-data font-bold text-sm text-[#374151]">
                # {order.orderId}
              </span>
            </div>
          </div>

          {/* Client & Identification Box */}
          <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="block font-label-caps text-[10px] text-[#6b7280] uppercase font-semibold">
                  Cliente / Deudor
                </span>
                <span className="font-headline font-bold text-base text-[#111827]">
                  {clientName}
                </span>
              </div>

              {/* Editable identification field for quick adjustments before printing */}
              <div className="sm:w-64">
                <label className="block font-label-caps text-[10px] text-[#6b7280] uppercase font-semibold mb-1">
                  NIT / Cédula del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej. NIT 901.445.678-1 o CC"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-2.5 py-1 text-xs text-[#111827] focus:outline-none focus:border-[#4b5563]"
                />
              </div>
            </div>
          </div>

          {/* DEBE A Section */}
          <div className="p-4 rounded-xl bg-white border border-[#e5e7eb] space-y-1 text-xs">
            <span className="block font-label-caps text-[10px] text-[#6b7280] uppercase font-bold tracking-wider mb-1">
              DEBE A:
            </span>
            <p className="font-bold text-[#111827] text-sm">Daniel Muñetón</p>
            <p className="text-[#374151]"><strong>CC:</strong> 1.152.196.879 de Medellín</p>
            <p className="text-[#374151]"><strong>CEL:</strong> 319 726 4077</p>
            <p className="text-[#374151]"><strong>E-MAIL:</strong> info@creatividadverde.com</p>
          </div>

          {/* LA SUMA Section */}
          <div className="p-4 rounded-xl bg-[#f3f4f6] border border-[#d1d5db] space-y-1">
            <span className="block font-label-caps text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">
              LA SUMA:
            </span>
            <div className="font-numeric-data font-bold text-xl text-[#111827]">
              ${totalValue.toLocaleString('es-CO')} COP
            </div>
            <div className="font-semibold text-xs text-[#374151] uppercase tracking-wide">
              {valorEnLetras}
            </div>
          </div>

          {/* POR CONCEPTO DE & Products Table */}
          <div className="space-y-2">
            <span className="block font-label-caps text-[10px] text-[#4b5563] uppercase font-bold tracking-wider">
              POR CONCEPTO DE:
            </span>

            <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2937] text-white font-label-caps">
                  <tr>
                    <th className="py-2.5 px-3">Ítem / Producto</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-semibold text-[#111827]">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-center font-numeric-data font-medium text-[#374151]">
                        {item.qty}
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-data text-[#4b5563]">
                        ${item.unitPrice.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-3 text-right font-numeric-data font-bold text-[#111827]">
                        ${item.total.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f9fafb] font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right font-label-caps text-[11px] text-[#4b5563]">
                      TOTAL:
                    </td>
                    <td className="py-2.5 px-3 text-right font-numeric-data text-sm text-[#111827]">
                      ${totalValue.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Follow-up Details */}
          <div className="p-4 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] space-y-1.5 text-xs text-[#374151]">
            <p>
              <strong className="text-[#111827]">Fecha de expedición:</strong> {fechaExpedicion}
            </p>
            <p>
              <strong className="text-[#111827]">Forma de pago:</strong> Transferencia Bancaria
            </p>
            <p>
              <strong className="text-[#111827]">Información de pago:</strong> Cuenta de ahorros Bancolombia # 316-554281-46
            </p>
          </div>

          {/* Signature in Preview */}
          <div className="mt-14 pt-4 border-t border-[#9ca3af] w-64 text-xs">
            <p className="font-bold text-[#111827]">Daniel Muñetón</p>
            <p className="text-[#4b5563]">CC: 1.152.196.879 de Medellín</p>
            <p className="text-[#4b5563]">Creatividad Verde</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f9fafb] border-t border-[#e5e7eb] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#4b5563] hover:bg-[#e5e7eb] rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="bg-[#111827] hover:bg-[#1f2937] text-white px-5 py-2 rounded-xl font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Generar y Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
