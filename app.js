

/**
 * Module dependencies.
 */

var io = require('socket.io');
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 29024);
app.set('views', path.join(__dirname, 'views'));
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

app.get('/', routes.index);

app.get('/totals', routes.totals);

var fs = require("fs");
var file = __dirname + "/fixtures.db";
var exists = fs.existsSync(file);

if(!exists) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE Fixtures (id INTEGER PRIMARY KEY, name TEXT, time TEXT, location TEXT, pointsAvailable FLOAT, home TEXT, homePoints FLOAT, awayPoints FLOAT, awayTEXT);");
  }
});
db.close();

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);

io.sockets.on('connection', function(socket) {
  socket.on('edit', function(data) {
    var db = new sqlite3.Database(file);
 
    identifiers = data[0].split('-'); // ['2', 'name']

    switch (identifiers[1]) {
      case 'name':
      case 'location':
      case 'time':
      case 'pointsAvailable':
      case 'home':
      case 'homeScore':
      case 'awayScore':
      case 'away':
        var field = identifiers[1];
        db.serialize(function() {
          db.run("UPDATE Fixtures SET " + field + " = $contents WHERE id = $id", {
            $id:    identifiers[0],
            $contents: data[1],
          }, function(err) {
             console.log(err);
          });
        });
        break;
    }
    db.close();
    socket.broadcast.emit('update', data);
    socket.emit('message', 'success');
  });
});
