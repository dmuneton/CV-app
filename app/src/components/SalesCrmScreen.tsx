import React, { useState } from 'react';
import { ClientProfile, OrderItem, InventoryItem } from '../types';
import { OrderSummaryModal } from './modals/OrderSummaryModal';
import { EditOrderModal } from './modals/EditOrderModal';
import { EditClientModal } from './modals/EditClientModal';
import { AddClientModal } from './modals/AddClientModal';
import { ClientDetailModal } from './modals/ClientDetailModal';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';
import { PaymentActionMode } from './modals/PaymentMethodModal';
import {
  getClientOrders,
  getClientPurchaseCount,
  getClientTier,
  getClientTotalPurchased,
  ClientTier
} from '../utils/clientPurchases';

interface SalesCrmScreenProps {
  clients: ClientProfile[];
  orders?: OrderItem[];
  inventory?: InventoryItem[];
  onAddClient?: () => void;
  onSaveNewClient?: (client: ClientProfile) => void;
  onExportCRM: () => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderItem['status']) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: OrderItem['paymentStatus']) => void;
  onRequestPayment?: (orderId: string, mode: PaymentActionMode) => void;
  onEditOrder?: (order: OrderItem) => void;
  onDeleteOrder?: (orderId: string) => void;
  onUpdateClient?: (client: ClientProfile) => void;
  onDeleteClient?: (clientId: string) => void;
  onDeleteAllClients?: () => void;
}

type TierFilter = 'ALL' | ClientTier;
type RoleFilter = 'ALL' | 'Empresa' | 'Persona';
type SortOption =
  | 'recent-order-desc'
  | 'recent-order-asc'
  | 'purchases-desc'
  | 'orders-desc'
  | 'name-asc'
  | 'name-desc';

export const SalesCrmScreen: React.FC<SalesCrmScreenProps> = ({
  clients,
  orders = [],
  inventory = [],
  onAddClient,
  onSaveNewClient,
  onExportCRM,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onRequestPayment,
  onEditOrder,
  onDeleteOrder,
  onUpdateClient,
  onDeleteClient,
  onDeleteAllClients
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'cli-1');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<OrderItem | null>(null);
  const [clientToEdit, setClientToEdit] = useState<ClientProfile | null>(null);
  const [clientForDetailModal, setClientForDetailModal] = useState<ClientProfile | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState<boolean>(false);
  const [confirmingDeleteAllClients, setConfirmingDeleteAllClients] = useState<boolean>(false);

  // Filters and sorting for the client grid
  const [gridSearch, setGridSearch] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('recent-order-desc');

  // Selected order derived live from orders prop
  const selectedOrderForSummary = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId) || null
    : null;

  // Helper calculation for all clients in the grid
  const enrichedClients = clients.map((c) => {
    const pCount = getClientPurchaseCount(c, orders);
    const tier = getClientTier(pCount);
    const totalSpent = getClientTotalPurchased(c, orders);
    const cOrders = getClientOrders(c, orders);
    const lastActivity =
      cOrders[0]?.date || (c.purchases && c.purchases[0]?.date) || 'Sin compras';
    const lastItem =
      cOrders[0]?.productSpec || (c.purchases && c.purchases[0]?.item) || 'Sin registros';

    // Calculate recency ranking based on the position in the orders array
    let recencyScore = 0;
    if (cOrders.length > 0) {
      // Find the index of this client's newest order in the master orders list
      const newestOrderIndex = orders.findIndex((o) => cOrders.some((co) => co.id === o.id));
      if (newestOrderIndex !== -1) {
        // Lower index in orders = more recent order => higher score
        recencyScore = 1000000 - newestOrderIndex;
      }
    } else if (c.purchases && c.purchases.length > 0) {
      recencyScore = 500;
    }

    return {
      ...c,
      computedTier: tier,
      computedPurchaseCount: pCount,
      computedTotalSpent: totalSpent,
      lastActivity,
      lastItem,
      ordersList: cOrders,
      recencyScore
    };
  });

  // Client counts by Tier
  const tierCounts = {
    VIP: enrichedClients.filter((c) => c.computedTier === 'VIP').length,
    Recurrente: enrichedClients.filter((c) => c.computedTier === 'Recurrente').length,
    Nuevo: enrichedClients.filter((c) => c.computedTier === 'Nuevo').length
  };

  // Filter and sort the grid clients
  const filteredGridClients = enrichedClients
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(gridSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(gridSearch.toLowerCase()) ||
        c.phone.toLowerCase().includes(gridSearch.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(gridSearch.toLowerCase()));

      const matchesTier = tierFilter === 'ALL' || c.computedTier === tierFilter;
      const matchesRole = roleFilter === 'ALL' || c.role === roleFilter;

      return matchesSearch && matchesTier && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === 'recent-order-desc') {
        return b.recencyScore - a.recencyScore;
      }
      if (sortBy === 'recent-order-asc') {
        return a.recencyScore - b.recencyScore;
      }
      if (sortBy === 'purchases-desc') {
        return b.computedTotalSpent - a.computedTotalSpent;
      }
      if (sortBy === 'orders-desc') {
        return b.computedPurchaseCount - a.computedPurchaseCount;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  const handleOpenAddClient = () => {
    setIsAddClientModalOpen(true);
  };

  const handleClientSaveNew = (newClient: ClientProfile) => {
    if (onSaveNewClient) {
      onSaveNewClient(newClient);
    }
    setSelectedClientId(newClient.id);
  };

  const handleOpenClientFicha = (client: ClientProfile) => {
    setSelectedClientId(client.id);
    setClientForDetailModal(client);
  };

  return (
    <div id="screen-sales-crm" className="space-y-6 animate-fadeIn pb-12">
      {/* ========================================================================= */}
      {/* SECCIÓN PRINCIPAL: DIRECTORIO DE TARJETAS DE CLIENTES                    */}
      {/* ========================================================================= */}
      <section
        id="seccion-cuadricula-clientes"
        className="bg-white border border-[#c1c8c2] rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
      >
        {/* Section Header with Actions and Metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#c1c8c2] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#0e6c4a] text-2xl font-bold">
                grid_view
              </span>
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-[#012d1d] tracking-tight">
                Directorio
              </h1>
            </div>
            <p className="text-xs text-[#717973] mt-1 font-medium">
              {filteredGridClients.length} {filteredGridClients.length === 1 ? 'cliente' : 'clientes'}
            </p>
          </div>

          {/* Quick Metrics Badges & Action Buttons (Right Aligned in same line) */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3">
            {/* Etiquetas / Badges */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffdcc4]/50 border border-[#ffb781] text-xs font-semibold text-[#5f2f00]">
                <span className="material-symbols-outlined text-[16px] text-[#e65100]">star</span>
                <span>VIP ({tierCounts.VIP})</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a0f4c8]/40 border border-[#0e6c4a]/40 text-xs font-semibold text-[#005236]">
                <span className="material-symbols-outlined text-[16px] text-[#0e6c4a]">autorenew</span>
                <span>Recurrente ({tierCounts.Recurrente})</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e0f2fe] border border-[#bae6fd] text-xs font-semibold text-[#0369a1]">
                <span className="material-symbols-outlined text-[16px] text-[#0284c7]">eco</span>
                <span>Nuevo ({tierCounts.Nuevo})</span>
              </div>
            </div>

            {/* Separador vertical */}
            <div className="h-6 w-[1px] bg-[#c1c8c2] hidden sm:block" />

            {/* Action Buttons: Exportar y Nuevo Cliente */}
            <div className="flex items-center gap-2">
              <button
                id="btn-export-crm"
                onClick={onExportCRM}
                className="flex items-center justify-center gap-1.5 bg-white border border-[#c1c8c2] text-[#012d1d] px-3.5 py-1.5 rounded-lg font-label-caps text-xs hover:bg-[#eef5f7] transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Exportar</span>
              </button>
              <button
                id="btn-new-client"
                onClick={handleOpenAddClient}
                className="flex items-center justify-center gap-1.5 bg-[#012d1d] text-white px-3.5 py-1.5 rounded-lg font-label-caps text-xs hover:bg-[#1b4332] transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Nuevo Cliente</span>
              </button>
              {onDeleteAllClients && clients.length > 0 && (
                <button
                  id="btn-delete-all-clients"
                  onClick={() => setConfirmingDeleteAllClients(true)}
                  title="Borrar todos los clientes registrados"
                  className="flex items-center justify-center gap-1.5 bg-white border border-[#ffb4ab] text-[#ba1a1a] px-3.5 py-1.5 rounded-lg font-label-caps text-xs hover:bg-[#ffdad6]/40 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span>Borrar Todos</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717973] text-[18px]">
              search
            </span>
            <input
              id="grid-search-input"
              type="text"
              value={gridSearch}
              onChange={(e) => setGridSearch(e.target.value)}
              placeholder="Buscar cliente por nombre o ciudad..."
              className="w-full bg-[#f4fafd] pl-9 pr-8 py-2.5 rounded-xl border border-[#c1c8c2] text-sm text-[#161d1f] placeholder:text-[#717973] focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] transition-all"
            />
            {gridSearch && (
              <button
                onClick={() => setGridSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717973] hover:text-[#161d1f] p-1"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Pills and Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tier Filter Pills */}
            <div className="flex items-center bg-[#f4fafd] p-1 rounded-xl border border-[#c1c8c2]">
              {(['ALL', 'VIP', 'Recurrente', 'Nuevo'] as TierFilter[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTierFilter(tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    tierFilter === tf
                      ? 'bg-[#012d1d] text-white shadow-xs'
                      : 'text-[#414844] hover:text-[#012d1d] hover:bg-[#eef5f7]'
                  }`}
                >
                  {tf === 'ALL' ? 'Todos' : tf}
                </button>
              ))}
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="bg-[#f4fafd] border border-[#c1c8c2] rounded-xl px-3 py-2 text-xs font-semibold text-[#161d1f] focus:outline-none focus:border-[#0284c7] cursor-pointer"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="Empresa">Solo Empresas</option>
              <option value="Persona">Solo Personas</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#f4fafd] border border-[#c1c8c2] rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[#717973] text-[16px]">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-[#161d1f] focus:outline-none cursor-pointer"
              >
                <option value="recent-order-desc">Orden más nueva a más antigua</option>
                <option value="recent-order-asc">Orden más antigua a más nueva</option>
                <option value="purchases-desc">Mayor Facturación ($)</option>
                <option value="orders-desc">Más Órdenes</option>
                <option value="name-asc">Nombre (A - Z)</option>
                <option value="name-desc">Nombre (Z - A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredGridClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#f4fafd] border border-dashed border-[#c1c8c2] rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#c1ecd4]/40 flex items-center justify-center text-[#012d1d]">
              <span className="material-symbols-outlined text-2xl">person_search</span>
            </div>
            <h3 className="font-headline text-base font-bold text-[#012d1d]">
              No se encontraron clientes con los filtros aplicados
            </h3>
            <p className="text-xs text-[#717973] max-w-sm">
              Intenta cambiar los términos de búsqueda o restablecer los filtros de nivel y rol.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setGridSearch('');
                  setTierFilter('ALL');
                  setRoleFilter('ALL');
                  setSortBy('recent-order-desc');
                }}
                className="px-4 py-2 bg-white border border-[#c1c8c2] rounded-lg text-xs font-semibold text-[#012d1d] hover:bg-[#eef5f7] transition-all cursor-pointer shadow-2xs"
              >
                Restablecer Filtros
              </button>
              <button
                onClick={handleOpenAddClient}
                className="px-4 py-2 bg-[#012d1d] text-white rounded-lg text-xs font-semibold hover:bg-[#1b4332] transition-all cursor-pointer shadow-xs"
              >
                + Registrar Nuevo Cliente
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredGridClients.map((client) => {
              const isSelected = client.id === selectedClientId;

              return (
                <div
                  key={client.id}
                  id={`card-client-${client.id}`}
                  className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 p-5 group ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#c1ecd4]/20 to-white border-[#0e6c4a] ring-2 ring-[#0e6c4a]/30 shadow-md scale-[1.01]'
                      : 'bg-white border-[#c1c8c2] hover:border-[#012d1d] hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Row: Avatar, Name, Tier & Role Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-headline text-base font-bold shrink-0 shadow-2xs border ${
                          client.computedTier === 'VIP'
                            ? 'bg-[#ffdcc4] text-[#5f2f00] border-[#ffb781]'
                            : client.computedTier === 'Recurrente'
                            ? 'bg-[#a0f4c8] text-[#005236] border-[#0e6c4a]'
                            : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                        }`}
                      >
                        {client.initials}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] font-bold border flex items-center gap-1 ${
                            client.computedTier === 'VIP'
                              ? 'bg-[#ffdcc4]/80 text-[#5f2f00] border-[#ffb781]'
                              : client.computedTier === 'Recurrente'
                              ? 'bg-[#a0f4c8]/70 text-[#005236] border-[#0e6c4a]'
                              : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                          }`}
                        >
                          {client.computedTier === 'VIP' && (
                            <span className="material-symbols-outlined text-[12px] text-[#e65100]">star</span>
                          )}
                          {client.computedTier === 'Recurrente' && (
                            <span className="material-symbols-outlined text-[12px] text-[#0e6c4a]">autorenew</span>
                          )}
                          {client.computedTier === 'Nuevo' && (
                            <span className="material-symbols-outlined text-[12px] text-[#0284c7]">eco</span>
                          )}
                          <span>{client.computedTier}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#eef5f7] text-[#012d1d] font-label-caps text-[10px] font-semibold border border-[#c1c8c2]">
                          {client.role}
                        </span>
                      </div>
                    </div>

                    {/* Client Name */}
                    <h3
                      className="font-headline font-bold text-lg text-[#012d1d] truncate group-hover:text-[#0e6c4a] transition-colors"
                      title={client.name}
                    >
                      {client.name}
                    </h3>

                    {/* Address tag if available, or clean placeholder */}
                    <div className="mt-2 text-xs text-[#717973]">
                      {client.address ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[14px] text-[#717973] shrink-0">
                            location_on
                          </span>
                          <span className="truncate" title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#717973]/70">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          <span>Datos completos en ficha</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial & Activity Stats Box */}
                  <div className="mt-4 pt-3 border-t border-[#c1c8c2]/70 space-y-2">
                    <div className="grid grid-cols-2 gap-2 bg-[#f4fafd] p-2.5 rounded-xl border border-[#c1c8c2]/50">
                      <div>
                        <span className="block font-label-caps text-[9px] text-[#717973] uppercase tracking-wider">
                          Total Compras
                        </span>
                        <span className="font-numeric-data font-bold text-sm text-[#0e6c4a]">
                          ${client.computedTotalSpent.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-label-caps text-[9px] text-[#717973] uppercase tracking-wider">
                          Órdenes
                        </span>
                        <span className="font-numeric-data font-semibold text-sm text-[#012d1d]">
                          {client.computedPurchaseCount}{' '}
                          <span className="text-[10px] font-normal text-[#717973]">
                            {client.computedPurchaseCount === 1 ? 'compra' : 'compras'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Latest item snippet */}
                    <div className="flex items-center justify-between text-[10px] text-[#717973] px-1">
                      <span className="truncate max-w-[140px]" title={client.lastItem}>
                        Último: <strong>{client.lastItem}</strong>
                      </span>
                      <span className="shrink-0">{client.lastActivity}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#c1c8c2]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenClientFicha(client)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#012d1d] hover:bg-[#1b4332] text-white transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[15px]">badge</span>
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientToEdit(client)}
                      className="h-8 px-2.5 rounded-lg bg-[#f4fafd] hover:bg-[#eef5f7] border border-[#c1c8c2] flex items-center justify-center gap-1 text-[#414844] hover:text-[#012d1d] transition-colors cursor-pointer text-xs font-medium"
                      title="Editar datos del cliente"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Client Detail Full Ficha Modal (Popup) */}
      <ClientDetailModal
        isOpen={!!clientForDetailModal}
        client={clientForDetailModal}
        orders={orders}
        onClose={() => setClientForDetailModal(null)}
        onEdit={(c) => {
          setClientForDetailModal(null);
          setClientToEdit(c);
        }}
        onSelectOrder={(ordId) => {
          setSelectedOrderId(ordId);
        }}
      />

      {/* Order Summary Modal */}
      <OrderSummaryModal
        isOpen={!!selectedOrderForSummary}
        onClose={() => setSelectedOrderId(null)}
        order={selectedOrderForSummary}
        client={clientForDetailModal || clientToEdit}
        onUpdateStatus={onUpdateOrderStatus}
        onUpdatePaymentStatus={onUpdatePaymentStatus}
        onRequestPayment={onRequestPayment}
        onEdit={
          onEditOrder
            ? (orderToOpen) => {
                setSelectedOrderId(null);
                setOrderToEdit(orderToOpen);
              }
            : undefined
        }
      />

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={!!orderToEdit}
        order={orderToEdit}
        inventory={inventory}
        onClose={() => setOrderToEdit(null)}
        onSave={(updated) => {
          onEditOrder && onEditOrder(updated);
          setOrderToEdit(null);
        }}
        onDelete={
          onDeleteOrder
            ? (orderId) => {
                onDeleteOrder(orderId);
                setOrderToEdit(null);
              }
            : undefined
        }
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={!!clientToEdit}
        client={clientToEdit}
        tier={clientToEdit ? getClientTier(getClientPurchaseCount(clientToEdit, orders)) : 'Nuevo'}
        purchaseCount={clientToEdit ? getClientPurchaseCount(clientToEdit, orders) : 0}
        onClose={() => setClientToEdit(null)}
        onSave={(updated) => {
          onUpdateClient && onUpdateClient(updated);
          setClientToEdit(null);
        }}
        onDelete={
          onDeleteClient
            ? (clientId) => {
                onDeleteClient(clientId);
                setClientToEdit(null);
              }
            : undefined
        }
      />

      {/* Confirm Delete All Clients Modal */}
      <ConfirmDeleteModal
        isOpen={confirmingDeleteAllClients}
        title="¿Borrar todos los clientes?"
        message={`Esta acción no se puede deshacer. Se eliminarán los ${clients.length} clientes registrados (las órdenes ya hechas a su nombre se mantienen en el historial, pero quedarán sin un cliente vinculado).`}
        onClose={() => setConfirmingDeleteAllClients(false)}
        onConfirm={() => {
          if (onDeleteAllClients) onDeleteAllClients();
          setConfirmingDeleteAllClients(false);
        }}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSave={handleClientSaveNew}
      />
    </div>
  );
};
