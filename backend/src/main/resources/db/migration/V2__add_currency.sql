-- V2: agrega campo currency a transactions
--
-- DEFAULT 'CLP' para no romper registros existentes.
-- El constraint CHECK garantiza que solo entran los valores conocidos;
-- si en el futuro se agrega una moneda nueva se crea V3 con ALTER.

ALTER TABLE transactions
    ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'CLP'
        CHECK (currency IN ('CLP', 'COP', 'USD', 'EUR'));
