// Required modules
// Uncomment this line in production
const EWD    = require('ewd-client').EWD;
// Uncomment this line for testing with Mocha
// EWD          = require('ewd-client').EWD;
const io     = require('socket.io-client');
const jQuery = require('jquery');
window.$     = window.jQuery = jQuery;
require('jquery-ui');
require('bootstrap');
toastr       = require('toastr');
// Uncomment this line in production
// toastr.options.preventDuplicates = true;

// App modules
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
    
    /* This is good for testing, but I don't want it normally.
    EWD.on('error', function(responseObj) {
      // automatically display all returned errors using toastr
      var error = responseObj.message.error || responseObj.message;
      toastr.error(error);
    });
    */
    
    // Initiate login procedure
    login.preLogin1(EWD);
  });
  
  EWD.start('ewd-vista', $, io);
});
