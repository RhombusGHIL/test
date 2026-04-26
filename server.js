const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("Enter a URL");

    // Extract the base domain (e.g., https://2048game.com)
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;

    return createProxyMiddleware({
        target: origin,
        changeOrigin: true,
        followRedirects: true,
        // This fixes the "jumble" by forcing headers to match the game site
        onProxyReq: (proxyReq) => {
            proxyReq.setHeader('origin', origin);
            proxyReq.setHeader('referer', origin);
        },
        onProxyRes: (proxyRes) => {
            // Delete security that blocks images and frames
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            delete proxyRes.headers['content-security-policy-report-only'];
        },
        pathRewrite: () => urlObj.pathname + urlObj.search, 
    })(req, res, next);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
