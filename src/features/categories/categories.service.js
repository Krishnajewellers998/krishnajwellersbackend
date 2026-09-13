const { getPool } = require("../../database/dataStore");

class CategoriesService {
    async getCategories({ page = 1, limit = 100 } = {}) {
        const pool = getPool();
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Number(limit) || 100);
        const offset = (pageNum - 1) * limitNum;

        const countRes = await pool.query(`SELECT COUNT(*) FROM categories`);
        const total = parseInt(countRes.rows[0].count, 10);

        const res = await pool.query(
            `SELECT name, image, synonyms FROM categories ORDER BY name ASC LIMIT $1 OFFSET $2`,
            [limitNum, offset]
        );

        const categories = res.rows.map(row => ({
            name: row.name,
            image: row.image || "",
            synonyms: Array.isArray(row.synonyms) ? row.synonyms : []
        }));

        return {
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            categories
        };
    }

    async addCategory({ name, image = "", synonyms = [] }) {
        const trimmed = String(name || "").trim();
        if (!trimmed) {
            throw { status: 400, message: "Category name is required." };
        }

        const pool = getPool();
        
        const existing = await pool.query(`SELECT name FROM categories WHERE LOWER(name) = LOWER($1)`, [trimmed]);
        if (existing.rows.length > 0) {
            throw { status: 409, message: `Category "${trimmed}" already exists.` };
        }

        const cleanSynonyms = Array.isArray(synonyms) ? synonyms : [];

        await pool.query(
            `INSERT INTO categories (name, image, synonyms) VALUES ($1, $2, $3::jsonb)`,
            [trimmed, String(image || "").trim(), JSON.stringify(cleanSynonyms)]
        );

        return {
            success: true,
            message: `Category "${trimmed}" added successfully.`,
            category: { name: trimmed, image, synonyms: cleanSynonyms }
        };
    }

    async updateCategory(oldName, { name, image, synonyms }) {
        const trimmedOld = String(oldName || "").trim();
        const pool = getPool();

        const existing = await pool.query(`SELECT * FROM categories WHERE LOWER(name) = LOWER($1)`, [trimmedOld]);
        if (existing.rows.length === 0) {
            throw { status: 404, message: `Category "${trimmedOld}" not found.` };
        }

        const currentCat = existing.rows[0];
        const newName = name !== undefined ? String(name).trim() : currentCat.name;
        const newImage = image !== undefined ? String(image).trim() : currentCat.image;
        const newSynonyms = synonyms !== undefined && Array.isArray(synonyms) ? synonyms : (currentCat.synonyms || []);

        await pool.query('BEGIN');
        try {
            if (newName.toLowerCase() !== trimmedOld.toLowerCase()) {
                // Name changed, we need to insert the new one, update jewellery, and delete old one
                // Since `name` is the primary key, we have to handle the rename carefully.
                // Using an UPDATE statement on the primary key might violate foreign key constraints
                // if we don't CASCADE, but our table is set to ON UPDATE CASCADE ON DELETE SET NULL.
                await pool.query(
                    `UPDATE categories SET name = $1, image = $2, synonyms = $3::jsonb WHERE LOWER(name) = LOWER($4)`,
                    [newName, newImage, JSON.stringify(newSynonyms), trimmedOld]
                );
            } else {
                await pool.query(
                    `UPDATE categories SET image = $1, synonyms = $2::jsonb WHERE LOWER(name) = LOWER($3)`,
                    [newImage, JSON.stringify(newSynonyms), trimmedOld]
                );
            }
            await pool.query('COMMIT');
        } catch (err) {
            await pool.query('ROLLBACK');
            throw err;
        }

        return {
            success: true,
            message: `Category "${newName}" updated successfully.`,
            category: { name: newName, image: newImage, synonyms: newSynonyms }
        };
    }

    async deleteCategory(name) {
        const trimmed = String(name || "").trim();
        const pool = getPool();

        const existing = await pool.query(`SELECT image FROM categories WHERE LOWER(name) = LOWER($1)`, [trimmed]);
        if (existing.rows.length === 0) {
            throw { status: 404, message: `Category "${trimmed}" not found.` };
        }

        const catToDelete = existing.rows[0];

        await pool.query(`DELETE FROM categories WHERE LOWER(name) = LOWER($1)`, [trimmed]);

        // Note: we let images table handle their own cleanup or we can just ignore orphaned files
        // as they are stored in the database now, but keeping the cleanup logic for disk files just in case.
        try {
            const fs = require("fs");
            const path = require("path");
            const config = require("../../config/env");

            const imgPath = catToDelete.image;
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
