const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken } = require('../middleware/checkAuth');


router.get('/news', newsController.getNewsFeed);
router.get('/news/top', newsController.getTopArticle);
router.get('/news/:id', newsController.getArticleById);
router.get('/stats', newsController.dashboardStatsHandler);
router.get('/reports', newsController.getWeeklyReports);

router.get('/user/saved', authenticateToken, newsController.getSavedArticles);
router.get('/user/activity', authenticateToken, newsController.getUserActivity);
router.post('/articles/:id/like', authenticateToken, newsController.toggleLike);
router.post('/articles/:id/save', authenticateToken, newsController.toggleSave);
router.post('/scrape', newsController.triggerScrape);

router.post('/admin/process-batch', newsController.processBatchAdmin);
router.get('/news/weekly/report', newsController.generateWeeklyPDF);
module.exports = router;
