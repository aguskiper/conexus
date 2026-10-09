# Prueba de compatibilidad en VPS. NO es una configuración final de producción.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV WRANGLER_SEND_METRICS=false
COPY package*.json ./
RUN npm ci --include=dev --include=optional --no-audit --no-fund
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js", "dev", "--config", "dist/server/wrangler.json", "--local", "--persist-to", ".wrangler/state", "--ip", "0.0.0.0", "--port", "3000", "--inspector-port", "0"]
