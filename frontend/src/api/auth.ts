
import api from "./axios";
import type { TokenResponse, User, UserRegister } from "../types/auth";

export async function loginUser(
  email: string,
  password: string
): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post<TokenResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function registerUser(
  userData: UserRegister
): Promise<User> {
  const response = await api.post<User>("/auth/register", {
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}
