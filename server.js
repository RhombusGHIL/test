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
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            },
            // Follow redirects to get the final page
            maxRedirects: 5
        });

        // Load the HTML into Cheerio
        const $ = cheerio.load(response.data);
        const urlObj = new URL(targetUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        // 3. The Aggressive Link Rewriter
        // This targets links (a), images (img), styles (link), and scripts (script)
        $('a, img, link, script').each((i, el) => {
            const attributes = ['href', 'src'];
            
            attributes.forEach(attr => {
                let val = $(el).attr(attr);
                if (val) {
                    // Fix relative paths (e.g., "/style.css" -> "https://site.com/style.css")
                    if (val.startsWith('/') && !val.startsWith('//')) {
                        val = baseUrl + val;
                    } else if (val.startsWith('.')) {
                        val = baseUrl + val.replace(/^\./, '');
                    }
                    
                    // IF it's a clickable link (<a> tag), wrap it in our proxy URL
                    if (el.name === 'a' && val.startsWith('http')) {
                        $(el).attr('href', `/proxy?url=${encodeURIComponent(val)}`);
                    } else {
                        // For images and CSS, just use the absolute path so they load correctly
                        $(el).attr(attr, val);
                    }
                }
            });
        });

        // Send the modified HTML back to the user
        res.send($.html());

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send(`
            <div style="font-family:sans-serif; padding:20px;">
                <h1>Proxy Error</h1>
                <p>Could not load the site: <strong>${targetUrl}</strong></p>
                <p>Reason: ${error.message}</p>
                <a href="/">Go Back</a>
            </div>
        `);
    }
});

// 4. Use the port provided by Render (10000) or 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
