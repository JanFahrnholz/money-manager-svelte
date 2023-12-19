FROM node:18 AS dev

WORKDIR /api
COPY . .
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]
