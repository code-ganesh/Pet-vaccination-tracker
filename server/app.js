const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
const ownerRoutes = require('./routes/ownerRoutes');
const petRoutes = require('./routes/petRoutes');
const vetRoutes = require('./routes/vetRoutes');
const visitRoutes = require('./routes/visitRoutes');
const healthRoutes = require('./routes/healthRoutes');
const vaccinationRoutes = require('./routes/vaccinationRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');

app.use('/owners', ownerRoutes);
app.use('/pets', petRoutes);
app.use('/vets', vetRoutes);
app.use('/visits', visitRoutes);
app.use('/health', healthRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/vaccine', vaccineRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
