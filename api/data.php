<?php
/**
 * Endpoint principal de datos.
 *
 * GET  -> devuelve todo el estado de la aplicación (órdenes, inventario,
 *         clientes, plantillas, activos fijos, proveedores, y los valores
 *         sueltos del panel de control) en un solo JSON.
 * POST -> reemplaza todo el estado con lo que envía la aplicación. Se hace en
 *         una transacción: si algo falla, no se guarda nada a medias.
 *
 * Ambos requieren el header "X-Api-Key" (ver api/config.php).
 *
 * Por qué "reemplazar todo" en vez de actualizar fila por fila: la aplicación
 * ya maneja toda su lógica de negocio en el navegador y simplemente vuelve a
 * enviar la lista completa de cada cosa cada vez que algo cambia — así el
 * servidor no tiene que saber "qué cambió exactamente", solo guardar la
 * versión más reciente. Para el volumen de datos de un negocio como este
 * (decenas o cientos de filas, no millones), es rápido y confiable.
 */

require_once __DIR__ . '/db.php';
send_json_headers();
require_api_key();

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  handle_get($pdo);
} elseif ($method === 'POST') {
  handle_post($pdo);
} else {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Método no permitido.']);
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

function handle_get(PDO $pdo): void {
  $orders = select_all($pdo, 'orders', 'sort_order', 'map_order_out');
  $inventory = select_all($pdo, 'inventory_items', 'sort_order', 'map_inventory_out');
  $clients = select_all($pdo, 'clients', 'sort_order', 'map_client_out');
  $templates = select_all($pdo, 'product_templates', 'sort_order', 'map_template_out');
  $fixedAssets = select_all($pdo, 'fixed_assets', 'sort_order', 'map_asset_out');
  $providers = select_all($pdo, 'providers', 'sort_order', 'map_provider_out');

  $settingsStmt = $pdo->query('SELECT * FROM app_settings WHERE id = 1');
  $settingsRow = $settingsStmt->fetch();
  $seeded = $settingsRow ? (bool)$settingsRow['seeded'] : false;

  echo json_encode([
    'ok' => true,
    'seeded' => $seeded,
    'orders' => $orders,
    'inventory' => $inventory,
    'clients' => $clients,
    'templates' => $templates,
    'fixedAssets' => $fixedAssets,
    'providers' => $providers,
    'bomList' => $settingsRow && $settingsRow['bom_list'] !== null ? json_decode($settingsRow['bom_list'], true) : [],
    'cashBalance' => [
      'efectivo' => $settingsRow ? (float)$settingsRow['cash_efectivo'] : 0,
      'banco' => $settingsRow ? (float)$settingsRow['cash_banco'] : 0,
    ],
    'netProfit' => $settingsRow ? (float)$settingsRow['net_profit'] : 0,
  ]);
}

function select_all(PDO $pdo, string $table, string $orderCol, string $mapper): array {
  $stmt = $pdo->query("SELECT * FROM `$table` ORDER BY `$orderCol` ASC");
  $rows = $stmt->fetchAll();
  return array_map($mapper, $rows);
}

function map_order_out(array $r): array {
  $out = [
    'id' => $r['id'],
    'orderId' => $r['order_id'],
    'client' => $r['client'],
    'productSpec' => $r['product_spec'],
    'value' => (float)$r['value'],
    'status' => $r['status'],
    'paymentStatus' => $r['payment_status'],
    'date' => $r['date_label'],
    'itemsCount' => (int)$r['items_count'],
    'inventoryDeducted' => (bool)$r['inventory_deducted'],
    'profitAllocated' => (bool)$r['profit_allocated'],
    'isExpense' => (bool)$r['is_expense'],
  ];
  if ($r['bom_components'] !== null) $out['bomComponents'] = json_decode($r['bom_components'], true);
  if ($r['products'] !== null) $out['products'] = json_decode($r['products'], true);
  if ($r['payment_method'] !== null) $out['paymentMethod'] = $r['payment_method'];
  if ($r['amount_paid'] !== null) $out['amountPaid'] = (float)$r['amount_paid'];
  if ($r['delivery_address'] !== null) $out['deliveryAddress'] = $r['delivery_address'];
  if ($r['purchased_items'] !== null) $out['purchasedItems'] = json_decode($r['purchased_items'], true);
  return $out;
}

function map_inventory_out(array $r): array {
  return [
    'id' => $r['id'],
    'status' => $r['status'],
    'name' => $r['name'],
    'provider' => $r['provider'] ?? '',
    'unitCost' => (float)$r['unit_cost'],
    'stock' => (float)$r['stock'],
    'stockUnit' => $r['stock_unit'] ?? '',
    'leadTime' => $r['lead_time'] ?? '',
    'leadTimeType' => $r['lead_time_type'] ?? 'LOCAL',
    'leadTimeDays' => (int)$r['lead_time_days'],
    'category' => $r['category'] ?? '',
    'minStock' => (float)$r['min_stock'],
    'isArchived' => (bool)$r['is_archived'],
  ];
}

function map_client_out(array $r): array {
  $out = [
    'id' => $r['id'],
    'name' => $r['name'],
    'initials' => $r['initials'] ?? '',
    'tier' => $r['tier'] ?? '',
    'role' => $r['role'] ?? '',
    'email' => $r['email'] ?? '',
    'phone' => $r['phone'] ?? '',
    'totalPurchased' => (float)$r['total_purchased'],
    'purchases' => $r['purchases'] !== null ? json_decode($r['purchases'], true) : [],
    'affinity' => $r['affinity'] !== null ? json_decode($r['affinity'], true) : null,
  ];
  if ($r['identification'] !== null) $out['identification'] = $r['identification'];
  if ($r['address'] !== null) $out['address'] = $r['address'];
  return $out;
}

function map_template_out(array $r): array {
  $out = [
    'id' => $r['id'],
    'name' => $r['name'],
    'components' => $r['components'] !== null ? json_decode($r['components'], true) : [],
  ];
  if ($r['description'] !== null) $out['description'] = $r['description'];
  if ($r['default_sale_price'] !== null) $out['defaultSalePrice'] = (float)$r['default_sale_price'];
  if ($r['created_at'] !== null) $out['createdAt'] = $r['created_at'];
  return $out;
}

function map_asset_out(array $r): array {
  return [
    'id' => $r['id'],
    'name' => $r['name'],
    'icon' => $r['icon'] ?? 'build',
    'initialCost' => (float)$r['initial_cost'],
    'recoveredAmount' => (float)$r['recovered_amount'],
    'percentage' => (int)$r['percentage'],
    'status' => $r['status'],
    'purchaseDate' => $r['purchase_date'] ?? '',
    'usefulLifeMonths' => (int)$r['useful_life_months'],
  ];
}

function map_provider_out(array $r): array {
  $out = ['id' => $r['id'], 'name' => $r['name']];
  if ($r['phone'] !== null) $out['phone'] = $r['phone'];
  if ($r['address'] !== null) $out['address'] = $r['address'];
  if ($r['contact_channel'] !== null) $out['contactChannel'] = $r['contact_channel'];
  return $out;
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

function handle_post(PDO $pdo): void {
  $body = read_json_body();

  try {
    $pdo->beginTransaction();

    replace_collection($pdo, 'orders', $body['orders'] ?? [], 'insert_order');
    replace_collection($pdo, 'inventory_items', $body['inventory'] ?? [], 'insert_inventory');
    replace_collection($pdo, 'clients', $body['clients'] ?? [], 'insert_client');
    replace_collection($pdo, 'product_templates', $body['templates'] ?? [], 'insert_template');
    replace_collection($pdo, 'fixed_assets', $body['fixedAssets'] ?? [], 'insert_asset');
    replace_collection($pdo, 'providers', $body['providers'] ?? [], 'insert_provider');

    $cash = $body['cashBalance'] ?? ['efectivo' => 0, 'banco' => 0];
    $stmt = $pdo->prepare(
      'INSERT INTO app_settings (id, cash_efectivo, cash_banco, net_profit, bom_list, seeded)
       VALUES (1, :efectivo, :banco, :net_profit, :bom_list, 1)
       ON DUPLICATE KEY UPDATE
         cash_efectivo = VALUES(cash_efectivo),
         cash_banco = VALUES(cash_banco),
         net_profit = VALUES(net_profit),
         bom_list = VALUES(bom_list),
         seeded = 1'
    );
    $stmt->execute([
      ':efectivo' => $cash['efectivo'] ?? 0,
      ':banco' => $cash['banco'] ?? 0,
      ':net_profit' => $body['netProfit'] ?? 0,
      ':bom_list' => json_encode($body['bomList'] ?? [], JSON_UNESCAPED_UNICODE),
    ]);

    $pdo->commit();
    echo json_encode(['ok' => true]);
  } catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo guardar: ' . $e->getMessage()]);
  }
}

// Vacía la tabla y vuelve a insertar la lista completa, en el orden recibido.
function replace_collection(PDO $pdo, string $table, array $items, string $inserter): void {
  $pdo->exec("DELETE FROM `$table`");
  if (empty($items)) return;
  $stmt = null;
  foreach (array_values($items) as $index => $item) {
    if (!is_array($item)) continue;
    $inserter($pdo, $item, $index);
  }
}

function insert_order(PDO $pdo, array $o, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO orders
      (id, order_id, client, product_spec, value, status, payment_status, date_label, items_count,
       bom_components, products, inventory_deducted, payment_method, amount_paid, profit_allocated,
       delivery_address, is_expense, purchased_items, sort_order)
     VALUES
      (:id, :order_id, :client, :product_spec, :value, :status, :payment_status, :date_label, :items_count,
       :bom_components, :products, :inventory_deducted, :payment_method, :amount_paid, :profit_allocated,
       :delivery_address, :is_expense, :purchased_items, :sort_order)'
  );
  $stmt->execute([
    ':id' => $o['id'],
    ':order_id' => $o['orderId'] ?? '',
    ':client' => $o['client'] ?? '',
    ':product_spec' => $o['productSpec'] ?? '',
    ':value' => $o['value'] ?? 0,
    ':status' => $o['status'] ?? 'Pendiente',
    ':payment_status' => $o['paymentStatus'] ?? 'Pendiente',
    ':date_label' => $o['date'] ?? '',
    ':items_count' => $o['itemsCount'] ?? 1,
    ':bom_components' => isset($o['bomComponents']) ? json_encode($o['bomComponents'], JSON_UNESCAPED_UNICODE) : null,
    ':products' => isset($o['products']) ? json_encode($o['products'], JSON_UNESCAPED_UNICODE) : null,
    ':inventory_deducted' => !empty($o['inventoryDeducted']) ? 1 : 0,
    ':payment_method' => $o['paymentMethod'] ?? null,
    ':amount_paid' => $o['amountPaid'] ?? null,
    ':profit_allocated' => !empty($o['profitAllocated']) ? 1 : 0,
    ':delivery_address' => $o['deliveryAddress'] ?? null,
    ':is_expense' => !empty($o['isExpense']) ? 1 : 0,
    ':purchased_items' => isset($o['purchasedItems']) ? json_encode($o['purchasedItems'], JSON_UNESCAPED_UNICODE) : null,
    ':sort_order' => $index,
  ]);
}

function insert_inventory(PDO $pdo, array $i, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO inventory_items
      (id, status, name, provider, unit_cost, stock, stock_unit, lead_time, lead_time_type,
       lead_time_days, category, min_stock, is_archived, sort_order)
     VALUES
      (:id, :status, :name, :provider, :unit_cost, :stock, :stock_unit, :lead_time, :lead_time_type,
       :lead_time_days, :category, :min_stock, :is_archived, :sort_order)'
  );
  $stmt->execute([
    ':id' => $i['id'],
    ':status' => $i['status'] ?? 'ok',
    ':name' => $i['name'] ?? '',
    ':provider' => $i['provider'] ?? null,
    ':unit_cost' => $i['unitCost'] ?? 0,
    ':stock' => $i['stock'] ?? 0,
    ':stock_unit' => $i['stockUnit'] ?? null,
    ':lead_time' => $i['leadTime'] ?? null,
    ':lead_time_type' => $i['leadTimeType'] ?? null,
    ':lead_time_days' => $i['leadTimeDays'] ?? null,
    ':category' => $i['category'] ?? null,
    ':min_stock' => $i['minStock'] ?? 0,
    ':is_archived' => !empty($i['isArchived']) ? 1 : 0,
    ':sort_order' => $index,
  ]);
}

function insert_client(PDO $pdo, array $c, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO clients
      (id, name, initials, tier, role, email, phone, identification, address, total_purchased,
       purchases, affinity, sort_order)
     VALUES
      (:id, :name, :initials, :tier, :role, :email, :phone, :identification, :address, :total_purchased,
       :purchases, :affinity, :sort_order)'
  );
  $stmt->execute([
    ':id' => $c['id'],
    ':name' => $c['name'] ?? '',
    ':initials' => $c['initials'] ?? null,
    ':tier' => $c['tier'] ?? null,
    ':role' => $c['role'] ?? null,
    ':email' => $c['email'] ?? null,
    ':phone' => $c['phone'] ?? null,
    ':identification' => $c['identification'] ?? null,
    ':address' => $c['address'] ?? null,
    ':total_purchased' => $c['totalPurchased'] ?? 0,
    ':purchases' => json_encode($c['purchases'] ?? [], JSON_UNESCAPED_UNICODE),
    ':affinity' => isset($c['affinity']) ? json_encode($c['affinity'], JSON_UNESCAPED_UNICODE) : null,
    ':sort_order' => $index,
  ]);
}

function insert_template(PDO $pdo, array $t, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO product_templates
      (id, name, description, default_sale_price, components, created_at, sort_order)
     VALUES
      (:id, :name, :description, :default_sale_price, :components, :created_at, :sort_order)'
  );
  $stmt->execute([
    ':id' => $t['id'],
    ':name' => $t['name'] ?? '',
    ':description' => $t['description'] ?? null,
    ':default_sale_price' => $t['defaultSalePrice'] ?? null,
    ':components' => json_encode($t['components'] ?? [], JSON_UNESCAPED_UNICODE),
    ':created_at' => $t['createdAt'] ?? null,
    ':sort_order' => $index,
  ]);
}

function insert_asset(PDO $pdo, array $a, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO fixed_assets
      (id, name, icon, initial_cost, recovered_amount, percentage, status, purchase_date,
       useful_life_months, sort_order)
     VALUES
      (:id, :name, :icon, :initial_cost, :recovered_amount, :percentage, :status, :purchase_date,
       :useful_life_months, :sort_order)'
  );
  $stmt->execute([
    ':id' => $a['id'],
    ':name' => $a['name'] ?? '',
    ':icon' => $a['icon'] ?? null,
    ':initial_cost' => $a['initialCost'] ?? 0,
    ':recovered_amount' => $a['recoveredAmount'] ?? 0,
    ':percentage' => $a['percentage'] ?? 0,
    ':status' => $a['status'] ?? 'IN PROGRESS',
    ':purchase_date' => $a['purchaseDate'] ?? null,
    ':useful_life_months' => $a['usefulLifeMonths'] ?? 0,
    ':sort_order' => $index,
  ]);
}

function insert_provider(PDO $pdo, array $p, int $index): void {
  $stmt = $pdo->prepare(
    'INSERT INTO providers (id, name, phone, address, contact_channel, sort_order)
     VALUES (:id, :name, :phone, :address, :contact_channel, :sort_order)'
  );
  $stmt->execute([
    ':id' => $p['id'],
    ':name' => $p['name'] ?? '',
    ':phone' => $p['phone'] ?? null,
    ':address' => $p['address'] ?? null,
    ':contact_channel' => $p['contactChannel'] ?? null,
    ':sort_order' => $index,
  ]);
}
