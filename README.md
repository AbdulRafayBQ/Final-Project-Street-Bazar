# Street Bazar

**A modern, full-stack marketplace for local sellers and online buyers**

| Student | Student ID |
| --- | --- |
| **Abdul Rafay** | **352173** |

Street Bazar is a responsive e-commerce marketplace designed to help local
business owners create stores, publish products, manage inventory, and reach
customers online. Buyers can discover stores, browse products, save items,
place orders, follow sellers, and track their purchases.

The project uses a lightweight vanilla HTML, CSS, and JavaScript frontend,
Vercel serverless APIs, Supabase authentication and database services, and
secure server-side AI integrations.

## Project Highlights

- Responsive marketplace experience for desktop, tablet, and mobile
- Store discovery, product browsing, categories, search, and animated sales
- Customer accounts with email/password authentication
- Google sign-in for both sign-in and account creation
- Email OTP verification and forgot-password recovery
- Seller store creation, branding, product publishing, and dashboard tools
- Separate store inventory and private warehouse inventory
- Stock quantities, SKUs, product images, and inventory movement
- Cart, saved products, checkout, orders, reviews, follows, and messaging
- Admin tools for managing stores and marketplace content
- AI-assisted product listing and customer assistance
- AI-generated product customization images through a server-side proxy
- Shared Supabase data across devices instead of device-only demo data
- Secure environment-variable handling for API and service keys

## Technology Stack

### Frontend

- HTML5
- CSS3 with responsive layouts and custom themes
- Modern JavaScript ES modules
- Hash-based client-side routing
- No React and no Vite runtime dependency

### Backend and Services

- Vercel serverless functions
- Supabase Auth
- Supabase PostgreSQL
- Supabase REST API
- Google OAuth
- Configurable AI and image-generation providers

## Application Architecture

```text
Browser
  |
  |-- Static HTML, CSS, and JavaScript
  |
  |-- /api/auth  ------ Supabase Auth and Google OAuth
  |-- /api/data  ------ Supabase marketplace data synchronization
  |-- /api/ai    ------ Server-side AI text requests
  |-- /api/image ------ Server-side image generation requests
  |
Supabase
  |-- Authentication users
  |-- Profiles and marketplace tables
  |-- Orders, products, stores, and inventory
  |-- Shared application state
```

Secret keys are never placed in frontend source code. Browser requests go
through the Vercel API layer, where environment variables are read securely.

## Main User Areas

### Customers

- Explore products and stores
- View product details, discounts, and stock status
- Add products to the cart and save products for later
- Place and track orders
- Follow stores and write reviews
- Chat about products
- Sign in with email/password or Google

### Store Owners

- Create and customize a store
- Add store products with images, prices, stock, and categories
- Manage public store inventory
- Maintain private warehouse inventory
- Move warehouse items into store inventory before publishing
- View orders and store performance
- Delete their own store after password verification

### Administrators

- Review and manage stores
- Delete stores directly when required
- Manage marketplace-level content and moderation workflows

## Repository Structure

```text
.
├── api/                    # Vercel serverless API functions
│   ├── ai.js               # Secure AI text proxy
│   ├── auth.js             # Email, OTP, and Google authentication
│   ├── data.js             # Supabase data synchronization
│   └── image.js            # Secure image-generation proxy
├── assets/
│   ├── js/                 # Application modules and page controllers
│   ├── images/             # Product, banner, and logo assets
│   ├── styles.css          # Main application styles
│   └── theme.css           # Theme variables
├── public/                 # Static files copied to the production build
├── scripts/
│   ├── build.mjs          # Copies the app into dist/
│   └── serve.mjs          # Local development server
├── supabase/
│   └── schema.sql          # Database schema
├── index.html              # Application entry point
├── vercel.json             # Vercel build and rewrite configuration
└── .env.example            # Environment-variable template
```

## Local Setup

### Requirements

- Node.js 18 or newer
- A Supabase project
- A Vercel account for production deployment

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:4173` in a browser.

### Create a production build

```bash
npm run build
```

The build output is generated in the `dist/` directory.

## Environment Variables

Copy `.env.example` to `.env` for local serverless development, or add the
same variables in **Vercel → Project Settings → Environment Variables**.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

AI_API_KEY=your-ai-provider-key
AI_BASE_URL=https://generativelanguage.googleapis.com
AI_MODEL=gemini-3.5-flash-lite

IMAGE_API_KEY=your-image-provider-key
IMAGE_MODEL=gpt-image-1

ADMIN_EMAILS=admin@example.com
```

### Security rules

- Never commit `.env` or real API keys.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Use Vercel environment variables for production secrets.
- Use the publishable/anon key only where a public Supabase key is required.
- Rotate keys immediately if they are accidentally exposed.

## Supabase Configuration

1. Create a Supabase project.
2. Copy the project URL and API keys into Vercel environment variables.
3. Open **Supabase → SQL Editor**.
4. Run [`supabase/schema.sql`](./supabase/schema.sql).
5. Enable Email authentication under **Authentication → Providers**.
6. Enable Google authentication and add the Google client ID and secret.
7. Set the Supabase site URL to:

   ```text
   https://street-bazar.vercel.app
   ```

8. Add this redirect URL in Supabase:

   ```text
   https://street-bazar.vercel.app/
   ```

9. Add this callback URL in Google Cloud OAuth credentials:

   ```text
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

The exact `your-project-ref` value is available in the Supabase project URL.

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Keep the framework preset as **Other** or **None**.
3. Vercel will use the build command from `vercel.json`:

   ```bash
   node scripts/build.mjs
   ```

4. Set the output directory to `dist`.
5. Add all required environment variables.
6. Deploy the project.
7. After changing environment variables, redeploy the project.

The Vercel configuration rewrites application routes to `index.html` so that
hash-based navigation works correctly on every device.

## AI Integrations

AI requests are sent through `/api/ai` and image requests through
`/api/image`. This keeps provider keys out of the browser and allows the
provider, model, and base URL to be changed through environment variables.

The application supports common OpenAI-compatible providers, Google Gemini,
Anthropic-compatible text workflows, and configurable image providers. Image
generation creates a new product image from the customization prompt; it does
not guarantee pixel-level editing of the original product photo.

Provider availability, model support, quotas, and billing are controlled by
the selected provider and its current API policies.

## Data and Authentication Flow

1. A user signs up or signs in through the application.
2. The Vercel authentication function communicates with Supabase Auth.
3. The authenticated profile is stored in the application users table.
4. Marketplace changes are synchronized through `/api/data`.
5. Supabase provides the shared source of truth across browsers and devices.
6. Frontend state is cached locally for a fast interface, then synchronized
   with the remote database.

Google authentication uses the OAuth PKCE flow. The browser creates a
temporary verifier, Google returns an authorization code, and the Vercel API
exchanges that code with Supabase before creating the application session.

## Testing Checklist

Before presenting or deploying the project, verify:

- The homepage and sales carousel load on desktop and mobile.
- Store and product data are identical on different devices.
- A new email account can be created and verified.
- Existing emails receive a clear duplicate-account message.
- Forgot-password OTP reveals the new-password form only after verification.
- Google sign-in creates a logged-in Street Bazar session.
- Store owners can publish products from store inventory.
- Private warehouse items remain private until moved to store inventory.
- Customers can add products to cart and place orders.
- Stock decreases after a successful order.
- Admins can manage and delete stores.
- AI requests work with valid provider environment variables.

## Available Commands

| Command | Description |
| --- | --- |
| `npm install` | Install project dependencies |
| `npm run dev` | Start the local development server |
| `npm run build` | Generate the production `dist/` directory |

## Project Information

**Project:** Street Bazar
**Developer:** Abdul Rafay
**Student ID:** 352173
**Repository:** [Final-Project-Street-Bazar](https://github.com/AbdulRafayBQ/Final-Project-Street-Bazar)

## License

This project was created as an academic and portfolio project by Abdul Rafay.
