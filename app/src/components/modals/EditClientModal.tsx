import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../../types';
import { ClientTier } from '../../utils/clientPurchases';

interface EditClientModalProps {
  isOpen: boolean;
  client: ClientProfile | null;
  tier: ClientTier;
  purchaseCount: number;
  onClose: () => void;
  onSave: (updatedClient: ClientProfile) => void;
  onDelete?: (clientId: string) => void;
}

const TIER_LABELS: Record<ClientTier, string> = {
  Nuevo: 'Nuevo — 0 a 1 compra',
  Recurrente: 'Recurrente — 2 a 10 compras',
  VIP: 'VIP — más de 10 compras'
};

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  tier,
  purchaseCount,
  onClose,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Persona' | 'Empresa'>('Persona');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identification, setIdentification] = useState('');
  const [address, setAddress] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      setConfirmingDelete(false);
      setName(client.name);
      setRole(client.role === 'Empresa' ? 'Empresa' : 'Persona');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setIdentification(client.identification || '');
      setAddress(client.address || '');
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials =
      name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || client.initials;

    onSave({
      ...client,
      name: name.trim(),
      initials,
      role,
      email: email.trim(),
      phone: phone.trim(),
      identification: identification.trim() || undefined,
      address: address.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#c1ecd4]">edit_note</span>
            <div>
              <h3 className="font-headline text-lg font-bold">Editar Cliente</h3>
              <p className="text-xs text-[#c1ecd4]/80">Ver y actualizar la información del cliente</p>
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
              Nombre Completo / Empresa
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Persona' | 'Empresa')}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              >
                <option value="Persona">Persona</option>
                <option value="Empresa">Empresa</option>
              </select>
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1">
                NIT / Cédula (Documento)
              </label>
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="Ej. 901.445.678-1 o CC"
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Dirección de Entrega / Ciudad
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Calle 100 # 15-20, Bogotá"
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
            <p className="text-[10px] text-[#717973] mt-1">
              Se usa como dirección sugerida al crear una nueva orden para este cliente.
            </p>
          </div>

          <div className="bg-[#f4fafd] border border-[#c1c8c2] rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="block font-label-caps text-[10px] text-[#414844] font-semibold">
                Nivel del Cliente
              </span>
              <span className="text-xs text-[#012d1d] font-semibold">{TIER_LABELS[tier]}</span>
            </div>
            <span className="text-[11px] text-[#717973]">
              {purchaseCount} {purchaseCount === 1 ? 'compra registrada' : 'compras registradas'}
            </span>
          </div>
          <p className="text-[11px] text-[#717973] -mt-2">
            El nivel se calcula automáticamente según el número de compras y no se puede editar a mano.
          </p>

          {confirmingDelete ? (
            <div className="pt-4 border-t border-[#c1c8c2] space-y-3">
              <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-[#93000a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>¿Borrar definitivamente a {client.name}?</span>
                </p>
                <p className="text-[11px] text-[#93000a]">
                  Esta acción no se puede deshacer. Las órdenes ya registradas a su nombre se mantienen en el historial.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) onDelete(client.id);
                    onClose();
                  }}
                  className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Sí, Borrar Definitivamente</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-[#c1c8c2] flex items-center justify-between gap-3">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="px-3 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Borrar Cliente</span>
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
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
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
