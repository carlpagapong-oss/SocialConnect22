import { api } from "./api";

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (identifier, password) => api.post("/auth/login", { identifier, password }),
  me: () => api.get("/auth/me"),
};
