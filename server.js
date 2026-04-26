const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// This acts like the PowerPoint engine
app.use('/service', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.send("Enter a URL");

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        followRedirects: true,
        pathRewrite: { '^/service': '' },
        onProxyRes: (proxyRes) => {
            // This "kills" the security headers that cause white screens
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
        },
        onError: (err, req, res) => {
            res.status(500).send("Proxy error: " + err.message);
        }
    })(req, res, next);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
