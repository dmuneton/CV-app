import React, { useState, useEffect } from 'react';
import { Provider } from '../../types';

interface ProviderDetailModalProps {
  isOpen: boolean;
  providerName: string | null;
  providers: Provider[];
  onClose: () => void;
  onSave: (provider: Provider) => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  isOpen,
  providerName,
  providers,
  onClose,
  onSave
}) => {
  const existing = providerName
    ? providers.find((p) => p.name.toLowerCase().trim() === providerName.toLowerCase().trim())
    : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactChannel, setContactChannel] = useState('');

  useEffect(() => {
    if (isOpen && providerName) {
      setName(existing?.name || providerName);
      setPhone(existing?.phone || '');
      setAddress(existing?.address || '');
      setContactChannel(existing?.contactChannel || '');
      // If this provider has no details on file yet, open straight into edit mode
      // instead of showing an empty read view.
      setIsEditing(!existing || (!existing.phone && !existing.address && !existing.contactChannel));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, providerName]);

  if (!isOpen || !providerName) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: existing?.id || `prov-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      contactChannel: contactChannel.trim() || undefined
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0e6c4a] flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold leading-tight">{existing?.name || providerName}</h3>
              <p className="text-xs text-[#c1ecd4]/80">Información del proveedor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isEditing ? (
          /* Edit / Complete Details Form */
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Nombre del Proveedor
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="+57 300 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Dirección
              </label>
              <input
                type="text"
                placeholder="Ej. Calle 45 # 20-10, Bogotá"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Canal de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. WhatsApp, Feria de proveedores, Referido..."
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value)}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#012d1d]"
              />
              <p className="text-[10px] text-[#717973] mt-1">
                ¿Por qué canal lo contactaste la primera vez?
              </p>
            </div>

            <div className="pt-4 border-t border-[#c1c8c2] flex justify-end gap-3">
              {existing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Guardar</span>
              </button>
            </div>
          </form>
        ) : (
          /* Read-only Detail View */
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#0e6c4a]">phone</span>
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Teléfono</span>
                <span className="text-sm text-[#161d1f]">{existing?.phone || 'No registrado'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#0e6c4a]">location_on</span>
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Dirección</span>
                <span className="text-sm text-[#161d1f]">{existing?.address || 'No registrada'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#0e6c4a]">forum</span>
              <div>
                <span className="block text-[10px] font-label-caps text-[#717973] font-semibold">Canal de Contacto</span>
                <span className="text-sm text-[#161d1f]">{existing?.contactChannel || 'No registrado'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#c1c8c2] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-white border border-[#c1c8c2] hover:bg-[#eef5f7] text-[#012d1d] px-4 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
