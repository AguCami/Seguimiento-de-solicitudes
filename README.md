# Seguimiento de Solicitudes

Sistema web para gestionar y hacer seguimiento de solicitudes a los distintos sectores de una empresa.

## Funcionalidades

- **Roles**: Solicitante, Responsable de sector, Administrador
- **Solicitudes**: Crear, filtrar por estado y sector, ver detalle
- **Estados**: Pendiente → En progreso → Resuelto / Cancelado
- **Prioridades**: Baja, Media, Alta, Urgente
- **Comentarios**: Cualquier usuario puede comentar en las solicitudes
- **Admin**: Registrar usuarios y agregar sectores desde el panel

## Usuarios de prueba (después del seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@empresa.com | admin123 | Administrador |
| it@empresa.com | it123 | Responsable IT |
| usuario@empresa.com | usuario123 | Solicitante |

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Despliegue en Vercel (gratuito)

1. Hacer fork/push del repo a GitHub
2. Entrar a [vercel.com](https://vercel.com) → **New Project** → importar el repo
3. Configurar las variables de entorno:
   - `NEXTAUTH_SECRET` → cualquier string aleatorio (ej: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` → la URL de Vercel (ej: `https://mi-app.vercel.app`)
   - `DATABASE_URL` → conexión a PostgreSQL (ver abajo)
4. Hacer clic en **Deploy**

### Base de datos en producción (Neon - gratuito)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear una base de datos PostgreSQL gratuita
3. Copiar la `DATABASE_URL` de conexión
4. En el `prisma/schema.prisma`, cambiar `provider = "sqlite"` por `provider = "postgresql"`
5. Ejecutar `npx prisma migrate deploy` (Vercel lo hace automáticamente con el script `postinstall`)

> Para SQLite simple en Vercel sin base de datos externa, se puede usar [Turso](https://turso.tech) como alternativa gratuita.
