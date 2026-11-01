import { Router } from "express";
import {
  getMe,
  login,
  register,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
