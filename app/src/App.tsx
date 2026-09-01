import React, { useState, useEffect, useRef } from 'react';
import { ScreenType, OrderItem, BOMComponent, ProductTemplate, ClientProfile, FixedAsset, InventoryItem, PurchasedItem, Provider } from './types';
import {
  INITIAL_ORDERS,
  INITIAL_BOM,
  INITIAL_PRODUCT_TEMPLATES,
  CLIENTS_LIST,
  INITIAL_FIXED_ASSETS,
  INITIAL_INVENTORY
} from './data/mockData';
import { fetchAppState, saveAppState } from './api/client';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardScreen } from './components/DashboardScreen';
import { ProductEngineeringScreen } from './components/ProductEngineeringScreen';
import { SalesCrmScreen } from './components/SalesCrmScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { ReportsView } from './components/ReportsView';

import { NewOrderModal } from './components/modals/NewOrderModal';
import { RestockModal, RestockEntry } from './components/modals/RestockModal';
import { AddAssetModal } from './components/modals/AddAssetModal';
import { AddInventoryItemModal } from './components/modals/AddInventoryItemModal';
import { PaymentMethodModal, PaymentActionMode } from './components/modals/PaymentMethodModal';
import { getTotalSalesAcrossClients } from './utils/clientPurchases';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // App State
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [bomList, setBomList] = useState<BOMComponent[]>(INITIAL_BOM);
  const [templates, setTemplates] = useState<ProductTemplate[]>(INITIAL_PRODUCT_TEMPLATES);
  const [clients, setClients] = useState<ClientProfile[]>(CLIENTS_LIST);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  // Master provider directory — offered when adding/editing insumos and restocking,
  // seeded from whoever each insumo currently lists as its provider (name-only records,
  // since we don't have phone/address/canal for legacy data), then grows as new
  // providers are registered with full details.
  const [providers, setProviders] = useState<Provider[]>(() =>
    Array.from(new Set(INITIAL_INVENTORY.map((i) => i.provider).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name, idx) => ({ id: `prov-seed-${idx}`, name }))
  );

  // Upserts a provider by id (or by matching name for a brand-new one) — used whenever
  // an insumo is registered/edited with a new provider, or a provider's own details are
  // completed/edited from the Gestión de Inventario detail view.
  const handleSaveProvider = (provider: Provider) => {
    setProviders((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.id === provider.id || p.name.toLowerCase().trim() === provider.name.toLowerCase().trim()
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...provider, id: next[existingIdx].id };
        return next;
      }
      return [...prev, provider].sort((a, b) => a.name.localeCompare(b.name));
    });
  };
  // Saldo en Caja: starts at $0 / $0 and only accumulates payments confirmed from here on
  const [cashBalance, setCashBalance] = useState<{ efectivo: number; banco: number }>({
    efectivo: 0,
    banco: 0
  });
  // Ganancias Netas: accumulates the share of each paid order's profit that isn't
  // routed to fixed-asset ROI recovery
  const [netProfit, setNetProfit] = useState<number>(0);

  // Modals state
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<{
    order: OrderItem;
    mode: PaymentActionMode;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data sync (Hostinger MySQL via api/data.php) ---------------------------------
  // isLoaded gates the first render so we don't flash the example data before the
  // real saved data (if any) arrives. dbConnected tracks whether the API actually
  // responded at least once — used only to warn once if it never did.
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const skipNextAutosave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchAppState();
      if (cancelled) return;

      if (!result) {
        // API not reachable (local dev without the PHP backend, or Hostinger not
        // configured yet) — keep the example data already in state and just warn.
        setDbConnected(false);
        setIsLoaded(true);
        showToast('⚠️ No se pudo conectar con la base de datos — los cambios no se guardarán hasta que se resuelva.');
        return;
      }

      setDbConnected(true);
      const { state, seeded } = result;

      if (seeded) {
        setOrders(state.orders);
        setInventory(state.inventory);
        setClients(state.clients);
        setTemplates(state.templates);
        setFixedAssets(state.fixedAssets);
        setProviders(state.providers);
        setBomList(state.bomList && state.bomList.length > 0 ? state.bomList : INITIAL_BOM);
        setCashBalance(state.cashBalance);
        setNetProfit(state.netProfit);
      } else {
        // First time ever connecting: the database is empty, so push the current
        // example data up as the starting point for everyone from now on.
        await saveAppState({
          orders,
          inventory,
          clients,
          templates,
          fixedAssets,
          providers,
          bomList,
          cashBalance,
          netProfit
        });
        showToast('🌱 Base de datos conectada por primera vez — se guardaron los datos iniciales.');
      }

      skipNextAutosave.current = true;
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave: whenever any persisted piece of state changes after the initial
  // load, push the full state to the database a moment later (debounced so a
  // burst of clicks — e.g. the quantity steppers — doesn't fire one save per
  // click). Silent on success; a toast only if a save actually fails, since
  // that's the one case the user needs to know about.
  useEffect(() => {
    if (!isLoaded || dbConnected === false) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveAppState({
        orders,
        inventory,
        clients,
        templates,
        fixedAssets,
        providers,
        bomList,
        cashBalance,
        netProfit
      }).then((ok) => {
        if (!ok) showToast('⚠️ No se pudo guardar en la base de datos — revisa tu conexión e inténtalo de nuevo.');
      });
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, inventory, clients, templates, fixedAssets, providers, bomList, cashBalance, netProfit, isLoaded]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Order statuses that mean the confirmed supplies are committed and must be deducted from Inventory
  const INVENTORY_DEDUCTING_STATUSES: OrderItem['status'][] = ['En Producción', 'Terminado', 'Enviado'];
  const shouldDeductInventory = (status: OrderItem['status']) =>
    INVENTORY_DEDUCTING_STATUSES.includes(status);

  // Spanish month abbreviations used in FixedAsset.purchaseDate (e.g. "Ene 2025")
  const SPANISH_MONTHS: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
  };

  // Timestamp of an asset's ROI "fecha de vencimiento" (fecha de compra + vida útil).
  // Assets whose purchase date can't be parsed sort last (treated as farthest away).
  const getAssetDueTimestamp = (asset: FixedAsset): number => {
    const raw = (asset.purchaseDate || '').trim();
    let purchase: Date | null = null;

    if (/^hoy$/i.test(raw)) {
      purchase = new Date();
    } else {
      const match = raw.match(/^([A-Za-zÀ-ÿ]{3,})\.?\s+(\d{4})$/);
      if (match) {
        const month = SPANISH_MONTHS[match[1].slice(0, 3).toLowerCase()];
        const year = parseInt(match[2], 10);
        if (month !== undefined && !isNaN(year)) purchase = new Date(year, month, 1);
      } else {
        const nativeParsed = new Date(raw);
        if (!isNaN(nativeParsed.getTime())) purchase = nativeParsed;
      }
    }

    if (!purchase) return Number.POSITIVE_INFINITY;
    const due = new Date(purchase);
    due.setMonth(due.getMonth() + (asset.usefulLifeMonths || 0));
    return due.getTime();
  };

  // Cost of the confirmed supplies list attached to a paid order (same figure shown
  // as "Insumos y Receta Confirmada" / used to deduct Inventory).
  const calculateOrderBomCost = (order: OrderItem): number => {
    // Multi-product orders (added via "Añadir Producto" in Órdenes) carry their own
    // per-product units — each product's cost must scale by its own count, not the
    // order's combined itemsCount.
    if (order.products && order.products.length > 0) {
      return order.products.reduce((sum, p) => {
        const units = p.itemsCount || 1;
        const productCost = p.bomComponents.reduce(
          (acc, comp) => acc + (comp.isLabor ? comp.totalCost : comp.totalCost * units),
          0
        );
        return sum + productCost;
      }, 0);
    }
    if (!order.bomComponents || order.bomComponents.length === 0) return 0;
    const units = order.itemsCount || 1;
    return order.bomComponents.reduce(
      (acc, comp) => acc + (comp.isLabor ? comp.totalCost : comp.totalCost * units),
      0
    );
  };

  // Splits a paid order's profit (precio de venta - costo de insumos) between fixed-asset
  // ROI recovery — prioritizing the assets with the closest "fecha de vencimiento" — and
  // Ganancias Netas. Once every fixed asset is 100% recuperado, the whole profit goes to
  // Ganancias Netas; the 50/50 split resumes automatically as soon as a new asset (with
  // pending ROI) is registered.
  const allocateOrderProfit = (order: OrderItem) => {
    const bomCost = calculateOrderBomCost(order);
    const profit = order.value - bomCost;
    if (profit <= 0) return;

    const pendingAssets = fixedAssets
      .filter((a) => a.percentage < 100)
      .sort((a, b) => getAssetDueTimestamp(a) - getAssetDueTimestamp(b));

    if (pendingAssets.length === 0) {
      setNetProfit((prev) => prev + profit);
      showToast(
        `💚 Orden ${order.orderId}: ganancia de $${profit.toLocaleString()} sumada íntegra a Ganancias Netas (todos los activos fijos ya recuperaron el 100%).`
      );
      return;
    }

    let roiBudget = Math.round(profit * 0.5);
    const netShare = profit - roiBudget;

    const updatedAssetsById = new Map(fixedAssets.map((a) => [a.id, a]));
    for (const asset of pendingAssets) {
      if (roiBudget <= 0) break;
      const capacity = Math.max(0, asset.initialCost - asset.recoveredAmount);
      const allocation = Math.min(capacity, roiBudget);
      if (allocation <= 0) continue;

      const newRecovered = asset.recoveredAmount + allocation;
      const newPercentage =
        asset.initialCost > 0 ? Math.min(100, Math.round((newRecovered / asset.initialCost) * 100)) : 100;

      updatedAssetsById.set(asset.id, {
        ...asset,
        recoveredAmount: newRecovered,
        percentage: newPercentage,
        status: newPercentage >= 100 ? 'RECOVERED' : 'IN PROGRESS'
      });

      roiBudget -= allocation;
    }

    // Leftover ROI budget means every pending asset just reached 100% — it spills into Ganancias Netas.
    const leftover = roiBudget;
    const netTotal = netShare + leftover;
    const roiApplied = profit - netTotal;

    setFixedAssets(fixedAssets.map((a) => updatedAssetsById.get(a.id) || a));
    setNetProfit((prev) => prev + netTotal);

    showToast(
      `💚 Orden ${order.orderId}: ganancia de $${profit.toLocaleString()} distribuida — $${roiApplied.toLocaleString()} a ROI de activos fijos y $${netTotal.toLocaleString()} a Ganancias Netas.`
    );
  };

  // Helper to deduct confirmed BOM supplies from Inventory when an order reaches a deducting status
  const deductInventoryForOrder = (
    order: OrderItem,
    currentInv: InventoryItem[]
  ): { updatedInventory: InventoryItem[]; deductedCount: number; summary: string } => {
    let updatedInv = [...currentInv];
    let deductedCount = 0;
    const itemNames: string[] = [];

    const applyComponents = (components: BOMComponent[], units: number) => {
      components.forEach((bom) => {
        if (bom.isLabor) return;
        const numQty = typeof bom.qty === 'number' ? bom.qty : parseFloat(String(bom.qty)) || 0;
        if (numQty <= 0) return;

        const totalToDeduct = Math.round(numQty * units * 100) / 100;
        const bomName = bom.name.toLowerCase().trim();

        const idx = updatedInv.findIndex((inv) => {
          const invName = inv.name.toLowerCase().trim();
          return invName === bomName || invName.includes(bomName) || bomName.includes(invName);
        });

        if (idx >= 0) {
          const item = updatedInv[idx];
          const newStock = Math.max(0, Math.round((item.stock - totalToDeduct) * 100) / 100);
          const newStatus: 'alert' | 'ok' | 'warning' =
            newStock <= item.minStock ? 'alert' : newStock <= item.minStock * 1.5 ? 'warning' : 'ok';

          updatedInv[idx] = {
            ...item,
            stock: newStock,
            status: newStatus
          };
          deductedCount++;
          itemNames.push(`${item.name} (-${totalToDeduct} ${item.stockUnit || ''})`);
        }
      });
    };

    // Multi-product orders (added via "Añadir Producto" in Órdenes): deduct each
    // product's own recipe scaled by its own unit count.
    if (order.products && order.products.length > 0) {
      order.products.forEach((p) => applyComponents(p.bomComponents, p.itemsCount || 1));
    } else {
      let componentsToDeduct = order.bomComponents;
      if (!componentsToDeduct || componentsToDeduct.length === 0) {
        const matchedTmpl = templates.find((t) =>
          order.productSpec.toLowerCase().includes(t.name.toLowerCase())
        );
        componentsToDeduct = matchedTmpl ? matchedTmpl.components : bomList;
      }
      applyComponents(componentsToDeduct, order.itemsCount || 1);
    }

    const summary =
      itemNames.slice(0, 2).join(', ') + (itemNames.length > 2 ? ` y ${itemNames.length - 2} más` : '');
    return { updatedInventory: updatedInv, deductedCount, summary };
  };

  // When an order that already deducted Inventory gets its insumos list (or unit count)
  // edited, apply only the DELTA — more quantity than before deducts a bit more, less
  // quantity than before gives some back — instead of re-running the full deduction.
  const adjustInventoryForBomEdit = (
    oldOrder: OrderItem,
    newOrder: OrderItem,
    currentInv: InventoryItem[]
  ): { updatedInventory: InventoryItem[]; changedCount: number; summary: string } => {
    const oldComponents = oldOrder.bomComponents || [];
    const newComponents = newOrder.bomComponents || [];
    const oldUnits = oldOrder.itemsCount || 1;
    const newUnits = newOrder.itemsCount || 1;

    let updatedInv = [...currentInv];
    let changedCount = 0;
    const itemNames: string[] = [];

    const allIds = new Set([...oldComponents.map((c) => c.id), ...newComponents.map((c) => c.id)]);

    allIds.forEach((id) => {
      const oldComp = oldComponents.find((c) => c.id === id);
      const newComp = newComponents.find((c) => c.id === id);
      const refComp = newComp || oldComp;
      if (!refComp || refComp.isLabor) return;

      const oldQty = oldComp ? (typeof oldComp.qty === 'number' ? oldComp.qty : parseFloat(String(oldComp.qty)) || 0) : 0;
      const newQty = newComp ? (typeof newComp.qty === 'number' ? newComp.qty : parseFloat(String(newComp.qty)) || 0) : 0;

      const oldBatchQty = Math.round(oldQty * oldUnits * 100) / 100;
      const newBatchQty = Math.round(newQty * newUnits * 100) / 100;
      const delta = Math.round((newBatchQty - oldBatchQty) * 100) / 100; // + needs more stock, - frees stock up

      if (delta === 0) return;

      const bomName = refComp.name.toLowerCase().trim();
      const idx = updatedInv.findIndex((inv) => {
        const invName = inv.name.toLowerCase().trim();
        return invName === bomName || invName.includes(bomName) || bomName.includes(invName);
      });

      if (idx >= 0) {
        const item = updatedInv[idx];
        const newStock = Math.max(0, Math.round((item.stock - delta) * 100) / 100);
        const newStatus: 'alert' | 'ok' | 'warning' =
          newStock <= item.minStock ? 'alert' : newStock <= item.minStock * 1.5 ? 'warning' : 'ok';

        updatedInv[idx] = { ...item, stock: newStock, status: newStatus };
        changedCount++;
        itemNames.push(
          `${item.name} (${delta > 0 ? '-' : '+'}${Math.abs(delta)} ${item.stockUnit || ''})`
        );
      }
    });

    const summary =
      itemNames.slice(0, 2).join(', ') + (itemNames.length > 2 ? ` y ${itemNames.length - 2} más` : '');
    return { updatedInventory: updatedInv, changedCount, summary };
  };

  // Handlers
  const handleAddOrder = (newOrder: OrderItem) => {
    let orderToSave: OrderItem = { ...newOrder, paymentStatus: newOrder.paymentStatus || 'Pendiente' };
    if (shouldDeductInventory(orderToSave.status)) {
      const { updatedInventory, deductedCount, summary } = deductInventoryForOrder(orderToSave, inventory);
      setInventory(updatedInventory);
      orderToSave.inventoryDeducted = true;
      showToast(`⚙️ Orden ${orderToSave.orderId} en estado "${orderToSave.status}": Se descontaron ${deductedCount} insumos (${summary})`);
    } else {
      orderToSave.inventoryDeducted = false;
      showToast(`✅ Orden ${orderToSave.orderId} registrada para ${orderToSave.client}`);
    }
    setOrders([orderToSave, ...orders]);
  };

  const handleConfirmOrderFromEngineering = (
    newOrder: OrderItem,
    clientData: {
      isExisting: boolean;
      clientId?: string;
      newClient?: Partial<ClientProfile>;
    },
    navigateToCrm?: boolean
  ) => {
    let orderToSave: OrderItem = { ...newOrder, paymentStatus: newOrder.paymentStatus || 'Pendiente' };

    if (shouldDeductInventory(orderToSave.status)) {
      const { updatedInventory, deductedCount, summary } = deductInventoryForOrder(orderToSave, inventory);
      setInventory(updatedInventory);
      orderToSave.inventoryDeducted = true;
      showToast(
        `⚙️ Orden ${orderToSave.orderId} en estado "${orderToSave.status}": Se descontaron ${deductedCount} insumos del inventario (${summary})`
      );
    } else {
      orderToSave.inventoryDeducted = false;
      showToast(`✅ Orden ${orderToSave.orderId} registrada en estado "${orderToSave.status}"`);
    }

    setOrders((prev) => [orderToSave, ...prev]);

    if (!clientData.isExisting && clientData.newClient?.name) {
      const initials =
        clientData.newClient.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'CL';

      const createdClient: ClientProfile = {
        id: `cli-${Date.now()}`,
        name: clientData.newClient.name,
        initials,
        role: clientData.newClient.role || 'Persona',
        tier: clientData.newClient.tier || 'Nivel Estándar',
        email: clientData.newClient.email || '',
        phone: clientData.newClient.phone || '',
        address: clientData.newClient.address || orderToSave.deliveryAddress || '',
        totalPurchased: orderToSave.value,
        purchases: [
          {
            item: orderToSave.productSpec,
            date: 'Hoy',
            amount: orderToSave.value
          }
        ],
        affinity: {
          title: 'Afinidad de Producto',
          description: `Compra inicial registrada: ${orderToSave.productSpec}`,
          recommendation: 'Sugerir Línea Botánica Personalizada',
          probability: 'Alta probabilidad de recompra (85%)'
        }
      };
      setClients((prev) => [createdClient, ...prev]);
    } else if (clientData.isExisting && clientData.clientId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientData.clientId
            ? {
                ...c,
                totalPurchased: (c.totalPurchased || 0) + orderToSave.value,
                purchases: [
                  {
                    item: orderToSave.productSpec,
                    date: 'Hoy',
                    amount: orderToSave.value
                  },
                  ...c.purchases
                ]
              }
            : c
        )
      );
    }

    if (navigateToCrm) {
      setCurrentScreen('sales-crm');
    }
  };

  // "Enviado" is only reachable once a payment (Abono o Pagado) has been registered —
  // an unpaid product doesn't ship.
  const canMarkAsShipped = (order: OrderItem) => order.paymentStatus !== 'Pendiente';

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderItem['status']) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    // Restock (isExpense) orders run on their own two-state track — "Compra Insumos"
    // (stored as 'Pendiente') and "Recibido" — completely separate from the sales-order
    // pipeline below, and receiving is what actually credits Inventory.
    if (targetOrder?.isExpense) {
      if (newStatus === 'Recibido' && targetOrder.status !== 'Recibido') {
        applyRestockReceipt(targetOrder);
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      return;
    }

    if (newStatus === 'Enviado') {
      if (targetOrder && !canMarkAsShipped(targetOrder)) {
        showToast(
          `⚠️ Primero registra un pago (Abono o Pagado) de la orden ${targetOrder.orderId} antes de marcarla como Enviado.`
        );
        return;
      }
    }

    setOrders((prevOrders) => {
      return prevOrders.map((order) => {
        if (order.id !== orderId) return order;

        const wasDeducted = !!order.inventoryDeducted;
        const needsDeduction = shouldDeductInventory(newStatus);

        let updatedOrder: OrderItem = { ...order, status: newStatus };

        if (needsDeduction && !wasDeducted) {
          setInventory((prevInv) => {
            const { updatedInventory, deductedCount, summary } = deductInventoryForOrder(updatedOrder, prevInv);
            showToast(
              `⚙️ Orden ${order.orderId} pasó a "${newStatus}": Se descontaron ${deductedCount} insumos (${summary})`
            );
            return updatedInventory;
          });
          updatedOrder.inventoryDeducted = true;
        } else {
          showToast(`📋 Estado de orden ${order.orderId} cambiado a "${newStatus}"`);
        }

        return updatedOrder;
      });
    });
  };

  // "Abono" and "Pagado" are never applied directly from the dropdown: they first ask
  // for the payment method (and, for "Abono", how much) and only then commit the change
  // via handleConfirmPaymentAction. "Pendiente" has no side effects and applies right away.
  const handleUpdatePaymentStatus = (orderId: string, newPaymentStatus: OrderItem['paymentStatus']) => {
    if (newPaymentStatus === 'Abono' || newPaymentStatus === 'Pagado') {
      const order = orders.find((o) => o.id === orderId);
      if (order) setPendingPaymentAction({ order, mode: newPaymentStatus });
      return;
    }

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
      )
    );
  };

  // Called directly from a "Registrar Nuevo Abono" / "Registrar Pago" action (e.g. inside
  // the order detail modal) — bypasses the dropdown so it can re-open even when the order
  // is already sitting in "Abono".
  const handleRequestPayment = (orderId: string, mode: PaymentActionMode) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) setPendingPaymentAction({ order, mode });
  };

  // Confirms an Abono or a full Pagado: registers the amount in the Panel de Control's
  // Saldo en Caja (Efectivo/Banco), updates how much of the order has been paid, and —
  // only once the order is fully settled — activates ROI/Ganancias Netas distribution.
  const handleConfirmPaymentAction = (method: 'Efectivo' | 'Banco', amount: number) => {
    if (!pendingPaymentAction || amount <= 0) return;
    const { order: baseOrder } = pendingPaymentAction;
    const orderId = baseOrder.id;

    setCashBalance((prev) => ({
      efectivo: prev.efectivo + (method === 'Efectivo' ? amount : 0),
      banco: prev.banco + (method === 'Banco' ? amount : 0)
    }));

    const previousPaid = baseOrder.amountPaid || 0;
    const newAmountPaid = Math.min(baseOrder.value, previousPaid + amount);
    const isFullySettled = newAmountPaid >= baseOrder.value;
    const finalPaymentStatus: OrderItem['paymentStatus'] = isFullySettled ? 'Pagado' : 'Abono';

    if (isFullySettled && !baseOrder.profitAllocated) {
      allocateOrderProfit(baseOrder);
    }

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          paymentStatus: finalPaymentStatus,
          paymentMethod: method,
          amountPaid: newAmountPaid,
          profitAllocated: order.profitAllocated || isFullySettled
        };
      })
    );

    if (finalPaymentStatus === 'Pagado') {
      showToast(
        `💰 Orden ${baseOrder.orderId} pagada en su totalidad (${method}): $${amount.toLocaleString()} registrados en el Panel de Control. Ya puede marcarse como Enviado.`
      );
    } else {
      const remaining = baseOrder.value - newAmountPaid;
      showToast(
        `💵 Orden ${baseOrder.orderId}: abono de $${amount.toLocaleString()} en ${method} registrado. Saldo restante: $${remaining.toLocaleString()}.`
      );
    }

    setPendingPaymentAction(null);
  };

  const handleCancelPaymentAction = () => {
    setPendingPaymentAction(null);
  };

  // Moves money between Efectivo and Banco within Saldo en Caja — doesn't change the
  // total, just how it's split (e.g. you deposited today's cash sales at the bank).
  const handleTransferCash = (
    from: 'efectivo' | 'banco',
    to: 'efectivo' | 'banco',
    amount: number
  ) => {
    if (amount <= 0 || from === to) return;
    setCashBalance((prev) => {
      const safeAmount = Math.min(amount, prev[from]);
      if (safeAmount <= 0) return prev;
      return { ...prev, [from]: prev[from] - safeAmount, [to]: prev[to] + safeAmount };
    });
    const fromLabel = from === 'efectivo' ? 'Efectivo' : 'Banco';
    const toLabel = to === 'efectivo' ? 'Efectivo' : 'Banco';
    showToast(`🔁 $${amount.toLocaleString()} pasados de ${fromLabel} a ${toLabel}.`);
  };

  // Updates an order's general data (client, product spec, value, quantity, insumos) —
  // reachable from the Panel de Control table, the CRM purchase history, and the order
  // detail modal. If Inventory was already deducted for this order, only the delta in
  // insumo quantities is applied — not a full re-deduction.
  const handleEditOrder = (updatedOrder: OrderItem) => {
    const previousOrder = orders.find((o) => o.id === updatedOrder.id);

    if (previousOrder?.inventoryDeducted) {
      const { updatedInventory, changedCount, summary } = adjustInventoryForBomEdit(
        previousOrder,
        updatedOrder,
        inventory
      );
      if (changedCount > 0) {
        setInventory(updatedInventory);
        showToast(`✏️ Orden ${updatedOrder.orderId} actualizada. Inventario ajustado: ${summary}`);
      } else {
        showToast(`✏️ Orden ${updatedOrder.orderId} actualizada`);
      }
    } else {
      showToast(`✏️ Orden ${updatedOrder.orderId} actualizada`);
    }

    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  // Actually applies the restock purchase: adds the bought quantity to stock, recalculates
  // unitCost from what was actually paid (Precio de Compra ÷ Cantidad, same convention as
  // Agregar/Editar Insumo), and updates each item's provider to whoever it was just bought from.
  // Registers the purchase (money out + a Registro de Órdenes entry) but does NOT touch
  // Inventory yet — the insumos physically haven't arrived. Stock only updates once the
  // order is marked "Recibido" (see applyRestockReceipt).
  const handleConfirmRestock = (entries: RestockEntry[], paymentMethod: 'Efectivo' | 'Banco') => {
    if (entries.length === 0) return;
    const itemById = new Map(inventory.map((i) => [i.id, i]));

    const newProviders = entries.map((e) => e.provider.trim()).filter(Boolean);
    if (newProviders.length > 0) {
      setProviders((prev) => {
        const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
        const additions = Array.from(new Set(newProviders))
          .filter((name) => !existingNames.has(name.toLowerCase()))
          .map((name, idx) => ({ id: `prov-${Date.now()}-${idx}`, name }));
        if (additions.length === 0) return prev;
        return [...prev, ...additions].sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    const totalSpent = Math.round(entries.reduce((acc, e) => acc + e.purchasePrice, 0));

    // Money out: shows up as a negative-value entry in Registro de Órdenes and comes
    // straight out of Saldo en Caja — mirrors how a sale's payment goes the other way.
    setCashBalance((prev) => ({
      efectivo: prev.efectivo - (paymentMethod === 'Efectivo' ? totalSpent : 0),
      banco: prev.banco - (paymentMethod === 'Banco' ? totalSpent : 0)
    }));

    const distinctProviders = Array.from(new Set(newProviders));
    const providerLabel =
      distinctProviders.length === 1 ? distinctProviders[0] : `${distinctProviders.length} proveedores`;
    const namesSummary =
      entries
        .slice(0, 2)
        .map((e) => itemById.get(e.itemId)?.name || 'Insumo')
        .join(', ') + (entries.length > 2 ? ` y ${entries.length - 2} más` : '');

    const purchasedItems: PurchasedItem[] = entries.map((e) => {
      const item = itemById.get(e.itemId);
      return {
        itemId: e.itemId,
        name: item?.name || 'Insumo',
        qty: e.purchaseQty,
        unit: item?.stockUnit || '',
        unitCost: e.purchaseQty > 0 ? Math.round((e.purchasePrice / e.purchaseQty) * 10000) / 10000 : 0,
        totalCost: e.purchasePrice,
        provider: e.provider
      };
    });

    const expenseEntry: OrderItem = {
      id: `restock-${Date.now()}`,
      orderId: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      client: providerLabel,
      productSpec: `Compra de Insumos: ${namesSummary}`,
      value: -totalSpent,
      status: 'Pendiente',
      paymentStatus: 'Pagado',
      paymentMethod,
      amountPaid: totalSpent,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      itemsCount: entries.length,
      profitAllocated: true,
      isExpense: true,
      purchasedItems
    };
    setOrders((prev) => [expenseEntry, ...prev]);

    showToast(
      `📦 Compra registrada: ${entries.length} ${entries.length === 1 ? 'insumo' : 'insumos'}, -$${totalSpent.toLocaleString()} desde ${paymentMethod}. Márcala "Recibido" cuando llegue para sumarla al inventario.`
    );
  };

  // Only fires when a restock (isExpense) order's status is set to "Recibido" — adds
  // what was actually bought to Inventory and refreshes cost/provider/alert level.
  const applyRestockReceipt = (order: OrderItem) => {
    const items = order.purchasedItems || [];
    if (items.length === 0) return;
    const itemByOrderId = new Map(items.map((p) => [p.itemId, p]));

    setInventory((prevInv) =>
      prevInv.map((item) => {
        const purchased = itemByOrderId.get(item.id);
        if (!purchased || purchased.qty <= 0) return item;

        const newStock = Math.round((item.stock + purchased.qty) * 100) / 100;
        const newStatus: InventoryItem['status'] =
          newStock <= item.minStock ? 'alert' : newStock <= item.minStock * 1.5 ? 'warning' : 'ok';

        return {
          ...item,
          stock: newStock,
          unitCost: purchased.unitCost,
          provider: purchased.provider || item.provider,
          status: newStatus
        };
      })
    );

    showToast(
      `✅ Orden ${order.orderId} recibida: ${items.length} ${items.length === 1 ? 'insumo sumado' : 'insumos sumados'} al inventario.`
    );
  };

  const handleAddAsset = (newAsset: FixedAsset) => {
    setFixedAssets([...fixedAssets, newAsset]);
    showToast(`💼 Activo "${newAsset.name}" registrado exitosamente`);
  };

  const handleDeleteAsset = (id: string) => {
    const asset = fixedAssets.find((a) => a.id === id);
    setFixedAssets((prev) => prev.filter((a) => a.id !== id));
    showToast(`🗑️ Activo "${asset ? asset.name : ''}" eliminado definitivamente`);
  };

  const handleAddItemToInventory = (newItem: InventoryItem) => {
    const updatedInventoryList = [newItem, ...inventory];
    setInventory(updatedInventoryList);

    // Sincronización automática inmediata de BOM
    if (newItem?.name) {
      const newItemName = newItem.name.toLowerCase();
      setBomList((prevBom) =>
        prevBom.map((bom) => {
          if (!bom.isLabor && bom.name) {
            const bomName = bom.name.toLowerCase();
            const isMatch = newItemName.includes(bomName) || bomName.includes(newItemName);
            if (isMatch) {
              const unit = newItem.unitCost;
              const numericQty = typeof bom.qty === 'number' ? bom.qty : parseFloat(String(bom.qty)) || 1;
              const total = Math.round(numericQty * unit);
              return { ...bom, unitCost: unit, totalCost: total };
            }
          }
          return bom;
        })
      );
    }

    showToast(`🌿 "${newItem.name}" agregado y costos sincronizados en tiempo real`);
  };

  const handleUpdateInventoryItem = (updated: InventoryItem) => {
    const updatedInventoryList = inventory.map((i) => (i.id === updated.id ? updated : i));
    setInventory(updatedInventoryList);

    // Sincronización automática inmediata de BOM
    if (updated?.name) {
      const updatedName = updated.name.toLowerCase();
      setBomList((prevBom) =>
        prevBom.map((bom) => {
          if (!bom.isLabor && bom.name) {
            const bomName = bom.name.toLowerCase();
            const isMatch = updatedName.includes(bomName) || bomName.includes(updatedName);
            if (isMatch) {
              const unit = updated.unitCost;
              const numericQty = typeof bom.qty === 'number' ? bom.qty : parseFloat(String(bom.qty)) || 1;
              const total = Math.round(numericQty * unit);
              return { ...bom, unitCost: unit, totalCost: total };
            }
          }
          return bom;
        })
      );
    }

    showToast(`🔄 "${updated.name}" actualizado y costos sincronizados inmediatamente`);
  };

  const handleDeleteInventoryItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    setInventory(inventory.filter((i) => i.id !== id));
    showToast(`🗑️ "${item ? item.name : 'Producto'}" eliminado definitivamente`);
  };

  const handleArchiveInventoryItem = (item: InventoryItem) => {
    const isNowArchived = !item.isArchived;
    const updated: InventoryItem = { ...item, isArchived: isNowArchived };
    setInventory(inventory.map((i) => (i.id === item.id ? updated : i)));
    showToast(
      isNowArchived
        ? `📦 "${item.name}" archivado (bloqueado temporalmente)`
        : `✅ "${item.name}" desarchivado y reactivado en el inventario`
    );
  };

  const handleUpdateClient = (updatedClient: ClientProfile) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    showToast(`✏️ Cliente "${updatedClient.name}" actualizado`);
  };

  const handleSaveNewClient = (newClient: ClientProfile) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`👤 Nuevo cliente "${newClient.name}" registrado en CRM Clientes`);
  };

  const handleSaveTemplate = (newTemplate: ProductTemplate) => {
    setTemplates((prev) => {
      const existsIndex = prev.findIndex(
        (t) => t.id === newTemplate.id || t.name.toLowerCase().trim() === newTemplate.name.toLowerCase().trim()
      );
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newTemplate;
        return updated;
      }
      return [newTemplate, ...prev];
    });
    showToast(`✨ Plantilla "${newTemplate.name}" guardada exitosamente como producto predeterminado`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (target) {
      showToast(`🗑️ Plantilla "${target.name}" eliminada de los productos predeterminados`);
    }
  };

  const handleExportReport = (scenarioData: any) => {
    showToast(`📄 Reporte de Escenarios de Rentabilidad exportado en formato de auditoría`);
  };

  const handleExportCRM = () => {
    showToast(`📊 Directorio de clientes de alto valor exportado a Excel / PDF`);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4fafd]">
        <div className="flex flex-col items-center gap-3 text-[#012d1d]">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          <span className="text-sm font-semibold">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4fafd] text-[#161d1f] font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#012d1d] text-[#c1ecd4] px-4 py-3 rounded-xl border border-[#c1ecd4]/30 shadow-lg text-xs font-semibold flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewOrder={() => setCurrentScreen('product-engineering')}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          onOpenNotifications={() => {
            showToast(`🔔 Tienes 12 alertas de inventario bajo y 45 lotes en producción.`);
          }}
        />

        {/* Screen Routing Content */}
        <main className="flex-1 p-4 md:pl-6 md:pr-10 md:py-10 max-w-7xl w-full mx-auto">
          {currentScreen === 'dashboard' && (
            <DashboardScreen
              orders={orders}
              clients={clients}
              inventory={inventory}
              totalSales={getTotalSalesAcrossClients(clients, orders)}
              cashBalance={cashBalance}
              netProfit={netProfit}
              onNavigate={(s) => setCurrentScreen(s)}
              onNewSale={() => setIsNewOrderOpen(true)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onRequestPayment={handleRequestPayment}
              onEditOrder={handleEditOrder}
              onTransferCash={handleTransferCash}
              searchTerm={globalSearchTerm}
            />
          )}

          {currentScreen === 'product-engineering' && (
            <ProductEngineeringScreen
              bomList={bomList}
              onUpdateBOM={setBomList}
              onExportReport={handleExportReport}
              inventory={inventory}
              templates={templates}
              clients={clients}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onConfirmOrder={handleConfirmOrderFromEngineering}
            />
          )}

          {currentScreen === 'sales-crm' && (
            <SalesCrmScreen
              clients={clients}
              orders={orders}
              inventory={inventory}
              onAddClient={() => setIsNewOrderOpen(true)}
              onSaveNewClient={handleSaveNewClient}
              onExportCRM={handleExportCRM}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onRequestPayment={handleRequestPayment}
              onEditOrder={handleEditOrder}
              onUpdateClient={handleUpdateClient}
            />
          )}

          {(currentScreen === 'inventory' || currentScreen === 'fixed-assets') && (
            <InventoryScreen
              inventory={inventory}
              fixedAssets={fixedAssets}
              providers={providers}
              onSaveProvider={handleSaveProvider}
              onOpenAddInventoryModal={() => setIsAddInventoryOpen(true)}
              onOpenRestockModal={() => setIsRestockOpen(true)}
              onUpdateItem={handleUpdateInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
              onArchiveItem={handleArchiveInventoryItem}
              onAddAsset={() => setIsAddAssetOpen(true)}
              onDeleteAsset={handleDeleteAsset}
              searchTerm={globalSearchTerm}
              onSearchChange={setGlobalSearchTerm}
            />
          )}

          {currentScreen === 'reports' && (
            <ReportsView
              orders={orders}
              clients={clients}
              fixedAssets={fixedAssets}
              inventory={inventory}
              cashBalance={cashBalance}
              netProfit={netProfit}
              onBackToDashboard={() => setCurrentScreen('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleAddOrder}
      />

      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        inventory={inventory}
        criticalItems={inventory.filter((item) => !item.isArchived && item.stock <= item.minStock)}
        providers={providers.map((p) => p.name)}
        onConfirmRestock={handleConfirmRestock}
      />

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAddAsset={handleAddAsset}
      />

      <AddInventoryItemModal
        isOpen={isAddInventoryOpen}
        onClose={() => setIsAddInventoryOpen(false)}
        onAddItem={handleAddItemToInventory}
        providers={providers}
        onSaveProvider={handleSaveProvider}
      />

      <PaymentMethodModal
        isOpen={!!pendingPaymentAction}
        order={pendingPaymentAction?.order || null}
        mode={pendingPaymentAction?.mode || null}
        onCancel={handleCancelPaymentAction}
        onConfirm={handleConfirmPaymentAction}
      />
    </div>
  );
}
