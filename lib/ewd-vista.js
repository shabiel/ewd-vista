// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

module.exports = {
  servicesAllowed: {
    // The EWD VistA app is useless without the login service
    'ewd-vista-login': true,
    // Uncomment the following services as desired
    'ewd-vista-bedboard': true,
    'ewd-vista-taskman-monitor': true
  },
  // 
  handlers: {
    // vistaModules: (require('ewd-vista/package.json')).ewd_vista
    // vistaModules: function() {}
  }
};

/* Two needed imports */
sessions = require('ewd-session');
runRPC   = require('ewd-vista/lib/runRPC');

function vistaModules() {
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
  
}

vistaModules();

// var fs = require('fs');
// var path = require('path');
// console.log('Directory:')
// console.log(__dirname);
// // /home/osehra/ewd3/node_modules
// fs.readdir('/home/osehra/ewd3/node_modules', function(err, files) {
//   if (err) console.log(err);
//   else console.log(files);
// });
