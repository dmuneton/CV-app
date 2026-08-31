import { OrderItem } from '../types';

export interface ProductSalesSlice {
  name: string;
  value: number;
}

/**
 * Ventas ($) por producto, combinando órdenes de un solo producto (productSpec)
 * y órdenes multi-producto (order.products), tal como quedaron registradas en
 * Órdenes. Las compras de insumos (isExpense) nunca cuentan como venta.
 */
export function getProductSales(orders: OrderItem[]): ProductSalesSlice[] {
  const totals = new Map<string, number>();

  orders.forEach((o) => {
    if (o.isExpense) return;

    if (o.products && o.products.length > 0) {
      o.products.forEach((p) => {
        const key = p.productName.trim() || 'Producto sin nombre';
        totals.set(key, (totals.get(key) || 0) + p.salePrice * (p.itemsCount || 1));
      });
    } else {
      const key = o.productSpec.trim() || 'Producto sin nombre';
      totals.set(key, (totals.get(key) || 0) + o.value);
    }
  });

  return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

/**
 * Un gráfico de torta con muchas categorías es ilegible — máximo ~6 porciones a
 * la vez. Si hay más productos que `max`, se muestran los de mayor venta y el
 * resto se agrupa en "Otros".
 */
export function capSlices(slices: ProductSalesSlice[], max: number): ProductSalesSlice[] {
  if (slices.length <= max) return slices;
  const head = slices.slice(0, max - 1);
  const restTotal = slices.slice(max - 1).reduce((acc, s) => acc + s.value, 0);
  return [...head, { name: 'Otros', value: restTotal }];
}

export type SalesGranularity = 'month' | 'quarter' | 'year';

export interface SalesPeriodPoint {
  key: string;
  label: string;
  count: number;
}

// La fecha real de una orden: su propio createdAt si existe, o "hoy" si no —
// las órdenes creadas antes de que existiera este campo se ubican en el periodo
// actual en vez de desaparecer del gráfico.
const getOrderDate = (o: OrderItem): Date => {
  if (o.createdAt) {
    const parsed = new Date(o.createdAt);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const MONTH_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Cantidad de órdenes (no compras de insumos) por periodo, desde `startYear`
 * hasta el periodo actual — nunca se listan periodos futuros.
 */
export function getSalesOverTime(
  orders: OrderItem[],
  granularity: SalesGranularity,
  startYear = 2023
): SalesPeriodPoint[] {
  const now = new Date();
  const dates = orders.filter((o) => !o.isExpense).map(getOrderDate);
  const points: SalesPeriodPoint[] = [];

  if (granularity === 'year') {
    for (let y = startYear; y <= now.getFullYear(); y++) {
      const count = dates.filter((d) => d.getFullYear() === y).length;
      points.push({ key: String(y), label: String(y), count });
    }
  } else if (granularity === 'quarter') {
    for (let y = startYear; y <= now.getFullYear(); y++) {
      const lastQ = y === now.getFullYear() ? Math.floor(now.getMonth() / 3) : 3;
      for (let q = 0; q <= lastQ; q++) {
        const count = dates.filter((d) => d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q).length;
        points.push({ key: `${y}-T${q + 1}`, label: `T${q + 1} ${y}`, count });
      }
    }
  } else {
    for (let y = startYear; y <= now.getFullYear(); y++) {
      const lastM = y === now.getFullYear() ? now.getMonth() : 11;
      for (let m = 0; m <= lastM; m++) {
        const count = dates.filter((d) => d.getFullYear() === y && d.getMonth() === m).length;
        points.push({ key: `${y}-${m}`, label: `${MONTH_LABEL[m]} ${String(y).slice(2)}`, count });
      }
    }
  }

  return points;
}
