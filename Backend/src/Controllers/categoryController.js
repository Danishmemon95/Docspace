import Category from "../Models/categoryModel.js"

const userCategory = async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user._id }).sort({ order: 1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const createCategory = async (req, res) => {
    try {
        const { name, icon } = req.body;

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
            isDefault: false
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

// const reOrderCategory = async (req, res) => {
//     try {

//     } catch (error) {

//     }
// }

export { userCategory, createCategory, updateCategory, deleteCategory };