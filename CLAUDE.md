# DocuVault: notes for Claude

DocuVault is a document system for ES Print Media branch payables. Since 27 Oct 2026 it runs on Google Apps Script, with Google Sheets for data and Google Drive for files. Supabase is retired. Read `docs/` first: start with `docs/README.md`, then `docs/01-architecture.md` and `docs/03-operations.md`.

## Where things live

- **Live link (employees):** https://document-access-app-six.vercel.app. It serves `public/app.html` from this repo; every other path redirects to it (see `next.config.js`).
- **Server code:** an Apps Script project, owned by espmi.markangelolloren@gmail.com.
  - Script ID: `1V4CTOgcAxrUjNe-GYKKY6hk1ItyjlPg5EVgOkoXgnlK0q_Kkjv-sQYLK`
  - Web app deployment ID: `AKfycbwPszZvhZOC6CqbMiJoolh1cMESZJVRgEKlumd1LabTvm-ux72TCpqzUQK-HsHtAXaLaQ` (this is also the API URL in `app.html`)
  - On the original PC the code is in `C:\Users\Web-Dev\docuvault-appscript` (local git).
  - On any other PC: `npm i -g @google/clasp@2.4.2`, then `clasp login` with the owner account, then `clasp clone 1V4CTOgcAxrUjNe-GYKKY6hk1ItyjlPg5EVgOkoXgnlK0q_Kkjv-sQYLK --rootDir src`.
- **Data:** the Google Sheet "DocuVault Database" (Users, Folders, Files and Logs tabs) and the Drive folder `My Drive/DocuVault/DocuVault Files`.
- The old Next.js and Supabase code in `src/` and `supabase/` is unused.

## Rules (agreed with the migration lead)

1. **A UI change always goes in two places:**
   - the Apps Script `Index.html`, then `clasp push -f` and `clasp deploy -i <deployment ID> -d "..."` (same deployment, so the URL stays the same);
   - and `public/app.html`, which is the same file without the `<base target="_top">` line.

   A server-only change (the `.js` files) needs only the Apps Script deploy.
2. **Never push to `master` without the user's explicit "go" for that push.** `master` auto-deploys to Vercel production.
3. Permissions are enforced on the server and must match `docs/04-access-rules.md`. Test with `runTests` in the Apps Script editor; it cleans up after itself.
4. Never print, commit or paste secrets, password hashes or keys. Never type a user's real password; ask the user to log in.

## Debugging checklist

- Reproduce the problem on the live link. A browser signed in to several Google accounts breaks `script.google.com/macros/u/N/` links; that is why the page is hosted on Vercel.
- Apps Script logs: the editor's Executions page.
- The API can be called directly: POST JSON `{"fn": "...", "args": [...]}` to the web app URL. `branches` needs no session.
- Large files move in 8 MB chunks (`getChunk`, `startUpload`, `uploadChunk`).

## Backup (on the original PC)

The Windows scheduled task "DocuVault Backup" copies new files from `G:\My Drive\DocuVault\DocuVault Files` to `C:\Users\Web-Dev\DocuVault-Backup-Live`. It runs at logon and then hourly, and it never deletes. The scripts and the log are in `C:\Users\Web-Dev\DocuVault-Backup-Tools`.
