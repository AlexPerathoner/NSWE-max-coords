const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Path to the coordinates.json file
const dataFilePath = path.join(__dirname, 'data', 'coordinates.json');

// Get points data
app.get('/api/points', (req, res) => {
  console.log('GET /api/points');
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }
    res.json(JSON.parse(data)[req.query.user]);
  });
});

// Update points data
app.post('/api/points', (req, res) => {
  console.log('POST /api/points');
  const updatedData = req.body;
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }
    const existingData = JSON.parse(data);
    const user = req.query.user;
    existingData[user] = updatedData['updatedPoints'];
    fs.writeFile(dataFilePath, JSON.stringify(existingData, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to write data' });
      }
      res.json({ success: true });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
