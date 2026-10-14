
export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: boolean;
}

export interface UserRegister {
  name: string;
  email: string;
  password: string;
  role_id?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}
