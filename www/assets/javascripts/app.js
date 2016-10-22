var EWD    = require('ewd-client').EWD;
var io     = require('socket.io-client');
var jQuery = require('jquery');
window.$   = window.jQuery = jQuery;
require('jquery-ui');
require('bootstrap');
var toastr = require('toastr');
var login  = require('ewd-vista-login/client/vista-login');

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
    console.log('*** got the ewd-register event!!');
    
    EWD.on('socketDisconnected', function() {
      location.reload();
    });
    
    login.preLogin1(EWD);
  });

  /* This is good for testing, but I don't want it normally.
  EWD.on('error', function(responseObj) {
    // automatically display all returned errors using toastr
    var error = responseObj.message.error || responseObj.message;
    toastr.error(error);
  });
  */

  EWD.start('ewd-vista', $, io);
});
