-- V3: sistema de usuarios
--
-- Decisión UUID como PK:
--   UUID v4 generado por PostgreSQL (gen_random_uuid()) impide enumeración
--   secuencial. Con SERIAL un atacante sabe que el usuario 1 existe;
--   con UUID no puede adivinar ni iterar IDs válidos.
--
-- Decisión sin columna "salt" separada:
--   BCrypt embebe el salt dentro del hash ($2a$10$[22-char-salt][31-char-hash]).
--   No se necesita columna adicional; el salt se puede extraer del hash si fuera
--   necesario reverificar con otra librería.

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índice en email: toda autenticación busca por email.
-- Sin índice, cada login hace full scan sobre la tabla de usuarios.
CREATE INDEX idx_users_email ON users (email);

-- Tokens de reset de password
--
-- Decisión de guardar el hash SHA-256 del token (no el token en claro):
--   Si la DB se compromete, el atacante no puede usar los tokens directamente.
--   El token real viaja al usuario por email; en DB solo su huella SHA-256.
--
-- expires_at: ventana de 24 horas. Después del límite, el token no sirve
--   aunque no haya sido usado.
-- used: flag para single-use. Una vez consumido, no puede usarse de nuevo
--   incluso si no expiró.

CREATE TABLE password_reset_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE
);
