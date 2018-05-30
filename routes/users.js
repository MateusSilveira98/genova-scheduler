var express = require('express');
var router = express.Router();
const app = express();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({users: [{name: 'Timmy'}]});
  res.send('ok')
});

module.exports = router;
