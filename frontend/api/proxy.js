// frontend/api/proxy.js

export default async function handler(req, res) {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
        return res.status(500).json({ error: 'BACKEND_URL environment variable is not defined' });
    }

    // Extract the API path after /api
    const subPath = req.url.startsWith('/api') ? req.url.slice(4) : req.url;
    const targetUrl = `${backendUrl}/api${subPath}`;

    // Clone headers and remove host to avoid SSL handshake issues
    const headers = { ...req.headers };
    delete headers.host;

    try {
        const options = {
            method: req.method,
            headers: headers,
        };

        // Forward request body for modifying requests
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            // Read body as text/json
            if (req.body) {
                options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
            }
        }

        const backendResponse = await fetch(targetUrl, options);
        
        // Copy headers from backend response
        backendResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(backendResponse.status);

        const contentType = backendResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await backendResponse.json();
            return res.json(json);
        } else {
            const text = await backendResponse.text();
            return res.send(text);
        }
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Failed to proxy request', details: error.message });
    }
}
