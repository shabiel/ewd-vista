// This is the main client file in Panorama that starts EVERYTHING!
//
// EWD Client
const EWD = require('ewd-client').EWD;

// M functions added to String prototype
// Date support for Timson Dates on the Number and Date prototypes
require('../lib/mFunctions.js');

// Polyfills for IE (mostly from MDN)
require('../lib/polyfills.js');

// Jquery
global.$ = global.jQuery = require('jquery');

// Jquery-UI (needs browserify-css with -g flag)
// NB: You must remove the comments in theme.css for browserify-css
$.ui = jQuery.ui = require('jquery-ui');
require('jquery-ui/ui/position');
require('jquery-ui/ui/widgets/autocomplete');
require('jquery-ui/ui/widgets/menu');
require('jquery-ui/ui/unique-id');
require('jquery-ui/ui/keycode');
require('jquery-ui/ui/safe-active-element');
require('jquery-ui/themes/base/all.css');

// Bootstrap (needs browserify-css with -g flag)
require('bootstrap');
require('bootstrap/dist/css/bootstrap.css');

// Toastr (needs browserify-css with -g flag)
global.toastr = require('toastr');
require('toastr/package/toastr.css');

// Uncomment this line in production
// toastr.options.preventDuplicates = true;


// Xterm (needs browserify-css with -g flag)
let vista = {};
vista.terminal = require('xterm');
require('xterm/lib/addons/fit/fit');
require('xterm/lib/addons/attach/attach');
require('xterm/dist/xterm.css');

// Local stylesheets
// require('ewd-vista/www/assets/stylesheets/main.css'); --> issues with
// sourcing local fonts
// NB: Need to install browserify-css in ewd-vista-login
require('ewd-vista-login/www/assets/stylesheets/login.css');

// VistA utilities
vista.horologToExternal = function(horoTimeStamp) {
  let horoZero = -4070880000000;
  let horoDays = horoTimeStamp.split(',')[0];
  let horoSecs = horoTimeStamp.split(',')[1];

  let epochTime = horoZero;
  epochTime     = epochTime + horoDays*86400*1000;
  epochTime     = epochTime + horoSecs*1000;

  return new Date(epochTime);
};

vista.switchApp = function(applicationName) {
  // Clear the page
  $('#main-content').empty();
  $('footer').empty();
  // Clear the nav
  $('#options-menu').addClass('invisible');
  $('#options-name').text('');
  $('#options-menu .dropdown-menu').html('');

  let params = {
    service: 'ewd-vista',
    type: 'switchApp',
    params: { applicationName : applicationName || '' }
  };

  EWD.send(params);
};

global.vista = vista;

// VistA modules
const login = require('ewd-vista-login/client/vista-login');
// Others loaded dynamically by Login module

/*
  This section starts everything. If you are following
  the code, start here.
  Rob's changes to what I thought:
   * Set EWD.log to true here
   * Call EWD.start here.
*/
$(document).ready(function() {
  /* .on needs to come first so that we know what we need
     to do after we start. Otherwise, maybe race condition */
  EWD.on('ewd-registered', function() {
    EWD.log = true;
    console.log('**** Got the ewd-register event!!');

    EWD.on('socketDisconnected', function() {
      location.reload();
    });

    // This is good for testing, but I don't want it normally.
    EWD.on('error', function(responseObj) {
      // automatically display all returned errors using toastr
      var error = responseObj.message.error || responseObj.message;
      toastr.error(error);
    });

    // Initiate login procedure
    login.preLogin1(EWD);
  });

  EWD.start('ewd-vista', $, io);
});
