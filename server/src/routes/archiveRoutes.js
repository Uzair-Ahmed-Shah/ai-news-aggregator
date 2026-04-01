const express = require('express');
const router = express.Router();
const { getArchives } = require('../controllers/archiveController');

router.get('/', getArchives);

module.exports = router;
