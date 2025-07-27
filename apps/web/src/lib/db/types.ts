import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  users: UserTable;
  sessions: SessionTable;
}

export interface UserTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  name: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface SessionTable {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: Generated<string>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;
