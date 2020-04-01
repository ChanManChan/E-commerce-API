const express = require('express');
const mongoose = require('mongoose');
const colors = require('colors');
require('dotenv').config();
// import routes
const userRoutes = require('./routes/user');

// app
const app = express();

// db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('DATABASE Connected'.brightBlue.underline));

// routes middleware
app.use('/api', userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
