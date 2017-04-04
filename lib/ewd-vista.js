// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

/* Necessary imports */
sessions   = require('ewd-session');
runRPC     = require('ewd-vista/lib/runRPC');
const fs   = require('fs');
const path = require('path');

module.exports = {
  servicesAllowed: {
    // Added dynamically below with addServices()
  },
  handlers: {
    // Server methods
    getModules: function() {
      let modulesData = getVistaModules().slice(2);
      
      return modulesData;
    } // End ~ getModules()
  } // End ~ module.exports.handlers
};

// Private methods

// Grab data about installed VistA modules
function getVistaModules() {
  let cwd         = __dirname;
  let modulesPath = path.join(cwd, '../node_modules'); 

  let childModules = fs.readdirSync(modulesPath);
  let vistaModules = ['ewd-vista'];
  
  childModules.forEach(function(module) {
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
};

// Install Mumps routines and web assets for VistA modules
function installModules() {
  // This module essentially facilitates cp -R
  const ncp = require('ncp').ncp;
  // Determine default installation path for GT.M routines
  // TODO Find a solution for Caché & GT.M
  const cp = require('child_process');
  // Returns a string buffer
  let gtmRoutinesPath = cp.execSync("echo `mumps -r ^%XCMD 'W $$RTNDIR^%ZOSV'`");
  gtmRoutinesPath     = gtmRoutinesPath.toString('utf8').trim();
  
  let cwd         = __dirname;
  let qewdPath    = path.join(cwd, '../../..');
  let modulesPath = path.join(cwd, '../node_modules');
  let modules     = getVistaModules();
  let webTargetPath  = path.join(qewdPath, 'www', 'ewd-vista');
  
  console.log(modules);
  
  // Install files
  modules.forEach(function(module) {
    let moduleRoutinesPath = '';
    let routines           = [];
    let webSourcePath      = '';
    
    // Distinguish between parent and child modules
    if (module.module == 'ewd-vista') {
      moduleRoutinesPath = path.join(cwd, '../routines');
      webSourcePath      = path.join(cwd, '../www');
    }
    else {
      moduleRoutinesPath = path.join(modulesPath, module.module, 'routines');
      webSourcePath      = path.join(modulesPath, module.module, 'www');
    }
    
    // Install Mumps routines
    if (fs.existsSync(moduleRoutinesPath)) {
      routines = fs.readdirSync(moduleRoutinesPath);
      
      routines.forEach(function(routine) {
        let webSourcePath = path.join(moduleRoutinesPath, routine);
        let webTargetPath = path.join(gtmRoutinesPath, routine);
        
        fs.createReadStream(webSourcePath).pipe(fs.createWriteStream(webTargetPath));
      });
    }
    
    // Install web assets
    // Only works if the following exist:
    //   ~/qewd/www/ewd-vista/index.html
    //   ~/qewd/www/ewd-vista/assets/javascripts/bundle.js
    let ncpOptions = {
      clobber: true,
      limit: 4
    }
    ncp(webSourcePath, webTargetPath, ncpOptions, function(err) {
      if (err) {
        console.log('NCP Error:');
        console.log(err);
      }
    });    
  }); // End ~ modules.forEach
};
installModules();

// Add services to module exports
function addServices() {
  let modulesData = getVistaModules().slice(1);
  
  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });  
};
addServices();
