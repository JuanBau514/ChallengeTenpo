# Tenpay Transaction Manager

Sistema de registro y visualización de transacciones para Tenpistas.
Stack: React + Spring Boot + PostgreSQL, orquestado con Docker Compose.

---

## Tabla de contenidos

1. [Arquitectura](#arquitectura)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Requisitos previos](#requisitos-previos)
4. [Ejecución rápida](#ejecución-rápida)
5. [Ejecución paso a paso](#ejecución-paso-a-paso)
6. [Variables de entorno](#variables-de-entorno)
7. [API Reference](#api-reference)
8. [Decisiones técnicas](#decisiones-técnicas)
9. [Qué NO se hizo y por qué](#qué-no-se-hizo-y-por-qué)

---

## Arquitectura

```
                  ┌─────────────┐
     browser ────▶│  frontend   │  React + Vite  :3000
                  └──────┬──────┘
                         │ HTTP (fetch/React Query)
                  ┌──────▼──────┐
                  │   backend   │  Spring Boot   :8080
                  └──────┬──────┘
                         │ JDBC
                  ┌──────▼──────┐
                  │  postgres   │  PostgreSQL 16 :5432
                  └─────────────┘
```

Tres contenedores, una red Docker interna (`tenpay-net`).
El frontend habla solo con el backend; el backend habla solo con la base de datos.
Nadie llega directo a la base de datos desde fuera.

---

## Estructura del proyecto

```
springChallenge/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/tenpay/
│   │       │   ├── controller/    # HTTP layer, nada más
│   │       │   ├── service/       # Reglas de negocio
│   │       │   ├── repository/    # Acceso a datos (JPA)
│   │       │   ├── model/         # Entidades JPA
│   │       │   ├── dto/           # Contratos de entrada/salida
│   │       │   └── exception/     # Manejo global de errores
│   │       └── resources/
│   │           └── application.yml
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/   # UI pura, sin lógica de negocio
│   │   ├── hooks/        # Custom hooks (useTransactions, etc.)
│   │   ├── services/     # Llamadas HTTP centralizadas
│   │   └── pages/        # Vistas principales
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

La separación es intencional: si en 6 meses cambia el ORM, solo tocas `repository/`.
Si cambia la UI, no tocas una línea de backend.

---

## Requisitos previos

| Herramienta    | Versión mínima | Por qué               |
| -------------- | -------------- | --------------------- |
| Docker         | 24.x           | Motor de contenedores |
| Docker Compose | 2.x (plugin)   | Orquestación local    |

Nada más. No necesitas Java, Node ni PostgreSQL instalados en tu máquina.
Ese es el punto de Docker: el entorno viaja con el código.

Verificar que tienes lo necesario:

```bash
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

---

## Ejecución rápida

```bash
git clone <repo-url>
cd springChallenge
docker compose up --build
```

Cuando veas `Started TenpayApplication` en los logs, abre:

- Frontend: http://localhost:3000
- API: http://localhost:8080/transaction

Para bajar todo y limpiar volúmenes (base de datos incluida):

```bash
docker compose down -v
```

---

## Ejecución paso a paso

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd springChallenge
```

### 2. Revisar variables de entorno (opcional)

Las variables tienen defaults funcionales. Si quieres cambiar el puerto de la DB o la contraseña, edita `.env` antes de levantar.

### 3. Construir y levantar

```bash
docker compose up --build
```

El flag `--build` fuerza reconstrucción de las imágenes. Necesario la primera vez o tras cambios en código.

**¿Qué pasa internamente?**

1. Docker construye la imagen `postgres` (descarga si no existe, ~200 MB una sola vez).
2. Docker construye la imagen del backend:
   - Descarga dependencias Maven (cacheadas en una capa separada).
   - Compila el JAR.
3. Docker construye la imagen del frontend:
   - Instala dependencias npm.
   - Ejecuta `vite build` (producción) o `vite dev` (development, según el perfil).
4. `docker compose` levanta los tres contenedores en orden: primero `db`, luego `backend` (espera healthcheck de db), luego `frontend`.

### 4. Verificar que todo corre

```bash
docker compose ps
```

Deberías ver los tres servicios en estado `running` o `healthy`.

```bash
# Smoke test rápido del API
curl http://localhost:8080/transaction
# Respuesta esperada: [] o lista de transacciones
```

### 5. Logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend
```

### 6. Detener sin borrar datos

```bash
docker compose stop
# Los volúmenes de PostgreSQL persisten
docker compose start  # Vuelve a levantar
```

### 7. Reset completo

```bash
docker compose down -v
# -v elimina los volúmenes nombrados (datos de la DB)
# La próxima vez arranca con DB vacía
```

---

## Variables de entorno

Definidas en `docker-compose.yml` con valores por defecto razonables para desarrollo local.
Para producción usarías un vault o secrets manager, nunca estas variables en texto plano.

| Variable                | Default                            | Descripción                  |
| ----------------------- | ---------------------------------- | ---------------------------- |
| `POSTGRES_DB`           | `tenpay`                           | Nombre de la base de datos   |
| `POSTGRES_USER`         | `tenpay_user`                      | Usuario de PostgreSQL        |
| `POSTGRES_PASSWORD`     | `tenpay_pass`                      | Contraseña (solo para local) |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db:5432/tenpay` | URL JDBC interna             |
| `VITE_API_URL`          | `http://localhost:8080`            | Base URL que usa el frontend |

---

## API Reference

### `GET /transaction`

Retorna todas las transacciones ordenadas por fecha descendente.

**Response 200:**

```json
[
  {
    "id": 1,
    "amount": 15000,
    "merchant": "Supermercado Lider",
    "tenpistName": "Juan Pérez",
    "transactionDate": "2026-03-31T14:30:00"
  }
]
```

### `POST /transaction`

Crea una nueva transacción.

**Request body:**

```json
{
  "amount": 15000,
  "merchant": "Supermercado Lider",
  "tenpistName": "Juan Pérez",
  "transactionDate": "2026-03-31T14:30:00"
}
```

**Validaciones:**

- `amount` debe ser mayor a 0 (HTTP 400 si no)
- `transactionDate` no puede ser futura (HTTP 400 si no)
- Todos los campos son obligatorios

**Response 201:**

```json
{
  "id": 42,
  "amount": 15000,
  "merchant": "Supermercado Lider",
  "tenpistName": "Juan Pérez",
  "transactionDate": "2026-03-31T14:30:00"
}
```

**Error response (ejemplo 400):**

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "El monto debe ser mayor a 0",
  "timestamp": "2026-03-31T14:35:00"
}
```

---

## Decisiones técnicas

Esta sección explica el **por qué** de cada elección importante.
Las alternativas descartadas se listan con su razón.

---

### Backend: Spring Boot con arquitectura por capas (Controller → Service → Repository)

**La elección:**
Tres capas con responsabilidad única cada una.
El Controller solo traduce HTTP ↔ objetos Java.
El Service solo aplica reglas de negocio.
El Repository solo habla con la base de datos.

**Por qué no arquitectura hexagonal / ports & adapters:**
Para un CRUD de transacciones es sobrediseño.
Hexagonal tiene sentido cuando tienes múltiples adaptadores de entrada (HTTP, gRPC, colas) o múltiples fuentes de datos intercambiables.
Aquí hay uno de cada: HTTP y PostgreSQL.
Más capas = más archivos = más tiempo buscando dónde está una línea de código.

Linus Torvalds sobre código complejo: _"Bad programmers worry about the code. Good programmers worry about data structures."_
La estructura de datos (la transacción) es simple. El código debe serlo también.

**Ejemplo concreto de qué se evitó:**

```
// NO: arquitectura hexagonal para este caso
TransactionController
  → TransactionInputPort (interface)
    → TransactionUseCase (implementation)
      → TransactionOutputPort (interface)
        → TransactionJpaAdapter
          → TransactionJpaRepository
            → TransactionEntity

// SÍ: lo que se necesita
TransactionController → TransactionService → TransactionRepository
```

El segundo es legible por un humano en 5 segundos. El primero necesita un diagrama.

---

### Base de datos: PostgreSQL con Spring Data JPA

**La elección:**
JPA con repositorios declarativos. No se escribe SQL para queries simples; Spring lo genera.

**Por qué no JOOQ o queries nativas:**
JOOQ es excelente para queries complejas con muchos JOINs y funciones específicas de PostgreSQL.
Aquí el query más complejo es `ORDER BY transaction_date DESC`.
JPA lo maneja con `findAllByOrderByTransactionDateDesc()` sin una línea de SQL.

**Por qué no H2 en memoria:**
H2 para tests de integración tiene sentido, pero usarlo como base de datos principal esconde problemas reales:
el comportamiento de tipos de datos (especialmente `datetime` con timezone) difiere entre H2 y PostgreSQL.
Un test que pasa en H2 puede fallar en producción con PostgreSQL.
Con Docker, tener la misma PostgreSQL real en dev y prod elimina esa clase de sorpresas.

**Migración de esquema con Flyway vs `spring.jpa.hibernate.ddl-auto`:**
`ddl-auto=create` es tentador para arrancar rápido, pero destruye datos al reiniciar.
`ddl-auto=update` no registra historial de cambios ni garantiza idempotencia.
Flyway ejecuta scripts numerados (`V1__init.sql`, `V2__add_index.sql`) de manera ordenada y rastreable.
Si hay un bug en la migración, sabes exactamente qué script lo introdujo.

---

### Docker: multi-stage build para el backend

**La elección:**

```dockerfile
# Stage 1: compilar (imagen pesada con JDK + Maven)
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline          # capa cacheada
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: ejecutar (imagen liviana con solo JRE)
FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Por qué importa:**
La imagen final con solo JRE + JAR pesa ~180 MB.
Si usaras una sola imagen con JDK + Maven + código fuente pesaría ~600 MB.
Multiplicado por cada pull en CI/CD o en el servidor de producción, la diferencia es significativa.

**Por qué copiar `pom.xml` primero y luego el código fuente:**
Docker cachea capas. Si solo cambias código Java (no dependencias), la capa de `mvn dependency:go-offline` no se reconstruye.
En una máquina típica, bajar dependencias toma 2-3 minutos. Con la caché toma 0.

Sin optimización:

```
Cambio en un .java → rebuild completo → 4 minutos
```

Con optimización:

```
Cambio en un .java → usa caché de dependencias → 45 segundos
```

---

### Docker Compose: healthcheck y `depends_on`

**La elección:**

```yaml
services:
  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tenpay_user -d tenpay"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    depends_on:
      db:
        condition: service_healthy
```

**Por qué no solo `depends_on: db`:**
`depends_on` sin condición solo espera que el contenedor _arranque_, no que PostgreSQL esté _listo para recibir conexiones_.
PostgreSQL tarda entre 1 y 3 segundos en inicializar desde que el contenedor existe.
Si el backend intenta conectarse antes, falla con `Connection refused` y el contenedor muere.

Con `condition: service_healthy`, el backend espera hasta que `pg_isready` confirme que la base de datos acepta conexiones.
No hay race condition, no hay reintentos manuales.

**Ejemplo de lo que pasa sin healthcheck:**

```
db       | database system is starting up
backend  | HikariPool - Exception during pool initialization
backend  | Connection refused (Connection refused)
backend  | Application failed to start
```

Con healthcheck:

```
db       | database system is ready to accept connections
db       | Status: healthy
backend  | HikariPool - Start completed
backend  | Started TenpayApplication in 3.2 seconds
```

---

### Frontend: React Query (TanStack Query) para estado del servidor

**La elección:**
React Query separa el estado del servidor (transacciones en DB) del estado de UI (modal abierto, filtro activo).

**Por qué no useState + useEffect + fetch:**

```javascript
// El patrón clásico que todo el mundo escribe y luego lamenta:
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch("/transaction")
    .then((r) => r.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

Problemas: sin cache, sin revalidación automática, sin deduplicación de requests,
sin invalidación al crear una transacción nueva, manejo de error manual.

```javascript
// Con React Query:
const { data, isLoading, isError } = useQuery({
  queryKey: ["transactions"],
  queryFn: () => fetch("/transaction").then((r) => r.json()),
});
```

Cache automático, revalidación en foco de ventana, estados de loading/error incluidos.
Cuando se crea una transacción: `queryClient.invalidateQueries(['transactions'])` y la lista se actualiza sola.

**Por qué no Redux:**
Redux es para estado global de aplicación compleja (usuario autenticado, carrito de compras con múltiples vistas).
Una lista de transacciones no es estado global de UI: es datos del servidor.
Mezclarlos en Redux añade boilerplate sin beneficio:
actions, reducers, selectors, y encima hay que manejar loading/error manualmente.

---

### Manejo de errores: `@ControllerAdvice` global

**La elección:**
Un solo handler para todos los errores HTTP de la aplicación.

**Por qué no try/catch en cada controller:**

```java
// NO: try/catch en cada endpoint
@PostMapping
public ResponseEntity<?> create(@RequestBody TransactionDto dto) {
  try {
    return ResponseEntity.status(201).body(service.create(dto));
  } catch (ValidationException e) {
    return ResponseEntity.badRequest().body(e.getMessage());
  } catch (Exception e) {
    return ResponseEntity.internalServerError().body("Error");
  }
}
```

Si tienes 5 endpoints, ese bloque se repite 5 veces.
Cuando el formato del error cambia, tocas 5 lugares.

```java
// SÍ: handler global
@ControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ValidationException.class)r
  public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
    return ResponseEntity.badRequest().body(new ErrorResponse(400, e.getMessage()));
  }
}
```

Un lugar, formato consistente, fácil de extender.

---

## Qué NO se hizo y por qué

| Lo que se omitió                 | Por qué                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autenticación JWT                | No está en los requerimientos. Añadirlo sin pedirlo es ruido.                                                                                         |
| Caché con Redis                  | Las transacciones son datos transaccionales; siempre deben ser frescos. Redis añadiría complejidad de invalidación sin beneficio real aquí.           |
| Mensaje de cola (Kafka/RabbitMQ) | No hay productor/consumidor asíncrono en los requerimientos.                                                                                          |
| Kubernetes / Helm                | Docker Compose es suficiente para desarrollo local. K8s para un ambiente de una persona es sobrediseño.                                               |
| Testing e2e con Cypress          | Valorado pero fuera de scope del tiempo disponible. Los tests unitarios de servicio y los de componentes con React Testing Library cubren lo crítico. |

---

> "Simplicity is the ultimate sophistication." — el dicho aplica al código igual que al diseño.
> Si necesitas un diagrama para explicar tu código, el problema está en el código, no en el diagrama.
