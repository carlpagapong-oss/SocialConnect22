import { api } from "./api";

export const postService = {
  getFeed: () => api.get("/posts"),
  get: (id) => api.get(`/posts/${id}`),
  uploadMedia: async (file) => {
    const body = new FormData();
    body.append("media", file);
    return api.upload("/posts/upload", body);
  },
  create: (text, media) => api.post("/posts", { text, ...media }),
  remove: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  share: (id, message) => api.post(`/posts/${id}/share`, { message }),
  updateShare: (id, message) => api.put(`/posts/${id}/share`, { message }),
  getBookmarks: () => api.get("/posts/bookmarks"),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
};
