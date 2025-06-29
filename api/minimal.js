// Minimal Express app for testing
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Minimal Express app working',
    timestamp: new Date().toISOString()
  });
});

app.post('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'POST test working',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;