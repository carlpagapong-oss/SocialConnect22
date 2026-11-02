import { Router } from "express";
import {
  getMe,
  login,
  register,
  resendLoginCode,
  resendPasswordResetCode,
  requestPasswordReset,
  resetPassword,
  verifyLoginCode,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login/verify", verifyLoginCode);
router.post("/login/resend", resendLoginCode);
router.post("/forgot-password", requestPasswordReset);
router.post("/forgot-password/resend", resendPasswordResetCode);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

export default router;
