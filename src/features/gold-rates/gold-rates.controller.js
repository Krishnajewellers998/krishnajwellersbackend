const goldRatesService = require("./gold-rates.service");

class GoldRatesController {
    async getRates(req, res, next) {
        try {
            const result = await goldRatesService.getGoldRates();
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new GoldRatesController();
