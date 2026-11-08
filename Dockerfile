FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache bash curl postgresql-client

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
