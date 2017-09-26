/* Necessary imports */
sessions   = require('ewd-session');
runRPC     = require('ewd-vista/lib/runRPC');
fileman    = require('ewd-vista-fileman').handlers;
const fs   = require('fs');
const path = require('path');
const cp = require('child_process');
require('./mFunctions');
const assert = require('assert');

module.exports = {
  servicesAllowed: {
    // Added dynamically below with addServices() when this file is loaded.
  },
  handlers: {
    // Server methods
    getModeSync: function() {
      let mode = process.env.NODE_ENV || 'development';

      return mode;
    },
    getModules: function() {
      let modulesData = getVistaModules();

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
      let fixtures = {};
      try {
        fixtures = require(messageObj.params.module + '/test/fixtures.json');
      }
      catch (error) {
        // Non-sense for ESLint to be quiet.
        let i = 5;
      }

      finished({fixtures: fixtures});
    },
    switchApp: function(messageObj, session, send, finished) {
      session.data.$('currentApplication').value = messageObj.params.applicationName;
      finished({ applicationName: session.data.$('currentApplication').value });
    },
    agencyIsVA: function(messageObj, session, send, finished) {
      this.db.symbolTable.restore(session);
      let agency = this.db.symbolTable.getVar('DUZ("AG")');
      finished(agency === 'V');
    },
    agencyIsIHS: function(messageObj, session, send, finished) {
      this.db.symbolTable.restore(session);
      let agency = this.db.symbolTable.getVar('DUZ("AG")');
      finished(agency === 'I');
    }
  }, // End ~ module.exports.handlers




  // Called by EVERY module to initialize QEWD with extra custom methods. 
  // Careful in changing this.
  init: function() {
    // Initialise Symbol Table
    this.db.symbolTable = sessions.symbolTable(this.db);

    // On Caché, if we don't have this, add it using D^ewdVistAUtils
    if (this.db.procedure === undefined) {
      let that = this;
      // This is for Caché.
      this.db.procedure = function(procObj) {
        // Make an arg to a do command we can D @ARG
        let procArg0 = procObj.procedure;
        let args = procObj.arguments;
        if (args) procArg0 += '("'+ args.join('","') + '")';
        let procArray = new Array();
        procArray.push(procArg0);
        that.db.function({function: 'D^ewdVistAUtils', arguments: procArray});
      };
    }
  },


  // Security Check for each application
  beforeHandler: function(messageObj, session, send, finished) {
    let moduleName = messageObj.service;
    if (moduleName === 'ewd-vista-login') return true;
    if (moduleName === 'ewd-vista') return true;

    if (!session.authenticated) { 
      finished({error: 'User MUST be authenticated'});
      return false;
    }

    let modulePath = path.join(__dirname, '..', '..', moduleName);
    let packagePath = path.join(modulePath, 'package.json');
    let packageData;

    try {
      packageData = require(packagePath);
    }
    catch(err) {
      finished({error: 'Module cannot be found'});
      return false;
    }

    this.db.symbolTable.restore(session);
    let duz = +this.db.symbolTable.getVar('DUZ');

    // Not supposed to happen, as we are logged in.
    if (!duz) {
      finished({error: 'DUZ is not defined'});
      return false;
    }

    let auth = false;
    let securityKey = packageData.ewdVista.securityKey;
    if (securityKey) {
      auth = new this.documentStore.DocumentNode('XUSEC', [securityKey, duz]).hasValue;
    }
    else { // No security key on module - can access it fine.
      auth = true;
    }

    if (auth) return true;

    finished({error: 'You do not hold the appropriate security key'});
    return false;
  }
};

// Get authorized modules for a user
module.exports.handlers.getAuthorizedModules = function(messageObj, session, send, finished) {
  if (!session.authenticated) { 
    finished({error: 'User MUST be authenticated'});
    return false;
  }

  this.db.symbolTable.restore(session);
  let duz = +this.db.symbolTable.getVar('DUZ');

  // Not supposed to happen, as we are logged in.
  if (!duz) {
    finished({error: 'DUZ is not defined'});
    return false;
  }

  let modulesData           = this.handlers['ewd-vista'].getModules();
  let authorizedModulesData = [];

  for (var i = 0; i < modulesData.length; i++) {
    let moduleData   = modulesData[i];
    let securityKey = moduleData.securityKey;
    let auth         = false;

    // Check that the user has the security key in the module
    // Will need to be recursive when we have nested modules.
    if (securityKey) {
      auth = new this.documentStore.DocumentNode('XUSEC', [securityKey, duz]).hasValue;
    }
    else {
      auth = true;
    }

    if (auth) authorizedModulesData.push(moduleData);
  }

  finished({modulesData: authorizedModulesData});
};
// Private methods

// Grab data about installed VistA modules
function getVistaModules() {
  let modulesPath = path.join(__dirname, '..', '..');

  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];

  allModules.forEach(function(module) {
    if (module.match('ewd-vista')) {
      vistaModules.push(module);
    }
  });

  let vistaModulesData = [];

  vistaModules.forEach(function(module) {
    let moduleData = require(path.join(module, 'package.json'));
    let thisVistaMoudleData = {};
    thisVistaMoudleData.module = moduleData.name;
    Object.assign(thisVistaMoudleData, moduleData.ewdVista);
    vistaModulesData.push(thisVistaMoudleData);
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
      if (e.indexOf('mumps.node') > 0) {
        isGTM = true;
        return true;
      }
    });

    if (isCache) console.log('I am on Intersystems Cache!');
    if (isGTM)   console.log('I am on GT.M!');
    assert(isCache || isGTM);

    let gtmRoutinesPath;
    // Determine default installation path for GT.M routines
    if (isGTM) {
      // Returns a string buffer -> toString converts it to a string.
      gtmRoutinesPath  = cp.execSync('echo `$gtm_dist/mumps -r ^%XCMD \'W $$RTNDIR^%ZOSV\'`');
      gtmRoutinesPath  = gtmRoutinesPath.toString('utf8').trim();
    }

    let modulesPath = path.join(__dirname, '..', '..');
    let webPath     = path.join(__dirname, '..', '..', '..', 'www', 'ewd-vista');
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

            cp.execSync(`cp ${sourcePath} ${targetPath}`);
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
  let modulesData = getVistaModules();

  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });
}
addServices();
