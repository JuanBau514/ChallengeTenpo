# --- Stage 1: compilar ---
# Imagen pesada (JDK + Maven) que solo existe durante el build, no en la imagen final.
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copiar pom.xml primero y bajar dependencias.
# Docker cachea esta capa; si solo cambia código Java (no el pom),
# el siguiente build reutiliza la caché y ahorra 2-3 minutos.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copiar el código fuente y compilar.
# -DskipTests: los tests se corren en CI, no en cada build de imagen.
COPY src ./src
RUN mvn package -DskipTests -q

# --- Stage 2: ejecutar ---
# Imagen liviana con solo JRE (sin compilador, sin Maven, sin código fuente).
# Resultado: ~180 MB en vez de ~600 MB.
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Usuario no-root: buena práctica de seguridad.
# Si la app se compromete, el atacante no tiene permisos de root en el contenedor.
RUN addgroup -S tenpay && adduser -S tenpay -G tenpay
USER tenpay

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
