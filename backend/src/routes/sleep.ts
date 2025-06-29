import express from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all sleep records for a baby
router.get('/baby/:babyId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { babyId } = req.params;

    // Verify baby belongs to user
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

// Get sleep records for a date range
router.get('/baby/:babyId/range', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify baby belongs to user
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
       WHERE baby_id = $1 AND sleep_date BETWEEN $2 AND $3
       ORDER BY sleep_date DESC, start_time DESC`,
      [babyId, startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sleep records by range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily sleep totals for chart
router.get('/baby/:babyId/daily-totals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { babyId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify baby belongs to user
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

// Add a new sleep record
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { babyId, sleepDate, startTime, endTime, label, notes } = req.body;

    if (!babyId || !sleepDate || !startTime || !endTime || !label) {
      return res.status(400).json({ 
        error: 'Baby ID, sleep date, start time, end time, and label are required' 
      });
    }

    // Verify baby belongs to user
    const babyCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [babyId, req.userId]
    );

    if (babyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Insert new sleep record
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

// Update a sleep record
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { sleepDate, startTime, endTime, label, notes } = req.body;

    if (!sleepDate || !startTime || !endTime || !label) {
      return res.status(400).json({ 
        error: 'Sleep date, start time, end time, and label are required' 
      });
    }

    // Check if sleep record belongs to user (through baby ownership)
    const ownershipCheck = await pool.query(
      `SELECT sr.id FROM sleep_records sr 
       JOIN babies b ON sr.baby_id = b.id 
       WHERE sr.id = $1 AND b.user_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    // Update sleep record
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

// Delete a sleep record
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if sleep record belongs to user (through baby ownership)
    const ownershipCheck = await pool.query(
      `SELECT sr.id FROM sleep_records sr 
       JOIN babies b ON sr.baby_id = b.id 
       WHERE sr.id = $1 AND b.user_id = $2`,
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    // Delete sleep record
    await pool.query('DELETE FROM sleep_records WHERE id = $1', [id]);

    res.json({ message: 'Sleep record deleted successfully' });
  } catch (error) {
    console.error('Delete sleep record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;