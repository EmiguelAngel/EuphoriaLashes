# Euphoria Lashes (React + Tailwind + PostgreSQL)

Aplicación web para una tienda de accesorios de pestañas con:

- **Catálogo público** en `/` con buscador por nombre y **ficha de producto** en `/product/:id`
- **Panel Admin** en `/admin` con CRUD completo y confirmación de borrado
- **Sincronización en tiempo real** (el catálogo se actualiza cuando cambias productos en admin)
- **Diseño mobile-first** con estética premium (rounded-xl, sombras suaves y espacio en blanco)
- **Paleta HEX extraída del logo** (tokens en `src/styles.css`)

## Requisitos

- Node.js 20+ (tú ya tienes Node instalado)
- PostgreSQL (local o remoto)

## 1) Instalar

```bash
npm install
```

## 2) Configurar PostgreSQL (tabla + seed)

En tu cliente de PostgreSQL (psql, pgAdmin, DBeaver, etc):

- Si aún no existe la base, créala:

```sql
create database euphoria_lashes;
```

- Conéctate a esa base y ejecuta, en este orden:
  - `server/schema.sql` (incluye tabla `admin_users` y `products`)
  - `server/seed.sql` (inserta **6 productos** de prueba; las imágenes son URLs de ejemplo)

Si tu base ya existía de antes, abre `server/schema.sql` y ejecuta **solo** el bloque `admin_users` (o vuelve a ejecutar el archivo completo si prefieres; `if not exists` evita duplicar tablas).

### Si usas psql (opcional)

```bash
psql -U postgres -d euphoria_lashes -f server/schema.sql
psql -U postgres -d euphoria_lashes -f server/seed.sql
```

### Administrador en la base de datos

1. En `.env` define `ADMIN_EMAIL` y `ADMIN_PASSWORD` (solo para crear/actualizar el hash en PostgreSQL).
2. Ejecuta:

```bash
npm run seed:admin
```

3. Inicia sesión en `/admin/login` con ese **correo** y **contraseña**.

Las contraseñas se guardan con **bcrypt**; no van en texto plano en la base.

### Imágenes de productos

- Cada producto puede tener **varias imágenes** (columna JSON `images` en PostgreSQL).
- Si tu base ya existía antes de esta función, ejecuta una vez:

```bash
npm run migrate:images
```

- Puedes seguir usando URLs externas (compatibilidad con `image_url` antiguo).
- En el panel admin puedes **subir varios archivos** (JPG/PNG/WEBP/GIF, máx. 5 MB c/u). Se guardan en `server/uploads/` y la API las sirve en `/uploads/...`.

### Realtime

La sincronización en tiempo real se hace con **Socket.IO** desde el backend (`server/index.mjs`), emitiendo eventos al crear/editar/eliminar productos.

## 3) Variables de entorno

Crea un archivo `.env` (puedes copiar `.env.example`) con:

- `DATABASE_URL` **o** `PGUSER` / `PGPASSWORD` / `PGHOST` / `PGPORT` / `PGDATABASE`
- `PORT` (API, por defecto 5174)
- `VITE_API_URL` (debe apuntar a esa API, p. ej. `http://localhost:5174`)

**Nota:** si ves el error `client password must be a string` con contraseña solo numérica, ya está corregido en `server/db.mjs` (la contraseña se fuerza a texto). Asegúrate de reiniciar `npm run dev` después de editar el `.env`.

## 4) Correr en local

```bash
npm run dev
```

Si tienes puertos bloqueados por procesos anteriores de Node, usa:

```bash
npm run dev:clean
```

Abre:

- `/` catálogo
- `/product/<id>` detalle del producto
- `/admin` panel de administración
- `/admin/login` acceso de administrador

### Login de administrador

- `AUTH_SECRET`: cadena larga y privada (firma del token de sesión).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: se usan con `npm run seed:admin` para guardar el administrador en PostgreSQL.

## 5) Paleta del logo (opcional)

El logo se sirve desde `public/assets/logo.png`. Si lo reemplazas, puedes re-extraer tokens:

```bash
npm run palette:extract
```

