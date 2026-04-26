const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/service', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("No URL");

    try {
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        let html = response.data;
        const urlObj = new URL(targetUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

        // THE SECRET SAUCE:
        // This tag tells the browser to fetch images/css from the REAL site
        const baseTag = `<base href="${baseUrl}">`;
        html = html.replace('<head>', `<head>${baseTag}`);

        res.send(html);
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
