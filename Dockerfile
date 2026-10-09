# Prueba del servidor de producción de Vinext en VPS.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV WRANGLER_SEND_METRICS=false
COPY package*.json ./
RUN npm ci --include=dev --include=optional --no-audit --no-fund
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["./node_modules/.bin/vinext", "start", "--host", "0.0.0.0", "--port", "3000"]
