const express =  require('express');;
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes.js')

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to My News App API');
});

app.use('/api/auth', authRoutes)

// app.get('/api/news', async (req, res) => {
//     try {
//         const today = new Date();
//         const lastWeek = new Date();
//         lastWeek.setDate(today.getDate() - 7);

//         const toDate = today.toISOString().split("T")[0];
//         const fromDate = lastWeek.toISOString().split("T")[0];

//         const response = await axios.get('https://newsapi.org/v2/everything',{
//             params: {
//                 q : "(artificial intelligence) OR (AI) OR (machine learning) OR (deep learning) OR (ML) OR (neural networks)",
//                 from: fromDate,
//                 to: toDate,
//                 language: 'en',
//             },
//             headers: {
//                 'X-Api-Key': process.env.apiKey
//             }
//         })

//         res.json(response.data.articles);

//     }catch (err) {
//         res.status(500).json({ error: 'Failed to fetch news articles' });
//     }

// })

const { runTestScrape } = require('./src/services/newsScraper');

// Test Route
app.get('/test-scraper', async (req, res) => {
    runTestScrape(); // Run in background
    res.send("Scraper started! Check your VS Code terminal.");
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})