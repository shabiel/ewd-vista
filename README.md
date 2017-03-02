# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. At the moment, it only works with VistA on GT.M. 

Something about QEWD... [GitHub](https://github.com/robtweed/qewd).

These instruction assume that your QEWD root directory is ~/qewd.

##Installation

````
$ mkdir qewd
$ cd qewd
$ npm install qewd qewd-monitor
$ npm install nodem
````

````
$ mkdir -p www/qewd-monitor
$ cp node_modules/qewd-monitor/www/* www/qewd-monitor/

$ cp node_modules/qewd/example/qewd-gtm.js ./qewd.js
````

Edit qewd.js

````
$ node qewd.js
````

Check http://[domain or IP]:8080/ewd-monitor/

````
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
````

Check http://localhost:8080/ewd-vista/

Your VistA application should be available at http://[domain or IP]:8080/ewd-vista/index.html

##FilemanMsg

````
filemanMsg: {
  file: {
    name: 'NEW PERSON',
    number: '200'
  },
  iens: '',
  fields: [
    {
      key: 'ien',
      name: 'IEN',
      number: ''
    },
    {
      key: 'name',
      name: 'Name',
      number: '.01'
    }
  ],
  flags: '',
  quantity: 8,
  stringFrom: 'CAR',
  stringPart: 'CAR',
  identifier: '',
  screen: '',
  index: '',
  records: [
    {
      ien: '57',
      name: 'CARLSON,ALEXIS'
    }
  ]
}
````

##Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
* [TaskMan Monitor](https://github.com/shabiel/ewd-taskman-monitor)
* [FileMan](https://github.com/shabiel/ewd-vista-fileman)
