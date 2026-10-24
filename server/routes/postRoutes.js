import { Router } from "express";
import {
  addComment,
  createPost,
  deletePost,
  getBookmarks,
  getComments,
  getFeed,
  getPost,
  sharePost,
  updatePost,
  updateSharedPost,
  toggleBookmark,
  toggleLike,
} from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";
import multer from "multer";
import { uploadPostMedia } from "../controllers/postController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      callback(null, true);
      return;
    }
    callback(new Error("Only image and video files are allowed"));
  },
});

const router = Router();

router.use(protect);

router.post("/upload", upload.single("media"), uploadPostMedia);
router.route("/").get(getFeed).post(createPost);
router.get("/bookmarks", getBookmarks); // must come before "/:id"
router.get("/:id", getPost);
router.post("/:id/share", sharePost);
router.put("/:id/share", updateSharedPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/like", toggleLike);
router.post("/:id/bookmark", toggleBookmark);
router.route("/:id/comments").get(getComments).post(addComment);

export default router;
