var sep = require('./db').sep;

module.exports = key;

function key(v) {
  return v.join(sep);
}