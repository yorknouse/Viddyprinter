
/*
 * GET home page.
 */

var fs = require('fs');
var file = 'fixtures.db';
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(file);

exports.index = function(req, res) {

  db.serialize(function() {

    db.all("SELECT * FROM Fixtures", function(err, rows) {
 console.log(rows);
      res.render('index', { fixtures: rows });
    });
  });

}
