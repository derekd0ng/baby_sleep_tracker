// Babies endpoint with basic functionality (no auth for now)
let babies = [];
let babyIdCounter = 1;

// Helper to parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = async (req, res) => {
  console.log('Babies API function started');
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      res.status(200).end();
      return;
    }

    const { method, url } = req;
    console.log('Request details:', { method, url });

    if (method === 'GET') {
      console.log('Returning babies array:', babies.length);
      res.json(babies);
      return;
    }

    if (method === 'POST') {
      console.log('Processing POST request');
      const { name, birthDate } = await parseBody(req);
      console.log('Add baby request:', { name, birthDate });

      if (!name) {
        return res.status(400).json({ error: 'Baby name is required' });
      }

      // Create new baby (simplified without user_id for now)
      const newBaby = {
        id: babyIdCounter++,
        user_id: 1, // hardcoded for testing
        name,
        birth_date: birthDate || null,
        created_at: new Date().toISOString()
      };

      babies.push(newBaby);
      console.log('Baby added successfully:', newBaby.id);

      res.status(201).json({
        message: 'Baby added successfully',
        baby: newBaby
      });
      return;
    }

    if (method === 'DELETE' && url.includes('/babies/')) {
      console.log('Processing DELETE request');
      const babyId = parseInt(url.split('/').pop());
      console.log('Delete baby request:', babyId);

      const babyIndex = babies.findIndex(baby => baby.id === babyId);
      if (babyIndex === -1) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      babies.splice(babyIndex, 1);
      console.log('Baby deleted successfully:', babyId);

      res.json({ message: 'Baby deleted successfully' });
      return;
    }

    res.status(405).json({ error: 'Method not allowed', debug: { method, url } });
  } catch (error) {
    console.error('Critical error in babies API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
};