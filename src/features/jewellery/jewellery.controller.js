const jewelleryService = require("./jewellery.service");

class JewelleryController {
    async getAll(req, res, next) {
        try {
            const { category, search, page, limit } = req.query;
            const result = await jewelleryService.getJewellery({ category, search, page, limit });
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await jewelleryService.getById(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const result = await jewelleryService.create(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const result = await jewelleryService.update(id, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const result = await jewelleryService.delete(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new JewelleryController();
