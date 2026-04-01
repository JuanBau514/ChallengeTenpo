-- V4: convertir transactions.id de SERIAL a UUID + agregar user_id
--
-- Por qué cambiar SERIAL a UUID:
--   Con SERIAL, GET /transaction/1 confirma que existe una transacción con id=1.
--   Con UUID, el id no revela volumen ni orden de creación.
--
-- Por qué user_id es NULLABLE aquí (y no NOT NULL):
--   Flyway ejecuta estas migraciones antes de que el contexto Spring arranque.
--   El usuario por defecto (jbautistaclavijo@gmail.com) lo crea DataInitializer,
--   un @ApplicationRunner que corre DESPUÉS de Flyway.
--   Si pusieramos NOT NULL aquí, no habría forma de asignar las transacciones
--   existentes a ese usuario. DataInitializer hace el UPDATE y la FK queda poblada.
--   En producción limpia (sin datos previos), todas las transacciones nuevas
--   reciben user_id desde el backend, no desde aquí.

-- Paso 1: agregar columna UUID nueva (gen_random_uuid() asigna UUID a filas existentes)
ALTER TABLE transactions ADD COLUMN new_id UUID DEFAULT gen_random_uuid() NOT NULL;

-- Paso 2: quitar la PK del id SERIAL
ALTER TABLE transactions DROP CONSTRAINT transactions_pkey;

-- Paso 3: quitar la columna SERIAL (también elimina la secuencia asociada)
ALTER TABLE transactions DROP COLUMN id;

-- Paso 4: renombrar y declarar PK
ALTER TABLE transactions RENAME COLUMN new_id TO id;
ALTER TABLE transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

-- Paso 5: agregar FK a users (nullable, ver nota arriba)
ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES users(id);

-- Recrear índice de fecha (el anterior fue implícitamente eliminado con el DROP COLUMN)
DROP INDEX IF EXISTS idx_transactions_date;
CREATE INDEX idx_transactions_date ON transactions (transaction_date DESC);
