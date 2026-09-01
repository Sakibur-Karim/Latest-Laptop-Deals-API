const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const RSS_URL = 'https://www.reddit.com/r/LaptopDeals/.rss';
const RSS2JSON_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

let cachedDeals = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

app.get('/', async (req, res) => {
    try {
        const now = Date.now();

        // 1. Return cached data if available (and valid)
        if (cachedDeals && (now - lastFetchTime < CACHE_DURATION)) {
            return res.status(200).json(cachedDeals);
        }

        // 2. Fetch fresh data with a custom User-Agent to avoid bot blocking
        const response = await axios.get(RSS2JSON_ENDPOINT, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LatestLaptopDealsBot/1.0'
            },
            timeout: 8000 // 8 second timeout rule
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            cachedDeals = response.data.items.map(item => ({
                header: item.title,
                link: item.link
            }));
            
            lastFetchTime = now;
            return res.status(200).json(cachedDeals);
        } 
        
        // 3. Fallback: If RSS response succeeded but cache exists from prior runs, serve old cache
        if (cachedDeals) {
            return res.status(200).json(cachedDeals);
        }

        return res.status(502).json({ error: "Upstream RSS proxy returned an empty feed." });

    } catch (error) {
        console.error("Error fetching deals:", error.message);

        // Fail-safe: If upstream throws a 500, serve stale cache instead of breaking for the user
        if (cachedDeals) {
            console.log("Serving stale cached deals due to upstream proxy failure.");
            return res.status(200).json(cachedDeals);
        }

        return res.status(500).json({ 
            error: "Failed to fetch laptop deals due to upstream proxy error.",
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});