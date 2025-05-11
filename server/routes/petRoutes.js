const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection


// Get unique species
router.get('/species', (req, res) => {
  const sql = `SELECT DISTINCT Species FROM Pet`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch species' });
    }

    const speciesList = results.map(row => row.Species);
    res.json(speciesList);
  });
});

// Filter pets by species
router.get('/filter', (req, res) => {
  const { species } = req.query;

  const sql = species && species !== 'All'
    ? `SELECT * FROM Pet WHERE Species = ?`
    : `SELECT * FROM Pet`;

  db.query(sql, species && species !== 'All' ? [species] : [], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }

    res.json(results);
  });
});

router.get('/total-pets', (req, res) => {
  const query = 'SELECT COUNT(*) AS totalPets FROM Pet'; // Adjust table name if needed

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const total = results[0].totalPets;
    res.json({ total });
  });
});




router.get('/export', (req, res) => {
  const sql = 'SELECT * FROM Pet';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to export pets' });
    }

    // Generate CSV content
    const headers = ['PetID', 'Name', 'Species', 'Breed', 'Age', 'Gender', 'OwnerID'];
    const rows = results.map(pet => 
      `${pet.PetID},${pet.Name},${pet.Species},${pet.Breed},${pet.Age},${pet.Gender},${pet.OwnerID}`
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Send CSV response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pets.csv');
    res.send(csvContent);
  });
});


router.get('/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
    console.error('Search query not provided');
    return res.status(400).json({ error: 'Search query is required' });
  }

  const sql = `
    SELECT * FROM Pet
    WHERE Name LIKE ? OR Species LIKE ? OR PetID LIKE ?
  `;
  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to search pets' });
    }

    if (results.length === 0) {
      console.warn('No pets found for search query:', query);
      return res.status(404).json({ error: 'Pet not found' });
    }

    
    res.json(results);
  });
});


router.get('/stats', (req, res) => {
  const sql = `
    SELECT Species, COUNT(*) AS total
    FROM Pet
    GROUP BY Species 
    UNION
    SELECT Gender, COUNT(*) AS total
    FROM Pet
    GROUP BY Gender 

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch pet statistics' });
    }
    res.json(results);
  });
});

router.get('/', (req, res) => {
  db.query('SELECT * FROM Pet', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Get all pets with pagination
router.get('/total', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const sql = `SELECT * FROM Pet LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total FROM Pet`;

  db.query(sql, [parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch pets' });
    }

    db.query(countSql, (err, countResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch pet count' });
      }

      res.json({
        pets: results,
        total: countResult[0].total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit),
      });
    });
  });
});

// Add a new pet
router.post('/add', (req, res) => {
  const { PetID, Name, Species, Breed, Age, Gender, OwnerID } = req.body;

  if (!PetID || !Name || !Species || !Age || !Gender || !OwnerID) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `
    INSERT INTO Pet (PetID, Name, Species, Breed, Age, Gender, OwnerID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [PetID, Name, Species, Breed, Age, Gender, OwnerID], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to add pet' });
    }
    res.status(201).json({ message: 'Pet added successfully', result });
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM Pet WHERE PetID = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch pet details' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.json(result[0]); // Return the first (and only) pet object
  });
});

router.get('/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
    console.error('Search query not provided');
    return res.status(400).json({ error: 'Search query is required' });
  }

  const sql = `
    SELECT * FROM Pet
    WHERE Name LIKE ? OR Species LIKE ? OR PetID LIKE ?
  `;
  const searchQuery = `%${query}%`;

  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to search pets' });
    }

    if (results.length === 0) {
      console.warn('No pets found for search query:', query);
      return res.status(404).json({ error: 'Pet not found' });
    }

    console.log('Search results:', results);
    res.json(results);
  });
});


// Update a pet
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { Name, Species, Breed, Age, Gender, OwnerID } = req.body;

  if (!Name || !Species || !Age || !Gender || !OwnerID) {
    return res.status(400).json({ error: 'All fields are required for update' });
  }

  const sql = `
    UPDATE Pet
    SET Name = ?, Species = ?, Breed = ?, Age = ?, Gender = ?, OwnerID = ?
    WHERE PetID = ?
  `;

  db.query(sql, [Name, Species, Breed, Age, Gender, OwnerID, id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update pet' });
    }
    res.json({ message: 'Pet updated successfully', result });
  });
});

// Delete a pet
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;

  // Check if the pet is referenced in other tables
  const checkSql = 'SELECT * FROM healthrecord WHERE PetID = ?';

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database error:', checkErr);
      return res.status(500).json({ error: 'Failed to delete pet' });
    }
    if (checkResult.length > 0) {
      // Pet is referenced in healthrecord table
      return res.status(400).json({ error: 'Cannot delete pet. It is referenced in health records.' });
    }

    // Proceed with deleting the pet if no references exist
    const deleteSql = 'DELETE FROM Pet WHERE PetID = ?';

    db.query(deleteSql, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete pet' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      res.json({ message: 'Pet deleted successfully', result: deleteResult });
    });
  });
});




router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if the pet is referenced in other tables
  const checkSql = 'SELECT * FROM healthrecord WHERE PetID = ?';

  db.query(checkSql, [id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Database error:', checkErr);
      return res.status(500).json({ error: 'Failed to delete pet' });
    }
    if (checkResult.length > 0) {
      // Pet is referenced in healthrecord table
      return res.status(400).json({ error: 'Cannot delete pet. It is referenced in health records.' });
    }

    // Proceed with deleting the pet if no references exist
    const deleteSql = 'DELETE FROM Pet WHERE PetID = ?';

    db.query(deleteSql, [id], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ error: 'Failed to delete pet' });
      }
      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Pet not found' });
      }
      res.json({ message: 'Pet deleted successfully', result: deleteResult });
    });
  });
});



router.post('/delete', (req, res) => {
  const { ids } = req.body; // Array of PetIDs to delete

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No IDs provided for deletion' });
  }

  const sql = `DELETE FROM Pet WHERE PetID IN (?)`;

  db.query(sql, [ids], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete pets' });
    }
    res.json({ message: 'Pets deleted successfully', result });
  });
});













module.exports = router;
