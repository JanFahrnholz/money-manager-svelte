FROM node:18 AS build

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM nginx:1.18-alpine AS deploy
WORKDIR /usr/share/nginx/html
#RUN rm -rf ./*
COPY --from=build /app/www .
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
