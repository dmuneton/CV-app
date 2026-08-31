<?php
/**
 * Plantilla de configuración — copia este archivo como "config.php" (mismo
 * folder) DIRECTAMENTE en el servidor de Hostinger, y rellena tus datos reales
 * ahí. NUNCA subas config.php a GitHub — por eso está en .gitignore.
 *
 * Dónde encontrar estos datos en hPanel: Bases de Datos → MySQL Databases.
 */

// Nombre de la base de datos (ej. "u123456789_creatividadverde")
define('DB_NAME', 'TU_BASE_DE_DATOS');

// Usuario de la base de datos (ej. "u123456789_admin")
define('DB_USER', 'TU_USUARIO');

// Contraseña del usuario de la base de datos
define('DB_PASSWORD', 'TU_CONTRASEÑA');

// Casi siempre es "localhost" en Hostinger — solo cámbialo si hPanel te dio
// un host distinto explícitamente.
define('DB_HOST', 'localhost');

// Clave secreta que la aplicación debe enviar para poder leer o guardar datos.
// Invéntate una contraseña larga y random (ej. genera una en
// https://1password.com/password-generator/) y pégala aquí y en
// app/.env.production como VITE_API_KEY (mismo valor en los dos lugares).
define('API_KEY', 'CAMBIA_ESTO_POR_UNA_CLAVE_LARGA_Y_SECRETA');
