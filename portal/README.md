# Innovise Consultant Client Portal

This is the secure, authenticated client portal built for **Innovise Consultant** (innovise.in), a CA & CS firm in Kanpur, India. The application handles company registration, GST, income tax, trademark, and annual compliance services with strict data isolation and Row-Level Security (RLS).

---

## 🛠️ Stack & Key Features

- **Frontend/Backend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Vanilla CSS customizations matching the brand's trustworthy blue/neutral palette with vibrant orange accents
- **Icons**: Lucide React
- **Backend Services**: Supabase Auth, Supabase Postgres Database (RLS enabled), and Supabase Storage (Private bucket)
- **Security**: 
  - Server-side cookie session management using `@supabase/ssr` (HTTP-only)
  - Row-Level Security policies ensuring clients only access their own records
  - Signed temporary download URLs for uploaded PDF/JPEG/PNG documents

---

## ⚙️ Project Setup

### 1. Database Schema Initialization
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** of your project.
3. Open and run the contents of [supabase_schema.sql](supabase_schema.sql) to set up tables, triggers, helper functions, and RLS policies.
4. Go to the **Storage** section in your Supabase project, verify that a bucket named `documents` has been created, and that it is configured as **private** (not public).

### 2. Configure Environment Variables
Create a file named `.env.local` in the root folder of this project (we have generated a placeholder file at [.env.local](.env.local)). Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key
```

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` is highly sensitive and allows bypassing RLS policies. It is used on the server side strictly to provision new clients. **Never** expose this key to browser client bundles or check it into public git repositories.

### 3. Load Sample Seed Data
To immediately test the application with prepopulated details:
1. Open the **SQL Editor** in Supabase.
2. Open and run [supabase_seed.sql](supabase_seed.sql) to register a test admin and client user.

This seeds the following credentials:
- **Admin Login**: `+919506166560` or `officialtaxinn@gmail.com` / Password: `password123`
- **Client Login**: `+919876543210` / Password: `password123`

---

## 🚀 Running Locally

Initialize node modules and start the development server:

```bash
# Install packages
npm install

# Run the development server
npm run dev
```

The app will compile and start running on [http://localhost:3000](http://localhost:3000).

---

## 🔒 Verification & Security Checklist

### 1. Client Isolation (RLS Verification)
Log in as the seed client `+919876543210`. Verify that you can view the timeline for your assigned company registration and GST services, check outstanding dues, download your PAN card document, and upload a proof of address. 
If you sign up or login with a second client user, confirm that the second client cannot see Acme Corporate Solutions' invoices, requests, or services.

### 2. Private Storage Download URLs
Attempt to download a document from the vault. Notice that the link URL points to `https://your-project.supabase.co/storage/v1/object/sign/documents/...`. It uses a short-lived signature token. Copied links will expire and become inaccessible without active auth.

### 3. Admin Account Onboarding
Log in as the seed admin `+919506166560` or `officialtaxinn@gmail.com`. Use the console to register a new client profile. Verify that the new user is correctly provisioned, and you can now assign them custom compliance services, create invoices, upload office files, and verify documents they upload.
