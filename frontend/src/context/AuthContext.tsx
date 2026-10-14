
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { AuthContextType, User } from "../types/auth";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../api/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser.is_active) {
        logout();
        return;
      }

      setUser(currentUser);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const login = async (email: string, password: string) => {
    const tokenResponse = await loginUser(email, password);

    localStorage.setItem("access_token", tokenResponse.access_token);

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser.is_active) {
        logout();
        throw new Error("Your account is inactive.");
      }

      setUser(currentUser);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    await registerUser({ name, email, password });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
