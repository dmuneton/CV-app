import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';

export interface RestockEntry {
  itemId: string;
  purchaseQty: number;
  purchasePrice: number;
  provider: string;
}

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  criticalItems: InventoryItem[];
  providers: string[];
  onConfirmRestock: (entries: RestockEntry[], paymentMethod: 'Efectivo' | 'Banco') => void;
}

interface RowState {
  included: boolean;
  purchaseQty: number;
  purchasePrice: number;
  provider: string;
  useNewProvider: boolean;
  newProviderName: string;
}

const NEW_PROVIDER_VALUE = '__new__';
const ADD_ITEM_PLACEHOLDER = '__pick__';

// Suggests a purchase quantity that brings stock comfortably above the critical
// threshold (double the minimum), never less than 1.
const suggestQty = (item: InventoryItem) => {
  const suggestion = Math.round((item.minStock * 2 - item.stock) * 100) / 100;
  return Math.max(1, suggestion);
};

const seedRowFor = (item: InventoryItem): RowState => {
  const qty = suggestQty(item);
  return {
    included: true,
    purchaseQty: qty,
    purchasePrice: Math.round(qty * item.unitCost),
    provider: item.provider || '',
    useNewProvider: false,
    newProviderName: ''
  };
};

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  inventory,
  criticalItems,
  providers,
  onConfirmRestock
}) => {
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('Pedido urgente para abastecimiento semanal.');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Banco'>('Efectivo');

  // Re-seed every row whenever the modal opens, defaulting each insumo to its last
  // known provider and a suggested quantity/price based on its current unit cost.
  useEffect(() => {
    if (!isOpen) return;
    const seeded: Record<string, RowState> = {};
    criticalItems.forEach((item) => {
      seeded[item.id] = seedRowFor(item);
    });
    setRows(seeded);
    setManualIds([]);
    setNotes('Pedido urgente para abastecimiento semanal.');
    setPaymentMethod('Efectivo');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const criticalIds = new Set(criticalItems.map((i) => i.id));
  const listedItems = [
    ...criticalItems,
    ...manualIds
      .map((id) => inventory.find((i) => i.id === id))
      .filter((i): i is InventoryItem => !!i)
  ];

  // Anything not archived, not already critical, and not already added manually —
  // this is what "+ Añadir Insumo" offers, so you can top up stock that isn't low yet.
  const addableItems = inventory.filter(
    (item) => !item.isArchived && !criticalIds.has(item.id) && !manualIds.includes(item.id)
  );

  const updateRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const addManualItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    setManualIds((prev) => [...prev, id]);
    setRows((prev) => ({ ...prev, [id]: seedRowFor(item) }));
  };

  const removeManualItem = (id: string) => {
    setManualIds((prev) => prev.filter((i) => i !== id));
    setRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const includedEntries = listedItems
    .filter((item) => rows[item.id]?.included)
    .map((item) => {
      const row = rows[item.id];
      const provider = row.useNewProvider ? row.newProviderName.trim() : row.provider;
      return { item, row, provider };
    });

  const totalSelected = includedEntries.length;
  const totalCost = includedEntries.reduce((acc, { row }) => acc + (row.purchasePrice || 0), 0);
  const canSubmit =
    totalSelected > 0 && includedEntries.every(({ row, provider }) => row.purchaseQty > 0 && provider.trim());

  const handleConfirm = () => {
    if (!canSubmit) return;
    const entries: RestockEntry[] = includedEntries.map(({ item, row, provider }) => ({
      itemId: item.id,
      purchaseQty: row.purchaseQty,
      purchasePrice: row.purchasePrice,
      provider: provider.trim()
    }));
    onConfirmRestock(entries, paymentMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1b4332] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#a0f4c8]">
              add_shopping_cart
            </span>
            <div>
              <h3 className="font-headline text-lg font-bold">Generar Orden de Reabastecimiento</h3>
              <p className="text-xs text-[#c1ecd4]/80">
                Ajusta cantidad, valor de compra y proveedor de cada insumo antes de confirmar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {listedItems.length === 0 ? (
            <p className="text-xs text-[#717973] italic py-2">
              No hay insumos con stock crítico en este momento. Usa "Añadir Insumo" para reabastecer algo más.
            </p>
          ) : (
            <div className="space-y-3">
              {listedItems.map((item) => {
                const row = rows[item.id];
                if (!row) return null;
                const isCritical = criticalIds.has(item.id);
                const unitCost =
                  row.purchaseQty > 0 ? row.purchasePrice / row.purchaseQty : 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      row.included
                        ? 'bg-white border-[#c1c8c2] shadow-2xs'
                        : 'bg-[#f4fafd] border-[#c1c8c2]/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) => updateRow(item.id, { included: e.target.checked })}
                          className="accent-[#012d1d] w-4 h-4 rounded mt-0.5 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#161d1f] flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {!isCritical && (
                              <span className="px-1.5 py-0.5 rounded font-label-caps text-[8px] font-bold bg-[#eef5f7] text-[#0369a1] border border-[#bae6fd]">
                                Añadido
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#717973]">
                            {item.category} · {item.leadTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold font-numeric-data whitespace-nowrap ${
                            isCritical ? 'text-[#ba1a1a]' : 'text-[#414844]'
                          }`}
                        >
                          Stock: {item.stock} {item.stockUnit} (mín. {item.minStock})
                        </span>
                        {!isCritical && (
                          <button
                            type="button"
                            onClick={() => removeManualItem(item.id)}
                            className="text-[#717973] hover:text-[#ba1a1a] p-0.5 rounded transition-colors cursor-pointer"
                            title="Quitar de la lista"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                      <div>
                        <label className="block font-label-caps text-[9px] text-[#414844] font-semibold mb-0.5">
                          Cantidad a Comprar
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!row.included}
                          value={row.purchaseQty}
                          onChange={(e) =>
                            updateRow(item.id, { purchaseQty: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7] disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block font-label-caps text-[9px] text-[#414844] font-semibold mb-0.5">
                          Valor de la Compra ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          disabled={!row.included}
                          value={row.purchasePrice}
                          onChange={(e) =>
                            updateRow(item.id, { purchasePrice: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7] disabled:opacity-50"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block font-label-caps text-[9px] text-[#414844] font-semibold mb-0.5">
                          Proveedor
                        </label>
                        {row.useNewProvider ? (
                          <input
                            type="text"
                            autoFocus
                            disabled={!row.included}
                            placeholder="Nombre del proveedor"
                            value={row.newProviderName}
                            onChange={(e) => updateRow(item.id, { newProviderName: e.target.value })}
                            className="w-full bg-[#f4fafd] border border-[#0e6c4a] rounded-lg px-2 py-1.5 text-xs text-[#161d1f] focus:outline-none disabled:opacity-50"
                          />
                        ) : (
                          <select
                            disabled={!row.included}
                            value={row.provider}
                            onChange={(e) => {
                              if (e.target.value === NEW_PROVIDER_VALUE) {
                                updateRow(item.id, { useNewProvider: true, newProviderName: '' });
                              } else {
                                updateRow(item.id, { provider: e.target.value });
                              }
                            }}
                            className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-2 py-1.5 text-xs text-[#161d1f] focus:outline-none focus:border-[#0284c7] disabled:opacity-50 cursor-pointer"
                          >
                            {!providers.includes(row.provider) && row.provider && (
                              <option value={row.provider}>{row.provider}</option>
                            )}
                            {providers.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                            <option value={NEW_PROVIDER_VALUE}>+ Nuevo proveedor…</option>
                          </select>
                        )}
                        {row.useNewProvider && (
                          <button
                            type="button"
                            onClick={() => updateRow(item.id, { useNewProvider: false })}
                            className="text-[9px] text-[#0e6c4a] hover:underline mt-0.5 cursor-pointer"
                          >
                            Elegir de la lista
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block font-label-caps text-[9px] text-[#414844] font-semibold mb-0.5">
                          Costo Unitario
                        </label>
                        <div className="w-full bg-[#F0F9F4] border border-[#a0f4c8] rounded-lg px-2 py-1.5 text-xs font-numeric-data font-bold text-[#0e6c4a]">
                          ${unitCost.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add a non-critical insumo */}
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Añadir Otro Insumo
            </label>
            <select
              value={ADD_ITEM_PLACEHOLDER}
              onChange={(e) => {
                if (e.target.value !== ADD_ITEM_PLACEHOLDER) addManualItem(e.target.value);
              }}
              disabled={addableItems.length === 0}
              className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-xs text-[#414844] focus:outline-none focus:border-[#0e6c4a] disabled:opacity-50 cursor-pointer"
            >
              <option value={ADD_ITEM_PLACEHOLDER}>
                {addableItems.length === 0
                  ? 'No hay más insumos disponibles para añadir'
                  : '+ Elegir un insumo para reabastecer…'}
              </option>
              {addableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Stock: {item.stock} {item.stockUnit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Notas / Instrucciones de Entrega
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg p-2.5 text-xs text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Pago Sale De
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Efectivo'
                      ? 'border-[#0e6c4a] bg-[#f0f9f4] text-[#012d1d]'
                      : 'border-[#c1c8c2] text-[#414844] hover:border-[#0e6c4a]/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Banco')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Banco'
                      ? 'border-[#0e6c4a] bg-[#f0f9f4] text-[#012d1d]'
                      : 'border-[#c1c8c2] text-[#414844] hover:border-[#0e6c4a]/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span>Banco</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#c1c8c2] bg-[#f8faf9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#525e59]">
            Total:{' '}
            <strong className="text-[#ba1a1a] font-numeric-data">
              -${Math.round(totalCost).toLocaleString()}
            </strong>{' '}
            ({totalSelected} {totalSelected === 1 ? 'insumo' : 'insumos'}) · se descuenta de {paymentMethod}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs cursor-pointer"
            >
              Confirmar Compra y Actualizar Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
