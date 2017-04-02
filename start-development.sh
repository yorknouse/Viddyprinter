#!/bin/bash

export PATH=/usr/local/bin:$PATH
export NODE_ENV=development # app.get('env')

if [ ! -f "package.json" ]; then
	if [ -d "/vagrant-viddyprinter" ]; then
		cd /vagrant-viddyprinter
	fi
fi

npm install
forever start server.js
