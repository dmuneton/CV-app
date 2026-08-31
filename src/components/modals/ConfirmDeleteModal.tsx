import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = '¿Eliminar producto definitivamente?',
  message = 'Esta acción no se puede deshacer. El producto será removido permanentemente del inventario.',
  itemName,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-xl w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="bg-[#ba1a1a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl">delete_forever</span>
            <h3 className="font-headline text-base font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#414844] leading-relaxed">
            {message}
          </p>
          {itemName && (
            <div className="p-3 bg-[#ffdad6]/30 border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>{itemName}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#c1c8c2] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Sí, Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
