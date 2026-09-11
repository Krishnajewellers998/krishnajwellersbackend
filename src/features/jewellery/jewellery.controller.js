const jewelleryService = require("./jewellery.service");

class JewelleryController {
    getAll(req, res, next) {
        try {
            const { category, search, page, limit } = req.query;
            const result = jewelleryService.getJewellery({ category, search, page, limit });
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    getById(req, res, next) {
        try {
            const { id } = req.params;
            const result = jewelleryService.getById(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    create(req, res, next) {
        try {
            const result = jewelleryService.create(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    update(req, res, next) {
        try {
            const { id } = req.params;
            const result = jewelleryService.update(id, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    delete(req, res, next) {
        try {
            const { id } = req.params;
            const result = jewelleryService.delete(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new JewelleryController();
