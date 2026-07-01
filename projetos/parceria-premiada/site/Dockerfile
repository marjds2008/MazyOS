FROM nginxinc/nginx-unprivileged:alpine

COPY . /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080
