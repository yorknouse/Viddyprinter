
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
        res.render('index', { fixtures: rows });
    });
  });

}


/*
 * GET totals JSON.
 */

exports.totals = function(req, res) {

  db.serialize(function() {
    db.all("SELECT * FROM Fixtures", function(err, fixtures) {
    
      // initialise accumulators to 0
      var homePoints = 0;
      var awayPoints = 0;
      var maxPoints = 0;
      
      for (var i = 0; i < fixtures.length; i++) {
      	console.log(fixtures[i]);

        if (fixtures[i].pointsAvailable) {

          maxPoints += fixtures[i].pointsAvailable;

          if (fixtures[i].homeScore && fixtures[i].awayScore) {
            if (fixtures[i].homeScore > fixtures[i].homeScore) {
                homePoints += fixtures[i].pointsAvailable;
            }
            else if (fixtures[i].homeScore < fixtures[i].homeScore) {
                awayPoints += fixtures[i].pointsAvailable;
            }
            else {
                homePoints += fixtures[i].pointsAvailable / 2;
                awayPoints += fixtures[i].pointsAvailable / 2;
            }
          }

        }
      }
      res.json({
      	maxPoints: maxPoints,
      	remainingPointsAvailable: (maxPoints-homePoints-awayPoints),
      	homePoints: homePoints,
      	awayPoints: awayPoints
      });
    });
  });

}
