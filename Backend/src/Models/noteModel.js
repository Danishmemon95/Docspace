import mongoose, { mongo } from "mongoose";

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: false,
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
});

const Note = mongoose.model("Note", noteSchema);

export default Note;
