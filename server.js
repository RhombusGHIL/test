const express = require('express');
const request = require('request'); // We need to add this to package.json
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/service', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("No URL provided");

    // This creates a "Tunnel"
    // Everything the game sends, we pass directly to you
    req.pipe(request({
        url: targetUrl,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        rejectUnauthorized: false
    }))
    .on('error', (err) => res.status(500).send(err.message))
    .pipe(res); // Send the data to your browser
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
