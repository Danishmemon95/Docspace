import express from "express";
import { userCategory, createCategory, updateCategory, deleteCategory, reOrderCategory, getCategoryById, categoryWithNotes } from "../Controllers/categoryController.js";
import { protectRoute } from "../Middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, userCategory);
router.get("/with-notes", protectRoute, categoryWithNotes);

router.post("/", protectRoute, createCategory);
router.put("/reorder", protectRoute, reOrderCategory);

router.put("/:id", protectRoute, updateCategory);
router.delete("/:id", protectRoute, deleteCategory);

router.get("/:id", protectRoute, getCategoryById);


export default router;
