// In honor of VistA developers

// $Piece function
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

// This is for NodeM as it can return single pieces not as strings but numbers.
// E.g. One result is "3^2" (two pieces) - a string.
// Another is "3^" - (two pieces) - a string.
// Another is "3" - (one piece) - a number, with which we still want $piece.
Number.prototype.piece = function(num, delimiter) {
  if (num === 1) return this;
  else return '';
};
Number.prototype.$p = Number.prototype.piece;
Number.prototype.$P = Number.prototype.piece;

// Timson to JS Date conversion
// TODO: Unit Tests for this
Number.prototype.dateFromTimson = function() {
  var s = this.toString();
  var fmyear = +s.substring(0,3);
  var month = +s.substring(3,5);
  var day = +s.substring(5,7);
  if (isNaN(fmyear) || isNaN(month) || isNaN(day)) throw new Error('Fileman date is invalid is inexact');
  var dot = s.substring(7,8);
  var hour,min,sec;
  if (dot === '.') {
    hour = +s.substring(8,10) || 0;
    min  = +s.substring(10,12) || 0;
    sec  = +s.substring(12,14) || 0;
  }
  var realYear = fmyear + 1700;
  if (hour || min || sec) return new Date(realYear, month, day, hour, min, sec);
  else return new Date(realYear, month, day);
};

// JS Date to Timson conversion
// TODO: Unit Tests for this
Date.prototype.toTimsonDate = function() {
  var year = this.getFullYear();
  var month = this.getMonth() + 1; // JS Date has months from 0 to 11, not 1 to 12
  var day = this.getDate();
  var hours = this.getHours();
  var min   = this.getMinutes();
  var sec   = this.getSeconds();

  var fmYear = year - 1700;

  var fmDateString = fmYear.toString() + month.toString() + day.toString() +
                     '.' + hours.toString() + min.toString() + sec.toString();

  var fmDateNumber = +fmDateString;

  return fmDateNumber;
};
