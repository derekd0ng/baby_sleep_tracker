// Sleep endpoints without Express
const jwt = require('jsonwebtoken');

// In-memory storage (shared across function calls)
let sleepRecords = [];
let sleepIdCounter = 1;

// Import babies from the babies module (we'll need to share this data)
// For now, we'll use a separate babies array here as a workaround
let babies = [];

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

// Helper to verify baby ownership
function verifyBabyOwnership(babyId, userId) {
  // For now, we'll trust the baby exists if it's a valid ID
  // In a real app, this would check the database
  return true; // Simplified for now
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
    // Verify authentication
    const userId = verifyToken(req);
    console.log('Authenticated user for sleep:', userId);

    if (method === 'GET' && url.match(/\/api\/sleep\/baby\/(\d+)$/)) {
      // Get sleep records for a baby
      const babyId = parseInt(url.split('/')[4]);
      
      // Verify baby ownership (simplified)
      if (!verifyBabyOwnership(babyId, userId)) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      const babySleepRecords = sleepRecords
        .filter(record => record.baby_id === babyId)
        .sort((a, b) => {
          if (a.sleep_date !== b.sleep_date) {
            return new Date(b.sleep_date) - new Date(a.sleep_date);
          }
          return b.start_time.localeCompare(a.start_time);
        });

      console.log('Found sleep records:', babySleepRecords.length);
      res.json(babySleepRecords);

    } else if (method === 'GET' && url.match(/\/api\/sleep\/baby\/(\d+)\/daily-totals/)) {
      // Get daily totals for charts
      const babyId = parseInt(url.split('/')[4]);
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const startDate = urlParams.get('startDate');
      const endDate = urlParams.get('endDate');

      console.log('Daily totals request:', { babyId, startDate, endDate });

      // Verify baby ownership (simplified)
      if (!verifyBabyOwnership(babyId, userId)) {
        return res.status(404).json({ error: 'Baby not found' });
      }

      // Filter sleep records by date range
      const filteredRecords = sleepRecords.filter(record => 
        record.baby_id === babyId &&
        (!startDate || record.sleep_date >= startDate) &&
        (!endDate || record.sleep_date <= endDate)
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

      console.log('Daily totals calculated:', result.length);
      res.json(result);

    } else if (method === 'POST' && url === '/api/sleep') {
      // Add new sleep record
      const { babyId, sleepDate, startTime, endTime, label, notes } = await parseBody(req);

      console.log('Add sleep record:', { babyId, sleepDate, startTime, endTime, label });

      if (!babyId || !sleepDate || !startTime || !endTime || !label) {
        return res.status(400).json({ 
          error: 'Baby ID, sleep date, start time, end time, and label are required' 
        });
      }

      // Verify baby ownership (simplified)
      if (!verifyBabyOwnership(babyId, userId)) {
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
      console.log('Sleep record added:', newSleepRecord.id);

      res.status(201).json({
        message: 'Sleep record added successfully',
        sleepRecord: newSleepRecord
      });

    } else if (method === 'PUT' && url.match(/\/api\/sleep\/(\d+)$/)) {
      // Update sleep record
      const recordId = parseInt(url.split('/')[3]);
      const { sleepDate, startTime, endTime, label, notes } = await parseBody(req);

      console.log('Update sleep record:', { recordId, sleepDate, startTime, endTime, label });

      if (!sleepDate || !startTime || !endTime || !label) {
        return res.status(400).json({ 
          error: 'Sleep date, start time, end time, and label are required' 
        });
      }

      // Find sleep record (simplified ownership check)
      const recordIndex = sleepRecords.findIndex(record => record.id === recordId);
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

      console.log('Sleep record updated:', recordId);

      res.json({
        message: 'Sleep record updated successfully',
        sleepRecord: sleepRecords[recordIndex]
      });

    } else if (method === 'DELETE' && url.match(/\/api\/sleep\/(\d+)$/)) {
      // Delete sleep record
      const recordId = parseInt(url.split('/')[3]);

      console.log('Delete sleep record:', recordId);

      // Find sleep record (simplified ownership check)
      const recordIndex = sleepRecords.findIndex(record => record.id === recordId);
      if (recordIndex === -1) {
        return res.status(404).json({ error: 'Sleep record not found' });
      }

      // Delete sleep record
      sleepRecords.splice(recordIndex, 1);
      console.log('Sleep record deleted:', recordId);

      res.json({ message: 'Sleep record deleted successfully' });

    } else {
      res.status(404).json({ error: 'Route not found' });
    }

  } catch (authError) {
    console.error('Auth error:', authError.message);
    if (authError.message === 'Access token required') {
      res.status(401).json({ error: authError.message });
    } else {
      res.status(403).json({ error: authError.message });
    }
  } catch (error) {
    console.error('Sleep API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};