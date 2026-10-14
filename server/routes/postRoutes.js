import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  getBookmarks,
  getComments,
  getFeed,
  toggleBookmark,
  toggleLike,
} from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.route("/").get(getFeed).post(createPost);
router.get("/bookmarks", getBookmarks); // must come before "/:id"
router.delete("/:id", deletePost);
router.post("/:id/like", toggleLike);
router.post("/:id/bookmark", toggleBookmark);
router.route("/:id/comments").get(getComments).post(addComment);

export default router;
