# API — conexión con la base de datos

Esta carpeta es una pequeña API en PHP que permite que la aplicación (la que ves
en `crm.creatividadverde.com`) lea y guarde de verdad en tu base de datos MySQL
de Hostinger. Sin esto, la aplicación solo guarda los datos mientras tienes la
pestaña abierta — al recargar, vuelve a los datos de ejemplo.

## Configuración (una sola vez)

### 1. Crear las tablas

1. En hPanel, entra a tu base de datos → **phpMyAdmin**.
2. Selecciona tu base de datos en el panel izquierdo.
3. Ve a la pestaña **SQL**, pega todo el contenido de [schema.sql](schema.sql) y
   ejecútalo. Esto crea las tablas vacías.

### 2. Crear `api/config.php` directamente en el servidor

Este archivo **nunca se sube a GitHub** (por seguridad, tiene la contraseña de
tu base de datos) — hay que crearlo a mano, directamente en Hostinger:

1. Entra al **Administrador de Archivos** de Hostinger, ve a la carpeta donde
   está desplegado el sitio (la misma que tiene `index.html` y `assets/` —
   ahora también debe tener una carpeta `api/`).
2. Dentro de `api/`, crea un archivo nuevo llamado exactamente `config.php`.
3. Pégale este contenido, reemplazando los tres datos de tu base de datos
   (los encuentras en hPanel → Bases de Datos → MySQL Databases):

   ```php
   <?php
   define('DB_NAME', 'TU_BASE_DE_DATOS');
   define('DB_USER', 'TU_USUARIO');
   define('DB_PASSWORD', 'TU_CONTRASEÑA');
   define('DB_HOST', 'localhost');
   define('API_KEY', 'I8fgdu9C3N3jtCwugbBptCYsCi5qNxH4j9FRU-aLivA');
   ```

   El valor de `API_KEY` de arriba **ya viene incluido en la versión de la
   página que está publicada** — cópialo tal cual, sin cambiarlo (si algún día
   quieres cambiarlo, avísame y genero uno nuevo para los dos lados a la vez).

4. Guarda el archivo.

### 3. Verificar que quedó bien conectado

Abre en tu navegador: `https://crm.creatividadverde.com/api/health.php`

- Si ves `{"ok":true,...}` → todo listo, ya puedes usar la aplicación normalmente.
- Si ves un error, dice exactamente qué falta (tabla faltante, credenciales
  incorrectas, etc.) — cópiamelo y lo resolvemos.

## Importante: esto NO es una protección real por sí sola

La clave `API_KEY` evita que un script automático encuentre la API por
casualidad, pero **no es una contraseña real** — cualquiera que abra las
herramientas de desarrollador del navegador en `crm.creatividadverde.com`
puede verla (así funciona cualquier aplicación que corre en el navegador).

Como esta aplicación no tiene un sistema de inicio de sesión propio, la forma
real de proteger los datos del negocio (órdenes, clientes, precios) es
proteger **todo el subdominio** con una contraseña a nivel de Hostinger:

1. En hPanel, busca **"Proteger con contraseña"** / **"Directorios protegidos
   con contraseña"** (Password Protect Directories).
2. Selecciónalo para la carpeta del subdominio `crm`.
3. Crea un usuario y contraseña — el navegador los pedirá antes de mostrar
   cualquier cosa del sitio.

Esto es opcional pero muy recomendado mientras el equipo que usa el dashboard
sea pequeño y conocido.
