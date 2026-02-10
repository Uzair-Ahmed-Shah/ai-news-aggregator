const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');


router.get('/news', newsController.getNewsFeed);
router.post('/scrape', newsController.triggerScrape);
router.get('/stats', newsController.getDashboardStatsHandler);

module.exports = router;