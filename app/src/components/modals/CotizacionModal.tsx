import React, { useState } from 'react';
import { ClientProfile, OrderItem } from '../../types';

interface CotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItem | null;
  client?: ClientProfile | null;
  /** Persiste la nota "Contiene:" en la orden — para poder revisarla después, no solo
   *  mientras el modal está abierto. */
  onUpdateQuotationNotes?: (orderId: string, notes: string) => void;
}

export const CotizacionModal: React.FC<CotizacionModalProps> = ({
  isOpen,
  onClose,
  order,
  client,
  onUpdateQuotationNotes
}) => {
  const [notes, setNotes] = useState<string>(order?.quotationNotes || '');

  // Re-sincroniza la nota local si se abre este modal para una orden distinta —
  // a diferencia del campo de identificación de la Cuenta de Cobro (que es
  // intencionalmente efímero), esta nota sí se guarda con la orden.
  React.useEffect(() => {
    setNotes(order?.quotationNotes || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!isOpen || !order) return null;

  const clientName = client?.name || order.client;
  const itemsCount = order.itemsCount || 1;
  const unitPrice = Math.round(order.value / itemsCount);
  const totalValue = order.value;

  // Multi-product orders (added via "Añadir Producto" en Órdenes) listan cada
  // producto con su propia cantidad y precio, en vez de mezclar todo en un promedio.
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

  const productParts = lineItems.map((it) => `${it.qty} ${it.name}`);
  const productSummary =
    productParts.length <= 1
      ? productParts[0] || order.productSpec
      : `${productParts.slice(0, -1).join(', ')} y ${productParts[productParts.length - 1]}`;

  const pricingText =
    lineItems.length === 1
      ? lineItems[0].qty > 1
        ? `$${lineItems[0].unitPrice.toLocaleString('es-CO')} c/u, para un total de $${lineItems[0].total.toLocaleString('es-CO')}`
        : `$${lineItems[0].unitPrice.toLocaleString('es-CO')}`
      : `${lineItems
          .map((it) => `${it.qty} ${it.name} a $${it.unitPrice.toLocaleString('es-CO')} c/u`)
          .join(', ')}, para un valor total de $${totalValue.toLocaleString('es-CO')}`;

  const persistNotes = () => {
    if (onUpdateQuotationNotes && notes !== (order.quotationNotes || '')) {
      onUpdateQuotationNotes(order.id, notes);
    }
  };

  const handlePrintPdf = () => {
    persistNotes();

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Ruta absoluta al logo — el documento se escribe en una ventana about:blank y
    // necesita el origen explícito para resolver la imagen correctamente al imprimir.
    const logoUrl = `${window.location.origin}/logo.png`;
    const containsHtml = (notes.trim() || 'Sin detalles adicionales.').replace(/\n/g, '<br/>');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Cotizacion_${order.orderId}_${clientName.replace(/\s+/g, '_')}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 18mm 22mm;
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
              font-size: 13px;
              line-height: 1.65;
            }
            .doc-number {
              text-align: right;
              font-size: 12px;
              font-weight: 700;
              color: #374151;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .logo-wrap {
              text-align: center;
              margin-bottom: 16px;
            }
            .logo-wrap img {
              width: 160px;
              height: auto;
              filter: grayscale(1);
            }
            .client-name {
              text-align: center;
              font-size: 16px;
              font-weight: 800;
              color: #111827;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 1px solid #d1d5db;
            }
            .message p {
              margin: 0 0 12px 0;
              color: #1f2937;
            }
            .contains-label {
              font-weight: 700;
              color: #111827;
            }
            .no-domicilio {
              font-weight: 700;
              color: #374151;
              margin: 16px 0 8px 0;
            }
            .pricing {
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 11px 14px;
              font-size: 13px;
              color: #111827;
              margin-bottom: 18px;
            }
            hr {
              border: none;
              border-top: 1px solid #9ca3af;
              margin: 20px 0;
            }
            .payment-info {
              color: #1f2937;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="doc-number"># ${order.orderId}</div>

          <div class="logo-wrap">
            <img src="${logoUrl}" alt="Creatividad Verde" />
          </div>

          <div class="client-name">${clientName}</div>

          <div class="message">
            <p>Gracias por elegir a Creatividad Verde ☘️</p>
            <p>Tu pedido es de <strong>${productSummary}</strong>, hecho a mano con dedicación, cariño y atención en cada detalle 💚</p>
            <p><span class="contains-label">Contiene:</span> ${containsHtml}</p>
          </div>

          <div class="no-domicilio">No incluye domicilio</div>

          <div class="pricing">Tiene un valor unitario de ${pricingText}</div>

          <hr />

          <p class="payment-info">Para iniciar la elaboración, puedes realizar el pago al número de cuenta 316-554281-46 ahorros Bancolombia, a nombre de Daniel. Una vez recibido, comenzaremos la elaboración y darle detalle a tu pedido con mucho cariño. 🌿🌱</p>
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
        <div className="bg-[#0e6c4a] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-2xl">request_quote</span>
            </div>
            <h3 className="font-headline text-lg font-bold">Cotización #{order.orderId}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body / Document Preview */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm text-[#111827]">
          <div className="text-right font-label-caps text-[11px] font-bold text-[#374151]">
            # {order.orderId}
          </div>

          <div className="flex justify-center">
            <img src="/logo.png" alt="Creatividad Verde" className="w-36 h-auto" />
          </div>

          <div className="text-center border-b border-[#e5e7eb] pb-3">
            <span className="font-headline font-bold text-lg text-[#111827]">{clientName}</span>
          </div>

          <div className="space-y-2 text-[13px] text-[#1f2937] leading-relaxed">
            <p>Gracias por elegir a Creatividad Verde ☘️</p>
            <p>
              Tu pedido es de <strong>{productSummary}</strong>, hecho a mano con dedicación, cariño y atención en
              cada detalle 💚
            </p>
          </div>

          {/* Editable "Contiene" note — persisted on the order */}
          <div>
            <label className="block font-label-caps text-[10px] text-[#6b7280] uppercase font-semibold mb-1">
              Contiene (detalle editable para el cliente)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={persistNotes}
              rows={4}
              placeholder="Ej. Incluye maceta de barro, planta suculenta y tarjeta personalizada..."
              className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0e6c4a] resize-none"
            />
            <p className="text-[10px] text-[#717973] mt-1">
              Se guarda con la orden — puedes volver a revisarla o editarla cuando quieras, incluso después de
              generar el PDF.
            </p>
          </div>

          <div className="font-bold text-xs text-[#374151]">No incluye domicilio</div>

          <div className="bg-[#f3f4f6] border border-[#d1d5db] rounded-lg px-3.5 py-2.5 text-xs text-[#111827]">
            Tiene un valor unitario de {pricingText}
          </div>

          <hr className="border-t border-[#9ca3af]" />

          <p className="text-xs text-[#1f2937] leading-relaxed">
            Para iniciar la elaboración, puedes realizar el pago al número de cuenta 316-554281-46 ahorros
            Bancolombia, a nombre de Daniel. Una vez recibido, comenzaremos la elaboración y darle detalle a tu
            pedido con mucho cariño. 🌿🌱
          </p>
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
            className="bg-[#0e6c4a] hover:bg-[#012d1d] text-white px-5 py-2 rounded-xl font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Generar y Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
