const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all health records
router.get('/', (req, res) => {
  db.query('SELECT * FROM HealthRecord', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Add a new health record
router.post('/add', (req, res) => {
  const {RecordID,PetID, Conditions, DiagnosisDate, TreatmentStartDate, TreatmentEndDate, TreatmentPlan } = req.body;
  const sql = 'INSERT INTO HealthRecord (RecordID,PetID, Conditions, DiagnosisDate, TreatmentStartDate, TreatmentEndDate, TreatmentPlan) VALUES (?, ?, ?, ?, ?, ?,?)';
  db.query(sql, [RecordID,PetID, Conditions, DiagnosisDate, TreatmentStartDate, TreatmentEndDate, TreatmentPlan], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Health record added successfully', result });
  });
});

// Delete a health record
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM HealthRecord WHERE RecordID = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Health record deleted successfully', result });
  });
});


// Get latest health record
router.get('/latest', (req, res) => {
  const sql = `
    SELECT Conditions, PetID
    FROM HealthRecord
    ORDER BY DiagnosisDate DESC
    LIMIT 1
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch the latest health record' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No health records found' });
    }

    res.json({
      condition: results[0].Conditions,
      petId: results[0].PetID
    });
  });
});



module.exports = router;
