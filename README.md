# Jilite

Gestor de proyectos y tareas: proyectos, tareas con Kanban, subtareas, etiquetas, comentarios, archivos, calendario, notificaciones por email y webhooks.

Stack: Next.js (App Router) · TypeScript · Prisma + PostgreSQL · Auth.js · Tailwind CSS.

---

## Requisitos

- Node.js 20+
- PostgreSQL (local con Docker o remoto)
- Una cuenta en [Resend](https://resend.com) para correos (obligatoria solo si querés verificación/reset/notificaciones por email)

## Configuración local

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo `.env` (ver `.env.example`):

```bash
DATABASE_URL="postgres://user:password@localhost:5432/jilite"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-valor-secreto-aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY=""
RESEND_FROM="Jilite <onboarding@resend.dev>"
UPLOAD_DIR="public/uploads"
UPLOAD_URL="/uploads"
```

> Generá un secreto seguro: `openssl rand -base64 32`

3. Sincronizar la base de datos (aplica la migración base y crea el cliente):

```bash
npx prisma migrate deploy
```

4. (Opcional) Cargar datos de ejemplo — crea usuarios y proyectos de prueba:

```bash
npm run db:seed
```

Usuarios del seed (contraseña `password123`):
- `admin@jilite.com` — ADMIN
- `luis@jilite.com` — PROJECT_ADMIN
- `ana@jilite.com` — USER (activo)
- `carla@jilite.com` — USER (activo)
- `maria@jilite.com` — USER (inactivo)

5. Levantar el servidor:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | ✅ |
| `NEXTAUTH_SECRET` | Secreto para firmar sesiones JWT | ✅ |
| `NEXTAUTH_URL` | URL pública de la app | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL pública usada en los correos/enlaces | ✅ |
| `RESEND_API_KEY` | API key de Resend | Solo email |
| `RESEND_FROM` | Remitente de los correos | Solo email |
| `UPLOAD_DIR` | Carpeta física de archivos subidos | ❌ (default `public/uploads`) |
| `UPLOAD_URL` | Prefijo público de los archivos | ❌ (default `/uploads`) |
| `CRON_SECRET` | Secreto para el endpoint `/api/cron/reminders` | Solo reminders |
| `SLACK_WEBHOOK_URL` | Webhook de Slack para notificaciones | ❌ |
| `DISCORD_WEBHOOK_URL` | Webhook de Discord para notificaciones | ❌ |
| `ADMIN_EMAIL` | Email del super admin inicial (seed prod) | Solo primer deploy |
| `ADMIN_PASSWORD` | Contraseña del super admin inicial | Solo primer deploy |
| `ADMIN_NAME` | Nombre del super admin inicial | ❌ |

---

## Deploy en Railway

### 1. Crear los servicios

1. Conectá tu repo a Railway (New Project → Deploy from GitHub repo).
2. Agregá un servicio **PostgreSQL** (New → Database → PostgreSQL). Railway te da `DATABASE_URL` automáticamente.

### 2. Variables de entorno

En el servicio de la app, en **Variables**, agregá:

```
NEXTAUTH_URL=https://tu-app.up.railway.app
NEXTAUTH_SECRET=<valor secreto, genera con: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://tu-app.up.railway.app
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM=Jilite <tu-remitente@dominio.com>
DATABASE_URL=postgresql://...   # la provee el plugin de Railway
ADMIN_EMAIL=tu@correo.com
ADMIN_PASSWORD=<una contraseña segura, mín. 8 caracteres>
ADMIN_NAME=Admin
```

Opcionales:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
CRON_SECRET=<valor secreto>
```

### 3. Volumen para archivos

Los archivos subidos se guardan en disco (`UPLOAD_DIR`). Para que sobrevivan a los redeploys:

1. En el servicio de la app → **Settings → Volumes** → creá un volumen montado en **`/app/public/uploads`**.
2. No hace falta tocar `UPLOAD_DIR`/`UPLOAD_URL` (los defaults ya apuntan a `public/uploads` y `/uploads`).

### 4. Super admin inicial (primer deploy)

El `railway.json` ya corre, en cada deploy:

```
prisma migrate deploy && npm run db:seed:prod && npm run start
```

- **Primer deploy** (BD vacía): aplica las migraciones y, como no existe ningún usuario `ADMIN`, `db:seed:prod` crea el super admin con `ADMIN_EMAIL` / `ADMIN_PASSWORD` (estado activo, sin verificación de correo).
- **Deploys siguientes**: como ya existe un admin, el seed no hace nada (idempotente).

Luego iniciás sesión en `https://tu-app.up.railway.app/login` con esas credenciales.

### 5. Reminders por email (cron)

Para que las notificaciones de tareas por vencer y vencidas funcionen:

1. En el panel de Railway, abrí el proyecto → **Schedulers** → **New Scheduler**.
2. Endpoint: `https://tu-app.up.railway.app/api/cron/reminders?key=<CRON_SECRET>`
3. Frecuencia: p. ej. cada hora (`0 * * * *`).

### 6. Health check

`https://tu-app.up.railway.app/api/health` devuelve estado de la app y de la base de datos (200/503).

---

## Funcionalidades

- Autenticación con roles: `ADMIN`, `PROJECT_ADMIN`, `USER` (Auth.js + JWT)
- Proyectos con miembros y gestión por correo (invitaciones)
- Tareas: Kanban drag-and-drop, prioridad, fecha límite, subtareas, etiquetas, archivos adjuntos
- Comentarios con actualización automática
- Bulk actions: cambiar estado/prioridad o eliminar varias tareas
- Vistas guardadas y filtros avanzados (estado, prioridad, asignado, etiqueta)
- Calendario de tareas + exportación iCal (`/api/calendar.ics`)
- Exportar tarea a PDF (`/api/tasks/[id]/pdf`)
- Notificaciones por email (verificación, reset, comentarios, asignación, actualización, vencimiento)
- Webhooks a Slack/Discord para comentarios, tareas, subtareas y reminders
- Panel admin: actividad y usuarios con export CSV
- Modo oscuro y accesibilidad

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run start        # servidor de producción
npm run lint         # ESLint
npm test             # Vitest
npm run db:seed      # datos de ejemplo (desarrollo)
npm run db:seed:prod # super admin inicial idempotente (producción)
npm run db:deploy    # prisma migrate deploy
```
