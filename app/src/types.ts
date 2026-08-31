export type ScreenType = 
  | 'dashboard' 
  | 'product-engineering' 
  | 'sales-crm' 
  | 'inventory' 
  | 'fixed-assets' 
  | 'reports';

export interface OrderItem {
  id: string;
  orderId: string;
  client: string;
  productSpec: string;
  value: number;
  /** Production/fulfillment status — independent from paymentStatus. "Enviado" is only
   *  reachable once paymentStatus is "Abono" or "Pagado" (an unpaid product doesn't ship).
   *  "Recibido" only applies to restock expense orders (isExpense) — never offered for
   *  regular client orders. */
  status: 'Pendiente' | 'En Producción' | 'Terminado' | 'Enviado' | 'Recibido';
  /** Payment status — independent from status (production). */
  paymentStatus: 'Pendiente' | 'Abono' | 'Pagado';
  date: string;
  /** Real timestamp (ISO 8601) set automatically when the order is created — used for
   *  charts and anything that needs to place the order on an actual calendar, since
   *  `date` above is just a display label (e.g. "Hoy, 10:45 AM") and not parseable.
   *  Absent on orders created before this field existed. */
  createdAt?: string;
  itemsCount: number;
  bomComponents?: BOMComponent[];
  /** Present when this order bundles more than one product (via "Añadir Producto" in
   *  Órdenes). When set, this is the source of truth for insumos/cost/deduction — the
   *  top-level productSpec/value/itemsCount above are kept as a best-effort combined
   *  summary for screens that only know about a single-product order. */
  products?: OrderProductLine[];
  inventoryDeducted?: boolean;
  /** Method of the most recent payment/abono */
  paymentMethod?: 'Efectivo' | 'Banco';
  /** Cumulative amount paid so far (partial abonos + final settlement) */
  amountPaid?: number;
  /** Guards against double-crediting ROI/Ganancias Netas if paymentStatus reaches "Pagado" more than once */
  profitAllocated?: boolean;
  /** Where this specific order ships — may differ from the client's stored address */
  deliveryAddress?: string;
  /** Marks this as a non-sales ledger entry (e.g. an inventory restock purchase) instead
   *  of a client order — shown read-only in Registro de Órdenes with a negative value. */
  isExpense?: boolean;
  /** The insumos bought in a restock purchase (isExpense orders only). Applied to
   *  Inventory only once the order's status is set to "Recibido". */
  purchasedItems?: PurchasedItem[];
}

export interface PurchasedItem {
  itemId: string;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  provider: string;
}

/** One product within a multi-product order (see OrderItem.products). Mirrors the
 *  fields a single-product order used to keep at the top level, scoped per product. */
export interface OrderProductLine {
  id: string;
  productName: string;
  itemsCount: number;
  salePrice: number;
  /** Cost per unit of this product, computed from bomComponents at confirm time. */
  unitCost: number;
  bomComponents: BOMComponent[];
}

export interface BOMComponent {
  id: string;
  name: string;
  qty: number | string;
  unitCost: number;
  totalCost: number;
  isLabor?: boolean;
  unit?: string;
}

export interface ProductTemplate {
  id: string;
  name: string;
  description?: string;
  defaultSalePrice?: number;
  components: BOMComponent[];
  createdAt?: string;
}

export interface PrototypeMaterial {
  id: string;
  name: string;
  category: string;
  additionalCost: number;
  description: string;
  unit: string;
  icon?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  initials: string;
  tier: string;
  role: string;
  email: string;
  phone: string;
  identification?: string;
  address?: string;
  totalPurchased: number;
  purchases: {
    item: string;
    date: string;
    amount: number;
  }[];
  affinity: {
    title: string;
    description: string;
    recommendation: string;
    probability: string;
  };
}

export interface FixedAsset {
  id: string;
  name: string;
  icon: 'cut' | 'print' | 'precision_manufacturing' | 'build' | 'computer' | 'terminal' | 'code' | string;
  initialCost: number;
  recoveredAmount: number;
  percentage: number;
  status: 'IN PROGRESS' | 'RECOVERED';
  purchaseDate: string;
  usefulLifeMonths: number;
}

export interface InventoryItem {
  id: string;
  status: 'alert' | 'ok' | 'warning';
  name: string;
  provider: string;
  unitCost: number;
  stock: number;
  stockUnit: string;
  leadTime: string;
  leadTimeType: 'LOCAL' | 'INT';
  leadTimeDays: number;
  category: 'Papelería' | 'Plantas' | 'Acabados' | 'Hardware' | 'Botánica' | 'Macetas';
  minStock: number;
  isArchived?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  /** How this provider was first contacted (e.g. WhatsApp, Feria, Referido) */
  contactChannel?: string;
}
