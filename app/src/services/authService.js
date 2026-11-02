import { api } from "./api";

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (identifier, password) => api.post("/auth/login", { identifier, password }),
  verifyLoginCode: (challengeId, code) => api.post("/auth/login/verify", { challengeId, code }),
  resendLoginCode: (challengeId) => api.post("/auth/login/resend", { challengeId }),
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }),
  resendPasswordResetCode: (challengeId) =>
    api.post("/auth/forgot-password/resend", { challengeId }),
  resetPassword: (email, password) => api.post("/auth/reset-password", { email, password }),
  me: () => api.get("/auth/me"),
};
