// module dependencies

var express = require('express');
var http = require('http');
var path = require('path');

var fs = require('fs');
var sqlite3 = require('sqlite3');

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
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// URLs


app.get('/', routes.index);
app.get('/tournaments/:id', routes.tournament);
// app.get(/^\/tournaments\/([0-9]+)\/totals.json$/, routes.totals);
// app.get(/^\/tournaments\/([0-9]+)\/fixtures.json$/, routes.fixtures);


// database setup

file = __dirname + '/fixtures.db';

if (!fs.existsSync(file)) {

  console.log('Creating DB file.');
  fs.openSync(file, 'w');
  
  var db = new sqlite3.Database(file);

  db.serialize(function() {

    db.run('CREATE TABLE Fixtures (id INTEGER PRIMARY KEY, tournament INTEGER, name TEXT, time TEXT, location TEXT, pointsAvailable FLOAT, home TEXT, homeScore FLOAT, awayScore FLOAT, away TEXT);');

    db.run('CREATE TABLE Tournaments (id INTEGER PRIMARY KEY, name TEXT);');

    db.all("SELECT * FROM Fixtures", function(err, rows) {
      if (err) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
      }
      else {
        console.log(rows);
      }
    });

  });

  db.close(function() {
    console.log('done');
  });

}


// server

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('http://localhost:' + app.get('port'));
});


// things that involve socket.io

var io = require('socket.io').listen(server);

app.post('/', function (req, res) {

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
