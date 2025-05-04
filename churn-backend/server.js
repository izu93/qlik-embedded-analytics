const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Enable CORS for all origins (adjust for prod)
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Health check route
app.get('/', (req, res) => {
  res.send('Backend is running on http://localhost:3000');
});

// Save endpoint for writeback
app.post('/save', (req, res) => {
  const data = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  console.log('Received writeback data:', data);

  // Simulate save (could write to file, DB, etc.)
  res.status(200).json({ message: 'Data saved successfully!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//Save to a file (e.g., writeback.json or .csv)
const fs = require('fs');
fs.writeFileSync('writeback.json', JSON.stringify(data, null, 2));
