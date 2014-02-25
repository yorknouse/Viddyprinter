
/*
 * GET home page.
 */

var fs = require('fs');

exports.index = function(req, res) {

  var dataFile = fs.readFileSync('data.json', 'utf-8');
  var fixtures = JSON.parse(dataFile);

  res.render('index', {
    title: 'Top Secret Nouse Control Panel',
    fixtures: fixtures
  });
};
