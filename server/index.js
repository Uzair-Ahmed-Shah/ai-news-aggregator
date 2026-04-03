require('dotenv').config();
const express =  require('express');
const cors = require('cors');
const cron = require('node-cron');
const { fetchSaveNews, processArticles } = require('./src/services/newsScraper');
const { generateWeeklySnapshot } = require('./src/services/archiveManager');
const authRoutes = require('./src/routes/authRoutes.js');
const newsRoutes = require('./src/routes/newsRoutes.js');
const archiveRoutes = require('./src/routes/archiveRoutes.js');


console.log('Using node-cron for scheduling')

cron.schedule('0 3 * * *', async () => {
  console.log('Waking up cron at 3am to run the pipeline - fetchSaveNews')
  try {
    await fetchSaveNews();
    console.log('cron ran succesfully')

  }catch (err){
    console.log(`Daily cron failed - ${err.message}`)
  }
},{
  scheduled: true,
  timezone: "Asia/Kolkata"
})

cron.schedule('30 3 * * *', async () => {
    console.log('3:30 AM: Running Intelligence Analysis Pipeline (LLM)');
    try {
        await processArticles(30);
        console.log('LLM Analysis Pipeline completed.');
    } catch (err) {
        console.log(`LLM Analysis Pipeline failed - ${err.message}`)
    }
},{
  scheduled: true,
  timezone: "Asia/Kolkata"
})

cron.schedule('0 4 * * 0', async () => {
    console.log('4:00 AM (Sunday): Generating Weekly Archive Snapshot');
    try {
        await generateWeeklySnapshot();
        console.log('Archive Snapshot generation completed.');
    } catch (err) {
        console.log(`Archive Snapshot generation failed - ${err.message}`);
    }
},{
  scheduled: true,
  timezone: "Asia/Kolkata"
});

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('AI News Aggregator API is Running 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api', newsRoutes);
app.use('/api/archive', archiveRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});