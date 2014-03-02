var fs = require('fs');
var file = 'fixtures.db';
var sqlite3 = require('sqlite3');


/*
 * GET home page.
 */

exports.index = function(req, res) {

  var db = new sqlite3.Database(file);

  db.serialize(function() {
    db.all("SELECT * FROM Fixtures", function(err, rows) {    
      if (err) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
      }
      else {
        res.render('index', { fixtures: rows });
      }
    });
  });

  db.close();

}


/*
 * GET totals JSON.
 */

exports.totals = function(req, res) {

  var db = new sqlite3.Database(file);

    db.all("SELECT * FROM Fixtures", function(err, fixtures) {

      if (err) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
      }
      else {

        // initialise accumulators to 0
        var homePoints = 0;
        var awayPoints = 0;
        var maxPoints = 0;
      
        for (var i = 0; i < fixtures.length; i++) {
          if (fixtures[i].pointsAvailable) {

            maxPoints += fixtures[i].pointsAvailable;

            if (typeof(fixtures[i].homeScore) === 'number' && typeof(fixtures[i].awayScore) === 'number') {
              if (fixtures[i].homeScore > fixtures[i].awayScore) {
                homePoints += fixtures[i].pointsAvailable;
              }
              else if (fixtures[i].homeScore < fixtures[i].awayScore) {
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
      }

    });

  db.close();

}


exports.fixtures = function(req, res) {

  var db = new sqlite3.Database(file);

    db.all("SELECT * FROM Fixtures", function(err, fixtures) {

      if (err) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
      }
      else {

        res.json(fixtures);

      }

    });

  db.close();

}




