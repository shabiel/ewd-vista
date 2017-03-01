# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. At the moment, it only works with VistA on GT.M. You must first have EWD 3 installed and configured. [Rob Tweed's website](http://ec2.mgateway.com/ewd/ws/index.html#) is the place to start if you don't yet have EWD 3 installed.

The organization of this module and these instructions are derived from examples provided by [Rob Tweed](https://github.com/robtweed).

These instruction assume that your EWD 3 root directory is ~/ewd3.

##Installation

$ mkdir qewd
$ cd qewd
$ npm install qewd qewd-monitor
$ npm install nodem

$ mkdir -p www/qewd-monitor
$ cp node_modules/qewd-monitor/www/* www/qewd-monitor/

$ cp node_modules/qewd/example/qewd-gtm.js ./qewd.js

Edit qewd.js

$ node qewd.js

Check http://localhost:8080/ewd-monitor/

$ npm install ewd-vista
$ npm install ewd-vista-login
$ npm install ewd-vista-bedboard
$ npm install ewd-vista-taskman-monitor
$ npm install ewd-vista-fileman

$ cp node_modules/ewd-vista/routines/ewdVistAFileman.m ~/r/
$ cp node_modules/ewd-vista/routines/ewdVistARPC.m ~/r/
$ cp node_modules/ewd-vista/routines/ewdVistAUtils.m ~/r/

$ cd node_modules/ewd-vista
$ npm install ewd-client
$ cd ~/qewd

$ mkdir www/ewd-vista
$ cp -R node_modules/ewd-vista/www/* www/ewd-vista/
$ cp -nR node_modules/ewd-vista-login/www/* www/ewd-vista/
$ cp -nR node_modules/ewd-vista-bedboard/www/* www/ewd-vista/
$ cp -nR node_modules/ewd-vista-bedboard/www/* www/ewd-vista/
$ cp -nR node_modules/ewd-vista-taskman-monitor/www/* www/ewd-vista/
$ cp -nR node_modules/ewd-vista-fileman/www/* www/ewd-vista/

$ cd www/ewd-vista
$ ln -s ~/qewd/node_modules/ewd-vista/www/index.html index.html
$ mkdir -p assets/javascrscripts
$ mkdir assets/stylesheets
$ cd assets/javascripts
$ ln -s ~/qewd/node_modules/ewd-vista/www/assets/javascripts/bundle.js bundle.js
$ ln -s ~/qewd/node_modules/ewd-vista-bedboard/client/vista-bedboard.js vista-bedboard.js
$ ln -s ~/qewd/node_modules/ewd-vista-fileman/client/vista-fileman.js vista-fileman.js
$ ln -s ~/qewd/node_modules/ewd-vista-taskman-monitor/client/vista-taskman-monitor.js vista-taskman-monitor.js
$ cd ../stylesheets
$ ln -s ~/qewd/node_modules/ewd-vista/www/assets/stylesheets/main.css main.css
$ ln -s ~/qewd/node_modules/ewd-vista-login/www/assets/stylesheets/login.css login.css
$ ln -s ~/qewd/node_modules/ewd-vista-bedboard/www/assets/stylesheets/bedboard.css bedboard.css
$ ln -s ~/qewd/node_modules/ewd-vista-taskman-monitor/www/assets/stylesheets/taskman-monitor.css taskman-monitor.css
$ ln -s ~/qewd/node_modules/ewd-vista-fileman/www/assets/stylesheets/fileman.css fileman.css
$ cd ~/qewd

$ node qewd.js

Check http://localhost:8080/ewd-vista/

If you have a default installation of EWD 3, your VistA application should be available at http://[domain or IP]:8080/ewd-vista/index.html

##Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
