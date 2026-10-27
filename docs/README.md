# DocuVault docs

DocuVault moved off Supabase on 27 Oct 2026. It now runs on Google Apps Script, with data in Google Sheets and files in Google Drive. The old link (https://document-access-app-six.vercel.app) serves the new app.

| Doc | What it covers |
| --- | --- |
| [01-architecture.md](01-architecture.md) | How the system fits together today |
| [02-migration-log.md](02-migration-log.md) | What was done on 26–27 Oct 2026, and why |
| [03-operations.md](03-operations.md) | How to change, deploy, test and maintain it |
| [04-access-rules.md](04-access-rules.md) | Who can do what |
| [05-open-items.md](05-open-items.md) | What is still left to do |

Most of the Next.js code in this repo (`src/`, `supabase/`) belongs to the old Supabase version and is no longer used. Only `public/app.html` and the redirect in `next.config.js` are live.
