const dataStore = require("../../database/dataStore");

class JewelleryService {
    getJewellery({ category = "", search = "", page = 1, limit = 100 } = {}) {
        const data = dataStore.getData();
        let items = Array.isArray(data.jewellery) ? [...data.jewellery] : [];

        // Category filter
        if (category && category !== "All") {
            const catLower = category.toLowerCase().trim();
            items = items.filter(item => String(item.category || "").toLowerCase().trim() === catLower);
        }

        // Search query filter
        if (search) {
            const q = search.toLowerCase().trim();
            items = items.filter(item => {
                const name = String(item.name || "").toLowerCase();
                const desc = String(item.description || "").toLowerCase();
                const cat = String(item.category || "").toLowerCase();
                const syn = Array.isArray(item.synonyms) ? item.synonyms.join(" ").toLowerCase() : "";
                return name.includes(q) || desc.includes(q) || cat.includes(q) || syn.includes(q);
            });
        }

        const total = items.length;
        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.max(1, Number(limit) || 100);
        const startIndex = (pageNum - 1) * limitNum;
        const paginated = items.slice(startIndex, startIndex + limitNum);

        return {
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            jewellery: paginated
        };
    }

    getById(id) {
        const data = dataStore.getData();
        const item = (data.jewellery || []).find(i => String(i.id) === String(id));
        if (!item) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }
        return { success: true, jewellery: item };
    }

    create(itemData) {
        const name = String(itemData.name || "").trim();
        if (!name) {
            throw { status: 400, message: "Jewellery product name is required." };
        }

        const data = dataStore.getData();
        const maxId = (data.jewellery || []).reduce((max, i) => Math.max(max, Number(i.id) || 0), 0);
        const newId = maxId + 1;

        const newItem = {
            id: newId,
            name,
            category: String(itemData.category || "").trim(),
            description: String(itemData.description || "").trim(),
            image: String(itemData.image || itemData.photos?.[0] || "").trim(),
            photos: Array.isArray(itemData.photos) ? itemData.photos : (itemData.image ? [itemData.image] : []),
            weight: itemData.weight || "",
            purity: itemData.purity || "22K",
            price: Number(itemData.price) || 0,
            synonyms: Array.isArray(itemData.synonyms) ? itemData.synonyms : [],
            createdAt: new Date().toISOString()
        };

        dataStore.updateData(current => ({
            ...current,
            jewellery: [newItem, ...(current.jewellery || [])]
        }));

        return {
            success: true,
            message: "Jewellery item added successfully.",
            jewellery: newItem
        };
    }

    update(id, updates) {
        const data = dataStore.getData();
        const index = (data.jewellery || []).findIndex(i => String(i.id) === String(id));

        if (index === -1) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }

        const currentItem = { ...data.jewellery[index] };
        if (updates.name !== undefined) currentItem.name = String(updates.name).trim();
        if (updates.category !== undefined) currentItem.category = String(updates.category).trim();
        if (updates.description !== undefined) currentItem.description = String(updates.description).trim();
        if (updates.weight !== undefined) currentItem.weight = updates.weight;
        if (updates.purity !== undefined) currentItem.purity = updates.purity;
        if (updates.price !== undefined) currentItem.price = Number(updates.price) || 0;
        if (updates.photos !== undefined && Array.isArray(updates.photos)) {
            currentItem.photos = updates.photos;
            if (updates.photos.length > 0) currentItem.image = updates.photos[0];
        } else if (updates.image !== undefined) {
            currentItem.image = updates.image;
        }
        if (updates.synonyms !== undefined && Array.isArray(updates.synonyms)) {
            currentItem.synonyms = updates.synonyms;
        }

        dataStore.updateData(current => {
            const copy = [...(current.jewellery || [])];
            copy[index] = currentItem;
            return { ...current, jewellery: copy };
        });

        return {
            success: true,
            message: "Jewellery item updated successfully.",
            jewellery: currentItem
        };
    }

    delete(id) {
        const data = dataStore.getData();
        const filtered = (data.jewellery || []).filter(i => String(i.id) !== String(id));

        if (filtered.length === (data.jewellery || []).length) {
            throw { status: 404, message: `Jewellery item with ID "${id}" not found.` };
        }

        dataStore.updateData(current => ({
            ...current,
            jewellery: filtered
        }));

        return {
            success: true,
            message: `Jewellery item ${id} deleted successfully.`
        };
    }
}

module.exports = new JewelleryService();
