const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// This doesn't process the site, it just provides a clean window
app.get('/service', (req, res) => {
    const targetUrl = req.query.url;
    res.send(`
        <html>
        <body style="margin:0;">
            <meta name="referrer" content="no-referrer">
            <iframe src="${targetUrl}" style="width:100%; height:100vh; border:none;"></iframe>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
