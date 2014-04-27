// module dependencies

var express = require('express'),
    http = require('http'),
    path = require('path');

var fs = require('fs');
var sqlite3 = require('sqlite3');

var passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy;

var app = express();

var routes = require('./routes'),
    config = require('./config');

// all environments

app.set('port', process.env.PORT || 22245);
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: config.secret }));
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only

if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}


// authentication

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

passport.use(
    new GoogleStrategy(
        {
            returnURL: config.root + '/login/google/return',
            realm: config.root
        },
        function (identifier, profile, done) { // verify callback
            for (var i = 0; i < profile.emails.length; i += 1) {
                if (profile.emails[i].value.substr(-12) === '@nouse.co.uk') {
                    return done(null, identifier);
                }
            }
            return done(null, false);
        }
    )
);

// two routes are required for OpenID (Google) authentication

app.get('/login/google', passport.authenticate('google'));

app.get(
    '/login/google/return',
    passport.authenticate(
        'google',
        {
            successRedirect: '/tournaments',
            failureRedirect: '/' // try again
        }
    )
);

// session serialization

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


// database setup
if (!fs.existsSync(config.dbfile)) {
    console.log('Creating DB file.');
    fs.openSync(config.dbfile, 'w');

    var db = new sqlite3.Database(config.dbfile);

    db.serialize(function () {
        db.run('CREATE TABLE Fixtures (id INTEGER PRIMARY KEY, tournament INTEGER, sport TEXT, name TEXT, day TEXT, time DATETIME, location TEXT, pointsAvailable FLOAT, home TEXT, homeScore FLOAT, awayScore FLOAT, away TEXT);');
        db.run('CREATE TABLE Tournaments (id INTEGER PRIMARY KEY, name TEXT, home TEXT, away TEXT);');
    });

    db.close();
}


// server

var server = http.createServer(app);

server.listen(app.get('port'), function () {
    console.log('http://localhost:' + app.get('port'));
});


// URLs

app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/tournaments');
    } else {
        res.render('index');
    }
});
app.get('/tournaments', isLoggedIn, routes.tournaments);
app.get('/tournaments/(:id).html', routes.fixturesHTML);
app.get('/tournaments/(:id).json', routes.fixturesJSON);
app.get('/tournaments/(:id)/totals.json', routes.totalsJSON);
app.get('/tournaments/(:id)', isLoggedIn, routes.tournament);
app.get('/tournaments/(:id)/add', isLoggedIn, routes.tournament);

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


// POST

var io = require('socket.io').listen(server);

app.post('/tournaments/:id/update', isLoggedIn, function (req, res) {

    var changes = {}, // changes to be broadcast
        db = new sqlite3.Database(config.dbfile);

    db.serialize(function () {
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
                    db.run(
                        "UPDATE Fixtures SET " + identifiers[0] + " = $contents WHERE id = $id",
                        {
                            $id:       identifiers[1],
                            $contents: req.body[field],
                        },
                        function (err) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                changes[field] = req.body[field];
                            }
                        }
                    );
            }
        }
    });

    db.close(function () {
        io.sockets.emit('update', changes);
        if (req.query.ajax) {
            res.send(200);
        }
        else {
            res.redirect('/tournaments/' + req.params.id);
        }
    });

});
