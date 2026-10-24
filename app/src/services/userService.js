import { api } from "./api";

export const userService = {
  getSuggestions: () => api.get("/users/suggestions"),
  getDirectory: () => api.get("/users/directory"),
  getProfile: (username) => api.get(`/users/${encodeURIComponent(username)}`),
  getPosts: (username) => api.get(`/users/${encodeURIComponent(username)}/posts`),
  toggleFollow: (username) => api.post(`/users/${encodeURIComponent(username)}/follow`),
  uploadMedia: async (file) => {
    const body = new FormData();
    body.append("media", file);
    return api.upload("/posts/upload", body);
  },
  updateMe: (changes) => api.put("/users/me", changes),
  getAccounts: () => api.get("/users/admin/accounts"),
  updateAccountStatus: (id, status) =>
    api.put(`/users/admin/accounts/${encodeURIComponent(id)}/status`, { status }),
};
