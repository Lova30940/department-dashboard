const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILES = {
  engineering: './purchases-engineering.json',
  housekeeping: './purchases-housekeeping.json',
  frontdesk: './purchases-frontdesk.json'
};

let deletedStack = [];

app.use(express.static('public'));
app.use(express.json());

// Load purchases for the specified department
function loadData(department) {
  const file = DATA_FILES[department];
  if (!file || !fs.existsSync(file)) return [];
  const data = fs.readFileSync(file);
  return JSON.parse(data);
}

// Save purchases for the specified department
function saveData(department, data) {
  const file = DATA_FILES[department];
  if (file) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

// API to get purchases for a specific department
app.get('/api/purchases/:department', (req, res) => {
  const department = req.params.department;
  const data = loadData(department);
  res.json(data);
});

// API to add a purchase to a specific department
app.post('/api/purchases/:department', (req, res) => {
  const department = req.params.department;
  const data = loadData(department);
  const newItem = { id: Date.now(), ...req.body };
  data.push(newItem);
  saveData(department, data);
  res.json({ status: 'ok' });
});

// API to delete a purchase from a specific department
app.delete('/api/purchases/:department/:id', (req, res) => {
  const department = req.params.department;
  const data = loadData(department);
  const id = parseInt(req.params.id);
  const index = data.findIndex(p => p.id === id);

  if (index !== -1) {
    const deleted = data.splice(index, 1)[0];
    deletedStack.unshift({ department, ...deleted });
    if (deletedStack.length > 10) deletedStack.pop();
    saveData(department, data);
    res.json({ status: 'deleted' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// API to recover the last deleted purchase
app.post('/api/recover', (req, res) => {
  if (deletedStack.length === 0) {
    return res.status(400).json({ error: 'Nothing to recover' });
  }

  const recovered = deletedStack.shift();
  const department = recovered.department;
  delete recovered.department;

  const data = loadData(department);
  data.push(recovered);
  saveData(department, data);
  res.json({ status: 'recovered' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
