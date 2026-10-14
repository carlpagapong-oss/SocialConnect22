import { api } from "./api";

export const userService = {
  getSuggestions: () => api.get("/users/suggestions"),
  getProfile: (username) => api.get(`/users/${encodeURIComponent(username)}`),
  getPosts: (username) => api.get(`/users/${encodeURIComponent(username)}/posts`),
  toggleFollow: (username) => api.post(`/users/${encodeURIComponent(username)}/follow`),
  updateMe: (changes) => api.put("/users/me", changes),
};
