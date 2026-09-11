const categoriesService = require("./categories.service");

class CategoriesController {
    getAll(req, res, next) {
        try {
            const result = categoriesService.getCategories();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    create(req, res, next) {
        try {
            const result = categoriesService.addCategory(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    update(req, res, next) {
        try {
            const { name } = req.params;
            const result = categoriesService.updateCategory(name, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    delete(req, res, next) {
        try {
            const { name } = req.params;
            const result = categoriesService.deleteCategory(name);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new CategoriesController();
