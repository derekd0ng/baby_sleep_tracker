// Simple test endpoint to debug babies API
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
  console.log('Test babies API called:', { method, url });
  console.log('All headers:', req.headers);

  try {
    if (method === 'GET') {
      // Return test data without authentication
      const testBabies = [
        {
          id: 1,
          user_id: 1,
          name: 'Test Baby',
          birth_date: '2024-01-01',
          created_at: new Date().toISOString()
        }
      ];

      console.log('Returning test babies:', testBabies);
      res.json(testBabies);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Test babies API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
};