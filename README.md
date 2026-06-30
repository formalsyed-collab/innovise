# Innovise Website Project

This repository serves as a unified workspace for both the static landing page and the client portal application.

## Directory Structure

```text
innovise-website/
├── landing/         # Static HTML landing page files
│   ├── index.html   # Main homepage (including mobile login tweaks)
│   ├── robots.txt   # Search engine crawl settings
│   ├── sitemap.xml  # GSC indexing sitemap
│   └── logo.png     # Site branding logo
└── portal/          # Node.js / Next.js client portal app
    ├── src/         # Next.js app source code
    ├── public/      # Public static assets for the portal
    ├── package.json # Project configuration and dependencies
    └── server.js    # Custom server configuration
```

## Getting Started

### 1. Static Landing Page (`/landing`)
The landing page consists of static HTML/CSS files. You can serve them using any local server.
* To run the server we configured for you:
  ```bash
  # Go to the landing directory
  cd landing
  # Start the server
  npx http-server -p 8080
  ```
  Open **http://localhost:8080/index.html** in your browser.

### 2. Client Portal (`/portal`)
The client portal is built with Next.js and Tailwind CSS.
* **Install dependencies** (recommended before running for the first time):
  ```bash
  cd portal
  npm install
  ```
* **Run in development mode**:
  ```bash
  npm run dev
  ```
  The portal will be running at **http://localhost:3000**.
