# Six Path Studio Store

## About the Project

The Six Path Studio Store provides a platform for purchasing in-game currency and upgrades for Six Path Studio's mobile games. This web application allows users to buy coins for games like L.T AHMED using Solana cryptocurrency.

## Key Features

- Purchase in-game coins and upgrades for Six Path Studio's mobile games
- Multiple Solana payment options:
  - Direct wallet connection (Phantom, Solflare)
  - QR code scanning for mobile wallets
- Secure transaction processing and verification
- User account integration with game profiles
- Mobile-friendly interface with Sixpath's signature design

## Tech Stack

This project is built with:

- React with TypeScript
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Shadcn UI component library
- Solana blockchain integration:
  - @solana/web3.js
  - @solana/wallet-adapter
  - @solana/pay
- Supabase for backend database services

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Solana wallet (Phantom or Solflare recommended)

### Local Development

```sh
# Step 1: Clone the repository
git clone <REPOSITORY_URL>

# Step 2: Navigate to the project directory
cd web-wave-front

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

## Deployment

The project can be deployed to any hosting platform that supports static site hosting, such as:

- Vercel
- Netlify
- GitHub Pages
- AWS Amplify

### Custom Domain Setup

To connect a custom domain to the project:

1. Configure your domain's DNS settings to point to your hosting provider
2. Set up SSL certificates for secure browsing
3. Add the domain in your hosting provider's settings

## Development Workflow

Changes to this project can be made in several ways:

1. **Using your preferred IDE**: Clone the repository and push changes as you normally would.

2. **Directly in GitHub**: Edit files through the GitHub interface.

3. **Using GitHub Codespaces**: Launch a Codespace for a cloud-based development environment.

## Building for Production

```sh
# Build the project for production
npm run build

# Preview the production build locally
npm run preview
```

## Support

For issues related to the Six Path Studio Store, please contact the development team through our official channels or create an issue in the repository.
