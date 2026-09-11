const dataStore = require("../../database/dataStore");

class GoldRatesService {
    getGoldRates() {
        const data = dataStore.getData();
        return {
            success: true,
            goldRates: data.goldRates || { "24K": 0, "22K": 0, "18K": 0 },
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    }

    updateGoldRates(rates) {
        const rate24 = Math.round(Number(rates.rate24 || rates["24K"] || 0));
        const rate22 = Math.round(Number(rates.rate22 || rates["22K"] || 0));
        const rate18 = Math.round(Number(rates.rate18 || rates["18K"] || 0));

        if (rate24 <= 0 || rate22 <= 0 || rate18 <= 0) {
            throw { status: 400, message: "Valid positive gold rates are required for 24K, 22K, and 18K." };
        }

        const updated = dataStore.updateData(data => {
            return {
                ...data,
                goldRates: {
                    "24K": rate24,
                    "22K": rate22,
                    "18K": rate18
                }
            };
        });

        return {
            success: true,
            message: "Gold rates updated successfully.",
            goldRates: updated.goldRates,
            updatedAt: updated.updatedAt
        };
    }
}

module.exports = new GoldRatesService();
