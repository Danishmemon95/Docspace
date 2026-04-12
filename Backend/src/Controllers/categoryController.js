import Category from "../Models/categoryModel.js"
import Note from "../Models/noteModel.js";

const userCategory = async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user._id }).sort({ order: 1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const noteCount = await Note.countDocuments({
            categoryId: category._id,
            userId: req.user._id
        })

        res.status(200).json({ success: true, data: { ...category.toObject(), noteCount } });

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const createCategory = async (req, res) => {
    try {
        const { name, icon, isDefault } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Category name is required" });
        }

        if (name.length > 25) {
            return res.status(400).json({ message: "Category name should not exceed 25 characters" });
        }

        const existingCategory = await Category.findOne({ category_name: name.trim(), userId: req.user._id });
        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        const latestCategory = await Category.findOne({ userId: req.user._id }).sort({ order: -1 });

        const newOrder = latestCategory ? latestCategory.order + 1 : 0;

        const category = await Category.create({
            category_name: name.trim(),
            icon: icon || "folder",
            order: newOrder,
            userId: req.user._id,
            isDefault: isDefault || false
        });

        res.status(201).json({ success: true, message: 'Category created successfully', data: category });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const updateCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;

        const category = await Category.findById({ _id: req.params.id, userId: req.user._id });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        if (name !== undefined) {
            if (!name || name.trim() === "") {
                return res.status(400).json({ message: "Category name is required" });
            }
            if (name.length > 25) {
                return res.status(400).json({ message: "Category name should not exceed 25 characters" });
            }

            const duplicateCategory = await Category.findOne({ category_name: name.trim(), userId: req.user._id, _id: { $ne: req.params.id } });
            if (duplicateCategory) {
                return res.status(400).json({ message: "Another category with this name already exists" });
            }

            category.category_name = name.trim();
        }

        if (icon !== undefined) {
            category.icon = icon;
        }

        category.updatedAt = Date.now();
        await category.save();

        res.status(200).json({ success: true, message: "Category updated successfully", data: category });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById({ _id: req.params.id, userId: req.user._id });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        if (category.isDefault) {
            return res.status(400).json({ message: "Default categories cannot be deleted" });
        }

        const defaultCategory = await Category.findOne({ userId: req.user._id, isDefault: true });
        if (!defaultCategory) {
            return res.status(500).json({ message: "Default category not found. Cannot reassign notes." });
        }

        const updateResult = await Note.updateMany({
            categoryId: category._id,
            userId: req.user._id
        }, {
            $set: { categoryId: defaultCategory._id }
        })

        await Category.deleteOne({ _id: category._id });

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: {
                deletedCategoryId: category._id,
                movedNotesCount: updateResult.modifiedCount,
                movedToCategoryId: defaultCategory._id
            }
        });

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting category',
            error: error.message
        })
    }
}

const reOrderCategory = async (req, res) => {
    try {
        const { categoryOrders } = req.body;

        if (!Array.isArray(categoryOrders) || categoryOrders.length === 0) {
            return res.status(400).json({ message: "Invalid category order data" });
        }

        const categoryIds = categoryOrders.map(cat => cat.id);

        const categories = await Category.find({
            _id: { $in: categoryIds },
            userId: req.user._id
        })

        if (categories.length !== categoryIds.length) {
            return res.status(400).json({ message: "One or more categories not found" });
        }

        const bulkOps = categoryOrders.map((item) => ({
            updateOne: {
                filter: { _id: item.id, userId: req.user._id },
                update: { $set: { order: item.order, updatedAt: Date.now() } }
            }
        }));

        await Category.bulkWrite(bulkOps);

        const updatedCategories = await Category.find({
            userId: req.user._id
        }).sort({ order: 1 });

        res.status(200).json({ success: true, message: "Categories reordered successfully", data: updatedCategories });

    } catch (error) {
        console.error('Error Reordering category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while reordering category',
            error: error.message
        })
    }
}

const categoryWithNotes = async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user._id }).sort({ order: 1 });

        const notes = await Note.find({ userId: req.user._id, deleted_at: null }).sort({ order: 1 }).select('_id title categoryId order deleted_at createdAt updatedAt').lean();

        const categoriesWithNotes = categories.map(category => {
            const categoryNotes = notes.filter(
                note => note.categoryId.toString() === category._id.toString()
            );

            return {
                _id: category._id,
                category_name: category.category_name,
                icon: category.icon,
                order: category.order,
                isDefault: category.isDefault,
                notes: categoryNotes,
                noteCount: categoryNotes.length,
            };
        })

        res.status(200).json({ success: true, message: "Categories with notes retrieved successfully", data: categoriesWithNotes })

    } catch (error) {
        console.error('Error fetching categories with notes:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching categories with notes', error: error.message })
    }
}

const setDefaultCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const userId = req.user._id;

        const category = await Category.findOne({ _id: categoryId, userId });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Set all categories for this user to isDefault: false
        await Category.updateMany({ userId }, { $set: { isDefault: false } });

        // Set the requested category to isDefault: true
        category.isDefault = true;
        category.updatedAt = Date.now();
        await category.save();

        res.status(200).json({ success: true, message: "Category set as default successfully", data: category });

    } catch (error) {
        console.error('Error setting default category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while setting default category',
            error: error.message
        })
    }
}

export { userCategory, createCategory, updateCategory, deleteCategory, reOrderCategory, getCategoryById, categoryWithNotes, setDefaultCategory };