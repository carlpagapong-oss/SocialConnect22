import { Router } from "express";
import {
  getProfile,
  getSuggestions,
  getUserPosts,
  toggleFollow,
  updateMe,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/suggestions", getSuggestions); // must come before "/:username"
router.put("/me", updateMe);
router.get("/:username", getProfile);
router.get("/:username/posts", getUserPosts);
router.post("/:username/follow", toggleFollow);

export default router;
