// Babies endpoints without Express
const jwt = require('jsonwebtoken');

// In-memory storage (shared across function calls)
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

// Helper to verify JWT token
function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded.userId;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

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
  console.log('Babies API called:', { method, url });
  console.log('Authorization header:', req.headers['authorization']);

  try {
    // Verify authentication for all baby operations
    const userId = verifyToken(req);
    console.log('Authenticated user:', userId);

    if (method === 'GET' && (url === '/api/babies' || url.startsWith('/api/babies?') || url.includes('babies'))) {
      // Get all babies for user
      const userBabies = babies.filter(baby => baby.user_id === userId);
      console.log('Found babies for user:', userBabies.length);
      
      res.json(userBabies);

    } else if (method === 'POST' && (url === '/api/babies' || url.includes('babies'))) {
      // Add new baby
      const { name, birthDate } = await parseBody(req);
      
      console.log('Add baby request:', { name, birthDate, userId });

      if (!name) {
        return res.status(400).json({ error: 'Baby name is required' });
      }

      // Check if user already has 5 babies
      const userBabies = babies.filter(baby => baby.user_id === userId);
      if (userBabies.length >= 5) {
        return res.status(400).json({ error: 'Maximum of 5 babies allowed per user' });
      }

      // Create new baby
      const newBaby = {
        id: babyIdCounter++,
        user_id: userId,
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

    } else if (method === 'PUT' && url.startsWith('/api/babies/')) {
      // Update baby
      const babyId = parseInt(url.split('/')[3]);
      const { name, birthDate } = await parseBody(req);

      console.log('Update baby request:', { babyId, name, birthDate, userId });

      if (!name) {
        return res.status(400).json({ error: 'Baby name is required' });
      }

      // Find baby and verify ownership
      const babyIndex = babies.findIndex(baby => baby.id === babyId && baby.user_id === userId);
      if (babyIndex === -1) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      // Update baby
      babies[babyIndex] = {
        ...babies[babyIndex],
        name,
        birth_date: birthDate || null
      };

      console.log('Baby updated successfully:', babyId);

      res.json({
        message: 'Baby updated successfully',
        baby: babies[babyIndex]
      });

    } else if (method === 'DELETE' && url.startsWith('/api/babies/')) {
      // Delete baby
      const babyId = parseInt(url.split('/')[3]);

      console.log('Delete baby request:', { babyId, userId });

      // Find baby and verify ownership
      const babyIndex = babies.findIndex(baby => baby.id === babyId && baby.user_id === userId);
      if (babyIndex === -1) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      // Delete baby (and associated sleep records would be handled here)
      babies.splice(babyIndex, 1);
      console.log('Baby deleted successfully:', babyId);

      res.json({ message: 'Baby deleted successfully' });

    } else {
      console.log('No route matched for:', { method, url });
      res.status(404).json({ error: 'Route not found', debug: { method, url } });
    }

  } catch (authError) {
    console.error('Auth error:', authError.message);
    if (authError.message === 'Access token required') {
      res.status(401).json({ error: authError.message });
    } else {
      res.status(403).json({ error: authError.message });
    }
  } catch (error) {
    console.error('Babies API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};