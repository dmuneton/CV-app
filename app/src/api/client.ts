import {
  OrderItem,
  InventoryItem,
  ClientProfile,
  ProductTemplate,
  FixedAsset,
  Provider,
  BOMComponent
} from '../types';

// Todo el estado "persistente" de la aplicación — lo que se lee/escribe en la
// base de datos. Todo lo demás (qué pantalla está abierta, si un modal está
// abierto, etc.) es puramente de la sesión y nunca se guarda.
export interface AppState {
  orders: OrderItem[];
  inventory: InventoryItem[];
  clients: ClientProfile[];
  templates: ProductTemplate[];
  fixedAssets: FixedAsset[];
  providers: Provider[];
  bomList: BOMComponent[];
  cashBalance: { efectivo: number; banco: number };
  netProfit: number;
}

// La API vive en el mismo dominio que la página (crm.creatividadverde.com/api/...),
// así que una ruta relativa basta — funciona igual en producción. En desarrollo
// local (npm run dev) esta ruta no existe y las llamadas simplemente fallan; la
// aplicación sigue funcionando con los datos de ejemplo, solo sin guardar.
const API_BASE = '/api';

// Se define en tiempo de compilación (ver app/.env.example) — sin ella, las
// llamadas a la API se rechazan con 401 y la aplicación cae de vuelta a modo
// "solo en este navegador, sin guardar".
const API_KEY = (import.meta as any).env?.VITE_API_KEY as string | undefined;

function requestHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['X-Api-Key'] = API_KEY;
  return headers;
}

/**
 * Carga el estado guardado en la base de datos. Devuelve null si la API no
 * está disponible (desarrollo local, o Hostinger todavía sin configurar) —
 * en ese caso la aplicación sigue arrancando con los datos de ejemplo.
 */
export async function fetchAppState(): Promise<{ state: AppState; seeded: boolean } | null> {
  try {
    const res = await fetch(`${API_BASE}/data.php`, { headers: requestHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || json.ok !== true) return null;
    const { ok, seeded, ...state } = json;
    return { state: state as AppState, seeded: !!seeded };
  } catch {
    return null;
  }
}

/**
 * Guarda el estado completo en la base de datos (reemplaza lo que había).
 * Devuelve false si no se pudo guardar — quien llama decide si avisa al usuario.
 */
export async function saveAppState(state: AppState): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/data.php`, {
      method: 'POST',
      headers: requestHeaders(),
      body: JSON.stringify(state)
    });
    if (!res.ok) return false;
    const json = await res.json();
    return !!json?.ok;
  } catch {
    return false;
  }
}
