import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 7860;
const TARGET_PORT = 7861;

// 1. Verbose Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 🔍 REQUEST: ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// 2. Health check for Hugging Face
app.get('/', (req, res) => {
    res.status(200).send('✅ Omni Agent is healthy and listening.');
});

// 3. Proxy all other requests to LangGraph
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
