import React, { useState } from 'react';
import { OrderItem, ScreenType, ClientProfile, InventoryItem } from '../types';
import { OrderSummaryModal } from './modals/OrderSummaryModal';
import { EditOrderModal } from './modals/EditOrderModal';
import { PaymentActionMode } from './modals/PaymentMethodModal';
import { TransferCashModal } from './modals/TransferCashModal';

interface DashboardScreenProps {
  orders: OrderItem[];
  clients?: ClientProfile[];
  inventory?: InventoryItem[];
  totalSales?: number;
  cashBalance?: { efectivo: number; banco: number };
  netProfit?: number;
  onNavigate: (screen: ScreenType) => void;
  onNewSale?: () => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderItem['status']) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: OrderItem['paymentStatus']) => void;
  onRequestPayment?: (orderId: string, mode: PaymentActionMode) => void;
  onEditOrder?: (order: OrderItem) => void;
  onTransferCash?: (from: 'efectivo' | 'banco', to: 'efectivo' | 'banco', amount: number) => void;
  searchTerm?: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  orders,
  clients = [],
  inventory = [],
  totalSales = 0,
  cashBalance = { efectivo: 0, banco: 0 },
  netProfit = 0,
  onNavigate,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onRequestPayment,
  onEditOrder,
  onTransferCash,
  searchTerm = ''
}) => {
  const [isTransferCashOpen, setIsTransferCashOpen] = useState(false);
  // Stock Crítico: same rule as Gestión de Inventario — alerts only once Stock Actual
  // reaches (or drops below) Stock Mínimo — so this card always matches that section.
  const criticalStockCount = inventory.filter((item) => !item.isArchived && item.stock <= item.minStock).length;

  // Prod. Pendiente: órdenes de cliente (no compras de insumos) que todavía están en
  // producción o cuyo pago no se ha completado — Pendiente/En Producción por estado de
  // producción, o Abono por estado de pago.
  const pendingProdCount = orders.filter(
    (o) =>
      !o.isExpense &&
      (o.status === 'Pendiente' || o.status === 'En Producción' || o.paymentStatus === 'Abono')
  ).length;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<OrderItem | null>(null);

  const itemsPerPage = 8;

  // Filter orders by search term and ensure newest are first
  const filteredOrders = orders.filter(
    (ord) =>
      ord.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.productSpec.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  // Selected order is derived live from the orders prop, so the summary modal always
  // reflects the latest status (e.g. after a "Pagado" confirmation updates the order).
  const selectedOrderForSummary = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId) || null
    : null;

  // Selected client match for summary modal
  const matchedClient = selectedOrderForSummary
    ? clients.find(
        (c) => c.name.toLowerCase().trim() === selectedOrderForSummary.client.toLowerCase().trim()
      ) || null
    : null;

  return (
    <div id="screen-dashboard" className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#012d1d] tracking-tight">
          Panel de Control
        </h1>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div
          id="kpi-total-sales"
          className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(27,67,50,0.08)] transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#414844]">Ventas Totales</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data">
            ${totalSales.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#717973] mt-2 border-t border-[#c1c8c2] pt-2.5">
            Suma del Total de Compras de todos los clientes en CRM Clientes
          </p>
        </div>

        {/* Cash Balance */}
        <div
          id="kpi-cash-balance"
          onClick={() => onTransferCash && setIsTransferCashOpen(true)}
          title={onTransferCash ? 'Pasar dinero entre Efectivo y Banco' : undefined}
          className={`bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(27,67,50,0.08)] transition-all ${
            onTransferCash ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Saldo en Caja</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data mb-2">
            ${(cashBalance.efectivo + cashBalance.banco).toLocaleString()}
          </div>
          <div className="flex justify-between font-numeric-data text-xs text-[#414844] border-t border-[#c1c8c2] pt-2.5 mt-auto">
            <span>Efectivo: ${cashBalance.efectivo.toLocaleString()}</span>
            <span>Banco: ${cashBalance.banco.toLocaleString()}</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div
          id="kpi-inventory-alerts"
          onClick={() => onNavigate('inventory')}
          className="bg-[#ffdad6] border border-[#ffb4ab] p-5 rounded-xl flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(27,67,50,0.08)] transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#93000a] font-bold">
              Alertas de Inventario
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-[#ba1a1a] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#93000a] font-numeric-data">
              {criticalStockCount}
            </span>
            <span className="text-sm font-medium text-[#ba1a1a]">artículos bajos</span>
          </div>
        </div>

        {/* Pending Prod */}
        <div
          id="kpi-pending-prod"
          onClick={() => onNavigate('product-engineering')}
          className="bg-[#ffdcc4] border border-[#ffb781] p-5 rounded-xl flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(27,67,50,0.08)] transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-xs text-[#5f2f00] font-bold">
              Prod. Pendiente
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-[#6f3800] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="font-headline text-3xl font-bold text-[#5f2f00] font-numeric-data">
              {pendingProdCount}
            </span>
            <span className="text-sm font-medium text-[#6f3800]">
              {pendingProdCount === 1 ? 'orden' : 'órdenes'}
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div
          id="kpi-net-profit"
          className="bg-white border border-[#c1c8c2] p-5 rounded-xl flex flex-col justify-between hover:shadow-[0px_4px_12px_rgba(27,67,50,0.08)] transition-all"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-xs text-[#414844]">Ganancias Netas</span>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] text-right font-numeric-data">
            ${netProfit.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#717973] mt-2 border-t border-[#c1c8c2] pt-2.5">
            50% de la ganancia de cada orden pagada, tras cubrir el ROI de activos fijos pendientes
          </p>
        </div>
      </div>

      {/* Lower Layout: Orders Table */}
      <div>
        {/* Orders Table with Pagination */}
        <div className="bg-white border border-[#c1c8c2] rounded-xl overflow-hidden shadow-2xs flex flex-col">
          {/* Table Header with Pagination Controls */}
          <div className="p-4 border-b border-[#c1c8c2] flex flex-wrap justify-between items-center gap-3 bg-[#F8F9FA]">
            <div>
              <h3 className="font-headline text-base md:text-lg font-bold text-[#012d1d]">
                Registro de Órdenes
              </h3>
              <p className="text-[11px] text-[#525e59]">
                Ordenadas desde la más reciente hasta la más antigua
              </p>
            </div>

            {/* Pagination Controls in Header */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#414844] font-medium">
                Pág. <strong className="text-[#012d1d] font-numeric-data">{safeCurrentPage}</strong> de{' '}
                <strong className="text-[#012d1d] font-numeric-data">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  id="btn-dashboard-prev-page"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="w-7 h-7 flex items-center justify-center border border-[#c1c8c2] rounded-lg bg-white hover:bg-[#eef5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-[#012d1d]"
                  title="Página anterior"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  id="btn-dashboard-next-page"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="w-7 h-7 flex items-center justify-center border border-[#c1c8c2] rounded-lg bg-white hover:bg-[#eef5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-[#012d1d]"
                  title="Página siguiente"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F0F9F4] font-label-caps text-[11px] text-[#414844] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2]">ID</th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2]">Cliente</th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2]">Especificación</th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2] text-right">
                    Valor
                  </th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2] text-center">
                    Estado
                  </th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2] text-center">
                    Pago
                  </th>
                  <th className="py-3 px-3.5 font-semibold border-b border-[#c1c8c2] text-center">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#c1c8c2]/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#717973]">
                      No se encontraron órdenes registradas{searchTerm ? ` para "${searchTerm}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) =>
                    order.isExpense ? (
                      // Restock purchases are a cash-outflow ledger entry, not a client order —
                      // shown read-only so nobody accidentally routes them through sale flows.
                      <tr key={order.id} className="hover:bg-[#eef5f7]/70 transition-colors bg-[#fff8f0]/40">
                        <td className="py-2.5 px-3.5 font-numeric-data font-bold text-[#012d1d] whitespace-nowrap text-xs">
                          {order.orderId}
                        </td>
                        <td className="py-2.5 px-3.5 text-[#161d1f] font-medium text-xs">
                          {order.client}
                        </td>
                        <td className="py-2.5 px-3.5 text-[#414844] text-xs max-w-[200px] truncate" title={order.productSpec}>
                          {order.productSpec}
                        </td>
                        <td className="py-2.5 px-3.5 font-numeric-data text-right font-bold text-[#ba1a1a] whitespace-nowrap text-xs">
                          -${Math.abs(order.value).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus &&
                              onUpdateOrderStatus(order.id, e.target.value as OrderItem['status'])
                            }
                            className={`inline-flex items-center justify-center w-[132px] px-2 py-1 rounded-full font-label-caps text-[10px] font-bold border cursor-pointer focus:outline-none transition-all shadow-2xs text-center ${
                              order.status === 'Recibido'
                                ? 'bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8] hover:bg-[#a0f4c8]/60'
                                : 'bg-[#eef5f7] text-[#414844] border-[#c1c8c2] hover:bg-[#dde4e6]'
                            }`}
                            title="Marca como Recibido cuando lleguen los insumos"
                          >
                            <option value="Pendiente">Compra Insumos</option>
                            <option value="Recibido">Recibido</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className="inline-flex items-center justify-center w-[132px] px-2 py-1 rounded-full font-label-caps text-[10px] font-bold border bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8]"
                            title={order.paymentMethod ? `Pagado desde ${order.paymentMethod}` : undefined}
                          >
                            Pagado
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            id={`btn-order-summary-${order.id}`}
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-[#eef5f7] hover:bg-[#a0f4c8] text-[#012d1d] hover:text-[#005236] border border-[#c1c8c2] hover:border-[#0e6c4a] transition-all cursor-pointer shadow-2xs group/btn mx-auto"
                            title={`Ver qué se compró en ${order.orderId}`}
                          >
                            <span className="material-symbols-outlined text-[16px] group-hover/btn:scale-115 transition-transform">
                              receipt_long
                            </span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                    <tr
                      key={order.id}
                      className="hover:bg-[#eef5f7]/70 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 font-numeric-data font-bold text-[#012d1d] whitespace-nowrap text-xs">
                        {order.orderId}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#161d1f] font-medium text-xs">
                        {order.client}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#414844] text-xs max-w-[200px] truncate" title={order.productSpec}>
                        {order.productSpec}
                      </td>
                      <td className="py-2.5 px-3.5 font-numeric-data text-right font-bold text-[#161d1f] whitespace-nowrap text-xs">
                        ${order.value.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus &&
                            onUpdateOrderStatus(order.id, e.target.value as OrderItem['status'])
                          }
                          className={`inline-flex items-center justify-center w-[132px] px-2 py-1 rounded-full font-label-caps text-[10px] font-bold border cursor-pointer focus:outline-none transition-all shadow-2xs text-center ${
                            order.status === 'Pendiente'
                              ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] hover:bg-[#fde68a]/60'
                              : order.status === 'En Producción'
                              ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] hover:bg-[#bae6fd]/60'
                              : order.status === 'Terminado'
                              ? 'bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8] hover:bg-[#a0f4c8]/60'
                              : 'bg-[#a0f4c8] text-[#005236] border-[#005236]/20 hover:bg-[#a0f4c8]/80'
                          }`}
                          title="Cambiar estado de la orden"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Producción">En Producción</option>
                          <option value="Terminado">Terminado</option>
                          <option value="Enviado" disabled={order.paymentStatus === 'Pendiente'}>
                            Enviado{order.paymentStatus === 'Pendiente' ? ' (requiere pago)' : ''}
                          </option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            onUpdatePaymentStatus &&
                            onUpdatePaymentStatus(order.id, e.target.value as OrderItem['paymentStatus'])
                          }
                          className={`inline-flex items-center justify-center w-[132px] px-2 py-1 rounded-full font-label-caps text-[10px] font-bold border cursor-pointer focus:outline-none transition-all shadow-2xs text-center ${
                            order.paymentStatus === 'Pendiente'
                              ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] hover:bg-[#fde68a]/60'
                              : order.paymentStatus === 'Abono'
                              ? 'bg-[#ffe4b5] text-[#8a4b00] border-[#ffcd80] hover:bg-[#ffcd80]/60'
                              : 'bg-[#c6ead6] text-[#012d1d] border-[#a0f4c8] hover:bg-[#a0f4c8]/60'
                          }`}
                          title={
                            order.paymentStatus === 'Abono'
                              ? `Abonado: $${(order.amountPaid || 0).toLocaleString()} · Falta: $${(order.value - (order.amountPaid || 0)).toLocaleString()}`
                              : 'Cambiar estado de pago'
                          }
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Abono">Abono</option>
                          <option value="Pagado">Pagado</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            id={`btn-order-summary-${order.id}`}
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-[#eef5f7] hover:bg-[#a0f4c8] text-[#012d1d] hover:text-[#005236] border border-[#c1c8c2] hover:border-[#0e6c4a] transition-all cursor-pointer shadow-2xs group/btn"
                            title={`Ver resumen detallado de la orden ${order.orderId}`}
                          >
                            <span className="material-symbols-outlined text-[16px] group-hover/btn:scale-115 transition-transform">
                              search
                            </span>
                          </button>
                          {onEditOrder && (
                            <button
                              id={`btn-edit-order-${order.id}`}
                              type="button"
                              onClick={() => setOrderToEdit(order)}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-[#eef5f7] hover:bg-[#c1ecd4] text-[#012d1d] hover:text-[#0e6c4a] border border-[#c1c8c2] hover:border-[#0e6c4a] transition-all cursor-pointer shadow-2xs group/btn"
                              title={`Editar la orden ${order.orderId}`}
                            >
                              <span className="material-symbols-outlined text-[16px] group-hover/btn:scale-115 transition-transform">
                                edit
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Detailed Navigation */}
          {filteredOrders.length > 0 && (
            <div className="p-3.5 border-t border-[#c1c8c2] bg-white flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[#525e59]">
              <div>
                Mostrando <span className="font-semibold text-[#012d1d]">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-semibold text-[#012d1d]">{Math.min(safeCurrentPage * itemsPerPage, filteredOrders.length)}</span> de{' '}
                <span className="font-semibold text-[#012d1d]">{filteredOrders.length}</span> órdenes
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-2.5 py-1 border border-[#c1c8c2] rounded-lg hover:bg-[#eef5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-xs"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pageNum === safeCurrentPage
                        ? 'bg-[#012d1d] text-white shadow-xs'
                        : 'border border-[#c1c8c2] hover:bg-[#eef5f7] text-[#414844]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-2.5 py-1 border border-[#c1c8c2] rounded-lg hover:bg-[#eef5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-xs"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary Modal */}
      <OrderSummaryModal
        isOpen={!!selectedOrderForSummary}
        onClose={() => setSelectedOrderId(null)}
        order={selectedOrderForSummary}
        client={matchedClient}
        onUpdateStatus={(orderId, newStatus) => onUpdateOrderStatus && onUpdateOrderStatus(orderId, newStatus)}
        onUpdatePaymentStatus={(orderId, newPaymentStatus) =>
          onUpdatePaymentStatus && onUpdatePaymentStatus(orderId, newPaymentStatus)
        }
        onRequestPayment={(orderId, mode) => onRequestPayment && onRequestPayment(orderId, mode)}
        onEdit={
          onEditOrder
            ? (orderToOpen) => {
                setSelectedOrderId(null);
                setOrderToEdit(orderToOpen);
              }
            : undefined
        }
        onNavigateToCrm={() => onNavigate('sales-crm')}
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!orderToEdit}
        order={orderToEdit}
        inventory={inventory}
        onClose={() => setOrderToEdit(null)}
        onSave={(updated) => {
          onEditOrder && onEditOrder(updated);
          setOrderToEdit(null);
        }}
      />

      {/* Transfer Cash Modal — pasar dinero entre Efectivo y Banco */}
      <TransferCashModal
        isOpen={isTransferCashOpen}
        cashBalance={cashBalance}
        onClose={() => setIsTransferCashOpen(false)}
        onConfirm={(from, to, amount) => onTransferCash && onTransferCash(from, to, amount)}
      />
    </div>
  );
};
