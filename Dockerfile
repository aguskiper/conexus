# Prueba de Next.js nativo en Dokploy (rama aislada).
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --include=dev --include=optional --no-audit --no-fund
COPY . .
RUN ./node_modules/.bin/next build
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
