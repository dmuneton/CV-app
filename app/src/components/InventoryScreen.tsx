import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, FixedAsset, Provider } from '../types';
import { EditInventoryItemModal } from './modals/EditInventoryItemModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { ProviderDetailModal } from './modals/ProviderDetailModal';

interface InventoryScreenProps {
  inventory: InventoryItem[];
  fixedAssets?: FixedAsset[];
  providers?: Provider[];
  onSaveProvider?: (provider: Provider) => void;
  onOpenAddInventoryModal?: () => void;
  onOpenRestockModal?: () => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem?: (id: string) => void;
  onArchiveItem?: (item: InventoryItem) => void;
  onAddAsset?: () => void;
  onDeleteAsset?: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  inventory,
  fixedAssets = [],
  providers = [],
  onSaveProvider,
  onOpenAddInventoryModal,
  onOpenRestockModal,
  onUpdateItem,
  onDeleteItem,
  onArchiveItem,
  onAddAsset,
  onDeleteAsset,
  searchTerm = '',
  onSearchChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todo');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [viewingProviderName, setViewingProviderName] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<FixedAsset | null>(null);

  const closeActionsMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  // The actions dropdown is rendered in a portal (see below), so it's never clipped by the
  // table's scroll containers. Close it on scroll/resize since its position is a snapshot.
  useEffect(() => {
    if (!openMenuId) return;
    window.addEventListener('scroll', closeActionsMenu, true);
    window.addEventListener('resize', closeActionsMenu);
    return () => {
      window.removeEventListener('scroll', closeActionsMenu, true);
      window.removeEventListener('resize', closeActionsMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuId]);

  const activeMenuItem = openMenuId ? inventory.find((i) => i.id === openMenuId) || null : null;

  const categories = ['Todo', 'Plantas', 'Papelería'];

  // Filter by category and search
  const filteredItems = inventory.filter((item) => {
    const matchesCategory = selectedCategory === 'Todo' || selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate total inventory value for the selected category
  const totalCategoryValue = filteredItems.reduce(
    (acc, item) => acc + item.unitCost * item.stock,
    0
  );

  // Stock Crítico: an item alerts only once its Stock Actual reaches (or drops below) its
  // own Stock Mínimo — matches Gestión de Inventario 1:1, no separate/stale data source.
  const criticalItems = inventory.filter((item) => !item.isArchived && item.stock <= item.minStock);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  // Fixed Assets metrics
  const totalAssetInvestment = fixedAssets.reduce((acc, a) => acc + a.initialCost, 0);
  const totalAssetRecovered = fixedAssets.reduce((acc, a) => acc + a.recoveredAmount, 0);
  const globalRoiPercentage = totalAssetInvestment > 0 ? Math.round((totalAssetRecovered / totalAssetInvestment) * 100) : 0;

  return (
    <div id="screen-inventory" className="space-y-6 animate-fadeIn">
      {/* Header / Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#012d1d] tracking-tight">
            Gestión de Inventario
          </h1>
        </div>
        {onOpenAddInventoryModal && (
          <button
            id="btn-add-to-inventory"
            onClick={onOpenAddInventoryModal}
            className="w-full sm:w-auto bg-[#012d1d] hover:bg-[#1b4332] text-white px-4 py-2.5 rounded-lg font-label-caps text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            <span>Agregar al inventario</span>
          </button>
        )}
      </div>

      {/* Bento Layout / Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Category Tabs */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#c1c8c2] p-4 shadow-2xs flex items-center">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`cat-tab-${cat.toLowerCase()}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full font-body text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1b4332] text-[#86af99] shadow-xs'
                      : 'bg-transparent text-[#414844] border border-[#c1c8c2] hover:bg-[#eef5f7]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats / Search */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#c1c8c2] p-4 shadow-2xs flex flex-col justify-between gap-3">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717973] text-[18px]">
              search
            </span>
            <input
              id="search-inventory-sub"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar en inventario..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#f4fafd] border border-[#c1c8c2] rounded-lg text-xs text-[#161d1f] placeholder:text-[#717973] focus:outline-none focus:border-[#0284c7] transition-colors"
            />
          </div>
          <div className="flex justify-between items-end pt-1">
            <div>
              <p className="font-label-caps text-[10px] text-[#414844] uppercase tracking-wider font-semibold">
                VALOR TOTAL ({selectedCategory.toUpperCase()})
              </p>
              <p className="font-numeric-data text-2xl font-bold text-[#012d1d]">
                ${totalCategoryValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#c1ecd4]/50 flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table + Critical Stock Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Data Table Container (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#c1c8c2] shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#F0F9F4] border-b border-[#c1c8c2] font-label-caps text-[11px] text-[#414844]">
                {/* Oculta (no eliminada): el ícono de estado se considera redundante con
                    el resaltado de fila / Stock Crítico. */}
                <th className="hidden py-3 px-3 font-semibold whitespace-nowrap">ESTADO</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">NOMBRE</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">PROVEEDOR</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">COSTO UNITARIO</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">STOCK</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">TIEMPO DE ENTREGA</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#c1c8c2]/50">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#717973]">
                    No se encontraron insumos para esta categoría o búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isAlert = !item.isArchived && (item.status === 'alert' || item.stock <= item.minStock);
                  const isMenuOpen = openMenuId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#eef5f7] transition-colors group ${
                        item.isArchived
                          ? 'bg-[#f4fafd]/60 opacity-80'
                          : isAlert
                          ? 'bg-[#ffdad6]/25'
                          : ''
                      }`}
                    >
                      {/* Status Icon — oculta, ver nota en el <th> ESTADO de arriba */}
                      <td className="hidden py-3.5 px-3">
                        {item.isArchived ? (
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded-full bg-[#717973] text-white"
                            title="Producto archivado (bloqueado temporalmente)"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              pause
                            </span>
                          </div>
                        ) : isAlert ? (
                          <div
                            className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ba1a1a] text-white"
                            title="Stock crítico"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              priority_high
                            </span>
                          </div>
                        ) : (
                          <div
                            className="w-2.5 h-2.5 rounded-full bg-[#0e6c4a] ml-1"
                            title="Stock adecuado"
                          />
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-3 font-medium text-[#161d1f]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={
                              item.isArchived
                                ? 'text-[#717973] font-normal line-through'
                                : isAlert
                                ? 'text-[#ba1a1a] font-bold'
                                : 'text-[#012d1d]'
                            }
                          >
                            {item.name}
                          </span>
                          {item.isArchived && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8eff1] text-[#414844] border border-[#c1c8c2]">
                              <span className="material-symbols-outlined text-[12px]">archive</span>
                              Archivado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-3 text-[#414844]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px]" title={item.provider}>
                            {item.provider}
                          </span>
                          {item.provider && (
                            <button
                              type="button"
                              onClick={() => setViewingProviderName(item.provider)}
                              className="text-[#717973] hover:text-[#0e6c4a] p-0.5 rounded transition-colors cursor-pointer shrink-0"
                              title={`Ver detalles de ${item.provider}`}
                            >
                              <span className="material-symbols-outlined text-[15px]">info</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-3 font-numeric-data text-right text-[#161d1f] font-semibold">
                        ${Math.round(item.unitCost).toLocaleString()}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3 font-numeric-data text-right">
                        <span
                          className={`font-bold ${
                            item.isArchived
                              ? 'text-[#717973]'
                              : isAlert
                              ? 'text-[#ba1a1a]'
                              : 'text-[#161d1f]'
                          }`}
                        >
                          {item.stock.toLocaleString()} {item.stockUnit}
                        </span>
                      </td>

                      {/* Lead Time */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#e8eff1] text-[#414844] font-label-caps text-[10px] font-semibold tracking-wide uppercase">
                          <span className="material-symbols-outlined text-[14px]">
                            {item.leadTimeType === 'INT' ? 'flight_takeoff' : 'local_shipping'}
                          </span>
                          <span>{item.leadTime}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right relative">
                        <button
                          id={`btn-actions-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMenuOpen) {
                              closeActionsMenu();
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuWidth = 208; // w-52
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
                            });
                            setOpenMenuId(item.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isMenuOpen
                              ? 'bg-[#012d1d] text-white shadow-xs'
                              : 'text-[#717973] hover:text-[#012d1d] hover:bg-[#eef5f7]'
                          }`}
                          title="Acciones del producto"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#c1c8c2] bg-white flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#414844]">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <p>
              {filteredItems.length === 0 ? (
                'Mostrando 0 insumos'
              ) : (
                <>
                  Mostrando <span className="font-semibold text-[#161d1f]">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-semibold text-[#161d1f]">{Math.min(safeCurrentPage * itemsPerPage, filteredItems.length)}</span> de{' '}
                  <span className="font-semibold text-[#161d1f]">{filteredItems.length}</span> insumos
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <label htmlFor="select-items-per-page" className="text-xs text-[#717973] whitespace-nowrap">
                Ítems por página:
              </label>
              <select
                id="select-items-per-page"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#f4fafd] border border-[#c1c8c2] text-[#161d1f] text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#012d1d] cursor-pointer hover:bg-[#eef5f7] transition-colors"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#717973] mr-1">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <button
              id="btn-prev-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="w-8 h-8 flex items-center justify-center border border-[#c1c8c2] rounded-lg hover:bg-[#eef5f7] disabled:opacity-40 transition-colors cursor-pointer"
              title="Página anterior"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              id="btn-next-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages || filteredItems.length === 0}
              className="w-8 h-8 flex items-center justify-center border border-[#c1c8c2] rounded-lg hover:bg-[#eef5f7] disabled:opacity-40 transition-colors cursor-pointer"
              title="Página siguiente"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
        </div>

        {/* Critical Stock Sidebar (1 Column) */}
        <div className="bg-white border border-[#c1c8c2] rounded-xl overflow-hidden shadow-2xs flex flex-col">
          <div className="p-4 border-b border-[#c1c8c2] bg-[#F8F9FA] flex justify-between items-center">
            <h3 className="font-headline text-base md:text-lg font-bold text-[#012d1d]">
              Stock Crítico
            </h3>
            <span className="text-xs text-[#93000a] font-semibold bg-[#ffdad6] px-2 py-0.5 rounded-full">
              {criticalItems.length} alertas
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {criticalItems.length === 0 ? (
              <p className="text-xs text-[#717973] italic py-2">
                Ningún insumo ha llegado a su Stock Mínimo.
              </p>
            ) : (
              criticalItems.map((item) => {
                const isPlantCategory = item.category === 'Plantas' || item.category === 'Botánica';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-[#c1c8c2] rounded-lg bg-[#f4fafd] hover:border-[#0284c7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isPlantCategory
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : 'bg-[#ffdcc4] text-[#6f3800]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isPlantCategory ? 'potted_plant' : 'water_drop'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#161d1f] leading-tight">
                          {item.name}
                        </div>
                        <div className="font-label-caps text-[10px] text-[#717973] mt-0.5">
                          {item.category} · Mín. {item.minStock} {item.stockUnit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-numeric-data text-sm font-bold text-[#ba1a1a]">
                        {item.stock} {item.stockUnit}
                      </div>
                      <div className="font-label-caps text-[10px] text-[#717973]">
                        {item.leadTime}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {onOpenRestockModal && (
              <button
                id="btn-generate-restock-order"
                onClick={onOpenRestockModal}
                className="w-full mt-3 bg-[#eef5f7] text-[#0284c7] font-label-caps text-xs font-semibold py-2.5 rounded-lg border border-[#a5d0b9] hover:bg-[#d4dbdd] hover:text-[#0369a1] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                <span>Generar Orden de Reabastecimiento</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Assets & ROI Section */}
      <section
        id="fixed-assets-section"
        className="bg-white border border-[#c1c8c2] rounded-xl p-6 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#012d1d] text-[22px]">account_balance</span>
              <h2 className="font-headline text-lg md:text-xl font-bold text-[#012d1d]">
                Activos Fijos y Retorno de Inversión (ROI)
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#414844] mt-0.5">
              Monitorea la amortización, depreciación y recuperación de costos de maquinaria y equipamiento del taller.
            </p>
          </div>
          {onAddAsset && (
            <button
              id="btn-add-asset"
              onClick={onAddAsset}
              className="text-[#012d1d] bg-[#f4fafd] border border-[#c1c8c2] px-3.5 py-2 rounded-lg text-xs font-label-caps font-semibold hover:bg-[#eef5f7] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Agregar Activo</span>
            </button>
          )}
        </div>

        {/* Mini KPI Summary for Fixed Assets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-[#f4fafd] border border-[#c1c8c2] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <p className="font-label-caps text-[10px] text-[#414844] uppercase font-semibold tracking-wider">
                Inversión Total en Activos
              </p>
              <p className="font-numeric-data text-lg font-bold text-[#012d1d] mt-0.5">
                ${totalAssetInvestment.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-[#c1c8c2] flex items-center justify-center text-[#012d1d]">
              <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
            </div>
          </div>

          <div className="bg-[#F0F9F4] border border-[#a0f4c8] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <p className="font-label-caps text-[10px] text-[#0e6c4a] uppercase font-semibold tracking-wider">
                Total Amortizado / Recuperado
              </p>
              <p className="font-numeric-data text-lg font-bold text-[#0e6c4a] mt-0.5">
                ${totalAssetRecovered.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-[#a0f4c8] flex items-center justify-center text-[#0e6c4a]">
              <span className="material-symbols-outlined text-[18px]">savings</span>
            </div>
          </div>

          <div className="bg-[#fff8f3] border border-[#ffdcc4] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <p className="font-label-caps text-[10px] text-[#6f3800] uppercase font-semibold tracking-wider">
                Recuperación Global
              </p>
              <p className="font-numeric-data text-lg font-bold text-[#6f3800] mt-0.5">
                {globalRoiPercentage}%
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-[#ffdcc4] flex items-center justify-center text-[#6f3800]">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </div>
          </div>
        </div>

        {/* Fixed Assets Table */}
        <div className="overflow-x-auto border border-[#c1c8c2] rounded-lg">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#c1c8c2] bg-[#F0F9F4] font-label-caps text-[11px] text-[#414844]">
                <th className="py-2.5 px-4 font-semibold">Nombre del Activo</th>
                <th className="py-2.5 px-4 font-semibold text-right">Costo Inicial</th>
                <th className="py-2.5 px-4 font-semibold w-1/3">Progreso de Amortización</th>
                <th className="py-2.5 px-4 font-semibold text-center">Estado</th>
                <th className="py-2.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#c1c8c2]/50">
              {fixedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-[#f4fafd] transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#eef5f7] flex items-center justify-center text-[#012d1d]">
                        <span className="material-symbols-outlined text-[18px]">
                          {asset.icon}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#012d1d] text-sm block">
                          {asset.name}
                        </span>
                        <span className="text-[11px] text-[#717973]">
                          Adquirido: {asset.purchaseDate} · Vida útil: {asset.usefulLifeMonths} meses
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-numeric-data font-semibold text-[#161d1f]">
                    ${asset.initialCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-numeric-data text-[11px] text-[#414844]">
                        <span>Recuperado: ${asset.recoveredAmount.toLocaleString()}</span>
                        <span className="font-bold">{asset.percentage}%</span>
                      </div>
                      <div className="w-full bg-[#dde4e6] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            asset.percentage === 100
                              ? 'bg-[#0e6c4a]'
                              : asset.percentage >= 50
                              ? 'bg-[#012d1d]'
                              : 'bg-[#ea9147]'
                          }`}
                          style={{ width: `${Math.min(asset.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-semibold tracking-wider ${
                        asset.status === 'RECOVERED'
                          ? 'bg-[#eef5f7] border border-[#0e6c4a] text-[#0e6c4a]'
                          : 'bg-[#ffdcc4] text-[#6f3800]'
                      }`}
                    >
                      {asset.status === 'RECOVERED' ? 'RECUPERADO' : 'EN PROCESO'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {onDeleteAsset && (
                      <button
                        type="button"
                        id={`btn-delete-asset-${asset.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssetToDelete(asset);
                        }}
                        className="text-[#717973] hover:text-[#ba1a1a] p-1.5 rounded-lg hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                        title={`Eliminar "${asset.name}"`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Actions Dropdown: rendered in a portal so it always floats above the table's
          scroll containers, no matter how far down the row is. */}
      {openMenuId &&
        menuPosition &&
        activeMenuItem &&
        createPortal(
          <>
            {/* Backdrop for outside click */}
            <div className="fixed inset-0 z-[60]" onClick={closeActionsMenu} />
            <div
              className="fixed z-[70] w-52 bg-white rounded-xl border border-[#c1c8c2] shadow-xl py-1.5 text-left text-xs animate-fadeIn"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 border-b border-[#c1c8c2]/40 mb-1">
                <p className="font-semibold text-[#161d1f] truncate">{activeMenuItem.name}</p>
                <p className="text-[10px] text-[#717973]">
                  {activeMenuItem.category} • {activeMenuItem.provider}
                </p>
              </div>

              {/* 1. Editar */}
              <button
                id={`btn-edit-item-${activeMenuItem.id}`}
                onClick={() => {
                  closeActionsMenu();
                  setEditingItem(activeMenuItem);
                  setIsEditModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f4fafd] flex items-center gap-2.5 text-[#161d1f] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0284c7]">
                  edit
                </span>
                <div>
                  <span className="font-semibold block">Editar</span>
                  <span className="text-[10px] text-[#717973]">
                    Modificar datos y stock
                  </span>
                </div>
              </button>

              {/* 2. Archivar / Desarchivar */}
              <button
                id={`btn-archive-item-${activeMenuItem.id}`}
                onClick={() => {
                  closeActionsMenu();
                  if (onArchiveItem) {
                    onArchiveItem(activeMenuItem);
                  } else {
                    onUpdateItem({ ...activeMenuItem, isArchived: !activeMenuItem.isArchived });
                  }
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f4fafd] flex items-center gap-2.5 text-[#161d1f] transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    activeMenuItem.isArchived ? 'text-[#0e6c4a]' : 'text-[#d97706]'
                  }`}
                >
                  {activeMenuItem.isArchived ? 'unarchive' : 'archive'}
                </span>
                <div>
                  <span className="font-semibold block">
                    {activeMenuItem.isArchived ? 'Desarchivar' : 'Archivar'}
                  </span>
                  <span className="text-[10px] text-[#717973]">
                    {activeMenuItem.isArchived
                      ? 'Reactivar en inventario'
                      : 'Bloquear temporalmente'}
                  </span>
                </div>
              </button>

              <div className="my-1 border-t border-[#c1c8c2]/40" />

              {/* 3. Eliminar */}
              <button
                id={`btn-delete-item-${activeMenuItem.id}`}
                onClick={() => {
                  closeActionsMenu();
                  setItemToDelete(activeMenuItem);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#ffdad6]/40 flex items-center gap-2.5 text-[#ba1a1a] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  delete
                </span>
                <div>
                  <span className="font-semibold block">Eliminar</span>
                  <span className="text-[10px] text-[#ba1a1a]/80">
                    Borrar definitivamente
                  </span>
                </div>
              </button>
            </div>
          </>,
          document.body
        )}

      {/* Edit Inventory Item Modal */}
      <EditInventoryItemModal
        isOpen={isEditModalOpen}
        item={editingItem}
        providers={providers}
        onSaveProvider={onSaveProvider}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(updated) => {
          onUpdateItem(updated);
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Provider Detail Modal */}
      <ProviderDetailModal
        isOpen={!!viewingProviderName}
        providerName={viewingProviderName}
        providers={providers}
        onClose={() => setViewingProviderName(null)}
        onSave={(provider) => {
          onSaveProvider && onSaveProvider(provider);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        itemName={itemToDelete?.name}
        title="¿Eliminar producto definitivamente?"
        message="¿Estás seguro de que deseas eliminar este insumo? Será borrado permanentemente del inventario."
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={() => {
          if (itemToDelete) {
            if (onDeleteItem) {
              onDeleteItem(itemToDelete.id);
            }
            setItemToDelete(null);
            setIsDeleteModalOpen(false);
          }
        }}
      />

      {/* Confirm Delete Fixed Asset Modal */}
      <ConfirmDeleteModal
        isOpen={!!assetToDelete}
        itemName={assetToDelete?.name}
        title="¿Eliminar activo fijo definitivamente?"
        message="¿Estás seguro de que deseas eliminar este activo? Se perderá su historial de amortización/ROI de forma permanente."
        onClose={() => setAssetToDelete(null)}
        onConfirm={() => {
          if (assetToDelete && onDeleteAsset) {
            onDeleteAsset(assetToDelete.id);
          }
          setAssetToDelete(null);
        }}
      />
    </div>
  );
};
