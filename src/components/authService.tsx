// src/services/authService.ts
export const API_BASE = "http://localhost:5000";

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
}

interface ResetPasswordCheck {
  email: string;
  password: string;
}

export async function login(data: LoginData) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function signup(data: SignupData) {
  const response = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}

/**
 * Check credentials before allowing password reset
 * Returns { valid: boolean, message?: string }
 */
export async function checkCredentialsForReset(data: ResetPasswordCheck) {
  const response = await fetch(`${API_BASE}/check-credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response.json();
}

/**
 * Update password after verifying the user
 */
export async function resetPassword(email: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword })
  });
  return response.json();
}