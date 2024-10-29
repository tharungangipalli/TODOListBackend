// server.js or app.js
const express = require('express');
const cors = require("cors");
const pool = require('./db'); // Import the pool from db.js
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Define routes
app.use("/tasks", require("./routes/Task")); // This should work now

// Handle connection end
process.on('exit', () => {
  pool.end(() => {
    console.log('PostgreSQL pool has ended.');
  });
});

// Start the server
const PORT = process.env.PORT || 4000; // Default to 4000 if PORT is not defined
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});