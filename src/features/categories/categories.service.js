const dataStore = require("../../database/dataStore");

class CategoriesService {
    getCategories({ page = 1, limit = 100 } = {}) {
        const data = dataStore.getData();
        const categories = (data.categories || []).map(cat => {
            if (typeof cat === "string") {
                return { name: cat, image: "", synonyms: [] };
            }
            return {
                name: cat.name || "",
                image: cat.image || "",
                synonyms: Array.isArray(cat.synonyms) ? cat.synonyms : []
            };
        });

        const total = categories.length;
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Number(limit) || 100);
        const startIndex = (pageNum - 1) * limitNum;
        const paginated = categories.slice(startIndex, startIndex + limitNum);

        return {
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            categories: paginated
        };
    }

    addCategory({ name, image = "", synonyms = [] }) {
        const trimmed = String(name || "").trim();
        if (!trimmed) {
            throw { status: 400, message: "Category name is required." };
        }

        const data = dataStore.getData();
        const exists = (data.categories || []).some(c => {
            const catName = typeof c === "string" ? c : c.name;
            return String(catName || "").toLowerCase() === trimmed.toLowerCase();
        });

        if (exists) {
            throw { status: 409, message: `Category "${trimmed}" already exists.` };
        }

        const newCategory = {
            name: trimmed,
            image: String(image || "").trim(),
            synonyms: Array.isArray(synonyms) ? synonyms : []
        };

        const updated = dataStore.updateData(current => ({
            ...current,
            categories: [...(current.categories || []), newCategory]
        }));

        return {
            success: true,
            message: `Category "${trimmed}" added successfully.`,
            category: newCategory
        };
    }

    updateCategory(oldName, { name, image, synonyms }) {
        const trimmedOld = String(oldName || "").trim();
        const data = dataStore.getData();
        const index = (data.categories || []).findIndex(c => {
            const catName = typeof c === "string" ? c : c.name;
            return String(catName || "").toLowerCase() === trimmedOld.toLowerCase();
        });

        if (index === -1) {
            throw { status: 404, message: `Category "${trimmedOld}" not found.` };
        }

        const currentCat = typeof data.categories[index] === "string" 
            ? { name: data.categories[index], image: "", synonyms: [] } 
            : { ...data.categories[index] };

        const newName = name !== undefined ? String(name).trim() : currentCat.name;
        if (image !== undefined) currentCat.image = String(image).trim();
        if (synonyms !== undefined && Array.isArray(synonyms)) currentCat.synonyms = synonyms;
        currentCat.name = newName;

        dataStore.updateData(current => {
            const copy = [...(current.categories || [])];
            copy[index] = currentCat;
            // Also update any jewellery associated with old category name if renamed
            if (newName && newName.toLowerCase() !== trimmedOld.toLowerCase()) {
                const updatedJewellery = (current.jewellery || []).map(item => {
                    if (String(item.category || "").toLowerCase() === trimmedOld.toLowerCase()) {
                        return { ...item, category: newName };
                    }
                    return item;
                });
                return { ...current, categories: copy, jewellery: updatedJewellery };
            }
            return { ...current, categories: copy };
        });

        return {
            success: true,
            message: `Category "${newName}" updated successfully.`,
            category: currentCat
        };
    }

    deleteCategory(name) {
        const trimmed = String(name || "").trim();
        const data = dataStore.getData();
        const catToDelete = (data.categories || []).find(c => {
            const catName = typeof c === "string" ? c : c.name;
            return String(catName || "").toLowerCase() === trimmed.toLowerCase();
        });

        if (!catToDelete) {
            throw { status: 404, message: `Category "${trimmed}" not found.` };
        }

        const filtered = (data.categories || []).filter(c => {
            const catName = typeof c === "string" ? c : c.name;
            return String(catName || "").toLowerCase() !== trimmed.toLowerCase();
        });

        dataStore.updateData(current => ({
            ...current,
            categories: filtered
        }));

        // Clean up orphaned image file from disk
        try {
            const fs = require("fs");
            const path = require("path");
            const config = require("../../config/env");

            const imgPath = typeof catToDelete === "object" ? catToDelete.image : null;
            if (imgPath && imgPath.startsWith("images/")) {
                const fullPath = path.resolve(config.IMAGES_DIR, path.basename(imgPath));
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        } catch (cleanupErr) {
            console.error("[CategoriesService] Could not remove deleted category image file:", cleanupErr.message);
        }

        return {
            success: true,
            message: `Category "${trimmed}" deleted successfully.`
        };
    }
}

module.exports = new CategoriesService();
