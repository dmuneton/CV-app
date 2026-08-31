import React from 'react';
import { ClientProfile, OrderItem } from '../../types';
import {
  getClientOrders,
  getClientPurchaseCount,
  getClientTier,
  getClientTotalPurchased
} from '../../utils/clientPurchases';

interface ClientDetailModalProps {
  isOpen: boolean;
  client: ClientProfile | null;
  orders?: OrderItem[];
  onClose: () => void;
  onEdit?: (client: ClientProfile) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  client,
  orders = [],
  onClose,
  onEdit,
  onSelectOrder
}) => {
  if (!isOpen || !client) return null;

  const clientOrders = getClientOrders(client, orders);
  const purchaseCount = getClientPurchaseCount(client, orders);
  const tier = getClientTier(purchaseCount);
  const totalPurchased = getClientTotalPurchased(client, orders);

  // Synchronize registered orders with client legacy purchases
  const allPurchases = [
    ...clientOrders.map((ord) => ({
      id: ord.id,
      orderId: ord.orderId,
      item: ord.productSpec,
      date: ord.date,
      amount: ord.value,
      status: ord.status,
      paymentStatus: ord.paymentStatus,
      isRealOrder: true
    })),
    ...(client.purchases || [])
      .filter(
        (p) =>
          !clientOrders.some(
            (co) =>
              co.productSpec.toLowerCase().includes(p.item.toLowerCase()) ||
              p.item.toLowerCase().includes(co.productSpec.toLowerCase())
          )
      )
      .map((p, idx) => ({
        id: `hist-${idx}`,
        orderId: undefined,
        item: p.item,
        date: p.date,
        amount: p.amount,
        status: 'Terminado' as const,
        paymentStatus: 'Pagado' as const,
        isRealOrder: false
      }))
  ];

  const averageTicket = purchaseCount > 0 ? Math.round(totalPurchased / purchaseCount) : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 sm:p-6 flex justify-between items-start shrink-0 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#c1ecd4]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center font-headline text-xl font-bold shrink-0 shadow-md border border-white/20 ${
                tier === 'VIP'
                  ? 'bg-[#ffdcc4] text-[#5f2f00]'
                  : tier === 'Recurrente'
                  ? 'bg-[#a0f4c8] text-[#005236]'
                  : 'bg-[#e0f2fe] text-[#0369a1]'
              }`}
            >
              {client.initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline text-xl sm:text-2xl font-bold text-white leading-tight">
                  {client.name}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-label-caps text-[11px] font-bold border ${
                    tier === 'VIP'
                      ? 'bg-[#ffdcc4]/90 text-[#5f2f00] border-[#ffb781]'
                      : tier === 'Recurrente'
                      ? 'bg-[#a0f4c8]/90 text-[#005236] border-[#0e6c4a]'
                      : 'bg-[#e0f2fe]/90 text-[#0369a1] border-[#bae6fd]'
                  }`}
                >
                  {tier === 'VIP' && '⭐ '}
                  {tier === 'Recurrente' && '🔁 '}
                  {tier === 'Nuevo' && '🌱 '}
                  {tier}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white font-label-caps text-[11px] font-semibold border border-white/20">
                  {client.role}
                </span>
              </div>
              <p className="text-xs text-[#c1ecd4]/80 mt-1">
                Ficha completa del cliente y registro comercial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            title="Cerrar ficha"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Contact Information Cards */}
          <div>
            <h4 className="font-label-caps text-xs text-[#414844] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">contacts</span>
              <span>Datos de Contacto y Ubicación</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3 rounded-xl bg-[#f4fafd] border border-[#c1c8c2] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#0e6c4a] border border-[#c1c8c2] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-label-caps text-[10px] text-[#717973] uppercase">
                      Correo Electrónico
                    </span>
                    {client.email ? (
                      <span className="text-xs font-semibold text-[#161d1f] truncate block" title={client.email}>
                        {client.email}
                      </span>
                    ) : (
                      <span className="text-xs text-[#717973] italic">No registrado</span>
                    )}
                  </div>
                </div>

                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="p-1.5 rounded-md bg-white hover:bg-[#c1ecd4]/40 text-[#012d1d] border border-[#c1c8c2] transition-colors shrink-0"
                    title="Enviar correo"
                  >
                    <span className="material-symbols-outlined text-[15px]">send</span>
                  </a>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div className="p-3 rounded-xl bg-[#f4fafd] border border-[#c1c8c2] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#0e6c4a] border border-[#c1c8c2] shrink-0">
                    <span className="material-symbols-outlined text-[18px]">phone</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-label-caps text-[10px] text-[#717973] uppercase">
                      Teléfono / WhatsApp
                    </span>
                    {client.phone ? (
                      <span className="text-xs font-semibold text-[#161d1f] truncate block">
                        {client.phone}
                      </span>
                    ) : (
                      <span className="text-xs text-[#717973] italic">No registrado</span>
                    )}
                  </div>
                </div>

                {client.phone && (
                  <a
                    href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-[#a0f4c8]/50 hover:bg-[#a0f4c8] text-[#005236] border border-[#0e6c4a]/30 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-semibold"
                    title="Chatear en WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-[#f4fafd] border border-[#c1c8c2] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#0e6c4a] border border-[#c1c8c2] shrink-0">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-label-caps text-[10px] text-[#717973] uppercase">
                    Dirección de Entrega Predeterminada
                  </span>
                  {client.address ? (
                    <span className="text-xs font-semibold text-[#161d1f] block">
                      {client.address}
                    </span>
                  ) : (
                    <span className="text-xs text-[#717973] italic">
                      No registrada (se solicitará al crear una orden)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary KPI Cards */}
          <div>
            <h4 className="font-label-caps text-xs text-[#414844] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">monitoring</span>
              <span>Resumen Financiero y Actividad</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#c1ecd4]/25 border border-[#0e6c4a]/30">
                <span className="block font-label-caps text-[10px] text-[#005236] font-bold uppercase">
                  Total Facturado
                </span>
                <span className="font-numeric-data font-bold text-lg text-[#012d1d] block mt-0.5">
                  ${totalPurchased.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f4fafd] border border-[#c1c8c2]">
                <span className="block font-label-caps text-[10px] text-[#717973] font-bold uppercase">
                  Órdenes Totales
                </span>
                <span className="font-numeric-data font-bold text-lg text-[#012d1d] block mt-0.5">
                  {purchaseCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f4fafd] border border-[#c1c8c2]">
                <span className="block font-label-caps text-[10px] text-[#717973] font-bold uppercase">
                  Ticket Promedio
                </span>
                <span className="font-numeric-data font-bold text-lg text-[#012d1d] block mt-0.5">
                  ${averageTicket.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Affinity & Client Insights (if available) */}
          {client.affinity && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#f4fafd] to-[#e8f5e9] border border-[#c1c8c2]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[#0e6c4a] text-lg">psychology</span>
                <h5 className="font-headline text-xs font-bold text-[#012d1d]">
                  {client.affinity.title || 'Perfil de Preferencias'}
                </h5>
              </div>
              <p className="text-xs text-[#414844] mb-2 leading-relaxed">
                {client.affinity.description}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#c1c8c2]/50 text-[11px]">
                <span className="text-[#0e6c4a] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                  <span>{client.affinity.recommendation}</span>
                </span>
                <span className="text-[#717973] font-medium">
                  {client.affinity.probability}
                </span>
              </div>
            </div>
          )}

          {/* Purchases History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-label-caps text-xs text-[#414844] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">history</span>
                <span>Historial de Órdenes y Compras ({allPurchases.length})</span>
              </h4>
            </div>

            {allPurchases.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#f4fafd] border border-[#c1c8c2] text-center text-xs text-[#717973]">
                Este cliente no registra órdenes ni compras previas en el sistema.
              </div>
            ) : (
              <div className="border border-[#c1c8c2] rounded-xl overflow-hidden max-h-[240px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4fafd] text-[#414844] font-label-caps border-b border-[#c1c8c2] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Orden / Producto</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Monto</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c1c8c2]/50">
                    {allPurchases.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-[#f4fafd]/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            {p.orderId && (
                              <span className="font-numeric-data font-bold text-[10px] text-[#012d1d]">
                                {p.orderId}
                              </span>
                            )}
                            <span className="font-semibold text-[#161d1f] truncate max-w-[180px]" title={p.item}>
                              {p.item}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#717973] whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="py-2.5 px-3">
                          {p.status && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-[9px] font-bold ${
                                p.status === 'Pendiente'
                                  ? 'bg-[#fef3c7] text-[#92400e]'
                                  : p.status === 'En Producción'
                                  ? 'bg-[#e0f2fe] text-[#0369a1]'
                                  : p.status === 'Terminado'
                                  ? 'bg-[#c6ead6] text-[#012d1d]'
                                  : 'bg-[#a0f4c8] text-[#005236]'
                              }`}
                            >
                              {p.status}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-numeric-data font-bold text-[#0e6c4a]">
                          ${p.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {p.isRealOrder && onSelectOrder ? (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectOrder(p.id);
                              }}
                              className="p-1 rounded hover:bg-[#a0f4c8] text-[#012d1d] border border-[#c1c8c2] transition-colors cursor-pointer"
                              title="Ver detalle completo de la orden"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#717973]">Histórico</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#c1c8c2] bg-[#f4fafd] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(client)}
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar Información</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
