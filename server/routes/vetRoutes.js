const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all vets
router.get('/', (req, res) => {
  db.query('SELECT * FROM Veterinarian', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


//total visits


router.get('/total', (req, res) => {
  const query = 'SELECT COUNT(*) AS totalVets FROM Veterinarian'; // Adjust table name if needed

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const total = results[0].totalVets;
    res.json({ total });
  });
});

// Add a new veterinarian
router.post('/add', (req, res) => {
  const { VetID,Name, ClinicName, Phone, Email } = req.body;

  if (!VetID || !Name || !ClinicName || !Phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'INSERT INTO Veterinarian (VetID,Name, ClinicName, Phone, Email) VALUES (?, ?, ?, ?,?)';
  db.query(sql, [VetID,Name, ClinicName, Phone, Email], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Veterinarian added successfully', result });
  });
});

// Delete a veterinarian


router.delete('/:id', (req, res) => {
  const { id } = req.params;
console.log(id);
  // Check if the pet is referenced in other tables
  const checkSql = 'SELECT * FROM VetVisit WHERE VetID = ?';

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database error:', checkErr);
      return res.status(500).json({ error: 'Failed to delete vet' });
    }
    if (checkResult.length > 0) {
      // vet is referenced in vetvisit table
      return res.status(400).json({ error: 'Cannot delete vet. It is referenced in vetvisit.' });
    }

    // Proceed with deleting the vet if no references exist
    const deleteSql = 'DELETE FROM Veterinarian WHERE VetID = ?';

    db.query(deleteSql, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete vet' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Vet not found' });
      }
      res.json({ message: 'Vet deleted successfully', result: deleteResult });
    });
  });
});

module.exports = router;
