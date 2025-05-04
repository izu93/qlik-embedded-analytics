const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let writebackData = [];

try {
  writebackData = JSON.parse(fs.readFileSync('data.json'));
} catch {
  writebackData = [];
}

// Get current writeback data
app.get('/data', (req, res) => {
  res.json(writebackData);
});

// Save writeback data
app.post('/save', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).send('Invalid payload');
  }

  writebackData = data;
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  res.send({ success: true, message: 'Data saved successfully' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
