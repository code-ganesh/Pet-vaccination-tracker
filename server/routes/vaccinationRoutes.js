const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get all vaccinations
router.get('/', (req, res) => {
  db.query('SELECT * FROM PetVaccination', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});



// Get latest vaccination
router.get('/latest', (req, res) => {
  const sql = `
    SELECT V.VaccineName, P.PetID 
FROM PetVaccination P
JOIN VaccinationSchedule V ON P.VaccineID = V.VaccineID
ORDER BY P.VaccinationDate DESC
LIMIT 1;

  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch latest vaccination' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No vaccinations found' });
    }
    res.json({
      vaccine: results[0].VaccineName,
      petId: results[0].PetID
    });
  });
});



//update status

router.patch('/update-status/:scheduleID', (req, res) => {
  const { scheduleID } = req.params;
  const query = `
    UPDATE PetVaccination
    SET Status = 'Completed'
    WHERE ScheduleID = ?
  `;

  db.query(query, [scheduleID], (err, result) => {
    if (err) {
      console.error("Error updating vaccination status:", err);
      return res.status(500).json({ success: false, message: 'Failed to update vaccination status.' });
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Vaccination status updated successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Vaccination not found.' });
    }
  });
});





// Route to fetch vaccination schedule data
router.get('/schedule-data', (req, res) => {
  const sql = 'SELECT * FROM PetVaccination';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch vaccination schedule' });
    }
    res.json({ schedule: results });
  });
});

// Route to export vaccination schedule as CSV
router.get('/export-schedule', (req, res) => {
  const sql = 'SELECT * FROM PetVaccination';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to export vaccination schedule' });
    }

    // Define CSV headers
    const headers = ['ScheduleID ', 'PetID', 'VaccineID', 'VaccinationDate', 'DueDate', 'Status'];

    // Escape CSV fields
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
    const rows = results.map(entry =>
      headers.map(header => escapeCSV(entry[header])).join(',')
    );

    // Add the headers and rows to the CSV content
    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');

    // Send CSV response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vaccination-schedule.csv');
    res.send(csvContent);
  });
});









// Add a new vaccination
router.post('/add', (req, res) => {
  const { ScheduleID , PetID, VaccineID, VaccinationDate, DueDate, Status } = req.body;

  // SQL query to insert a new record into the PetVaccination table
  const insertSql = `
    INSERT INTO PetVaccination (ScheduleID , PetID, VaccineID, VaccinationDate, DueDate, Status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Insert into PetVaccination table
  db.query(insertSql, [ScheduleID , PetID, VaccineID, VaccinationDate, DueDate, Status], (insertErr, insertResult) => {
    if (insertErr) {
      console.error('Error inserting into PetVaccination:', insertErr);
      return res.status(500).json({ error: 'Failed to add vaccination' });
    }

    res.json({
      message: 'Vaccination added successfully. UsageCount and Stock will be updated automatically.',
      insertResult,
    });
  });
});


// Delete a vaccination
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM PetVaccination WHERE ScheduleID = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Vaccination deleted successfully', result });
  });
});

module.exports = router;
