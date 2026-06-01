import Note from "../Models/noteModel.js";
import Category from "../Models/categoryModel.js";

const getNoteById = async (req, res) => {
    try {
        const noteId = req.params.id;
        const note = await Note.findOne({ _id: noteId, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }
        res.status(200).json({ success: true, data: note });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const createNote = async (req, res) => {
    try {
        const { title, categoryId, content } = req.body
        if (!categoryId) {
            return res.status(400).json({ success: false, message: "Category ID is required" });
        }

        const category = await Category.findOne({ _id: categoryId, userId: req.user._id });
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (title && title.length > 200) {
            return res.status(400).json({ success: false, message: "Title length should be less than 200 characters" });
        }

        const lastNote = await Note.findOne({ userId: req.user._id, categoryId }).sort({ order: -1 });

        const newOrder = lastNote ? lastNote.order + 1 : 1;

        const note = await Note.create({
            title: title || "Untitled Note",
            userId: req.user._id,
            categoryId,
            content: content || [],
            order: newOrder,
            pinned: false,
        })

        res.status(201).json({ success: true, message: "Note created successfully", data: note });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const updateNote = async (req, res) => {
    try {
        const { title, content, pinned } = req.body;

        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        if (title !== undefined) {
            if (title.length > 200) {
                return res.status(400).json({ success: false, message: "Title length should be less than 200 characters" });
            }
            note.title = title.trim() || "Untitled Note";
        }

        if (content !== undefined) {
            note.content = content;
            note.markModified('content');
        }

        if (pinned !== undefined) {
            note.pinned = pinned;
        }

        note.updatedAt = Date.now();
        await note.save();

        res.status(200).json({ success: true, message: "Note updated successfully", data: note });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        note.deleted_at = Date.now();
        note.updatedAt = Date.now();
        await note.save();

        res.status(200).json({ success: true, message: "Note deleted successfully" });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const duplicateNote = async (req, res) => {
    try {
        const originalNote = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!originalNote) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        const lastNote = await Note.findOne({ userId: req.user._id, categoryId: originalNote.categoryId }).sort({ order: -1 });

        const newOrder = lastNote ? lastNote.order + 1 : 1;

        const duplicateNote = await Note.create({
            userId: req.user._id,
            categoryId: originalNote.categoryId,
            title: originalNote.title + " (Copy)",
            content: JSON.parse(JSON.stringify(originalNote.content)),
            order: newOrder,
        })

        res.status(201).json({ success: true, message: "Note duplicated successfully", data: duplicateNote });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const moveNote = async (req, res) => {
    try {

        const { newCategoryId } = req.body;

        if (!newCategoryId) {
            return res.status(400).json({ success: false, message: "New Category ID is required" });
        }

        const category = await Category.findOne({ _id: newCategoryId, userId: req.user._id });
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        note.categoryId = newCategoryId;
        note.updatedAt = Date.now();
        await note.save();

        res.status(200).json({ success: true, message: "Note moved successfully", data: note });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const reorderNotes = async (req, res) => {
    try {
        const { orderedNoteIds } = req.body;
        // Expected format: [{ id: 'noteId1', order: 0 }, { id: 'noteId2', order: 1 }, ...]

        if (!Array.isArray(orderedNoteIds)) {
            return res.status(400).json({ success: false, message: "orderedNoteIds must be an array" });
        }

        if (orderedNoteIds.length === 0) {
            return res.status(400).json({ success: false, message: "orderedNoteIds cannot be empty" });
        }

        const noteIds = orderedNoteIds.map((item) => item.id);
        const notes = await Note.find({ _id: { $in: noteIds }, userId: req.user._id });

        if (notes.length !== noteIds.length) {
            return res.status(404).json({ success: false, message: "One or more notes not found" });
        }

        const bulkOps = orderedNoteIds.map(({ id, order }) => ({
            updateOne: {
                filter: { _id: id, userId: req.user._id },
                update: { $set: { order: order, updatedAt: Date.now() } }
            }
        }));

        await Note.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: "Notes reordered successfully" });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const togglePinNote = async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }
        note.pinned = !note.pinned;
        note.updatedAt = Date.now();
        await note.save();
        res.status(200).json({ success: true, message: `Note ${note.pinned ? "pinned" : "unpinned"} successfully`, data: note });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

const getPinnedNotes = async (req, res) => {
    try {
        const pinnedNotes = await Note.find({
            userId: req.user._id,
            pinned: true,
            deleted_at: null
        }).sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: pinnedNotes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

const getDeletedNotes = async (req, res) => {
    try {
        const deletedNotes = await Note.find({
            userId: req.user._id,
            deleted_at: { $ne: null }
        }).sort({ deletedAt: -1 });

        res.status(200).json({ success: true, data: deletedNotes });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

const restoreNote = async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        note.deleted_at = null;
        note.updatedAt = Date.now();
        await note.save();

        res.status(200).json({ success: true, message: "Note restored successfully", data: note });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export { getNoteById, createNote, updateNote, deleteNote, duplicateNote, moveNote, reorderNotes, togglePinNote, getPinnedNotes, getDeletedNotes, restoreNote };