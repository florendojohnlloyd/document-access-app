# Operations

## Changing the UI: always two places

1. Edit `C:\Users\Web-Dev\docuvault-appscript\src\Index.html`.
2. Push and redeploy Apps Script to the **same** deployment, so the URL does not change:
   ```
   cd C:\Users\Web-Dev\docuvault-appscript
   clasp push -f
   clasp deploy -i AKfycbwPszZvhZOC6CqbMiJoolh1cMESZJVRgEKlumd1LabTvm-ux72TCpqzUQK-HsHtAXaLaQ -d "short description"
   ```
3. Copy it to this repo without the `<base>` line:
   ```
   grep -v '<base target="_top">' ../docuvault-appscript/src/Index.html > public/app.html
   ```
4. Push to `master`. **This deploys to production on Vercel, so get the migration lead's go first.**

A server-only change (any `.js` file) needs steps 2 only.

## Functions you run from the Apps Script editor

| Function | File | What it does |
| --- | --- | --- |
| `authorize` | Setup | Grants permissions; changes nothing |
| `uploadProgress` | Setup | Counts the files under "DocuVault Files" |
| `importSheets` | Setup | Rebuilds the Sheet from the CSVs. **Overwrites the data; do not run on the live system** |
| `linkDrive` / `linkDriveNow` | Setup | Links Sheet rows to Drive files. `linkDriveNow` does not create folders |
| `runTests` | Tests | About 46 checks covering access, permissions, download, upload, rename and delete. Uses a temporary folder and removes its own log entries |
| `syncFromSupabase` / `forgetSupabaseKey` | Sync | One-time catch-up from the old app. Supabase is retired, so this is no longer needed |

## Everyday tasks

- **Add, edit, reset or delete a user:** use the Users page as a super admin. Reset password is in the Edit dialog.
- **Folders:** use the Month dropdown. The + adds a subfolder, the pencil renames (super admin only), and the trash deletes an empty folder.
- **Deleted files** go to the owner's Drive trash and can be recovered for 30 days.

## Backup

On the migration lead's PC, Google Drive for desktop mounts the Drive as `G:`. The Windows scheduled task **DocuVault Backup** runs at logon, then hourly. It copies new and changed files from `G:\My Drive\DocuVault\DocuVault Files` to `C:\Users\Web-Dev\DocuVault-Backup-Live\DocuVault Files` with robocopy, and never deletes anything.

- Script: `C:\Users\Web-Dev\DocuVault-Backup-Tools\backup-docuvault.ps1`
- Log: `C:\Users\Web-Dev\DocuVault-Backup-Tools\backup-log.txt`
- Status: double-click **Check DocuVault Backup** on the Desktop. It shows the files in Drive, the files in the backup, and DONE or STILL COPYING.
- `C:\Users\Web-Dev\DocuVault-backup-2026-10-27` is a frozen snapshot of the old Supabase system. Do not mix the two.

## Watch

- **Drive storage:** the owner account has 15 GB, and files grow about 8–10 GB a month. Google One is needed.
- **Apps Script quotas:** at most about 30 calls run at once for the owner account. Each browser uploads 3 files at a time.
