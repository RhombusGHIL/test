const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("Enter a URL");

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true, // This is crucial for fixing the "jumble"
        followRedirects: true,
        autoRewrite: true,  // Helps fix the links inside the game
        pathRewrite: { '^/service': '' },
        onProxyRes: (proxyRes) => {
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
        },
        onError: (err, req, res) => {
            res.status(500).send("Proxy error: " + err.message);
        }
    })(req, res, next);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
