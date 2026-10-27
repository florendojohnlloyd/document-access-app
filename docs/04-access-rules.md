# Access rules

The rules are the same as in the old DocuVault. They are enforced on the server for every call.

| Action | Super admin | Admin | Branch user |
| --- | --- | --- | --- |
| See files | All | All (admins have no branch) | The folder named after their branch and its direct subfolders |
| Upload | Yes | Yes | Yes, to their branch folders |
| Preview | Yes | Yes | Yes, view-only |
| Download | Yes | Yes | No |
| Rename a file | Yes | No | No |
| Delete files | Yes | Yes | No |
| Create or delete an empty folder | Yes | Yes | No |
| Rename a folder | Yes | No | No |
| Users page | Create, edit, reset password, delete | View only | Hidden |
| Audit logs | All | All | Hidden |

Branch users also see the month folders above their branch (for example `Month / OCTOBER 2026`), so they can tell their branch folders apart. Those month folders show none of the other branches' files or folders. Uploads must go into a branch folder, not into a month folder.

Other rules:
- Users set their full name at first login. It then locks, except for super admins.
- Super admins cannot delete themselves. Only the account named `manager` can delete another super admin.
- Allowed file types: pdf, png, jpg, jpeg, doc, docx, xls, xlsx, zip, csv, txt.
