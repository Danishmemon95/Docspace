import express from "express";
import { userCategory, createCategory } from "../Controllers/categoryController.js";
import { protectRoute } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/allCategories", protectRoute, userCategory);
router.post("/create_category", protectRoute, createCategory);

export default router;
