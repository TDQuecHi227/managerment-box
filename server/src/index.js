const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const clonesRoutes = require('./routes/clones');
const donationsRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('Fatal: Failed to connect to MongoDB:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for uploaded proof images
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clones', clonesRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend dist if built
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Đã xảy ra lỗi máy chủ nội bộ.'
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Box Chat Management API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

