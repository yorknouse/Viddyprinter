(function () {

    "use strict";

    String.prototype.toTitleCase = function () {
        return this.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    var form = document.getElementsByTagName('form')[0],
        inputs = form.getElementsByTagName('input'),
        changes = {};

    function updateTotals() {
        // not completely reliable because /tournaments/2//totals.json returns a 404
        jQuery.get(window.location.href + '/totals.json', function (data) {
            document.getElementById('homeScore').innerHTML = data.homePoints;
            document.getElementById('awayScore').innerHTML = data.awayPoints;
        }, 'json');
    }

    updateTotals();

    function recordChanges() {
        if ('checkbox' === this.type) {
            changes[this.id] = (this.checked ? 1 : 0);
        } else {
            if (this.id.split('-')[0] !== 'location' && this.value.toUpperCase() === this.value) { // avoid "JLD" etc
                this.value = this.value.toTitleCase(); // easier pasting from roseslive.co.uk
            }
            changes[this.id] = this.value;
        }
    }

    jQuery(inputs).on('input change', recordChanges);

    jQuery(form).on('submit', function (e) {
        e.preventDefault();
        jQuery('input[type=submit]').attr('value', 'Saving changes...');

        console.log(changes);

        jQuery.post(this.action + '?ajax=true', changes, function () {
            jQuery('input[type=submit]').attr('value', 'Changes saved');
            setTimeout(function () {
                jQuery('input[type=submit]').attr('value', 'Save changes');
            }, 1000);
        }, 'json').fail(function () {
            window.alert('Sorry, your changes weren\'t saved. You might need to log in again.');
            window.open('/');
            jQuery('input[type=submit]').attr('value', 'Save changes');
        });

        changes = {};
    });

    var socket = io.connect('/');

    function highlightChanges(data) {
        for (var field in data) {
            var element = document.getElementById(field);
            if ('checkbox' === element.type) {
                element.checked = (data[field] == 1);
                console.log((data[field] == 1));
            }
            else {
                element.value = data[field];
            }
            element.style.background = "yellow";
        }
        setTimeout(function () {
            for (var field in data) {
                document.getElementById(field).style.background = "";
            }
        }, 500);
    }

    socket.on('connecting', function () {
        document.title = "Connecting …";
    })
        .on('connect', function () {
            document.title = "Connected :)";
        })
        .on('disconnect', function () {
            document.title = "Disconnected :(";
        })
        .on('reconnecting', function () {
            document.title = "Reconnecting …";
        })
        .on('update', highlightChanges)
        .on('score change', function (data) {
            highlightChanges(data);
            updateTotals();
        });

})();
