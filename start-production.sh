#!/bin/sh

export PATH=/usr/local/bin:$PATH

export NODE_ENV=production # app.get('env')

forever start /var/www/viddyprinter/server.js 2>&1
