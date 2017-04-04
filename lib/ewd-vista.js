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
fileman    = require('ewd-vista-fileman').handlers;
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
};

// Install Mumps routines and web assets for VistA modules
function installModules() {
  // Determine default installation path for GT.M routines
  // TODO Find a solution for Caché & GT.M
  const cp = require('child_process');
  // Returns a string buffer
  let gtmRoutinesPath = cp.execSync("echo `mumps -r ^%XCMD 'W $$RTNDIR^%ZOSV'`");
  gtmRoutinesPath     = gtmRoutinesPath.toString('utf8').trim();
  // The ncp module essentially facilitates cp -R
  const ncp = require('ncp').ncp;
  let ncpOptions = {
    clobber: true,
    limit: 4
  }
  
  let modulesPath = path.join(__dirname, '../..');
  let webPath     = path.join(__dirname, '../../../www/ewd-vista');
  let modules     = getVistaModules();
  
  // Install files
  modules.forEach(function(module) {
    // Install Mumps routines
    let moduleRoutinesPath = path.join(modulesPath, module.module, 'routines');
    
    if (fs.existsSync(moduleRoutinesPath)) {
      let routines = fs.readdirSync(moduleRoutinesPath);
      
      routines.forEach(function(routine) {
        let sourcePath = path.join(moduleRoutinesPath, routine);
        let targetPath = path.join(gtmRoutinesPath, routine);
  
        fs.createReadStream(sourcePath).pipe(fs.createWriteStream(targetPath));
      });
    }
    
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
