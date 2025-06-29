const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, motherName } = req.body;

    if (!username || !password || !motherName) {
      return res.status(400).json({ error: 'Username, password, and mother name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, mother_name) VALUES ($1, $2, $3) RETURNING id, username, mother_name',
      [username, passwordHash, motherName]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        motherName: user.mother_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, mother_name FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        motherName: user.mother_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Babies routes
app.get('/babies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, birth_date, created_at FROM babies WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get babies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/babies', authenticateToken, async (req, res) => {
  try {
    const { name, birthDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Baby name is required' });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM babies WHERE user_id = $1',
      [req.userId]
    );

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 babies allowed per user' });
    }

    const result = await pool.query(
      'INSERT INTO babies (user_id, name, birth_date) VALUES ($1, $2, $3) RETURNING id, name, birth_date, created_at',
      [req.userId, name, birthDate || null]
    );

    res.status(201).json({
      message: 'Baby added successfully',
      baby: result.rows[0]
    });
  } catch (error) {
    console.error('Add baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/babies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, birthDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Baby name is required' });
    }

    const ownershipCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    const result = await pool.query(
      'UPDATE babies SET name = $1, birth_date = $2 WHERE id = $3 AND user_id = $4 RETURNING id, name, birth_date, created_at',
      [name, birthDate || null, id, req.userId]
    );

    res.json({
      message: 'Baby updated successfully',
      baby: result.rows[0]
    });
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/babies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ownershipCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    await pool.query('DELETE FROM babies WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: 'Baby deleted successfully' });
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sleep routes
app.get('/sleep/baby/:babyId', authenticateToken, async (req, res) => {
  try {
    const { babyId } = req.params;

    const babyCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [babyId, req.userId]
    );

    if (babyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    const result = await pool.query(
      `SELECT id, sleep_date, start_time, end_time, label, duration_minutes, notes, created_at 
       FROM sleep_records 
       WHERE baby_id = $1 
       ORDER BY sleep_date DESC, start_time DESC`,
      [babyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sleep records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/sleep/baby/:babyId/daily-totals', authenticateToken, async (req, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    const babyCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [babyId, req.userId]
    );

    if (babyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    const result = await pool.query(
      `SELECT 
         sleep_date,
         SUM(duration_minutes) as total_minutes,
         COUNT(*) as sleep_count
       FROM sleep_records 
       WHERE baby_id = $1 AND sleep_date BETWEEN $2 AND $3
       GROUP BY sleep_date
       ORDER BY sleep_date ASC`,
      [babyId, startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get daily totals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/sleep', authenticateToken, async (req, res) => {
  try {
    const { babyId, sleepDate, startTime, endTime, label, notes } = req.body;

    if (!babyId || !sleepDate || !startTime || !endTime || !label) {
      return res.status(400).json({ 
        error: 'Baby ID, sleep date, start time, end time, and label are required' 
      });
    }

    const babyCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [babyId, req.userId]
    );

    if (babyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    const result = await pool.query(
      `INSERT INTO sleep_records (baby_id, sleep_date, start_time, end_time, label, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, sleep_date, start_time, end_time, label, duration_minutes, notes, created_at`,
      [babyId, sleepDate, startTime, endTime, label, notes || null]
    );

    res.status(201).json({
      message: 'Sleep record added successfully',
      sleepRecord: result.rows[0]
    });
  } catch (error) {
    console.error('Add sleep record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/sleep/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sleepDate, startTime, endTime, label, notes } = req.body;

    if (!sleepDate || !startTime || !endTime || !label) {
      return res.status(400).json({ 
        error: 'Sleep date, start time, end time, and label are required' 
      });
    }

    const ownershipCheck = await pool.query(
      `SELECT sr.id FROM sleep_records sr 
       JOIN babies b ON sr.baby_id = b.id 
       WHERE sr.id = $1 AND b.user_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    const result = await pool.query(
      `UPDATE sleep_records 
       SET sleep_date = $1, start_time = $2, end_time = $3, label = $4, notes = $5 
       WHERE id = $6 
       RETURNING id, sleep_date, start_time, end_time, label, duration_minutes, notes, created_at`,
      [sleepDate, startTime, endTime, label, notes || null, id]
    );

    res.json({
      message: 'Sleep record updated successfully',
      sleepRecord: result.rows[0]
    });
  } catch (error) {
    console.error('Update sleep record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/sleep/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const ownershipCheck = await pool.query(
      `SELECT sr.id FROM sleep_records sr 
       JOIN babies b ON sr.baby_id = b.id 
       WHERE sr.id = $1 AND b.user_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    await pool.query('DELETE FROM sleep_records WHERE id = $1', [id]);
    res.json({ message: 'Sleep record deleted successfully' });
  } catch (error) {
    console.error('Delete sleep record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;