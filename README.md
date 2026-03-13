# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

install node 
(https://nodejs.org/en/download)

## 🛠️ Environment Setup & Database Connection

This project uses **Supabase** as the backend database. Follow the steps below to configure your environment and establish a connection.

### 1. Create Environment File
Create a `.env` file in the root directory of your project to store your sensitive credentials.

```bash
touch .env

2. Configure Credentials
Add your Supabase URL and Public Anon Key to the .env file. You can find these in your Supabase Dashboard under Project Settings > API.
# .env
SUPABASE_URL="https://your-project-url.supabase.co"
SUPABASE_ANON_KEY="your-public-anon-key"

        
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
