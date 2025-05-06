const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('engineering.csv')
  .pipe(csv())
  .on('data', (row) => {
    results.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      item_number: row['Item Number'],
      item: row['Item'],
      amount: parseFloat(row['Price'].replace(/\$/g, '')) || 0,
      month: row['Month of Purchase'],
      purchase_date: row['Date of Purchase'],
      category: row['Category'],
      order_number: row['Order Number'],
      quantity: parseInt(row['Quantity']) || 0
    });
  })
  .on('end', () => {
    fs.writeFileSync('purchases.json', JSON.stringify(results, null, 2));
    console.log('✅ CSV imported to purchases.json');
  });