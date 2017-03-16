# EWD VistA

EWD VistA is the core of a modular web interface for VistA. It is useless without at least the EWD VistA Login module, so the installation instructions below include installation of that module. At the moment, it only works with VistA on GT.M. 

Something about QEWD... [GitHub](https://github.com/robtweed/qewd).

These instruction assume that your QEWD root directory is ~/qewd.

## Installation

````
$ mkdir qewd
$ cd qewd
$ npm install qewd qewd-monitor
$ npm install nodem
$ cp node_modules/nodem/src/v4wNode.m ~/r/
````

Edit your GT.M config file; include the following line, modifying the path as necessary.

````
export GTMCI=/home/osehra/qewd/node_modules/nodem/resources/nodem.ci
````

````
$ mkdir -p www/qewd-monitor
$ cp node_modules/qewd-monitor/www/* www/qewd-monitor/

$ cp node_modules/qewd/example/qewd-gtm.js ./qewd.js
````

Edit qewd.js; include something like the following:

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
````

Start the service.

````
$ node qewd.js
````

Check http://[domain or IP]:8080/ewd-monitor/

Ultimately, cloning the following repositories will not be necessary. The EWD VistA modules will be installed through NPM. They have already been published to NPMJS, but the published versions are not up to date with the GitHub versions.

````
$ cd node_modules
$ git clone https://github.com/shabiel/ewd-vista.git
$ git clone https://github.com/shabiel/ewd-vista-login.git
$ git clone https://github.com/shabiel/ewd-vista-bedboard.git
$ git clone https://github.com/shabiel/ewd-vista-taskman-monitor.git
$ git clone https://github.com/shabiel/ewd-vista-fileman.git

$ cd ewd-vista
$ npm install ewd-client
$ npm install ncp
$ cd ~/qewd

$ mkdir www/ewd-vista
$ cp -R node_modules/ewd-vista/www/* www/ewd-vista/

$ node qewd.js
````

Check http://[domain or IP]:8080/ewd-vista/

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
  ]
}
````

##Modules

* [Login](https://github.com/shabiel/ewd-vista-login)
* [BedBoard](https://github.com/shabiel/ewd-vista-bedboard)
* [TaskMan Monitor](https://github.com/shabiel/ewd-taskman-monitor)
* [FileMan](https://github.com/shabiel/ewd-vista-fileman)
