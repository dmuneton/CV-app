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

export const REPORTS_START_YEAR = 2023;

export interface SalesPeriodPoint {
  key: string;
  label: string;
  count: number;
}

// Qué tanto abarca el gráfico y cómo se parte en puntos:
// - month:   un mes puntual de un año -> un punto por día de ese mes.
// - quarter: un trimestre puntual de un año -> un punto por mes de ese trimestre.
// - year, mode 'all':    todo el histórico (desde REPORTS_START_YEAR) -> un punto por año.
// - year, mode 'single': un año puntual -> un punto por mes de ese año.
export type SalesScope =
  | { granularity: 'month'; month: number; year: number } // month: 0-11
  | { granularity: 'quarter'; quarter: number; year: number } // quarter: 0-3
  | { granularity: 'year'; mode: 'all' } | { granularity: 'year'; mode: 'single'; year: number };

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

// Nombres completos — para los selectores de mes en la UI (MONTH_LABEL de arriba
// son las versiones cortas que usa el propio gráfico en sus etiquetas).
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const countOnDay = (dates: Date[], y: number, m: number, d: number) =>
  dates.filter((dt) => dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d).length;

const countInMonth = (dates: Date[], y: number, m: number) =>
  dates.filter((dt) => dt.getFullYear() === y && dt.getMonth() === m).length;

const countInYear = (dates: Date[], y: number) => dates.filter((dt) => dt.getFullYear() === y).length;

/**
 * Cantidad de órdenes (no compras de insumos) por punto, según el alcance elegido
 * (`scope`) — nunca se listan periodos futuros.
 */
export function getSalesOverTime(orders: OrderItem[], scope: SalesScope): SalesPeriodPoint[] {
  const now = new Date();
  const dates = orders.filter((o) => !o.isExpense).map(getOrderDate);
  const points: SalesPeriodPoint[] = [];

  if (scope.granularity === 'month') {
    const { year: y, month: m } = scope;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
    const lastDay = isCurrentMonth ? now.getDate() : y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth()) ? 0 : daysInMonth;
    for (let d = 1; d <= lastDay; d++) {
      points.push({ key: `${y}-${m}-${d}`, label: String(d), count: countOnDay(dates, y, m, d) });
    }
  } else if (scope.granularity === 'quarter') {
    const { year: y, quarter: q } = scope;
    const isFutureYear = y > now.getFullYear();
    for (let m = q * 3; m <= q * 3 + 2; m++) {
      if (isFutureYear || (y === now.getFullYear() && m > now.getMonth())) break;
      points.push({ key: `${y}-${m}`, label: `${MONTH_LABEL[m]} ${y}`, count: countInMonth(dates, y, m) });
    }
  } else if (scope.mode === 'all') {
    for (let y = REPORTS_START_YEAR; y <= now.getFullYear(); y++) {
      points.push({ key: String(y), label: String(y), count: countInYear(dates, y) });
    }
  } else {
    const y = scope.year;
    const isFutureYear = y > now.getFullYear();
    const lastM = isFutureYear ? -1 : y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = 0; m <= lastM; m++) {
      points.push({ key: `${y}-${m}`, label: `${MONTH_LABEL[m]} ${y}`, count: countInMonth(dates, y, m) });
    }
  }

  return points;
}
