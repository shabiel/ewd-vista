// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

/* Two needed imports */
sessions = require('ewd-session');
runRPC   = require('ewd-vista/lib/runRPC');

module.exports = {
  servicesAllowed: {
    // // The EWD VistA app is useless without the login service
    // 'ewd-vista-login': true,
    // // Uncomment the following services as desired
    // 'ewd-vista-bedboard': true,
    // 'ewd-vista-taskman-monitor': true
  },
  // 
  handlers: {
    // getModulesData: function() {}
    // checkSecurityKeys: function() {}
  }
};

// Grab data about installed modules
function getVistaModules() {
  const fs   = require('fs');
  const path = require('path');

  let modulesPath  = __dirname.split('/').slice(0,-2).join('/');
  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];
  allModules.forEach(function(element, index, array) {
    if (element.match('ewd-vista')) {
      vistaModules.push(element);
    }
  });
  
  let vistaModulesData = {};
  vistaModules.forEach(function(element, index, array) {
    vistaModulesData[element] = (require('ewd-vista/package.json')).ewd_vista
  });
  
  return vistaModulesData;
}

function addServices() {
  let modulesData = getVistaModules();
  
  Object.keys(modulesData).forEach(function(element) {
    if (element != 'ewd-vista') {
      module.exports.servicesAllowed[element] = true;
    }
  });
}
addServices();

