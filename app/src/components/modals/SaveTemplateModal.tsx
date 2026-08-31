import React, { useState } from 'react';
import { BOMComponent, ProductTemplate } from '../../types';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentComponents: BOMComponent[];
  currentSalePrice: number;
  existingTemplates: ProductTemplate[];
  activePresetName: string;
  onSaveTemplate: (template: ProductTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  currentComponents,
  currentSalePrice,
  existingTemplates,
  activePresetName,
  onSaveTemplate,
  onDeleteTemplate,
}) => {
  const [templateName, setTemplateName] = useState(activePresetName || '');
  const [description, setDescription] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState<number>(currentSalePrice || 29000);

  if (!isOpen) return null;

  const totalCalculatedCost = currentComponents.reduce((acc, item) => acc + item.totalCost, 0);
  const isExisting = existingTemplates.some(
    (t) => t.name.toLowerCase().trim() === templateName.toLowerCase().trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const matchedExisting = existingTemplates.find(
      (t) => t.name.toLowerCase().trim() === templateName.toLowerCase().trim()
    );

    const templateToSave: ProductTemplate = {
      id: matchedExisting ? matchedExisting.id : `tmpl-${Date.now()}`,
      name: templateName.trim(),
      description: description.trim() || undefined,
      defaultSalePrice: Number(suggestedPrice) || 0,
      components: JSON.parse(JSON.stringify(currentComponents)),
      createdAt: matchedExisting?.createdAt || new Date().toISOString().split('T')[0]
    };

    onSaveTemplate(templateToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1b4332] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-[#a0f4c8]">
              bookmark_add
            </span>
            <div>
              <h3 className="font-headline text-lg font-bold">Guardar Plantilla de Producto</h3>
              <p className="text-xs text-[#a0f4c8]/90">
                Guarda esta lista de insumos para reutilizarla en futuros pedidos
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Nombre de la Plantilla / Producto Final *
            </label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej. Agenda Botánica Anillada 2026"
              className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3.5 py-2.5 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a] focus:ring-1 focus:ring-[#0e6c4a]"
            />
            {isExisting && (
              <p className="text-[11px] text-[#0284c7] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">info</span>
                Ya existe una plantilla con este nombre. Al guardar, se actualizará su receta de insumos.
              </p>
            )}
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Descripción o Especificación (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Encuadernación artesanal con tapas de cartón reciclado y papel opalina"
              className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
            />
          </div>

          <div>
            <label className="block font-label-caps text-xs text-[#414844] mb-1">
              Precio de Venta Sugerido ($)
            </label>
            <input
              type="number"
              min="0"
              value={suggestedPrice}
              onChange={(e) => setSuggestedPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-[#c1c8c2] rounded-lg px-3.5 py-2 text-sm font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
            />
          </div>

          {/* Insumos Preview */}
          <div className="bg-[#f4fafd] rounded-xl border border-[#c1c8c2]/70 p-3.5">
            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-[#c1c8c2]/50">
              <span className="text-xs font-bold text-[#012d1d] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#0e6c4a]">
                  list_alt
                </span>
                Insumos incluidos ({currentComponents.length})
              </span>
              <span className="text-xs font-semibold text-[#0e6c4a]">
                Costo Base: ${totalCalculatedCost.toLocaleString()}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {currentComponents.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex justify-between items-center text-xs text-[#414844] bg-white px-2.5 py-1.5 rounded border border-[#c1c8c2]/40"
                >
                  <span className="truncate pr-2 text-[#161d1f]">
                    {item.name} {item.qty !== '-' ? `(x${item.qty} ${item.unit || ''})` : ''}
                  </span>
                  <span className="font-numeric-data font-medium shrink-0 text-[#012d1d]">
                    ${item.totalCost.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2.5">
            {isExisting && onDeleteTemplate ? (
              <button
                type="button"
                onClick={() => {
                  const matched = existingTemplates.find(
                    (t) => t.name.toLowerCase().trim() === templateName.toLowerCase().trim()
                  );
                  if (matched) {
                    onDeleteTemplate(matched.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Eliminar esta plantilla"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Borrar Plantilla</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#414844] hover:text-[#161d1f] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#012d1d] text-white text-xs font-semibold rounded-lg hover:bg-[#1b4332] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">bookmark_added</span>
                <span>{isExisting ? 'Actualizar Plantilla' : 'Guardar Plantilla'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
