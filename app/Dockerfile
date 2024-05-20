FROM node:18 AS build

WORKDIR /app
COPY . .
RUN npm ci

ENTRYPOINT [ "npm", "run", "dev" ]