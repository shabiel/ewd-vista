// In honor of VistA developers

// $Piece function
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

Number.prototype.piece = function(num, delimiter) {
  return this;
};
Number.prototype.$p = Number.prototype.piece;
Number.prototype.$P = Number.prototype.piece;

// Timson to JS Date conversion
Number.prototype.dateFromTimson = function() {
  var s = this.toString();
  var year = parseInt(s.substring(0,3));
  var month = parseInt(s.substring(3,5));
  var day = parseInt(s.substring(5,7));
  if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error('Fileman date is invalid is inexact');
  var dot = s.substring(7);
  var hour,min,sec;
  if (dot === '.') {
    hour = parseInt(s.substring(8,10)) || 0;
    min  = parseInt(s.substring(10,12)) || 0;
    sec  = parseInt(s.substring(12,14)) || 0;
  }
  if (hour || min || sec) return new Date(year + 1700, month, day, hour, min, sec);
  else return new Date(year, month, day);
};
