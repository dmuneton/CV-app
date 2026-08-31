<?php
/**
 * Conexión a la base de datos + helpers compartidos por los demás endpoints.
 */

require_once __DIR__ . '/config.php';

function get_pdo(): PDO {
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
  try {
    return new PDO($dsn, DB_USER, DB_PASSWORD, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  } catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
      'ok' => false,
      'error' => 'No se pudo conectar a la base de datos. Revisa api/config.php.',
    ]);
    exit;
  }
}

// Cabeceras comunes a todos los endpoints de datos.
function send_json_headers(): void {
  header('Content-Type: application/json; charset=utf-8');
  // La API y el sitio viven en el mismo dominio (crm.creatividadverde.com), así
  // que no hace falta configurar CORS para uso normal desde la aplicación.
}

// Exige que la petición traiga la clave secreta correcta en el header
// "X-Api-Key". Sin esto, cualquiera que encuentre la URL de la API podría
// leer o borrar los datos del negocio.
function require_api_key(): void {
  $headers = function_exists('getallheaders') ? getallheaders() : [];
  $provided = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? ($_SERVER['HTTP_X_API_KEY'] ?? '');
  if (!is_string($provided) || $provided === '' || !hash_equals(API_KEY, $provided)) {
    http_response_code(401);
    send_json_headers();
    echo json_encode(['ok' => false, 'error' => 'No autorizado.']);
    exit;
  }
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    http_response_code(400);
    send_json_headers();
    echo json_encode(['ok' => false, 'error' => 'Cuerpo de la petición inválido (se esperaba JSON).']);
    exit;
  }
  return $data;
}
