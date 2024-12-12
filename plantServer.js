require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5001;

let db;
const mongoURI = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@335cluster.bdx9x.mongodb.net/?retryWrites=true&w=majority&appName=335Cluster`;
const client = new MongoClient(mongoURI);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(process.env.MONGO_DB_NAME);

  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Routes
app.get('/', async (req, res) => {
  try {
    const plants = await db.collection('plants').find({}).toArray();
    
    // Get weather data from OpenWeatherMap API
    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=38.989697&lon=-76.937759&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
    const weather = weatherResponse.data;

    res.render('index.ejs', { 
      plants: plants, 
      weather: weather
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving data');
  }
});

app.post('/add-plant', async (req, res) => {
  const newPlant = {
    name: req.body.name,
    species: req.body.species,
    idealTemp: parseInt(req.body.idealTemp),
    location: req.body.location
  };

  try {
    await db.collection(process.env.MONGO_COLLECTION).insertOne(newPlant);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding plant');
  }
});

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();