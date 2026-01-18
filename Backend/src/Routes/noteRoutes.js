import express from "express";
import { protectRoute } from "../Middlewares/authMiddleware.js";
import { createNote, getNoteById, updateNote, deleteNote, duplicateNote, moveNote, reorderNotes } from "../Controllers/noteController.js"

const router = express.Router();

router.post("/", protectRoute, createNote)
router.put("/reorder", protectRoute, reorderNotes);

router.get("/:id", protectRoute, getNoteById)
router.post("/:id/duplicate", protectRoute, duplicateNote);
router.put("/:id", protectRoute, updateNote);
router.put("/:id/move", protectRoute, moveNote);

router.delete("/:id", protectRoute, deleteNote);

export default router;
