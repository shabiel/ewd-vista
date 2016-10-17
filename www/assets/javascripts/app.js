var EWD    = require('ewd-client').EWD;
var io     = require('socket.io-client');
var jQuery = require('jquery');
window.$   = window.jQuery = jQuery;
require('bootstrap');
var toastr = require('toastr');
var login  = require('ewd-vista-login/client/vista-login');

var VISTA     = {};
VISTA.appName = 'ewd-vista';

/*
  This section starts everything. If you are following
  the code, start here.
  Rob's changes to what I thought:
   * Set EWD.log to true here
   * Call EWD.start here.
*/
``
$(document).ready(function() {
  /* .on needs to come first so that we know what we need
     to do after we start. Otherwise, maybe race condition */
  EWD.on('ewd-registered', function() {
    EWD.log = true;
    console.log('*** got the ewd-register event!!');
    
    EWD.on('socketDisconnected', function() {
      location.reload()
    });
    
    VISTA.preLogin1();
  });

  /* This is good for testing, but I don't want it normally.
  EWD.on('error', function(responseObj) {
    // automatically display all returned errors using toastr
    var error = responseObj.message.error || responseObj.message;
    toastr.error(error);
  });
  */

  EWD.start(VISTA.appName, $, io);
});

/* ---------------- */
/* THIS IS THE FIRST NON-LOGIN RELATED FUNCTION */
VISTA.showApplication = function () {
    VISTA.initNavBar();
    // Uncomment to use Bed Board module
    // VISTA.showWards();
}

// Uncomment to use Bed Board module
//
// Show Wards and Beds. Called from show application
// VISTA.showWards = function() {
//   EWD.send({type: 'wards'}, function(responseObj) {
//     var wards = responseObj.message.wards;
//     console.log(wards);
//
//     wards.forEach(function(ward, index, array) {
//       var html = '<div class="main col-md-4"><h2 class="sub-header">';
//       html     = html + ward.name + '</h2><div class="table-responsive">';
//       html     = html + '<table class="table table-striped"><thead><tr><td>Bed</td>';
//       html     = html + '<td>Patient</td><td>Gender</td><td>Admission Date</td>';
//       html     = html + '</tr></thead><tbody>';
//
//       var beds = ward.beds;
//       beds.forEach(function(bed, index, array) {
//         html = html + '<tr><td>' + bed.name;
//         if (bed.oos) {
//           html = html + ' <span class="glyphicon glyphicon-exclamation-sign"';
//           html = html + ' aria-hidden="true" title="' + bed.oos + '"></span>';
//         }
//         html = html + '</td><td>';
//         if (bed.patient.name) {
//           html = html + bed.patient.name;
//         }
//         html = html + '</td><td>';
//         if (bed.patient.sex) {
//           html = html + bed.patient.sex;
//         }
//         html = html + '</td><td>';
//         if (bed.patient.admissionDate) {
//           html = html + bed.patient.admissionDate.replace(/@.*/, '');
//         }
//         html = html + '</td></tr>';
//       });
//
//       html = html + '</tbody></table></div></div>';
//
//       $('#wards').append(html);
//     });
//
//     $('#wards glyphicon-exclamation-sign').hover()
//
//     $('#wards').show();
//   });
// }
