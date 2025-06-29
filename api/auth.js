// Auth endpoints without Express
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory storage (will be shared across function calls in same container)
let users = [];
let userIdCounter = 1;

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
    if (method === 'POST' && url === '/api/auth/register') {
      const { username, password, motherName } = await parseBody(req);

      console.log('Registration attempt:', { username, motherName });

      // Validation
      if (!username || !password || !motherName) {
        return res.status(400).json({ error: 'Username, password, and mother name are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if username exists
      const existingUser = users.find(user => user.username === username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = {
        id: userIdCounter++,
        username,
        password_hash: passwordHash,
        mother_name: motherName,
        created_at: new Date().toISOString()
      };

      users.push(newUser);

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username },
        jwtSecret,
        { expiresIn: '24h' }
      );

      console.log('Registration successful for:', username);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          motherName: newUser.mother_name
        }
      });

    } else if (method === 'POST' && url === '/api/auth/login') {
      const { username, password } = await parseBody(req);

      console.log('Login attempt:', { username });

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user
      const user = users.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        jwtSecret,
        { expiresIn: '24h' }
      );

      console.log('Login successful for:', username);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          motherName: user.mother_name
        }
      });

    } else if (method === 'GET' && url === '/api/auth/status') {
      // Status endpoint
      res.json({
        status: 'OK',
        userCount: users.length,
        timestamp: new Date().toISOString()
      });

    } else {
      res.status(404).json({ error: 'Route not found' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};