require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files if explicitly enabled (e.g. for combined local testing)
const shouldServeStatic = process.env.SERVE_STATIC === 'true';
if (shouldServeStatic) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

app.disable('x-powered-by');

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Database Connection Error:', err));

// Routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/user/profile', require('./routes/user_profile'));
app.use('/api', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/user/dashboard', require('./routes/u_dash'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/aianalysis', require('./routes/aianalysis'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/user-settings', require('./routes/user_settings'));
app.use('/api/export', require('./routes/exports'));
app.use('/api/hardware', require('./routes/user_request'));
app.use('/api/requests', require('./routes/user_request'));
app.use('/api', require('./routes/user_main'));
app.use('/api/issue-requests', require('./routes/user_issue'));

if (shouldServeStatic) {
  // React SPA fallback for combined hosting
  app.get(/.*/, (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.json({ message: "AssertIQ Backend API is running." });
    }
  });
} else {
  // Strictly Backend API Fallbacks
  app.get('/', (req, res) => {
    res.json({ status: "ok", message: "AssertIQ Backend API is running." });
  });

  // Unmatched API/route request fallback
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", message: `Cannot ${req.method} ${req.path}` });
  });
}

// Server
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log('----------------------------------------------');
  console.log(`🚀 Server is running on port: ${PORT}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Admin   → http://localhost:${PORT}/html/AdminLogin.html`);
    console.log(`User    → http://localhost:${PORT}/html/UserLogin.html`);
    console.log(`Super   → http://localhost:${PORT}/html/SuperAdminLogin.html`);
  } else {
    console.log('🌐 App is live on Render');
  }

  console.log('----------------------------------------------');
});

