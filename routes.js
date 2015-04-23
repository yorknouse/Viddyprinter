'use strict';

var config  = require('./config'),
    sqlite3 = require('sqlite3'),
    db      = new sqlite3.Database(config.dbfile);

// given an array of fixtures rows, calculates the totals
function pointsTotals(fixtures) {
    var totals = {
        homePoints: 0,
        awayPoints: 0,
        maxPoints: 0,
    };

    fixtures.forEach(function (fixture) {
        totals.maxPoints += fixture.pointsAvailable;
        if (!fixture.inProgress
                && fixture.pointsAvailable
                && typeof fixture.homeScore === 'number'
                && typeof fixture.awayScore === 'number') {
            if (fixture.homeScore > fixture.awayScore) {
                totals.homePoints += fixture.pointsAvailable;
            } else if (fixture.homeScore < fixture.awayScore) {
                totals.awayPoints += fixture.pointsAvailable;
            } else {
                totals.homePoints += fixture.pointsAvailable / 2;
                totals.awayPoints += fixture.pointsAvailable / 2;
            }
        }
    });

    totals.availablePoints = totals.maxPoints - totals.homePoints - totals.awayPoints;

    return totals;
}

// given fixturesByDay, works out the 'current day'
// -- either the first day with any fixtures without final scores, or the first day
function currentDay(fixturesByDay) {
    var days = Object.keys(fixturesByDay);
    if (days.length === 1) {
        return days[0];
    }
    return days.filter(function (day) {
        return fixturesByDay[day].some(function (fixture) { // do any fixtures lack a final score?
            return typeof fixture.homeScore !== 'number' || typeof fixture.awayScore !== 'number';
        });
    }, fixturesByDay)[0] || days[0];
}

// fetch a tournament's fixtures and render it using some view
function tournamentFixtures(req, res, view) {
    var tournament,
        fixturesByDay = {};

    db.get('SELECT * FROM tournaments WHERE id = $id',
        {
            $id: req.params.id
        },
        function (err, row) {
            if (err || !row) {
                res.status(404).send('Tournament does not exist');
            } else {
                tournament = row;

                db.each('SELECT * FROM fixtures WHERE tournament = $tournament ORDER BY time',
                    {
                        $tournament: req.params.id
                    },
                    function (err, row) {
                        if (!err) {
                            if (!fixturesByDay[row.day]) {
                                fixturesByDay[row.day] = [];
                            }
                            fixturesByDay[row.day].push(row);
                        }
                    },
                    function (err, rows) {
                        res.render(view, {
                            tournament: tournament,
                            fixturesByDay: fixturesByDay,
                            multipleDays: (rows > 1),
                            currentDay: currentDay(fixturesByDay),
                        });
                    });
            }

        });
}


// tournaments administration page
exports.tournaments = function (req, res) {
    db.all('SELECT * FROM Tournaments ORDER BY id DESC', function (err, rows) {
        if (err) {
            res.status(500);
        } else {
            res.render('admin-tournaments', { messages: req.flash(), tournaments: rows });
        }
    });
};

// add new tournament
exports.tournamentsAdd = function (req, res) {
    if (req.body.name && req.body.home && req.body.away) {
        db.run('INSERT INTO Tournaments (name, home, away) VALUES ($name, $home, $away)', {
            $name: req.body.name,
            $home: req.body.home,
            $away: req.body.away,
        }, function () {
            req.flash('successMessage', 'Tournament added');
            res.redirect('/tournaments');
        });
    } else {
        req.flash('errorMessage', 'Sorry, please fill in all the fields');
        res.redirect('/tournaments');
    }
};

// add new fixture
exports.fixturesAdd = function (req, res) {
    if (req.params.id) {
        db.run('INSERT INTO Fixtures (tournament) VALUES ($id)', {
            $id: req.params.id,
        }, function () {
            res.redirect('/tournaments/' + req.params.id);
        });
    }
};

// update some scores for a tournament
exports.fixturesUpdate = function (io) { // higher order function
    return function (req, res) {
        var changes = {},
            totalsBefore = {}, // used to check whether the changes cause the tournament score to change
            totalsAfter = {};

        // calculate the initial score totals, to see if they are different afterwards
        db.all('SELECT pointsAvailable, homeScore, awayScore, inProgress FROM Fixtures WHERE tournament = $id',
            {
                $id: req.params.id
            },
            function (err, fixtures) {
                if (err) {
                    res.status(500);
                } else {
                    totalsBefore = pointsTotals(fixtures);
                    // now do something with the POST request
                    for (var field in req.body) {
                        var identifiers = field.split('-'); // ['name', '3']
                        switch (identifiers[0]) {
                            case 'day':
                            case 'sport':
                            case 'name':
                            case 'location':
                            case 'time':
                            case 'pointsAvailable':
                            case 'home':
                            case 'homeScore':
                            case 'awayScore':
                            case 'away':
                            case 'inProgress':
                                db.run(
                                    "UPDATE Fixtures SET " + identifiers[0] + " = $contents WHERE tournament = $tournamentid AND id = $id",
                                    {
                                        $contents:     req.body[field],
                                        $id:           identifiers[1],
                                        $tournamentid: req.params.id
                                    },
                                    function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    }
                                );
                                changes[field] = req.body[field];
                            break;
                        }
                    }

                    // recalculate points totals
                    db.all(
                        'SELECT pointsAvailable, homeScore, awayScore, inProgress FROM Fixtures WHERE tournament = $id',
                        {
                            $id: req.params.id
                        },
                        function (err, fixtures) {
                            if (!err) {
                                totalsAfter = pointsTotals(fixtures);
                            }
                        }
                    );
                    if (req.query.ajax) {
                        res.json(changes);
                    } else {
                        res.redirect('/tournaments/' + req.params.id);
                    }

                    if (totalsBefore.homePoints != totalsAfter.homePoints
                        || totalsBefore.awayPoints != totalsAfter.awayPoints) {
                        io.sockets.emit('score change', changes);
                    } else {
                        io.sockets.emit('update', changes);
                    }
                }
            });
    };
};

// fixtures administration page for a tournament
exports.tournament = function (req, res) {
    tournamentFixtures(req, res, 'admin-fixtures');
};

// embeddable fixtures HTML fragment for a tournament
exports.fixturesHTML = function (req, res) {
    tournamentFixtures(req, res, 'fixtures-container');
};

// fetch, and render as JSON, fixtures for a tournament
exports.fixturesJSON = function (req, res) {
    db.all('SELECT * FROM Fixtures WHERE tournament = $id',
        {
            $id: req.params.id
        },
        function (err, rows) {
            if (!err) {
                res.json(rows);
            }
        });
};

// fetch, and render as JSON, points totals for a tournament
exports.totalsJSON = function (req, res) {
    db.all('SELECT pointsAvailable, homeScore, awayScore, inProgress FROM Fixtures WHERE tournament = $id',
        {
            $id: req.params.id
        },
        function (err, fixtures) {
            if (!err) {
                res.json(pointsTotals(fixtures));
            }
        });
};
