# @repo/sanity-check

Standalone Puppeteer sanity check for the web app. Assumes **web** and **API** (and, on local env with nginx, **nginx**) are already running.

## What it does

1. Opens the app in a headless browser
2. Waits for the example page to load and for data from the API
3. Asserts the expected message ("Hello from getExample") is shown
4. Clicks the Refresh button and re-asserts the message

## Prerequisites

- Web app and API must be running (e.g. `pnpm run dev` from repo root, or nginx + apps when using nginx)

## Usage

From repo root:

```bash
pnpm run sanity
```

From this package:

```bash
pnpm run sanity
```

## Environment

| Variable         | Default                 | Description                                                     |
| ---------------- | ----------------------- | --------------------------------------------------------------- |
| `SANITY_APP_URL` | `http://localhost:3000` | App URL (direct dev). With nginx use `http://app.local-dev.com` |
| `HEADLESS`       | `true`                  | Set to `false` to see the browser window                        |

## Local without nginx

1. Start apps: `pnpm run dev` (web on 3000, API on 3001)
2. Run: `pnpm run sanity`

## Local with nginx

1. Add to `/etc/hosts`: `127.0.0.1 api.local-dev.com app.local-dev.com`
2. Start nginx: `pnpm run nginx:start`
3. Start apps: `pnpm run dev`
4. Run: `SANITY_APP_URL=http://app.local-dev.com pnpm run sanity`
