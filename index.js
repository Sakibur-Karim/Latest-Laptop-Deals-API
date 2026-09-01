const express = require('express');
const axios = require('axios');
const app = express();

// Use rss2json proxy API to bypass Reddit's Render IP block
const RSS2JSON_ENDPOINT = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/LaptopDeals/new/.rss';

// CORS Middleware
// Updated CORS & Cache Control Middleware
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Prevent 304 responses by disabling caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    next();
});

// Route to fetch deals
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(RSS2JSON_ENDPOINT);

        // Transform the items into your format
        const posts = response.data.items.map(item => ({
            header: item.title,
            link: item.link
        }));

        res.json(posts);
    } catch (error) {
        console.error('Error fetching via proxy:', error.message);
        res.status(500).json({ error: 'Failed to fetch deals', details: error.message });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});