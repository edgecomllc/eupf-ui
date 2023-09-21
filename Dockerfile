FROM node:18.17.1-alpine AS builder
ENV NODE_ENV production
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.24.0-alpine AS production
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80