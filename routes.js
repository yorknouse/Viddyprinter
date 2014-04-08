var sqlite3 = require('sqlite3');


/*
 * GET tournaments page
 */

exports.index = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all('SELECT * FROM Tournaments', function (err, rows) {
    if (err) {
    }
    else {
      res.render('index', { tournaments: rows });
    }
  });

  db.close();

}


/*
 * GET fixtures page for a tournament
 */

exports.tournament = function (req, res) {

  var db = new sqlite3.Database(file);

  var tournamentName = "";

  console.log(tournamentName);

  db.serialize(function () {

    db.get('SELECT name FROM Tournaments WHERE id = $id', {
      $id: req.params.id
    },
    function (err, row) {
      if (err) {
      }
      else {
        tournamentName = row.name;
      }
    });

    console.log(tournamentName);
    
    db.all('SELECT * FROM Fixtures WHERE tournament = $tournament', {
      $tournament: req.params.id
    },
    function (err, rows) {
      if (err) {
      }
      else {
        res.render('tournament', { name: tournamentName, fixtures: rows });
      }
    });

  });

  db.close();

}


/*
 * GET fixtures JSON for a tournament
 */

exports.fixtures = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all(
    'SELECT * FROM Fixtures WHERE tournament = $tournament',
    {
      $tournament: req.params.id
    },
    function (err, rows) {
      if (err) {
      }
      else {
        res.json(rows);
      }
    }
    );
  
  db.close();

}


/*
 * GET points totals JSON for a tournament
 */

exports.totals = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all('SELECT * FROM Fixtures', function (err, fixtures) {

    if (err) {
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
