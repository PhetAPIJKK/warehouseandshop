# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

install node 
(https://nodejs.org/en/download)

Environment Setup and Database Connection
To ensure the security of your credentials and a seamless connection to Supabase, follow these steps to configure your environment variables.
1. Create an Environment File
Create a file named .env in the root directory of your project. This file will store your sensitive API keys and should never be committed to version control.
bash
# In your terminal
touch .env
Use code with caution.

2. Configure Supabase Credentials
Add your Supabase project credentials to the .env file using the following format:
env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
Use code with caution.

Note: You can find these values in your Supabase dashboard under Settings > API.
3. Connect to the Database
Use the official Supabase client library to initialize the connection in your application.
For JavaScript/TypeScript:
javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
Use code with caution.

Security Best Practice
Ensure that your .env file is ignored by Git to prevent leaking your tokens. Add the following line to your .gitignore file:
text
.env
Use code with caution.

Would you like me to add a section for Python or include instructions on how to retrieve these keys from the Supabase dashboard?


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
