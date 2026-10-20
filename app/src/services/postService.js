import { api } from "./api";

export const postService = {
  getFeed: () => api.get("/posts"),
  uploadMedia: async (file) => {
    const body = new FormData();
    body.append("media", file);
    return api.upload("/posts/upload", body);
  },
  create: (text, media) => api.post("/posts", { text, ...media }),
  remove: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  share: (id) => api.post(`/posts/${id}/share`),
  getBookmarks: () => api.get("/posts/bookmarks"),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
};
