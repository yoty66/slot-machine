# Local nginx

Use this config to run the API and web app behind nginx on `api.local-dev.com` and `app.local-dev.com`.

## Prerequisites

- nginx installed (e.g. `brew install nginx` on macOS)
- Ports 80, 3000, 3001 free

## Setup

1. **Hosts** – add to `/etc/hosts`:

   ```
   127.0.0.1 api.local-dev.com app.local-dev.com
   ```

2. **Ports** – apps must listen on:
   - **Web**: `3000`
   - **API (Hono)**: `3001`

## Usage

From repo root:

```bash
# Start nginx with this config (uses absolute path to this dir)
pnpm run nginx:start

# Stop nginx (macOS Homebrew)
pnpm run nginx:stop
```

Then start the apps (e.g. `pnpm run dev` in another terminal) and open:

- **API**: http://api.local-dev.com/api/example
- **Web**: http://app.local-dev.com

## Config path

- **Config file**: `nginx/ngnix_local.conf`
- **Logs**: `/tmp/nginx_*.log` (error + access for main, api, web)
- **mime.types**: `include` uses `/usr/local/etc/nginx/mime.types` (Homebrew). On Linux you may need to change this to `/etc/nginx/mime.types`.
