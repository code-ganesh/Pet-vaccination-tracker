const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all vet visits
router.get('/', (req, res) => {
  db.query('SELECT * FROM vaccinationschedule', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

//export csv


router.get('/export', (req, res) => {
  const sql = 'SELECT * FROM vaccinationschedule';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to export pets' });
    }

    // Generate CSV content with proper quoting
    const headers = ['VaccineID', 'VaccineName', 'Species', 'RecommendedAgeMonths', 'BoosterIntervalMonths', 'Stock', 'UsageCount', 'LastRestocked', 'Description'];

    // Function to escape CSV fields
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      value = value.toString();
      
      // Escape double quotes
      value = value.replace(/"/g, '""');

      // If the value contains commas, newlines, or double quotes, wrap it in double quotes
      if (value.indexOf(',') > -1 || value.indexOf('\n') > -1 || value.indexOf('"') > -1) {
        return `"${value}"`;
      }
      return value;
    };

    // Convert the result into CSV format
    const rows = results.map(vaccinationschedule => 
      headers.map(header => escapeCSV(vaccinationschedule[header])).join(',')
    );

    // Add the headers and rows to the CSV content
    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');

    // Send CSV response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vaccine.csv');
    res.send(csvContent);
  });
});





router.get('/vaccine-data', async (req, res) => {
  try {
    const vaccines = await db.promise().query(`
      SELECT VaccineID, VaccineName, Species, RecommendedAgeMonths, BoosterIntervalMonths, Stock, UsageCount, LastRestocked, Description 
      FROM vaccinationschedule
    `);

    const lowAndOutStock = await db.promise().query(`
      SELECT VaccineName, MIN(Stock) AS Stock 
FROM vaccinationschedule 
WHERE Stock < 5 
GROUP BY VaccineName;

    `);

    const mostUsedVaccine = await db.promise().query(`
      SELECT * 
      FROM vaccinationschedule 
      ORDER BY UsageCount DESC 
      LIMIT 1
    `);

    const lowStock = [];
    const outStock = [];

    lowAndOutStock[0].forEach((item) => {
      if (item.Stock < 0) outStock.push(item.VaccineName);
      else lowStock.push(item.VaccineName);
    });

    res.json({
      vaccines: vaccines[0],
      lowStock,
      outStock,
      mostUsedVaccine: mostUsedVaccine[0][0] || null,
    });
  } catch (error) {
    console.error('Error fetching vaccine data:', error);
    res.status(500).json({ message: 'Error fetching vaccine data' });
  }
});







router.get('/total', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM vaccinationschedule';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch total vet visits' });
    }
    res.json({ total: results[0].total });
  });
});


// Add a new vet visit
router.post('/add', async (req, res) => {
  const { VaccineID, VaccineName, Species, RecommendedAgeMonths, BoosterIntervalMonths, LastRestocked, Description } = req.body;

  // SQL query to insert a new record into the vaccination schedule
  const insertSql = `
    INSERT INTO vaccinationschedule 
    (VaccineID, VaccineName, Species, RecommendedAgeMonths, BoosterIntervalMonths, LastRestocked, Description) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // SQL query to increment the UsageCount for all records with the same VaccineName
  const updateSql = `
    UPDATE vaccinationschedule 
    SET Stock=Stock+1
    WHERE VaccineName = ?
  `;

  try {
    // Insert the new record
    const insertResult = await new Promise((resolve, reject) => {
      db.query(insertSql, [VaccineID, VaccineName, Species, RecommendedAgeMonths, BoosterIntervalMonths, LastRestocked, Description], (insertErr, result) => {
        if (insertErr) {
          return reject(insertErr); // Reject if insertion fails
        }
        resolve(result); // Resolve if insertion succeeds
      });
    });

    // Increment the UsageCount for all records with the same VaccineName
    const updateResult = await new Promise((resolve, reject) => {
      db.query(updateSql, [VaccineName], (updateErr, result) => {
        if (updateErr) {
          return reject(updateErr); // Reject if update fails
        }
        resolve(result); // Resolve if update succeeds
      });
    });

    // Send success response
    res.json({
      message: 'Vaccination schedule added and UsageCount updated successfully for all matching VaccineName records',
      insertResult,
      updateResult,
    });
  } catch (err) {
    // Handle any errors in the try block
    console.error('Error occurred:', err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});




// Delete a vet visit
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM vaccinationschedule WHERE VaccineID = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Vet visit deleted successfully', result });
  });
});

module.exports = router;
