// In honor of VistA developers
String.prototype.piece = function(num, delimiter) {
  if (typeof delimiter === 'undefined') delimiter='^';
  return this.split(delimiter)[num-1];
};
String.prototype.$p = String.prototype.piece;
String.prototype.$P = String.prototype.piece;

