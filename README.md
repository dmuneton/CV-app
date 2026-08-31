# Creatividad Verde — Dashboard (CV-app)

Este repositorio tiene dos partes:

- **`app/`** — el código fuente del proyecto (React + Vite + TypeScript). Aquí es donde se
  hacen los cambios y las mejoras.
- **Raíz del repositorio** (`index.html` + `assets/`) — la versión ya compilada, lista para
  servirse directamente como sitio estático. Esto es lo que Hostinger toma cuando se conecta
  por Git al subdominio `crm.creatividadverde.com`.

La raíz se actualiza copiando el resultado de compilar `app/` — no se edita a mano.

## Desarrollo local

**Requisitos:** Node.js

```
cd app
npm install
npm run dev
```

## Generar la versión para producción (lo que sube a Hostinger)

```
cd app
npm run build
```

Esto genera `app/dist/`. Su contenido (`index.html` + `assets/`) se copia a la raíz del
repositorio y se sube a GitHub — así, cuando Hostinger descarga la rama `main`, ya encuentra
la página lista para funcionar en `crm.creatividadverde.com/`.
