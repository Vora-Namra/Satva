export interface SessionInfo {
  deviceInfo?: string;
  ipAddress?: string;
}

export interface UserSession {
  session_id: number;
  user_id: number;
  refresh_token: string;
  device_info: string | null;
  auth_provider: "LOCAL" | "GOOGLE";
  ip_address: string | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}