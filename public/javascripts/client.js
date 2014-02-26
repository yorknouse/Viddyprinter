socket = io.connect('http://data.nouse.co.uk:29024');

socket.on('connecting', function() {
  document.title = "Connecting …";
}).on('connect', function() {
  document.body.style.background = "white";
  document.title = "Connected :)";
}).on('disconnect', function() {
  document.title = "Disconnected :(";
  document.body.style.background = "red";
}).on('reconnecting', function() {
  document.title = "Reconnecting …";
});

var inputs = document.getElementById('form').getElementsByTagName('input');

for (var i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener('change', function(e) {
    socket.emit('edit', [ this.id, this.value ]);
  });
}

socket.on('update', function(data) {
  var element = document.getElementById(data[0]);
  element.value = data[1];
  element.style.background = "yellow";
  window.setTimeout(function() {
    element.style.background = "white";
  }, 500);
});
