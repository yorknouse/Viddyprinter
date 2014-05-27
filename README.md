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

## Adding data

Frustratingly, adding tournaments and fixtures currently has to be done manually, probably by typing something like this into a terminal window (once you've created `viddyprinter.db` by running `server.js` for the first time):

    sqlite3 viddyprinter.db

This should be obviated by additions to the web interface as soon as possible. For now, the easiest thing is to manually add as many empty rows to the `Fixtures` table as you think you'll need (empty save for the `tournament` column corresponding to the `id` of a row in the `Tournaments` table), and then happily use the web interface to fill in all the actual data.
