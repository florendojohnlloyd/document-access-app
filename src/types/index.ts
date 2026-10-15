export type Branch =
  | 'CAGAYAN DE ORO'
  | 'GENSAN'
  | 'PAGADIAN'
  | 'CAVITE'
  | 'BUKIDNON'
  | 'ZAMBOANGA'
  | 'ILOILO'
  | 'TACLOBAN'
  | 'CEBU'
  | 'BACOLOD'
  | 'BUTUAN'
  | 'TAGUM'
  | 'DAVAO'
  | 'RIZAL'
  | 'PALAWAN'
  | 'ISABELA'
  | 'CABANATUAN'
  | 'PANGASINAN'
  | 'CAMSUR';

export const BRANCHES: Branch[] = [
  'CAGAYAN DE ORO', 'GENSAN', 'PAGADIAN', 'CAVITE', 'BUKIDNON',
  'ZAMBOANGA', 'ILOILO', 'TACLOBAN', 'CEBU', 'BACOLOD',
  'BUTUAN', 'TAGUM', 'DAVAO', 'RIZAL', 'PALAWAN',
  'ISABELA', 'CABANATUAN', 'PANGASINAN', 'CAMSUR',
];

export type Role = 'super_admin' | 'admin' | 'user';

export type ActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'FILE_DELETE'
  | 'FILE_RENAME'
  | 'FOLDER_CREATE'
  | 'FOLDER_RENAME'
  | 'FOLDER_DELETE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'NAME_SET'
  | 'VIEW';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: Role;
  branch: Branch | null;
  name_locked: boolean;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_by: string | null;
  created_at: string;
  subfolders?: Folder[];
}

export interface FileRecord {
  id: string;
  name: string;
  folder_id: string | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
  folder?: Folder;
  uploader?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: ActionType;
  detail: string | null;
  created_at: string;
}
