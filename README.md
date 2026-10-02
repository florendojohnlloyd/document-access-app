# Document Access System

A modern, secure document management web app built with **Next.js 14**, **Supabase**, and **Tailwind CSS**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v3 with dark mode |
| Language | TypeScript (strict) |
| Icons | lucide-react |
| Deployment | Vercel |

---

## Features

- **Role-based access**: Manager and User roles with different permissions
- **File management**: Upload, view (inline PDF/image preview), rename, delete
- **Folder management**: Create, rename, delete folders with file filtering
- **User management**: Create and delete users (Manager only)
- **Audit logs**: Full activity log of all actions (Manager only, auto-refreshes)
- **Dark mode**: Toggle between light and dark themes
- **Secure**: Row-Level Security (RLS) + signed URLs for file access
- **Responsive**: Works on mobile and desktop

---

## Prerequisites

- Node.js 18 or higher
- npm
- [Supabase account](https://supabase.com) (free tier works)
- [Vercel account](https://vercel.com) (for deployment)
- [GitHub account](https://github.com) (for source control + Vercel integration)

---

## 1. Supabase Setup

### Create a project

1. Go to [app.supabase.com](https://app.supabase.com) → **New Project**
2. Choose a name, region, and strong database password → **Create Project**

### Run the schema

1. Open **SQL Editor** in your Supabase project
2. Paste the contents of `supabase/schema.sql` and click **Run**
3. All tables, RLS policies, and triggers will be created

### Create the storage bucket

1. Go to **Storage** → **New Bucket**
2. Name: `documents`
3. Public: **OFF** (private)
4. Click **Create bucket**

### Get your API keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/document-access-app.git
cd document-access-app

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Creating Initial Users

The app uses username/password login. You must create your first manager account via the Supabase dashboard.

### Option A: Supabase Dashboard (recommended for first manager)

1. Go to **Authentication → Users → Add User**
2. Email: `manager@docaccess.local`
3. Password: your chosen password
4. Click **Create User**

The trigger in `schema.sql` auto-creates a profile. Then update the role to `manager`:

```sql
-- Run in SQL Editor
UPDATE public.profiles
SET role = 'manager'
WHERE username = 'manager';
```

### Option B: After logging in as manager

Once you have a manager account, use the **Users** page in the app to create more users with any username and role.

---

## 4. GitHub Setup

```bash
git init
git add .
git commit -m "feat: initial document access app"
git remote add origin https://github.com/YOUR_USERNAME/document-access-app.git
git push -u origin main
```

---

## 5. Vercel Deployment

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**

Vercel will auto-deploy on every push to `main`.

---

## Folder Structure

```
src/
├── app/
│   ├── api/                # API route handlers
│   │   ├── auth/           # login, logout, me
│   │   ├── files/          # CRUD + upload + signed URL
│   │   ├── folders/        # CRUD
│   │   ├── users/          # CRUD
│   │   └── logs/           # Read audit logs
│   ├── dashboard/          # Protected dashboard pages
│   │   ├── files/          # File manager
│   │   ├── users/          # User manager (manager only)
│   │   └── logs/           # Audit logs (manager only)
│   └── login/              # Login page
├── components/             # Reusable React components
├── lib/
│   ├── supabase/           # Client and server Supabase helpers
│   └── utils.ts            # cn(), formatDate(), usernameToEmail()
├── middleware.ts            # Auth route protection
└── types/
    └── index.ts            # TypeScript types
supabase/
└── schema.sql              # Database schema + RLS policies
```

---

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is only used server-side in API routes — never exposed to the browser
- All file access uses signed URLs that expire in 1 hour
- Row-Level Security is enabled on all tables as a second layer of protection
- Regular users cannot change their name once it is set (`name_locked = true`)
- Managers cannot delete their own account
