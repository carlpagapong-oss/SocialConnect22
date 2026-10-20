import { Router } from "express";
import {
  getProfile,
  getDirectory,
  getSuggestions,
  getUserPosts,
  toggleFollow,
  updateMe,
} from "../controllers/userController.js";
import { protect, requireRole } from "../middleware/auth.js";
import { listAccounts, updateAccountStatus } from "../controllers/adminController.js";

const router = Router();

router.use(protect);

router.get("/suggestions", getSuggestions); // must come before "/:username"
router.get("/directory", getDirectory); // must come before "/:username"
router.put("/me", updateMe);
router.get("/admin/accounts", requireRole("admin"), listAccounts);
router.put("/admin/accounts/:id/status", requireRole("admin"), updateAccountStatus);
router.get("/:username", getProfile);
router.get("/:username/posts", getUserPosts);
router.post("/:username/follow", toggleFollow);

export default router;
