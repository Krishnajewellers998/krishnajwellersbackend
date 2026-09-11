const goldRatesService = require("./gold-rates.service");

class GoldRatesController {
    getRates(req, res, next) {
        try {
            const result = goldRatesService.getGoldRates();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    updateRates(req, res, next) {
        try {
            const result = goldRatesService.updateGoldRates(req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new GoldRatesController();
