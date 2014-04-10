(function () {

  var form = document.getElementsByTagName('form')[0];
  var inputs = form.getElementsByTagName('input');
  var changes = {};

  function updateTotals() {
    // not completely reliable because /tournaments/2//totals.json returns a 404
    jQuery.get(window.location.href + '/totals.json', function(data) {
      document.getElementById('homeScore').innerHTML = data.homePoints;
      document.getElementById('awayScore').innerHTML = data.awayPoints;
    }, 'json');
  }

  updateTotals();

  function recordChanges(e) {
    changes[this.id] = this.value;
  }

  jQuery(inputs).on('input change', recordChanges);

  jQuery(form).on('submit', function(e) {
    e.preventDefault();
    jQuery('input[type=submit]').attr('value', 'Saving changes...');

    jQuery.post(this.action + '?ajax=true', changes, function() {
      jQuery('input[type=submit]').attr('value', 'Changes saved');
      window.setTimeout(function() {
        jQuery('input[type=submit]').attr('value', 'Save changes');
      }, 1000);
    });

    changes = {};
  });

  var socket = io.connect('/');

  socket.on('connecting', function() {
    document.title = "Connecting …";
  }).on('connect', function() {
    // document.body.style.background = "#eee";
    document.title = "Connected :)";
  }).on('disconnect', function() {
    document.title = "Disconnected :(";
    // document.body.style.background = "red";
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
