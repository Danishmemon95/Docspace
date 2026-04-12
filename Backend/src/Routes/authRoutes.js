import express from "express";
import { signup, login, logout, checkAuth, updateUserName } from "../Controllers/authController.js";
import { protectRoute } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", protectRoute, checkAuth);
router.put("/update-name", protectRoute, updateUserName);

export default router;
