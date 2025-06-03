require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const PORT = 3000;
const DB_URL = process.env.NODE_ENV == "production" ? process.env.MONGO_URL : 'mongodb://localhost:27017/invoice';


const app = express();

app.use(express.json());

app.use(cors())

app.use('/api/v1', require('./routes/api'));

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.listen(PORT, () => {
  console.log(`Server Started at ${PORT}`)
})