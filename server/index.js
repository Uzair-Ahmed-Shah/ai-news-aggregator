const express =  require('express');
const cors = require('cors');
const cron = require('node-cron');
const { fetchSaveNews, processArticles } = require('./src/services/newsScraper');
const authRoutes = require('./src/routes/authRoutes.js');
const newsRoutes = require('./src/routes/newsRoutes.js');
require('dotenv').config();

let isQueueEmpty = false;

console.log('Using node-cron for scheduling')

cron.schedule('0 3 * * *', async () => {
  console.log('Waking up cron at 3am to run the pipeline - fetchSaveNews')
  try {
    await fetchSaveNews();
    console.log('cron ran succesfully')

  }catch (err){
    console.log(`Daily cron failed - ${err.message}`)
  }
})

cron.schedule('30 3 * * *', async () => {
    console.log('3:30 AM: Running Analysis Batch 1');
    try {
        const count = await processArticles(10);
        if (count < 10) {
            console.log("Queue empty or low. Will skip next batch.");
            isQueueEmpty = true;
        }
    } catch (err) {
        console.log(`Batch 1 failed - ${err.message}`)
    }
})

cron.schedule('30 4 * * *', async () => {
    if (isQueueEmpty) {
        console.log("Skipping Batch 2");
        return;
    }
    console.log('4:30 AM: Running Analysis Batch 2');
    try {
        await processArticles(10);
    } catch (err) {
        console.log(`Batch 2 failed - ${err.message}`)
    }
})

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('AI News Aggregator API is Running 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api', newsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});