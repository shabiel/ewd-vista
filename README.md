# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. Works on both GT.M and Cache.

Something about QEWD... [GitHub](https://github.com/robtweed/qewd).

These instruction assume that your QEWD root directory is ~/qewd.

You MUST use Node.js 6.x or higher, as we use ES6 in the code.

## Installation

````
$ mkdir qewd
$ cd qewd
$ npm install qewd qewd-monitor
````

On GT.M (adjust destination directory as appropriate).
```
$ npm install nodem
$ cp node_modules/nodem/src/v4wNode.m ~/r/
```

and edit your GT.M config file; include the following line, modifying the path as necessary.

````
export GTMCI=/home/osehra/qewd/node_modules/nodem/resources/nodem.ci
````

On Cache: Obtain cache0610.node from Intersystems and rename it as cache.node and place into the qewd/node\_modules folder.

Load the routines in the routines folder into Cache. Use [IN^%][http://www.hardhats.org/tools/%25%20routine.html] on Cache. Routines get automatically copied on GT.M, with the exception of ewdSymbolTable.m.

````
cp ./node_modules/ewd-session/mumps/ewdSymbolTable.m ~/r/
````

Then install QEWD Monitor:

````
$ mkdir -p www/qewd-monitor
$ cp node_modules/qewd-monitor/www/* www/qewd-monitor/

$ cp node_modules/qewd/example/qewd-gtm.js ./qewd.js
````

Edit qewd.js; include something like the following (make sure you use GT.M or Cache as appropriate):

````
var config = {
  managementPassword: 'verySekret!',
  serverName: 'QEWD VistA',
  port: 8080,
  poolSize: 2,
  database: {
    type: 'gtm'
  }
};

var routes = [{
  path: '/ewd-vista-pushdata',
  module: 'ewd-vista-push-handler'
}]

var qewd = require('qewd').master;
qewd.start(config, routes);

````

Start the service. `NODE_ENV=production` turns on automated copying of modules.

````
$ NODE_ENV=production node qewd.js
````

Check http://[domain or IP]:8080/qewd-monitor/

Ultimately, cloning the following repositories will not be necessary. The EWD VistA modules will be installed through NPM. They have already been published to NPMJS, but the published versions are not up to date with the GitHub versions.

````
$ cd node_modules
$ git clone https://github.com/shabiel/ewd-vista.git
$ cd ewd-vista && npm install
$ cd ..
$ git clone https://github.com/shabiel/ewd-vista-login.git
$ git clone https://github.com/shabiel/ewd-vista-bedboard.git
$ git clone https://github.com/shabiel/ewd-vista-taskman-monitor.git
$ git clone https://github.com/shabiel/ewd-vista-fileman.git
$ git clone https://github.com/shabiel/ewd-vista-pharmacy.git
$ git clone https://github.com/shabiel/ewd-vista-push-handler.git

$ cd ~/qewd
$ mkdir www/ewd-vista
$ cp -R node_modules/ewd-vista/www/* www/ewd-vista/

$ NODE_ENV=production node qewd.js
````

Check http://[domain or IP]:8080/ewd-vista/

If you make changes to app.js in this repo, you need to repackage it by:

```
browserify -t [babelify] client/app.js -o www/assets/javascripts/bundle.js
```

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
  quantity: '8',
  stringFrom: 'CAR',
  stringPart: 'CAR',
  index: '',
  screen: '',
  identifier: '',
  //
  records: [
    {
      ien: '57',
      name: 'CARLSON,ALEXIS'
    }
  ],
  value: '',
  // Response-only attributes
  error: {
    code: '',
    message: '',
    help: ''
  },
  laygo: boolean,
  valid: boolean
}
````

## Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
* [TaskMan Monitor](https://github.com/shabiel/ewd-taskman-monitor)
* [FileMan](https://github.com/shabiel/ewd-vista-fileman)
* [Pharmacy](https://github.com/shabiel/ewd-vista-pharmacy)
* [Push Handler](https://github.com/shabiel/ewd-vista-push-handler)
