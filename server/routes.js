var express = require('express');
var router = express.Router();

var bigScreen = false;
if (process.argv.length > 0) {
    process.argv.forEach(function (val, index, array) {
        if (val == 'bigScreen') {
            bigScreen = true;
        }
    });
}

/* GET home page. */
router.get('/', function(req, res, next) {
    var path = 'index.html';
    if (bigScreen) {
        path = 'hosted.html';
    }
    res.sendFile(path, { root: 'public'});
});

module.exports = router;