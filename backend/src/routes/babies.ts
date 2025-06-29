import express from 'express';
import pool from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all babies for a user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
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

// Add a new baby
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, birthDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Baby name is required' });
    }

    // Check if user already has 5 babies
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM babies WHERE user_id = $1',
      [req.userId]
    );

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 babies allowed per user' });
    }

    // Insert new baby
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

// Update a baby
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, birthDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Baby name is required' });
    }

    // Check if baby belongs to the user
    const ownershipCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Update baby
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

// Delete a baby
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if baby belongs to the user
    const ownershipCheck = await pool.query(
      'SELECT id FROM babies WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Baby not found' });
    }

    // Delete baby (this will cascade delete sleep records)
    await pool.query('DELETE FROM babies WHERE id = $1 AND user_id = $2', [id, req.userId]);

    res.json({ message: 'Baby deleted successfully' });
  } catch (error) {
    console.error('Delete baby error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;