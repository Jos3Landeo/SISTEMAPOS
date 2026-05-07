export type Role = {
  id: string;
  name: string;
  description?: string | null;
};

export type User = {
  id: string;
  full_name: string;
  username: string;
  email?: string | null;
  is_active: boolean;
  role: Role;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

