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
    // Added dynamically below with addServices()
  },
  handlers: {
    getModules: function() {
      let modulesData = getVistaModules().slice(1);
      
      return modulesData;
    },
    convertDILISTToArray: function(node) {
      /*
      ^TMP('DILIST',1314,0)='3236^*^0^'
      ^TMP('DILIST',1314,0,'MAP')='IEN^IX(1)'
      ^TMP('DILIST',1314,1,0)='1578^ACKQAUD1'
      ^TMP('DILIST',1314,2,0)='1579^ACKQAUD2'
      */
      
      let arrayKey = node.$('0').$('MAP').value;
      let entriesArray = [];
      
      node.forEachChild(
        {
          range: {
            from: '1',
            to: ' '
          }
        }, 
        function(name, ChildNode) {
          entriesArray.push(ChildNode.$('0').value);
        }
      );
      
      let results       = {};
      results[arrayKey] = entriesArray;
      
      return results;
    }
  }
};

// Grab data about installed VistA modules
function getVistaModules() {
  const fs   = require('fs');
  const path = require('path');

  let modulesPath  = __dirname.split('/').slice(0,-2).join('/');
  let allModules   = fs.readdirSync(modulesPath);
  let vistaModules = [];
  allModules.forEach(function(element) {
    if (element.match('ewd-vista')) {
      vistaModules.push(element);
    }
  });

  let vistaModulesData = [];
  vistaModules.forEach(function(element) {
    if (element != 'ewd-vista') {
      vistaModulesData.push((require(element + '/package.json')).ewd_vista);
    }
  });
  vistaModulesData.sort((x,y) => { return x.sortOrder > y.sortOrder });
  
  return vistaModulesData;
}

// Add services to module exports
function addServices() {
  let modulesData = getVistaModules();

  modulesData.forEach(function(element) {
    module.exports.servicesAllowed[element.module] = true;
  });  
}
addServices();

