import { ClientProfile, OrderItem } from '../types';

// Matches an order to a client by name the same way the CRM's "Historial de Compras"
// does — kept as a single source of truth so every screen agrees on which orders
// belong to which client.
export const getClientOrders = (client: ClientProfile, orders: OrderItem[]): OrderItem[] => {
  const clientName = client.name.toLowerCase().trim();
  return orders.filter((o) => {
    const orderClient = o.client.toLowerCase().trim();
    return orderClient === clientName || orderClient.includes(clientName) || clientName.includes(orderClient);
  });
};

// Legacy purchase-history entries that don't already overlap with a registered order —
// avoids double-counting the same sale once it's been entered as a real order.
const getNonOverlappingHistoricalPurchases = (client: ClientProfile, clientOrders: OrderItem[]) =>
  (client.purchases || []).filter(
    (p) =>
      !clientOrders.some(
        (co) =>
          co.productSpec.toLowerCase().includes(p.item.toLowerCase()) ||
          p.item.toLowerCase().includes(co.productSpec.toLowerCase())
      )
  );

// A client's total purchased amount: registered orders, plus any non-overlapping legacy
// purchase history. Mirrors the CRM's "Total Compras" figure exactly, so anything
// summing across clients matches it 1:1.
export const getClientTotalPurchased = (client: ClientProfile, orders: OrderItem[]): number => {
  const clientOrders = getClientOrders(client, orders);
  const realOrdersTotal = clientOrders.reduce((acc, o) => acc + o.value, 0);
  const historicalTotal = getNonOverlappingHistoricalPurchases(client, clientOrders).reduce(
    (acc, p) => acc + p.amount,
    0
  );
  return realOrdersTotal + historicalTotal;
};

// Sum of every registered client's Total Compras — this is the figure the Panel de
// Control's "Ventas Totales" card must always match.
export const getTotalSalesAcrossClients = (clients: ClientProfile[], orders: OrderItem[]): number =>
  clients.reduce((acc, c) => acc + getClientTotalPurchased(c, orders), 0);

// How many times a client has purchased — same "real orders + non-overlapping legacy
// purchases" set used for Total Compras, just counted instead of summed.
export const getClientPurchaseCount = (client: ClientProfile, orders: OrderItem[]): number => {
  const clientOrders = getClientOrders(client, orders);
  return clientOrders.length + getNonOverlappingHistoricalPurchases(client, clientOrders).length;
};

export type ClientTier = 'Nuevo' | 'Recurrente' | 'VIP';

// Nivel 1 "Nuevo": 0–1 compras. Nivel 2 "Recurrente": 2–10 compras. Nivel 3 "VIP": 11+ compras.
export const getClientTier = (purchaseCount: number): ClientTier => {
  if (purchaseCount > 10) return 'VIP';
  if (purchaseCount >= 2) return 'Recurrente';
  return 'Nuevo';
};
