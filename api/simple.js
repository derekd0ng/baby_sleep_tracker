// Simple serverless function without Express
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  
  try {
    if (method === 'GET' && url === '/api/simple') {
      // Health check
      res.json({
        status: 'OK',
        message: 'Simple serverless function working',
        timestamp: new Date().toISOString(),
        method,
        url
      });
    } else if (method === 'POST' && url === '/api/simple') {
      // Test POST
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.json({
            status: 'OK',
            message: 'POST received',
            receivedData: data,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          res.json({
            status: 'OK',
            message: 'POST received (non-JSON)',
            receivedBody: body,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      res.status(404).json({
        error: 'Route not found',
        method,
        url,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};