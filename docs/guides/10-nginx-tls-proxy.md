# Supporting TLS with nginx as a TLS termination

While prism doesn't natively support TLS, it can be provided by using a TLS termination layer. This example uses `docker compose` and `nginx` to support accessing prism via TLS.

If you don't already have a self-signed certificate and configuration for nginx, there is [an excellent post](https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-16-04) by Digital Ocean that may help. The examples below used the steps outlined to create the configuration and certificates, but the steps have been abbreviated.

The below files assume the following folder structure:

```
📦cool-website
 ┣ 📂 nginx
 ┃ ┗ 📜 default.conf
 ┃ 📂 tls
 ┃ ┗ 📜 dhparam.pem
 ┃ ┗ 📜 tls-proxy.crt
 ┃ ┗ 📜 tls-proxy.key
 ┣ 📜 .gitignore
 ┣ 📜 api.oas3.yml
 ┗ 📜 docker-compose.yml
```

Extending the basic `docker-compose.yml` from the installation guide to include nginx and a simple network:

```yaml
---
# ./docker-compose.yml
version: '3.9'
services:
  prism:
    image: stoplight/prism:5
    command: 'mock -h 0.0.0.0 /tmp/api.oas3.yml'
    volumes:
      - ./api.oas3.yml:/tmp/api.oas3.yml:ro
    networks:
      - prism
    expose:
      - '4010'
  nginx-tls-proxy:
    image: nginx:mainline
    volumes:
      # Override default config to act as TLS proxy
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      # Self-signed certificates etc in here
      - ./tls:/etc/tls:ro
    depends_on:
      - prism
    networks:
      - prism
    ports:
      - '443:443'
networks:
  prism:
```

```nginx
# ./nginx/default.conf
upstream prism {
  server prism:4010;
}

server {
  listen 443 ssl default_server;
  server_name _;
  ssl_protocols TLSv1.3 TLSv1.2;

  ssl_certificate /etc/tls/tls-proxy.crt;
  ssl_certificate_key /etc/tls/tls-proxy.key;

  ssl_prefer_server_ciphers on;
  ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
  ssl_ecdh_curve secp384r1;
  ssl_session_cache shared:SSL:10m;
  ssl_session_tickets off;
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 8.8.8.8 8.8.4.4 valid=300s;
  resolver_timeout 5s;

  ssl_dhparam /etc/tls/dhparam.pem;

  set $trace_id $connection-$connection_requests-$msec;

  location / {
    # And now pass all traffic back to prism...
    proxy_pass http://prism;
    # And pass any additional headers you wish (in this example, a correlation ID).
    proxy_set_header X-Request-Id $trace_id;
  }
}
```

This should set up a minimal TLS termination layer which proxies all requests on port 443 back to prism. You may wish to extend the example to allow for switching HTTP requests over to HTTPS by redirecting them, or use a `.env` file and environmental variables to control file and ports.
