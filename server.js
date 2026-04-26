const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();

// 1. Serve your "index.html" from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// 2. The Proxy Logic
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Please provide a URL in the query string.");
    }

    try {
        // Fetch the website data
        // We add a User-Agent header so the target site thinks we are a normal browser
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        // Load the HTML into Cheerio for rewriting
        const $ = cheerio.load(response.data);
        const urlObj = new URL(targetUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        // 3. The Link Rewriter
        // This finds relative links (like /style.css) and fixes them
        $('a, img, link, script').each((i, el) => {
            const attributes = ['href', 'src'];
            
            attributes.forEach(attr => {
                let val = $(el).attr(attr);
                if (val) {
                    // Fix relative paths (e.g., "/images/logo.png" -> "https://site.com/images/logo.png")
                    if (val.startsWith('/') && !val.startsWith('//')) {
                        $(el).attr(attr, baseUrl + val);
                    } 
                    // Fix paths that start with "." (e.g., "./style.css")
                    else if (val.startsWith('.')) {
                        $(el).attr(attr, baseUrl + val.replace('.', ''));
                    }
                    
                    // OPTIONAL: Make clicked links stay inside the proxy
                    if (el.name === 'a' && val.startsWith('http')) {
                        $(el).attr('href', `/proxy?url=${encodeURIComponent(val)}`);
                    }
                }
            });
        });

        // Send the fixed HTML back to the user
        res.send($.html());

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send(`<h1>Error</h1><p>Could not load the site: ${error.message}</p>`);
    }
});

// 4. Use the port provided by the host (Render/Railway) or 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});