import React, { useState } from 'react';
import { BOMComponent, ClientProfile, OrderItem, OrderProductLine } from '../../types';

// One product coming from Órdenes — the main recipe plus any block added via
// "Añadir Producto" that has at least one insumo.
export interface ConfirmOrderProductInput {
  id: string;
  name: string;
  bomList: BOMComponent[];
  unitCost: number;
  salePrice: number;
}

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ConfirmOrderProductInput[];
  existingClients: ClientProfile[];
  onConfirmOrder: (
    order: OrderItem,
    clientData: {
      isExisting: boolean;
      clientId?: string;
      newClient?: Partial<ClientProfile>;
    },
    navigateToCrm?: boolean
  ) => void;
}

// Editable per-product line inside the modal: name, units to produce and unit sale price.
interface OrderLineDraft {
  id: string;
  productName: string;
  units: number;
  salePrice: number;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  existingClients,
  onConfirmOrder,
}) => {
  const [lines, setLines] = useState<OrderLineDraft[]>([]);
  const [orderStatus, setOrderStatus] = useState<'Pendiente' | 'En Producción' | 'Terminado' | 'Enviado'>('Pendiente');

  // Client selection mode: 'existing' | 'new'
  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    existingClients.length > 0 ? 'existing' : 'new'
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(existingClients[0]?.id || '');

  // Form fields for new or selected client
  const [clientName, setClientName] = useState<string>('');
  const [clientRole, setClientRole] = useState<string>('Persona');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [redirectToCrm, setRedirectToCrm] = useState<boolean>(true);

  // Sync with selected existing client
  React.useEffect(() => {
    if (clientMode === 'existing' && selectedClientId) {
      const match = existingClients.find((c) => c.id === selectedClientId);
      if (match) {
        setClientName(match.name);
        setClientRole(match.role === 'Empresa' ? 'Empresa' : 'Persona');
        setClientEmail(match.email || '');
        setClientPhone(match.phone || '');
        // Suggested from the client's stored address — still editable per order,
        // since a given order may ship somewhere else.
        setClientAddress(match.address || '');
      }
    } else if (clientMode === 'new') {
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientRole('Persona');
      setClientAddress('');
    }
  }, [clientMode, selectedClientId, existingClients]);

  // Rebuild the editable line list from the current recipe(s) whenever the modal opens.
  React.useEffect(() => {
    if (isOpen) {
      setLines(
        products.map((p) => ({
          id: p.id,
          productName: p.name || 'Producto Personalizado',
          units: 1,
          salePrice: p.salePrice || p.unitCost * 1.5 || 25000,
        }))
      );
      setOrderStatus('Pendiente');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const updateLine = (id: string, patch: Partial<OrderLineDraft>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const getSource = (id: string) => products.find((p) => p.id === id);

  const totalCost = lines.reduce((acc, l) => acc + (getSource(l.id)?.unitCost || 0) * l.units, 0);
  const totalSale = lines.reduce((acc, l) => acc + l.salePrice * l.units, 0);
  const totalUnits = lines.reduce((acc, l) => acc + l.units, 0);
  const grossProfit = totalSale - totalCost;
  const profitMargin = totalSale > 0 ? (grossProfit / totalSale) * 100 : 0;
  const isMultiProduct = lines.length > 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalClientName = clientMode === 'existing'
      ? (existingClients.find((c) => c.id === selectedClientId)?.name || clientName || 'Cliente Anónimo')
      : (clientName.trim() || 'Nuevo Cliente');

    const productLines: OrderProductLine[] = lines.map((line) => {
      const source = getSource(line.id);
      return {
        id: line.id,
        productName: line.productName.trim() || 'Producto Personalizado',
        itemsCount: line.units,
        salePrice: line.salePrice,
        unitCost: source?.unitCost || 0,
        bomComponents: JSON.parse(JSON.stringify(source?.bomList || [])),
      };
    });

    const combinedProductSpec = productLines
      .map((l) => `${l.productName} (x${l.itemsCount} un.)`)
      .join(' + ');

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      client: finalClientName,
      productSpec: combinedProductSpec,
      value: totalSale,
      status: orderStatus,
      paymentStatus: 'Pendiente',
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      itemsCount: totalUnits,
      // Multi-product orders carry their breakdown here — see OrderItem.products.
      // A single-product order also gets one entry, so downstream deduction/cost
      // logic only needs to handle one code path.
      products: productLines,
      inventoryDeducted: false,
      deliveryAddress: clientAddress.trim() || undefined,
    };

    const matchedClient = clientMode === 'existing' ? existingClients.find((c) => c.id === selectedClientId) : undefined;

    const clientPayload = {
      isExisting: clientMode === 'existing',
      clientId: clientMode === 'existing' ? selectedClientId : undefined,
      newClient: {
        name: finalClientName,
        role: clientRole,
        tier: matchedClient?.tier || 'Estándar',
        email: clientEmail || `${finalClientName.toLowerCase().replace(/\s+/g, '.')}@cliente.com`,
        phone: clientPhone || '+57 300 000 0000',
        // Only used to seed a brand-new client's profile — an existing client's stored
        // address is never overwritten just because this one order ships elsewhere.
        address: clientAddress.trim(),
      },
    };

    onConfirmOrder(newOrder, clientPayload, redirectToCrm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
            </div>
            <div>
              <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                Confirmar Orden de Producción
              </h3>
              <p className="text-xs text-[#a0f4c8] mt-0.5">
                {isMultiProduct
                  ? `Valida los ${lines.length} productos, sus recetas y el precio de venta antes de vincular al cliente.`
                  : 'Valida la receta de insumos, el precio de venta y vincula los datos del cliente con el CRM.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          {/* Product Lines */}
          <div className="space-y-3">
            {lines.map((line, idx) => {
              const source = getSource(line.id);
              const bomList = source?.bomList || [];
              const unitCost = source?.unitCost || 0;
              const lineTotalCost = unitCost * line.units;
              const lineTotalSale = line.salePrice * line.units;
              const lineMargin = lineTotalSale > 0 ? ((lineTotalSale - lineTotalCost) / lineTotalSale) * 100 : 0;

              return (
                <div key={line.id} className="bg-[#f4fafd] p-4 rounded-xl border border-[#c1c8c2] space-y-3">
                  {isMultiProduct && (
                    <div className="font-label-caps text-[10px] font-bold text-[#0e6c4a]">
                      Producto {idx + 1}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Product & Quantity */}
                    <div className="md:col-span-7 space-y-3">
                      <div>
                        <label className="block font-label-caps text-[11px] font-bold text-[#012d1d] mb-1">
                          Producto / Especificación
                        </label>
                        <input
                          type="text"
                          required
                          value={line.productName}
                          onChange={(e) => updateLine(line.id, { productName: e.target.value })}
                          className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs font-semibold text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                          placeholder="Ej. Agenda Botánica Argolla Lateral"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Units */}
                        <div>
                          <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                            Unidades a Producir
                          </label>
                          <div className="flex items-center bg-white border border-[#c1c8c2] rounded-lg overflow-hidden focus-within:border-[#0e6c4a]">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={line.units}
                              onChange={(e) => updateLine(line.id, { units: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full px-2.5 py-1.5 text-xs font-numeric-data font-bold text-[#161d1f] focus:outline-none"
                            />
                            <div className="flex flex-col border-l border-[#c1c8c2]/60 bg-[#F0F9F4] w-5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateLine(line.id, { units: line.units + 1 })}
                                className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer border-b border-[#c1c8c2]/40"
                              >
                                <span className="material-symbols-outlined text-[12px]">expand_less</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateLine(line.id, { units: Math.max(1, line.units - 1) })}
                                disabled={line.units <= 1}
                                className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer disabled:opacity-25"
                              >
                                <span className="material-symbols-outlined text-[12px]">expand_more</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Unit Sale Price */}
                        <div>
                          <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                            Precio Venta Unitario ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717973] font-semibold text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              required
                              value={line.salePrice}
                              onChange={(e) => updateLine(line.id, { salePrice: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-white border border-[#c1c8c2] rounded-lg pl-6 pr-2 py-1.5 text-xs font-numeric-data font-bold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Projection Card */}
                    <div className="md:col-span-5 bg-white p-3.5 rounded-xl border border-[#c1c8c2] flex flex-col justify-between shadow-2xs">
                      <div className="space-y-1.5 pb-2 border-b border-[#c1c8c2]/50">
                        <div className="flex justify-between text-[#525e59]">
                          <span>Costo Unitario (BOM):</span>
                          <span className="font-numeric-data font-semibold text-[#161d1f]">
                            ${unitCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#525e59]">
                          <span>Costo Total Lote:</span>
                          <span className="font-numeric-data font-semibold text-[#161d1f]">
                            ${lineTotalCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#525e59]">
                          <span>Margen Proyectado:</span>
                          <span className={`font-numeric-data font-bold ${lineMargin >= 25 ? 'text-[#0e6c4a]' : 'text-[#ba1a1a]'}`}>
                            {lineMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-[10px] font-label-caps text-[#414844] uppercase tracking-wider">
                          Valor de la Venta:
                        </div>
                        <div className="font-numeric-data text-lg font-bold text-[#012d1d]">
                          ${lineTotalSale.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible BOM Preview */}
                  <div className="bg-[#fafcfb] border border-[#c1c8c2] rounded-xl p-3">
                    <div className="flex items-center justify-between font-label-caps text-[11px] font-bold text-[#012d1d] mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">inventory_2</span>
                        <span>Insumos Confirmados ({bomList.length} ítems)</span>
                      </div>
                      <span className="text-[10px] font-normal text-[#525e59]">
                        Costo Base: ${unitCost.toLocaleString()} / ud
                      </span>
                    </div>
                    <div className="max-h-24 overflow-y-auto divide-y divide-[#c1c8c2]/40 text-[11px]">
                      {bomList.length === 0 && (
                        <p className="text-[11px] text-[#717973] italic py-1">Sin insumos registrados.</p>
                      )}
                      {bomList.map((item) => (
                        <div key={item.id} className="py-1 flex items-center justify-between text-[#414844]">
                          <span className="truncate pr-2">{item.name}</span>
                          <div className="flex items-center gap-3 shrink-0 font-numeric-data">
                            <span className="text-[#717975] text-[10px]">
                              {item.qty} {item.unit || ''}
                            </span>
                            <span className="font-semibold text-[#161d1f]">
                              ${item.totalCost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Summary — only meaningful with more than one product */}
          {isMultiProduct && (
            <div className="bg-[#012d1d] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a0f4c8]">functions</span>
                <span className="text-xs font-semibold text-[#c1ecd4]">Resumen combinado ({lines.length} productos, {totalUnits} unidades)</span>
              </div>
              <div className="flex items-center gap-5 text-xs">
                <span>Costo total: <strong className="font-numeric-data">${totalCost.toLocaleString()}</strong></span>
                <span className={`font-bold ${profitMargin >= 25 ? 'text-[#a0f4c8]' : 'text-[#ffb4ab]'}`}>
                  Margen: {profitMargin.toFixed(1)}%
                </span>
                <span className="font-numeric-data text-sm font-bold">${totalSale.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Section: Customer Data (CRM Sync) */}
          <div className="border border-[#c1c8c2] rounded-xl p-4 space-y-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c1c8c2]/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e6c4a] text-lg">person_pin</span>
                <h4 className="font-headline text-sm font-bold text-[#012d1d]">
                  Datos del Cliente (Sincronización CRM)
                </h4>
              </div>

              {/* Segmented control: Existing vs New Client */}
              <div className="flex items-center bg-[#eef5f7] p-0.5 rounded-lg border border-[#c1c8c2]">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    clientMode === 'existing'
                      ? 'bg-white text-[#012d1d] shadow-2xs'
                      : 'text-[#414844] hover:text-[#012d1d]'
                  }`}
                >
                  Cliente Existente
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    clientMode === 'new'
                      ? 'bg-white text-[#012d1d] shadow-2xs'
                      : 'text-[#414844] hover:text-[#012d1d]'
                  }`}
                >
                  + Nuevo Cliente
                </button>
              </div>
            </div>

            {/* Existing Client Selector */}
            {clientMode === 'existing' && (
              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Seleccionar Cliente del CRM
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs font-semibold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                >
                  {existingClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role || 'Cliente'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Client Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Nombre Completo / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Boutique Flores S.A.S. o Juan Pérez"
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+57 312 458 9920"
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Rol
                </label>
                <select
                  value={clientRole}
                  onChange={(e) => setClientRole(e.target.value)}
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                >
                  <option value="Persona">Persona</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Estado Inicial de la Orden
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as any)}
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs font-semibold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Producción">En Producción</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Enviado" disabled>Enviado (requiere pago)</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                  Dirección de Entrega / Ciudad
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Ej. Calle 100 # 15-20, Bogotá"
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1">
                Notas / Requerimientos Especiales
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Ej. Empaque ecológico individual con semilla"
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
              />
            </div>
          </div>

          {/* Navigation Option */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="chk-redirect-crm"
              checked={redirectToCrm}
              onChange={(e) => setRedirectToCrm(e.target.checked)}
              className="accent-[#0e6c4a] w-4 h-4 cursor-pointer rounded"
            />
            <label htmlFor="chk-redirect-crm" className="text-xs text-[#414844] cursor-pointer">
              Ir automáticamente a la pestaña <strong>CRM Clientes</strong> para ver el cliente actualizado tras confirmar
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#c1c8c2]/60 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#525e59]">
              Total Orden: <strong className="text-[#012d1d] font-numeric-data text-sm">${totalSale.toLocaleString()}</strong> ({totalUnits} unidades{isMultiProduct ? `, ${lines.length} productos` : ''})
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-submit-confirm-order"
                className="px-5 py-2.5 bg-[#012d1d] hover:bg-[#0e6c4a] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Confirmar Orden</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
