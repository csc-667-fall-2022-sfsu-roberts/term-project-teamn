const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('public/index', { title: 'UNO' });
});

module.exports = router;
