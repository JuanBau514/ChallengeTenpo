# Tenpay — Transaction Manager

Sistema de registro y visualización de transacciones para usuarios Tenpay.
Desarrollado como challenge técnico para evaluación de habilidades full-stack.

**Stack:** React 19 + Spring Boot 3.3 + PostgreSQL 16 · Orquestado con Docker Compose.

---

## Tabla de contenidos

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Arquitectura](#arquitectura)
3. [Requisitos previos](#requisitos-previos)
4. [Ejecución local](#ejecución-local)
5. [Credenciales por defecto](#credenciales-por-defecto)
6. [Variables de entorno](#variables-de-entorno)
7. [Decisiones técnicas generales](#decisiones-técnicas-generales)
8. [Documentación de la API](#documentación-de-la-api)

---

## Descripción del proyecto

Aplicación web que permite a usuarios registrados:

- **Crear transacciones** con monto, comercio, moneda (CLP/COP/USD/EUR) y fecha.
- **Visualizar** sus transacciones en tabla ordenada por fecha descendente.
- **Filtrar** por usuario, comercio, rango de fechas y moneda.
- **Autenticarse** mediante registro, login y recuperación de contraseña.

Restricciones de negocio implementadas:
- Monto siempre mayor a 0.
- Fecha de transacción no puede ser futura.
- Cada transacción pertenece exclusivamente al usuario autenticado.

---

## Arquitectura

```
browser
  │
  ▼
┌─────────────────────┐
│   frontend :3000    │  React + Vite → build estático servido por Nginx
│   (Nginx)           │  Nginx actúa como reverse proxy hacia el backend
└────────┬────────────┘
         │ HTTP /transaction  /auth/**
         ▼
┌─────────────────────┐
│   backend  :8080    │  Spring Boot — API REST + JWT + BCrypt
└────────┬────────────┘
         │ JDBC / JPA
         ▼
┌─────────────────────┐
│   db       :5432    │  PostgreSQL 16 — esquema gestionado por Flyway
└─────────────────────┘
```

Los tres servicios corren en la red interna `tenpay-net`.
Solo los puertos 3000, 8080 y 5432 están expuestos al host.

---

## Requisitos previos

| Herramienta    | Versión mínima |
|----------------|---------------|
| Docker Engine  | 24.x          |
| Docker Compose | 2.x (plugin)  |

No se requiere Java, Node, ni PostgreSQL instalados en el host.
El entorno completo vive dentro de los contenedores.

```bash
docker --version          # Docker version 24.x.x
docker compose version    # Docker Compose version v2.x.x
```

---

## Ejecución local

### Primera vez (o tras cambios en código)

```bash
git clone <repo-url>
cd springChallenge

docker compose up --build
```

El proceso completo dura ~3 minutos la primera vez (descarga de imágenes base,
compilación Maven, instalación npm). Las siguientes veces la caché de Docker
reduce el tiempo a ~45 segundos.

**Señal de que todo está listo:**

```
tenpay_backend | Started TenpayApplication in 4.x seconds
```

### Verificar el sistema

```bash
# Backend responde
curl http://localhost:8080/transaction \
  -H "Authorization: Bearer <token>"

# Smoke test de registro
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test1234!"}'
```

### URLs

| Servicio    | URL                                      |
|-------------|------------------------------------------|
| Frontend    | http://localhost:3000                    |
| API REST    | http://localhost:8080                    |
| Swagger UI  | http://localhost:8080/swagger-ui.html    |
| PostgreSQL  | localhost:5432 (solo para clientes SQL)  |

### Ciclo de desarrollo

```bash
# Detener sin borrar datos
docker compose stop
docker compose start

# Reconstruir solo el backend
docker compose up --build backend

# Reset completo (borra la base de datos)
docker compose down -v && docker compose up --build
```

> **Importante:** Los cambios en migraciones SQL (`V3`, `V4`, etc.) requieren
> `docker compose down -v` para que Flyway aplique el nuevo esquema desde cero.

---

## Credenciales por defecto

Al arrancar por primera vez, `DataInitializer` crea automáticamente:

| Campo    | Valor                        |
|----------|------------------------------|
| Email    | jbautistaclavijo@gmail.com   |
| Password | `Tenpay2026!`                |

Este usuario recibe todas las transacciones que existieran antes de que se
implementara el sistema de auth (transacciones "huérfanas").

> **Cambiar en producción antes del primer despliegue.**

### Recuperación de contraseña en desarrollo

Sin SMTP configurado, el token de recuperación se devuelve directamente en
la respuesta de la API (campo `devToken`) y aparece pre-llenado en el formulario.
En producción, configurar las variables `MAIL_*` para que llegue por email.

---

## Variables de entorno

Todas tienen valores por defecto funcionales para desarrollo local.

| Variable              | Default                              | Descripción                          |
|-----------------------|--------------------------------------|--------------------------------------|
| `POSTGRES_DB`         | `tenpay`                             | Nombre de la base de datos           |
| `POSTGRES_USER`       | `tenpay_user`                        | Usuario de PostgreSQL                |
| `POSTGRES_PASSWORD`   | `tenpay_pass`                        | Contraseña de PostgreSQL             |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/tenpay` | URL JDBC interna                     |
| `JWT_SECRET`          | `tenpay-local-dev-secret-key-...`    | Clave HMAC-SHA256 (mínimo 32 chars)  |
| `JWT_EXPIRATION_MS`   | `86400000` (24h)                     | Expiración del token en milisegundos |
| `MAIL_ENABLED`        | `false`                              | Envío real de emails                 |
| `MAIL_HOST`           | `localhost`                          | Servidor SMTP                        |
| `MAIL_PORT`           | `587`                                | Puerto SMTP (587 = STARTTLS)         |
| `MAIL_USERNAME`       | _(vacío)_                            | Usuario SMTP                         |
| `MAIL_PASSWORD`       | _(vacío)_                            | Contraseña SMTP                      |
| `FRONTEND_URL`        | `http://localhost:3000`              | Base URL para links en emails        |

---

## Decisiones técnicas generales

### Por qué Docker Compose y no Kubernetes

Kubernetes escala horizontalmente, gestiona rolling updates y tiene alta
disponibilidad. Para un equipo de una persona desarrollando localmente,
ese overhead es sobrediseño. Docker Compose orquesta los mismos tres servicios
con 60 líneas de YAML legibles. La migración a K8s en producción no requiere
cambiar el código, solo el orquestador.

### Por qué PostgreSQL y no MySQL/SQLite

PostgreSQL tiene soporte nativo de UUID (`gen_random_uuid()`), arrays, JSONB
y tipos de fecha más robustos. El constraint `CHECK` en columnas es estándar SQL
y se usa directamente en las migraciones. SQLite no soporta múltiples conexiones
concurrentes de forma segura y no es representativo de un entorno de producción.

### Por qué multi-stage build en Docker

La imagen final del backend pesa ~180 MB en lugar de ~600 MB:

```
Stage 1 (builder): JDK 21 + Maven + dependencias + código fuente → JAR
Stage 2 (runner):  JRE 21-alpine + JAR únicamente
```

El Stage 2 no tiene compilador, Maven, ni código fuente. Si la imagen se
compromete, el atacante no tiene acceso al toolchain de build.

### Por qué la caché de dependencias va antes que el código fuente

```dockerfile
COPY pom.xml .
RUN mvn dependency:go-offline    # ← capa cacheada si pom.xml no cambia
COPY src ./src
RUN mvn package
```

Cambiar una línea de Java no invalida la capa de dependencias.
Sin esta optimización: rebuild completo = ~4 min.
Con ella: solo compila el código nuevo = ~45 seg.

---

## Cumplimiento del challenge

### Requerimientos funcionales

| Requerimiento | Estado | Detalle |
|---|---|---|
| Crear transacciones | ✅ | POST /transaction; campos: id (UUID), amount, merchant, tenpistName, transactionDate, currency |
| Id transacción | ✅ | UUID generado por PostgreSQL (`gen_random_uuid()`), migrado de SERIAL en V4 |
| Monto en pesos | ✅ | `INTEGER NOT NULL CHECK (amount > 0)`; soporta CLP, COP, USD, EUR |
| Giro/comercio | ✅ | `merchant VARCHAR(255)`, requerido |
| Nombre Tenpista | ✅ | Auto-poblado del usuario autenticado en el backend; no se pide en el formulario |
| Fecha de transacción | ✅ | `TIMESTAMP NOT NULL`; validado `@PastOrPresent` en backend y Zod en frontend |
| Visualizar en tabla | ✅ | `TransactionTable` con columnas id, fecha, comercio, monto, moneda |
| Ordenadas por fecha DESC | ✅ | Índice `idx_transactions_date (transaction_date DESC)` + `findAllByUserIdOrderByTransactionDateDesc` |
| Montos no negativos | ✅ | `CHECK (amount > 0)` en DB + `@Positive` en Bean Validation + `.positive()` en Zod |
| Fecha no futura | ✅ | `@PastOrPresent` en Spring + `.refine(val => new Date(val) <= new Date())` en Zod |

### Requerimientos técnicos — backend

| Requerimiento | Estado | Detalle |
|---|---|---|
| API REST GET/POST /transaction | ✅ | `TransactionController` con ambos métodos |
| PostgreSQL | ✅ | PostgreSQL 16 Alpine, esquema gestionado por Flyway |
| Manejador global de errores | ✅ | `GlobalExceptionHandler` con `@RestControllerAdvice`; devuelve `{status, error, message, timestamp}` |
| HTTP 500 para error de servidor | ✅ | `@ExceptionHandler(Exception.class)` → 500 Internal Server Error |

### Requerimientos técnicos — frontend

| Requerimiento | Estado | Detalle |
|---|---|---|
| Interfaz moderna y responsiva | ✅ | CSS Modules + custom properties; layout flexible |
| Estado loading | ✅ | `<Spinner />` mientras TanStack Query carga |
| Estado empty | ✅ | `<EmptyState />` cuando no hay transacciones o filtros no tienen resultados |
| Estado error | ✅ | Bloque con `role="alert"` y mensaje de error del servidor |
| Formulario controlado | ✅ | React Hook Form (registros uncontrolled internamente, API controlada) |
| Validaciones en tiempo real | ✅ | `mode: 'onChange'` en React Hook Form; errores aparecen al modificar |
| Monto mayor a 0 | ✅ | Zod `.positive()` + Bean Validation `@Positive` |
| Fecha válida (no futura) | ✅ | Zod `.refine()` + `@PastOrPresent` |
| Campos obligatorios | ✅ | Todos los campos requeridos en schema + `@NotBlank` / `@NotNull` |
| Mensajes de error claros | ✅ | Mensajes en español bajo cada campo; `role="alert"` para screen readers |
| Separación estado servidor / UI | ✅ | TanStack Query para server state; `useState` local para filtros y paginación |
| TanStack Query | ✅ | `useTransactions` (query) + `useCreateTransaction` (mutation con invalidación) |
| Separación de responsabilidades | ✅ | Tres capas: `api/` (HTTP) → `hooks/` (React) → `components/` (UI) |
| Componentes reutilizables | ✅ | `Button`, `Input`, `Spinner`, `EmptyState`, `ThemeToggle` en `components/ui/` |

### Bonus features implementados

| Bonus | Estado | Detalle |
|---|---|---|
| Filtros | ✅ | `TransactionFilters`: por tenpistName, merchant, dateFrom, dateTo, currency |
| Paginación | ✅ | `TransactionPagination`: paginación cliente, PAGE_SIZE=10 |
| Formateo de moneda | ✅ | `Intl.NumberFormat` con locale por moneda (es-CL, es-CO, en-US, de-DE) + cache |
| Formateo de fechas | ✅ | `formatDate.ts` con `date-fns` |
| Accesibilidad básica | ✅ | `aria-label`, `aria-describedby`, `aria-invalid`, `aria-current`, `role="alert"`, `aria-live` |
| Testing | ✅ | 12 tests: schema (7), sort (3), currency format (2) con Vitest + Testing Library |

### Docker

| Requerimiento | Estado | Detalle |
|---|---|---|
| Contenedor backend | ✅ | Multi-stage: Maven builder (JDK 21) + JRE 21 Alpine (~180 MB) |
| Contenedor base de datos | ✅ | PostgreSQL 16 Alpine con volumen persistente |
| Contenedor frontend | ✅ | Multi-stage: Node 22 builder + Nginx Alpine (~25 MB) |
| docker-compose.yml | ✅ | 3 servicios orquestados en red `tenpay-net`; healthcheck en DB |

---

## Documentación de la API

La documentación interactiva está disponible en Swagger UI:

```
http://localhost:8080/swagger-ui.html
```

Swagger UI permite ejecutar todos los endpoints directamente desde el navegador.
Para los endpoints protegidos, hacer clic en **Authorize** e ingresar:
```
Bearer <token_obtenido_en_login>
```

Ver `backend/README.md` para referencia completa de los endpoints.
