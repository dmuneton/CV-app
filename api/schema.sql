-- Creatividad Verde — esquema de base de datos
--
-- Cómo usarlo:
-- 1. En hPanel, entra a tu base de datos MySQL (phpMyAdmin).
-- 2. Selecciona tu base de datos en el panel izquierdo.
-- 3. Ve a la pestaña "SQL" y pega TODO el contenido de este archivo.
-- 4. Dale a "Continuar" / "Ejecutar". Esto crea las tablas vacías —
--    la aplicación las llena solita la primera vez que la abras.
--
-- Notas de diseño:
-- - Los campos que en la aplicación son listas/objetos anidados (ej. los insumos
--   de una orden, el historial de compras de un cliente) se guardan como JSON en
--   una sola columna — así cada fila de cada tabla es exactamente "una orden",
--   "un cliente", etc., igual a como los ves en la aplicación.
-- - `sort_order` guarda el orden en que aparecen en la pantalla (las órdenes más
--   nuevas primero, por ejemplo) — sin eso, MySQL no garantiza ningún orden.
-- - `app_settings` es una tabla de una sola fila: guarda el Saldo en Caja, las
--   Ganancias Netas y la lista de insumos "en trabajo" de Órdenes.

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  client VARCHAR(255) NOT NULL,
  product_spec TEXT NOT NULL,
  value DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  date_label VARCHAR(64) NOT NULL,
  items_count INT NOT NULL DEFAULT 1,
  bom_components JSON NULL,
  products JSON NULL,
  inventory_deducted TINYINT(1) NOT NULL DEFAULT 0,
  payment_method VARCHAR(32) NULL,
  amount_paid DECIMAL(14,2) NULL,
  profit_allocated TINYINT(1) NOT NULL DEFAULT 0,
  delivery_address VARCHAR(255) NULL,
  is_expense TINYINT(1) NOT NULL DEFAULT 0,
  purchased_items JSON NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  status VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NULL,
  unit_cost DECIMAL(14,4) NOT NULL DEFAULT 0,
  stock DECIMAL(14,2) NOT NULL DEFAULT 0,
  stock_unit VARCHAR(64) NULL,
  lead_time VARCHAR(64) NULL,
  lead_time_type VARCHAR(8) NULL,
  lead_time_days INT NULL,
  category VARCHAR(64) NULL,
  min_stock DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  initials VARCHAR(8) NULL,
  tier VARCHAR(64) NULL,
  role VARCHAR(64) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  identification VARCHAR(64) NULL,
  address VARCHAR(255) NULL,
  total_purchased DECIMAL(14,2) NOT NULL DEFAULT 0,
  purchases JSON NULL,
  affinity JSON NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_templates (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  default_sale_price DECIMAL(14,2) NULL,
  components JSON NULL,
  created_at VARCHAR(32) NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fixed_assets (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(64) NULL,
  initial_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  recovered_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  percentage INT NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'IN PROGRESS',
  purchase_date VARCHAR(32) NULL,
  useful_life_months INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS providers (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NULL,
  address VARCHAR(255) NULL,
  contact_channel VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fila única (id siempre = 1) con los valores "sueltos" del panel de control.
CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT NOT NULL PRIMARY KEY DEFAULT 1,
  cash_efectivo DECIMAL(14,2) NOT NULL DEFAULT 0,
  cash_banco DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(14,2) NOT NULL DEFAULT 0,
  bom_list JSON NULL,
  seeded TINYINT(1) NOT NULL DEFAULT 0
);
