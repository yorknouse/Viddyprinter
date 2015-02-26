Viddyprinter is a live score system for varsity tournaments. It was made at the University of York for the [College Varsity](http://www.nouse.co.uk/2014/03/02/college-varsity-live/) and [Roses](http://www.nouse.co.uk/sport/roses/) tournaments, which involve many different sports and fixtures and can span multiple days.

Some of the things it uses are Node.js, the [Express](http://expressjs.com/3x/api.html) web application framework, the [Socket.io](http://socket.io/) WebSocket thing, the [Jade](http://jade-lang.com/) template engine, and SQLite.

## Getting started

Clone this repository to somewhere on your computer, by entering something like this into a terminal window:

    git clone https://github.com/yorknouse/Viddyprinter.git
    cd viddyprinter

If Node.js (and the npm package manager) are installed, you can then install the dependencies:

    npm install

You might like to edit `config.js`. For local development, setting `exports.root` to `http://localhost:22245` can help.

You can then run `server.js`:

    node server

If it's the first time, a SQLite database file (`viddyprinter.db`) will be created.

Open `http://localhost:22245` in your browser. You should see the index page.

Authentication uses the [Passport](http://passportjs.org/) middleware, and currently requires a Google account with an email address ending in `@nouse.co.uk`. You can change this. During development, disabling authentication is often worthwhile.

## Deployment (Nouse-specific notes)

Changes have to be manually pulled (as the `www-data` user) for now.

This entry is in `www-data`'s `crontab`:

    @reboot  ~/viddyprinter/start.sh

`start.sh` does something slightly clever and ought to be copied into this repository. It could be cleverer.

To restart the Node process, first run `ps -eo pid,cmd | grep nodejs` and observe some output like this:

    1491 /usr/bin/nodejs /usr/lib/node_modules/forever/bin/monitor /var/www/viddyprinter/server.js
    1706 /usr/bin/nodejs /var/www/viddyprinter/server.js
    4364 grep nodejs

Make a note of the ID of the `/usr/bin/nodejs /var/www/viddyprinter/server.js` process (`1706` in the example there). Kill it:

    sudo kill 1706

[forever](https://github.com/foreverjs/forever), the process you didn't kill, will instantly start a new process to replace the one you just killed.

Note that this will log all users out of their sessions, so is best not done willy-nilly during tournament coverage.
Furthermore, it is not necessary for changes to template files, only for changes to JavaScript ones.
