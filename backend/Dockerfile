FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
RUN chmod +x docker/dev-entrypoint.sh
RUN printf '#!/bin/sh\nset -eu\nsed -i "s/\\r$//" /app/docker/dev-entrypoint.sh || true\nexec "$@"\n' > /usr/local/bin/entrypoint-wrapper.sh && chmod +x /usr/local/bin/entrypoint-wrapper.sh
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint-wrapper.sh"]
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
RUN npm install --omit=dev
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
