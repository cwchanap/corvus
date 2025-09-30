export interface PublicUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}
