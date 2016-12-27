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
  }
};

/* Two needed imports */
sessions = require('ewd-session');
runRPC   = require('ewd-vista/lib/runRPC');
