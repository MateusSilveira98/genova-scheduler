var express = require('express');
var router = express.Router();
const users = require('../services/users')
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send({ body: users.verifyUsers()})
});

module.exports = router;
