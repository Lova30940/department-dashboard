const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = './purchases.json';
let deletedStack = [];

app.use(express.static('public'));
app.use(express.json());

// Load purchases from file
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

// Save purchases to file
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/purchases', (req, res) => {
  res.json(loadData());
});

app.post('/api/purchases', (req, res) => {
  const data = loadData();
  const newItem = { id: Date.now(), ...req.body };
  data.push(newItem);
  saveData(data);
  res.json({ status: 'ok' });
});

app.delete('/api/purchases/:id', (req, res) => {
  const data = loadData();
  const id = parseInt(req.params.id);
  const index = data.findIndex(p => p.id === id);
  if (index !== -1) {
    const deleted = data.splice(index, 1)[0];
    deletedStack.unshift(deleted);
    if (deletedStack.length > 10) deletedStack.pop();
    saveData(data);
    res.json({ status: 'deleted' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.post('/api/recover', (req, res) => {
  if (deletedStack.length === 0) {
    return res.status(400).json({ error: 'Nothing to recover' });
  }
  const recovered = deletedStack.shift();
  const data = loadData();
  data.push(recovered);
  saveData(data);
  res.json({ status: 'recovered' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));