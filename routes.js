var config = require('./config'),
    sqlite3 = require('sqlite3');

/*
 * GET tournaments administration page
 */

exports.tournaments = function (req, res) {

    var db = new sqlite3.Database(config.dbfile);

    db.all('SELECT * FROM Tournaments ORDER BY id DESC', function (err, rows) {
        if (!err) {
            res.render('admin-tournaments', { tournaments: rows });
        }
    });

    db.close();

};

/*
 * POST add new tournament
 */

exports.tournamentsAdd = function (req, res) {
    if (req.body.name && req.body.home && req.body.away) {
        var db = new sqlite3.Database(config.dbfile);
        db.run('INSERT INTO Tournaments (name, home, away) VALUES ($name, $home, $away)', {
            $name: req.body.name,
            $home: req.body.home,
            $away: req.body.away,
        }, function () {
            res.redirect('/tournaments');
        });
        db.close();
    } else {
        res.redirect('/tournaments');
    }
}

/*
 * GET add new fixture
 */

exports.fixturesAdd = function (req, res) {
    if (req.params.id) {
        var db = new sqlite3.Database(config.dbfile);
        db.run('INSERT INTO Fixtures (tournament) VALUES ($id)', {
            $id: req.params.id,
        }, function () {
            res.redirect('/tournaments/' + req.params.id);
        });
        db.close();
    }
}


/*
 * Generic function for rendering a tournament some way
 */

function tournamentFixtures(req, res, view) {

    var db = new sqlite3.Database(config.dbfile),
        tournament = {},
        days = {};

    db.serialize(function () {
        db.get('SELECT * FROM tournaments WHERE id = $id',
            {
                $id: req.params.id
            },
            function (err, row) {
                if (err || !row) {
                    res.send(404, 'Tournament not found');
                } else {
                    tournament = row;
                }   
            });
        db.each('SELECT * FROM fixtures WHERE tournament = $tournament ORDER BY day, time', // works because Friday--Sunday in alphabetical order is the right order
            {
                $tournament: req.params.id
            },
            function (err, row) {
                if (err || !row) {
                    res.send(404, 'Tournament has no fixtures');
                } else {
                    if (!days[row.day]) {
                        days[row.day] = [];
                    }
                    days[row.day][days[row.day].length] = row;
                }
            });
    });

    db.close(function () {
        res.render(view, { tournament: tournament, days: days });
    });

}

/*
 * GET fixtures administration page for a tournament
 */

exports.tournament = function (req, res) {
    tournamentFixtures(req, res, 'admin-fixtures');
};


/*
 * GET fixtures HTML fragment for a tournament
 */

exports.fixturesHTML = function (req, res) {

    // for multi-day tournaments (Roses)
    // tournamentFixtures(req, res, 'fixtures-tabbed');

    // for one-day tournaments (College Varsity)
    tournamentFixtures(req, res, 'fixtures');

};


/*
 * GET fixtures JSON for a tournament
 */

exports.fixturesJSON = function (req, res) {

    var db = new sqlite3.Database(config.dbfile);

    db.all('SELECT * FROM Fixtures WHERE tournament = $id',
        {
            $id: req.params.id
        },
        function (err, rows) {
            if (!err) {
                res.json(rows);
            }
        });

    db.close();

};


/*
 * Utility function
 */

exports.pointsTotals = function (fixtures) {
    var totals = {
        homePoints: 0,
        awayPoints: 0,
        maxPoints: 0
    };

    for (var i = 0; i < fixtures.length; i += 1) {
        totals.maxPoints += fixtures[i].pointsAvailable;
        if (!fixtures[i].inProgress && fixtures[i].pointsAvailable && typeof (fixtures[i].homeScore) === 'number' && typeof (fixtures[i].awayScore) === 'number') {
            if (fixtures[i].homeScore > fixtures[i].awayScore) {
                totals.homePoints += fixtures[i].pointsAvailable;
            } else if (fixtures[i].homeScore < fixtures[i].awayScore) {
                totals.awayPoints += fixtures[i].pointsAvailable;
            } else {
                totals.homePoints += fixtures[i].pointsAvailable / 2;
                totals.awayPoints += fixtures[i].pointsAvailable / 2;
            }
        }
    }

    totals.availablePoints = (totals.maxPoints - totals.homePoints - totals.awayPoints);

    return totals;
}


/*
 * GET points totals JSON for a tournament
 */

exports.totalsJSON = function (req, res) {

    var db = new sqlite3.Database(config.dbfile);

    db.all('SELECT pointsAvailable, homeScore, awayScore, inProgress FROM Fixtures WHERE tournament = $id',
        {
            $id: req.params.id
        },
        function (err, fixtures) {
            if (!err) {
                res.json(exports.pointsTotals(fixtures));
            }
        });

    db.close();

};
