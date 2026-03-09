import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 7860;
const TARGET_PORT = 7861;

// 1. Bulletproof Health Check
app.all('*', (req, res, next) => {
    const path = req.path;
    if (path === '/' || path === '/health' || path === '/ping') {
        console.log(`📡 PROXY: Health check received on ${path} - Sending 200 OK`);
        return res.status(200).send('✅ Omni Agent is healthy and listening. Ready to post!');
    }
    next();
});

// 2. Transparent Proxy for everything else
app.use('/', createProxyMiddleware({
    target: `http://localhost:${TARGET_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
        console.error('❌ PROXY_ERROR:', err);
        res.status(502).send('AI Engine is still warming up. Please refresh in 30 seconds.');
    }
}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`==========================================`);
    console.log(`📡 PROXY: Listening on 0.0.0.0:${PORT}`);
    console.log(`🔗 TARGET: http://localhost:${TARGET_PORT}`);
    console.log(`==========================================`);
});
