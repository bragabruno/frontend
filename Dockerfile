FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --output-path=./dist/out

# Production stage with nginx
FROM nginx:alpine
COPY --from=builder /app/dist/out/ /usr/share/nginx/html
COPY proxy.conf.json /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]