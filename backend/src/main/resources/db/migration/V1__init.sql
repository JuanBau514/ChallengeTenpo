-- V1: esquema inicial de transacciones
--
-- Se usa SERIAL (autoincremento) para el id en lugar de UUID porque:
-- el requerimiento especifica id como int, y SERIAL es la forma idiomática
-- de entero autoincremental en PostgreSQL.
--
-- transaction_date usa TIMESTAMP WITHOUT TIME ZONE porque las fechas
-- se guardan en la zona horaria del servidor (UTC en producción).
-- Si el negocio operara en múltiples zonas horarias usaríamos TIMESTAMPTZ.

CREATE TABLE transactions (
    id               SERIAL PRIMARY KEY,
    amount           INTEGER      NOT NULL CHECK (amount > 0),
    merchant         VARCHAR(255) NOT NULL,
    tenpist_name     VARCHAR(255) NOT NULL,
    transaction_date TIMESTAMP    NOT NULL
);

-- Índice para acelerar ORDER BY transaction_date DESC en el GET /transaction.
-- Sin este índice, cada consulta hace un full scan + sort.
-- Con él, PostgreSQL recorre el índice en orden inverso directamente.
CREATE INDEX idx_transactions_date ON transactions (transaction_date DESC);
