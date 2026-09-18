const { getPool } = require("../../database/dataStore");

class JewelleryService {
    async getJewellery({ category = "", search = "", page = 1, limit = 100 } = {}) {
        const pool = getPool();
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Number(limit) || 100);
        const offset = (pageNum - 1) * limitNum;

        let queryArgs = [];
        let conditions = [];
        let paramIndex = 1;

        if (category && category !== "All") {
            conditions.push(`LOWER(j.category) = LOWER($${paramIndex})`);
            queryArgs.push(category.trim());
            paramIndex++;
        }

        if (search) {
            const q = `%${search.trim()}%`;
            // Search in jewellery fields OR matching categories
            conditions.push(`(
                j.name ILIKE $${paramIndex} OR 
                j.description ILIKE $${paramIndex} OR 
                j.category ILIKE $${paramIndex} OR 
                j.synonyms::text ILIKE $${paramIndex} OR
                EXISTS (
                    SELECT 1 FROM categories c 
                    WHERE c.name = j.category 
                    AND (c.name ILIKE $${paramIndex} OR c.synonyms::text ILIKE $${paramIndex})
                )
            )`);
            queryArgs.push(q);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countQuery = `SELECT COUNT(*) FROM jewellery j ${whereClause}`;
        const countRes = await pool.query(countQuery, queryArgs);
        const total = parseInt(countRes.rows[0].count, 10);

        const dataQuery = `
            SELECT id, name, category, description, image, photos, weight, purity, price, synonyms, created_at as "createdAt"
            FROM jewellery j
            ${whereClause}
            ORDER BY id DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const dataArgs = [...queryArgs, limitNum, offset];
        const res = await pool.query(dataQuery, dataArgs);

        return {
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            jewellery: res.rows
        };
    }

    async getById(id) {
        const pool = getPool();
        const res = await pool.query(
            `SELECT id, name, category, description, image, photos, weight, purity, price, synonyms, created_at as "createdAt" FROM jewellery WHERE id = $1`, 
            [id]
        );

        if (res.rows.length === 0) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }
        return { success: true, jewellery: res.rows[0] };
    }

    async create(itemData) {
        const name = String(itemData.name || "").trim();
        if (!name) {
            throw { status: 400, message: "Jewellery product name is required." };
        }

        // image / photos must be Cloudinary URL strings (client uploads via /api/cloudinary-sign)
        const category = String(itemData.category || "").trim() || null;
        const description = String(itemData.description || "").trim();
        const image = String(itemData.image || itemData.photos?.[0] || "").trim();
        const photos = Array.isArray(itemData.photos) ? itemData.photos : (itemData.image ? [itemData.image] : []);
        const weight = itemData.weight || "";
        const purity = itemData.purity || "22K";
        const price = Number(itemData.price) || 0;
        const synonyms = Array.isArray(itemData.synonyms) ? itemData.synonyms : [];
        const createdAt = new Date().toISOString();

        const pool = getPool();
        
        const res = await pool.query(
            `INSERT INTO jewellery (name, category, description, image, photos, weight, purity, price, synonyms, created_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10) RETURNING id`,
            [name, category, description, image, JSON.stringify(photos), weight, purity, price, JSON.stringify(synonyms), createdAt]
        );

        const newId = res.rows[0].id;

        const newItem = {
            id: newId,
            name,
            category,
            description,
            image,
            photos,
            weight,
            purity,
            price,
            synonyms,
            createdAt
        };

        return {
            success: true,
            message: "Jewellery item added successfully.",
            jewellery: newItem
        };
    }

    async update(id, updates) {
        const pool = getPool();
        
        const existing = await pool.query(`SELECT * FROM jewellery WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }

        const currentItem = existing.rows[0];
        
        const name = updates.name !== undefined ? String(updates.name).trim() : currentItem.name;
        const category = updates.category !== undefined ? (String(updates.category).trim() || null) : currentItem.category;
        const description = updates.description !== undefined ? String(updates.description).trim() : currentItem.description;
        const weight = updates.weight !== undefined ? updates.weight : currentItem.weight;
        const purity = updates.purity !== undefined ? updates.purity : currentItem.purity;
        const price = updates.price !== undefined ? (Number(updates.price) || 0) : currentItem.price;
        
        let photos = currentItem.photos;
        let image = currentItem.image;
        
        if (updates.photos !== undefined && Array.isArray(updates.photos)) {
            photos = updates.photos;
            if (updates.photos.length > 0) image = updates.photos[0];
        } else if (updates.image !== undefined) {
            image = updates.image;
        }
        
        const synonyms = updates.synonyms !== undefined && Array.isArray(updates.synonyms) ? updates.synonyms : currentItem.synonyms;

        const res = await pool.query(
            `UPDATE jewellery SET name = $1, category = $2, description = $3, image = $4, photos = $5::jsonb, 
             weight = $6, purity = $7, price = $8, synonyms = $9::jsonb
             WHERE id = $10 
             RETURNING id, name, category, description, image, photos, weight, purity, price, synonyms, created_at as "createdAt"`,
            [name, category, description, image, JSON.stringify(photos), weight, purity, price, JSON.stringify(synonyms), id]
        );

        return {
            success: true,
            message: "Jewellery item updated successfully.",
            jewellery: res.rows[0]
        };
    }

    async delete(id) {
        const pool = getPool();
        const existing = await pool.query(`SELECT id FROM jewellery WHERE id = $1`, [id]);

        if (existing.rows.length === 0) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }

        await pool.query(`DELETE FROM jewellery WHERE id = $1`, [id]);
        // Cloudinary assets are not deleted here — manage them in the Cloudinary dashboard if needed.

        return {
            success: true,
            message: `Jewellery item ${id} deleted successfully.`
        };
    }
}

module.exports = new JewelleryService();
