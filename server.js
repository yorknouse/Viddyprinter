// module dependencies

'use strict';

var express      = require('express'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session      = require('express-session'),
    flash = require('connect-flash'),
    http = require('http'),
    path = require('path');

var fs = require('fs'),
    sqlite3 = require('sqlite3');

var passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var app = express();

var routes = require('./routes'),
    config = require('./config');

app.set('port', process.env.PORT || 22245);
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

// accept form POST requests

app.use(bodyParser.urlencoded({
    extended: true
}));


// start to allow logging in

app.use(cookieParser());
app.use(session({
    key: '',
    secret: config.secret,
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: null
    },
    resave: true,
    saveUninitialized: true,
    proxy: null
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// authentication

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() || app.get('env') === 'development') {
        return next();
    }
    res.redirect('/'); 
}

passport.use(
    new GoogleStrategy(
        {
            callbackURL: config.root + '/login/google/return',
            clientID: '355722129027.apps.googleusercontent.com',
            clientSecret: 'iFRPbiAo6FFVyF88UQjYOu3U',
            realm: config.root
        },
        function (accessToken, refreshToken, profile, done) { // verify callback
            var i;
            for (i = 0; i < profile.emails.length; i += 1) {
                if (profile.emails[i].value.substr(-12) === '@nouse.co.uk') {
                    return done(null, true);
                }
            }
            return done(null, false);
        }
    )
);

// two routes are required for OpenID (Google) authentication
app.get('/login/google', passport.authenticate('google', {
    scope: ['email']
}));
app.get('/login/google/return', passport.authenticate('google', {
    successRedirect: '/tournaments',
    failureRedirect: '/', // try again
    successFlash: 'Welcome!',
    failureFlash: 'Logging in didn\'t work. You need to use an `@nouse.co.uk` address.',
}));

// session serialization
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});


// database setup
fs.open(config.dbfile, 'r', function (err) {
    if (err) {
        console.log('Creating DB file.');
        fs.open(config.dbfile, 'w', function (err) {
            if (!err) {
                var db = new sqlite3.Database(config.dbfile);
                db.run('CREATE TABLE Fixtures (id INTEGER PRIMARY KEY, tournament INTEGER, sport TEXT, name TEXT, day TEXT, time DATETIME, location TEXT, pointsAvailable FLOAT, home TEXT, homeScore FLOAT, awayScore FLOAT, away TEXT, inProgress INTEGER DEFAULT 0);');
                db.run('CREATE TABLE Tournaments (id INTEGER PRIMARY KEY, name TEXT, home TEXT, away TEXT);');
                db.close();
            }
        });
    }
});


// server

var server = http.createServer(app);
server.listen(app.get('port'));

var io = require('socket.io').listen(server);


// URLs
app.get('/', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/tournaments');
    } else {
        res.render('admin-index', { messages: req.flash() });
    }
});
app.get('/tournaments', isLoggedIn, routes.tournaments);
app.get('/tournaments/(:id).html', routes.fixturesHTML);
app.get('/tournaments/(:id).json', routes.fixturesJSON);
app.get('/tournaments/(:id)/totals.json', routes.totalsJSON);
app.get('/tournaments/(:id)', isLoggedIn, routes.tournament);
app.get('/tournaments/(:id)/add', isLoggedIn, routes.fixturesAdd);
app.post('/tournaments/:id/update', isLoggedIn, routes.fixturesUpdate(io));
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});
app.post('/tournaments/add', isLoggedIn, routes.tournamentsAdd);
