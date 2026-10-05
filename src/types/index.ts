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
  | 'USER_DELETE'
  | 'NAME_SET'
  | 'VIEW';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: Role;
  name_locked: boolean;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
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
