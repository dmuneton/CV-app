import React, { useState } from 'react';
import { InventoryItem, Provider } from '../../types';

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
  providers?: Provider[];
  onSaveProvider?: (provider: Provider) => void;
}

const NEW_PROVIDER_VALUE = '__new__';

export const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  providers = [],
  onSaveProvider
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [useNewProvider, setUseNewProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderAddress, setNewProviderAddress] = useState('');
  const [newProviderChannel, setNewProviderChannel] = useState('');
  const [category, setCategory] = useState<'Plantas' | 'Papelería'>('Plantas');
  // Costo Unitario is derived, not typed directly: precio de compra ÷ cantidad comprada
  const [purchasePrice, setPurchasePrice] = useState<number>(250);
  const [purchaseQty, setPurchaseQty] = useState<number>(100);
  const [stock, setStock] = useState<number>(100);
  const [stockUnit, setStockUnit] = useState('unidades');
  const [minStock, setMinStock] = useState<number>(30);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(3);
  const [leadTimeType, setLeadTimeType] = useState<'LOCAL' | 'INT'>('LOCAL');

  const unitCost = purchaseQty > 0 ? purchasePrice / purchaseQty : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (useNewProvider && !newProviderName.trim()) return;

    const finalProviderName = useNewProvider ? newProviderName.trim() : provider.trim() || 'Proveedor Local';

    if (useNewProvider && onSaveProvider) {
      onSaveProvider({
        id: `prov-${Date.now()}`,
        name: finalProviderName,
        phone: newProviderPhone.trim() || undefined,
        address: newProviderAddress.trim() || undefined,
        contactChannel: newProviderChannel.trim() || undefined
      });
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      status: stock <= minStock ? 'alert' : 'ok',
      name: name.trim(),
      provider: finalProviderName,
      unitCost: Math.round(unitCost * 10000) / 10000,
      stock: Number(stock),
      stockUnit: stockUnit.trim() || 'unidades',
      leadTime: `${leadTimeType === 'LOCAL' ? 'Local' : 'Importado'} (${leadTimeDays} Días)`,
      leadTimeType,
      leadTimeDays: Number(leadTimeDays),
      category,
      minStock: Number(minStock)
    };

    onAddItem(newItem);
    onClose();

    // Reset form
    setName('');
    setProvider('');
    setUseNewProvider(false);
    setNewProviderName('');
    setNewProviderPhone('');
    setNewProviderAddress('');
    setNewProviderChannel('');
    setCategory('Plantas');
    setPurchasePrice(250);
    setPurchaseQty(100);
    setStock(100);
    setStockUnit('unidades');
    setMinStock(30);
    setLeadTimeDays(3);
    setLeadTimeType('LOCAL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#c1ecd4]">add_box</span>
            <div>
              <h3 className="font-headline text-lg font-bold">Agregar Producto al Inventario</h3>
              <p className="text-xs text-[#c1ecd4]/80">Registra un nuevo insumo, material botánico o de papelería</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Nombre del Producto / Insumo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Monstera Deliciosa Esquejes / Papel Semilla 240g"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Proveedor
              </label>
              {useNewProvider ? (
                <button
                  type="button"
                  onClick={() => setUseNewProvider(false)}
                  className="w-full bg-[#f4fafd] border border-[#0e6c4a] rounded-lg px-3.5 py-2 text-sm text-[#0e6c4a] font-semibold text-left focus:outline-none cursor-pointer flex items-center justify-between"
                >
                  <span>Registrando proveedor nuevo…</span>
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
              ) : (
                <select
                  required
                  value={provider}
                  onChange={(e) => {
                    if (e.target.value === NEW_PROVIDER_VALUE) {
                      setUseNewProvider(true);
                    } else {
                      setProvider(e.target.value);
                    }
                  }}
                  className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d] cursor-pointer"
                >
                  <option value="" disabled>
                    Selecciona un proveedor…
                  </option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value={NEW_PROVIDER_VALUE}>+ Nuevo proveedor…</option>
                </select>
              )}
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'Plantas' | 'Papelería')}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              >
                <option value="Plantas">Plantas</option>
                <option value="Papelería">Papelería</option>
              </select>
            </div>
          </div>

          {useNewProvider && (
            <div className="p-3.5 bg-[#eef5f7] rounded-xl border border-[#c1c8c2] space-y-3">
              <span className="text-xs font-bold text-[#012d1d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">local_shipping</span>
                Datos del Proveedor Nuevo
              </span>
              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                  Nombre del Proveedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vivero Los Andes"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+57 300 000 0000"
                    value={newProviderPhone}
                    onChange={(e) => setNewProviderPhone(e.target.value)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                    Canal de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. WhatsApp, Feria, Referido..."
                    value={newProviderChannel}
                    onChange={(e) => setNewProviderChannel(e.target.value)}
                    className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle 45 # 20-10, Bogotá"
                  value={newProviderAddress}
                  onChange={(e) => setNewProviderAddress(e.target.value)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Precio de Compra Total ($)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Cantidad Comprada
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>
          </div>

          <div className="bg-[#F0F9F4] border border-[#a0f4c8] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#0e6c4a] font-semibold uppercase tracking-wider">
              Costo Unitario Calculado (Precio ÷ Cantidad)
            </span>
            <span className="font-numeric-data text-sm font-bold text-[#012d1d]">
              ${unitCost.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              {stockUnit ? ` / ${stockUnit}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Unidad de Medida
              </label>
              <input
                type="text"
                required
                placeholder="Ej. unidades, kg, sobres, hojas"
                value={stockUnit}
                onChange={(e) => setStockUnit(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Origen de Entrega
              </label>
              <select
                value={leadTimeType}
                onChange={(e) => setLeadTimeType(e.target.value as 'LOCAL' | 'INT')}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              >
                <option value="LOCAL">Local</option>
                <option value="INT">Internacional</option>
              </select>
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Tiempo de Entrega (Días)
              </label>
              <input
                type="number"
                min="1"
                required
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>
          </div>

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
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Guardar en Inventario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
