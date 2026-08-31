<?php
/**
 * Endpoint de diagnóstico — ábrelo directamente en el navegador
 * (https://crm.creatividadverde.com/api/health.php) para confirmar que la API
 * puede conectarse a la base de datos. No requiere clave — no expone datos del
 * negocio, solo confirma que todo está bien conectado.
 */

require_once __DIR__ . '/db.php';
send_json_headers();

try {
  $pdo = get_pdo();
  $tables = ['orders', 'inventory_items', 'clients', 'product_templates', 'fixed_assets', 'providers', 'app_settings'];
  $missing = [];
  foreach ($tables as $t) {
    $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t));
    if ($stmt->rowCount() === 0) {
      $missing[] = $t;
    }
  }

  if (!empty($missing)) {
    echo json_encode([
      'ok' => false,
      'error' => 'Conectado a la base de datos, pero faltan tablas: ' . implode(', ', $missing) . '. Ejecuta api/schema.sql en phpMyAdmin.',
    ]);
    exit;
  }

  echo json_encode(['ok' => true, 'message' => 'Conexión y tablas correctas.']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Error inesperado: ' . $e->getMessage()]);
}
