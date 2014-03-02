(function () {

  var form = document.getElementsByTagName('form')[0];
  var inputs = form.getElementsByTagName('input');
  var changes = {};

  function updateTotals() {
    jQuery.get('./totals', function(data) {
      document.getElementById('homeScore').innerHTML = data.homePoints;
      document.getElementById('awayScore').innerHTML = data.awayPoints;
    }, 'json');
  }

  function recordChanges(e) {
    changes[this.id] = this.value;
  }

  jQuery(inputs).on('input change', recordChanges);

  jQuery(form).on('submit', function(e) {

    jQuery('input[type=submit]').attr('value', 'Saving changes...');
    e.preventDefault();

    jQuery.post('./update', changes, function() {
      changes = {};
      jQuery('input[type=submit]').attr('value', 'Changes saved');
      window.setTimeout(function() {
        jQuery('input[type=submit]').attr('value', 'Save changes');
      }, 1000);
    }, 'json');

  });

  var socket = io.connect('localhost');

  socket.on('connecting', function() {
    document.title = "Connecting …";
  }).on('connect', function() {
    document.body.style.background = "#eee";
    document.title = "Connected :)";
  }).on('disconnect', function() {
    document.title = "Disconnected :(";
    document.body.style.background = "red";
  }).on('reconnecting', function() {
    document.title = "Reconnecting …";
  });

  socket.on('update', function(data) {

    for (field in data) {

      var element = document.getElementById(field);
      element.value = data[field];

      element.style.background = "yellow";
      window.setTimeout(function() {
        element.style.background = "white";
      }, 1000);

    };

    updateTotals();

  });

})();
