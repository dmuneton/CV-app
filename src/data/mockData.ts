import {
  OrderItem,
  BOMComponent,
  ProductTemplate,
  PrototypeMaterial,
  ClientProfile,
  FixedAsset,
  InventoryItem
} from '../types';

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord-1',
    orderId: 'ORD-0092',
    client: 'Boutique Flores',
    productSpec: 'Agenda Botánica Argolla Lateral',
    value: 29000,
    status: 'Pendiente',
    paymentStatus: 'Pendiente',
    date: 'Hoy, 10:45 AM',
    itemsCount: 1
  },
  {
    id: 'ord-2',
    orderId: 'ORD-0091',
    client: 'Estudio de Diseño X',
    productSpec: 'Planificador Semanal Botánico',
    value: 70000,
    status: 'En Producción',
    paymentStatus: 'Abono',
    paymentMethod: 'Efectivo',
    amountPaid: 30000,
    date: 'Hoy, 09:15 AM',
    itemsCount: 2
  },
  {
    id: 'ord-3',
    orderId: 'ORD-0090',
    client: 'Eventos Corporativos S.A.S.',
    productSpec: 'Agenda Botánica Argolla Lateral',
    value: 290000,
    status: 'Pendiente',
    paymentStatus: 'Pendiente',
    date: 'Ayer, 04:30 PM',
    itemsCount: 10
  },
  {
    id: 'ord-4',
    orderId: 'ORD-0089',
    client: 'Soluciones Verticales',
    productSpec: 'Libreta Kraft Botánica Semilla',
    value: 110000,
    status: 'Terminado',
    paymentStatus: 'Pendiente',
    date: 'Ayer, 11:20 AM',
    itemsCount: 5
  },
  {
    id: 'ord-5',
    orderId: 'ORD-0088',
    client: 'Mariluz Ochoa Minorista',
    productSpec: 'Cuaderno de Bocetos Papel Algodón 240g',
    value: 48500,
    status: 'Enviado',
    paymentStatus: 'Pagado',
    paymentMethod: 'Efectivo',
    amountPaid: 48500,
    profitAllocated: true,
    date: '20 Oct, 2026',
    itemsCount: 2
  },
  {
    id: 'ord-6',
    orderId: 'ORD-0087',
    client: 'EcoTienda Medellín',
    productSpec: 'Libreta Kraft Botánica Semilla',
    value: 220000,
    status: 'Terminado',
    paymentStatus: 'Pendiente',
    date: '19 Oct, 2026',
    itemsCount: 10
  },
  {
    id: 'ord-7',
    orderId: 'ORD-0086',
    client: 'Agencia Verde Vivo',
    productSpec: 'Planificador Semanal Botánico',
    value: 175000,
    status: 'Enviado',
    paymentStatus: 'Pagado',
    paymentMethod: 'Banco',
    amountPaid: 175000,
    profitAllocated: true,
    date: '18 Oct, 2026',
    itemsCount: 5
  },
  {
    id: 'ord-8',
    orderId: 'ORD-0085',
    client: 'Café & Jardín Gourmet',
    productSpec: 'Agenda Botánica Argolla Lateral',
    value: 87000,
    status: 'Terminado',
    paymentStatus: 'Pendiente',
    date: '17 Oct, 2026',
    itemsCount: 3
  },
  {
    id: 'ord-9',
    orderId: 'ORD-0084',
    client: 'Papelería Holística',
    productSpec: 'Cuaderno de Bocetos Papel Algodón',
    value: 145000,
    status: 'Enviado',
    paymentStatus: 'Pagado',
    paymentMethod: 'Banco',
    amountPaid: 145000,
    profitAllocated: true,
    date: '16 Oct, 2026',
    itemsCount: 6
  },
  {
    id: 'ord-10',
    orderId: 'ORD-0083',
    client: 'Boutique Artesanal S.A.',
    productSpec: 'Libreta Kraft Botánica Semilla',
    value: 88000,
    status: 'Terminado',
    paymentStatus: 'Pendiente',
    date: '15 Oct, 2026',
    itemsCount: 4
  },
  {
    id: 'ord-11',
    orderId: 'ORD-0082',
    client: 'Hotel Boutique Las Palmas',
    productSpec: 'Agenda Botánica Argolla Lateral',
    value: 580000,
    status: 'Enviado',
    paymentStatus: 'Pagado',
    paymentMethod: 'Banco',
    amountPaid: 580000,
    profitAllocated: true,
    date: '14 Oct, 2026',
    itemsCount: 20
  },
  {
    id: 'ord-12',
    orderId: 'ORD-0081',
    client: 'Vivero El Manantial',
    productSpec: 'Planificador Semanal Botánico',
    value: 350000,
    status: 'Enviado',
    paymentStatus: 'Pagado',
    paymentMethod: 'Efectivo',
    amountPaid: 350000,
    profitAllocated: true,
    date: '12 Oct, 2026',
    itemsCount: 10
  }
];

export const INITIAL_BOM: BOMComponent[] = [
  {
    id: 'bom-1',
    name: 'Papel Botánico Premium',
    qty: 100,
    unitCost: 45,
    totalCost: 4500,
    unit: 'hojas'
  },
  {
    id: 'bom-2',
    name: 'Tapa de Cartón Reciclado',
    qty: 2,
    unitCost: 1200,
    totalCost: 2400,
    unit: 'tapas'
  },
  {
    id: 'bom-3',
    name: 'Resortes Metálicos (Espirales)',
    qty: 0.08,
    unitCost: 50000,
    totalCost: 4000,
    unit: 'rollo'
  },
  {
    id: 'bom-4',
    name: 'Argollas Laterales',
    qty: 1,
    unitCost: 3833,
    totalCost: 3833,
    unit: 'juego'
  },
  {
    id: 'bom-5',
    name: 'Mano de Obra Directa',
    qty: 1,
    unitCost: 8000,
    totalCost: 8000,
    isLabor: true,
    unit: 'personas'
  }
];

export const INITIAL_PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Agenda argolla lateral',
    description: 'Agenda botánica tamaño estándar con argollas laterales y papel artesanal',
    defaultSalePrice: 29000,
    components: INITIAL_BOM,
    createdAt: '2026-01-15'
  },
  {
    id: 'tmpl-2',
    name: 'Cuaderno Pasta Dura A5',
    description: 'Cuaderno cosido con tapas duras forradas en tela botánica y cinta marcadora',
    defaultSalePrice: 38000,
    components: [
      {
        id: 'bom-t2-1',
        name: 'Papel Botánico Premium',
        qty: 120,
        unitCost: 45,
        totalCost: 5400,
        unit: 'hojas'
      },
      {
        id: 'bom-t2-2',
        name: 'Tapa de Cartón Reciclado',
        qty: 2,
        unitCost: 1200,
        totalCost: 2400,
        unit: 'tapas'
      },
      {
        id: 'bom-t2-3',
        name: 'Cinta de Seda Botánica',
        qty: 0.5,
        unitCost: 2800,
        totalCost: 1400,
        unit: 'metros'
      },
      {
        id: 'bom-t2-4',
        name: 'Mano de Obra Directa',
        qty: 1,
        unitCost: 9500,
        totalCost: 9500,
        unit: 'personas',
        isLabor: true
      }
    ],
    createdAt: '2026-02-10'
  },
  {
    id: 'tmpl-3',
    name: 'Libreta Kraft Botánica Semilla',
    description: 'Libreta flexible con portada en papel semilla plantable',
    defaultSalePrice: 22000,
    components: [
      {
        id: 'bom-t3-1',
        name: 'Papel Reciclado Artesanal',
        qty: 60,
        unitCost: 55,
        totalCost: 3300,
        unit: 'hojas'
      },
      {
        id: 'bom-t3-2',
        name: 'Papel Semilla Plantable',
        qty: 1,
        unitCost: 2500,
        totalCost: 2500,
        unit: 'pliego'
      },
      {
        id: 'bom-t3-3',
        name: 'Costura Copta e Hilo Encerado',
        qty: 1,
        unitCost: 1200,
        totalCost: 1200,
        unit: 'unidad'
      },
      {
        id: 'bom-t3-4',
        name: 'Mano de Obra Directa',
        qty: 1,
        unitCost: 6000,
        totalCost: 6000,
        unit: 'personas',
        isLabor: true
      }
    ],
    createdAt: '2026-03-01'
  }
];

export const PROTOTYPE_OPTIONS: PrototypeMaterial[] = [
  {
    id: 'mat-1',
    name: 'Anillos con Foil Dorado (Argollas Oro)',
    category: 'Hardware',
    additionalCost: 1500,
    description: 'Acabado metálico dorado satinado de alta durabilidad.',
    unit: '1 juego',
    icon: 'star'
  },
  {
    id: 'mat-2',
    name: 'Cubierta de Semilla Plantable',
    category: 'Papelería',
    additionalCost: 2800,
    description: 'Papel artesanal con semillas vivas de manzanilla y flores silvestres.',
    unit: '2 tapas',
    icon: 'eco'
  },
  {
    id: 'mat-3',
    name: 'Papel Algodón 240g Texturizado',
    category: 'Papelería',
    additionalCost: 3200,
    description: '100% fibra de algodón libre de ácido ideal para ilustración botánica.',
    unit: '100 hojas',
    icon: 'description'
  },
  {
    id: 'mat-4',
    name: 'Grabado Láser en Tapa',
    category: 'Acabados',
    additionalCost: 2100,
    description: 'Personalización botánica con grabado térmico de alta precisión.',
    unit: '1 grabado',
    icon: 'precision_manufacturing'
  },
  {
    id: 'mat-5',
    name: 'Cinta Elástica de Cierre en Seda',
    category: 'Hardware',
    additionalCost: 950,
    description: 'Cierre elástico con pasador de latón botánico premium.',
    unit: '1 elástico',
    icon: 'bookmark'
  }
];

export const CLIENTS_LIST: ClientProfile[] = [
  {
    id: 'cli-bf',
    name: 'Boutique Flores',
    initials: 'BF',
    tier: 'Nivel VIP',
    role: 'Empresa',
    email: 'contacto@boutiqueflores.co',
    phone: '+57 310 554 2211',
    totalPurchased: 29000,
    purchases: [
      { item: 'Agenda Botánica Argolla Lateral', date: 'Hoy, 10:45 AM', amount: 29000 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Cliente con alta demanda de agendas botánicas personalizadas para eventos de temporada.',
      recommendation: 'Sugerir Colección Flores Silvestres 2027',
      probability: 'Alta probabilidad de conversión (95%)'
    }
  },
  {
    id: 'cli-edx',
    name: 'Estudio de Diseño X',
    initials: 'ED',
    tier: 'Corporativo',
    role: 'Empresa',
    email: 'diseno@estudiox.com',
    phone: '+57 315 889 0044',
    totalPurchased: 70000,
    purchases: [
      { item: 'Planificador Semanal Botánico', date: 'Hoy, 09:15 AM', amount: 70000 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Estudio de arquitectura y diseño enfocado en planificadores y cuadernos de bocetos prémium.',
      recommendation: 'Sugerir Papel Algodón 240g Texturizado',
      probability: 'Alta afinidad con papelería técnica (91%)'
    }
  },
  {
    id: 'cli-ec',
    name: 'Eventos Corporativos S.A.S.',
    initials: 'EC',
    tier: 'Corporativo',
    role: 'Empresa',
    email: 'eventos@corporativos.co',
    phone: '+57 301 445 6677',
    totalPurchased: 290000,
    purchases: [
      { item: 'Agenda Botánica Argolla Lateral', date: 'Ayer, 04:30 PM', amount: 290000 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Compras institucionales de alto volumen para regalos ejecutivos de fin de año.',
      recommendation: 'Sugerir Kits Botánicos Corporativos con Semilla',
      probability: '96% de probabilidad de recompra'
    }
  },
  {
    id: 'cli-2',
    name: 'Soluciones Verticales',
    initials: 'SV',
    tier: 'Corporativo',
    role: 'Empresa',
    email: 'compras@solucionesverticales.co',
    phone: '+57 300 882 1199',
    totalPurchased: 110000,
    purchases: [
      { item: 'Libreta Kraft Botánica Semilla', date: 'Ayer, 11:20 AM', amount: 110000 },
      { item: 'Kit de Bienvenida Corporativo Botánico', date: '04 Oct', amount: 15400 },
      { item: 'Terrarios Empresariales x30', date: '22 Ago', amount: 18800 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Cliente corporativo enfocado en regalos ejecutivos y diseño biofílico de espacios.',
      recommendation: 'Sugerir Kits Botánicos Ejecutivos',
      probability: '92% de probabilidad de conversión'
    }
  },
  {
    id: 'cli-1',
    name: 'Mariluz Ochoa Minorista',
    initials: 'MO',
    tier: 'Nivel VIP',
    role: 'Persona',
    email: 'mariluz.o@retail.com',
    phone: '+57 312 458 9920',
    totalPurchased: 48500,
    purchases: [
      { item: 'Cuaderno de Bocetos Papel Algodón 240g', date: '20 Oct, 2026', amount: 48500 },
      { item: 'Paquetes de Semillas Premium x50', date: '28 Sep', amount: 8900 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Con base en compras previas de cuadernos de bocetos especializados, sugerir organizadores y agendas.',
      recommendation: 'Sugerir Línea de Agendas Artesanales',
      probability: 'Alta probabilidad de conversión (94%)'
    }
  },
  {
    id: 'cli-etm',
    name: 'EcoTienda Medellín',
    initials: 'EM',
    tier: 'Nivel VIP',
    role: 'Empresa',
    email: 'gerencia@ecotiendamedellin.com',
    phone: '+57 318 990 1234',
    totalPurchased: 220000,
    purchases: [
      { item: 'Libreta Kraft Botánica Semilla', date: '19 Oct, 2026', amount: 220000 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Tienda ecológica con rotación mensual de libretas y papel semilla plantable.',
      recommendation: 'Sugerir Reabastecimiento de Libretas Kraft',
      probability: '90% de probabilidad de recompra'
    }
  },
  {
    id: 'cli-3',
    name: 'Grupo Éxito',
    initials: 'GE',
    tier: 'Corporativo',
    role: 'Empresa',
    email: 'proveedores@grupo-exito.com',
    phone: '+57 (4) 604 9000',
    totalPurchased: 120500,
    purchases: [
      { item: 'Lote Mayorista Cuadernos Ecológicos', date: '10 Sep', amount: 65000 },
      { item: 'Colección Flores Nativas 2026', date: '14 Jul', amount: 55500 }
    ],
    affinity: {
      title: 'Afinidad de Producto',
      description: 'Distribuidor mayorista de alto volumen que solicita líneas estacionales de papelería viva.',
      recommendation: 'Sugerir Preventa Colección 2027',
      probability: '88% de probabilidad de conversión'
    }
  }
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'ast-1',
    name: 'Plotter de Corte Cameo',
    icon: 'cut',
    initialCost: 1444183,
    recoveredAmount: 850000,
    percentage: 58,
    status: 'IN PROGRESS',
    purchaseDate: 'Ene 2025',
    usefulLifeMonths: 36
  },
  {
    id: 'ast-2',
    name: 'Impresora Epson L8180',
    icon: 'print',
    initialCost: 2100000,
    recoveredAmount: 2100000,
    percentage: 100,
    status: 'RECOVERED',
    purchaseDate: 'Mar 2024',
    usefulLifeMonths: 24
  },
  {
    id: 'ast-3',
    name: 'Equipo de Sublimación Epson',
    icon: 'print',
    initialCost: 950000,
    recoveredAmount: 142500,
    percentage: 15,
    status: 'IN PROGRESS',
    purchaseDate: 'Jul 2025',
    usefulLifeMonths: 36
  },
  {
    id: 'ast-4',
    name: 'Cricut Maker 3 Botánica',
    icon: 'precision_manufacturing',
    initialCost: 1850000,
    recoveredAmount: 1295000,
    percentage: 70,
    status: 'IN PROGRESS',
    purchaseDate: 'Nov 2024',
    usefulLifeMonths: 24
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    status: 'alert',
    name: 'Papel Opalina 180 gr',
    provider: 'Milger Papeles',
    unitCost: 0.45,
    stock: 120,
    stockUnit: 'hojas',
    leadTime: 'Local (2 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 2,
    category: 'Papelería',
    minStock: 500
  },
  {
    id: 'inv-2',
    status: 'ok',
    name: 'Cartulina Kraft 300 gr',
    provider: 'Amazon',
    unitCost: 0.85,
    stock: 4500,
    stockUnit: 'hojas',
    leadTime: 'Internacional (14 Días)',
    leadTimeType: 'INT',
    leadTimeDays: 14,
    category: 'Papelería',
    minStock: 1000
  },
  {
    id: 'inv-3',
    status: 'ok',
    name: 'Papel Algodón Texturizado',
    provider: 'Lumen',
    unitCost: 1.20,
    stock: 1250,
    stockUnit: 'hojas',
    leadTime: 'Local (3 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 3,
    category: 'Papelería',
    minStock: 400
  },
  {
    id: 'inv-4',
    status: 'ok',
    name: 'Papel Plantable con Semillas',
    provider: 'EcoBio Papeles',
    unitCost: 2.10,
    stock: 890,
    stockUnit: 'hojas',
    leadTime: 'Local (5 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 5,
    category: 'Papelería',
    minStock: 300
  },
  {
    id: 'inv-5',
    status: 'ok',
    name: 'Foil Dorado Térmico 120m',
    provider: 'StampingPro',
    unitCost: 34.50,
    stock: 18,
    stockUnit: 'rollos',
    leadTime: 'Local (1 Día)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 1,
    category: 'Acabados',
    minStock: 5
  },
  {
    id: 'inv-6',
    status: 'warning',
    name: 'Barniz UV Reserva 1L',
    provider: 'Químicos Gráficos',
    unitCost: 48.00,
    stock: 2,
    stockUnit: 'L',
    leadTime: 'Local (4 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 4,
    category: 'Acabados',
    minStock: 3
  },
  {
    id: 'inv-7',
    status: 'ok',
    name: 'Resortes Metálicos Espiral 1"',
    provider: 'Alambres & Formas',
    unitCost: 0.65,
    stock: 2400,
    stockUnit: 'pzas',
    leadTime: 'Local (3 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 3,
    category: 'Hardware',
    minStock: 600
  },
  {
    id: 'inv-8',
    status: 'alert',
    name: 'Argollas Bisagra Bronce 32mm',
    provider: 'Herrajes Medellín',
    unitCost: 1.15,
    stock: 85,
    stockUnit: 'pzas',
    leadTime: 'Local (2 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 2,
    category: 'Hardware',
    minStock: 300
  },
  {
    id: 'inv-9',
    status: 'alert',
    name: 'Suculentas y Cactus Miniaturas Variadas',
    provider: 'Vivero Botánico Central',
    unitCost: 1.80,
    stock: 250,
    stockUnit: 'unidades',
    leadTime: 'Local (2 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 2,
    category: 'Plantas',
    minStock: 100
  },
  {
    id: 'inv-10',
    status: 'ok',
    name: 'Ficus Lyrata & Monsteras Enraizadas',
    provider: 'Vivero Botánico Central',
    unitCost: 6.50,
    stock: 140,
    stockUnit: 'unidades',
    leadTime: 'Local (3 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 3,
    category: 'Plantas',
    minStock: 40
  },
  {
    id: 'inv-11',
    status: 'ok',
    name: 'Semillas Nativas de Flores Silvestres & Aromáticas',
    provider: 'EcoBio Semillas',
    unitCost: 0.95,
    stock: 620,
    stockUnit: 'sobres',
    leadTime: 'Local (2 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 2,
    category: 'Plantas',
    minStock: 150
  },
  {
    id: 'inv-12',
    status: 'ok',
    name: 'Sustrato Premium Botánico (Turba + Perlita)',
    provider: 'AgroBio Colombia',
    unitCost: 1.25,
    stock: 480,
    stockUnit: 'kg',
    leadTime: 'Local (4 Días)',
    leadTimeType: 'LOCAL',
    leadTimeDays: 4,
    category: 'Plantas',
    minStock: 100
  }
];
