import { api } from "./api";

export const postService = {
  getFeed: () => api.get("/posts"),
  create: (text) => api.post("/posts", { text }),
  remove: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  getBookmarks: () => api.get("/posts/bookmarks"),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
};
