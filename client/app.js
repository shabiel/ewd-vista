// EWD Client
const EWD = require('ewd-client').EWD;

// M functions added to String prototype
require('../lib/mFunctions.js');

// Polyfills for IE (mostly from MDN)
require('../lib/polyfills.js');

// Jquery
$ = window.jQuery = require('jquery');

// Bootstrap
require('bootstrap');


// Uncomment this line in production
// toastr.options.preventDuplicates = true;

// VistA utilities
vista = {
  horologToExternal: function(horoTimeStamp) {
    let horoZero = -4070880000000;
    let horoDays = horoTimeStamp.split(',')[0];
    let horoSecs = horoTimeStamp.split(',')[1];

    let epochTime = horoZero;
    epochTime     = epochTime + horoDays*86400*1000;
    epochTime     = epochTime + horoSecs*1000;

    return new Date(epochTime);
  },
  switchApp: function(applicationName) {
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
  }
};

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
      //location.reload();
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
