import React, { useState } from 'react';
import { ClientProfile, OrderItem } from '../../types';
import { PaymentActionMode } from './PaymentMethodModal';
import { CuentaCobroModal } from './CuentaCobroModal';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderItem | null;
  client?: ClientProfile | null;
  onUpdateStatus?: (orderId: string, newStatus: OrderItem['status']) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: OrderItem['paymentStatus']) => void;
  onRequestPayment?: (orderId: string, mode: PaymentActionMode) => void;
  onEdit?: (order: OrderItem) => void;
  onNavigateToCrm?: () => void;
}

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  isOpen,
  onClose,
  order,
  client,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onRequestPayment,
  onEdit,
  onNavigateToCrm
}) => {
  const [isCdeCOpen, setIsCdeCOpen] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  // Restock purchases aren't client orders — show a dedicated read-mostly summary of
  // what was bought instead of the sales-order layout (margin, client info, BOM, etc.).
  if (order.isExpense) {
    const items = order.purchasedItems || [];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
        <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
          {/* Header */}
          <div className="bg-[#1b4332] text-white p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                    Compra de Insumos: {order.orderId}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold border shadow-xs ${
                      order.status === 'Recibido'
                        ? 'bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8]'
                        : 'bg-[#eef5f7] text-[#414844] border-[#c1c8c2]'
                    }`}
                  >
                    {order.status === 'Recibido' ? 'Recibido' : 'Compra Insumos'}
                  </span>
                </div>
                <p className="text-xs text-[#c1ecd4] mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>Registrada: {order.date}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#fff8f0] p-4 rounded-xl border border-[#ffcd80]">
                <div className="flex items-center gap-1.5 text-[#8a4b00] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[15px]">payments</span>
                  <span>Total Gastado</span>
                </div>
                <div className="font-numeric-data text-2xl sm:text-3xl font-bold text-[#ba1a1a] mt-1">
                  -${Math.abs(order.value).toLocaleString()}
                </div>
                <div className="text-[11px] text-[#525e59] mt-0.5">
                  Pagado desde {order.paymentMethod || '—'}
                </div>
              </div>
              <div className="bg-[#f4fafd] p-4 rounded-xl border border-[#c1c8c2]">
                <div className="flex items-center gap-1.5 text-[#0e6c4a] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                  <span>Proveedor(es)</span>
                </div>
                <div className="text-sm font-bold text-[#012d1d] mt-1">{order.client}</div>
                <div className="text-[11px] text-[#525e59] mt-0.5">
                  {items.length} {items.length === 1 ? 'insumo comprado' : 'insumos comprados'}
                </div>
              </div>
            </div>

            {/* Purchased Items Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-[#c1c8c2] space-y-3">
              <div className="flex items-center gap-1.5 font-label-caps text-[11px] font-bold text-[#012d1d]">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">format_list_bulleted</span>
                <span>Insumos Comprados</span>
              </div>

              {items.length > 0 ? (
                <div className="overflow-x-auto border border-[#c1c8c2]/60 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f4fafd] text-[#414844] font-label-caps text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Insumo</th>
                        <th className="py-2 px-3 text-center">Cantidad</th>
                        <th className="py-2 px-3 text-right">Costo Unit.</th>
                        <th className="py-2 px-3 text-right">Costo Total</th>
                        <th className="py-2 px-3">Proveedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c1c8c2]/40 text-[#161d1f]">
                      {items.map((item, idx) => (
                        <tr key={item.itemId || idx} className="hover:bg-[#f4fafd]/50">
                          <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#0e6c4a]">eco</span>
                            <span>{item.name}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-[#525e59] font-numeric-data">
                            {item.qty} {item.unit || ''}
                          </td>
                          <td className="py-2 px-3 text-right text-[#525e59] font-numeric-data">
                            ${item.unitCost.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-[#012d1d] font-numeric-data">
                            ${item.totalCost.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-[#525e59]">{item.provider || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#717973] italic bg-[#f4fafd] p-3 rounded-lg border border-[#c1c8c2]">
                  Esta compra no tiene un desglose de insumos guardado.
                </p>
              )}
            </div>

            {/* Status Update */}
            {onUpdateStatus && (
              <div className="bg-[#f0f9f4] p-3.5 rounded-xl border border-[#a0f4c8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0e6c4a] text-lg">sync_saved_locally</span>
                  <div>
                    <span className="font-bold text-[#012d1d] block">Actualizar Estado</span>
                    <span className="text-[11px] text-[#005236]">
                      Al marcar "Recibido", las cantidades compradas se suman al stock en Gestión de Inventario.
                    </span>
                  </div>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderItem['status'])}
                  className="bg-white border border-[#0e6c4a] text-[#012d1d] font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer shadow-xs"
                >
                  <option value="Pendiente">Compra Insumos</option>
                  <option value="Recibido">Recibido</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#f8faf9] border-t border-[#c1c8c2] flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#012d1d] hover:bg-[#0e6c4a] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const units = order.itemsCount || 1;
  const unitPrice = Math.round(order.value / units);
  const amountPaid = order.amountPaid || 0;
  const amountDue = Math.max(0, order.value - amountPaid);

  // Multi-product orders (added via "Añadir Producto" in Órdenes) carry their own
  // breakdown in order.products, each with its own unit count — everything below
  // prefers that when present, falling back to the legacy single-product fields.
  const isMultiProduct = !!order.products && order.products.length > 0;
  const hasBom = isMultiProduct
    ? order.products!.some((p) => p.bomComponents.length > 0)
    : !!(order.bomComponents && order.bomComponents.length > 0);
  const totalBOMCost = isMultiProduct
    ? order.products!.reduce((sum, p) => {
        const pUnits = p.itemsCount || 1;
        return (
          sum +
          p.bomComponents.reduce(
            (acc, comp) => acc + (comp.isLabor ? comp.totalCost : comp.totalCost * pUnits),
            0
          )
        );
      }, 0)
    : hasBom
    ? order.bomComponents!.reduce((acc, comp) => acc + (comp.isLabor ? comp.totalCost : comp.totalCost * units), 0)
    : 0;
  const estimatedProfit = order.value - totalBOMCost;
  const marginPercentage = order.value > 0 ? (estimatedProfit / order.value) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                  Resumen de la Orden: {order.orderId}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold border shadow-xs ${
                    order.status === 'Pendiente'
                      ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                      : order.status === 'En Producción'
                      ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                      : order.status === 'Terminado'
                      ? 'bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8]'
                      : 'bg-[#a0f4c8] text-[#005236] border-[#005236]/20'
                  }`}
                >
                  {order.status}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold border shadow-xs ${
                    order.paymentStatus === 'Pendiente'
                      ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                      : order.paymentStatus === 'Abono'
                      ? 'bg-[#ffe4b5] text-[#8a4b00] border-[#ffcd80]'
                      : 'bg-[#c6ead6] text-[#0e6c4a] border-[#a0f4c8]'
                  }`}
                  title={order.paymentMethod ? `Último movimiento: ${order.paymentMethod}` : undefined}
                >
                  <span className="material-symbols-outlined text-[12px]">payments</span>
                  <span>Pago: {order.paymentStatus}</span>
                </span>
              </div>
              <p className="text-xs text-[#a0f4c8] mt-0.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                <span>Registrada: {order.date}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Main Info Bento: Product & Economic Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Product Card */}
            <div className="bg-[#f4fafd] p-4 rounded-xl border border-[#c1c8c2] space-y-2">
              <div className="flex items-center gap-1.5 text-[#0e6c4a] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                <span>Especificación del Producto</span>
              </div>
              <div className="text-sm font-bold text-[#012d1d] leading-snug">
                {order.productSpec}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#c1c8c2]/50 text-xs text-[#414844]">
                <span>Cantidad:</span>
                <span className="font-numeric-data font-bold text-[#012d1d] bg-white px-2 py-0.5 rounded border border-[#c1c8c2]">
                  {units} {units === 1 ? 'unidad' : 'unidades'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#414844]">
                <span>Precio Unitario:</span>
                <span className="font-numeric-data font-semibold text-[#012d1d]">
                  ${unitPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Total Financial Card */}
            <div className="bg-white p-4 rounded-xl border border-[#c1c8c2] flex flex-col justify-between shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0e6c4a] font-label-caps text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px]">payments</span>
                <span>Total de la Venta</span>
              </div>
              <div className="my-1">
                <div className="font-numeric-data text-2xl sm:text-3xl font-bold text-[#012d1d]">
                  ${order.value.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#525e59] mt-0.5">
                  Valor facturado por el lote completo
                </div>
              </div>
              {hasBom && (
                <div className="pt-2 border-t border-[#c1c8c2]/50 flex justify-between items-center text-[11px]">
                  <span className="text-[#525e59]">Margen bruto estimado:</span>
                  <span className={`font-numeric-data font-bold ${marginPercentage >= 25 ? 'text-[#0e6c4a]' : 'text-[#ba1a1a]'}`}>
                    {marginPercentage.toFixed(1)}% (+${estimatedProfit.toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Details Section */}
          <div className="bg-[#fafcfb] p-4 rounded-xl border border-[#c1c8c2]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#c1c8c2]/60">
              <div className="flex items-center gap-1.5 font-label-caps text-[11px] font-bold text-[#012d1d]">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">person</span>
                <span>Información del Cliente</span>
              </div>
              {onNavigateToCrm && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToCrm();
                  }}
                  className="text-[11px] text-[#0e6c4a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver en CRM</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">
                  Nombre / Razón Social:
                </span>
                <span className="font-bold text-[#161d1f] text-sm">
                  {order.client}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">
                  Rol Comercial:
                </span>
                <span className="font-medium text-[#161d1f]">
                  {client?.role || 'Persona'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">
                  Contacto:
                </span>
                <span className="text-[#414844]">
                  {client?.phone || client?.email || 'Registrado en CRM'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#c1c8c2]/50">
              <span className="block text-[10px] font-label-caps text-[#717973] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-[#0e6c4a]">location_on</span>
                <span>Dirección de Entrega:</span>
              </span>
              <span className="text-xs text-[#414844]">
                {order.deliveryAddress || client?.address || 'No registrada'}
              </span>
            </div>
          </div>

          {/* Insumos / BOM Components Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-[#c1c8c2] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-label-caps text-[11px] font-bold text-[#012d1d]">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">format_list_bulleted</span>
                <span>Insumos y Receta Confirmada</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  order.inventoryDeducted
                    ? 'bg-[#c6ead6] text-[#012d1d]'
                    : 'bg-[#fef3c7] text-[#92400e]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {order.inventoryDeducted ? 'check_circle' : 'pending'}
                </span>
                <span>
                  {order.inventoryDeducted
                    ? 'Descontado de Inventario'
                    : 'Deducción pendiente al pasar a "En Producción", "Terminado" o "Enviado"'}
                </span>
              </span>
            </div>

            {isMultiProduct ? (
              <div className="space-y-3">
                {order.products!.map((p) => {
                  const pUnits = p.itemsCount || 1;
                  return (
                    <div key={p.id} className="border border-[#c1c8c2]/60 rounded-lg overflow-hidden">
                      <div className="bg-[#F0F9F4] px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-[#012d1d]">
                        <span>{p.productName}</span>
                        <span className="font-numeric-data font-normal text-[#525e59]">{pUnits} unidades</span>
                      </div>
                      {p.bomComponents.length === 0 ? (
                        <p className="text-[11px] text-[#717973] italic p-3">Sin insumos registrados para este producto.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#f4fafd] text-[#414844] font-label-caps text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Insumo</th>
                                <th className="py-2 px-3 text-center">Cant. Unit.</th>
                                <th className="py-2 px-3 text-center">Total Lote (x{pUnits})</th>
                                <th className="py-2 px-3 text-right">Costo Unit.</th>
                                <th className="py-2 px-3 text-right">Costo Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#c1c8c2]/40 text-[#161d1f]">
                              {p.bomComponents.map((comp, idx) => {
                                const numQty = typeof comp.qty === 'number' ? comp.qty : parseFloat(String(comp.qty)) || 0;
                                const batchQty = comp.isLabor ? comp.qty : numQty * pUnits;
                                const batchTotal = comp.isLabor ? comp.totalCost : comp.totalCost * pUnits;

                                return (
                                  <tr key={comp.id || idx} className="hover:bg-[#f4fafd]/50">
                                    <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[14px] text-[#0e6c4a]">
                                        {comp.isLabor ? 'handyman' : 'eco'}
                                      </span>
                                      <span>{comp.name}</span>
                                    </td>
                                    <td className="py-2 px-3 text-center text-[#525e59] font-numeric-data">
                                      {comp.qty} {comp.unit || ''}
                                    </td>
                                    <td className="py-2 px-3 text-center font-bold text-[#012d1d] font-numeric-data">
                                      {batchQty} {comp.unit || ''}
                                    </td>
                                    <td className="py-2 px-3 text-right text-[#525e59] font-numeric-data">
                                      ${comp.unitCost.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3 text-right font-semibold text-[#012d1d] font-numeric-data">
                                      ${batchTotal.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : hasBom ? (
              <div className="overflow-x-auto border border-[#c1c8c2]/60 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f4fafd] text-[#414844] font-label-caps text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Insumo</th>
                      <th className="py-2 px-3 text-center">Cant. Unit.</th>
                      <th className="py-2 px-3 text-center">Total Lote (x{units})</th>
                      <th className="py-2 px-3 text-right">Costo Unit.</th>
                      <th className="py-2 px-3 text-right">Costo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c1c8c2]/40 text-[#161d1f]">
                    {order.bomComponents!.map((comp, idx) => {
                      const numQty = typeof comp.qty === 'number' ? comp.qty : parseFloat(String(comp.qty)) || 0;
                      const batchQty = comp.isLabor ? comp.qty : numQty * units;
                      const batchTotal = comp.isLabor ? comp.totalCost : comp.totalCost * units;

                      return (
                        <tr key={comp.id || idx} className="hover:bg-[#f4fafd]/50">
                          <td className="py-2 px-3 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#0e6c4a]">
                              {comp.isLabor ? 'handyman' : 'eco'}
                            </span>
                            <span>{comp.name}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-[#525e59] font-numeric-data">
                            {comp.qty} {comp.unit || ''}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-[#012d1d] font-numeric-data">
                            {batchQty} {comp.unit || ''}
                          </td>
                          <td className="py-2 px-3 text-right text-[#525e59] font-numeric-data">
                            ${comp.unitCost.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-[#012d1d] font-numeric-data">
                            ${batchTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#717973] italic bg-[#f4fafd] p-3 rounded-lg border border-[#c1c8c2]">
                Esta orden fue registrada sin desglose de insumos individual. Los insumos se vinculan automáticamente según la receta estándar del producto.
              </p>
            )}
          </div>

          {/* Payment Info: visible any time the order has an Abono or is fully Pagado */}
          {order.paymentStatus !== 'Pendiente' && (
            <div className="bg-[#fff8f0] p-4 rounded-xl border border-[#ffcd80] space-y-2">
              <div className="flex items-center gap-1.5 font-label-caps text-[11px] font-bold text-[#8a4b00]">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>Información de Pago</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Abonado</span>
                  <span className="font-numeric-data font-bold text-[#012d1d]">${amountPaid.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Saldo Restante</span>
                  <span className={`font-numeric-data font-bold ${amountDue > 0 ? 'text-[#ba1a1a]' : 'text-[#0e6c4a]'}`}>
                    ${amountDue.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Método</span>
                  <span className="font-semibold text-[#012d1d]">{order.paymentMethod || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Estado</span>
                  <span className="font-semibold text-[#012d1d]">{order.paymentStatus}</span>
                </div>
              </div>
              {order.paymentStatus === 'Abono' && amountDue > 0 && onRequestPayment && (
                <button
                  type="button"
                  onClick={() => onRequestPayment(order.id, 'Abono')}
                  className="mt-1 text-[11px] font-semibold text-[#8a4b00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">add_circle</span>
                  <span>Registrar Nuevo Abono</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Status Update inside Modal */}
          {onUpdateStatus && (
            <div className="bg-[#f0f9f4] p-3.5 rounded-xl border border-[#a0f4c8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e6c4a] text-lg">sync_saved_locally</span>
                <div>
                  <span className="font-bold text-[#012d1d] block">Actualizar Estado de la Orden</span>
                  <span className="text-[11px] text-[#005236]">
                    Al cambiar a "En Producción" o "Terminado", los insumos se descuentan automáticamente del inventario.
                    "Enviado" solo se habilita después de registrar un Abono o el Pago completo — un producto sin pagar no se envía.
                  </span>
                </div>
              </div>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderItem['status'])}
                className="bg-white border border-[#0e6c4a] text-[#012d1d] font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer shadow-xs"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Producción">En Producción</option>
                <option value="Terminado">Terminado</option>
                <option value="Enviado" disabled={order.paymentStatus === 'Pendiente'}>
                  Enviado{order.paymentStatus === 'Pendiente' ? ' (requiere pago)' : ''}
                </option>
              </select>
            </div>
          )}

          {/* Quick Payment Status Update inside Modal */}
          {onUpdatePaymentStatus && (
            <div className="bg-[#fff8f0] p-3.5 rounded-xl border border-[#ffcd80] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8a4b00] text-lg">payments</span>
                <div>
                  <span className="font-bold text-[#012d1d] block">Actualizar Estado de Pago</span>
                  <span className="text-[11px] text-[#8a4b00]">
                    "Abono" pide método (Efectivo/Banco) y el monto pagado, calculando el saldo restante. "Pagado" liquida
                    el saldo restante completo y habilita el estado "Enviado".
                  </span>
                </div>
              </div>
              <select
                value={order.paymentStatus}
                onChange={(e) =>
                  onUpdatePaymentStatus(order.id, e.target.value as OrderItem['paymentStatus'])
                }
                className="bg-white border border-[#8a4b00] text-[#012d1d] font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer shadow-xs"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Abono">Abono</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f8faf9] border-t border-[#c1c8c2] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left Action: CdeC Button */}
          {!order.isExpense && (
            <button
              type="button"
              id="btn-cdec-order"
              onClick={() => setIsCdeCOpen(true)}
              className="bg-[#0e6c4a] hover:bg-[#012d1d] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Generar Cuenta de Cobro (CdeC) en PDF para el cliente"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>CdeC (Cuenta de Cobro)</span>
            </button>
          )}

          {/* Right Actions: Editar y Cerrar */}
          <div className="flex items-center gap-2 ml-auto">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(order)}
                className="bg-white border border-[#c1c8c2] hover:bg-[#eef5f7] text-[#012d1d] px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar Orden</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-[#012d1d] hover:bg-[#0e6c4a] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cuenta de Cobro (PDF generator) */}
      <CuentaCobroModal
        isOpen={isCdeCOpen}
        onClose={() => setIsCdeCOpen(false)}
        order={order}
        client={client}
      />
    </div>
  );
};
