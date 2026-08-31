import React, { useState } from 'react';
import { OrderItem } from '../../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: OrderItem) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [client, setClient] = useState('');
  const [productSpec, setProductSpec] = useState('Agenda Botánica Argollas Oro');
  const [value, setValue] = useState(1450);
  const [itemsCount, setItemsCount] = useState(25);
  const [status, setStatus] = useState<'Pendiente' | 'En Producción' | 'Terminado' | 'Enviado'>('Pendiente');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      client,
      productSpec,
      value: Number(value),
      status,
      paymentStatus: 'Pendiente',
      date: 'Justo ahora',
      createdAt: new Date().toISOString(),
      itemsCount: Number(itemsCount),
      deliveryAddress: deliveryAddress.trim() || undefined
    };

    onSubmit(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-[#1b4332] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#c1ecd4]">add_box</span>
            <h3 className="font-headline text-lg font-bold">Crear Nueva Orden de Producción</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Cliente / Empresa
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Boutique Flores & Co."
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Valor Total ($ USD)
              </label>
              <input
                type="number"
                required
                min="0"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
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

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Estado Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En Producción">En Producción</option>
              <option value="Terminado">Terminado</option>
              <option value="Enviado" disabled>Enviado (requiere pago)</option>
            </select>
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

          <div className="pt-4 border-t border-[#c1c8c2] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs"
            >
              Guardar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
