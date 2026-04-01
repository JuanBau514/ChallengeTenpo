# Frontend — Tenpay

React 19 · TypeScript · Vite · TanStack Query · React Hook Form · Zod v4

---

## Tabla de contenidos

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Cómo ejecutar](#cómo-ejecutar)
3. [Arquitectura y flujo de datos](#arquitectura-y-flujo-de-datos)
4. [Sistema de autenticación](#sistema-de-autenticación)
5. [Sistema de temas (dark/light)](#sistema-de-temas-darklight)
6. [Sistema de monedas](#sistema-de-monedas)
7. [Estados visuales (loading / empty / error)](#estados-visuales-loading--empty--error)
8. [Paginación](#paginación)
9. [Accesibilidad](#accesibilidad)
10. [Tests](#tests)
11. [Decisiones técnicas](#decisiones-técnicas)

---

## Estructura del proyecto

```
src/
├── App.tsx                         ← árbol de providers + Router por estado
├── main.tsx
│
├── providers/
│   ├── ThemeProvider.tsx           ← tema dark/light + localStorage
│   ├── AuthProvider.tsx            ← JWT + usuario + navegación por estado
│   └── QueryProvider.tsx           ← TanStack Query client
│
├── hooks/
│   ├── useAuth.ts                  ← consume AuthContext
│   ├── useTheme.ts                 ← consume ThemeContext
│   ├── useTransactions.ts          ← GET /transaction via React Query
│   ├── useCreateTransaction.ts     ← POST /transaction via React Query mutation
│   └── useTransactionFilters.ts    ← estado local de filtros
│
├── api/
│   ├── client.ts                   ← instancia axios + interceptores JWT/401
│   ├── endpoints.ts                ← constantes de URLs
│   ├── auth.api.ts                 ← login, register, forgotPassword, resetPassword
│   └── transactions/
│       └── transactions.api.ts     ← getTransactions, createTransaction
│
├── pages/
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── ForgotPasswordPage/         ← multi-step: request → reset → done
│   └── TransactionsPage/           ← página principal post-login
│
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Spinner/
│   │   ├── EmptyState/
│   │   └── ThemeToggle/
│   └── transactions/
│       ├── TransactionForm/        ← React Hook Form + Zod
│       ├── TransactionTable/       ← lista + formateo de moneda
│       ├── TransactionFilters/     ← filtros por usuario, comercio, fecha, moneda
│       └── TransactionPagination/
│
├── types/
│   └── transaction.ts              ← Transaction, Currency, CreateTransactionPayload
│
├── schemas/
│   └── transaction.schema.ts       ← Zod schema + tipo inferido
│
└── utils/
    ├── formatCurrency.ts           ← Intl.NumberFormat con cache por moneda
    ├── formatDate.ts
    └── sortTransactions.ts
```

La separación en tres capas es intencional:
- `api/` conoce HTTP y los tipos de red
- `hooks/` conecta la capa de red con React
- `components/` no sabe qué viene de la red, solo recibe props

---

## Cómo ejecutar

### Con Docker (recomendado)

El frontend se ejecuta como parte de Docker Compose junto al backend.
Ver instrucciones completas en el README raíz del proyecto.

```bash
# Desde springChallenge/
docker compose up --build

# Frontend: http://localhost:3000
```

En el contenedor, Nginx sirve el build estático y hace reverse proxy hacia
el backend para las rutas `/transaction` y `/auth`.

### Desarrollo local (Vite dev server)

Requiere el backend corriendo en `localhost:8080`.

```bash
npm install
npm run dev
# http://localhost:5173
```

El proxy de Vite redirige `/transaction` y `/auth` a `http://localhost:8080`
automáticamente, sin problemas de CORS.

---

## Arquitectura y flujo de datos

### Árbol de providers

```
ThemeProvider         ← tema global (data-theme en <html>)
  └── AuthProvider    ← JWT + usuario + currentPage
        └── Router    ← renderiza página según currentPage
              │
              └── (si autenticado)
                    └── QueryProvider   ← TanStack Query client
                          └── TransactionsPage
```

`QueryProvider` solo se monta cuando el usuario está autenticado. Esto evita
que React Query intente cargar transacciones antes de tener un token válido.

### Flujo de una request protegida

```
componente → useTransactions() → apiClient.get('/transaction')
  → interceptor request: agrega "Authorization: Bearer <token>"
  → backend valida JWT → devuelve datos
  → React Query cachea resultado
```

### Flujo de logout automático (token expirado)

```
backend → 401 (token expirado o inválido)
  → interceptor response de axios detecta 401
  → localStorage.removeItem('tenpay_token' | 'tenpay_user')
  → window.dispatchEvent(new Event('tenpay:logout'))
  → Router (useEffect) escucha el evento → auth.logout()
  → currentPage = 'login' → LoginPage se renderiza
```

El `CustomEvent` desacopla el interceptor de axios (que no tiene acceso
a React) del `AuthProvider`. No hay dependencias circulares.

---

## Sistema de autenticación

### Estado de sesión

El JWT y los datos del usuario se persisten en `localStorage`:

| Clave          | Contenido                                 |
|----------------|-------------------------------------------|
| `tenpay_token` | JWT string                                |
| `tenpay_user`  | JSON `{ name: string, email: string }`   |

Al cargar la app, `AuthProvider` lee `localStorage` para determinar si hay
sesión activa. Si hay token, el usuario va directamente a la página de transacciones
sin ver el login.

### Navegación por estado

La navegación entre páginas usa un `type Page` en `AuthProvider`, no React Router:

```ts
type Page = 'login' | 'register' | 'forgot-password' | 'transactions'
```

El `Router` en `App.tsx` renderiza el componente correspondiente según `currentPage`.
No hay URLs distintas ni `history.pushState`.

### Flujo de recuperación de contraseña

`ForgotPasswordPage` implementa un flujo de 3 pasos:

```
'request'  → usuario ingresa email → POST /auth/forgot-password
'reset'    → usuario ingresa token + nueva password → POST /auth/reset-password
'done'     → confirmación visual
```

**Modo desarrollo (sin SMTP):** el backend incluye `devToken` en la respuesta.
El frontend detecta ese campo, pre-llena el input de token y muestra un banner
de aviso. El campo queda en `readOnly`.

**Modo producción (con SMTP):** `devToken` no aparece en la respuesta. El usuario
recibe el token por email e ingresa manualmente.

### Trade-off: localStorage vs httpOnly cookie

El JWT se guarda en `localStorage`. Esto es más simple que `httpOnly` cookie
pero es vulnerable a XSS: cualquier script en la página puede leer el token.

Para este challenge es aceptable. En producción real se usaría:
- Cookie `httpOnly` (inaccesible para JS)
- Cookie `SameSite=Strict` o CSRF token para prevenir CSRF

El trade-off está documentado explícitamente en el código (`AuthProvider.tsx`).

---

## Sistema de temas (dark/light)

### Detección de preferencia

```
1. localStorage['theme']                         ← manual override del usuario
2. window.matchMedia('prefers-color-scheme: dark') ← preferencia del SO
3. default: 'light'
```

### Aplicación del tema

`ThemeProvider` usa `useLayoutEffect` (no `useEffect`) para aplicar el atributo
`data-theme` en `<html>` **antes del primer paint del browser**:

```ts
useLayoutEffect(() => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}, [theme])
```

`useEffect` corre de forma asíncrona después del paint, lo que produciría un
flash del tema incorrecto durante ~16ms (FOWT: Flash Of Wrong Theme).
`useLayoutEffect` es síncrono con respecto al DOM, eliminando el flash.

### Variables CSS

Los colores están definidos como custom properties en `:root[data-theme="light"]`
y `:root[data-theme="dark"]`. Los componentes usan solo `var(--color-*)`:

```css
:root[data-theme="light"] {
  --color-bg: #ffffff;
  --color-text-primary: #111827;
}
:root[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text-primary: #f1f5f9;
}
```

El cambio de tema es instantáneo sin re-renders de React: solo cambia el
atributo del elemento `<html>` y el browser recalcula los custom properties.

---

## Sistema de monedas

### Monedas soportadas

`CLP` · `COP` · `USD` · `EUR`

Cada transacción almacena su propia moneda. El formulario tiene un selector
de moneda; la tabla muestra cada monto formateado según su moneda.

### Formateo con `Intl.NumberFormat`

```ts
const LOCALE_MAP: Record<Currency, string> = {
  CLP: 'es-CL',   // $15.000
  COP: 'es-CO',   // $ 15.000
  USD: 'en-US',   // $15,000
  EUR: 'de-DE',   // 15.000 €
}
```

Cada moneda usa el locale de su país de origen, respetando convenciones locales
de separadores de miles y símbolo.

**Cache de formatters:** crear un `Intl.NumberFormat` es costoso (parseo interno
de locale). Se crea uno por moneda en un `Map` y se reutiliza indefinidamente.
Con 4 monedas posibles, el cache nunca tendrá más de 4 entradas.

**`minimumFractionDigits: 0`:** los montos son enteros en el sistema. CLP y COP
no usan decimales en la práctica; USD y EUR técnicamente tienen 2 pero se omiten
para consistencia visual dado que todos los valores son enteros.

### Validación Zod

```ts
currency: z.enum(SUPPORTED_CURRENCIES, {
  error: () => ({ message: 'Selecciona una moneda válida' }),
})
```

`SUPPORTED_CURRENCIES` es el array `['CLP', 'COP', 'USD', 'EUR']` exportado
desde `types/transaction.ts`. Es la fuente de verdad: el enum Zod y el tipo
`Currency` se derivan del mismo array. No hay duplicación.

---

## Estados visuales (loading / empty / error)

`TransactionsPage` renderiza exactamente uno de tres estados mutuamente excluyentes según el estado de TanStack Query:

```tsx
// Estado loading
{isLoading && <Spinner />}

// Estado error
{isError && (
  <div role="alert">
    <p>No se pudieron cargar las transacciones</p>
    <p>{error.message}</p>  {/* mensaje del servidor */}
  </div>
)}

// Estado empty (sin transacciones, o filtros sin resultados)
{!isLoading && !isError && paginatedTransactions.length === 0 && (
  <EmptyState
    title={filtersActive ? 'Sin resultados' : 'Sin transacciones'}
    description={...}
  />
)}

// Estado normal: tabla + paginación
{!isLoading && !isError && paginatedTransactions.length > 0 && (
  <>
    <TransactionTable ... />
    <TransactionPagination ... />
  </>
)}
```

El estado empty distingue entre "nunca ha habido transacciones" y "hay transacciones pero los filtros activos no tienen resultados". El `role="alert"` en loading y error permite que los lectores de pantalla anuncien los cambios de estado sin interacción del usuario.

Hay un segundo estado de error para la mutación (POST /transaction): si el backend rechaza la creación, el mensaje de error aparece dentro del modal del formulario con `role="alert"`.

---

## Paginación

La paginación es **cliente** sobre la lista ya filtrada. `TransactionsPage` aplica la lógica:

```ts
const PAGE_SIZE = 10

const totalPages = Math.ceil(allTransactions.length / PAGE_SIZE)
const paginatedTransactions = allTransactions.slice(
  (page - 1) * PAGE_SIZE,
  page * PAGE_SIZE
)
```

`TransactionPagination` recibe `page`, `totalPages` y `onPageChange` como props; no tiene estado propio. Si `totalPages <= 1`, no renderiza nada.

El estado `page` vive en `useTransactionFilters`. Al cambiar un filtro, `setFilter` llama `setPage(1)` para volver a la primera página:

```ts
function setFilter(key, value) {
  setFilters(prev => ({ ...prev, [key]: value }))
  setPage(1)  // reset de página al filtrar
}
```

---

## Accesibilidad

Se implementó accesibilidad básica en todos los componentes de formulario e interacción:

### `Input` (componente `ui/Input/Input.tsx`)

```tsx
<label htmlFor={id}>
  {label}
  {required && <span aria-hidden="true"> *</span>}
</label>
<input
  aria-describedby={error ? errorId : undefined}
  aria-invalid={!!error}
/>
{error && (
  <span id={errorId} role="alert">{error}</span>
)}
```

- `htmlFor`/`id` vinculan label e input (click en label activa el input)
- `aria-invalid` anuncia el estado de error al input para lectores de pantalla
- `aria-describedby` asocia el input con el mensaje de error
- `role="alert"` en el mensaje de error lo anuncia automáticamente al aparecer
- El asterisco `*` de campo requerido tiene `aria-hidden="true"` (decorativo)

### `TransactionPagination`

```tsx
<nav aria-label="Paginación de transacciones">
  <Button aria-label="Página anterior" disabled={page === 1}>← Anterior</Button>
  {pages.map(p => (
    <button
      aria-label={`Ir a página ${p}`}
      aria-current={p === page ? 'page' : undefined}
    >
      {p}
    </button>
  ))}
  <Button aria-label="Página siguiente">Siguiente →</Button>
</nav>
```

- `<nav>` con `aria-label` identifica la región de paginación
- `aria-current="page"` marca la página activa
- `aria-label` explícito en botones de navegación (el texto "←" solo no es suficiente)

### `TransactionsPage`

- `aria-live="polite"` en el contador de transacciones: anuncia cambios al filtrar sin interrumpir
- `Dialog.Content` de Radix UI incluye `aria-describedby` que apunta a la descripción del modal

---

## Tests

```bash
npm run test:run    # ejecución única (CI)
npm run test        # modo watch (desarrollo)
```

### Suite actual — 12 tests

| Archivo                              | Tests | Qué valida                                                               |
|--------------------------------------|-------|--------------------------------------------------------------------------|
| `schemas/transaction.schema.test.ts` | 7     | Monto positivo, entero, no-negativo; fecha no futura; campos obligatorios |
| `utils/sortTransactions.test.ts`     | 3     | Orden desc correcto, inmutabilidad del array, array vacío                |
| `utils/formatCurrency.test.ts`       | 2     | Formato CLP con separador de miles                                       |

Los tests de schema cubren las reglas de negocio en el punto de entrada
del sistema. Si `amount: 0` o una fecha futura pasaran la validación
client-side, llegarían al backend y producirían un 400 tardío.

---

## Decisiones técnicas

### Por qué navegación por estado y no React Router

El Dockerfile usa `npm ci`, que requiere un `package-lock.json` sincronizado.
Agregar React Router requeriría ejecutar `npm install` localmente para
regenerar el lock file. Como el entorno de desarrollo recomendado es Docker
sin Node en el host, eso no es posible sin pasos adicionales.

Un `type Page` con 4 valores es suficiente para este dominio. La navegación
por estado tiene la misma UX para el usuario (no hay URLs que cambien en
el challenge) sin añadir dependencias.

### Por qué TanStack Query y no `useEffect` + `fetch`

El patrón `useState + useEffect + fetch` tiene problemas no obvios:
sin deduplicación de requests (dos componentes pidiendo lo mismo hacen dos
fetches), sin cache (cada montaje es un fetch), sin invalidación automática
al mutar datos, y race conditions si el componente se desmonta antes de
que termine el fetch.

TanStack Query resuelve todo esto. Al crear una transacción:
```ts
queryClient.invalidateQueries({ queryKey: ['transactions'] })
// → refetch automático, tabla actualizada, sin código adicional
```

### Por qué React Hook Form + Zod

React Hook Form registra inputs sin re-render en cada keystroke (uncontrolled
internamente). Zod provee un schema type-safe que sirve para validación runtime
Y para inferir el tipo TypeScript (`z.infer<typeof schema>`). Un solo cambio
en el schema actualiza tanto la validación como los tipos.

### Por qué Zod v4 y no v3

El proyecto usa Zod v4. La sintaxis de error en enums cambió:

```ts
// Zod v3 (NO funciona en v4):
z.enum(values, { errorMap: () => ({ message: '...' }) })

// Zod v4 (correcto):
z.enum(values, { error: () => ({ message: '...' }) })
```

### Por qué `useLayoutEffect` en ThemeProvider

`useEffect` es asíncrono con respecto al paint: si el tema inicial es 'dark'
pero el DOM aún no tiene `data-theme="dark"`, el browser pinta con el tema
por defecto y luego cambia — produciendo un flash visible. `useLayoutEffect`
corre sincrónicamente antes del paint, eliminando el flash completamente.

### Por qué CSS Modules y no Tailwind

CSS Modules produce CSS estático en build time sin runtime overhead. El
scoping automático por clase evita colisiones sin procesamiento adicional.
El uso de CSS custom properties para el sistema de temas no requiere clases
dinámicas ni regeneración de estilos en runtime.

### Por qué Nginx en producción y no `vite preview`

`vite preview` no está diseñado para producción: no tiene compresión gzip,
manejo de headers de cache, ni capacidad de reverse proxy. Nginx resuelve
las tres necesidades con ~20 líneas de configuración:

1. **SPA fallback:** `try_files $uri $uri/ /index.html` — cualquier ruta devuelve `index.html`
2. **Reverse proxy:** `/transaction` y `/auth` → `http://backend:8080`
3. **Cache agresiva:** assets con hash de contenido (generados por Vite) se cachean 1 año

### Por qué multi-stage Docker build

```dockerfile
# Stage 1 (build): Node 22 + npm + código fuente → /dist
# Stage 2 (producción): Nginx alpine + /dist únicamente
```

La imagen final pesa ~25 MB. Con todo en una etapa Node pesaría ~300 MB.
El stage de producción no tiene Node, npm, ni código fuente: si la imagen
se compromete, el atacante no tiene acceso al toolchain ni al código.
