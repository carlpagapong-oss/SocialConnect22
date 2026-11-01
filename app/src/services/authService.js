import { api } from "./api";

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (identifier, password) => api.post("/auth/login", { identifier, password }),
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (email, password) => api.post("/auth/reset-password", { email, password }),
  me: () => api.get("/auth/me"),
};
