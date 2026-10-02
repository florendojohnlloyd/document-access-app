# Implementation Plan — Document Access App (Next.js 14 + Supabase)

## Source reference
Prototype analysed: `Document Access – Sample.html` (single-file localStorage demo).

## Architecture decisions
- **Framework:** Next.js 14 with App Router. Chosen for built-in server components, API routes, and first-class Vercel deployment.
- **Database & auth:** Supabase (existing account). Provides Postgres, Row-Level Security, Auth, and Storage in one managed service — no extra infra needed.
- **Auth strategy:** Supabase Auth email/password. Usernames are mapped to `<username>@docaccess.local` as the internal email so users only type a username, matching the prototype UX. Role + real name stored in a `profiles` table linked to `auth.users`.
- **File storage:** Supabase Storage bucket `documents`. Signed URLs for secure inline viewing (PDF iframe, image tag), matching the prototype's `URL.createObjectURL` approach.
- **Styling:** Tailwind CSS v3 with the `dark:` variant. Primary color `#1f6f5c` (from prototype `--acc`). Card-based layout, light gray background.
- **State management:** React Server Components for data fetching; `useState`/`useTransition` for client interactivity. No Redux / Zustand needed at this scope.
- **API layer:** Next.js Route Handlers (`src/app/api/…`) that run server-side and call Supabase with the service-role key — ensures RLS is never bypassed from the client.
- **Session:** Supabase `@supabase/ssr` cookie-based session, compatible with Next.js middleware.

---

## Implementation Plan

- [ ] 1. Scaffold project root config files.
      Create `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.gitignore`, `.env.local.example`, and `README.md` at the project root.
      - `package.json`: Next.js 14.2, React 18, TypeScript, Tailwind CSS 3, `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react` (icons), `clsx`, `tailwind-merge`.
      - `tsconfig.json`: strict mode, `@/*` path alias for `src/`.
      - `next.config.js`: enable `images.remotePatterns` for Supabase storage domain.
      - `tailwind.config.ts`: extend colors with `teal: { DEFAULT: '#1f6f5c', dark: '#4fb69b' }`, enable `darkMode: 'class'`.
      - `.env.local.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
      - `.gitignore`: node_modules, .next, .env.local.
      Files: `document-access-app/package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.gitignore`, `.env.local.example`, `README.md`
      Verify: `cd document-access-app && npm install` completes with no errors; `npx tsc --noEmit` passes (no source yet, just config validation).

- [ ] 2. Create Supabase database schema.
      Write `supabase/schema.sql` containing all DDL and RLS policies.
      Tables to create:
      - `profiles(id uuid PK FK auth.users, username text UNIQUE NOT NULL, role text CHECK IN ('manager','user'), full_name text, name_locked bool DEFAULT false, created_at timestamptz)`
      - `folders(id uuid PK DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, created_by uuid FK profiles, created_at timestamptz)`
      - `files(id uuid PK DEFAULT gen_random_uuid(), name text NOT NULL, folder_id uuid FK folders ON DELETE RESTRICT, storage_path text NOT NULL, uploaded_by uuid FK profiles, uploaded_at timestamptz DEFAULT now())`
      - `audit_logs(id uuid PK DEFAULT gen_random_uuid(), actor_id uuid FK profiles, actor_username text, action text NOT NULL, detail text, created_at timestamptz DEFAULT now())`
      RLS policies:
      - `profiles`: users can SELECT their own row; manager can SELECT all; INSERT on signup trigger only.
      - `folders`: authenticated users can SELECT; only manager can INSERT/UPDATE/DELETE.
      - `files`: authenticated users can SELECT; authenticated can INSERT; only manager can UPDATE/DELETE.
      - `audit_logs`: authenticated can INSERT; only manager can SELECT all; users can SELECT rows where `actor_id = auth.uid()`.
      Also include: Postgres function `handle_new_user()` + trigger on `auth.users` that inserts a matching `profiles` row on signup.
      Files: `document-access-app/supabase/schema.sql`
      Verify: Copy-paste into Supabase SQL editor — all statements execute without error; tables appear in Table Editor.

- [ ] 3. Create shared TypeScript types.
      Define all domain types used across the app.
      - `User`, `Profile`, `Folder`, `FileRecord`, `AuditLog`, `UserRole`, `ActionType` (union of all log action strings: `LOGIN | LOGOUT | UPLOAD | FILE_DELETE | FILE_RENAME | FOLDER_CREATE | FOLDER_RENAME | FOLDER_DELETE | USER_CREATE | USER_DELETE | NAME_SET | VIEW`).
      Files: `document-access-app/src/types/index.ts`
      Verify: `npx tsc --noEmit` passes after this file exists.

- [ ] 4. Create Supabase client helpers.
      - `src/lib/supabase/client.ts`: browser client using `createBrowserClient` from `@supabase/ssr` — used in Client Components.
      - `src/lib/supabase/server.ts`: server client using `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers` — used in Server Components and Route Handlers.
      - `src/lib/utils.ts`: `cn()` helper (combines `clsx` + `tailwind-merge`), `formatDate(iso: string)` for Philippine locale (`en-PH`), `usernameToEmail(u: string)` returning `${u}@docaccess.local`, `emailToUsername(e: string)` stripping the suffix.
      Files: `document-access-app/src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/utils.ts`
      Verify: `npx tsc --noEmit` — no type errors.

- [ ] 5. Create Next.js middleware for auth-guarded routes.
      `src/middleware.ts` using `@supabase/ssr` `createServerClient`. Refresh session on every request. Redirect unauthenticated users hitting `/dashboard/*` to `/login`. Redirect already-authenticated users hitting `/login` to `/dashboard`.
      Files: `document-access-app/src/middleware.ts`
      Verify: `npx tsc --noEmit` — no type errors.

- [ ] 6. Build the root layout and global styles.
      - `src/app/globals.css`: Tailwind directives (`@tailwind base/components/utilities`), CSS variables matching prototype colours (`--teal`, `--bg`, etc.), custom scrollbar, font-face if needed.
      - `src/app/layout.tsx`: root HTML shell, imports globals.css, sets `lang="fil"`, wraps in a `ThemeProvider` (simple context that toggles `dark` class on `<html>` using `localStorage`). Metadata: title "Document Access".
      - `src/components/ThemeProvider.tsx`: Client Component that reads `localStorage.theme` on mount, applies `dark` class, exposes `useTheme()` hook.
      Files: `document-access-app/src/app/globals.css`, `src/app/layout.tsx`, `src/components/ThemeProvider.tsx`
      Verify: `npm run dev` starts; visiting `http://localhost:3000` renders without crash (will redirect to /login).

- [ ] 7. Build the Login page.
      - `src/app/login/page.tsx`: Server Component that renders a centered card. Passes a Server Action to a `<LoginForm>` Client Component.
      - `src/components/LoginForm.tsx`: Client Component with username + password inputs, calls Server Action `login(formData)`.
      - `src/app/actions/auth.ts`: Server Actions file.
        - `login(formData)`: reads username, maps to email, calls `supabase.auth.signInWithPassword()`. On success, redirects to `/dashboard`. On failure, returns error string.
        - `logout()`: calls `supabase.auth.signOut()`, redirects to `/login`.
      - Login page design: centered card (max-w-sm), logo/title "Document Access" in serif, teal "Log in" button, error message area. Matches prototype layout.
      Files: `document-access-app/src/app/login/page.tsx`, `src/components/LoginForm.tsx`, `src/app/actions/auth.ts`
      Verify: `npm run dev` — `/login` renders the card form with no console errors.

- [ ] 8. Build reusable UI components (Sidebar, Header, Modal).
      - `src/components/Sidebar.tsx`: Client Component. Navigation links: Files, Users (manager only), Audit Log (manager only). Active link highlighted in teal. Collapsible on mobile (hamburger toggle). Displays logged-in user's name and role badge at the bottom.
      - `src/components/Header.tsx`: Client Component. Shows current page title, dark-mode toggle button (sun/moon icon from lucide-react), and logout button that calls the `logout` Server Action.
      - `src/components/Modal.tsx`: Client Component. Generic modal with title, optional message, optional text input, confirm/cancel buttons. Props: `title`, `message?`, `inputLabel?`, `defaultValue?`, `confirmLabel`, `danger?`, `onConfirm(value?: string)`, `onClose`. Accessible: `role="dialog"`, `aria-modal`, focus trap, Escape key closes.
      Files: `document-access-app/src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/components/Modal.tsx`
      Verify: Components compile; `npx tsc --noEmit` passes.

- [ ] 9. Build the Dashboard shell layout.
      - `src/app/dashboard/layout.tsx`: Server Component. Reads session and profile from Supabase (server client). Renders `<Sidebar>` + `<Header>` + `{children}`. Passes `profile` (role, name) as props to Sidebar.
      - `src/app/dashboard/page.tsx`: Simple redirect to `/dashboard/files` (using `redirect()` from `next/navigation`).
      Files: `document-access-app/src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx`
      Verify: `npm run dev` — authenticated user visiting `/dashboard` redirects to `/dashboard/files`.

- [ ] 10. Build API Route Handlers — files and folders.
       All routes use the server Supabase client. Return JSON. Errors return `{ error: string }` with appropriate HTTP status.
       - `src/app/api/folders/route.ts`: GET (list all), POST (create — manager only), PATCH (rename — manager only), DELETE (delete — manager only, reject if files exist).
       - `src/app/api/files/route.ts`: GET (list, optional `?folder_id=`), DELETE (manager only), PATCH (rename — manager only).
       - `src/app/api/files/upload/route.ts`: POST multipart — accepts file + `folder_id`. Validates mime type (pdf, png, jpg, jpeg, doc, docx, xls, xlsx). Uploads to Supabase Storage bucket `documents` under path `<folder_id>/<uuid>_<filename>`. Inserts row in `files` table. Writes audit log row. Returns new file record.
       - `src/app/api/files/[id]/url/route.ts`: GET — creates a signed URL (60-minute expiry) for the file's storage_path. Returns `{ url: string }`.
       Files: `document-access-app/src/app/api/folders/route.ts`, `src/app/api/files/route.ts`, `src/app/api/files/upload/route.ts`, `src/app/api/files/[id]/url/route.ts`
       Verify: Use curl or Postman with a valid session cookie to hit `GET /api/folders` — returns JSON array.

- [ ] 11. Build API Route Handlers — users and logs.
       - `src/app/api/users/route.ts`: GET (manager only — list all profiles), POST (manager only — create new user: maps username→email, calls `supabase.auth.admin.createUser()` with `@supabase/supabase-js` service-role client, inserts profile row, writes audit log).
       - `src/app/api/users/[id]/route.ts`: DELETE (manager only — deletes from auth.users via admin API, cascades to profiles; writes audit log).
       - `src/app/api/logs/route.ts`: GET — manager sees all rows ordered by `created_at DESC`; regular user sees only their own rows.
       - `src/app/api/auth/me/route.ts`: GET — returns current profile (username, role, full_name, name_locked).
       Files: `document-access-app/src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/api/logs/route.ts`, `src/app/api/auth/me/route.ts`
       Verify: `GET /api/logs` returns JSON array; `GET /api/users` with manager session returns user list.

- [ ] 12. Build the first-time name setup page / component.
       The prototype locks the name once set for regular users. Implement as a modal that appears when `profile.full_name` is null/empty AND `profile.name_locked` is false.
       - `src/components/SetNameModal.tsx`: Client Component. Modal with "Enter your full name" prompt, single text input, Save button. Calls `PATCH /api/auth/me` to update `full_name` and set `name_locked = true`. After save, refreshes the router.
       - `src/app/api/auth/me/route.ts` (extend from step 11): add PATCH handler that updates `profiles.full_name` and `profiles.name_locked` for the current user only; returns updated profile.
       - Integrate in `src/app/dashboard/layout.tsx`: if `profile.full_name` is empty, render `<SetNameModal>` on top of everything.
       Files: `document-access-app/src/components/SetNameModal.tsx`, `src/app/api/auth/me/route.ts` (PATCH added)
       Verify: Log in as a new user with no name — name modal appears; after saving, modal disappears and name shows in sidebar.

- [ ] 13. Build the Files page with folder chips, file table, and upload zone.
       - `src/components/FolderChips.tsx`: Client Component. Renders "All" chip + one chip per folder. Active chip in teal. Manager sees "+ New folder" chip-button. Clicking a folder emits `onSelect(folderId | null)`.
       - `src/components/UploadZone.tsx`: Client Component. Drag-and-drop zone + click-to-browse. Shows folder selector `<select>`. Validates file type client-side before POST to `/api/files/upload`. Displays upload progress via `XMLHttpRequest` (for progress events). Calls `onSuccess()` callback to refresh file list.
       - `src/components/FileTable.tsx`: Client Component. Columns: File name, Folder, Uploaded by, Date. Manager gets Edit (rename) and Delete action buttons. Clicking a filename opens the view modal (Step 14). Handles empty state: "No files here."
       - `src/app/dashboard/files/page.tsx`: Server Component. Fetches folders and initial file list server-side. Renders `<FolderChips>`, `<UploadZone>`, `<FileTable>`. Uses `useSearchParams` pattern (client wrapper) so active folder is in URL query `?folder=<id>` for shareable links.
       - Manager folder actions (rename, delete) in `FolderChips` use the `<Modal>` component and call `/api/folders` PATCH/DELETE.
       Files: `document-access-app/src/components/FolderChips.tsx`, `src/components/UploadZone.tsx`, `src/components/FileTable.tsx`, `src/app/dashboard/files/page.tsx`
       Verify: `npm run dev` — Files page loads, folders chips render, uploading a PDF appears in the table, folder filter works.

- [ ] 14. Build the file view modal (PDF / image inline preview).
       - `src/components/FileViewModal.tsx`: Client Component. Receives `fileId` and `fileName`. On mount, calls `GET /api/files/<id>/url` to get a signed URL. Shows: PDF → `<iframe>` full height; image (png/jpg/jpeg) → `<img>`; other → download link. "Open in new tab" link. Close button. Matches prototype behavior.
       Files: `document-access-app/src/components/FileViewModal.tsx`
       Verify: Clicking "View" on a PDF file opens the modal with embedded PDF viewer.

- [ ] 15. Build the Users page.
       - `src/components/UserTable.tsx`: Client Component. Columns: Username, Full name (or "not yet set" muted), Role. Manager sees Delete button for non-manager users. Confirm via `<Modal>` before delete.
       - `src/components/AddUserForm.tsx`: Client Component. Username + password inputs, "Add user" button. Posts to `/api/users`. Password min 6 chars validation. Shows inline error.
       - `src/app/dashboard/users/page.tsx`: Server Component (manager-only — redirect non-managers to `/dashboard/files`). Fetches user list server-side. Renders `<AddUserForm>` card + `<UserTable>`.
       Files: `document-access-app/src/components/UserTable.tsx`, `src/components/AddUserForm.tsx`, `src/app/dashboard/users/page.tsx`
       Verify: Manager adds a new user — user appears in table. Delete user — user removed. Non-manager visiting `/dashboard/users` redirects to `/dashboard/files`.

- [ ] 16. Build the Audit Logs page.
       - `src/components/LogTable.tsx`: Client Component. Columns: Timestamp, Actor (username + name), Action (colored badge by action type), Detail. Color mapping: LOGIN→green, LOGOUT→gray, UPLOAD→blue, FILE_DELETE→red, FILE_RENAME→yellow, FOLDER_*→purple, USER_*→orange. Empty state: "No logs yet."
       - `src/app/dashboard/logs/page.tsx`: Server Component (manager-only guard). Fetches logs server-side. Renders `<LogTable>` inside a card. Auto-refreshes client-side every 30 s via `setInterval` + `router.refresh()` in a Client Component wrapper.
       Files: `document-access-app/src/components/LogTable.tsx`, `src/app/dashboard/logs/page.tsx`
       Verify: After uploading a file, the Audit Logs page shows the UPLOAD entry with correct actor, file name, and folder.

- [ ] 17. Wire up audit logging in all API routes.
       Every mutating route (upload, delete file, rename file, create folder, rename folder, delete folder, create user, delete user) must insert a row into `audit_logs` using the server client. The `actor_id` is `session.user.id`, `actor_username` is read from `profiles`. Actions must match the `ActionType` union in `src/types/index.ts`.
       This is a cross-cutting concern — review every route from Steps 10–11 and confirm each mutation writes a log. Add any missing inserts.
       Files: `document-access-app/src/app/api/files/route.ts`, `src/app/api/files/upload/route.ts`, `src/app/api/folders/route.ts`, `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`
       Verify: Perform every action type (upload, delete, rename, folder ops, user ops) and confirm each produces exactly one audit log row.

- [ ] 18. Finalize UI polish and dark-mode pass.
       - Audit every component for consistent use of Tailwind `dark:` classes. Background `bg-gray-50 dark:bg-gray-900`, card `bg-white dark:bg-gray-800`, border `border-gray-200 dark:border-gray-700`, muted text `text-gray-500 dark:text-gray-400`.
       - Add loading skeletons (`animate-pulse`) to FileTable, UserTable, LogTable while data fetches.
       - Add `<EmptyState>` component (icon + message) for empty file/user/log lists.
       - Ensure all interactive elements have `focus-visible` ring in teal.
       - Sidebar: smooth slide-in on mobile using Tailwind `transition-transform`.
       - Confirm responsive layout at 375 px (mobile) and 1280 px (desktop).
       Files: All components in `document-access-app/src/components/`, `src/app/globals.css`
       Verify: `npm run build` produces no TypeScript or Tailwind errors. Toggle dark mode — all surfaces flip correctly.

- [ ] 19. Write environment setup and deployment docs.
       Update `README.md` with:
       1. Prerequisites (Node 20+, npm, Supabase account).
       2. Local setup: clone, `npm install`, copy `.env.local.example` → `.env.local`, fill in Supabase URL + keys.
       3. Database setup: run `supabase/schema.sql` in the Supabase SQL editor; create Storage bucket `documents` (private) in Supabase dashboard.
       4. First run: `npm run dev`.
       5. Vercel deploy: connect GitHub repo in Vercel, add the three env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), deploy.
       6. GitHub Actions: note that `.env.local` is git-ignored and secrets must be set in GitHub → Settings → Secrets for any CI pipeline.
       Files: `document-access-app/README.md`
       Verify: A developer following the README can complete local setup in under 15 minutes.

- [ ] 20. Final build and pre-deploy verification.
       Run the full production build. Fix any remaining type errors, missing imports, or Tailwind warnings.
       - `npm run build` — must succeed with 0 errors.
       - `npm run lint` — no ESLint errors (Next.js default rules).
       - Manually test the critical path: login → upload file → view file → rename file → delete file → add user → delete user → check audit log → logout.
       Files: Any file with residual errors.
       Verify: `npm run build` exits with code 0 and the `.next/` output directory is populated.

---

## File index (all files to be created)

```
document-access-app/
├── package.json                               (step 1)
├── tsconfig.json                              (step 1)
├── next.config.js                             (step 1)
├── tailwind.config.ts                         (step 1)
├── postcss.config.js                          (step 1)
├── .env.local.example                         (step 1)
├── .gitignore                                 (step 1)
├── README.md                                  (steps 1, 19)
├── supabase/
│   └── schema.sql                             (step 2)
└── src/
    ├── types/
    │   └── index.ts                           (step 3)
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                      (step 4)
    │   │   └── server.ts                      (step 4)
    │   └── utils.ts                           (step 4)
    ├── middleware.ts                           (step 5)
    └── app/
        ├── globals.css                        (step 6)
        ├── layout.tsx                         (step 6)
        ├── page.tsx                           (redirect to /login)
        ├── actions/
        │   └── auth.ts                        (step 7)
        ├── login/
        │   └── page.tsx                       (step 7)
        ├── dashboard/
        │   ├── layout.tsx                     (step 9)
        │   ├── page.tsx                       (step 9)
        │   ├── files/
        │   │   └── page.tsx                   (step 13)
        │   ├── users/
        │   │   └── page.tsx                   (step 15)
        │   └── logs/
        │       └── page.tsx                   (step 16)
        └── api/
            ├── auth/
            │   └── me/
            │       └── route.ts               (steps 11, 12)
            ├── files/
            │   ├── route.ts                   (step 10)
            │   ├── upload/
            │   │   └── route.ts               (step 10)
            │   └── [id]/
            │       └── url/
            │           └── route.ts           (step 10)
            ├── folders/
            │   └── route.ts                   (step 10)
            ├── users/
            │   ├── route.ts                   (step 11)
            │   └── [id]/
            │       └── route.ts               (step 11)
            └── logs/
                └── route.ts                   (step 11)

src/components/
├── ThemeProvider.tsx                          (step 6)
├── LoginForm.tsx                              (step 7)
├── Sidebar.tsx                                (step 8)
├── Header.tsx                                 (step 8)
├── Modal.tsx                                  (step 8)
├── SetNameModal.tsx                           (step 12)
├── FolderChips.tsx                            (step 13)
├── UploadZone.tsx                             (step 13)
├── FileTable.tsx                              (step 13)
├── FileViewModal.tsx                          (step 14)
├── UserTable.tsx                              (step 15)
├── AddUserForm.tsx                            (step 15)
└── LogTable.tsx                               (step 16)
```

---

## Key design notes for the coder

1. **Username → email mapping** must be consistent across all auth calls: `usernameToEmail()` in `src/lib/utils.ts`.
2. **Service-role client** (for `auth.admin.createUser` and admin deletes) must only ever be used in server-side Route Handlers, never exposed to the browser.
3. **RLS** is the production safety net. The API routes enforce application-level role checks AND rely on RLS as a second layer.
4. **Supabase Storage bucket** `documents` must be created as **private** (no public access). All file access goes through signed URLs generated server-side.
5. **`name_locked`** flag: once a user saves their name for the first time, the PATCH endpoint must reject further changes for `role='user'`. Managers can always edit their own name via the same endpoint.
6. **Folder delete restriction**: if any file references a folder (via `folder_id` FK with `ON DELETE RESTRICT`), the delete must fail with a user-friendly error — same behaviour as the prototype.
7. **Audit log LOGIN/LOGOUT**: handled in the `login()` and `logout()` Server Actions by inserting rows via the server client before/after the Supabase auth call.
