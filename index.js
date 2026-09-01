const express = require('express');
const Parser = require('rss-parser');
const app = express();

// Pass a custom User-Agent to prevent Reddit 429 rate-limiting
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
});

// RSS feed for r/LaptopDeals
const REDDIT_RSS_URL = 'https://www.reddit.com/r/LaptopDeals/new/.rss';

// Middleware to set CORS headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// Route to fetch deals
app.get('/', async (req, res) => {
    try {
        // Fetch and parse the RSS feed
        const feed = await parser.parseURL(REDDIT_RSS_URL);

        // Map items to match your original format
        const posts = feed.items.map(item => ({
            header: item.title,
            link: item.link
        }));

        res.json(posts);
    } catch (error) {
        console.error('Error fetching RSS feed:', error.message);
        res.status(500).json({ error: 'Failed to fetch Reddit data via RSS', details: error.message });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});