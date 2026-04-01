# Backend — Tenpay API

Spring Boot 3.3 · Java 21 · PostgreSQL 16 · Flyway · JWT · BCrypt

---

## Tabla de contenidos

1. [Estructura del proyecto](#estructura-del-proyecto)
2. [Cómo ejecutar](#cómo-ejecutar)
3. [Migraciones de base de datos](#migraciones-de-base-de-datos)
4. [Sistema de autenticación](#sistema-de-autenticación)
5. [Decisiones técnicas](#decisiones-técnicas)
6. [Documentación de la API](#documentación-de-la-api)
7. [Manejo de errores](#manejo-de-errores)

---

## Estructura del proyecto

```
backend/src/main/java/com/tenpay/
├── TenpayApplication.java
├── DataInitializer.java            ← seed del usuario por defecto al arranque
│
├── controller/
│   ├── AuthController.java         ← POST /auth/**
│   └── TransactionController.java  ← GET /transaction, POST /transaction
│
├── service/
│   ├── AuthService.java            ← register, login, forgot/reset password
│   └── TransactionService.java     ← CRUD filtrado por usuario
│
├── model/
│   ├── User.java                   ← entidad JPA + UserDetails
│   ├── Transaction.java            ← entidad JPA con FK a User
│   └── PasswordResetToken.java     ← token hasheado + expiración
│
├── repository/
│   ├── UserRepository.java
│   ├── TransactionRepository.java  ← findAllByUserId, findAllOrphans
│   └── PasswordResetTokenRepository.java
│
├── dto/
│   ├── RegisterRequest.java / LoginRequest.java / AuthResponse.java
│   ├── ForgotPasswordRequest.java / ResetPasswordRequest.java
│   ├── TransactionRequest.java / TransactionResponse.java
│   └── ErrorResponse.java
│
├── security/
│   ├── SecurityConfig.java         ← HTTP security, CORS, BCrypt bean
│   ├── JwtUtil.java                ← generar y validar JWT (jjwt 0.12.x)
│   ├── JwtFilter.java              ← OncePerRequestFilter → SecurityContext
│   └── UserDetailsServiceImpl.java ← carga User por email
│
└── exception/
    └── GlobalExceptionHandler.java ← @RestControllerAdvice
```

---

## Cómo ejecutar

El backend no se ejecuta de forma aislada; forma parte de Docker Compose.
Ver instrucciones completas en el README raíz.

```bash
# Desde la raíz del proyecto
docker compose up --build backend

# Verificar que levantó
curl http://localhost:8080/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test1234!"}'
```

**Swagger UI** disponible en `http://localhost:8080/swagger-ui.html` (acceso público).

---

## Migraciones de base de datos

Flyway aplica las migraciones en orden estricto al arrancar el backend.
Para aplicar una migración nueva desde cero (cambios de esquema incompatibles):

```bash
docker compose down -v && docker compose up --build
```

### V1 — Esquema inicial (`V1__init.sql`)

```sql
CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    amount           INTEGER      NOT NULL CHECK (amount > 0),
    merchant         VARCHAR(255) NOT NULL,
    tenpist_name     VARCHAR(255) NOT NULL,
    transaction_date TIMESTAMP    NOT NULL
);
CREATE INDEX idx_transactions_date ON transactions (transaction_date DESC);
```

**Decisión `SERIAL`:** el challenge original pedía `id` como entero. Se migró a UUID en V4.

**Decisión índice por fecha descendente:** `GET /transaction` siempre ordena por fecha DESC. El índice evita un full scan + sort en cada consulta.

### V2 — Monedas (`V2__add_currency.sql`)

```sql
ALTER TABLE transactions
    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'CLP'
        CHECK (currency IN ('CLP', 'COP', 'USD', 'EUR'));
```

**Decisión `DEFAULT 'CLP'`:** los registros existentes antes de esta migración no tienen moneda; se les asigna CLP como valor más probable para datos de prueba chilenos. No rompe la integridad existente.

**Decisión `CHECK` en lugar de tabla de referencia:** el dominio de monedas es pequeño y estable. Una FK a una tabla `currencies` sería sobrediseño. Si se agregan monedas en el futuro, se crea V5 con `ALTER`.

### V3 — Usuarios (`V3__add_users.sql`)

```sql
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users (email);

CREATE TABLE password_reset_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT FALSE
);
```

**Decisión UUID como PK (no SERIAL):** con `id=42` un atacante puede iterar IDs y confirmar existencia de usuarios. UUID v4 es opaco: no revela volumen ni orden. `gen_random_uuid()` es nativo de PostgreSQL 13+, sin dependencia externa.

**Decisión sin columna `salt`:** BCrypt embebe el salt dentro del hash (`$2a$10$[22-char-salt][31-char-hash]`). Una columna adicional para salt sería redundante y potencialmente confusa.

**Decisión `token_hash` (SHA-256 del token real):** el token raw viaja al usuario por email (o en la respuesta dev). En la DB solo se guarda su SHA-256. Si la DB se compromete, los tokens del atacante son inútiles porque no tiene los valores originales.

**Decisión `ON DELETE CASCADE` en `password_reset_tokens`:** si se elimina un usuario, sus tokens de reset se eliminan automáticamente. Evita orphan rows.

### V4 — Transacciones UUID + FK usuario (`V4__transactions_uuid.sql`)

```sql
-- Agrega UUID a filas existentes
ALTER TABLE transactions ADD COLUMN new_id UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE transactions DROP CONSTRAINT transactions_pkey;
ALTER TABLE transactions DROP COLUMN id;
ALTER TABLE transactions RENAME COLUMN new_id TO id;
ALTER TABLE transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

-- FK nullable (ver nota DataInitializer)
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES users(id);
```

**Decisión `user_id` nullable en V4:** Flyway corre antes de que Spring inicialice los beans. El usuario por defecto (`jbautistaclavijo@gmail.com`) lo crea `DataInitializer`, un `@ApplicationRunner` que corre _después_ de Flyway. Si `user_id` fuera `NOT NULL`, no habría forma de insertar registros existentes sin el usuario. `DataInitializer` hace el UPDATE posterior y llena la FK.

---

## Sistema de autenticación

### Flujo completo

```
1. POST /auth/register → BCrypt(password, cost=10) → INSERT users → JWT
2. POST /auth/login    → loadByEmail → BCrypt.matches → JWT
3. Cada request protegido:
   JwtFilter → extraer Bearer token → JwtUtil.isValid → loadByEmail
   → SecurityContextHolder.setAuthentication
4. @AuthenticationPrincipal User user → controller recibe User directamente
```

### JWT

- Librería: `jjwt 0.12.6`
- Algoritmo: HMAC-SHA256
- Clave: `JWT_SECRET` (mínimo 32 chars en producción)
- Subject: UUID del usuario
- Claim adicional: `email`
- Expiración: `JWT_EXPIRATION_MS` (default 24h = 86400000 ms)

### BCrypt

- `BCryptPasswordEncoder(10)` — cost factor 10 ≈ 100ms por hash
- Suficientemente lento para fuerza bruta, suficientemente rápido para UX normal
- El salt se embebe en el hash; no se almacena por separado

### Recuperación de contraseña

```
1. POST /auth/forgot-password {email}
   → Si email existe: generar UUID raw, hash SHA-256, guardar en DB (24h expiración)
   → Si MAIL_ENABLED=false: devolver rawToken en campo devToken (modo dev)
   → Si MAIL_ENABLED=true: enviar por email, no incluir en respuesta
   → Siempre: devolver mismo mensaje (previene enumeración de usuarios)

2. POST /auth/reset-password {token, newPassword}
   → SHA-256(token) → buscar en DB → verificar !used && !expired
   → BCrypt(newPassword) → UPDATE users → marcar token como used
```

### DataInitializer

`@ApplicationRunner` que corre una vez al arranque después de Flyway:

1. Verifica si `jbautistaclavijo@gmail.com` existe en la DB.
2. Si no existe: lo crea con password `Tenpay2026!` (hasheado con BCrypt).
3. Busca todas las transacciones con `user_id IS NULL` (orphans de V1/V2).
4. Las asigna al usuario recién creado (UPDATE transactions SET user_id = ?).

---

## Decisiones técnicas

### Por qué Spring Security stateless

Con JWT no hay sesión en el servidor. Cada request es autónomo: lleva el token, el filtro lo valida, el contexto de seguridad se carga y se descarta al final del request. Escala horizontalmente sin necesidad de Redis ni sticky sessions.

### Por qué BCrypt cost=10 y no MD5/SHA-256

MD5 y SHA-256 son algoritmos de propósito general diseñados para ser rápidos: millones de hashes por segundo en GPU. BCrypt es un KDF (Key Derivation Function) deliberadamente lento. Con cost=10, un atacante necesita ~100ms por intento por core, haciendo fuerza bruta impráctica.

### Por qué no se guardó el token de reset en texto plano

Si un atacante obtiene acceso de lectura a la DB (SQL injection, backup comprometido), los tokens en texto plano le permitirían resetear passwords de todos los usuarios. Con SHA-256, los tokens de la DB son inútiles sin los valores raw correspondientes.

### Por qué `@Autowired(required = false)` en JavaMailSender

Spring Boot crea un bean `JavaMailSender` solo si `spring.mail.host` está configurado correctamente. Si `MAIL_ENABLED=false` y no hay servidor SMTP, el bean no se crea y la inyección normal fallaría al arrancar. `required = false` permite que la aplicación inicie sin SMTP; el servicio verifica `mailEnabled` antes de intentar enviar.

### Por qué tenpistName se auto-puebla en el backend

Con autenticación, el nombre del "Tenpista" ES el nombre del usuario autenticado. Pedirlo en el formulario sería redundante y podría falsificarse. El backend extrae `user.getName()` del `SecurityContext` y lo asigna directamente.

---

## Documentación de la API

### Swagger UI (interactivo)

```
http://localhost:8080/swagger-ui.html
```

Para endpoints protegidos: clic en **Authorize** → ingresar `Bearer <token>`.

---

### Auth endpoints

#### `POST /auth/register`

Crea un usuario nuevo y devuelve un JWT.

**Request:**
```json
{
  "name": "Juan",
  "email": "juan@example.com",
  "password": "MiPassword1!"
}
```

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "name": "Juan",
  "email": "juan@example.com"
}
```

> El frontend usa `name` y `email` para mostrar el saludo del usuario sin hacer un request adicional al perfil.

**Errores:**
- `400` — validación fallida (campo vacío, email inválido)
- `400` — email ya registrado

---

#### `POST /auth/login`

Autentica un usuario existente y devuelve un JWT.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "MiPassword1!"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "name": "Juan",
  "email": "juan@example.com"
}
```

**Errores:**
- `401` — credenciales incorrectas

---

#### `POST /auth/forgot-password`

Inicia el flujo de recuperación de contraseña.

**Request:**
```json
{
  "email": "juan@example.com"
}
```

**Response `200` (producción — SMTP configurado):**
```json
{
  "message": "Si el email existe, recibirás las instrucciones en breve."
}
```

**Response `200` (desarrollo — `MAIL_ENABLED=false`):**
```json
{
  "message": "Si el email existe, recibirás las instrucciones en breve.",
  "devToken": "a1b2c3d4-e5f6-..."
}
```

> El campo `devToken` solo aparece cuando no hay SMTP configurado.
> En producción, el token llega por email y no se expone en la respuesta.

---

#### `POST /auth/reset-password`

Establece una nueva contraseña usando el token de recuperación.

**Request:**
```json
{
  "token": "a1b2c3d4-e5f6-...",
  "newPassword": "NuevaPassword1!"
}
```

**Response `200`:**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errores:**
- `400` — token inválido, expirado o ya usado

---

### Transaction endpoints

Todos requieren header: `Authorization: Bearer <token>`

#### `GET /transaction`

Devuelve todas las transacciones del usuario autenticado, ordenadas por fecha descendente.

**Response `200`:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 15000,
    "merchant": "Supermercado Lider",
    "tenpistName": "Juan",
    "transactionDate": "2026-03-28T14:30:00",
    "currency": "CLP"
  }
]
```

**Errores:**
- `401` — token ausente o inválido

---

#### `POST /transaction`

Crea una nueva transacción para el usuario autenticado.

**Request:**
```json
{
  "amount": 15000,
  "merchant": "Supermercado Lider",
  "transactionDate": "2026-03-28T14:30:00",
  "currency": "CLP"
}
```

> `tenpistName` no se incluye en el request: el backend lo extrae automáticamente del usuario autenticado.

**Response `201`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 15000,
  "merchant": "Supermercado Lider",
  "tenpistName": "Juan",
  "transactionDate": "2026-03-28T14:30:00",
  "currency": "CLP"
}
```

**Validaciones:**
- `amount`: requerido, mayor a 0
- `merchant`: requerido, no vacío
- `transactionDate`: requerido, no puede ser fecha futura
- `currency`: requerido, debe ser `CLP`, `COP`, `USD` o `EUR`

**Errores:**
- `400` — validación fallida
- `401` — token ausente o inválido

---

## Manejo de errores

Todos los errores siguen el mismo formato via `GlobalExceptionHandler`:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "El monto debe ser mayor a 0",
  "timestamp": "2026-03-28T14:30:00.123"
}
```

> `timestamp` es generado automáticamente por `ErrorResponse` con `LocalDateTime.now()` al construirse la respuesta. Útil para correlacionar errores en logs.

| Código | Causa |
|--------|-------|
| `400`  | Validación Bean Validation fallida, argumento ilegal |
| `401`  | Token JWT ausente, inválido o expirado; credenciales incorrectas |
| `500`  | Error interno no controlado |

El campo `timestamp` permite correlacionar la respuesta de error con las líneas del log del backend, que también registran el mismo instante de tiempo.
