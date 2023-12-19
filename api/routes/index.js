var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({message: "hello world"});
});

router.get('/public_key', function(req, res, next) {
  res.send(process.env.VITE_VAPID_PUBLIC_KEY);
});


module.exports = router;
