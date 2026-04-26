const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;

    if (!targetUrl) return res.status(400).send("No URL provided.");

    try {
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const urlObj = new URL(targetUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        // THE FIX: Target every single link and force it back through your proxy
        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (href) {
                // 1. If it's a relative link (like /wiki/Main_Page), make it absolute
                if (href.startsWith('/') && !href.startsWith('//')) {
                    href = baseUrl + href;
                }
                // 2. Now wrap that link in YOUR proxy URL
                $(el).attr('href', `/proxy?url=${encodeURIComponent(href)}`);
            }
        });

        // Also fix images/CSS so they actually show up
        $('img, link, script').each((i, el) => {
            let src = $(el).attr('src') || $(el).attr('href');
            if (src && src.startsWith('/') && !src.startsWith('//')) {
                $(el).attr(src.startsWith('h') ? 'src' : 'href', baseUrl + src);
            }
        });

        res.send($.html());
    } catch (error) {
        res.status(500).send("Error loading page: " + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on ${PORT}`));
