# Migration log, 26–27 Oct 2026

## Why

The Supabase organization was on the Free plan, which allows 1 GB of storage. Actual storage was 11.95 GB. Supabase gave a grace period ending 28 Oct 2026, after which every request would return 402 and DocuVault would stop working. Management chose Google Drive and Apps Script instead of a paid plan or AWS.

## Findings along the way

- **1,000-row limit:** the old app listed only 1,000 of 3,673 files, because of the Supabase API's row cap. The 2,673 oldest files were hidden from employees. The new app shows all of them.
- **Storage growth:** uploads began on 15 Oct. After a 9 GB bulk load on 19 Oct, about 0.4 GB arrives per working day.
- **53 files** sit directly in month folders (`Month / OCTOBER 2026`: 52, `Month / FEBRUARY 2026`: 1). Under the branch rules only admins and super admins see them, in both the old and the new app.

## Timeline

| When | What |
| --- | --- |
| 26 Oct | Added the Name A→Z / Z→A sort to the old app's file table (commit `ac09bf9`) |
| 26 Oct | Drafted an AWS migration plan. Superseded by management's choice of Drive + Apps Script |
| 27 Oct | Backed up all data read-only to `C:\Users\Web-Dev\DocuVault-backup-2026-10-27`: 3,761 storage objects (11.95 GB, 0 failed, SHA-256 each) plus every table |
| 27 Oct | Exported the password hashes (25 users) from the Supabase SQL editor |
| 27 Oct | Built `DocuVault-import`: files laid out by folder (38 multipart files rejoined, 59 duplicate names given "(2)"), and CSVs for the Sheet |
| 27 Oct | Uploaded the files to Drive. Imported the Sheet and linked every row to Drive: 3,673 linked, 0 missing, 0 checksum mismatches, 103 empty folders created |
| 27 Oct | Rebuilt the UI to match the original DocuVault |
| 27 Oct | Ran the automated tests (`runTests`): 46 passed, 0 failed. Preview and download were also checked by hand, and the download's MD5 matched the original |
| 27 Oct | Redirected the old link to the new app. Copied the 50 files and 72 logs added to the old app after the backup (`syncFromSupabase`), then removed the Supabase key from Script Properties |
| 27 Oct | Moved the page onto the old link (`public/app.html`, commit `92b4862`) to fix the multi-account `/u/N/` error |

## Decisions

- Same usernames, passwords and access as before. Login uses the old bcrypt hashes.
- No Supabase Pro.
- Owner account espmi.markangelolloren@gmail.com, per management.
- One file deleted in the old app after the backup (`WCAPSI000450 PCF WEEK 3.pdf`) was kept in the new app, by choice.
- The audit-log entries from the test run, which were attributed to super admin "john", were removed.
