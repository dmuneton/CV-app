import React, { useState } from 'react';
import { BOMComponent, ClientProfile, InventoryItem, OrderItem, ProductTemplate } from '../types';
import { SaveTemplateModal } from './modals/SaveTemplateModal';
import { ConfirmOrderModal } from './modals/ConfirmOrderModal';

interface ProductEngineeringScreenProps {
  bomList: BOMComponent[];
  onUpdateBOM: (updated: BOMComponent[]) => void;
  onExportReport?: (scenarioData: any) => void;
  inventory?: InventoryItem[];
  templates?: ProductTemplate[];
  clients?: ClientProfile[];
  onSaveTemplate?: (template: ProductTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onConfirmOrder?: (
    order: OrderItem,
    clientData: {
      isExisting: boolean;
      clientId?: string;
      newClient?: Partial<ClientProfile>;
    },
    navigateToCrm?: boolean
  ) => void;
}

// A second (third, fourth...) product added via "Añadir Producto". Each one gets its
// own independent recipe of insumos, template preset and sale price — same capabilities
// as the main product above, just without the shared Rentabilidad/scenarios panel.
interface ExtraProductBlock {
  id: string;
  bomList: BOMComponent[];
  activePreset: string;
  salePrice: number;
}

// Which "Guardar Plantilla" / "Borrar Plantilla" flow is targeted: the main product
// ('main') or one of the extra product blocks (its id).
type TemplateTarget = 'main' | string;

export const ProductEngineeringScreen: React.FC<ProductEngineeringScreenProps> = ({
  bomList,
  onUpdateBOM,
  inventory = [],
  templates = [],
  clients = [],
  onSaveTemplate,
  onDeleteTemplate,
  onConfirmOrder,
}) => {
  const [salePrice, setSalePrice] = useState<number>(29000);
  const [activePreset, setActivePreset] = useState<string>('Agenda argolla lateral');
  const [isConfirmOrderOpen, setIsConfirmOrderOpen] = useState<boolean>(false);
  const [saveTemplateTarget, setSaveTemplateTarget] = useState<TemplateTarget | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<{ tmpl: ProductTemplate; target: TemplateTarget } | null>(
    null
  );
  const [extraProducts, setExtraProducts] = useState<ExtraProductBlock[]>([]);
  // Which product the Rentabilidad panel (manual price + scenarios) is currently
  // controlling: the main product ('main') or one of the extra blocks (its id).
  const [pricingTarget, setPricingTarget] = useState<TemplateTarget>('main');

  // Calculate Base Cost
  const baseCost = bomList.reduce((acc, item) => acc + item.totalCost, 0);

  // The product the Rentabilidad panel is currently pricing — lets each product (main
  // or any added via "Añadir Producto") have its own margin chosen independently.
  const selectedExtra = pricingTarget !== 'main' ? extraProducts.find((p) => p.id === pricingTarget) : undefined;
  const isPricingMain = pricingTarget === 'main' || !selectedExtra;
  const activeName = isPricingMain ? activePreset : selectedExtra!.activePreset;
  const activeBaseCost = isPricingMain ? baseCost : selectedExtra!.bomList.reduce((acc, item) => acc + item.totalCost, 0);
  const activeSalePrice = isPricingMain ? salePrice : selectedExtra!.salePrice;
  const setActiveSalePrice = (value: number) => {
    if (isPricingMain) {
      setSalePrice(value);
    } else {
      updateExtraProduct(selectedExtra!.id, (prev) => ({ ...prev, salePrice: value }));
    }
  };

  // Margin calculation (for whichever product is selected above)
  const currentMargin = activeSalePrice > 0 ? ((activeSalePrice - activeBaseCost) / activeSalePrice) * 100 : 0;
  const isMarginLow = currentMargin < 25;

  // Target Scenarios
  const scenario25 = Math.round(activeBaseCost / (1 - 0.25));
  const scenario35 = Math.round(activeBaseCost / (1 - 0.35));
  const scenario50 = Math.round(activeBaseCost / (1 - 0.50));

  const handleLoadTemplate = (templateName: string) => {
    const found = templates.find((t) => t.name === templateName);
    if (found) {
      setActivePreset(found.name);
      onUpdateBOM(JSON.parse(JSON.stringify(found.components)));
      if (found.defaultSalePrice && found.defaultSalePrice > 0) {
        setSalePrice(found.defaultSalePrice);
      }
    }
  };

  const updateExtraProduct = (id: string, updater: (prev: ExtraProductBlock) => ExtraProductBlock) => {
    setExtraProducts((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  };

  const handleLoadTemplateForExtra = (blockId: string, templateName: string) => {
    const found = templates.find((t) => t.name === templateName);
    if (!found) return;
    updateExtraProduct(blockId, (prev) => ({
      ...prev,
      activePreset: found.name,
      bomList: JSON.parse(JSON.stringify(found.components)),
      salePrice: found.defaultSalePrice && found.defaultSalePrice > 0 ? found.defaultSalePrice : prev.salePrice,
    }));
  };

  const handleAddProduct = () => {
    setExtraProducts((prev) => [
      ...prev,
      {
        id: `prod-${Date.now()}`,
        bomList: [],
        activePreset: 'Personalizado',
        salePrice: 29000,
      },
    ]);
  };

  const handleRemoveProduct = (id: string) => {
    setExtraProducts((prev) => prev.filter((p) => p.id !== id));
    setPricingTarget((prev) => (prev === id ? 'main' : prev));
  };

  const handleSaveTemplateSuccess = (savedTmpl: ProductTemplate) => {
    if (saveTemplateTarget === 'main') {
      setActivePreset(savedTmpl.name);
      if (savedTmpl.defaultSalePrice && savedTmpl.defaultSalePrice > 0) {
        setSalePrice(savedTmpl.defaultSalePrice);
      }
    } else if (saveTemplateTarget) {
      updateExtraProduct(saveTemplateTarget, (prev) => ({
        ...prev,
        activePreset: savedTmpl.name,
        salePrice:
          savedTmpl.defaultSalePrice && savedTmpl.defaultSalePrice > 0 ? savedTmpl.defaultSalePrice : prev.salePrice,
      }));
    }
    if (onSaveTemplate) {
      onSaveTemplate(savedTmpl);
    }
  };

  const applyTemplateFallbackAfterDelete = (target: TemplateTarget, remaining: ProductTemplate[]) => {
    if (target === 'main') {
      if (remaining.length > 0) {
        handleLoadTemplate(remaining[0].name);
      } else {
        setActivePreset('Personalizado');
      }
    } else {
      if (remaining.length > 0) {
        handleLoadTemplateForExtra(target, remaining[0].name);
      } else {
        updateExtraProduct(target, (prev) => ({ ...prev, activePreset: 'Personalizado' }));
      }
    }
  };

  // Every product block that has at least one insumo — what actually gets offered to
  // "Confirmar Orden". The main block is always included even if empty, matching the
  // previous single-product behavior.
  const confirmableProducts = [
    { id: 'main', name: activePreset, bomList, unitCost: baseCost, salePrice },
    ...extraProducts
      .filter((p) => p.bomList.length > 0)
      .map((p) => ({
        id: p.id,
        name: p.activePreset,
        bomList: p.bomList,
        unitCost: p.bomList.reduce((acc, item) => acc + item.totalCost, 0),
        salePrice: p.salePrice,
      })),
  ];

  const saveTemplateSource =
    saveTemplateTarget === 'main'
      ? { bomList, salePrice, activePreset }
      : saveTemplateTarget
      ? (() => {
          const block = extraProducts.find((p) => p.id === saveTemplateTarget);
          return block
            ? { bomList: block.bomList, salePrice: block.salePrice, activePreset: block.activePreset }
            : { bomList: [], salePrice: 29000, activePreset: 'Personalizado' };
        })()
      : { bomList: [], salePrice: 29000, activePreset: 'Personalizado' };

  return (
    <div id="screen-product-engineering" className="space-y-6 animate-fadeIn">
      {/* Title & Context */}
      <div>
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-[#012d1d] tracking-tight">
          Órdenes
        </h2>
      </div>

      {/* Bento Grid Layout (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Lista(s) de Insumos (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ProductRecipeCard
            title="Lista de insumos"
            bomList={bomList}
            onUpdateBOM={onUpdateBOM}
            activePreset={activePreset}
            templates={templates}
            inventory={inventory}
            onLoadTemplate={handleLoadTemplate}
            onRequestDeleteTemplate={(tmpl) => setTemplateToDelete({ tmpl, target: 'main' })}
            onRequestSaveTemplate={() => setSaveTemplateTarget('main')}
            salePrice={salePrice}
            isPricingTarget={pricingTarget === 'main'}
            onSelectForPricing={() => setPricingTarget('main')}
          />

          {extraProducts.map((p, idx) => (
            <ProductRecipeCard
              key={p.id}
              title={`Producto ${idx + 2}`}
              bomList={p.bomList}
              onUpdateBOM={(updated) => updateExtraProduct(p.id, (prev) => ({ ...prev, bomList: updated }))}
              activePreset={p.activePreset}
              templates={templates}
              inventory={inventory}
              onLoadTemplate={(name) => handleLoadTemplateForExtra(p.id, name)}
              onRequestDeleteTemplate={(tmpl) => setTemplateToDelete({ tmpl, target: p.id })}
              onRequestSaveTemplate={() => setSaveTemplateTarget(p.id)}
              salePrice={p.salePrice}
              isPricingTarget={pricingTarget === p.id}
              onSelectForPricing={() => setPricingTarget(p.id)}
              extra={{ onRemove: () => handleRemoveProduct(p.id) }}
            />
          ))}

          {/* Add Product Action */}
          <button
            type="button"
            id="btn-add-product"
            onClick={handleAddProduct}
            className="w-full border-2 border-dashed border-[#a0f4c8] hover:border-[#0e6c4a] bg-[#F0F9F4]/50 hover:bg-[#F0F9F4] text-[#0e6c4a] hover:text-[#012d1d] font-semibold text-sm rounded-xl py-4 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Añadir Producto</span>
          </button>
        </div>

        {/* Right Side: Profitability Matrix (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#c1c8c2] p-5 shadow-2xs h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#0e6c4a]">monitoring</span>
              <h3 className="font-headline text-lg md:text-xl font-bold text-[#012d1d]">
                Rentabilidad
              </h3>
            </div>

            {/* Product Selector — lets you switch which product this panel is pricing
                when there's more than one (added via "Añadir Producto"). */}
            {extraProducts.length > 0 && (
              <div className="mb-4">
                <label
                  htmlFor="pricingTargetSelect"
                  className="block font-label-caps text-[10px] text-[#414844] font-semibold mb-1"
                >
                  Producto a Cotizar
                </label>
                <select
                  id="pricingTargetSelect"
                  value={pricingTarget}
                  onChange={(e) => setPricingTarget(e.target.value)}
                  className="w-full bg-[#F0F9F4] border border-[#a0f4c8] rounded-lg px-3 py-2 text-xs font-semibold text-[#012d1d] focus:outline-none focus:border-[#0e6c4a] cursor-pointer"
                >
                  <option value="main">{activePreset}</option>
                  {extraProducts.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.activePreset} (Producto {idx + 2})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual Input with Validation */}
            <div className="mb-6 p-4 bg-[#eef5f7] rounded-xl border border-[#c1c8c2] focus-within:border-[#0284c7] transition-all">
              <label
                htmlFor="salePrice"
                className="block font-label-caps text-xs text-[#414844] font-semibold mb-1"
              >
                Precio de Venta (Manual){extraProducts.length > 0 ? ` — ${activeName}` : ''}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717973] font-semibold text-sm">
                  $
                </span>
                <input
                  id="salePrice"
                  type="number"
                  value={activeSalePrice}
                  onChange={(e) => setActiveSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#c1c8c2] rounded-lg p-2 pl-7 font-numeric-data text-base font-bold text-[#012d1d] focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              {/* Current Margin Indicator */}
              <div className="mt-2 flex items-center justify-between text-xs font-semibold px-1">
                <span className="text-[#414844]">Margen Bruto:</span>
                <span
                  className={`font-numeric-data font-bold ${
                    isMarginLow ? 'text-[#ba1a1a]' : 'text-[#0e6c4a]'
                  }`}
                >
                  {currentMargin.toFixed(1)}%
                </span>
              </div>

              {/* Visual Alert for Low Margin */}
              {isMarginLow && (
                <div
                  id="alert-low-margin"
                  className="mt-3 flex items-start gap-1.5 text-[#93000a] bg-[#ffdad6] p-2.5 rounded-lg text-xs font-medium border border-[#ffb4ab]"
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0 text-[#ba1a1a]">
                    warning
                  </span>
                  <span>Alerta: El margen actual está por debajo del 25%.</span>
                </div>
              )}
            </div>

            {/* Scenarios Breakdown */}
            <div className="flex-1 flex flex-col gap-3">
              <h4 className="font-label-caps text-xs text-[#414844] font-bold border-b border-[#c1c8c2] pb-1 uppercase tracking-wider">
                Escenarios Objetivo
              </h4>

              {/* Scenario 1: 25% */}
              <div
                onClick={() => setActiveSalePrice(scenario25)}
                className="flex justify-between items-center p-3 rounded-lg border border-[#c1c8c2] bg-[#f4fafd] hover:border-[#0284c7] cursor-pointer transition-all"
              >
                <div>
                  <span className="block text-sm font-semibold text-[#012d1d]">
                    Conservador
                  </span>
                  <span className="block font-label-caps text-[10px] text-[#414844]">
                    Margen del 25%
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-numeric-data text-base font-bold text-[#012d1d]">
                    ${scenario25.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Scenario 2: 35% Optimal */}
              <div
                onClick={() => setActiveSalePrice(scenario35)}
                className="flex justify-between items-center p-3.5 rounded-lg border border-[#0e6c4a]/40 bg-[#F0F9F4] hover:bg-[#c1ecd4]/30 cursor-pointer transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1">
                    <span className="block text-sm font-bold text-[#0e6c4a]">Óptimo</span>
                    <span className="material-symbols-outlined text-[14px] text-[#0e6c4a]">
                      verified
                    </span>
                  </div>
                  <span className="block font-label-caps text-[10px] text-[#0e6c4a] font-semibold">
                    Margen del 35%
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-numeric-data text-base font-bold text-[#0e6c4a]">
                    ${scenario35.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Scenario 3: 50% Premium */}
              <div
                onClick={() => setActiveSalePrice(scenario50)}
                className="flex justify-between items-center p-3 rounded-lg border border-[#c1c8c2] bg-[#f4fafd] hover:border-[#0284c7] cursor-pointer transition-all"
              >
                <div>
                  <span className="block text-sm font-semibold text-[#012d1d]">Prémium</span>
                  <span className="font-label-caps text-[10px] text-[#414844]">Margen del 50%</span>
                </div>
                <div className="text-right">
                  <span className="block font-numeric-data text-base font-bold text-[#012d1d]">
                    ${scenario50.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Order Action Section */}
            <div className="mt-4 pt-4 border-t border-[#c1c8c2]/50 flex flex-col gap-2">
              <button
                id="btn-open-confirm-order"
                type="button"
                onClick={() => setIsConfirmOrderOpen(true)}
                className="w-full bg-[#012d1d] hover:bg-[#0e6c4a] text-white py-3 px-4 rounded-xl font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[20px] text-[#a0f4c8] group-hover:scale-110 transition-transform">
                  assignment_turned_in
                </span>
                <span>Confirmar Orden</span>
                {confirmableProducts.length > 1 && (
                  <span className="bg-[#0e6c4a] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {confirmableProducts.length} productos
                  </span>
                )}
              </button>
              <div className="flex items-center justify-between text-[11px] text-[#525e59] px-1">
                <span>
                  Precio de {activeName}: <strong className="text-[#012d1d] font-numeric-data">${activeSalePrice.toLocaleString()}</strong>
                </span>
                <span className="text-[#0e6c4a] font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">sync_alt</span>
                  <span>Sincroniza con CRM</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Order Modal */}
      <ConfirmOrderModal
        isOpen={isConfirmOrderOpen}
        onClose={() => setIsConfirmOrderOpen(false)}
        products={confirmableProducts}
        existingClients={clients}
        onConfirmOrder={(order, clientData, navigateToCrm) => {
          if (onConfirmOrder) {
            onConfirmOrder(order, clientData, navigateToCrm);
          }
        }}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={saveTemplateTarget !== null}
        onClose={() => setSaveTemplateTarget(null)}
        currentComponents={saveTemplateSource.bomList}
        currentSalePrice={saveTemplateSource.salePrice}
        existingTemplates={templates}
        activePresetName={saveTemplateSource.activePreset}
        onSaveTemplate={handleSaveTemplateSuccess}
        onDeleteTemplate={(tmplId) => {
          if (onDeleteTemplate && saveTemplateTarget) {
            onDeleteTemplate(tmplId);
            const remaining = templates.filter((t) => t.id !== tmplId);
            applyTemplateFallbackAfterDelete(saveTemplateTarget, remaining);
          }
        }}
      />

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#c1c8c2] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-[#ba1a1a] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h3 className="font-headline text-base font-bold">¿Borrar Plantilla?</h3>
              </div>
              <button
                onClick={() => setTemplateToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-[#414844]">
                ¿Estás seguro de que deseas eliminar la plantilla predeterminada{' '}
                <strong className="text-[#161d1f]">"{templateToDelete.tmpl.name}"</strong>?
              </p>
              <div className="bg-[#f4fafd] p-3 rounded-lg border border-[#c1c8c2]/60 text-xs text-[#525e59] space-y-1">
                <div className="flex items-center gap-1 font-semibold text-[#012d1d] mb-1">
                  <span className="material-symbols-outlined text-[15px] text-[#0e6c4a]">info</span>
                  <span>Resumen de la plantilla:</span>
                </div>
                <div>Insumos incluidos: <strong>{templateToDelete.tmpl.components.length}</strong></div>
                {templateToDelete.tmpl.defaultSalePrice ? (
                  <div>
                    Precio sugerido: <strong>${templateToDelete.tmpl.defaultSalePrice.toLocaleString()}</strong>
                  </div>
                ) : null}
              </div>
              <p className="text-[11px] text-[#717975]">
                Esta acción eliminará la plantilla del selector. Las órdenes y ventas registradas anteriormente no se verán afectadas.
              </p>
            </div>

            <div className="p-4 bg-[#f8faf9] border-t border-[#c1c8c2]/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#414844] hover:bg-[#eef5f7] rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-template"
                onClick={() => {
                  if (onDeleteTemplate) {
                    onDeleteTemplate(templateToDelete.tmpl.id);
                    const remaining = templates.filter((t) => t.id !== templateToDelete.tmpl.id);
                    applyTemplateFallbackAfterDelete(templateToDelete.target, remaining);
                  }
                  setTemplateToDelete(null);
                }}
                className="px-4 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Sí, Borrar Plantilla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------------
// ProductRecipeCard: the "Lista de insumos" card — template selector, quick-add form,
// recipe table and "Guardar Plantilla" footer. Used once for the main product and once
// per extra product added via "Añadir Producto", each with its own independent state.
// ---------------------------------------------------------------------------------

interface ProductRecipeCardProps {
  title: string;
  bomList: BOMComponent[];
  onUpdateBOM: (updated: BOMComponent[]) => void;
  activePreset: string;
  templates: ProductTemplate[];
  inventory: InventoryItem[];
  onLoadTemplate: (templateName: string) => void;
  onRequestDeleteTemplate: (tmpl: ProductTemplate) => void;
  onRequestSaveTemplate: () => void;
  // This product's current sale price — read-only here, just to show its margin.
  // Editing the price/margin itself always happens in the shared Rentabilidad panel.
  salePrice: number;
  // Whether the Rentabilidad panel is currently pricing THIS product.
  isPricingTarget: boolean;
  onSelectForPricing: () => void;
  // Present only for extra ("Añadir Producto") blocks — a way to remove the whole block.
  extra?: {
    onRemove: () => void;
  };
}

const ProductRecipeCard: React.FC<ProductRecipeCardProps> = ({
  title,
  bomList,
  onUpdateBOM,
  activePreset,
  templates,
  inventory,
  onLoadTemplate,
  onRequestDeleteTemplate,
  onRequestSaveTemplate,
  salePrice,
  isPricingTarget,
  onSelectForPricing,
  extra,
}) => {
  const [isAddingComponent, setIsAddingComponent] = useState<boolean>(false);
  const [selectedInvId, setSelectedInvId] = useState<string>('');
  const [newCompName, setNewCompName] = useState<string>('');
  const [newCompQty, setNewCompQty] = useState<number>(1);
  const [newCompCost, setNewCompCost] = useState<number>(500);
  const [newCompUnit, setNewCompUnit] = useState<string>('unidad');

  const baseCost = bomList.reduce((acc, item) => acc + item.totalCost, 0);

  const handleNameChange = (nameVal: string) => {
    setNewCompName(nameVal);
    const match = inventory.find((item) => item.name.toLowerCase().trim() === nameVal.toLowerCase().trim());
    if (match) {
      setSelectedInvId(match.id);
      setNewCompCost(match.unitCost);
      setNewCompUnit(match.stockUnit || 'unidad');
    }
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName) return;

    const newItem: BOMComponent = {
      id: `bom-${Date.now()}`,
      name: newCompName,
      qty: newCompQty,
      unitCost: newCompCost,
      totalCost: newCompQty * newCompCost,
      unit: newCompUnit || 'unidad'
    };

    onUpdateBOM([...bomList, newItem]);
    setNewCompName('');
    setSelectedInvId('');
    setNewCompQty(1);
    setNewCompCost(500);
    setNewCompUnit('unidad');
    setIsAddingComponent(false);
  };

  const handleRemoveComponent = (id: string) => {
    onUpdateBOM(bomList.filter((item) => item.id !== id));
  };

  const handleUpdateLaborRate = (id: string, newUnitCost: number) => {
    const updated = bomList.map((item) => {
      if (item.id !== id) return item;
      const numQty = typeof item.qty === 'number' ? item.qty : parseFloat(item.qty as string) || 1;
      const nextUnitCost = Math.max(0, newUnitCost);
      return {
        ...item,
        unitCost: nextUnitCost,
        totalCost: Math.round(numQty * nextUnitCost)
      };
    });
    onUpdateBOM(updated);
  };

  const handleUpdateQty = (id: string, deltaOrValue: number, isAbsolute = false) => {
    const updated = bomList.map((item) => {
      if (item.id !== id) return item;
      const currentNum = typeof item.qty === 'number' ? item.qty : parseFloat(item.qty as string) || 1;
      let nextQty = isAbsolute ? deltaOrValue : Math.max(1, currentNum + deltaOrValue);
      nextQty = Math.round(nextQty * 100) / 100;
      const nextTotalCost = Math.round(nextQty * item.unitCost);
      return {
        ...item,
        qty: nextQty,
        totalCost: nextTotalCost
      };
    });
    onUpdateBOM(updated);
  };

  const activeInvItem = inventory.find((i) => i.id === selectedInvId || i.name.toLowerCase() === newCompName.toLowerCase());
  const datalistId = `inventory-datalist-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const margin = salePrice > 0 ? ((salePrice - baseCost) / salePrice) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col transition-colors ${
        isPricingTarget ? 'border-[#0e6c4a] ring-1 ring-[#0e6c4a]/30' : 'border-[#c1c8c2]'
      }`}
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-headline text-lg md:text-xl font-bold text-[#012d1d]">
            {title}
          </h3>

          {/* Pricing / Margin summary — click to make this the product the Rentabilidad
              panel (right side) is pricing, so you can choose its margin from there. */}
          <button
            type="button"
            onClick={onSelectForPricing}
            title="Elegir el margen de este producto en Rentabilidad"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
              isPricingTarget
                ? 'bg-[#0e6c4a] border-[#0e6c4a] text-white'
                : 'bg-white border-[#c1c8c2] text-[#414844] hover:border-[#0e6c4a] hover:text-[#012d1d]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">monitoring</span>
            <span className="font-numeric-data">${salePrice.toLocaleString()}</span>
            <span className={isPricingTarget ? 'text-[#a0f4c8]' : margin < 25 ? 'text-[#ba1a1a]' : 'text-[#0e6c4a]'}>
              ({margin.toFixed(0)}%)
            </span>
          </button>

          {/* Template Selector */}
          <div className="flex items-center gap-1.5 bg-[#F0F9F4] border border-[#a0f4c8] px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[15px] text-[#0e6c4a]">
              auto_awesome
            </span>
            <label className="font-label-caps text-[10px] text-[#0e6c4a] font-bold">
              Plantilla:
            </label>
            <select
              value={templates.some((t) => t.name === activePreset) ? activePreset : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onLoadTemplate(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-semibold text-[#012d1d] focus:outline-none cursor-pointer pr-1"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.name}>
                  {tmpl.name}
                </option>
              ))}
              {!templates.some((t) => t.name === activePreset) && (
                <option value="">{activePreset} (Personalizado)</option>
              )}
            </select>

            {/* Delete Template Button */}
            {templates.some((t) => t.name === activePreset) && (
              <button
                type="button"
                onClick={() => {
                  const target = templates.find((t) => t.name === activePreset);
                  if (target) onRequestDeleteTemplate(target);
                }}
                className="text-[#ba1a1a] hover:text-[#93000a] hover:bg-[#ba1a1a]/15 p-1 rounded-md transition-colors cursor-pointer flex items-center justify-center ml-0.5"
                title={`Eliminar plantilla "${activePreset}"`}
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extra && (
            <button
              type="button"
              onClick={extra.onRemove}
              className="text-xs text-[#ba1a1a] hover:text-[#93000a] font-semibold flex items-center gap-1 bg-[#ffdad6]/50 px-3 py-1.5 rounded-lg border border-[#ffb4ab] cursor-pointer transition-colors"
              title="Quitar este producto"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Quitar Producto</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingComponent(!isAddingComponent)}
            className="text-xs text-[#0e6c4a] hover:text-[#012d1d] font-semibold flex items-center gap-1 bg-[#F0F9F4] px-3 py-1.5 rounded-lg border border-[#a0f4c8] cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isAddingComponent ? 'close' : 'add'}
            </span>
            <span>{isAddingComponent ? 'Cancelar' : 'Añadir Insumo'}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Insumo Inline Form */}
      {isAddingComponent && (
        <form
          onSubmit={handleAddComponent}
          className="mb-5 p-4 bg-[#eef5f7] rounded-xl border border-[#c1c8c2] space-y-3"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#c1c8c2]/60 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#012d1d]">
              <span className="material-symbols-outlined text-[18px] text-[#0e6c4a]">
                inventory_2
              </span>
              <span>Importar insumo desde Inventario o registrar manual</span>
            </div>
            {activeInvItem && (
              <span className="text-[11px] text-[#0e6c4a] font-medium bg-[#d8f3e5] px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                Inventario: {activeInvItem.stock} {activeInvItem.stockUnit} disponibles
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Componente / Nombre */}
            <div className="md:col-span-5">
              <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                Componente / Insumo
              </label>
              <input
                type="text"
                required
                list={datalistId}
                value={newCompName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Escribe o busca un insumo del inventario..."
                className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2.5 py-2 text-xs text-[#161d1f] focus:outline-none focus:border-[#0e6c4a] focus:ring-1 focus:ring-[#0e6c4a]"
              />
              <datalist id={datalistId}>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.name}>
                    ${inv.unitCost.toLocaleString()} ({inv.stockUnit}) · {inv.category}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Cantidad */}
            <div className="md:col-span-2">
              <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                Cantidad {newCompUnit ? `(${newCompUnit})` : ''}
              </label>
              <div className="flex items-stretch">
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={newCompQty}
                  onChange={(e) => setNewCompQty(parseFloat(e.target.value) || 1)}
                  className="w-full bg-white border border-r-0 border-[#c1c8c2] rounded-l-lg px-2 py-2 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
                />
                <div className="flex flex-col border border-[#c1c8c2] rounded-r-lg bg-[#F0F9F4] overflow-hidden w-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNewCompQty((prev) => (Number(prev) || 0) + 1)}
                    className="h-1/2 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer border-b border-[#c1c8c2]/50"
                    title="Aumentar (+1)"
                  >
                    <span className="material-symbols-outlined text-[13px] leading-none">expand_less</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCompQty((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                    disabled={newCompQty <= 1}
                    className="h-1/2 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Disminuir (-1)"
                  >
                    <span className="material-symbols-outlined text-[13px] leading-none">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Costo Unitario */}
            <div className="md:col-span-3">
              <label className="block font-label-caps text-[10px] text-[#414844] mb-1">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={newCompCost}
                onChange={(e) => setNewCompCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-[#c1c8c2] rounded-lg px-2 py-2 text-xs font-numeric-data text-[#161d1f] focus:outline-none focus:border-[#0e6c4a]"
              />
            </div>

            {/* Botón Guardar */}
            <div className="md:col-span-2 flex gap-1">
              <button
                type="submit"
                className="w-full bg-[#012d1d] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#1b4332] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                title="Guardar insumo en la lista"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* Subtotal & Info preview */}
          <div className="flex flex-wrap items-center justify-between text-xs text-[#414844] pt-1">
            <div>
              {activeInvItem ? (
                <span className="text-[#0e6c4a]">
                  📦 Proveedor: <strong>{activeInvItem.provider}</strong> · Lead time:{' '}
                  <strong>{activeInvItem.leadTime}</strong>
                </span>
              ) : (
                <span>Insumo nuevo o personalizado</span>
              )}
            </div>
            <div className="font-medium text-[#012d1d]">
              Subtotal estimado:{' '}
              <span className="font-numeric-data font-bold text-sm text-[#0e6c4a]">
                ${(newCompQty * newCompCost).toLocaleString()}
              </span>
            </div>
          </div>
        </form>
      )}

      {/* Recipe Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-[#F0F9F4] font-label-caps text-[11px] text-[#414844]">
              <th className="py-2.5 px-3 font-semibold border-b border-[#c1c8c2]">Componente</th>
              <th className="py-2.5 px-3 font-semibold border-b border-[#c1c8c2] text-right">
                Cant.
              </th>
              <th className="py-2.5 px-3 font-semibold border-b border-[#c1c8c2] text-right">
                Costo Unitario
              </th>
              <th className="py-2.5 px-3 font-semibold border-b border-[#c1c8c2] text-right">
                Costo Total
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-[#c1c8c2]/50">
            {bomList.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-[#eef5f7] transition-colors ${
                  item.isLabor ? 'bg-[#e8eff1]/60 font-medium' : ''
                }`}
              >
                <td className="py-2.5 px-3 text-[#161d1f] flex items-center gap-1.5">
                  {item.isLabor && (
                    <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">
                      engineering
                    </span>
                  )}
                  <span>{item.name}</span>
                </td>
                <td className="py-2 px-3 text-right">
                  {item.qty === '-' ? (
                    <span className="font-numeric-data text-[#717975] text-xs">{item.qty}</span>
                  ) : (
                    <div className="inline-flex items-center justify-end gap-1">
                      <div className="flex items-center bg-white border border-[#c1c8c2] rounded-md shadow-2xs hover:border-[#0e6c4a] transition-colors overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              handleUpdateQty(item.id, val, true);
                            }
                          }}
                          className="w-12 px-1.5 py-1 text-xs text-right font-numeric-data text-[#161d1f] focus:outline-none bg-transparent"
                        />
                        <div className="flex flex-col border-l border-[#c1c8c2]/60 bg-[#F0F9F4] w-4.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer border-b border-[#c1c8c2]/40"
                            title="Aumentar en 1"
                          >
                            <span className="material-symbols-outlined text-[13px] leading-none">expand_less</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1)}
                            disabled={Number(item.qty) <= 1}
                            className="h-3.5 flex items-center justify-center hover:bg-[#a0f4c8] text-[#0e6c4a] transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                            title="Disminuir en 1"
                          >
                            <span className="material-symbols-outlined text-[13px] leading-none">expand_more</span>
                          </button>
                        </div>
                      </div>
                      {item.unit && (
                        <span className="text-[10px] text-[#717975] max-w-[44px] truncate text-left ml-0.5" title={item.unit}>
                          {item.unit}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-numeric-data text-[#414844]">
                  {item.isLabor ? (
                    <div className="inline-flex items-center justify-end gap-0.5 bg-white border border-[#c1c8c2] rounded-md shadow-2xs hover:border-[#0e6c4a] transition-colors overflow-hidden">
                      <span className="pl-2 text-[#717975] text-xs">$</span>
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
                        className="w-16 pr-1.5 py-1 text-xs text-right font-numeric-data text-[#414844] focus:outline-none bg-transparent"
                        title="Editar el precio estándar de la mano de obra"
                      />
                    </div>
                  ) : item.unitCost > 0 ? (
                    `$${item.unitCost.toLocaleString()}`
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-numeric-data font-semibold text-[#012d1d]">
                  ${item.totalCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-right">
                  {!item.isLabor && (
                    <button
                      onClick={() => handleRemoveComponent(item.id)}
                      className="text-[#717973] hover:text-[#ba1a1a] p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar insumo"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-[#012d1d] border-t-2 border-[#717973] bg-[#f4fafd]">
              <td className="py-3 px-3 text-right font-headline" colSpan={3}>
                Costo Total Calculado:
              </td>
              <td className="py-3 px-3 text-right font-numeric-data text-base font-bold text-[#012d1d]">
                ${baseCost.toLocaleString()}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* End of Lista de Insumos: Guardar Plantilla Action */}
      <div className="mt-4 pt-4 border-t border-[#c1c8c2]/50 flex flex-wrap items-center justify-between gap-3 bg-[#fafcfb] -mx-5 -mb-5 p-4 rounded-b-xl">
        <div className="flex items-center gap-2 text-xs text-[#414844]">
          <span className="material-symbols-outlined text-[18px] text-[#0e6c4a]">
            bookmark_added
          </span>
          <span>
            Guarda esta receta de insumos como plantilla predeterminada para reutilizarla en nuevos pedidos.
          </span>
        </div>
        <button
          onClick={onRequestSaveTemplate}
          className="bg-[#0e6c4a] hover:bg-[#012d1d] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
          title="Guardar como plantilla de producto predeterminado"
        >
          <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
          <span>Guardar Plantilla</span>
        </button>
      </div>
    </div>
  );
};
