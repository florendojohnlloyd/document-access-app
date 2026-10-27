# Architecture

```
Employee's browser
   │  https://document-access-app-six.vercel.app  (every path redirects to /app.html)
   ▼
Vercel — public/app.html (static page: login, files, users, audit logs)
   │  fetch POST, JSON, no Google cookies (credentials: 'omit')
   ▼
Apps Script web app "DocuVault" (doPost JSON API), runs as the owner account
   ├── Google Sheet "DocuVault Database": Users, Folders, Files, Logs tabs
   └── Google Drive folder "DocuVault Files": every document, never shared
```

## Parts

| Part | Where | Notes |
| --- | --- | --- |
| Page | `public/app.html` in this repo | A copy of the Apps Script `Index.html`, minus `<base target="_top">` |
| Server | `C:\Users\Web-Dev\docuvault-appscript\src\*.js` (local git, pushed with clasp) | Script ID is in `.clasp.json` |
| API URL | `https://script.google.com/macros/s/AKfycbwPszZvhZOC6CqbMiJoolh1cMESZJVRgEKlumd1LabTvm-ux72TCpqzUQK-HsHtAXaLaQ/exec` | `doGet` serves the page, and `doPost` is the JSON API |
| Owner account | espmi.markangelolloren@gmail.com (as management asked) | Owns the script, the Sheet and the Drive files |
| Database | Google Sheet "DocuVault Database" | Every cell is plain text. Writes go through LockService |
| Files | Drive "DocuVault Files" (inside "DocVault" in My Drive) | Same folder tree as the app |

## Why the page is hosted on Vercel

Apps Script links (`script.google.com/macros/...`) break with "unable to open the file" when a browser is signed in to several Google accounts. Google rewrites them to `/macros/u/N/`. The Vercel page calls the API without Google cookies, so it works in any browser.

## Login

- Usernames and passwords are the same as in the old app. The bcrypt hashes were exported from Supabase into the Users tab and are checked with bcryptjs, which is bundled in the script.
- Sessions are random tokens kept in Apps Script's CacheService for 6 hours. Every API call checks the token, then the role and branch.
- Five wrong passwords lock a username for 15 minutes.

## Large files

Apps Script handles about 50 MB per request, so uploads and downloads move in 8 MB chunks.
- Uploads use Drive's resumable upload API.
- Downloads use HTTP range requests.
- PDFs are drawn with PDF.js, because Chrome's built-in viewer is blocked inside the Apps Script sandbox.
