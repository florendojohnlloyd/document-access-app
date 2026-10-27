# Open items

- [ ] Delete the "sheets" folder in Drive, including from the trash. It holds `users.csv` with the password hashes. (Migration lead)
- [ ] Add Google One storage to the owner account before the 15 GB fills up. (Migration lead)
- [ ] Send the announcement to team leaders.
- [ ] Keep Vercel access safe: the project sits under florendojohnlloyd's account, team `jaloy1`. Consider moving it to an account the company controls.
- [ ] Decide whether to move the 53 files that sit directly in month folders into branch folders.

After 1–2 weeks without problems:

- [ ] Delete the Supabase project (permanent).
- [ ] Remove the Supabase keys from `.env.local`, `.env.vercel` and the Vercel environment variables.
- [ ] Delete the local password-hash files: `DocuVault-backup-2026-10-27\db\password-hashes.csv` and `DocuVault-import\sheets\users.csv`.
- [ ] Optional: remove the unused Supabase-era code from this repo (`src/`, `supabase/`).
