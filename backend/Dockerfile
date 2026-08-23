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

# Kept outside /app and referenced absolutely: a relative "./docker-entrypoint.sh"
# is resolved against whatever cwd the runtime hands us, and a volume mounted over
# /app would hide it entirely — either one fails as "no such file or directory".
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# ENTRYPOINT rather than CMD: a `command:` in compose then becomes arguments to
# the entrypoint instead of replacing it, so migrations always run first.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
