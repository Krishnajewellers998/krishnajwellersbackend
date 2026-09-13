const { getPool } = require("../../database/dataStore");

const PANKAJ_LIVE_URL =
    "https://bcast.pankajchain.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/pankajchain";

/**
 * Fetches live gold rate from the Pankaj Chain MCX broadcast feed.
 * Parses "GOLD 99.50 CASH BHAV" line for buy/sell/high/low.
 */
async function getLiveGoldRate() {
    const url = PANKAJ_LIVE_URL + "?_=" + Date.now();

    const response = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: {
            "Accept": "text/plain, */*; q=0.01",
            "Referer": "https://pankajchain.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    });

    if (!response.ok) {
        throw new Error(`Pankaj Chain feed error: HTTP ${response.status}`);
    }

    const text = await response.text();

    // Line format: 6335  GOLD 99.50 CASH BHAV  <BUY> <SELL> <HIGH> <LOW>
    const match = text.match(
        /6335\s+GOLD\s+99\.50\s+CASH\s+BHAV\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i
    );

    if (!match) {
        throw new Error("GOLD 99.50 CASH BHAV not found in live feed.");
    }

    return {
        buy: Number(match[1]),
        sell: Number(match[2]),
        high: Number(match[3]),
        low: Number(match[4])
    };
}

class GoldRatesService {

    /**
     * GET /api/gold-rates
     * Fetches live rate from Pankaj Chain feed.
     * Falls back to last saved DB value if feed is unavailable.
     */
    async getGoldRates() {
        const pool = getPool();
        try {
            const rate = await getLiveGoldRate();

            const rate24 = Math.round(rate.sell);
            const rate22 = Math.round(rate24 * 22 / 24);
            const rate18 = Math.round(rate24 * 18 / 24);
            
            const goldRates = { "24K": rate24, "22K": rate22, "18K": rate18 };

            // Persist the latest live rate to DB as fallback cache
            await pool.query(
                `INSERT INTO gold_rates (id, data) VALUES (1, $1::jsonb)
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
                [JSON.stringify(goldRates)]
            );

            return {
                success: true,
                goldRates,
                buy: rate.buy,
                sell: rate.sell,
                high: rate.high,
                low: rate.low,
                unit: "per 10 gram",
                source: "Pankaj Chain live feed",
                updatedAt: new Date().toISOString()
            };
        } catch (err) {
            console.warn("[GoldRates] Live feed unavailable, using fallback:", err.message);
            
            const res = await pool.query(`SELECT data FROM gold_rates WHERE id = 1`);
            const fallbackRates = res.rows.length > 0 ? res.rows[0].data : { "24K": 0, "22K": 0, "18K": 0 };

            return {
                success: true,
                fallback: true,
                goldRates: fallbackRates,
                unit: "per 10 gram",
                source: "Saved rate (live feed unavailable)",
                updatedAt: new Date().toISOString()
            };
        }
    }
}

module.exports = new GoldRatesService();
