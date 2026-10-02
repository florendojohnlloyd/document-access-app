# Document Access — Next.js 14 App with Supabase

The app implements a role-based document management system built on Next.js 14 App Router with Supabase for auth, database (PostgreSQL + RLS), and file storage. The approach uses username-based login mapped to synthetic `@docaccess.local` emails for Supabase Auth, with a two-role model (manager / user) enforced both at the API layer and via RLS policies. All 9 required UI components are present with meaningful Tailwind styling and dark mode support. The build was reported successful by the coder.

**Watch for:** (1) Logout route redirects to the Supabase project URL instead of the app — **confirmed bug**. (2) Storage RLS policies are commented out in schema.sql — **confirmed security gap**. (3) No `VIEW` audit log written when a signed URL is issued for file access — confirmed omission. (4) `@types/uuid ^10.0.0` and `uuid ^14.0.2` are mismatched, and all deps use `^` ranges — confirmed.

**Verdict**: NEEDS_CHANGES

---

## High-level view

Auth is well-structured: the `@docaccess.local` email convention is implemented symmetrically in `usernameToEmail()` and the trigger in `schema.sql` extracts the username back from the email on auth user creation. The `@supabase/ssr` `createServerClient` with cookie forwarding is correctly set up in the middleware and server helper, so session cookies are propagated properly through Next.js server components and API routes.

Every manager-gated API route (`/api/users`, `/api/folders` write/delete, `/api/files` PATCH/DELETE) checks session then re-verifies role from the profiles table before acting. Regular users hit a 403 on all mutating operations. The RLS policies in schema.sql duplicate this enforcement at the database level for defense-in-depth — but only for the application tables. The storage bucket's RLS policies are left as commented-out SQL, meaning any authenticated user can currently delete objects directly via the Supabase Storage API without going through the app.

The UI component inventory is complete: Sidebar, Header, FileTable, UploadZone, UserTable, LogTable, Modal, FileViewModal, FolderChips are all implemented with real logic, no TODO placeholders. Dark mode is implemented via a `ThemeProvider` that toggles a `dark` class on `<html>`, and `dark:` Tailwind variants are present throughout every component.

One confirmed runtime bug: the logout route redirects to `process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'` as the origin for the `/login` redirect. In production this sends the browser to the Supabase dashboard URL, not the app.

---

<details>
<summary>Issues (4)</summary>

1. **Logout redirect points to Supabase URL** — `POST /api/auth/logout` constructs the redirect with `process.env.NEXT_PUBLIC_SUPABASE_URL` as the base. In production this sends users to `https://xxxx.supabase.co/login` instead of the app. Replace with `process.env.NEXT_PUBLIC_APP_URL` or a relative `NextResponse.redirect(new URL('/login', request.url))` pattern. Confirmed.

2. **Storage RLS policies are commented out** — `supabase/schema.sql` contains the storage object policies as SQL comments. Without them, any authenticated user can call the Supabase Storage API directly to delete or read arbitrary objects in the `documents` bucket, bypassing the app's manager-only delete check. Uncomment and apply these policies. Confirmed.

3. **No VIEW audit log on file access** — `/api/files/[id]/url` generates a signed URL and returns it without inserting an `audit_logs` record. The `ActionType` enum includes `VIEW` but it is never used. File access is untracked in the audit trail. Add an insert to `audit_logs` with `action: 'VIEW'` in the URL route. Confirmed.

4. **Unpinned dependency versions** — `package.json` uses `^` ranges for all dependencies including `@supabase/ssr`, `next`, and `uuid`. On a fresh `npm install` (e.g., Vercel build) these can pull in breaking minor versions. Pin to exact versions for a production deployment. Confirmed by inspection of `package.json`.

</details>

---

<details>
<summary>Details</summary>

## Logout redirect to Supabase domain

In `src/app/api/auth/logout/route.ts`:

```ts
return NextResponse.redirect(
  new URL('/login', process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000')
);
```

`NEXT_PUBLIC_SUPABASE_URL` is `https://xxxx.supabase.co`, so this redirects to `https://xxxx.supabase.co/login` — a Supabase 404, not the app's login page. The client-side `Header` component handles this by calling `fetch('/api/auth/logout')` and then doing `router.push('/login')` itself, which masks the bug during normal use. But a direct `POST` to the logout endpoint (curl, Postman, or any non-JS client) gets the wrong redirect. Fix: use `NextResponse.json({ success: true })` and let the client-side handler navigate, or pass `request.url` as the base for the redirect.

## Storage bucket has no RLS enforcement

The schema creates and enables RLS on all four application tables. The storage policies that restrict who can upload, read, and delete objects in the `documents` bucket are present in `schema.sql` but are commented out with a note saying "run separately if needed." This is a confirmed gap: an authenticated user who knows their session token can call the Supabase Storage REST API directly and delete any file regardless of role. The app's manager-only DELETE enforcement in `/api/files` only covers the database row; it does not cascade to the storage object if someone bypasses the API. Uncommenting and running those three storage policies is the fix.

## View events missing from audit trail

The `ActionType` in `src/types/index.ts` declares `'VIEW'` as a valid action, and `src/app/api/files/[id]/url/route.ts` is the natural place to log it. The route authenticates the user and fetches the file's storage path before issuing a signed URL, so the actor and target are available. There is no insert. This means managers cannot see who viewed which files — a significant omission for a system positioned as an audit-ready document manager.

## Unpinned dependencies

The `^` version ranges on `@supabase/ssr ^0.3.0`, `uuid ^14.0.2`, and `lucide-react ^1.49.0` mean a Vercel build on a fresh clone can pull a different package than the one tested locally. `uuid` in particular went from v9 to v14 between the type declaration (`@types/uuid ^10.0.0` — which targets v10) and the runtime package (`uuid ^14.0.2`), suggesting an inconsistency that happened during authoring. Pin all versions with `npm ci` or explicit version locks before the first production deployment.


</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/app/api/auth/login/route.ts` | Username→email auth + audit log on login |
| `src/app/api/auth/logout/route.ts` | Sign out + audit log; **has redirect bug** |
| `src/app/api/auth/me/route.ts` | GET profile; PATCH sets full_name with lock |
| `src/app/api/files/route.ts` | GET (all/filtered), PATCH (rename), DELETE — manager-gated for mutations |
| `src/app/api/files/upload/route.ts` | Multipart upload with extension validation, storage path, DB record, cleanup on failure |
| `src/app/api/files/[id]/url/route.ts` | Signed URL generation for file preview/download; **VIEW log missing** |
| `src/app/api/folders/route.ts` | Full CRUD for folders, manager-gated writes |
| `src/app/api/users/route.ts` | GET (manager), POST creates auth user + profile with rollback |
| `src/app/api/users/[id]/route.ts` | DELETE user via service client; prevents self-deletion |
| `src/app/api/logs/route.ts` | GET logs; managers see all, users see own |
| `src/middleware.ts` | Redirects unauthenticated users away from /dashboard |
| `src/app/dashboard/layout.tsx` | Server component auth gate, profile fetch |
| `src/app/dashboard/files/page.tsx` | Files page — folder chips, file table, upload zone |
| `src/app/dashboard/users/page.tsx` | Users page — client-side role check + user table + add form |
| `src/app/dashboard/logs/page.tsx` | Logs page — client-side role check, auto-refresh every 30s |
| `src/components/Sidebar.tsx` | Navigation with role-filtered links, mobile overlay |
| `src/components/Header.tsx` | Dark mode toggle, logout, user badge |
| `src/components/FileTable.tsx` | File list with inline rename/delete modals, file type icons |
| `src/components/UploadZone.tsx` | Drag-and-drop upload with XHR progress bar |
| `src/components/FolderChips.tsx` | Folder filter chips with inline manager create/rename/delete |
| `src/components/UserTable.tsx` | User list with delete (manager only) |
| `src/components/LogTable.tsx` | Audit log display with color-coded action badges |
| `src/components/Modal.tsx` | Reusable confirm/input modal with keyboard and focus management |
| `src/components/FileViewModal.tsx` | Signed URL fetch, PDF iframe, image preview, download fallback |
| `src/components/SetNameModal.tsx` | First-login name capture for users; locks name on save |
| `src/components/DashboardShell.tsx` | Layout wrapper: sidebar + header + SetNameModal trigger |
| `src/components/ThemeProvider.tsx` | Dark mode context with localStorage persistence |
| `src/lib/supabase/client.ts` | Browser Supabase client (anon key only) |
| `src/lib/supabase/server.ts` | Server Supabase client (cookie-based) + service client |
| `src/lib/utils.ts` | `cn()`, `formatDate()`, `usernameToEmail()`, `emailToUsername()` |
| `src/types/index.ts` | TypeScript types: Profile, Folder, FileRecord, AuditLog, Role, ActionType |
| `src/middleware.ts` | Session check + redirect for /login and /dashboard/* |
| `supabase/schema.sql` | All four tables + RLS policies + trigger; **storage policies commented out** |
| `README.md` | Full setup, local dev, GitHub, Vercel deployment instructions |

Full diff: inspect the `src/` and `supabase/` directories directly.

</details>
