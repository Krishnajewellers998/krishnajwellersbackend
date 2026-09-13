const categoriesService = require("./categories.service");

class CategoriesController {
    async getAll(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await categoriesService.getCategories({ page, limit });
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const result = await categoriesService.addCategory(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { name } = req.params;
            const result = await categoriesService.updateCategory(name, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const { name } = req.params;
            const result = await categoriesService.deleteCategory(name);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CategoriesController();
