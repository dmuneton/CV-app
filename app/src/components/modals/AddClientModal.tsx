import React, { useState } from 'react';
import { ClientProfile } from '../../types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newClient: ClientProfile) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Persona' | 'Empresa'>('Empresa');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identification, setIdentification] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials =
      name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'CL';

    const newClient: ClientProfile = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      initials,
      tier: 'Nuevo',
      role,
      email: email.trim(),
      phone: phone.trim(),
      identification: identification.trim() || undefined,
      address: address.trim() || undefined,
      totalPurchased: 0,
      purchases: [],
      affinity: {
        title: 'Nuevo Perfil de Cliente',
        description: 'Cliente recién registrado en el sistema. Realiza una primera orden para comenzar su historial.',
        recommendation: 'Presentar catálogo institucional y opciones de papelería botánica',
        probability: 'Oportunidad inicial'
      }
    };

    onSave(newClient);
    setName('');
    setEmail('');
    setPhone('');
    setIdentification('');
    setAddress('');
    setRole('Empresa');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#012d1d] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c1ecd4]/20 flex items-center justify-center text-[#c1ecd4]">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold">Registrar Nuevo Cliente</h3>
              <p className="text-xs text-[#c1ecd4]/80">Crea una ficha de cliente en el CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
              Nombre Completo / Empresa *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Hotel Botánico Real o María González"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
                Tipo / Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'Persona' | 'Empresa')}
                className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
              >
                <option value="Empresa">Empresa</option>
                <option value="Persona">Persona</option>
              </select>
            </div>

            <div>
              <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
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
              <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
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
              <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
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
            <label className="block font-label-caps text-xs text-[#414844] mb-1 font-semibold">
              Dirección de Entrega / Sede
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Cra 43A # 1-50, Medellín"
              className="w-full bg-[#f4fafd] border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0284c7]"
            />
            <p className="text-[10px] text-[#717973] mt-1">
              Esta dirección se precargará automáticamente al generar nuevas órdenes para este cliente.
            </p>
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
              className="bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2 rounded-lg font-label-caps text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
