const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// In-memory storage (temporary - will be replaced with database)
let users = [];
let babies = [];
let sleepRecords = [];
let userIdCounter = 1;
let babyIdCounter = 1;
let sleepIdCounter = 1;

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

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
  
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    storage: 'in-memory',
    users: users.length,
    babies: babies.length,
    sleepRecords: sleepRecords.length
  });
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

    // Check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: userIdCounter++,
      username,
      password_hash: passwordHash,
      mother_name: motherName,
      created_at: new Date().toISOString()
    };

    users.push(newUser);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        motherName: newUser.mother_name
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

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
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
    const userBabies = babies.filter(baby => baby.user_id === req.userId);
    res.json(userBabies);
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

    // Check if user already has 5 babies
    const userBabies = babies.filter(baby => baby.user_id === req.userId);
    if (userBabies.length >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 babies allowed per user' });
    }

    // Create new baby
    const newBaby = {
      id: babyIdCounter++,
      user_id: req.userId,
      name,
      birth_date: birthDate || null,
      created_at: new Date().toISOString()
    };

    babies.push(newBaby);

    res.status(201).json({
      message: 'Baby added successfully',
      baby: newBaby
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

    // Find baby and verify ownership
    const babyIndex = babies.findIndex(baby => baby.id === parseInt(id) && baby.user_id === req.userId);
    if (babyIndex === -1) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Update baby
    babies[babyIndex] = {
      ...babies[babyIndex],
      name,
      birth_date: birthDate || null
    };

    res.json({
      message: 'Baby updated successfully',
      baby: babies[babyIndex]
    });
  } catch (error) {
    console.error('Update baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/babies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find baby and verify ownership
    const babyIndex = babies.findIndex(baby => baby.id === parseInt(id) && baby.user_id === req.userId);
    if (babyIndex === -1) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Delete baby and associated sleep records
    babies.splice(babyIndex, 1);
    sleepRecords = sleepRecords.filter(record => record.baby_id !== parseInt(id));

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

    // Verify baby belongs to user
    const baby = babies.find(b => b.id === parseInt(babyId) && b.user_id === req.userId);
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Get sleep records for this baby
    const babySleepRecords = sleepRecords
      .filter(record => record.baby_id === parseInt(babyId))
      .sort((a, b) => {
        if (a.sleep_date !== b.sleep_date) {
          return new Date(b.sleep_date) - new Date(a.sleep_date);
        }
        return b.start_time.localeCompare(a.start_time);
      });

    res.json(babySleepRecords);
  } catch (error) {
    console.error('Get sleep records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/sleep/baby/:babyId/daily-totals', authenticateToken, async (req, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify baby belongs to user
    const baby = babies.find(b => b.id === parseInt(babyId) && b.user_id === req.userId);
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Filter sleep records by date range
    const filteredRecords = sleepRecords.filter(record => 
      record.baby_id === parseInt(babyId) &&
      record.sleep_date >= startDate &&
      record.sleep_date <= endDate
    );

    // Group by date and calculate totals
    const dailyTotals = {};
    filteredRecords.forEach(record => {
      if (!dailyTotals[record.sleep_date]) {
        dailyTotals[record.sleep_date] = {
          sleep_date: record.sleep_date,
          total_minutes: 0,
          sleep_count: 0
        };
      }
      dailyTotals[record.sleep_date].total_minutes += record.duration_minutes;
      dailyTotals[record.sleep_date].sleep_count += 1;
    });

    // Convert to array and sort by date
    const result = Object.values(dailyTotals).sort((a, b) => 
      new Date(a.sleep_date) - new Date(b.sleep_date)
    );

    res.json(result);
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

    // Verify baby belongs to user
    const baby = babies.find(b => b.id === parseInt(babyId) && b.user_id === req.userId);
    if (!baby) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Calculate duration in minutes
    const start = new Date(`${sleepDate}T${startTime}`);
    const end = new Date(`${sleepDate}T${endTime}`);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    // Create new sleep record
    const newSleepRecord = {
      id: sleepIdCounter++,
      baby_id: parseInt(babyId),
      sleep_date: sleepDate,
      start_time: startTime,
      end_time: endTime,
      label,
      duration_minutes: durationMinutes,
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    sleepRecords.push(newSleepRecord);

    res.status(201).json({
      message: 'Sleep record added successfully',
      sleepRecord: newSleepRecord
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

    // Find sleep record and verify ownership through baby
    const recordIndex = sleepRecords.findIndex(record => {
      if (record.id !== parseInt(id)) return false;
      const baby = babies.find(b => b.id === record.baby_id && b.user_id === req.userId);
      return baby !== undefined;
    });

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    // Calculate new duration
    const start = new Date(`${sleepDate}T${startTime}`);
    const end = new Date(`${sleepDate}T${endTime}`);
    const durationMinutes = Math.round((end - start) / (1000 * 60));

    // Update sleep record
    sleepRecords[recordIndex] = {
      ...sleepRecords[recordIndex],
      sleep_date: sleepDate,
      start_time: startTime,
      end_time: endTime,
      label,
      duration_minutes: durationMinutes,
      notes: notes || null
    };

    res.json({
      message: 'Sleep record updated successfully',
      sleepRecord: sleepRecords[recordIndex]
    });
  } catch (error) {
    console.error('Update sleep record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/sleep/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find sleep record and verify ownership through baby
    const recordIndex = sleepRecords.findIndex(record => {
      if (record.id !== parseInt(id)) return false;
      const baby = babies.find(b => b.id === record.baby_id && b.user_id === req.userId);
      return baby !== undefined;
    });

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    // Delete sleep record
    sleepRecords.splice(recordIndex, 1);

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