(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
let clientMethods = {};

/* Call to see if we can log on */
clientMethods.preLogin1 = function (EWD) {
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'isLogonInhibited' };
  EWD.send(messageObj, function (responseObj2) {
    clientMethods.preLogin2(responseObj2, EWD);
  });
};

/* Handle reply from isLogonInhibited */
clientMethods.preLogin2 = function (responseObj, EWD) {
  if (responseObj.message.isLogOnProhibited) {
    $('#modal-window').html('<h1>Log-ons are Prohibited.</h1>').removeClass('modal').removeClass('fade').addClass('jumbotron');
    return;
  }
  if (responseObj.message.isMaxUsersOnSystem) {
    $('#modal-window').html('<h1>No more users are allowed on the system.</h1>').removeClass('modal').removeClass('fade').addClass('jumbotron');
    return;
  }

  let params = {
    service: 'ewd-vista-login',
    name: 'login.html',
    targetId: 'modal-window'
  };
  EWD.getFragment(params, function () {
    clientMethods.login(EWD);
  });
};

// Called from getFragment in preLogin2.
clientMethods.login = function (EWD) {
  // Handle click of Login Button
  $('#loginBtn').on('click', function (e) {
    let ac = $('#username').val();
    let vc = $('#password').val();
    if (ac === '' || vc === '') {
      toastr.options.target = '#modal-dialog';
      toastr.error('Must enter both access and verify codes');
      return;
    }

    let messageObj = {
      service: 'ewd-vista-login',
      type: 'login',
      params: {
        ac: ac,
        vc: vc
      }
    };
    EWD.send(messageObj, function (responseObj) {
      clientMethods.loggingIn(responseObj, EWD);
    });
  });

  // Handle enter and escape keys
  $(document).on('keydown', function (event) {
    // Set up Return key
    if (event.keyCode === 13) {
      $('#loginBtn').click();
    }
    // Set up Esc key
    if (event.keyCode === 27) {
      clientMethods.logout(EWD);
    }
  });

  // Focus on user name when form shows
  $('#modal-window').one('shown.bs.modal', function () {
    $('#username').focus();
  });

  // Finally, show form
  $('#loginBtn').show();
  $('#modal-window').modal('show');

  // Auto-fill if in development mode
  let messageObj = {
    service: 'ewd-vista',
    type: 'getMode'
  };
  EWD.send(messageObj, function (responseObj) {
    let mode = responseObj.message.mode;
    if (mode === 'development') {
      let messageObj = {
        service: 'ewd-vista',
        type: 'getFixtures',
        params: {
          module: 'ewd-vista-login'
        }
      };
      EWD.send(messageObj, function (responseObj) {
        let user = responseObj.message.fixtures.user;
        if (typeof user === 'undefined') return;
        if (user.accessCode && user.verifyCode) {
          $('#username').val(user.accessCode);
          $('#password').val(user.verifyCode);
          $('#loginBtn').click();
        }
      });
    }
  });

  // Load into message last so user's aren't required to wait for it
  messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: {
      rpcName: 'XUS INTRO MSG'
    }
  };

  EWD.send(messageObj, function (responseObj) {
    let arr = [];
    for (let i in responseObj.message.value) {
      arr.push(responseObj.message.value[i]);
    }
    $('#login-intro').html('<pre>' + arr.join('\n') + '</pre>');
  });
};

// This is what happens after we send the ac/vc to VISTA.
// responseObj contains the greeting or the error message.
// Invoked by click handler from log-in form above.
clientMethods.loggingIn = function (responseObj, EWD) {
  EWD.emit('loginStatus', responseObj);

  // Handle that we can't log in!
  if (responseObj.message.error) {
    toastr.options.target = '#modal-dialog';
    toastr.error(responseObj.message.error);

    return;
  }

  // Otherwise, say that we are good to go.
  toastr.options.allowHtml = true; // For multi-line post message
  let postSignInText = responseObj.message.postSignInText.replace(/\n/g, '<br />');
  let greeting = responseObj.message.greeting;
  let lastSignon = responseObj.message.lastSignon;

  if (postSignInText) toastr.success(postSignInText);
  toastr.success(greeting);
  toastr.info(lastSignon);

  // If user wants to change verify code, load that dialog,
  // and branch to it; or if Verify Code Change is required.
  if ($('#chkChangeVerify').is(':checked') || responseObj.message.cvc) {
    toastr.warning('Verify Code Must be Changed!');

    $('#modal-window').one('hidden.bs.modal', function () {
      let params = {
        service: 'ewd-vista-login',
        name: 'cvc.html',
        targetId: 'modal-window'
      };
      // Password is closured for its own protection.
      EWD.getFragment(params, function (oldPassword) {
        return function () {
          clientMethods.showCVC(oldPassword, EWD);
        };
      }($('#password').val()));
    });

    $('#modal-window').modal('hide');
  }
  // Otherwise (no change verify code), select division on hide event
  else {
      $('#modal-window').one('hidden.bs.modal', function () {
        clientMethods.selectDivision(EWD);
      });

      $('#modal-window').modal('hide');
    }
};

/* Show change verify code form */
/* You will think that I am crazy to implement the VISTA VC code logic
   here. Yes. I found that CVC^XUSRB kills DUZ if you send it the incorrect
   verify code change. So I had to take tons of precautions so that
   that won't happen. That includes doing all the verify code checking
   at the client side. */
clientMethods.showCVC = function (oldPassword, EWD) {
  // Unbind keydown and modal button event handlers
  $(document).off('keydown');
  $('#modal-window button').off();

  // Focus on user name when form shows
  $('#modal-window').one('shown.bs.modal', function () {
    $('#oldVC').val(oldPassword); // Put the old password here
    $('#oldVC').attr('disabled', true); // and disable the control
    $('#newVC1')[0].focus(); // focus on new verify code.
  });

  $('#modal-window').modal('show');

  // Change Verify Code event handling
  $('#cvcChangeBtn').on('click', function (e) {
    let oldVC = $('#oldVC').val();
    let newVC1 = $('#newVC1').val();
    let newVC2 = $('#newVC2').val();
    toastr.options.target = '#modal-window';
    if (newVC1 !== newVC2) {
      toastr.error('New Verify Codes don\'t match');
      return;
    }
    if (newVC1.length < 8) {
      toastr.error('Verify Code must be longer than 8 characters');
      return;
    }

    /* Thank you Stack Overflow for this! */
    let hasAlpha = /[A-Za-z]+/.test(newVC1),
        hasNumber = /[0-9]+/.test(newVC1),
        specials = /[^A-Za-z0-9]+/.test(newVC1);
    if (hasAlpha && hasNumber && specials) {
      console.log('Old verify code: ' + oldVC);
      clientMethods.doCVC(oldVC, newVC1, newVC2, EWD);
    } else {
      /* Message taken from XUSRB */
      toastr.error('Enter 8-20 characters any combination of alphanumeric-punctuation');
      return;
    }
  });

  // Cancel Change -- just log-out.
  $('#cvcCancelBtn').one('click', function (event) {
    $('#modal-window').modal('hide');
    clientMethods.logout(EWD);
  });

  // Handle enter and escape.
  $(document).on('keydown', function (event) {
    if (event.keyCode === 13) {
      $('#cvcChangeBtn').click();
    }
    if (event.keyCode === 27) {
      $('#cvcCancelBtn').click();
    }
  });
};

// Change verify code action. Called from form immediately above.
clientMethods.doCVC = function (oldVC, newVC1, newVC2, EWD) {
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'cvc',
    params: {
      oldVC: oldVC,
      newVC1: newVC1,
      newVC2: newVC2
    }
  };

  EWD.send(messageObj, function (responseObj) {
    clientMethods.CVCPost(responseObj, EWD);
  });
};

/* Verify code Change message from cvc call. Just say if we succceeded,
 * or log-out if we failed (we don't have any other choice b/c of the
 * dirty logic in XUSRB). */
clientMethods.CVCPost = function (responseObj, EWD) {
  if (responseObj.message.ok) {
    $('#modal-window').one('hidden.bs.modal', function () {
      clientMethods.selectDivision(EWD);
    });
    toastr.success('Verify Code changed');
  } else {
    $('#modal-window').one('hidden.bs.modal', function () {
      clientMethods.logout(EWD);
    });
    toastr.error(responseObj.message.error);
  }

  $('#modal-window').modal('hide');
};

// Modal pane to select division when loggin in.
// XUS DIVISION GET will set the division if there are zero or one divisions
// available for the user. We don't need to call XUS DIVISION SET to set the
// division. If there is more than one, supply user's choice to XUS DIVISON SET.
clientMethods.selectDivision = function (EWD) {
  // Unbind keydown and modal button event handlers
  $(document).off('keydown');
  $('#modal-window button').off();

  let messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: {
      rpcName: 'XUS DIVISION GET'
    }
  };

  EWD.send(messageObj, function (responseObj) {
    responseObj.message.value.splice(0, 1); // Remove array length element

    let divisions = [];
    responseObj.message.value.forEach(function (element, index, array) {
      element = element.split('^');

      let division = {};
      division.ien = element[0];
      division.name = element[1];
      division.code = element[2];
      division.default = element[3] == 1 ? true : false;

      divisions.push(division);
    });

    // We are done with selecting division if selectable list is 0. Move to next task.
    if (divisions.length == 0) {
      clientMethods.setContext(EWD);
    }
    // Ask a user to select a division.
    else if (divisions.length > 0) {
        let params = {
          service: 'ewd-vista-login',
          name: 'division.html',
          targetId: 'modal-window'
        };

        EWD.getFragment(params, function () {
          // Build division list; and mark default and enable OK if VISTA has a default assigned.
          let optionsHtml = '';
          divisions.forEach(function (element, index, array) {
            optionsHtml = optionsHtml + '<option value="' + element.ien + '"';
            if (element.default) {
              optionsHtml = optionsHtml + ' selected';
              $('#ok-button').removeAttr('disabled'); // Enable OK button
            }
            optionsHtml = optionsHtml + '>' + element.name + '  (' + element.code + ')' + '</option>';
          });

          // Populate select with options
          $('#division').append(optionsHtml);
          $('#division').change(function () {
            // if user selects an item, enable Ok button in case there is no default division
            $('#ok-button').removeAttr('disabled');
          });

          // Set up buttons
          $('#ok-button').one('click', function (e) {
            let ien = $('#division').val();

            $('#modal-window').one('hidden.bs.modal', function () {
              clientMethods.setDivision(ien, EWD);
            });

            $('#modal-window').modal('hide');
          });
          $('#cancel-button').one('click', function (e) {
            clientMethods.logout(EWD);
          });
          // Handle return and escape keys
          $(document).one('keydown', function (event) {
            // Set up Return key
            if (event.keyCode === 13) {
              $('#ok-button').click();
            }
            // Set up Esc key
            if (event.keyCode === 27) {
              $('#cancel-button').click();
            }
          });

          $('#modal-window').one('shown.bs.modal', function () {
            EWD.emit('setDivisionReady');
          });

          // Show divisions modal
          $('#modal-window .btn').show();
          $('#modal-window').modal('show');

          // Auto-click if in development mode
          let messageObj = {
            service: 'ewd-vista',
            type: 'getMode'
          };
          EWD.send(messageObj, function (responseObj) {
            let mode = responseObj.message.mode;
            if (mode === 'development') {
              $('#ok-button').click();
            }
          });
        });
      }
  }); // EWD.send
}; // VISTA.selectDivision

// Sets division if necessary. Called from selectDivision
clientMethods.setDivision = function (ien, EWD) {
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: {
      rpcName: 'XUS DIVISION SET',
      rpcArgs: [{
        type: 'LITERAL',
        value: '`' + ien
      }]
    }
  };
  // If setting the division fails, close the application
  EWD.send(messageObj, function (responseObj) {
    EWD.emit('setDivisionStatus', responseObj);

    if (responseObj.message.value != 1) {
      toastr.error('Failed to set division');
      clientMethods.logout(EWD);
    }

    clientMethods.setContext(EWD);
  });
};

/* Create Context Call -- Right now, hardcoded to OR CPRS GUI CHART */
/* TODO: Get rid of this. */
/* I will be getting rid of clientMethods as I want to get rid of setting
 * context on the client side. I want it dealt with transparently on the
 * server side. */
clientMethods.setContext = function (EWD) {
  $('#modal-window').modal('hide');

  let messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: {
      rpcName: 'XWB CREATE CONTEXT',
      rpcArgs: [{
        type: 'LITERAL',
        value: 'OR CPRS GUI CHART'
      }]
    }
  };

  // If we can't set the context, close the application
  EWD.send(messageObj, function (responseObj) {
    EWD.emit('setContextStatus', responseObj);

    if (responseObj.message.value != 1) {
      toastr.error(responseObj.message.value);
      clientMethods.logout(EWD);
    } else {
      clientMethods.showNav(EWD);
    }
  });
};

/* Log out functionality */
clientMethods.logout = function (EWD) {
  toastr.info('Logging Out!');

  params = {
    service: 'ewd-vista-login',
    type: 'logout'
  };
  EWD.send(params, function () {
    EWD.disconnectSocket();
    location.reload();
  });
};

/* ---------------- */
/* THIS IS THE FIRST NON-LOGIN RELATED FUNCTION */

/* Shows navbar and associates the logout button */
clientMethods.showNav = function (EWD) {
  $('#symbols-button').one('click', function () {
    clientMethods.showSymbolTable(EWD);
  });
  $('#logout-button').one('click', function () {
    clientMethods.logout(EWD);
  });

  clientMethods.showUserInfo(EWD);
};

// Get symbol table from server (Button on Navbar)
clientMethods.showSymbolTable = function (EWD) {
  // Unbind keydown and modal button event handlers
  $(document).off('keydown');
  $('#modal-window button').off();

  // Load into message last so user's aren't required to wait for it
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: { rpcName: 'ORWUX SYMTAB' }
  };

  EWD.send(messageObj, function (responseObj) {
    let symbolTable = responseObj.message.value;

    // Fix structure of symbol table object
    let jsonSymbolTable = {};
    let keys = Object.keys(symbolTable);
    for (let i = 0; i < keys.length; i = i + 2) {
      jsonSymbolTable[symbolTable[keys[i]]] = symbolTable[keys[i + 1]];
    }
    // Convert object to text
    let symbolTableHtml = JSON.stringify(jsonSymbolTable, null, 1);
    // Remove outer braces and whitespace
    symbolTableHtml = symbolTableHtml.slice(2, -1);
    /*
    Fix format based on what Mumps programmers will expect to see and hope for
    the absence of inconvenient patterns in variable values
    */
    symbolTableHtml = symbolTableHtml.replace(/^\s'/, '');
    symbolTableHtml = symbolTableHtml.replace(/.\n\s'/g, '\n\n');
    symbolTableHtml = symbolTableHtml.replace(/': /g, '=');
    symbolTableHtml = symbolTableHtml.replace(/\\'/g, '');

    let params = {
      service: 'ewd-vista-login',
      name: 'symbol-table.html',
      targetId: 'modal-window'
    };

    EWD.getFragment(params, function () {
      // Render symbol table
      $('#symbol-table').append(symbolTableHtml);

      $('#modal-window').on('hidden.bs.modal', function () {
        $('#symbols-button').one('click', function () {
          clientMethods.showSymbolTable(EWD);
        });
      });

      // Set up button to dismiss modal
      $('#ok-button').one('click', function () {
        $('#modal-window').modal('hide');
      });

      $(document).one('keydown', function (event) {
        if (event.keyCode === 13 || event.keyCode === 27) {
          $('#ok-button').click();
        }
      });

      $('#modal-window').one('shown.bs.modal', function () {
        EWD.emit('showSymbolTableStatus', responseObj);
      });

      // Show modal
      $('#modal-window .btn').show();
      $('#modal-window').modal('show');
    });
  });
};

// Get user info
clientMethods.showUserInfo = function (EWD) {
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'RPC',
    params: {
      rpcName: 'XUS GET USER INFO'
    }
  };
  EWD.send(messageObj, function (responseObj) {
    EWD.emit('showUserInfoStatus', responseObj);

    let info = responseObj.message.value;

    // Start loading modules
    clientMethods.loadModules(info[0], EWD);

    // List user name in nav
    $('#user-name').prepend(info[1]);
    // Build user info
    $('#user-duz').append(info[0]);
    $('#user-fullname').append(info[2]);
    $('#user-title').append(info[4]);
    $('#user-division').append(info[3].split('^')[1]);
    $('#user-service').append(info[5]);
    $('#user-language').append(info[6]);
    $('#user-dtime').append(info[7] + ' s');

    $('#navbar').removeClass('invisible');

    // Use DTIME to set session timeout
    clientMethods.setTimeout(info[7], EWD);

    // Create Keyboard shortcuts
    clientMethods.createKeyboardShortcuts(EWD);
  });
};

clientMethods.setTimeout = function (sessionTimeout, EWD) {
  let messageObj = {
    service: 'ewd-vista-login',
    type: 'setTimeout',
    params: {
      timeout: sessionTimeout
    }
  };
  EWD.send(messageObj, function (responseObj) {
    EWD.emit('setTimeoutStatus', responseObj);
  });
};

clientMethods.createKeyboardShortcuts = function (EWD) {
  // Bye bye keyboard listeners
  $(document).unbind('keydown');
  $(document).unbind('keypress');

  $(document).on('keypress', function (e) {
    // Bind Ctrl-Shift-L to logout
    if (e.ctrlKey && e.key == 'L') {
      e.preventDefault();clientMethods.logout(EWD);return;
    }

    // Bind User Information to Ctrl-'
    if (e.ctrlKey && e.key == '\'') {
      e.preventDefault();$('#navbar .nav #user-name').click();return;
    }
  });
};

// Sam sez: I think this is the most complex piece of code in Panorama
// There are several objectives I have in this code:
// - Late binding. Don't load the js and css until the user clicks.
//   That now works.
// - Early binding for services: Load services early. Right now, I am
//   hardcoding the location for Fileman. I don't like that. TODO
// - Avoid naming collisions. I am just getting started in JS, so I don't know,
//   how best to do that.
clientMethods.loadModules = function (duz, EWD) {
  // Dynamically load the other VistA modules for which the user has
  // correct security keys
  let messageObj = {
    service: 'ewd-vista',
    type: 'getAuthorizedModules'
  };

  EWD.send(messageObj, function (responseObj) {
    let modulesData = responseObj.message.modulesData;
    $.getScript('assets/javascripts/fileman.js', function () {
      fileman.defineWidgets(EWD);

      modulesData.forEach(function (element) {
        // Nothing to load for service modules
        if (element.service) return true;
        // Load client "module"
        // Add to menu -- will need to more elaborate when we have nested
        // modules. And attach prep function to click.
        //
        // Future readers: we try to use element.htmlName everywhere, EXCEPT
        // for element.clientModuleName for the main name of the javascript
        // object we need to invoke. The reason is that a valid html name isn't
        // necessarily a valid javascript identifier. E.g. taskman-monitor is
        // a valid html identifier, but javascript can't use that as an
        // identifier.
        $('#apps-menu .dropdown-menu').append('<li><a href="#" id="app-' + element.htmlName + '">' + element.name + '</a></li>');
        $('#app-' + element.htmlName).click(function (e) {
          $('head').append('<link rel="stylesheet" href="assets/stylesheets/' + element.htmlName + '.css">');
          $.getScript('assets/javascripts/' + element.htmlName + '.js', function () {
            vista.switchApp(element.htmlName);
            if (window[element.htmlName]) window[element.htmlName].prep(EWD);else if (window[element.clientModuleName]) window[element.clientModuleName].prep(EWD);else console.error('No click handler defined for menu');
          });
        });
      });
    });
  });
};

module.exports = clientMethods;

},{}],2:[function(require,module,exports){
// EWD requirements
const EWD = require('ewd-client').EWD;
// Uncomment this line for testing with Mocha
// var EWD   = require('ewd-client').EWD;
//const io  = require('socket.io-client');

// M functions added to String prototype
require('../lib/mFunctions.js');

// Uncomment this line in production
// toastr.options.preventDuplicates = true;

// VistA utilities
vista = {
  horologToExternal: function (horoTimeStamp) {
    let horoZero = -4070880000000;
    let horoDays = horoTimeStamp.split(',')[0];
    let horoSecs = horoTimeStamp.split(',')[1];

    let epochTime = horoZero;
    epochTime = epochTime + horoDays * 86400 * 1000;
    epochTime = epochTime + horoSecs * 1000;

    return new Date(epochTime);
  },
  switchApp: function (applicationName) {
    // Clear the page
    $('#main-content').empty();
    // Clear the nav
    $('#options-menu').addClass('invisible');
    $('#options-name').text('');
    $('#options-menu .dropdown-menu').html('');

    let params = {
      service: 'ewd-vista',
      type: 'switchApp',
      params: { applicationName: applicationName || '' }
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
$(document).ready(function () {
  /* .on needs to come first so that we know what we need
     to do after we start. Otherwise, maybe race condition */
  EWD.on('ewd-registered', function () {
    EWD.log = true;
    console.log('**** Got the ewd-register event!!');

    EWD.on('socketDisconnected', function () {
      //location.reload();
    });

    // This is good for testing, but I don't want it normally.
    EWD.on('error', function (responseObj) {
      // automatically display all returned errors using toastr
      var error = responseObj.message.error || responseObj.message;
      toastr.error(error);
    });

    // Initiate login procedure
    login.preLogin1(EWD);
  });

  EWD.start('ewd-vista', $, io);
});

},{"../lib/mFunctions.js":3,"ewd-client":4,"ewd-vista-login/client/vista-login":1}],3:[function(require,module,exports){
// In honor of VistA developers

// $Piece function
String.prototype.piece = function (num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter = '^';
  return this.split(delimiter)[num - 1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

// This is for NodeM as it can return single pieces not as strings but numbers.
// E.g. One result is "3^2" (two pieces) - a string.
// Another is "3^" - (two pieces) - a string.
// Another is "3" - (one piece) - a number, with which we still want $piece.
Number.prototype.piece = function (num, delimiter) {
  if (num === 1) return this;else return '';
};
Number.prototype.$p = Number.prototype.piece;
Number.prototype.$P = Number.prototype.piece;

// Timson to JS Date conversion
// TODO: Unit Tests for this
Number.prototype.dateFromTimson = function () {
  var s = this.toString();
  var fmyear = +s.substring(0, 3);
  var month = +s.substring(3, 5);
  var day = +s.substring(5, 7);
  if (isNaN(fmyear) || isNaN(month) || isNaN(day)) throw new Error('Fileman date is invalid is inexact');
  var dot = s.substring(7, 8);
  var hour, min, sec;
  if (dot === '.') {
    hour = +s.substring(8, 10) || 0;
    min = +s.substring(10, 12) || 0;
    sec = +s.substring(12, 14) || 0;
  }
  var realYear = fmyear + 1700;
  if (hour || min || sec) return new Date(realYear, month, day, hour, min, sec);else return new Date(realYear, month, day);
};

// JS Date to Timson conversion
// TODO: Unit Tests for this
Date.prototype.toTimsonDate = function () {
  var year = this.getFullYear();
  var month = this.getMonth() + 1; // JS Date has months from 0 to 11, not 1 to 12
  var day = this.getDate();
  var hours = this.getHours();
  var min = this.getMinutes();
  var sec = this.getSeconds();

  var fmYear = year - 1700;

  var fmDateString = fmYear.toString() + month.toString() + day.toString() + '.' + hours.toString() + min.toString() + sec.toString();

  var fmDateNumber = +fmDateString;

  return fmDateNumber;
};

},{}],4:[function(require,module,exports){
/*!

 ----------------------------------------------------------------------------
 | ewd-client: Browser (websocket & HTTP) Client for ewd-xpress applications |
 |                                                                           |
 | Copyright (c) 2016 M/Gateway Developments Ltd,                            |
 | Reigate, Surrey UK.                                                       |
 | All rights reserved.                                                      |
 |                                                                           |
 | http://www.mgateway.com                                                   |
 | Email: rtweed@mgateway.com                                                |
 |                                                                           |
 |                                                                           |
 | Licensed under the Apache License, Version 2.0 (the "License");           |
 | you may not use this file except in compliance with the License.          |
 | You may obtain a copy of the License at                                   |
 |                                                                           |
 |     http://www.apache.org/licenses/LICENSE-2.0                            |
 |                                                                           |
 | Unless required by applicable law or agreed to in writing, software       |
 | distributed under the License is distributed on an "AS IS" BASIS,         |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  |
 | See the License for the specific language governing permissions and       |
 |  limitations under the License.                                           |
 ----------------------------------------------------------------------------

 */

'use strict';

module.exports = require('./lib/ewd');
},{"./lib/ewd":5}],5:[function(require,module,exports){
/*

 ----------------------------------------------------------------------------
 | ewd-client: Browser (websocket & HTTP) Client for ewd-xpress applications |
 |                                                                           |
 | Copyright (c) 2016 M/Gateway Developments Ltd,                            |
 | Reigate, Surrey UK.                                                       |
 | All rights reserved.                                                      |
 |                                                                           |
 | http://www.mgateway.com                                                   |
 | Email: rtweed@mgateway.com                                                |
 |                                                                           |
 |                                                                           |
 | Licensed under the Apache License, Version 2.0 (the "License");           |
 | you may not use this file except in compliance with the License.          |
 | You may obtain a copy of the License at                                   |
 |                                                                           |
 |     http://www.apache.org/licenses/LICENSE-2.0                            |
 |                                                                           |
 | Unless required by applicable law or agreed to in writing, software       |
 | distributed under the License is distributed on an "AS IS" BASIS,         |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  |
 | See the License for the specific language governing permissions and       |
 |  limitations under the License.                                           |
 ----------------------------------------------------------------------------

*/

module.exports = {
  EWD: require('./proto/ewd-client')
};
},{"./proto/ewd-client":6}],6:[function(require,module,exports){
/*!

 ----------------------------------------------------------------------------
 | ewd-client: Browser (websocket & HTTP) Client for QEWD applications       |
 |                                                                           |
 | Copyright (c) 2016-17 M/Gateway Developments Ltd,                         |
 | Reigate, Surrey UK.                                                       |
 | All rights reserved.                                                      |
 |                                                                           |
 | http://www.mgateway.com                                                   |
 | Email: rtweed@mgateway.com                                                |
 |                                                                           |
 |                                                                           |
 | Licensed under the Apache License, Version 2.0 (the "License");           |
 | you may not use this file except in compliance with the License.          |
 | You may obtain a copy of the License at                                   |
 |                                                                           |
 |     http://www.apache.org/licenses/LICENSE-2.0                            |
 |                                                                           |
 | Unless required by applicable law or agreed to in writing, software       |
 | distributed under the License is distributed on an "AS IS" BASIS,         |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  |
 | See the License for the specific language governing permissions and       |
 |  limitations under the License.                                           |
 ----------------------------------------------------------------------------

 11 May 2017

  Thanks to Ward DeBacker for enhancements to the client functionality
  Thanks to Sam Habiel for fix to emitter.off bug

 */

var EWD;

(function() {
  var events = {};

  var emitter = {
    on: function(type, callback, deleteWhenFinished) {
      if (!events[type]) events[type] = [];
      events[type].push({
        callback: callback,
        deleteWhenFinished: deleteWhenFinished
      });
    },
    off: function(type, callback) {
      var event = events[type];
      if (typeof callback === 'function') {
        if (event) {
          for (var i = 0; i < event.length; i++) {
            if (event[i].callback === callback) {
              event.splice(i,1);
            }
          }
        }
      }
      else {
        event = [];
      }
      events[type] = event;
    },
    emit: function(type, data) {
      var ev = events[type];
      if (!ev || ev.length < 1) return;
      data = data || {};
      for (var i = 0; i < ev.length; i++) {
        var e = ev[i];
        e.callback(data);
        if (e.deleteWhenFinished && data.finished) ev.splice(i,1);
      }
    }
  };

  var start = function(application, $, io, customAjaxFn, url) {

    //console.log('starting ewd-client: ' + JSON.stringify(application));

    var url;
    var cookieName = 'ewdSession';
    var appName = application;
    if (typeof application === 'object') {
      $ = application.$;
      io = application.io;
      customAjaxFn = application.ajax;
      url = application.url;
      appName = application.application;
      cookieName = application.cookieName;
    }

    function getCookie(name) {
      var value = "; " + document.cookie;
      var parts = value.split("; " + name + "=");
      if (parts.length == 2) return parts.pop().split(";").shift();
    }

    (function(application, io, customAjaxFn, url) {

      //console.log('application = ' + application);
      //console.log('customAjaxFn = ' + typeof customAjaxFn);

      var token;
    
      EWD.application = application;

      function registerEvent(messageObj, callback) {
        var cb = callback;
        var type = messageObj.type;
        if (type === 'ewd-fragment') {
          type = type + ':' + messageObj.params.file;
          var targetId = messageObj.params.targetId;
          var fragmentName = messageObj.params.file;
          cb = function(responseObj) {
            if (typeof $ !== 'undefined') $('#' + targetId).html(responseObj.message.content);
            callback(fragmentName);
          }
          delete messageObj.params.targetId;
        }
        EWD.on(type, cb, true);
      }

      function handleResponse(messageObj) {
        // messages received back from Node.js

        //if (EWD.log && messageObj.type !== 'ewd-register') console.log('raw received: ' + JSON.stringify(messageObj));
        if (messageObj.message && messageObj.message.error && messageObj.message.disconnect) {
          if (typeof socket !== 'undefined') {
            socket.disconnect();
            console.log('Socket disconnected');
          }
          EWD.send = function() {};
          EWD.emit = function() {};
          console.log(messageObj.message.error);
          return;
        }
        if (messageObj.type === 'ewd-register') {
          token = messageObj.message.token;

          EWD.setCookie = function(name) {
            name = name || 'ewd-token';
            document.cookie = name + "=" + token;
          };

          console.log(application + ' registered');
          EWD.emit('ewd-registered');
          return;
        }
        if (messageObj.type === 'ewd-reregister') {
          console.log('Re-registered');
          EWD.emit('ewd-reregistered');
          return;
        }
        if (EWD.log) console.log('received: ' + JSON.stringify(messageObj));

        if (messageObj.type === 'ewd-fragment') {
           if (messageObj.message.error) {
             EWD.emit('error', messageObj);
             return;
           }
           EWD.emit('ewd-fragment:' + messageObj.message.fragmentName, messageObj);
           return;
        }

        if (messageObj.message && messageObj.message.error) {
          var ok = EWD.emit('error', messageObj);
          if (ok) return;
        }

        EWD.emit(messageObj.type, messageObj);
      };

      function ajax(messageObj, callback) {
          if (callback) {
            registerEvent(messageObj, callback);
          }
          if (token) {
            messageObj.token = token;
          }
          if (token || messageObj.type === 'ewd-register') {
            messageObj.token = token;
            console.log('Ajax send: ' + JSON.stringify(messageObj));
            (function(type) {

              function success(data) {
                console.log('Ajax response for type ' + type + ': ' + JSON.stringify(data));
                if (data.ewd_response !== false) {
                  handleResponse({
                    type: type,
                    message: data,
                    finished: true
                  });
                }
              }

              function fail(error) {
                console.log('Error occurred: ' + error);
                var messageObj = {
                  message: {error: error}
                };
                EWD.emit('error', messageObj);
              }

              var params = {
                //url: '/ajax',
                url: (url ? url : '') + '/ajax',
                type: 'post',
                contentType: 'application/json',
                data: messageObj,
                dataType: 'json',
                timeout: 10000
              };

              if (customAjaxFn) {
                customAjaxFn(params, success, fail);
              }
              else if (typeof $ !== 'undefined') {
                $.ajax({
                  url: params.url,
                  type: params.type,
                  contentType: params.contentType,
                  data: JSON.stringify(params.data),
                  dataType: params.dataType,
                  timeout: params.timeout
                })
                .done(function(data) {
                  success(data);
                })
                .error(function(err) {
                  var error = err.responseJSON.error;
                  fail(error);
                });
              }
              else {
                console.log('Error: No Ajax handler function is available');
              }
            }(messageObj.type));
            delete messageObj.token;
            if (EWD.log) console.log('sent: ' + JSON.stringify(messageObj));
          }
      };

      EWD.send = function(messageObj, callback) {
        if (messageObj.ajax) {
          ajax(messageObj, callback);
          return;
        }
        if (callback) {
          registerEvent(messageObj, callback);
        }
        if (token) {
          messageObj.token = token;
          socket.emit('ewdjs', messageObj);
          delete messageObj.token;
          if (EWD.log) console.log('sent: ' + JSON.stringify(messageObj));
        }
      };

      EWD.getFragment = function(params, callback) {
        EWD.send({
          type: 'ewd-fragment',
          service: params.service || false,
          params: {
            file: params.name,
            targetId: params.targetId
          }
        }, callback);
      };

      if (io) {
        var socket;
        if (url) {
          socket = io(url, {
            transports: ['websocket'] // needed for react-native
          });
        }
        else {
          socket = io.connect();
        }
        socket.on('connect', function() {

          EWD.disconnectSocket = function() {
            socket.disconnect();
            console.log('EWD disconnected socket');
          };

          //console.log('token: ' + token + '; ' + cookieName + ' cookie: ' + getCookie(cookieName)); 

          if (!token && cookieName && getCookie(cookieName)) token = getCookie(cookieName);

          if (token) {
            // re-connection occured - re-register to attach to original Session
            var message = {
              type: 'ewd-reregister',
              token: token
            };
          }
          else {
            var message = {
              type: 'ewd-register',
              application: application
            };
          }
          socket.emit('ewdjs', message);
        }); 

        socket.on('ewdjs', handleResponse);

        socket.on('disconnect', function() {
          console.log('*** server has disconnected socket, probably because it shut down');
          EWD.emit('socketDisconnected');
        });

      }
      else {
        EWD.send = ajax;
        EWD.send({
          type: 'ewd-register',
          application: application
        });
      }

    })(appName, io, customAjaxFn, url);

    EWD.start = function() {};
    io = null;
    customAjaxFn = null;
  }

  var ewd = function() {
    this.application = 'undefined';
    this.log = false;
  };

  var proto = ewd.prototype;
  proto.on = emitter.on;
  proto.off = emitter.off;
  proto.emit = emitter.emit;
  proto.start = start;

  EWD = new ewd();
})();

if (typeof module !== 'undefined') module.exports = EWD;

},{}]},{},[2]);
