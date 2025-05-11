const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all vet visits
router.get('/', (req, res) => {
  db.query('SELECT * FROM VetVisit', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});



router.get('/visit', (req, res) => {
  const sql=`SELECT 
  V.VisitID AS VisitID, 
  P.Name AS PetName, 
  W.Name AS VetName, 
  V.VisitDate AS VisitDate, 
  V.Reason AS Reason 
FROM VetVisit V
JOIN Pet P ON V.PetID = P.PetID
JOIN Veterinarian W ON V.VetID = W.VetID;

`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

router.get('/total', (req, res) => {
  const sql = 'SELECT COUNT(*) AS total FROM VetVisit';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch total vet visits' });
    }
    res.json({ total: results[0].total });
  });
});


// Add a new vet visit
router.post('/add', (req, res) => {
  const { VisitID,PetID, VetID, VisitDate, Reason, Treatment } = req.body;
  const sql = 'INSERT INTO VetVisit (VisitID,PetID, VetID, VisitDate, Reason, Treatment) VALUES (?, ?, ?, ?, ?,?)';
  db.query(sql, [VisitID,PetID, VetID, VisitDate, Reason, Treatment], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Vet visit added successfully', result });
  });
});

// Delete a vet visit
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM VetVisit WHERE VisitID = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Vet visit deleted successfully', result });
  });
});

module.exports = router;
