import express from "express";
import { protectRoute } from "../Middlewares/authMiddleware.js";
import { createNote, getNoteById, updateNote, deleteNote, duplicateNote, moveNote, reorderNotes } from "../Controllers/noteController.js"

const router = express.Router();

router.post("/", protectRoute, createNote)
router.put("/reorder", protectRoute, reorderNotes);

router.get("/:id", protectRoute, getNoteById)
router.put("/duplicate/:id", protectRoute, duplicateNote);
router.put("/:id", protectRoute, updateNote);
router.put("/move/:id", protectRoute, moveNote);

router.delete("/:id", protectRoute, deleteNote);

export default router;
