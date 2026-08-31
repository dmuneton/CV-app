import React, { useState } from 'react';
import { FixedAsset } from '../../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: FixedAsset) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAddAsset
}) => {
  const [name, setName] = useState('');
  const [initialCost, setInitialCost] = useState(1200000);
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(36);
  const [icon, setIcon] = useState<string>('precision_manufacturing');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      name,
      icon,
      initialCost: Number(initialCost),
      recoveredAmount: 0,
      percentage: 0,
      status: 'IN PROGRESS',
      purchaseDate: 'Hoy',
      usefulLifeMonths: Number(usefulLifeMonths)
    };

    onAddAsset(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#c1ecd4]">account_balance</span>
            <h3 className="font-headline text-lg font-bold">Registrar Nuevo Activo Fijo</h3>
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
              Nombre de la Maquinaria / Activo / Software
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Licencia Illustrator, Plotter Cameo, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Costo Inicial ($)
              </label>
              <input
                type="number"
                required
                min="0"
                value={initialCost}
                onChange={(e) => setInitialCost(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Vida Útil (Meses)
              </label>
              <input
                type="number"
                required
                min="1"
                value={usefulLifeMonths}
                onChange={(e) => setUsefulLifeMonths(Number(e.target.value))}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Tipo de Activo
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'precision_manufacturing', label: 'Maquinaria' },
                { id: 'print', label: 'Impresora' },
                { id: 'cut', label: 'Corte' },
                { id: 'build', label: 'Herramienta' },
                { id: 'computer', label: 'Software' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    icon === opt.id
                      ? 'bg-[#c1ecd4] border-[#0e6c4a] text-[#012d1d] font-bold shadow-xs'
                      : 'bg-[#f4fafd] border-[#c1c8c2] text-[#414844] hover:bg-[#eef5f7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{opt.id}</span>
                  <span className="text-[10px] truncate max-w-full">{opt.label}</span>
                </button>
              ))}
            </div>
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
              Guardar Activo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
