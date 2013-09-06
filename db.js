var level      = require('level');
var sublevel   = require('level-sublevel');
var db         = sublevel(level('db', {valueEncoding: 'json'}));

exports.root        = db;
exports.results     = db.sublevel('results');
exports.runs        = db.sublevel('runs');
exports.runsSorted  = db.sublevel('runssorted');
exports.sep         = '\xff';