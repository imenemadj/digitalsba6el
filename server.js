const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Serve static files first
app.use(express.static(path.join(__dirname)));

// SPA fallback - serve index.html for any route that doesn't match a static file
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Refund application page: http://localhost:${PORT}/refundapplication`);
  console.log(`Admin page: http://localhost:${PORT}/admin`);
});
