export default async function handler(req, res) {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
        return res.status(500).json({ error: 'BACKEND_URL environment variable is not configured.' });
    }

    // req.url contains the path and query string (e.g. "/api/tickets?page=1")
    const targetUrl = `${backendUrl}${req.url}`;

    try {
        const headers = { ...req.headers };
        // Remove host header to avoid host mismatch issues on Render
        delete headers.host;

        const options = {
            method: req.method,
            headers: headers,
        };

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            // Forward the request body if present
            options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
        }

        const backendResponse = await fetch(targetUrl, options);

        // Forward response headers
        backendResponse.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(backendResponse.status);

        const contentType = backendResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await backendResponse.json();
            res.json(data);
        } else {
            const text = await backendResponse.text();
            res.send(text);
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to forward request to backend.' });
    }
}
