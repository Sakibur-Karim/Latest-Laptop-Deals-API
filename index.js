const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// RSS2JSON proxy URL for Reddit LaptopDeals
const RSS_URL = 'https://www.reddit.com/r/LaptopDeals/.rss';
const RSS2JSON_ENDPOINT = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

// In-Memory Cache Variables
let cachedDeals = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // Cache valid for 2 minutes (120,000 ms)

// CORS & No-Cache Middleware (Forces clean status 200 responses)
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Prevents status 304 responses by instructing clients not to cache locally
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    next();
});

// Main Endpoint
app.get('/', async (req, res) => {
    try {
        const now = Date.now();

        // 1. Serve from Cache if valid (Super fast latency: ~20-50ms)
        if (cachedDeals && (now - lastFetchTime < CACHE_DURATION)) {
            return res.status(200).json(cachedDeals);
        }

        // 2. Fetch fresh data if cache is expired or empty
        const response = await axios.get(RSS2JSON_ENDPOINT);

        if (response.data && response.data.items) {
            cachedDeals = response.data.items.map(item => ({
                header: item.title,
                link: item.link
            }));
            
            lastFetchTime = now;
            return res.status(200).json(cachedDeals);
        } else {
            return res.status(500).json({ error: "Invalid data format received from feed." });
        }

    } catch (error) {
        console.error("Error fetching deals:", error.message);
        return res.status(500).json({ error: "Failed to fetch laptop deals." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});