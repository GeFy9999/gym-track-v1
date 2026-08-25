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
# Strip CR in case the build context came from a CRLF checkout, then parse the
# script so a malformed entrypoint fails the BUILD instead of surfacing at
# container start as an unhelpful "no such file or directory".
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh \
 && sh -n /usr/local/bin/docker-entrypoint.sh

# ENTRYPOINT rather than CMD: a `command:` in compose then becomes arguments to
# the entrypoint instead of replacing it, so migrations always run first.
# Invoking /bin/sh explicitly means the runtime never resolves the shebang or
# the exec bit, so neither can break container start.
ENTRYPOINT ["/bin/sh", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
