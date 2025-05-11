const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all owners
router.get('/', (req, res) => {
  db.query('SELECT * FROM Owner', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


// Fetch all owners
router.get('/owner', (req, res) => {
  const sql = `
      SELECT w.OwnerID AS id, w.email,w.address,w.name, w.phone AS contact, 
             COUNT(p.petID) AS pet_count
      FROM Owner w
      LEFT JOIN Pet p ON w.OwnerID = p.OwnerID
      GROUP BY w.OwnerID, w.name, w.phone
  `;

  db.query(sql, (err, results) => {
      if (err) {
          console.error('Error fetching owners:', err);
          return res.status(500).json({ error: 'Failed to fetch owners' });
      }
      res.json(results);
  });
});





//total-owner
router.get('/total', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM Owner';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch total owners' });
    }
    res.json({ total: results[0].total });
  });
});

// Add a new owner
router.post('/add', (req, res) => {
  const { OwnerID,Name, Phone, Email, Address } = req.body;
  const sql = 'INSERT INTO Owner (OwnerID,Name, Phone, Email, Address) VALUES (?, ?, ?, ?,?)';
  db.query(sql, [OwnerID,Name, Phone, Email, Address], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Owner added successfully', result });
  });
});

// Delete an owner


router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if the pet is referenced in other tables
  const checkSql = 'SELECT * FROM Pet WHERE OwnerID = ?';

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database error:', checkErr);
      return res.status(500).json({ error: 'Failed to delete Owner' });
    }
    if (checkResult.length > 0) {
      return res.status(400).json({ error: 'Cannot delete pet. It is referenced in Pet records.' });
    }

    // Proceed with deleting the pet if no references exist
    const deleteSql = 'DELETE FROM Owner WHERE OwnerID = ?';

    db.query(deleteSql, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete Owner' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Owner not found' });
      }
      res.json({ message: 'Owner deleted successfully', result: deleteResult });
    });
  });
});

module.exports = router;
