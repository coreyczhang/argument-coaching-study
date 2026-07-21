# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## AI Demo

This branch includes a same-device demo route for in-game AI feedback at `/demo`.

To run it locally from the repo:

1. Start the backend agent service from `point-taken-backend/agent`:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

2. Start the frontend from `point-taken-frontend/app`:

```bash
rm -rf .output .nuxt
npm run dev
```

3. Open `http://localhost:3000/demo`

Notes:
- The demo uses the live four-agent pipeline when the backend agent service is available.
- If the live call is slow or fails, the demo falls back to local backup feedback so the flow stays usable.
- The backend agent service expects a valid `GEMINI_API_KEY` in `point-taken-backend/agent/.env`.
