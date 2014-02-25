
/**
 * Module dependencies.
 */

var io = require('socket.io');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
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
// app.get('/users', user.list);

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);

io.sockets.on('connection', function(socket) {
  socket.on('edit', function(data) {
    console.log(data);
    socket.broadcast.emit('update', data);

    var dataFile = fs.readFileSync('data.json', 'utf-8');
    var fixtures = JSON.parse(dataFile);

    var identifiers = data[0].split('-'); // [ 'fixture', '2', 'time' ]
    fixtures[identifiers[1]][identifiers[2]] = data[1];
  
    fs.writeFile('data.json', JSON.stringify(fixtures, null, 4), 'utf-8');

  });
});
