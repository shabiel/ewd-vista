/* Necessary imports */
sessions   = require('ewd-session');
runRPC     = require('ewd-vista/lib/runRPC');
fileman    = require('ewd-vista-fileman').handlers;
const fs   = require('fs');
const path = require('path');
require('./mFunctions');

module.exports = {
  servicesAllowed: {
    'ewd-vista': true
    // Others added dynamically below with addServices()
  },
  handlers: {
    // Server methods
    getModeSync: function() {
      let mode = process.env.NODE_ENV || 'development';

      return mode;
    },
    getModules: function() {
      let modulesData = getVistaModules().slice(2);

      return modulesData;
    },
    isConfigOptionSetSync: function(module, option) {
      let config   = require(module + '/package.json').ewdVista.config || [];
      let response = config.includes(option);

      return response;
    },
    // Client methods
    getMode: function(messageObj, session, send, finished) {
      let mode = this.handlers['ewd-vista'].getModeSync();

      finished({mode: mode});
    },
    getFixtures: function(messageObj, session, send, finished) {
      let fixtures = require(messageObj.params.module + '/test/fixtures.json') || {};

      finished({fixtures: fixtures});
    },
    switchApp: function(messageObj, session, send, finished) {
      session.data.$('currentApplication').value = messageObj.params.applicationName;
      finished({ applicationName: session.data.$('currentApplication').value });
    }
  } // End ~ module.exports.handlers
};

// Private methods

// Grab data about installed VistA modules
function getVistaModules() {
  let modulesPath = path.join(__dirname, '../..');

  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];

  allModules.forEach(function(module) {
    if (module.match('ewd-vista')) {
      vistaModules.push(module);
    }
  });

  let vistaModulesData = [];

  vistaModules.forEach(function(module) {
    vistaModulesData.push(require(module + '/package.json').ewdVista);
  });
  vistaModulesData.sort((x,y) => { return x.sortOrder > y.sortOrder; });

  return vistaModulesData;
}

// Install Mumps routines and web assets for VistA modules
function installModules() {
  // Only install modules if in production mode
  let mode = module.exports.handlers.getModeSync();
  if (mode === 'production') {
    // Are we on Cache or GT.M? Check to see if cache.node is loaded.
    let isCache = false;
    let isGTM = false;

    // We use require.cache (no relation to Intersystems Cache) for that.
    Object.keys(require.cache).some(function(e) {
      if (e.indexOf('cache.node') > 0) {
        isCache = true;
        return true;
      }
      if (e.indexOf('nodem.node') > 0) {
        isGTM = true;
        return true;
      }
    });

    if (isCache) console.log('I am on Intersystems Cache!');
    if (isGTM) console.log('I am on GT.M!');
    if (!isCache && !isGTM) x = 1/0;

    let gtmRoutinesPath;
    // Determine default installation path for GT.M routines
    if (isGTM) {
      const cp = require('child_process');
      // Returns a string buffer
      gtmRoutinesPath  = cp.execSync("echo `$gtm_dist/mumps -r ^%XCMD 'W $$RTNDIR^%ZOSV'`");
      gtmRoutinesPath  = gtmRoutinesPath.toString('utf8').trim();
    }

    let modulesPath = path.join(__dirname, '../..');
    let webPath     = path.join(__dirname, '../../../www/ewd-vista');
    let modules     = getVistaModules();

    // Install files
    // The ncp module essentially facilitates cp -R
    const ncp = require('ncp').ncp;
    let ncpOptions = {
      clobber: true,
      limit: 4
    };

    modules.forEach(function(module) {
      // Install Mumps routines (only supported for GT.M fow now)
      if (isGTM) {
        let moduleRoutinesPath = path.join(modulesPath, module.module, 'routines');

        if (fs.existsSync(moduleRoutinesPath)) {
          let routines = fs.readdirSync(moduleRoutinesPath);

          routines.forEach(function(routine) {
            let sourcePath = path.join(moduleRoutinesPath, routine);
            let targetPath = path.join(gtmRoutinesPath, routine);

            fs.createReadStream(sourcePath).pipe(fs.createWriteStream(targetPath));
          });
        }
      }

      // If service only module, don't try to copy anything.
      if (module.service) return true;

      // Install web assets
      // Only works if the following exist:
      //   ~/qewd/www/ewd-vista/index.html
      //   ~/qewd/www/ewd-vista/assets/javascripts/bundle.js
      let sourcePath = path.join(modulesPath, module.module, 'www');

      ncp(sourcePath, webPath, ncpOptions, function(err) {
        if (err) {
          console.log('NCP Error:');
          console.log(err);
        }
      });
    }); // End ~ modules.forEach
  } // End ~ check for production mode
} // End ~ installModules()
installModules();

// Add services to module exports
function addServices() {
  let modulesData = getVistaModules().slice(1);

  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });
}
addServices();
