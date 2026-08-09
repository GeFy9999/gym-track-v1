FROM node:20-alpine
WORKDIR /app

# python3/make/g++ are needed to build the better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
