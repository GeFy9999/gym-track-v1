FROM node:20-alpine
WORKDIR /app

# python3/make/g++ are needed to build the better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Default DB location; /app/data is expected to be a mounted volume so the
# SQLite file survives redeploys. Override DATABASE_URL to move it.
ENV DATABASE_URL="file:/app/data/dev.db"
VOLUME ["/app/data"]

RUN chmod +x docker-entrypoint.sh

# ENTRYPOINT rather than CMD: a `command:` in compose then becomes arguments to
# the entrypoint instead of replacing it, so migrations always run first.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
