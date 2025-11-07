# Deployment Guide

This guide covers how to run the Study Group Finder application in production using Docker, Nginx, and Let's Encrypt. It also documents runtime configuration, monitoring, and data protection best practices.

## 1. Build and Run the API Container

1. Copy the repository to your deployment host.
2. Create a production `.env` file in `server/.env` (or provide the variables at runtime) using the configuration reference below.
3. Build the image:
   ```bash
   docker build -t study-group-finder-api .
   ```
4. Run the container, mounting any persistent storage you need for logs or assets and injecting the environment variables:
   ```bash
   docker run -d \
     --name study-group-finder-api \
     --env-file server/.env \
     --restart unless-stopped \
     -p 3001:3001 \
     study-group-finder-api
   ```

### Runtime Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Set to `production` when running behind Nginx. | `development` |
| `PORT` | Internal API port. The Dockerfile exposes `3001`. | `3001` |
| `MONGODB_URI` | Connection string for MongoDB. | `mongodb://localhost:27017/study-group-finder` |
| `REDIS_URL` | Optional Redis connection URL for stats caching. | unset |
| `CLIENT_ORIGINS` | Comma-separated list of allowed browser origins (e.g. `https://app.example.com`). Required when `NODE_ENV=production`. | `http://localhost:3000` in non-production |
| `AUTH_COOKIE_NAME` | Name of the authentication cookie. | `sgf_session` |
| `AUTH_COOKIE_MAX_AGE_MS` | Cookie lifetime in milliseconds. | `604800000` (7 days) |
| `JWT_SECRET` | Secret used to sign JWTs. **Must be overridden in production.** | `development-secret-change-me` |
| `JWT_EXPIRES_IN` | JWT expiry duration string. | `7d` |
| `BCRYPT_SALT_ROUNDS` | Work factor used for password hashing. | `12` |
| `RATE_LIMIT_MAX` | Maximum requests per window per IP. | `100` |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate-limit window size in minutes. | `15` |
| `TRUST_PROXY` | Express `trust proxy` setting. Defaults to `true` in production. | auto |
| `STATIC_ASSETS_PATH` | Override the path served for static assets when needed. | `<repo>/client` |

## 2. Configure Nginx with Let's Encrypt

1. Install Nginx and Certbot on the host (for example, on Ubuntu `apt install nginx certbot python3-certbot-nginx`).
2. Copy `deploy/nginx/study-group-finder.conf` to `/etc/nginx/sites-available/study-group-finder.conf` and replace `your-domain.example` with your real domain name(s).
3. Create the directory Nginx uses for HTTP-01 challenges:
   ```bash
   sudo mkdir -p /var/www/certbot
   sudo chown www-data:www-data /var/www/certbot
   ```
4. Enable the site and test the configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/study-group-finder.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   ```
5. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```
6. Request certificates with Certbot:
   ```bash
   sudo certbot certonly --nginx -d your-domain.example -d www.your-domain.example
   ```
   Certbot installs the recommended TLS options and Diffie-Hellman parameters referenced in the configuration file.
7. Restart Nginx once more to pick up the certificates:
   ```bash
   sudo systemctl reload nginx
   ```

The provided Nginx configuration proxies HTTPS traffic to the API container, forwards the real client IP addresses, upgrades WebSocket requests automatically, and enforces HSTS.

## 3. Scheduled Certificate Renewal

Certbot installs a systemd timer for automatic renewals. Verify it is active with:
```bash
sudo systemctl list-timers | grep certbot
```
Certificates renew automatically; Nginx reloads are handled by Certbot's deploy hooks.

## 4. Monitoring and Alerting

* **Container health** – Enable Docker's restart policy (see `docker run` command) and monitor the container with `docker ps --format '{{.Names}}{{.Status}}'`.
* **Application metrics** – Use the `/health` endpoint for uptime checks (for example, with Uptime Kuma, Pingdom, or CloudWatch Synthetics).
* **Logs** – Forward container logs to a centralized system such as CloudWatch Logs, ELK/Opensearch, or Grafana Loki. Tail locally with `docker logs -f study-group-finder-api`.
* **Resource usage** – Track CPU, memory, and disk via `docker stats` or system-level tools like `Prometheus` + `node_exporter`.

## 5. Backup Strategy

* **MongoDB** – Use `mongodump` to create regular backups. Example cron entry:
  ```cron
  0 2 * * * mongodump --uri="${MONGODB_URI}" --out=/backups/study-group-finder-$(date +\%F)
  ```
  Sync the backup directory to durable storage (S3, GCS, etc.) and prune old snapshots.
* **Redis (optional)** – If Redis is enabled, configure `appendonly yes` and snapshotting (`save` directives), then copy the `appendonly.aof`/`dump.rdb` files to backup storage.
* **Configuration** – Commit updates to infrastructure code (Dockerfile, Nginx config, `.env` templates) to version control and keep encrypted copies of `.env` files in a secrets manager.

## 6. Disaster Recovery Checklist

1. Provision a new host with Docker, Nginx, and Certbot.
2. Restore the `.env` secrets from your password manager or secrets vault.
3. Restore MongoDB from the most recent backup using `mongorestore`.
4. Redeploy the API container using the restored `.env` file.
5. Reapply the Nginx configuration and request/renew TLS certificates.
6. Validate functionality via `/health`, login flows, and group creation workflows.

Keeping this document up to date alongside changes to the application or infrastructure ensures rapid, repeatable recoveries.
