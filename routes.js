var sqlite3 = require('sqlite3');


/*
 * GET tournaments administration page
 */

exports.tournaments = function (req, res) {

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
 * GET fixtures administration page for a tournament
 */

exports.tournament = function (req, res) {

  var db = new sqlite3.Database(file);

  var tournament = {};

  db.serialize(function () {

    db.get('SELECT * FROM tournaments WHERE id = $id', {
      $id: req.params.id
    },
    function (err, row) {
      if (err || !row) {
        res.send(404, 'Tournament not found');
      }
      else {
        tournament = row;
      }
    });
    
    db.all('SELECT * FROM fixtures WHERE tournament = $tournament', {
      $tournament: req.params.id
    },
    function (err, rows) {
      if (err) {
      }
      else {
        res.render('tournament', { tournament: tournament, fixtures: rows });
      }
    });

  });

  db.close();

}


/*
 * GET fixtures HTML fragment for a tournament
 */

exports.fixturesHTML = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all(
    'SELECT * FROM Fixtures WHERE tournament = $id',
    {
      $id: req.params.id
    },
    function (err, rows) {
      if (err) {
      }
      else {
        res.render('fixtures', { fixtures: rows });
      }
    }
  );
  
  db.close();

}


/*
 * GET fixtures JSON for a tournament
 */

exports.fixturesJSON = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all(
    'SELECT * FROM Fixtures WHERE tournament = $id',
    {
      $id: req.params.id
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

exports.totalsJSON = function (req, res) {

  var db = new sqlite3.Database(file);

  db.all(
    'SELECT * FROM Fixtures WHERE tournament = $id',
    {
      $id: req.params.id
    },
    function (err, fixtures) {

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
          maxPoints:       maxPoints,
          availablePoints: (maxPoints - homePoints - awayPoints),
          homePoints:      homePoints,
          awayPoints:      awayPoints
        });

      }

    }
  );

  db.close();

}
