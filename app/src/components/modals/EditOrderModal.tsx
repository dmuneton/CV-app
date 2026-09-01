import React, { useState, useEffect } from 'react';
import { OrderItem, BOMComponent, InventoryItem } from '../../types';
import { isoToLocalDateInputValue, dateInputToIsoNoon } from '../../utils/dateInput';

interface EditOrderModalProps {
  isOpen: boolean;
  order: OrderItem | null;
  inventory?: InventoryItem[];
  onClose: () => void;
  onSave: (updatedOrder: OrderItem) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  order,
  inventory = [],
  onClose,
  onSave
}) => {
  const [client, setClient] = useState('');
  const [productSpec, setProductSpec] = useState('');
  const [value, setValue] = useState<number>(0);
  const [itemsCount, setItemsCount] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [bomComponents, setBomComponents] = useState<BOMComponent[]>([]);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompQty, setNewCompQty] = useState<number>(1);
  const [newCompCost, setNewCompCost] = useState<number>(500);
  const [newCompUnit, setNewCompUnit] = useState('unidad');

  useEffect(() => {
    if (order && isOpen) {
      setClient(order.client);
      setProductSpec(order.productSpec);
      setValue(order.value);
      setItemsCount(order.itemsCount || 1);
      setDeliveryAddress(order.deliveryAddress || '');
      setOrderDate(isoToLocalDateInputValue(order.createdAt));
      setDeliveryDate(order.deliveryDate || '');
      // Deep copy so edits here don't mutate the order until Guardar Cambios is pressed
      setBomComponents(order.bomComponents ? JSON.parse(JSON.stringify(order.bomComponents)) : []);
      setIsAddingComponent(false);
      setNewCompName('');
      setNewCompQty(1);
      setNewCompCost(500);
      setNewCompUnit('unidad');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const baseCost = bomComponents.reduce((acc, item) => acc + item.totalCost, 0);
  const unitSalePrice = itemsCount > 0 ? value / itemsCount : value;

  const handleNewCompNameChange = (nameVal: string) => {
    setNewCompName(nameVal);
    const match = inventory.find((item) => item.name.toLowerCase().trim() === nameVal.toLowerCase().trim());
    if (match) {
      setNewCompCost(match.unitCost);
      setNewCompUnit(match.stockUnit || 'unidad');
    }
  };

  // Not a <form onSubmit> handler on purpose: it used to live in a nested <form>, whose
  // submit bubbled up into the outer form and closed the whole modal prematurely (nested
  // forms are invalid HTML). It's a plain button handler now.
  const handleAddComponent = () => {
    if (!newCompName.trim()) return;

    const newComponent: BOMComponent = {
      id: `bom-${Date.now()}`,
      name: newCompName.trim(),
      qty: newCompQty,
      unitCost: newCompCost,
      totalCost: Math.round(newCompQty * newCompCost),
      unit: newCompUnit || 'unidad'
    };

    setBomComponents((prev) => [...prev, newComponent]);
    setNewCompName('');
    setNewCompQty(1);
    setNewCompCost(500);
    setNewCompUnit('unidad');
    setIsAddingComponent(false);
  };

  const handleRemoveComponent = (id: string) => {
    setBomComponents((prev) => prev.filter((item) => item.id !== id));
  };

  // Quantity per insumo is per-unit-of-product (same convention as Ingeniería de Producto);
  // it gets multiplied by "Cantidad de Unidades" everywhere the batch total is shown.
  const handleUpdateQty = (id: string, deltaOrValue: number, isAbsolute = false) => {
    setBomComponents((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentNum = typeof item.qty === 'number' ? item.qty : parseFloat(item.qty as string) || 1;
        let nextQty = isAbsolute ? deltaOrValue : Math.max(1, currentNum + deltaOrValue);
        nextQty = Math.round(nextQty * 100) / 100;
        const nextTotalCost = Math.round(nextQty * item.unitCost);
        return { ...item, qty: nextQty, totalCost: nextTotalCost };
      })
    );
  };

  // Labor's rate isn't driven by an Inventory catalog like other supplies, so it stays
  // directly editable here too (same convention as Ingeniería de Producto).
  const handleUpdateLaborRate = (id: string, newUnitCost: number) => {
    setBomComponents((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const numQty = typeof item.qty === 'number' ? item.qty : parseFloat(item.qty as string) || 1;
        const nextUnitCost = Math.max(0, newUnitCost);
        return { ...item, unitCost: nextUnitCost, totalCost: Math.round(numQty * nextUnitCost) };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !productSpec.trim()) return;

    // Keep the "date" display label in sync whenever the order date actually changed —
    // otherwise an order re-dated to last month would still show "Hoy, HH:MM".
    const previousOrderDate = isoToLocalDateInputValue(order.createdAt);
    const dateChanged = orderDate !== previousOrderDate;
    const today = isoToLocalDateInputValue(undefined);
    const dateLabel = !dateChanged
      ? order.date
      : orderDate === today
      ? 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(`${orderDate}T12:00:00`).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

    onSave({
      ...order,
      client: client.trim(),
      productSpec: productSpec.trim(),
      value: Number(value),
      itemsCount: Number(itemsCount),
      deliveryAddress: deliveryAddress.trim() || undefined,
      date: dateLabel,
      createdAt: dateInputToIsoNoon(orderDate),
      deliveryDate: deliveryDate || undefined,
      // Save the list whenever there's something in it now — covers both edits to an
      // existing list and insumos added here for the first time.
      bomComponents: bomComponents.length > 0 ? bomComponents : order.bomComponents
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#c1ecd4]">edit_note</span>
            <div>
              <h3 className="font-headline text-lg font-bold">Editar Orden {order.orderId}</h3>
              <p className="text-xs text-[#c1ecd4]/80">Actualiza los datos generales y la lista de insumos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Cliente / Empresa
            </label>
            <input
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Especificación Botánica / Producto
            </label>
            <input
              type="text"
              required
              value={productSpec}
              onChange={(e) => setProductSpec(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Dirección de Entrega / Ciudad
            </label>
            <input
              type="text"
              placeholder="Ej. Calle 100 # 15-20, Bogotá"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Fecha de la Orden
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7] cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Fecha de Entrega
              </label>
              <input
                type="date"
                value={deliveryDate}
                min={orderDate || undefined}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Precio de Venta — Valor Total ($)
              </label>
              <input
                type="number"
                required
                min="0"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
              <p className="text-[10px] text-[#717973] mt-1">
                ≈ ${Math.round(unitSalePrice).toLocaleString()} por unidad
              </p>
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Cantidad de Unidades
              </label>
              <input
                type="number"
                required
                min="1"
                value={itemsCount}
                onChange={(e) => setItemsCount(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>

          {/* Insumos / BOM Editing — orders with more than one producto (added via
              "Añadir Producto" en Órdenes) keep their receta per product in
              order.products instead of this single top-level list, so editing it here
              wouldn't affect what actually gets descontado. */}
          {order.products && order.products.length > 0 ? (
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1.5">
                Insumos por Producto
              </label>
              <div className="space-y-2 bg-[#f4fafd] border border-[#c1c8c2] rounded-lg p-3">
                {order.products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-[#161d1f]">
                    <span className="font-semibold">{p.productName}</span>
                    <span className="text-[#717973]">
                      {p.itemsCount} un. · {p.bomComponents.length} insumos · ${p.unitCost.toLocaleString()}/ud
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#717973] mt-1.5">
                Esta orden tiene varios productos. La receta de insumos de cada uno se edita al confirmar una nueva
                orden — desde aquí solo puedes ajustar los datos generales de arriba.
              </p>
            </div>
          ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-label-caps text-xs text-[#414844]">
                Lista de Insumos (por unidad de producto)
              </label>
              <div className="flex items-center gap-2">
                {bomComponents.length > 0 && (
                  <span className="text-[10px] text-[#717973]">
                    Costo Base: ${baseCost.toLocaleString()} / ud
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingComponent(!isAddingComponent)}
                  className="text-[11px] text-[#0e6c4a] hover:text-[#012d1d] font-semibold flex items-center gap-1 bg-[#F0F9F4] px-2.5 py-1 rounded-lg border border-[#a0f4c8] cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isAddingComponent ? 'close' : 'add'}
                  </span>
                  <span>{isAddingComponent ? 'Cancelar' : 'Añadir Insumo'}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Insumo Inline Form — a plain div, not a <form>: this modal is
                already inside the outer <form>, and a nested <form> here would bubble
                its submit up into the outer one and close the whole modal. */}
            {isAddingComponent && (
              <div className="mb-3 p-3 bg-[#eef5f7] rounded-xl border border-[#c1c8c2] space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block font-label-caps text-[9px] text-[#414844] mb-1">
                      Componente / Insumo
                    </label>
                    <input
                      type="text"
                      list="edit-order-inventory-datalist"
                      value={newCompName}
                      onChange={(e) => handleNewCompNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComponent();
                        }
                      }}
                      placeholder="Escribe o busca un insumo del inventario..."
                      className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2.5 py-1.5 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                    />
                    <datalist id="edit-order-inventory-datalist">
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.name}>
                          ${inv.unitCost.toLocaleString()} ({inv.stockUnit})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-label-caps text-[9px] text-[#414844] mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={newCompQty}
                      onChange={(e) => setNewCompQty(parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-label-caps text-[9px] text-[#414844] mb-1">
                      Costo Unit. ($)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={newCompCost}
                      onChange={(e) => setNewCompCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-label-caps text-[9px] text-[#414844] mb-1">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={newCompUnit}
                      onChange={(e) => setNewCompUnit(e.target.value)}
                      className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddComponent}
                      className="w-full bg-[#012d1d] text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1b4332] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                      title="Agregar insumo"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bomComponents.length === 0 && !isAddingComponent && (
              <p className="text-xs text-[#717973] italic bg-[#f4fafd] p-3 rounded-lg border border-[#c1c8c2]">
                Esta orden no tiene insumos vinculados todavía. Usa "Añadir Insumo" para registrar los que necesites.
              </p>
            )}

            {bomComponents.length > 0 && (
              <div className="border border-[#c1c8c2] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[440px]">
                    <thead>
                      <tr className="bg-[#F0F9F4] border-b border-[#c1c8c2] font-label-caps text-[10px] text-[#414844]">
                        <th className="py-2 px-3 font-semibold">Insumo</th>
                        <th className="py-2 px-3 font-semibold text-right">Cantidad</th>
                        <th className="py-2 px-3 font-semibold text-right">Costo Unit.</th>
                        <th className="py-2 px-3 font-semibold text-right">Costo Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-[#c1c8c2]/50">
                      {bomComponents.map((item) => (
                        <tr
                          key={item.id}
                          className={item.isLabor ? 'bg-[#e8eff1]/60 font-medium' : ''}
                        >
                          <td className="py-2 px-3 text-[#161d1f]">
                            <span className="flex items-center gap-1.5">
                              {item.isLabor && (
                                <span className="material-symbols-outlined text-[14px] text-[#0e6c4a]">
                                  engineering
                                </span>
                              )}
                              <span>{item.name}</span>
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <div className="flex items-center bg-white border border-[#c1c8c2] rounded-md shadow-2xs hover:border-[#0e6c4a] transition-colors overflow-hidden">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      handleUpdateQty(item.id, val, true);
                                    }
                                  }}
                                  className="w-14 px-1.5 py-1 text-xs text-right font-numeric-data text-[#161d1f] focus:outline-none bg-transparent"
                                />
                                <div className="flex flex-col border-l border-[#c1c8c2]/60 bg-[#F0F9F4] w-4.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.id, 1)}
                                    className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer border-b border-[#c1c8c2]/40"
                                    title="Aumentar en 1"
                                  >
                                    <span className="material-symbols-outlined text-[12px] leading-none">expand_less</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQty(item.id, -1)}
                                    disabled={Number(item.qty) <= 1}
                                    className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                                    title="Disminuir en 1"
                                  >
                                    <span className="material-symbols-outlined text-[12px] leading-none">expand_more</span>
                                  </button>
                                </div>
                              </div>
                              {item.unit && (
                                <span className="text-[10px] text-[#717975] max-w-[36px] truncate" title={item.unit}>
                                  {item.unit}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            {item.isLabor ? (
                              <div className="inline-flex items-center justify-end gap-0.5 bg-white border border-[#c1c8c2] rounded-md shadow-2xs hover:border-[#0e6c4a] transition-colors overflow-hidden">
                                <span className="pl-2 text-[#717975] text-[11px]">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="500"
                                  value={item.unitCost}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      handleUpdateLaborRate(item.id, val);
                                    }
                                  }}
                                  className="w-14 pr-1.5 py-1 text-xs text-right font-numeric-data text-[#414844] focus:outline-none bg-transparent"
                                  title="Editar el precio estándar de la mano de obra"
                                />
                              </div>
                            ) : item.unitCost > 0 ? (
                              <span className="font-numeric-data text-[#414844]">
                                ${item.unitCost.toLocaleString()}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-right font-numeric-data font-semibold text-[#012d1d]">
                            ${item.totalCost.toLocaleString()}
                          </td>
                          <td className="py-1.5 px-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(item.id)}
                              className="text-[#717973] hover:text-[#ba1a1a] p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                              title="Quitar insumo"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold text-[#012d1d] border-t-2 border-[#717973] bg-[#f4fafd]">
                        <td className="py-2 px-3 text-right font-headline text-xs" colSpan={3}>
                          Costo Total del Lote (x{itemsCount}):
                        </td>
                        <td className="py-2 px-3 text-right font-numeric-data text-sm font-bold text-[#012d1d]" colSpan={2}>
                          ${Math.round(baseCost * itemsCount).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            {bomComponents.length > 0 && (
              <p className="text-[11px] text-[#717973] mt-1.5">
                Si esta orden ya descontó inventario, el ajuste de cantidades e insumos aquí también ajustará el stock correspondiente.
              </p>
            )}
          </div>
          )}

          <p className="text-[11px] text-[#717973] bg-[#f4fafd] border border-[#c1c8c2] rounded-lg p-2.5">
            El estado de producción y el estado de pago se administran desde sus propios selectores,
            no desde este formulario.
          </p>

          <div className="pt-4 border-t border-[#c1c8c2] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
