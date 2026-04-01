const express = require('express');
const router = express.Router();
const { getArchives, getArchiveById } = require('../controllers/archiveController');

router.get('/', getArchives);
router.get('/:id', getArchiveById);

module.exports = router;
