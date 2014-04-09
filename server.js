// module dependencies

var express = require('express');
var http = require('http');
var path = require('path');

var fs = require('fs');
var sqlite3 = require('sqlite3');

var passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy;

var app = express();

var routes = require('./routes');


// all environments

app.set('port', process.env.PORT || 29024);
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// authentication

passport.use(new GoogleStrategy({
    returnURL: 'http://data.nouse.co.uk:29024/auth/google',
    realm: 'http://data.nouse.co.uk:29024/'
  },
  function(identifier, profile, done) {
    console.log(profile.emails);
    for (i = 0; i < profile.emails.length; i++) {
      if (profile.emails[i].value.substr(-12) === '@nouse.co.uk') {
        return done(null, identifier);
      }
    }
    return done(null, false);
  }
));

app.get('/auth/google', passport.authenticate('google'));

app.get(
  '/auth/google',
  passport.authenticate(
    'google',
    {
      successRedirect: '/tournaments',
      failureRedirect: '/' // try again
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}


// URLs

app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/tournaments');
  }
  else {
    res.render('index');
  }
});
app.get('/tournaments', isLoggedIn, routes.tournaments);
app.get('/tournaments/(:id).html', routes.fixturesHTML);
app.get('/tournaments/(:id).json', routes.fixturesJSON);
app.get('/tournaments/(:id)/totals.json', routes.totalsJSON);
app.get('/tournaments/(:id)', isLoggedIn, routes.tournament);


// database setup

file = __dirname + '/fixtures.db';

if (!fs.existsSync(file)) {

  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  
  var db = new sqlite3.Database(file);

  db.serialize(function() {
    db.run('CREATE TABLE Fixtures (id INTEGER PRIMARY KEY, tournament INTEGER, name TEXT, time TEXT, location TEXT, pointsAvailable FLOAT, home TEXT, homeScore FLOAT, awayScore FLOAT, away TEXT);');
    db.run('CREATE TABLE Tournaments (id INTEGER PRIMARY KEY, name TEXT);');
  });

  db.close();

}


// server

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('http://localhost:' + app.get('port'));
});


// POST

var io = require('socket.io').listen(server);

app.post('/tournaments/:id/update', isLoggedIn, function (req, res) {

  var changes = {};
  var db = new sqlite3.Database(file);

  db.serialize(function () {

    for (field in req.body) {

      var identifiers = field.split('-'); // ['name', '3']

      switch (identifiers[0]) {
        case 'name':
        case 'location':
        case 'time':
        case 'pointsAvailable':
        case 'home':
        case 'homeScore':
        case 'awayScore':
        case 'away':
          db.run(
            "UPDATE Fixtures SET " + identifiers[0] + " = $contents WHERE id = $id", {
              $id:       identifiers[1],
              $contents: req.body[field],
            },
            function(err) {
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

  db.close();

  res.redirect('/');

});
