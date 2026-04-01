# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL se inyecta en build time para que Vite lo embeba en el bundle.
# Railway pasa las env vars como build args automáticamente.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production stage
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

# El template permite que nginx use $PORT en runtime (Railway lo inyecta).
# En Docker Compose local PORT no está definido, así que el CMD usa 80 como default.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["sh", "-c", "PORT=${PORT:-80} envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
