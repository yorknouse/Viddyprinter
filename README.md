Viddyprinter is a live score system for varsity tournaments. It was made at the University of York for the [College Varsity](http://www.nouse.co.uk/2014/03/02/college-varsity-live/) and [Roses](http://www.nouse.co.uk/sport/roses/) tournaments, which involve many different sports and fixtures and can span multiple days.

Some of the things it uses are Node.js, the [Express](http://expressjs.com/3x/api.html) web application framework, the [Socket.io](http://socket.io/) WebSocket thing, the [Jade](http://jade-lang.com/) template engine, and SQLite.

## Getting started

Clone this repository to somewhere on your computer, by entering something like this into a terminal window:

    git clone https://github.com/yorknouse/Viddyprinter.git
    cd viddyprinter

If Node.js (and the npm package manager) are installed, you can then install the dependencies:

    npm install

You might like to edit `config.js`. For local development, setting `exports.root` to `http://localhost:22245` can help.

You can then run `server.js`, either using one of the provided `start-*.sh` scripts or simply by typing `node server`.

If it's the first time, a SQLite database file (`viddyprinter.db`) will be created.

Open `http://localhost:22245` in your browser. You should see the index page.

Authentication uses the [Passport](http://passportjs.org/) middleware, and currently requires a Google account with an email address ending in `@nouse.co.uk`.
When the `NODE_ENV` environment variable is set to `development` (as it is when the `start-development.sh` script is used), there is no authentication.

## Deployment (Nouse-specific notes)

Changes made here have to be manually pulled (as the `www-data` user) for now.

This entry is in `www-data`'s `crontab`:

    @reboot  ~/viddyprinter/start-production.sh

The `start-production.sh` and `restart-production.sh` scripts expect [forever](https://github.com/foreverjs/forever) to be installed globally (`sudo npm install forever -g`).
